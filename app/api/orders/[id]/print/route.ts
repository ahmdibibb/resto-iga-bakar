import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { orderEventEmitter } from '@/lib/orderEvents'
import { 
  handleApiError, 
  NotFoundError, 
  AuthenticationError, 
  AuthorizationError 
} from '@/lib/errorHandler'

/**
 * PATCH /api/orders/[id]/print
 * Mark order as printed by kasir
 * Protected: KASIR or ADMIN only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      throw new AuthenticationError()
    }

    const user = await getCurrentUser(token)
    if (!user || (user.role !== 'KASIR' && user.role !== 'ADMIN')) {
      throw new AuthorizationError()
    }

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id }
    })

    if (!order) {
      throw new NotFoundError('Order', id)
    }

    // Mark as printed. For PREORDER, set status to PREPARING. Otherwise COMPLETED.
    const targetStatus = order.channel === 'PREORDER' ? 'PREPARING' : 'COMPLETED'

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        printedAt: new Date(),
        status: targetStatus
      }
    })

    // Emit event for real-time cashier dashboard
    orderEventEmitter.emit('orderUpdate', { id: updatedOrder.id, status: updatedOrder.status })

    return NextResponse.json({
      id: updatedOrder.id,
      printedAt: updatedOrder.printedAt,
      status: updatedOrder.status,
      message: 'Order marked as printed successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
