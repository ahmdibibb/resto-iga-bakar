/**
 * API Permission Middleware
 * Validates user permissions before allowing access to API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { hasReadAccess, hasWriteAccess, hasDeleteAccess, isOwner, canModifyOwner, UserRole } from './permissions'
import { logPermissionDenial, logOwnerWriteAttempt, AuditResource } from './auditLog'

export interface ApiPermissionResult {
  allowed: boolean
  user?: {
    userId: string
    email: string
    role: UserRole
  }
  error?: string
}

/**
 * Check API permissions for a request
 */
export async function checkApiPermission(
  request: NextRequest,
  options?: {
    allowedRoles?: UserRole[]
    requireWrite?: boolean
    requireDelete?: boolean
    resource?: AuditResource
  }
): Promise<ApiPermissionResult> {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return {
      allowed: false,
      error: 'Authentication required'
    }
  }

  try {
    const payload = await verifyToken(token)
    const userRole = payload.role as UserRole
    const method = request.method
    const pathname = request.nextUrl.pathname

    // Check if role is in allowed roles
    if (options?.allowedRoles && !options.allowedRoles.includes(userRole)) {
      // Log permission denial
      if (options.resource) {
        await logPermissionDenial(
          payload.userId,
          userRole,
          'VIEW',
          options.resource,
          `Access denied. Required role: ${options.allowedRoles.join(' or ')}`,
          { endpoint: pathname, method }
        )
      }
      
      return {
        allowed: false,
        error: `Access denied. Required role: ${options.allowedRoles.join(' or ')}`
      }
    }

    // Check read access for GET requests
    if (method === 'GET') {
      if (!hasReadAccess(userRole, pathname)) {
        // Log permission denial
        if (options?.resource) {
          await logPermissionDenial(
            payload.userId,
            userRole,
            'VIEW',
            options.resource,
            'You do not have permission to view this resource',
            { endpoint: pathname, method }
          )
        }
        
        return {
          allowed: false,
          error: 'You do not have permission to view this resource'
        }
      }
    }

    // Check write access for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (options?.requireWrite !== false && !hasWriteAccess(userRole, pathname)) {
        // Log OWNER write attempt
        if (isOwner(userRole) && options?.resource) {
          await logOwnerWriteAttempt(
            payload.userId,
            options.resource,
            pathname,
            method,
            { endpoint: pathname }
          )
        } else if (options?.resource) {
          await logPermissionDenial(
            payload.userId,
            userRole,
            method === 'POST' ? 'CREATE' : 'UPDATE',
            options.resource,
            'You do not have permission to modify this resource',
            { endpoint: pathname, method }
          )
        }
        
        return {
          allowed: false,
          error: 'You do not have permission to modify this resource. OWNER role has view-only access.'
        }
      }
    }

    // Check delete access for DELETE requests
    if (method === 'DELETE') {
      if (options?.requireDelete !== false && !hasDeleteAccess(userRole, pathname)) {
        // Log OWNER delete attempt
        if (isOwner(userRole) && options?.resource) {
          await logOwnerWriteAttempt(
            payload.userId,
            options.resource,
            pathname,
            method,
            { endpoint: pathname }
          )
        } else if (options?.resource) {
          await logPermissionDenial(
            payload.userId,
            userRole,
            'DELETE',
            options.resource,
            'You do not have permission to delete this resource',
            { endpoint: pathname, method }
          )
        }
        
        return {
          allowed: false,
          error: 'You do not have permission to delete this resource. OWNER role has view-only access.'
        }
      }
    }

    return {
      allowed: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        role: userRole
      }
    }
  } catch (error) {
    return {
      allowed: false,
      error: 'Invalid or expired token'
    }
  }
}

/**
 * Middleware wrapper for API routes
 * Returns 403 if permission check fails
 */
export async function withApiPermission(
  request: NextRequest,
  options?: {
    allowedRoles?: UserRole[]
    requireWrite?: boolean
    requireDelete?: boolean
    resource?: AuditResource
  }
): Promise<{ response?: NextResponse; user?: ApiPermissionResult['user'] }> {
  const result = await checkApiPermission(request, options)

  if (!result.allowed) {
    return {
      response: NextResponse.json(
        { error: result.error || 'Access denied' },
        { status: 403 }
      )
    }
  }

  return { user: result.user }
}

/**
 * Check if user is trying to modify OWNER account
 * ADMIN users cannot create/edit/delete OWNER accounts
 */
export function isModifyingOwnerAccount(
  userRole: string,
  targetRole?: string,
  targetUserId?: string
): { allowed: boolean; error?: string } {
  // If target role is OWNER
  if (targetRole === 'OWNER') {
    // Only OWNER users can modify OWNER accounts
    if (!canModifyOwner(userRole)) {
      return {
        allowed: false,
        error: 'Only OWNER users can create or modify OWNER accounts'
      }
    }
  }

  // ADMIN trying to create OWNER
  if (userRole === 'ADMIN' && targetRole === 'OWNER') {
    return {
      allowed: false,
      error: 'ADMIN users cannot create OWNER accounts'
    }
  }

  return { allowed: true }
}

/**
 * Filter out OWNER accounts from user list for non-OWNER users
 */
export function filterOwnerAccounts<T extends { role: string }>(
  users: T[],
  requestingUserRole: string
): T[] {
  // OWNER can see all users including other OWNERs
  if (isOwner(requestingUserRole)) {
    return users
  }

  // Other roles cannot see OWNER accounts
  return users.filter(user => user.role !== 'OWNER')
}

/**
 * Check if OWNER user is attempting write operation
 */
export function isOwnerWriteAttempt(role: string, method: string): boolean {
  if (!isOwner(role)) {
    return false
  }

  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  return writeMethods.includes(method)
}

/**
 * Get permission error message for OWNER
 */
export function getOwnerPermissionError(action: string): string {
  return `You do not have permission to ${action}. OWNER role has view-only access to operational data.`
}

/**
 * Validate request has required role
 */
export function requireRole(userRole: string, requiredRoles: UserRole[]): { valid: boolean; error?: string } {
  if (!requiredRoles.includes(userRole as UserRole)) {
    return {
      valid: false,
      error: `Access denied. Required role: ${requiredRoles.join(' or ')}`
    }
  }
  return { valid: true }
}
