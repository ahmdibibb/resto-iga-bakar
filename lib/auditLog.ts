/**
 * Audit Logging Service
 * Logs all sensitive operations and permission denials for security and compliance
 */

import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'EXPORT'
  | 'PERMISSION_DENIED'
  | 'LOGIN'
  | 'LOGOUT'

export type AuditResource = 
  | 'USER' 
  | 'PRODUCT' 
  | 'ORDER' 
  | 'ANALYTICS' 
  | 'REPORT'
  | 'PAYMENT'
  | 'TABLE'
  | 'AUDIT_LOG'
  | 'FINANCIAL'

export type AuditResult = 'SUCCESS' | 'DENIED' | 'FAILED'

export interface AuditLogMetadata {
  targetUserId?: string
  targetUserRole?: string
  targetResourceId?: string
  endpoint?: string
  method?: string
  reason?: string
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
  [key: string]: any
}

/**
 * Log a user action to the audit trail
 */
export async function logUserAction(
  userId: string,
  userRole: UserRole,
  action: AuditAction,
  resource: AuditResource,
  result: AuditResult,
  metadata?: AuditLogMetadata
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userRole,
        action,
        resource,
        result,
        metadata: metadata ? JSON.stringify(metadata) : null,
        timestamp: new Date()
      }
    })
  } catch (error) {
    // Log to console if database logging fails
    console.error('Failed to create audit log:', error)
    console.error('Audit log details:', {
      userId,
      userRole,
      action,
      resource,
      result,
      metadata
    })
  }
}

/**
 * Log a permission denial attempt
 */
export async function logPermissionDenial(
  userId: string,
  userRole: UserRole,
  action: AuditAction,
  resource: AuditResource,
  reason: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  await logUserAction(
    userId,
    userRole,
    'PERMISSION_DENIED',
    resource,
    'DENIED',
    {
      ...metadata,
      attemptedAction: action,
      reason
    }
  )
}

/**
 * Log an account modification attempt
 */
export async function logAccountModification(
  userId: string,
  userRole: UserRole,
  action: AuditAction,
  targetUserId: string,
  targetUserRole: string,
  result: AuditResult,
  metadata?: AuditLogMetadata
): Promise<void> {
  await logUserAction(
    userId,
    userRole,
    action,
    'USER',
    result,
    {
      ...metadata,
      targetUserId,
      targetUserRole
    }
  )
}

/**
 * Log OWNER write attempt (should always be denied)
 */
export async function logOwnerWriteAttempt(
  userId: string,
  resource: AuditResource,
  endpoint: string,
  method: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  await logPermissionDenial(
    userId,
    'OWNER',
    method === 'DELETE' ? 'DELETE' : method === 'POST' ? 'CREATE' : 'UPDATE',
    resource,
    'OWNER role has view-only access to operational data',
    {
      ...metadata,
      endpoint,
      method
    }
  )
}

/**
 * Log ADMIN attempting to modify OWNER account
 */
export async function logAdminOwnerModificationAttempt(
  userId: string,
  action: AuditAction,
  targetUserId: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  await logAccountModification(
    userId,
    'ADMIN',
    action,
    targetUserId,
    'OWNER',
    'DENIED',
    {
      ...metadata,
      reason: 'ADMIN users cannot create or modify OWNER accounts'
    }
  )
}

/**
 * Log successful analytics or report access
 */
export async function logAnalyticsAccess(
  userId: string,
  userRole: UserRole,
  reportType: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  await logUserAction(
    userId,
    userRole,
    'VIEW',
    'ANALYTICS',
    'SUCCESS',
    {
      ...metadata,
      reportType
    }
  )
}

/**
 * Log report export
 */
export async function logReportExport(
  userId: string,
  userRole: UserRole,
  reportType: string,
  format: 'PDF' | 'CSV',
  metadata?: AuditLogMetadata
): Promise<void> {
  await logUserAction(
    userId,
    userRole,
    'EXPORT',
    'REPORT',
    'SUCCESS',
    {
      ...metadata,
      reportType,
      format
    }
  )
}

/**
 * Get audit logs for a specific user
 */
export async function getAuditLogsForUser(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
    action?: AuditAction
    resource?: AuditResource
  }
): Promise<any[]> {
  const where: any = { userId }

  if (options?.action) {
    where.action = options.action
  }

  if (options?.resource) {
    where.resource = options.resource
  }

  if (options?.startDate || options?.endDate) {
    where.timestamp = {}
    if (options.startDate) {
      where.timestamp.gte = options.startDate
    }
    if (options.endDate) {
      where.timestamp.lte = options.endDate
    }
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0
  })
}

/**
 * Get all audit logs (OWNER only)
 */
export async function getAllAuditLogs(
  options?: {
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
    userId?: string
    action?: AuditAction
    resource?: AuditResource
  }
): Promise<any[]> {
  const where: any = {}

  if (options?.userId) {
    where.userId = options.userId
  }

  if (options?.action) {
    where.action = options.action
  }

  if (options?.resource) {
    where.resource = options.resource
  }

  if (options?.startDate || options?.endDate) {
    where.timestamp = {}
    if (options.startDate) {
      where.timestamp.gte = options.startDate
    }
    if (options.endDate) {
      where.timestamp.lte = options.endDate
    }
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0
  })
}

/**
 * Count audit logs matching criteria
 */
export async function countAuditLogs(
  options?: {
    userId?: string
    action?: AuditAction
    resource?: AuditResource
    startDate?: Date
    endDate?: Date
  }
): Promise<number> {
  const where: any = {}

  if (options?.userId) {
    where.userId = options.userId
  }

  if (options?.action) {
    where.action = options.action
  }

  if (options?.resource) {
    where.resource = options.resource
  }

  if (options?.startDate || options?.endDate) {
    where.timestamp = {}
    if (options.startDate) {
      where.timestamp.gte = options.startDate
    }
    if (options.endDate) {
      where.timestamp.lte = options.endDate
    }
  }

  return await prisma.auditLog.count({ where })
}
