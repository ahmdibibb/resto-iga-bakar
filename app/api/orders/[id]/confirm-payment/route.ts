import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { orderEventEmitter } from '@/lib/orderEvents'
import { 
  handleApiError, 
  NotFoundError, 
  AuthenticationError, 
  AuthorizationError,
  PaymentValidationError 
} from '@/lib/errorHandler'

/**
 * PATCH /api/orders/[id]/confirm-payment
 * Confirm payment for an order
 * - QRIS: Customer can confirm (public endpoint)
 * - CASH: Only Kasir can confirm (protected endpoint)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true
      }
    })

    if (!order) {
      throw new NotFoundError('Order', id)
    }

    // For CASH payment, require Kasir authentication
    if (order.payment_method === 'CASH') {
      const token = request.cookies.get('token')?.value
      if (!token) {
        throw new AuthenticationError()
      }

      const user = await getCurrentUser(token)
      if (!user || (user.role !== 'KASIR' && user.role !== 'ADMIN')) {
        throw new AuthorizationError()
      }

      // For CASH: Update to COMPLETED and PAID (simplified flow)
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          payment_status: 'PAID'
        }
      })

      // Update payment record if exists
      if (order.payment_method) {
        await prisma.payment.updateMany({
          where: { orderId: id },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        })
      }

      // Emit event for real-time cashier dashboard
      orderEventEmitter.emit('orderUpdate', { id: updatedOrder.id, status: updatedOrder.status, payment_status: updatedOrder.payment_status })

      return NextResponse.json({
        id: updatedOrder.id,
        status: updatedOrder.status,
        payment_status: updatedOrder.payment_status,
        message: 'Cash payment confirmed successfully'
      })
    }

    // For QRIS payment, check Midtrans status instead of directly confirming
    if (order.payment_method === 'QRIS') {
      // Find the payment record to get the gateway order id
      const payment = await prisma.payment.findUnique({
        where: { orderId: id },
      })

      if (payment?.transactionId) {
        try {
          const { getTransactionStatus, mapMidtransStatus } = await import('@/lib/midtrans')
          const txStatus = await getTransactionStatus(payment.transactionId)
          const internalStatus = mapMidtransStatus(txStatus.transaction_status, txStatus.fraud_status)

          if (internalStatus === 'PAID' && payment.status !== 'PAID') {
            const targetStatus = order.channel === 'PREORDER' ? 'CONFIRMED' : 'COMPLETED'

            await prisma.$transaction([
              prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'PAID', paidAt: new Date() },
              }),
              prisma.order.update({
                where: { id },
                data: { status: targetStatus, payment_status: 'PAID' },
              }),
            ])

            orderEventEmitter.emit('orderUpdate', { id, status: targetStatus, payment_status: 'PAID' })

            return NextResponse.json({
              id,
              status: targetStatus,
              payment_status: 'PAID',
              message: 'QRIS payment confirmed via Midtrans'
            })
          }
        } catch (error) {
          console.error('[CONFIRM_PAYMENT] Failed to check Midtrans status:', error instanceof Error ? error.message : error)
        }
      }

      // Return current order status (payment not yet confirmed by Midtrans)
      return NextResponse.json({
        id: order.id,
        status: order.status,
        payment_status: order.payment_status,
        message: 'Payment status checked. Waiting for Midtrans confirmation.'
      })
    }

    // For other payment methods or no payment method
    throw new PaymentValidationError('Invalid payment method for confirmation')
  } catch (error) {
    return handleApiError(error)
  }
}
