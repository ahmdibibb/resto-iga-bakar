import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError, AuthenticationError, AuthorizationError } from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import { getStartOfDayWIB, getEndOfDayWIB, parseWibDateStart, parseWibDateEnd } from '@/lib/timezone'

// GET orders with filters (Admin only)
export async function GET(request: NextRequest) {
    try {
        const { response, user } = await withApiPermission(request, {
            allowedRoles: ['ADMIN', 'OWNER'],
            resource: 'ORDER'
        })

        if (response) return response
        if (!user) throw new AuthenticationError()

        const searchParams = request.nextUrl.searchParams
        const period = searchParams.get('period') || 'daily' // daily, monthly, all
        const date = searchParams.get('date') // YYYY-MM-DD or YYYY-MM
        const status = searchParams.get('status')
        const orderType = searchParams.get('orderType')
        const limit = parseInt(searchParams.get('limit') || '20')
        const page = parseInt(searchParams.get('page') || '1')

        // Build where clause
        const where: any = {}

        if (status) where.status = status
        if (orderType) where.orderType = orderType

        // Date filtering
        if (date) {
            if (period === 'daily') {
                where.createdAt = {
                    gte: parseWibDateStart(date),
                    lte: parseWibDateEnd(date),
                }
            } else if (period === 'monthly') {
                // Filter by month (date should be YYYY-MM)
                const [year, month] = date.split('-')
                const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
                const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

                where.createdAt = {
                    gte: startDate,
                    lte: endDate,
                }
            }
        }

        // Get total count
        const totalCount = await prisma.order.count({ where })

        // Get orders with pagination
        const orders = await prisma.order.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                table: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
                items: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                        subtotal: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                category: true,
                            },
                        },
                    },
                },
                payment: {
                    select: {
                        id: true,
                        method: true,
                        status: true,
                        amount: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        })

        // Convert Decimal to number
        const ordersResponse = orders.map((order) => ({
            ...order,
            totalAmount: order.totalAmount.toNumber(),
            items: order.items.map((item) => ({
                ...item,
                price: item.price.toNumber(),
                subtotal: item.subtotal.toNumber(),
            })),
            payment: order.payment ? {
                ...order.payment,
                amount: order.payment.amount.toNumber(),
            } : null,
        }))

        const statsWhere = { ...where }
        if (!status) {
            statsWhere.status = 'COMPLETED'
        }

        const allOrdersForStats = await prisma.order.findMany({
            where: statsWhere,
            select: {
                totalAmount: true,
                items: { select: { quantity: true } },
            },
        })

        const totalRevenue = allOrdersForStats.reduce(
            (sum, order) => sum + order.totalAmount.toNumber(),
            0
        )
        const productsSold = allOrdersForStats.reduce(
            (sum, order) =>
                sum + order.items.reduce((s, item) => s + item.quantity, 0),
            0
        )

        const stats = {
            totalOrders: allOrdersForStats.length,
            totalRevenue,
            productsSold,
            averageOrderValue:
                allOrdersForStats.length > 0 ? totalRevenue / allOrdersForStats.length : 0,
        }

        return NextResponse.json({
            orders: ordersResponse,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
            stats,
        })
    } catch (error) {
        return handleApiError(error)
    }
}
