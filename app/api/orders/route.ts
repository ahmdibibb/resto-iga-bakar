import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { 
  handleApiError, 
  OrderValidationError, 
  NotFoundError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import { orderEventEmitter } from '@/lib/orderEvents'

// GET all orders (OWNER and ADMIN can see all, USER sees only their own)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    // If no token, return empty (guest can't list all orders)
    if (!token) {
      return NextResponse.json([])
    }

    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json([])
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let where: any = {}

    // If user is not ADMIN or OWNER, only show their own orders
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      where.userId = user.id
    }

    // Apply filters
    if (status) {
      where.status = status
    }

    if (paymentMethod) {
      where.payment_method = paymentMethod
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const orders = await prisma.order.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
    })

    // Convert Decimal to number for frontend
    const ordersResponse = orders.map((order) => ({
      ...order,
      totalAmount: order.totalAmount.toNumber(),
      items: order.items.map((item) => ({
        ...item,
        price: item.price.toNumber(),
        subtotal: item.subtotal.toNumber(),
      })),
      payment: order.payment
        ? {
          ...order.payment,
          amount: order.payment.amount.toNumber(),
        }
        : null,
    }))

    return NextResponse.json(ordersResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST create order (Guest or Authenticated)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      items, 
      orderType, 
      tableNumber, 
      notes, 
      customerName,
      session_id,
      table_id,
      payment_method
    } = body

    // Orders created via checkout are guest orders.
    // We do not associate them with logged-in staff accounts (ADMIN, KASIR, OWNER).
    const userId: string | null = null

    // Validation: items
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new OrderValidationError('Items are required', 'items')
    }

    // Validate each item has valid quantity
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        throw new OrderValidationError('Invalid product ID', 'items')
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new OrderValidationError('Quantity harus minimal 1', 'quantity')
      }
      if (item.quantity > 100) {
        throw new OrderValidationError('Quantity maksimal 100 per item', 'quantity')
      }
    }

    // Validation: orderType
    if (!orderType || !['DINE_IN', 'TAKEAWAY'].includes(orderType)) {
      throw new OrderValidationError('Order type harus Dine-in atau Takeaway', 'orderType')
    }

    // Validation: tableNumber for DINE_IN (legacy support)
    if (orderType === 'DINE_IN' && !table_id && (!tableNumber || !tableNumber.trim())) {
      throw new OrderValidationError('Nomor meja wajib diisi untuk Dine-in', 'tableNumber')
    }

    // Validation: customerName for guest orders
    if (!userId && (!customerName || !customerName.trim())) {
      throw new OrderValidationError('Nama customer wajib diisi', 'customerName')
    }

    // Validation: session_id for anonymous orders
    if (!userId && session_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(session_id)) {
        throw new OrderValidationError('Invalid session ID format', 'session_id')
      }
    }

    // Validation: payment_method — must match PaymentMethod enum (CASH, QRIS)
    if (payment_method && !['CASH', 'QRIS'].includes(payment_method)) {
      throw new OrderValidationError('Invalid payment method. Allowed: CASH, QRIS.', 'payment_method')
    }

    // Validation: table availability for DINE_IN orders with table_id
    if (orderType === 'DINE_IN' && table_id) {
      const { validateTableAvailability } = await import('@/lib/tableValidation')
      const qr_token = body.qr_token
      
      if (!qr_token) {
        throw new OrderValidationError('QR token is required for table orders', 'qr_token')
      }
      
      const tableValidation = await validateTableAvailability(table_id, qr_token)
      
      if (!tableValidation.valid) {
        throw new OrderValidationError(tableValidation.error || 'Table validation failed', 'table_id')
      }
    }

    // Validate and calculate total
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        throw new NotFoundError('Product', item.productId)
      }

      if (!product.isActive) {
        throw new OrderValidationError(`Product ${product.name} is not available`, 'productId')
      }

      if (product.stock < item.quantity) {
        throw new OrderValidationError(`Stok tidak cukup untuk ${product.name}`, 'quantity')
      }

      const subtotal = product.price.toNumber() * item.quantity
      totalAmount += subtotal

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal: new Prisma.Decimal(subtotal),
      })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Determine order status and payment status based on payment method
    // Simplified flow: No IN_KITCHEN status, kitchen is outside the system
    let orderStatus: 'PENDING_PAYMENT' | 'COMPLETED' = 'PENDING_PAYMENT'
    let paymentStatus: 'UNPAID' | 'PAID' = 'UNPAID'

    if (payment_method === 'QRIS') {
      // QRIS: Wait for customer payment
      orderStatus = 'PENDING_PAYMENT'
      paymentStatus = 'UNPAID'
    } else if (payment_method === 'CASH') {
      // CASH: Wait for kasir confirmation, then goes to COMPLETED
      orderStatus = 'PENDING_PAYMENT'
      paymentStatus = 'UNPAID'
    } else {
      // Default for legacy orders without payment method
      orderStatus = 'PENDING_PAYMENT'
      paymentStatus = 'UNPAID'
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId,
        session_id: session_id || null,
        table_id: orderType === 'DINE_IN' ? (table_id || null) : null,
        customerName: customerName?.trim() || null,
        totalAmount: new Prisma.Decimal(totalAmount),
        status: orderStatus,
        payment_status: paymentStatus,
        payment_method: payment_method || null,
        orderType: orderType as 'DINE_IN' | 'TAKEAWAY',
        tableNumber: orderType === 'DINE_IN' ? (tableNumber || null) : null,
        notes: notes || null,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        table: true,
      },
    })

    // Update stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })

      await prisma.stockHistory.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'OUT',
          description: `Order ${orderNumber}`,
        },
      })
    }

    // Update table status to OCCUPIED if table_id is provided and order type is DINE_IN
    if (orderType === 'DINE_IN' && table_id) {
      await prisma.table.update({
        where: { id: table_id },
        data: { status: 'OCCUPIED' }
      })
    }

    // Generate QRIS code if payment method is QRIS
    let qrisData = null
    if (payment_method === 'QRIS') {
      const { generateQRIS } = await import('@/lib/xendit')
      const qrisResponse = await generateQRIS(order.id, totalAmount)
      
      // Create payment record with QRIS data
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: 'QRIS',
          amount: new Prisma.Decimal(totalAmount),
          status: 'PENDING',
          transactionId: qrisResponse.transaction_id,
          qris_string: qrisResponse.qr_string,
          expires_at: new Date(qrisResponse.expires_at)
        }
      })

      qrisData = {
        qr_string: qrisResponse.qr_string,
        transaction_id: qrisResponse.transaction_id,
        expires_at: qrisResponse.expires_at
      }

      // Schedule payment timeout (10 minutes)
      const { schedulePaymentTimeout } = await import('@/lib/paymentTimeout')
      schedulePaymentTimeout(order.id)
    }

    // Convert Decimal to number for frontend
    const orderResponse = {
      ...order,
      totalAmount: order.totalAmount.toNumber(),
      items: order.items.map((item) => ({
        ...item,
        price: item.price.toNumber(),
        subtotal: item.subtotal.toNumber(),
      })),
      qris: qrisData
    }

    // Emit event for real-time cashier dashboard
    orderEventEmitter.emit('orderCreate', { id: order.id, orderNumber })

    return NextResponse.json(orderResponse, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}


