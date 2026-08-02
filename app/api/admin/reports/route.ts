import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleApiError, 
  AuthenticationError, 
  AuthorizationError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import { completedSalesWhere, getSalesChartData } from '@/lib/salesMetrics'
import { getStartOfDayWIB, getEndOfDayWIB } from '@/lib/timezone'
import { generateRevenueChart } from '@/lib/reportUtils'

/**
 * GET /api/admin/reports
 * Generate comprehensive sales report
 * Protected: ADMIN only
 */
export async function GET(request: NextRequest) {
  try {
    const { response } = await withApiPermission(request, {
      allowedRoles: ['ADMIN'],
      resource: 'REPORT'
    })
    if (response) return response

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const period = searchParams.get('period') || 'daily'

    let startDate: Date
    let endDate: Date

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      startDate = getStartOfDayWIB(new Date())
      endDate = getEndOfDayWIB(new Date())
    }

    const orders = await prisma.order.findMany({
      where: completedSalesWhere(startDate, endDate),
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate summary
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount.toNumber(), 0)
    const totalOrders = orders.length
    const totalProductsSold = orders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Prepare transactions data
    const transactions = orders.map(order => ({
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      items: order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', '),
      total: order.totalAmount.toNumber(),
      paymentMethod: order.payment_method || 'N/A',
      customerName: order.customerName || order.user?.name || 'Guest'
    }))

    // Calculate top products
    const productStats = new Map<string, { name: string, quantity: number, revenue: number }>()
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productStats.get(item.productId)
        if (existing) {
          existing.quantity += item.quantity
          existing.revenue += item.subtotal.toNumber()
        } else {
          productStats.set(item.productId, {
            name: item.product.name,
            quantity: item.quantity,
            revenue: item.subtotal.toNumber()
          })
        }
      })
    })

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(product => ({
        name: product.name,
        quantitySold: product.quantity,
        totalRevenue: product.revenue
      }))

    const rangeMs = endDate.getTime() - startDate.getTime()
    const isSingleDay = rangeMs < 36 * 60 * 60 * 1000

    let revenueChart: { period: string; revenue: number; orders: number }[]

    if (period === 'weekly' || period === 'monthly' || period === 'yearly') {
      revenueChart = generateRevenueChart(orders, startDate, endDate, period)
    } else {
      const revenueChartRaw = await getSalesChartData(
        startDate,
        endDate,
        isSingleDay ? 'hourly' : 'daily'
      )
      revenueChart = revenueChartRaw.map((point) => ({
        period: point.date,
        revenue: point.revenue,
        orders: point.orders,
      }))
    }

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        totalProductsSold,
        averageOrderValue
      },
      transactions,
      topProducts,
      revenueChart,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

