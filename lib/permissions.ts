/**
 * Permission checking utilities for role-based access control
 */

export type UserRole = 'OWNER' | 'ADMIN' | 'KASIR' | 'USER'

export interface PermissionCheck {
  role: UserRole
  resource: string
  action: 'read' | 'write' | 'delete'
}

/**
 * Check if user is OWNER
 */
export function isOwner(role: string): boolean {
  return role === 'OWNER'
}

/**
 * Check if user is ADMIN
 */
export function isAdmin(role: string): boolean {
  return role === 'ADMIN'
}

/**
 * Check if user is KASIR
 */
export function isKasir(role: string): boolean {
  return role === 'KASIR'
}

/**
 * Check if user can modify OWNER accounts
 * Only OWNER users can create/edit/delete OWNER accounts
 */
export function canModifyOwner(role: string): boolean {
  return role === 'OWNER'
}

/**
 * Check if user has read access to a resource
 */
export function hasReadAccess(role: UserRole, resource: string): boolean {
  // OWNER has read access to everything
  if (role === 'OWNER') {
    return true
  }

  // ADMIN has read access to everything except OWNER-specific resources
  if (role === 'ADMIN') {
    return !resource.startsWith('/owner')
  }

  // KASIR has limited read access
  if (role === 'KASIR') {
    const kasirReadResources = ['/orders', '/products']
    return kasirReadResources.some(r => resource.startsWith(r))
  }

  // USER has minimal read access
  if (role === 'USER') {
    const userReadResources = ['/menu', '/orders', '/products']
    return userReadResources.some(r => resource.startsWith(r))
  }

  return false
}

/**
 * Check if user has write access to a resource
 */
export function hasWriteAccess(role: UserRole, resource: string): boolean {
  // OWNER has NO write access (view-only)
  if (role === 'OWNER') {
    // Exception: OWNER can create other OWNER accounts
    if (resource === '/api/owner/users' || resource === '/owner/users') {
      return true
    }
    return false
  }

  // ADMIN has write access to most resources
  if (role === 'ADMIN') {
    // ADMIN cannot modify OWNER accounts
    if (resource.includes('/owner') || resource.includes('role=OWNER')) {
      return false
    }
    return true
  }

  // KASIR has limited write access
  if (role === 'KASIR') {
    const kasirWriteResources = ['/orders']
    return kasirWriteResources.some(r => resource.startsWith(r))
  }

  // USER has minimal write access
  if (role === 'USER') {
    const userWriteResources = ['/orders', '/cart']
    return userWriteResources.some(r => resource.startsWith(r))
  }

  return false
}

/**
 * Check if user has delete access to a resource
 */
export function hasDeleteAccess(role: UserRole, resource: string): boolean {
  // OWNER has NO delete access
  if (role === 'OWNER') {
    return false
  }

  // ADMIN has delete access except for OWNER accounts
  if (role === 'ADMIN') {
    if (resource.includes('/owner') || resource.includes('role=OWNER')) {
      return false
    }
    return true
  }

  // KASIR and USER have no delete access
  return false
}

/**
 * Permission matrix for quick reference
 */
export const PERMISSIONS = {
  OWNER: {
    dashboard: ['read'],
    analytics: ['read', 'export'],
    reports: ['read', 'download'],
    products: ['read'],
    orders: ['read'],
    users: ['read'],
    qr: [],
    financial: ['read'],
    ownerAccounts: ['create', 'read', 'update', 'delete']
  },
  ADMIN: {
    dashboard: ['read', 'write'],
    analytics: ['read', 'export_limited'],
    reports: ['read', 'download_operational'],
    products: ['create', 'read', 'update', 'delete'],
    orders: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'], // except OWNER
    qr: ['generate'],
    financial: ['read_limited'],
    ownerAccounts: [] // no access
  },
  KASIR: {
    orders: ['create', 'read', 'update_status'],
    products: ['read']
  },
  USER: {
    orders: ['create', 'read'],
    products: ['read'],
    cart: ['create', 'read', 'update', 'delete']
  }
} as const

/**
 * Check if role has specific permission
 */
export function hasPermission(
  role: UserRole,
  resource: keyof typeof PERMISSIONS.OWNER,
  action: string
): boolean {
  const rolePermissions = PERMISSIONS[role] as any
  if (!rolePermissions || !rolePermissions[resource]) {
    return false
  }
  return rolePermissions[resource].includes(action)
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole) {
  return PERMISSIONS[role] || {}
}
