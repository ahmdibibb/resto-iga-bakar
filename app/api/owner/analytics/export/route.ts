import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleApiError, 
  AuthenticationError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import { logReportExport } from '@/lib/auditLog'

// GET export analytics data (OWNER and ADMIN with limitations)
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
        const days = parseInt(searchParams.get('days') || '30')
        const format = searchParams.get('format') || 'csv' // csv or json
        const type = searchParams.get('type') || 'overview'

        // ADMIN users have limited export capabilities - only CSV format allowed
        if (user.role === 'ADMIN' && format !== 'csv') {
            return NextResponse.json(
                { error: 'ADMIN users can only export in CSV format. PDF export is restricted to OWNER role.' },
                { status: 403 }
            )
        }

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        // Log export
        await logReportExport(
            user.userId, 
            user.role, 
            `analytics-${type}`, 
            format.toUpperCase() as 'PDF' | 'CSV',
            { days, endpoint: request.nextUrl.pathname }
        )

        if (type === 'sales-trend') {
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

            const salesByDate: { [key: string]: number } = {}
            orders.forEach((order) => {
                const date = order.createdAt.toISOString().split('T')[0]
                salesByDate[date] = (salesByDate[date] || 0) + order.totalAmount.toNumber()
            })

            const salesTrend = Object.entries(salesByDate)
                .map(([date, amount]) => ({ date, amount }))
                .sort((a, b) => a.date.localeCompare(b.date))

            if (format === 'csv') {
                const csv = [
                    'Date,Revenue',
                    ...salesTrend.map(row => `${row.date},${row.amount}`)
                ].join('\n')

                return new NextResponse(csv, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="sales-trend-${days}days.csv"`
                    }
                })
            }

            return NextResponse.json({ salesTrend })
        }

        if (type === 'top-products') {
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
                            name: true,
                            category: true,
                        }
                    }
                }
            })

            const productStats: { [key: string]: any } = {}
            orderItems.forEach((item) => {
                const productId = item.productId
                if (!productStats[productId]) {
                    productStats[productId] = {
                        name: item.product.name,
                        category: item.product.category || 'Uncategorized',
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

            if (format === 'csv') {
                const csv = [
                    'Product Name,Category,Quantity Sold,Total Revenue',
                    ...topProducts.map(p => `${p.name},${p.category},${p.quantitySold},${p.totalRevenue}`)
                ].join('\n')

                return new NextResponse(csv, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="top-products-${days}days.csv"`
                    }
                })
            }

            return NextResponse.json({ topProducts })
        }

        if (type === 'revenue-breakdown') {
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

            const revenueByMethod = { CASH: 0, QRIS: 0 }
            const revenueByOrderType = { DINE_IN: 0, TAKEAWAY: 0 }

            orders.forEach((order) => {
                const amount = order.totalAmount.toNumber()
                
                if (order.payment_method === 'CASH') {
                    revenueByMethod.CASH += amount
                } else if (order.payment_method === 'QRIS') {
                    revenueByMethod.QRIS += amount
                }

                if (order.orderType === 'DINE_IN') {
                    revenueByOrderType.DINE_IN += amount
                } else if (order.orderType === 'TAKEAWAY') {
                    revenueByOrderType.TAKEAWAY += amount
                }
            })

            if (format === 'csv') {
                const csv = [
                    'Category,Type,Revenue',
                    `Payment Method,CASH,${revenueByMethod.CASH}`,
                    `Payment Method,QRIS,${revenueByMethod.QRIS}`,
                    `Order Type,DINE_IN,${revenueByOrderType.DINE_IN}`,
                    `Order Type,TAKEAWAY,${revenueByOrderType.TAKEAWAY}`
                ].join('\n')

                return new NextResponse(csv, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="revenue-breakdown-${days}days.csv"`
                    }
                })
            }

            return NextResponse.json({ revenueByMethod, revenueByOrderType })
        }

        // Default: overview export
        const [totalOrders, totalRevenue] = await Promise.all([
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
        ])

        const averageOrderValue = totalOrders > 0
            ? (totalRevenue._sum.totalAmount?.toNumber() || 0) / totalOrders
            : 0

        if (format === 'csv') {
            const csv = [
                'Metric,Value',
                `Period,Last ${days} days`,
                `Total Orders,${totalOrders}`,
                `Total Revenue,${totalRevenue._sum.totalAmount?.toNumber() || 0}`,
                `Average Order Value,${averageOrderValue}`
            ].join('\n')

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="analytics-overview-${days}days.csv"`
                }
            })
        }

        return NextResponse.json({
            period: `Last ${days} days`,
            totalOrders,
            totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
            averageOrderValue
        })
    } catch (error) {
        return handleApiError(error)
    }
}
