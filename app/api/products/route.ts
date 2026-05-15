import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, AuthenticationError, AuthorizationError, OrderValidationError } from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'

// GET all products (accessible by OWNER, ADMIN, and public)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const includeStock = searchParams.get('includeStock') === 'true'

    const where: any = {}
    if (category) where.category = category
    if (isActive !== null) where.isActive = isActive === 'true'

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Convert Decimal to number for frontend
    const productsResponse = products.map((product) => {
      const productData: any = {
        ...product,
        price: product.price.toNumber(),
      }

      // Include stock information if requested (for OWNER/ADMIN)
      if (includeStock) {
        productData.stock = product.stock
        productData.lowStock = product.stock < 10 // Low stock alert threshold
      }

      return productData
    })

    return NextResponse.json(productsResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST create product (Admin only - OWNER blocked)
export async function POST(request: NextRequest) {
  try {
    // Check permissions - OWNER cannot create products
    const { response, user } = await withApiPermission(request, {
      allowedRoles: ['ADMIN'],
      requireWrite: true,
      resource: 'PRODUCT'
    })

    if (response) return response
    if (!user) throw new AuthenticationError()

    const { name, description, price, image, category, stock } =
      await request.json()

    if (!name || !price) {
      throw new OrderValidationError('Name and price are required')
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: new Prisma.Decimal(parseFloat(price)),
        image,
        category,
        stock: stock || 0,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

