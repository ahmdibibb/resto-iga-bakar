import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleApiError, 
  AuthenticationError, 
  AuthorizationError,
  NotFoundError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'

/**
 * PATCH /api/admin/tables/[id]/reset
 * Reset table status to AVAILABLE
 * Protected: ADMIN only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await withApiPermission(request, {
      allowedRoles: ['ADMIN'],
      requireWrite: true,
      resource: 'TABLE'
    })
    if (response) return response

    const { id } = await params

    const table = await prisma.table.findUnique({ where: { id } })
    if (!table) {
      throw new NotFoundError('Table', id)
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: { status: 'AVAILABLE' }
    })

    return NextResponse.json({
      id: updatedTable.id,
      name: updatedTable.name,
      status: updatedTable.status,
      message: `Table ${updatedTable.name} has been reset to AVAILABLE`
    })
  } catch (error) {
    return handleApiError(error)
  }
}
