import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { 
  handleApiError, 
  AuthenticationError, 
  AuthorizationError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import { logAnalyticsAccess } from '@/lib/auditLog'

// GET analytics data (OWNER and ADMIN)
export async function GET(request: NextRequest) {
    try {
        // Check permissions
        const { response, user } = await withApiPermission(request, {
            allowedRoles: ['OWNER', 'ADMIN'],
            resource: 'ANALYTICS'
        })

        if (response) return response
        if (!user) throw new AuthenticationError()

        const searchParams = request.nextUrl.searchParams
        const days = parseInt(searchParams.get('days') || '30') // 7, 30, or 90 days
        const type = searchParams.get('type') || 'overview' // overview, sales-trend, top-products, revenue-breakdown, category-revenue

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        // Log analytics access
        await logAnalyticsAccess(user.userId, user.role, type, {
            days,
            endpoint: request.nextUrl.pathname
        })

        if (type === 'sales-trend') {
            // Daily sales trend
            const orders = await prisma.order.findMany({
                where: {
                    createdAt: { gte: startDate },
                    status: { not: 'CANCELLED' },
                },
                select: {
                    createdAt: true,
                    totalAmount: true,
                },
            })

            // Group by date
            const salesByDate: { [key: string]: number } = {}
            orders.forEach((order) => {
                const date = order.createdAt.toISOString().split('T')[0]
                salesByDate[date] = (salesByDate[date] || 0) + order.totalAmount.toNumber()
            })

            const salesTrend = Object.entries(salesByDate)
                .map(([date, amount]) => ({ date, amount }))
                .sort((a, b) => a.date.localeCompare(b.date))

            return NextResponse.json({ salesTrend })
        }

        if (type === 'top-products') {
            // Top selling products with revenue breakdown
            const orderItems = await prisma.orderItem.findMany({
                where: {
                    order: {
                        createdAt: { gte: startDate },
                        status: { not: 'CANCELLED' }
                    }
                },
                select: {
                    productId: true,
                    quantity: true,
                    subtotal: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            category: true,
                            price: true
                        }
                    }
                }
            })

            // Group by product
            const productStats: { [key: string]: any } = {}
            orderItems.forEach((item) => {
                const productId = item.productId
                if (!productStats[productId]) {
                    productStats[productId] = {
                        product: item.product,
                        quantitySold: 0,
                        totalRevenue: 0
                    }
                }
                productStats[productId].quantitySold += item.quantity
                productStats[productId].totalRevenue += item.subtotal.toNumber()
            })

            const topProducts = Object.values(productStats)
                .sort((a, b) => b.quantitySold - a.quantitySold)
                .slice(0, 10)

            return NextResponse.json({ topProducts })
        }

        if (type === 'revenue-breakdown') {
            // Revenue by payment method and order type
            const orders = await prisma.order.findMany({
                where: {
                    createdAt: { gte: startDate },
                    status: 'COMPLETED',
                },
                select: {
                    payment_method: true,
                    totalAmount: true,
                    orderType: true,
                },
            })

            const revenueByMethod = {
                CASH: 0,
                QRIS: 0,
            }

            const revenueByOrderType = {
                DINE_IN: 0,
                TAKEAWAY: 0,
            }

            orders.forEach((order) => {
                const amount = order.totalAmount.toNumber()
                
                // Revenue by payment method
                if (order.payment_method === 'CASH') {
                    revenueByMethod.CASH += amount
                } else if (order.payment_method === 'QRIS') {
                    revenueByMethod.QRIS += amount
                }

                // Revenue by order type
                if (order.orderType === 'DINE_IN') {
                    revenueByOrderType.DINE_IN += amount
                } else if (order.orderType === 'TAKEAWAY') {
                    revenueByOrderType.TAKEAWAY += amount
                }
            })

            return NextResponse.json({
                revenueByMethod,
                revenueByOrderType,
            })
        }

        if (type === 'category-revenue') {
            // Revenue by product category
            const orderItems = await prisma.orderItem.findMany({
                where: {
                    order: {
                        createdAt: { gte: startDate },
                        status: 'COMPLETED'
                    }
                },
                select: {
                    subtotal: true,
                    product: {
                        select: {
                            category: true
                        }
                    }
                }
            })

            const revenueByCategory: { [key: string]: number } = {}
            orderItems.forEach((item) => {
                const category = item.product.category || 'Uncategorized'
                revenueByCategory[category] = (revenueByCategory[category] || 0) + item.subtotal.toNumber()
            })

            const categoryRevenue = Object.entries(revenueByCategory)
                .map(([category, revenue]) => ({ category, revenue }))
                .sort((a, b) => b.revenue - a.revenue)

            return NextResponse.json({ categoryRevenue })
        }

        // Default: overview
        const [
            totalOrders,
            totalRevenue,
            totalCustomers,
            recentOrders,
        ] = await Promise.all([
            prisma.order.count({
                where: {
                    createdAt: { gte: startDate },
                    status: { not: 'CANCELLED' },
                },
            }),
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: startDate },
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalAmount: true },
            }),
            prisma.user.count({
                where: {
                    role: 'USER',
                    createdAt: { gte: startDate },
                },
            }),
            prisma.order.findMany({
                where: {
                    createdAt: { gte: startDate },
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    orderNumber: true,
                    totalAmount: true,
                    status: true,
                    createdAt: true,
                    customerName: true,
                    orderType: true,
                },
            }),
        ])

        const averageOrderValue = totalOrders > 0
            ? (totalRevenue._sum.totalAmount?.toNumber() || 0) / totalOrders
            : 0

        return NextResponse.json({
            period: `Last ${days} days`,
            totalOrders,
            totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
            averageOrderValue,
            newCustomers: totalCustomers,
            recentOrders: recentOrders.map((order) => ({
                ...order,
                totalAmount: order.totalAmount.toNumber(),
            })),
        })
    } catch (error) {
        return handleApiError(error)
    }
}
