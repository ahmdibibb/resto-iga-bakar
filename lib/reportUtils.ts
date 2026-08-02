/**
 * Report Utilities
 * Helper functions for generating revenue chart data
 */

import { Order, OrderItem, Product } from '@prisma/client'

type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[]
}

/**
 * Generate revenue chart data for weekly, monthly, or yearly periods
 */
export function generateRevenueChart(
  orders: OrderWithItems[],
  startDate: Date,
  endDate: Date,
  period: 'weekly' | 'monthly' | 'yearly'
): { period: string; revenue: number; orders: number }[] {
  const dataMap = new Map<string, { revenue: number; orders: number }>()

  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt)
    let key: string

    if (period === 'weekly') {
      // Group by week number
      const weekStart = getWeekStart(orderDate)
      key = weekStart.toISOString().split('T')[0]
    } else if (period === 'monthly') {
      // Group by month (YYYY-MM)
      key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
    } else {
      // Group by year (YYYY)
      key = String(orderDate.getFullYear())
    }

    const existing = dataMap.get(key)
    const revenue = order.totalAmount.toNumber()

    if (existing) {
      existing.revenue += revenue
      existing.orders += 1
    } else {
      dataMap.set(key, { revenue, orders: 1 })
    }
  })

  // Convert to array and sort by period
  const result = Array.from(dataMap.entries()).map(([period, data]) => ({
    period,
    revenue: data.revenue,
    orders: data.orders,
  }))

  result.sort((a, b) => a.period.localeCompare(b.period))

  return result
}

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
