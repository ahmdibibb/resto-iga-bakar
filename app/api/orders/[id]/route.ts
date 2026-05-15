import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiPermission } from '@/lib/apiPermissions'
import { handleApiError } from '@/lib/errorHandler'

// GET single order with proper authentication
// - Guests can access their own order with session_id
// - Logged-in users can access their own orders
// - Admin/Kasir/Owner can access any order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get token from cookies (if user is logged in)
    const token = request.cookies.get('token')?.value
    
    // Get session_id from query params (for guests)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    // Fetch the order first
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
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
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // ✅ AUTHENTICATION CHECK
    let isAuthorized = false
    let userRole: string | null = null

    // Case 1: User is logged in (has token)
    if (token) {
      try {
        const { verifyToken } = await import('@/lib/auth')
        const payload = await verifyToken(token)
        userRole = payload.role

        // Admin/Kasir/Owner can access any order
        if (['ADMIN', 'KASIR', 'OWNER'].includes(userRole)) {
          isAuthorized = true
        }
        // Regular user can only access their own orders
        else if (payload.userId === order.userId) {
          isAuthorized = true
        }
      } catch (error) {
        // Token invalid, fall through to guest check
      }
    }

    // Case 2: Guest accessing their order with session_id
    if (!isAuthorized && sessionId) {
      // Guest can only access order if:
      // 1. Order has no userId (guest order)
      // 2. Order's session_id matches the provided sessionId
      if (!order.userId && order.session_id === sessionId) {
        isAuthorized = true
      }
    }

    // ❌ If not authorized, deny access
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to view this order' },
        { status: 403 }
      )
    }

    // ✅ Convert Decimal to number for frontend
    const orderResponse = {
      ...order,
      totalAmount: order.totalAmount.toNumber(),
      items: order.items.map((item) => ({
        ...item,
        price: item.price.toNumber(),
        subtotal: item.subtotal.toNumber(),
      })),
    }

    return NextResponse.json(orderResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT update order status (KASIR/ADMIN only - OWNER blocked)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check permissions - OWNER cannot update order status
    const { response, user } = await withApiPermission(request, {
      allowedRoles: ['KASIR', 'ADMIN'],
      requireWrite: true,
      resource: 'ORDER'
    })

    if (response) return response
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const { status } = await request.json()

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    return handleApiError(error)
  }
}


