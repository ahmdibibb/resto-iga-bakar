import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleApiError, 
  AuthenticationError, 
  AuthorizationError,
  OrderValidationError,
  NotFoundError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'

/**
 * POST /api/admin/tables/generate-qr
 * Generate QR code URL for a table
 * Protected: ADMIN only
 */
export async function POST(request: NextRequest) {
  try {
    const { response } = await withApiPermission(request, {
      allowedRoles: ['ADMIN'],
      requireWrite: true,
      resource: 'TABLE'
    })
    if (response) return response

    const body = await request.json()
    const { tableId } = body

    if (!tableId) {
      throw new OrderValidationError('Table ID is required', 'tableId')
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId }
    })

    if (!table) {
      throw new NotFoundError('Table', tableId)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // CRITICAL: Different URL format for TAKEAWAY vs regular tables
    let qr_url: string
    if (table.name === 'TAKEAWAY') {
      qr_url = `${baseUrl}/menu?takeaway=true&token=${table.qr_token}`
    } else {
      qr_url = `${baseUrl}/menu?table=${table.id}&token=${table.qr_token}`
    }

    return NextResponse.json({
      table: {
        id: table.id,
        name: table.name,
        qr_token: table.qr_token,
        qr_url,
        status: table.status
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
