import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { 
  handleApiError, 
  AuthenticationError, 
  AuthorizationError,
  OrderValidationError,
  NotFoundError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'

/**
 * PATCH /api/orders/[id]/status
 * Update order status (e.g., IN_KITCHEN → READY)
 * Protected: KASIR or ADMIN only - OWNER blocked
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permissions - OWNER cannot update order status
    const { response, user } = await withApiPermission(request, {
      allowedRoles: ['KASIR', 'ADMIN'],
      requireWrite: true,
      resource: 'ORDER'
    })

    if (response) return response
    if (!user) throw new AuthenticationError()

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      throw new OrderValidationError('Status is required', 'status')
    }

    // Validate status value
    const validStatuses = ['PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'PREPARING', 'IN_KITCHEN', 'READY', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      throw new OrderValidationError('Invalid status value', 'status')
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id }
    })

    if (!order) {
      throw new NotFoundError('Order', id)
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: status
      }
    })

    return NextResponse.json({
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
      message: `Order status updated to ${status}`
    })
  } catch (error) {
    return handleApiError(error)
  }
}
