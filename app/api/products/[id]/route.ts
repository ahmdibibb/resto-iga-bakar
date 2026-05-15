import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { 
  handleApiError, 
  AuthenticationError, 
  AuthorizationError,
  NotFoundError,
  OrderValidationError
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 16+
    const { id } = await params

    if (!id) {
      throw new OrderValidationError('Product ID is required', 'id')
    }

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new NotFoundError('Product', id)
    }

    // Convert Decimal to number for frontend
    const productResponse = {
      ...product,
      price: product.price.toNumber(),
    }

    return NextResponse.json(productResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT update product (Admin only - OWNER blocked)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 16+
    const { id } = await params

    // Check permissions - OWNER cannot update products
    const { response, user } = await withApiPermission(request, {
      allowedRoles: ['ADMIN'],
      requireWrite: true,
      resource: 'PRODUCT'
    })

    if (response) return response
    if (!user) throw new AuthenticationError()

    if (!id) {
      throw new OrderValidationError('Product ID is required', 'id')
    }

    const { name, description, price, image, category, stock, isActive } =
      await request.json()

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: price ? new Prisma.Decimal(parseFloat(price)) : undefined,
        image,
        category,
        stock,
        isActive,
      },
    })

    // Convert Decimal to number for frontend
    const productResponse = {
      ...product,
      price: product.price.toNumber(),
    }

    return NextResponse.json(productResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE product (Admin only - OWNER blocked) - Soft delete to preserve order history
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 16+
    const { id } = await params

    // Check permissions - OWNER cannot delete products
    const { response, user } = await withApiPermission(request, {
      allowedRoles: ['ADMIN'],
      requireDelete: true,
      resource: 'PRODUCT'
    })

    if (response) return response
    if (!user) throw new AuthenticationError()

    if (!id) {
      throw new OrderValidationError('Product ID is required', 'id')
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true }
        }
      }
    })

    if (!product) {
      throw new NotFoundError('Product', id)
    }

    // Check if product has been ordered
    const hasOrders = product._count.orderItems > 0

    if (hasOrders) {
      // Soft delete: Set isActive to false to preserve order history
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      })

      return NextResponse.json({ 
        message: 'Product deactivated successfully (has order history)',
        softDelete: true,
        orderCount: product._count.orderItems
      })
    } else {
      // Hard delete: Product has never been ordered, safe to delete
      await prisma.product.delete({
        where: { id },
      })

      return NextResponse.json({ 
        message: 'Product deleted successfully',
        softDelete: false
      })
    }
  } catch (error) {
    return handleApiError(error)
  }
}

