import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleApiError, 
  AuthenticationError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import { logReportExport } from '@/lib/auditLog'
import { generateSalesReportPDF } from '@/lib/generateSalesReportPDF'

/**
 * GET /api/owner/reports/pdf
 * Generate PDF sales report
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

    // Log PDF export
    await logReportExport(user.userId, user.role, 'sales-report', 'PDF', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      endpoint: request.nextUrl.pathname
    })

    // Fetch orders within date range (only COMPLETED orders)
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

    // Calculate days between dates
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Generate PDF
    generateSalesReportPDF({
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days
      },
      totalProductsSold,
      totalRevenue,
      revenueByMethod: {
        CASH: paymentBreakdown.CASH,
        QRIS: paymentBreakdown.QRIS,
      },
      productSales: topProducts.map(p => ({
        productId: '', // Not needed for PDF
        productName: p.name,
        quantitySold: p.quantitySold,
        totalRevenue: p.totalRevenue
      })),
      dailyRevenue: [] // Not needed for this report
    })

    // Return success message (PDF is downloaded client-side)
    return NextResponse.json({
      message: 'PDF generated successfully',
      filename: `Laporan_Penjualan_${startDate.toISOString().split('T')[0]}.pdf`
    })
  } catch (error) {
    return handleApiError(error)
  }
}
