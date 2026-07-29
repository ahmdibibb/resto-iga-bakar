import { prisma } from '@/lib/prisma'
import { getWibDateString, getWibHour } from '@/lib/timezone'

/** Same criteria as /api/admin/reports — only completed sales count */
export function completedSalesWhere(startDate: Date, endDate: Date) {
  return {
    status: 'COMPLETED' as const,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }
}

export interface SalesSummary {
  totalRevenue: number
  totalOrders: number
  totalProductsSold: number
  averageOrderValue: number
}

export async function getSalesSummary(
  startDate: Date,
  endDate: Date
): Promise<SalesSummary> {
  const orders = await prisma.order.findMany({
    where: completedSalesWhere(startDate, endDate),
    select: {
      totalAmount: true,
      items: { select: { quantity: true } },
    },
  })

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0)
  const totalOrders = orders.length
  const totalProductsSold = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  )

  return {
    totalRevenue,
    totalOrders,
    totalProductsSold,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
  }
}

export interface ChartPoint {
  date: string
  revenue: number
  orders: number
}

export async function getSalesChartData(
  startDate: Date,
  endDate: Date,
  mode: 'hourly' | 'daily'
): Promise<ChartPoint[]> {
  const orders = await prisma.order.findMany({
    where: completedSalesWhere(startDate, endDate),
    select: { createdAt: true, totalAmount: true },
    orderBy: { createdAt: 'asc' },
  })

  if (mode === 'hourly') {
    const buckets = new Map<string, { revenue: number; orders: number }>()
    for (let h = 0; h < 24; h++) {
      buckets.set(`${String(h).padStart(2, '0')}:00`, { revenue: 0, orders: 0 })
    }
    orders.forEach((order) => {
      const key = `${String(getWibHour(order.createdAt)).padStart(2, '0')}:00`
      const bucket = buckets.get(key)!
      bucket.revenue += order.totalAmount.toNumber()
      bucket.orders += 1
    })
    return Array.from(buckets.entries()).map(([date, v]) => ({
      date,
      revenue: v.revenue,
      orders: v.orders,
    }))
  }

  const dayMap = new Map<string, { revenue: number; orders: number }>()
  orders.forEach((order) => {
    const day = getWibDateString(order.createdAt)
    const existing = dayMap.get(day) ?? { revenue: 0, orders: 0 }
    existing.revenue += order.totalAmount.toNumber()
    existing.orders += 1
    dayMap.set(day, existing)
  })

  const chart: ChartPoint[] = []
  let current = getWibDateString(startDate)
  const endDay = getWibDateString(endDate)

  while (current <= endDay) {
    const data = dayMap.get(current) ?? { revenue: 0, orders: 0 }
    chart.push({ date: current, revenue: data.revenue, orders: data.orders })
    const [y, m, d] = current.split('-').map(Number)
    const next = new Date(Date.UTC(y, m - 1, d + 1))
    current = getWibDateString(next)
  }

  return chart
}
