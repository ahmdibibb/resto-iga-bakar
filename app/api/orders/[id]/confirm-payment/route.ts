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

    // For QRIS payment, allow customer to confirm (no auth required)
    if (order.payment_method === 'QRIS') {
      // For PREORDER: set status to CONFIRMED (waiting for kitchen/ready). Otherwise COMPLETED.
      const targetStatus = order.channel === 'PREORDER' ? 'CONFIRMED' : 'COMPLETED'
      
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: targetStatus,
          payment_status: 'PAID'
        }
      })

      // Update payment record
      await prisma.payment.updateMany({
        where: { orderId: id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })

      // Emit event for real-time cashier dashboard
      orderEventEmitter.emit('orderUpdate', { id: updatedOrder.id, status: updatedOrder.status, payment_status: updatedOrder.payment_status })

      return NextResponse.json({
        id: updatedOrder.id,
        status: updatedOrder.status,
        payment_status: updatedOrder.payment_status,
        message: 'QRIS payment confirmed successfully'
      })
    }

    // For other payment methods or no payment method
    throw new PaymentValidationError('Invalid payment method for confirmation')
  } catch (error) {
    return handleApiError(error)
  }
}
