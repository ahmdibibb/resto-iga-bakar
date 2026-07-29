import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleApiError, 
  AuthenticationError, 
  AuthorizationError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'

// GET analytics data (Admin only)
export async function GET(request: NextRequest) {
    try {
        const { response } = await withApiPermission(request, {
            allowedRoles: ['ADMIN'],
            resource: 'ANALYTICS'
        })
        if (response) return response

        const searchParams = request.nextUrl.searchParams
        const days = parseInt(searchParams.get('days') || '30') // Last N days
        const type = searchParams.get('type') || 'overview' // overview, sales-trend, top-products, revenue-breakdown

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

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
            // Top selling products
            const topProducts = await prisma.orderItem.groupBy({
                by: ['productId'],
                _sum: {
                    quantity: true,
                    subtotal: true,
                },
                orderBy: {
                    _sum: {
                        quantity: 'desc',
                    },
                },
                take: 10,
            })

            // Get product details
            const productsWithDetails = await Promise.all(
                topProducts.map(async (item) => {
                    const product = await prisma.product.findUnique({
                        where: { id: item.productId },
                        select: { id: true, name: true, category: true },
                    })

                    return {
                        product,
                        quantitySold: item._sum.quantity || 0,
                        totalRevenue: item._sum.subtotal?.toNumber() || 0,
                    }
                })
            )

            return NextResponse.json({ topProducts: productsWithDetails })
        }

        if (type === 'revenue-breakdown') {
            // Revenue by payment method - using Order data for completed orders
            const orders = await prisma.order.findMany({
                where: {
                    createdAt: { gte: startDate },
                    status: 'COMPLETED', // Only completed orders
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
                // Revenue by payment method
                if (order.payment_method === 'CASH') {
                    revenueByMethod.CASH += order.totalAmount.toNumber()
                } else if (order.payment_method === 'QRIS') {
                    revenueByMethod.QRIS += order.totalAmount.toNumber()
                }

                // Revenue by order type
                if (order.orderType === 'DINE_IN') {
                    revenueByOrderType.DINE_IN += order.totalAmount.toNumber()
                } else if (order.orderType === 'TAKEAWAY') {
                    revenueByOrderType.TAKEAWAY += order.totalAmount.toNumber()
                }
            })

            return NextResponse.json({
                revenueByMethod,
                revenueByOrderType,
            })
        }

        // Default: overview
        const [
            totalOrders,
            totalRevenue,
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
                },
            }),
        ])

        const ordersForCustCount = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                status: { not: 'CANCELLED' },
            },
            select: {
                customerName: true,
            },
        })
        const totalCustomers = new Set(
            ordersForCustCount.map((o) => o.customerName).filter(Boolean)
        ).size

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
