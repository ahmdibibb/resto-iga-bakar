import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyNotificationSignature,
  getTransactionStatus,
  mapMidtransStatus,
  type MidtransNotificationPayload,
} from '@/lib/midtrans'
import { orderEventEmitter } from '@/lib/orderEvents'

export const runtime = 'nodejs'

/**
 * POST /api/payments/midtrans/notification
 *
 * Receives HTTP notification from Midtrans.
 * 1. Parse JSON body
 * 2. Validate required fields
 * 3. Verify signature_key
 * 4. Get Transaction Status from Midtrans as secondary verification
 * 5. Find order by gateway order id
 * 6. Validate gross_amount matches database
 * 7. Map Midtrans status → internal status
 * 8. Idempotent update (never regress PAID → PENDING/FAILED)
 * 9. Run post-payment logic only once
 * 10. Return 200 OK
 */
export async function POST(request: NextRequest) {
  let body: MidtransNotificationPayload

  try {
    body = (await request.json()) as MidtransNotificationPayload
  } catch {
    console.error('[MIDTRANS_NOTIFICATION] Invalid JSON body')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── 1. Validate required fields ──────────────────────────────────────

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
    transaction_id,
  } = body

  if (!order_id || !status_code || !gross_amount || !signature_key) {
    console.error('[MIDTRANS_NOTIFICATION] Missing required fields')
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // ── 2. Verify signature ──────────────────────────────────────────────

  const isValidSignature = verifyNotificationSignature(
    order_id,
    status_code,
    gross_amount,
    signature_key
  )

  if (!isValidSignature) {
    console.error(`[MIDTRANS_INVALID_SIGNATURE] order_id=${order_id}`)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 403 }
    )
  }

  // ── 3. Get Transaction Status from Midtrans (secondary verification) ─

  let verifiedStatus: string
  let verifiedFraudStatus: string | undefined
  let verifiedGrossAmount: string

  try {
    const txStatus = await getTransactionStatus(order_id)
    verifiedStatus = txStatus.transaction_status
    verifiedFraudStatus = txStatus.fraud_status
    verifiedGrossAmount = txStatus.gross_amount
  } catch (error) {
    console.error(
      `[MIDTRANS_NOTIFICATION] Failed to verify transaction status for ${order_id}:`,
      error instanceof Error ? error.message : error
    )
    // Return 500 so Midtrans retries the notification
    return NextResponse.json(
      { error: 'Failed to verify transaction status' },
      { status: 500 }
    )
  }

  // ── 4. Find order by gateway order id ────────────────────────────────

  // Gateway order id format: PAY-{orderId}-{timestamp}
  // Extract the internal orderId between first and last '-'
  const match = order_id.match(/^PAY-(.+)-\d+$/)
  const internalOrderId = match ? match[1] : null

  if (!internalOrderId) {
    console.error(
      `[MIDTRANS_NOTIFICATION] Cannot extract internal order id from ${order_id}`
    )
    // Return 200 to prevent Midtrans from retrying — this is not our order
    return NextResponse.json({ status: 'ignored' })
  }

  const payment = await prisma.payment.findFirst({
    where: {
      transactionId: order_id,
    },
    include: {
      order: true,
    },
  })

  if (!payment) {
    console.error(
      `[MIDTRANS_NOTIFICATION] Payment not found for gateway order ${order_id}`
    )
    // Return 200 — possibly a duplicate or out-of-order notification
    return NextResponse.json({ status: 'not_found' })
  }

  // ── 5. Validate amount ───────────────────────────────────────────────

  const dbAmount = payment.amount.toNumber()
  const midtransAmount = parseFloat(verifiedGrossAmount)

  if (Math.abs(dbAmount - midtransAmount) > 0.01) {
    console.error(
      `[MIDTRANS_AMOUNT_MISMATCH] order_id=${order_id} db=${dbAmount} midtrans=${midtransAmount}`
    )
    return NextResponse.json(
      { error: 'Amount mismatch' },
      { status: 400 }
    )
  }

  // ── 6. Map status ────────────────────────────────────────────────────

  const internalStatus = mapMidtransStatus(verifiedStatus, verifiedFraudStatus)

  console.log(
    `[MIDTRANS_NOTIFICATION] order_id=${order_id} midtrans_status=${verifiedStatus} ` +
      `fraud=${verifiedFraudStatus ?? 'n/a'} → internal=${internalStatus}`
  )

  // ── 7. Idempotent update — never regress PAID ────────────────────────

  const currentPaymentStatus = payment.status

  // Do not regress PAID
  if (currentPaymentStatus === 'PAID') {
    console.log(
      `[MIDTRANS_NOTIFICATION] Payment already PAID for ${order_id}, skipping`
    )
    return NextResponse.json({ status: 'already_processed' })
  }

  // Only proceed if the new status is different
  if (internalStatus === currentPaymentStatus) {
    console.log(
      `[MIDTRANS_NOTIFICATION] Status unchanged (${internalStatus}) for ${order_id}`
    )
    return NextResponse.json({ status: 'no_change' })
  }

  // ── 8. Update payment and order ──────────────────────────────────────

  const now = new Date()
  const order = payment.order

  if (internalStatus === 'PAID') {
    // Determine target order status
    const targetOrderStatus =
      order.channel === 'PREORDER' ? 'CONFIRMED' : 'COMPLETED'

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: now,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: targetOrderStatus,
          payment_status: 'PAID',
        },
      }),
    ])

    // Emit event for real-time cashier dashboard
    orderEventEmitter.emit('orderUpdate', {
      id: order.id,
      status: targetOrderStatus,
      payment_status: 'PAID',
    })

    console.log(
      `[MIDTRANS_NOTIFICATION] Order ${order.id} marked as PAID, status → ${targetOrderStatus}`
    )
  } else if (internalStatus === 'FAILED') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          payment_status: 'FAILED',
        },
      }),
    ])

    // Release table if applicable
    if (order.table_id) {
      await prisma.table.update({
        where: { id: order.table_id },
        data: { status: 'AVAILABLE' },
      })
      console.log(
        `[MIDTRANS_NOTIFICATION] Table ${order.table_id} set to AVAILABLE`
      )
    }

    orderEventEmitter.emit('orderUpdate', {
      id: order.id,
      status: 'CANCELLED',
      payment_status: 'FAILED',
    })

    console.log(
      `[MIDTRANS_NOTIFICATION] Order ${order.id} marked as FAILED/CANCELLED`
    )
  } else if (internalStatus === 'PENDING') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PENDING',
      },
    })
  }

  return NextResponse.json({ status: 'ok' })
}
