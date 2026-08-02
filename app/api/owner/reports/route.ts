import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleApiError, 
  AuthenticationError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import { logAnalyticsAccess } from '@/lib/auditLog'
import { generateRevenueChart } from '@/lib/reportUtils'

/**
 * GET /api/owner/reports
 * Generate comprehensive sales report
 * Protected: OWNER and ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const { response, user } = await withApiPermission(request, {
      allowedRoles: ['OWNER', 'ADMIN'],
      resource: 'REPORT'
    })

    if (response) return response
    if (!user) throw new AuthenticationError()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const period = searchParams.get('period') || 'daily'
    const reportType = searchParams.get('type') || 'sales' // sales, daily-revenue, product-sales

    // Parse dates
    let startDate: Date
    let endDate: Date = new Date()
    endDate.setHours(23, 59, 59, 999)

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Default to current month
      startDate = new Date()
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
    }

    // Log report access
    await logAnalyticsAccess(user.userId, user.role, `report-${reportType}`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
      endpoint: request.nextUrl.pathname
    })

    if (reportType === 'daily-revenue') {
      // Daily revenue report
      const orders = await prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          totalAmount: true,
          payment_method: true,
          orderType: true
        }
      })

      // Group by day
      const dailyRevenue: { [key: string]: any } = {}
      orders.forEach(order => {
        const day = order.createdAt.toISOString().split('T')[0]
        if (!dailyRevenue[day]) {
          dailyRevenue[day] = {
            date: day,
            revenue: 0,
            orders: 0,
            cash: 0,
            qris: 0,
            dineIn: 0,
            takeaway: 0
          }
        }
        const amount = order.totalAmount.toNumber()
        dailyRevenue[day].revenue += amount
        dailyRevenue[day].orders += 1
        
        if (order.payment_method === 'CASH') dailyRevenue[day].cash += amount
        if (order.payment_method === 'QRIS') dailyRevenue[day].qris += amount
        if (order.orderType === 'DINE_IN') dailyRevenue[day].dineIn += amount
        if (order.orderType === 'TAKEAWAY') dailyRevenue[day].takeaway += amount
      })

      const dailyRevenueArray = Object.values(dailyRevenue).sort((a: any, b: any) => 
        a.date.localeCompare(b.date)
      )

      return NextResponse.json({
        reportType: 'daily-revenue',
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        data: dailyRevenueArray
      })
    }

    if (reportType === 'product-sales') {
      // Product sales report
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            status: 'COMPLETED',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        include: {
          product: {
            select: {
              name: true,
              category: true,
              price: true
            }
          }
        }
      })

      const productStats: { [key: string]: any } = {}
      orderItems.forEach(item => {
        const productId = item.productId
        if (!productStats[productId]) {
          productStats[productId] = {
            name: item.product.name,
            category: item.product.category || 'Uncategorized',
            price: item.product.price.toNumber(),
            quantitySold: 0,
            totalRevenue: 0
          }
        }
        productStats[productId].quantitySold += item.quantity
        productStats[productId].totalRevenue += item.subtotal.toNumber()
      })

      const productSales = Object.values(productStats).sort((a: any, b: any) => 
        b.quantitySold - a.quantitySold
      )

      return NextResponse.json({
        reportType: 'product-sales',
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        data: productSales
      })
    }

    // Default: comprehensive sales report
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
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

    // Payment method breakdown
    const paymentBreakdown = {
      CASH: 0,
      QRIS: 0
    }
    orders.forEach(order => {
      if (order.payment_method === 'CASH') {
        paymentBreakdown.CASH += order.totalAmount.toNumber()
      } else if (order.payment_method === 'QRIS') {
        paymentBreakdown.QRIS += order.totalAmount.toNumber()
      }
    })

    // Order type breakdown
    const orderTypeBreakdown = {
      DINE_IN: 0,
      TAKEAWAY: 0
    }
    orders.forEach(order => {
      if (order.orderType === 'DINE_IN') {
        orderTypeBreakdown.DINE_IN += order.totalAmount.toNumber()
      } else if (order.orderType === 'TAKEAWAY') {
        orderTypeBreakdown.TAKEAWAY += order.totalAmount.toNumber()
      }
    })

    // Prepare transactions data
    const transactions = orders.map(order => ({
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      items: order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', '),
      total: order.totalAmount.toNumber(),
      paymentMethod: order.payment_method || 'N/A',
      orderType: order.orderType,
      customerName: order.customerName || order.user?.name || 'Guest'
    }))

    // Calculate top products
    const productStats = new Map<string, { name: string, quantity: number, revenue: number, category: string }>()
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productStats.get(item.productId)
        if (existing) {
          existing.quantity += item.quantity
          existing.revenue += item.subtotal.toNumber()
        } else {
          productStats.set(item.productId, {
            name: item.product.name,
            category: item.product.category || 'Uncategorized',
            quantity: item.quantity,
            revenue: item.subtotal.toNumber()
          })
        }
      })
    })

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(product => ({
        name: product.name,
        category: product.category,
        quantitySold: product.quantity,
        totalRevenue: product.revenue
      }))

    // Generate revenue chart data based on period
    const validPeriod = (period === 'weekly' || period === 'monthly' || period === 'yearly') ? period : 'monthly'
    const revenueChart = generateRevenueChart(orders, startDate, endDate, validPeriod)

    return NextResponse.json({
      reportType: 'sales',
      summary: {
        totalRevenue,
        totalOrders,
        totalProductsSold,
        averageOrderValue,
        paymentBreakdown,
        orderTypeBreakdown
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

