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
import { orderEventEmitter } from '@/lib/orderEvents'
import { sendWhatsAppTemplateNotification } from '@/lib/whatsapp'

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

    // Emit event for real-time cashier dashboard
    orderEventEmitter.emit('orderUpdate', { id: updatedOrder.id, status: updatedOrder.status })

    // DEBUG: Log all values to trace WhatsApp notification trigger
    console.log('[STATUS-UPDATE] Order updated:', {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: status,
      channel: updatedOrder.channel,
      customerPhone: updatedOrder.customerPhone,
      customerName: updatedOrder.customerName,
    })
    console.log('[STATUS-UPDATE] WhatsApp condition check:', {
      isREADY: status === 'READY',
      isPREORDER: updatedOrder.channel === 'PREORDER',
      hasPhone: !!updatedOrder.customerPhone,
      allTrue: status === 'READY' && updatedOrder.channel === 'PREORDER' && !!updatedOrder.customerPhone
    })

    // Send WhatsApp template notification for pre-orders when READY (ready to pickup)
    if (status === 'READY' && updatedOrder.channel === 'PREORDER' && updatedOrder.customerPhone) {
      const formattedTotal = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(updatedOrder.totalAmount.toNumber())

      console.log('[WHATSAPP] Mengirim template pesanan_siap ke:', updatedOrder.customerPhone, 'dengan params:', [
        updatedOrder.customerName || 'Pelanggan',
        updatedOrder.orderNumber,
        formattedTotal
      ])

      // Fire-and-forget: don't block response
      sendWhatsAppTemplateNotification(
        updatedOrder.customerPhone,
        'pesanan_siap',
        [
          updatedOrder.customerName || 'Pelanggan',
          updatedOrder.orderNumber,
          formattedTotal
        ],
        'id'
      ).then((result) => {
        console.log('[WHATSAPP] Hasil pengiriman:', JSON.stringify(result))
      }).catch((err) => console.error('[WHATSAPP] Error sending template notification:', err))
    } else {
      console.log('[STATUS-UPDATE] WhatsApp TIDAK dikirim karena kondisi tidak terpenuhi')
    }

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
