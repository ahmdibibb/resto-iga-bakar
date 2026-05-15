import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError, AuthenticationError, AuthorizationError } from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'

/**
 * GET /api/admin/tables
 * Fetch all tables with their status
 * Protected: ADMIN only
 */
export async function GET(request: NextRequest) {
  try {
    const { response } = await withApiPermission(request, {
      allowedRoles: ['ADMIN'],
      resource: 'TABLE'
    })
    if (response) return response

    const tables = await prisma.table.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(tables)
  } catch (error) {
    return handleApiError(error)
  }
}
