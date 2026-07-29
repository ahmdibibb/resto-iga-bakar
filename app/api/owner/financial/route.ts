import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleApiError, 
  AuthenticationError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import { logAnalyticsAccess } from '@/lib/auditLog'

/**
 * GET /api/owner/financial
 * Get comprehensive financial metrics
 * Protected: OWNER only (ADMIN has restricted access)
 */
export async function GET(request: NextRequest) {
  try {
    // Check permissions - ADMIN users are blocked from detailed financial metrics
    const { response, user } = await withApiPermission(request, {
      allowedRoles: ['OWNER'],
      resource: 'FINANCIAL'
    })

    if (response) return response
    if (!user) throw new AuthenticationError()

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'monthly' // daily, weekly, monthly
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Parse dates
    let startDate: Date
    let endDate: Date = new Date()
    endDate.setHours(23, 59, 59, 999)

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Default based on period
      startDate = new Date()
      if (period === 'daily') {
        startDate.setDate(startDate.getDate() - 30) // Last 30 days
      } else if (period === 'weekly') {
        startDate.setDate(startDate.getDate() - 90) // Last 90 days
      } else {
        startDate.setMonth(startDate.getMonth() - 12) // Last 12 months
      }
      startDate.setHours(0, 0, 0, 0)
    }

    // Log financial data access
    await logAnalyticsAccess(user.userId, user.role, 'financial-metrics', {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      endpoint: request.nextUrl.pathname
    })

    // Fetch all completed orders in the period
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        totalAmount: true,
        payment_method: true,
        orderType: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            subtotal: true,
            product: {
              select: {
                category: true
              }
            }
          }
        }
      }
    })

    // Calculate total revenue (exact amounts, no rounding)
    const totalRevenue = orders.reduce((sum, order) => 
      sum + order.totalAmount.toNumber(), 0
    )

    // Revenue by payment method
    const revenueByPaymentMethod = {
      CASH: 0,
      QRIS: 0
    }
    orders.forEach(order => {
      const amount = order.totalAmount.toNumber()
      if (order.payment_method === 'CASH') {
        revenueByPaymentMethod.CASH += amount
      } else if (order.payment_method === 'QRIS') {
        revenueByPaymentMethod.QRIS += amount
      }
    })

    // Revenue by order type
    const revenueByOrderType = {
      DINE_IN: 0,
      TAKEAWAY: 0
    }
    orders.forEach(order => {
      const amount = order.totalAmount.toNumber()
      if (order.orderType === 'DINE_IN') {
        revenueByOrderType.DINE_IN += amount
      } else if (order.orderType === 'TAKEAWAY') {
        revenueByOrderType.TAKEAWAY += amount
      }
    })

    // Revenue by category
    const revenueByCategory: { [key: string]: number } = {}
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.product.category || 'Uncategorized'
        revenueByCategory[category] = (revenueByCategory[category] || 0) + item.subtotal.toNumber()
      })
    })

    // Calculate average order value
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Generate revenue trends based on period
    const revenueTrends = generateRevenueTrends(orders, startDate, endDate, period)

    // Calculate daily/weekly/monthly averages
    const periodCount = revenueTrends.length
    const averageRevenuePerPeriod = periodCount > 0 ? totalRevenue / periodCount : 0

    // Calculate growth rate (compare first half vs second half)
    const midPoint = Math.floor(revenueTrends.length / 2)
    const firstHalfRevenue = revenueTrends.slice(0, midPoint).reduce((sum, item) => sum + item.revenue, 0)
    const secondHalfRevenue = revenueTrends.slice(midPoint).reduce((sum, item) => sum + item.revenue, 0)
    const growthRate = firstHalfRevenue > 0 
      ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
      : 0

    // Total products sold
    const totalProductsSold = orders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )

    return NextResponse.json({
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      summary: {
        totalRevenue, // Exact amount, no rounding
        totalOrders,
        totalProductsSold,
        averageOrderValue, // Exact amount
        averageRevenuePerPeriod, // Exact amount
        growthRate, // Percentage
        profitMargin: null // Requires product cost data (not currently tracked in database)
      },
      revenueByPaymentMethod, // Exact amounts
      revenueByOrderType, // Exact amounts
      revenueByCategory, // Exact amounts
      revenueTrends // Array of { period, revenue, orders }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function generateRevenueTrends(
  orders: any[],
  startDate: Date,
  endDate: Date,
  period: string
) {
  const trends: { period: string, revenue: number, orders: number }[] = []

  if (period === 'daily') {
    // Group by day
    const dayMap = new Map<string, { revenue: number, orders: number }>()
    
    orders.forEach(order => {
      const day = order.createdAt.toISOString().split('T')[0]
      const existing = dayMap.get(day)
      const amount = order.totalAmount.toNumber()
      
      if (existing) {
        existing.revenue += amount
        existing.orders += 1
      } else {
        dayMap.set(day, { revenue: amount, orders: 1 })
      }
    })

    // Fill in missing days with zero
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const data = dayMap.get(dateStr) || { revenue: 0, orders: 0 }
      trends.push({
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
      const amount = order.totalAmount.toNumber()
      
      if (existing) {
        existing.revenue += amount
        existing.orders += 1
      } else {
        weekMap.set(weekKey, { revenue: amount, orders: 1 })
      }
    })

    weekMap.forEach((data, weekKey) => {
      trends.push({
        period: `Week of ${weekKey}`,
        revenue: data.revenue,
        orders: data.orders
      })
    })
  } else {
    // Group by month
    const monthMap = new Map<string, { revenue: number, orders: number }>()
    
    orders.forEach(order => {
      const month = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
      const existing = monthMap.get(month)
      const amount = order.totalAmount.toNumber()
      
      if (existing) {
        existing.revenue += amount
        existing.orders += 1
      } else {
        monthMap.set(month, { revenue: amount, orders: 1 })
      }
    })

    monthMap.forEach((data, month) => {
      trends.push({
        period: month,
        revenue: data.revenue,
        orders: data.orders
      })
    })
  }

  return trends.sort((a, b) => a.period.localeCompare(b.period))
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
