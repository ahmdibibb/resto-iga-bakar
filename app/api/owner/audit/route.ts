import { NextRequest, NextResponse } from 'next/server'
import { 
  handleApiError, 
  AuthenticationError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import { getAllAuditLogs, countAuditLogs, AuditAction, AuditResource } from '@/lib/auditLog'

/**
 * GET /api/owner/audit
 * Get all audit logs (OWNER only)
 * OWNER can view all audit logs across the system
 */
export async function GET(request: NextRequest) {
  try {
    // Check permissions - only OWNER can view all audit logs
    const { response, user } = await withApiPermission(request, {
      allowedRoles: ['OWNER'],
      resource: 'AUDIT_LOG'
    })

    if (response) return response
    if (!user) throw new AuthenticationError()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') as AuditAction | undefined
    const resource = searchParams.get('resource') as AuditResource | undefined
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Parse dates
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (startDateParam) {
      startDate = new Date(startDateParam)
      startDate.setHours(0, 0, 0, 0)
    }

    if (endDateParam) {
      endDate = new Date(endDateParam)
      endDate.setHours(23, 59, 59, 999)
    }

    // Calculate offset
    const offset = (page - 1) * limit

    // Get audit logs
    const logs = await getAllAuditLogs({
      limit,
      offset,
      userId,
      action,
      resource,
      startDate,
      endDate
    })

    // Get total count for pagination
    const totalCount = await countAuditLogs({
      userId,
      action,
      resource,
      startDate,
      endDate
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      logs: logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
