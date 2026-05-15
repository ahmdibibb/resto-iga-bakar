import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
} from '@/lib/errorHandler'
import { getStartOfDayWIB, getEndOfDayWIB } from '@/lib/timezone'
import {
  completedSalesWhere,
  getSalesSummary,
  getSalesChartData,
} from '@/lib/salesMetrics'

type NormalizedPeriod = 'today' | 'week' | 'month'

function normalizePeriod(raw: string | null): NormalizedPeriod {
  switch (raw) {
    case 'today':
    case 'day':
      return 'today'
    case 'week':
    case 'weekly':
      return 'week'
    case 'month':
    case 'monthly':
      return 'month'
    default:
      return 'month'
  }
}

function getPeriodRange(period: NormalizedPeriod): { startDate: Date; endDate: Date } {
  const now = new Date()

  if (period === 'today') {
    return {
      startDate: getStartOfDayWIB(now),
      endDate: getEndOfDayWIB(now),
    }
  }

  if (period === 'week') {
    const weekStart = new Date(getStartOfDayWIB(now))
    weekStart.setTime(weekStart.getTime() - 6 * 24 * 60 * 60 * 1000)
    return {
      startDate: weekStart,
      endDate: getEndOfDayWIB(now),
    }
  }

  const monthStart = new Date(getStartOfDayWIB(now))
  monthStart.setTime(monthStart.getTime() - 29 * 24 * 60 * 60 * 1000)
  return {
    startDate: monthStart,
    endDate: getEndOfDayWIB(now),
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) throw new AuthenticationError()

    const user = await getCurrentUser(token)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
      throw new AuthorizationError()
    }

    const period = normalizePeriod(request.nextUrl.searchParams.get('period'))
    const { startDate, endDate } = getPeriodRange(period)

    const todayStart = getStartOfDayWIB(new Date())
    const todayEnd = getEndOfDayWIB(new Date())

    const [todaySummary, periodSummary, chartData, lowStockProducts, topProductsRaw] =
      await Promise.all([
        getSalesSummary(todayStart, todayEnd),
        getSalesSummary(startDate, endDate),
        getSalesChartData(
          startDate,
          endDate,
          period === 'today' ? 'hourly' : 'daily'
        ),
        prisma.product.findMany({
          where: { stock: { lt: 10 }, isActive: true },
          select: { id: true, name: true, stock: true },
        }),
        prisma.orderItem.groupBy({
          by: ['productId'],
          where: { order: completedSalesWhere(startDate, endDate) },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
      ])

    const topProducts = await Promise.all(
      topProductsRaw.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, price: true, image: true, category: true },
        })
        return {
          product,
          quantitySold: item._sum.quantity ?? 0,
        }
      })
    )

    return NextResponse.json({
      period,
      today: {
        totalOrders: todaySummary.totalOrders,
        productsSold: todaySummary.totalProductsSold,
        revenue: todaySummary.totalRevenue,
        averageOrderValue: todaySummary.averageOrderValue,
      },
      totalSales: periodSummary.totalRevenue,
      totalOrders: periodSummary.totalOrders,
      productsSold: periodSummary.totalProductsSold,
      averageOrderValue: periodSummary.averageOrderValue,
      lowStockProducts,
      topProducts,
      chartData,
      dailySales: chartData.map((d) => ({
        date: d.date,
        amount: d.revenue,
        orders: d.orders,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
