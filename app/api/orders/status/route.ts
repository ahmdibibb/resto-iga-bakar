import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError, OrderValidationError, NotFoundError } from '@/lib/errorHandler'

// Rate-limit cache: prevents checking Midtrans API on every poll (only every 5s per order)
const midtransCheckCache = new Map<string, number>()

/**
 * GET /api/orders/status?session_id={session_id}
 * Get order status by session_id for anonymous customers
 * Public endpoint (no authentication required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const session_id = searchParams.get('session_id')

    if (!session_id) {
      throw new OrderValidationError('Session ID is required', 'session_id')
    }

    // Find order by session_id
    const order = await prisma.order.findFirst({
      where: {
        session_id: session_id
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true
              }
            }
          }
        },
        table: {
          select: {
            id: true,
            name: true
          }
        },
        payment: {
          select: {
            id: true,
            method: true,
            status: true,
            qris_string: true,
            expires_at: true,
            paidAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!order) {
      throw new NotFoundError('Order', session_id)
    }

    // --- REAL-TIME MIDTRANS CHECK FOR LOCALHOST/WEBHOOK FALLBACK ---
    // Rate-limit: only check Midtrans API every 5s per order to avoid hammering
    if (order.payment_method === 'QRIS' && (order.payment_status === 'PENDING' || order.payment_status === 'UNPAID')) {
      const cacheKey = `midtrans_check_${order.id}`
      const now = Date.now()
      const lastCheck = midtransCheckCache.get(cacheKey) || 0

      if (now - lastCheck >= 5000) {
        midtransCheckCache.set(cacheKey, now)
        try {
          const paymentRecord = await prisma.payment.findFirst({ where: { orderId: order.id } })
          if (paymentRecord?.transactionId) {
            const { getTransactionStatus, mapMidtransStatus } = await import('@/lib/midtrans')
            const txStatus = await getTransactionStatus(paymentRecord.transactionId)
            const internalStatus = mapMidtransStatus(txStatus.transaction_status, txStatus.fraud_status)
            
            if (internalStatus === 'PAID') {
              const targetStatus = order.channel === 'PREORDER' ? 'CONFIRMED' : 'COMPLETED'
              await prisma.$transaction([
                prisma.payment.update({ where: { id: paymentRecord.id }, data: { status: 'PAID', paidAt: new Date() } }),
                prisma.order.update({ where: { id: order.id }, data: { status: targetStatus, payment_status: 'PAID' } })
              ])
              order.status = targetStatus as any
              order.payment_status = 'PAID'
              if (order.payment) order.payment.status = 'PAID'
              
              // Clean up cache entry
              midtransCheckCache.delete(cacheKey)
              
              const { orderEventEmitter } = await import('@/lib/orderEvents')
              orderEventEmitter.emit('orderUpdate', { id: order.id, status: targetStatus, payment_status: 'PAID' })
            }
          }
        } catch (error) {
          console.error('[STATUS_POLLING] Midtrans check failed, falling back to DB:', error)
        }
      }
    }
    // -------------------------------------------------------------

    // Convert Decimal to number for frontend
    const orderResponse = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      totalAmount: order.totalAmount.toNumber(),
      orderType: order.orderType,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      channel: order.channel,
      pickupTime: order.pickupTime,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price.toNumber(),
        subtotal: item.subtotal.toNumber(),
        product: {
          ...item.product,
          price: item.product.price.toNumber()
        }
      })),
      table: order.table,
      payment: order.payment ? {
        ...order.payment,
        qris_string: order.payment.qris_string,
        expires_at: order.payment.expires_at
      } : null
    }

    return NextResponse.json(orderResponse)
  } catch (error) {
    return handleApiError(error)
  }
}
