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

function generateRevenueChart(
  orders: any[],
  startDate: Date,
  endDate: Date,
  period: string
) {
  const chartData: { period: string, revenue: number, orders: number }[] = []

  if (period === 'daily') {
    // Group by day
    const dayMap = new Map<string, { revenue: number, orders: number }>()
    
    orders.forEach(order => {
      const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(order.createdAt)
      const existing = dayMap.get(day)
      if (existing) {
        existing.revenue += order.totalAmount.toNumber()
        existing.orders += 1
      } else {
        dayMap.set(day, {
          revenue: order.totalAmount.toNumber(),
          orders: 1
        })
      }
    })

    // Fill in missing days
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const data = dayMap.get(dateStr) || { revenue: 0, orders: 0 }
      chartData.push({
        period: dateStr,
        revenue: data.revenue,
        orders: data.orders
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
  } else if (period === 'weekly') {
    // Group by week
    const weekMap = new Map<string, { revenue: number, orders: number }>()
    
    orders.forEach(order => {
      const weekStart = getWeekStart(order.createdAt)
      const weekKey = weekStart.toISOString().split('T')[0]
      const existing = weekMap.get(weekKey)
      if (existing) {
        existing.revenue += order.totalAmount.toNumber()
        existing.orders += 1
      } else {
        weekMap.set(weekKey, {
          revenue: order.totalAmount.toNumber(),
          orders: 1
        })
      }
    })

    weekMap.forEach((data, weekKey) => {
      chartData.push({
        period: `Week of ${weekKey}`,
        revenue: data.revenue,
        orders: data.orders
      })
    })
  } else if (period === 'monthly') {
    // Group by month
    const monthMap = new Map<string, { revenue: number, orders: number }>()
    
    orders.forEach(order => {
      const month = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
      const existing = monthMap.get(month)
      if (existing) {
        existing.revenue += order.totalAmount.toNumber()
        existing.orders += 1
      } else {
        monthMap.set(month, {
          revenue: order.totalAmount.toNumber(),
          orders: 1
        })
      }
    })

    monthMap.forEach((data, month) => {
      chartData.push({
        period: month,
        revenue: data.revenue,
        orders: data.orders
      })
    })
  } else if (period === 'yearly') {
    // Group by year
    const yearMap = new Map<string, { revenue: number, orders: number }>()
    
    orders.forEach(order => {
      const year = order.createdAt.getFullYear().toString()
      const existing = yearMap.get(year)
      if (existing) {
        existing.revenue += order.totalAmount.toNumber()
        existing.orders += 1
      } else {
        yearMap.set(year, {
          revenue: order.totalAmount.toNumber(),
          orders: 1
        })
      }
    })

    yearMap.forEach((data, year) => {
      chartData.push({
        period: year,
        revenue: data.revenue,
        orders: data.orders
      })
    })
  }

  return chartData.sort((a, b) => a.period.localeCompare(b.period))
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
