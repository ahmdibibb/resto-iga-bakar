import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { handleApiError, OrderValidationError, NotFoundError, ConflictError } from '@/lib/errorHandler'
import { orderEventEmitter } from '@/lib/orderEvents'

// POST create payment (Guest or Authenticated)
export async function POST(request: NextRequest) {
  try {
    const { orderId, method } = await request.json()

    if (!orderId || !method) {
      throw new OrderValidationError('Order ID and payment method are required')
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId },
    })

    if (existingPayment && existingPayment.status === 'PAID') {
      throw new ConflictError('Order already paid')
    }

    // Generate transaction ID for QRIS
    let transactionId: string | null = null
    if (method === 'QRIS') {
      transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }

    // Validate payment method enum
    const validMethods = ['CASH', 'QRIS']
    if (!validMethods.includes(method)) {
      throw new OrderValidationError('Invalid payment method')
    }

    // Simulate payment processing
    const paymentStatus = 'PAID'

    // Ensure amount is properly formatted as Decimal
    let paymentAmount: Prisma.Decimal
    if (order.totalAmount instanceof Prisma.Decimal) {
      paymentAmount = order.totalAmount
    } else if (typeof order.totalAmount === 'string') {
      paymentAmount = new Prisma.Decimal(order.totalAmount)
    } else if (typeof order.totalAmount === 'number') {
      paymentAmount = new Prisma.Decimal(order.totalAmount)
    } else {
      paymentAmount = new Prisma.Decimal(String(order.totalAmount))
    }

    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: {
        method: method as 'CASH' | 'QRIS',
        status: paymentStatus as 'PAID',
        transactionId,
        paidAt: paymentStatus === 'PAID' ? new Date() : null,
        amount: paymentAmount,
      },
      create: {
        orderId,
        method: method as 'CASH' | 'QRIS',
        amount: paymentAmount,
        status: paymentStatus as 'PAID',
        transactionId,
        paidAt: paymentStatus === 'PAID' ? new Date() : null,
      },
    })

    // Update order status to CONFIRMED after payment
    if (paymentStatus === 'PAID') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
      })

      // Emit event for real-time cashier dashboard
      orderEventEmitter.emit('orderUpdate', { id: orderId, status: 'CONFIRMED', payment_status: 'PAID' })
    }

    // Convert Decimal to number for frontend
    const paymentResponse = {
      ...payment,
      amount: payment.amount.toNumber(),
    }

    return NextResponse.json(paymentResponse, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}


