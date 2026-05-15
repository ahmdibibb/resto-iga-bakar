import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError, OrderValidationError, NotFoundError } from '@/lib/errorHandler'

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
