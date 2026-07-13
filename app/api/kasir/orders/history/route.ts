import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { 
  handleApiError, 
  AuthenticationError, 
  AuthorizationError 
} from '@/lib/errorHandler'

/**
 * GET /api/kasir/orders/history
 * Fetch completed orders history (daily or weekly)
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

    // Get filter from query params (default: today)
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'today'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    if (filter === 'week') {
      // Start of week (7 days ago)
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
    } else {
      // Start of today
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
    }

    // Fetch orders that have been printed by kasir (sudah execute)
    const orders = await prisma.order.findMany({
      where: {
        printedAt: {
          not: null, // Sudah di-print oleh kasir
          gte: startDate // Dalam range waktu yang dipilih
        }
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
        createdAt: 'desc' // Newest first
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
      channel: order.channel,
      pickupTime: order.pickupTime,
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
