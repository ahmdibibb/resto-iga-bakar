import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { 
  handleApiError, 
  AuthenticationError, 
  AuthorizationError 
} from '@/lib/errorHandler'

/**
 * GET /api/kasir/orders
 * Fetch orders in Kasir queue (belum di-print)
 * Protected: KASIR or ADMIN only
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      throw new AuthenticationError()
    }

    const user = await getCurrentUser(token)
    if (!user || (user.role !== 'KASIR' && user.role !== 'ADMIN')) {
      throw new AuthorizationError()
    }

    // Fetch orders that need kasir action (belum di-print):
    // - QRIS with PAID status (auto-confirmed, need to print)
    // - CASH with UNPAID status (need payment confirmation)
    // - CASH with PAID status (payment confirmed, need to print)
    const orders = await prisma.order.findMany({
      where: {
        printedAt: null, // Belum di-print oleh kasir
        OR: [
          // QRIS orders that are already paid (auto-confirmed)
          {
            payment_method: 'QRIS',
            payment_status: 'PAID'
          },
          // CASH orders (paid or unpaid)
          {
            payment_method: 'CASH'
          }
        ]
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                category: true
              }
            }
          }
        },
        table: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Oldest first (FIFO)
      }
    })

    // Convert Decimal to number for frontend
    const ordersResponse = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      totalAmount: order.totalAmount.toNumber(),
      orderType: order.orderType,
      tableNumber: order.tableNumber,
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
      user: order.user
    }))

    return NextResponse.json(ordersResponse)
  } catch (error) {
    return handleApiError(error)
  }
}
