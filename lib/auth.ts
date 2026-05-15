import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const encodedKey = new TextEncoder().encode(secretKey)
const JWT_EXPIRATION = (process.env.JWT_EXPIRATION || '7d') as `${number}${'s'|'m'|'h'|'d'|'w'}`

// Role cache to minimize database queries
// Cache expires after 5 minutes
const roleCache = new Map<string, { role: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

export interface JWTPayload {
  userId: string
  email: string
  role: string
  [key: string]: any
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(encodedKey)
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, encodedKey)
  return payload as JWTPayload
}

export async function getCurrentUser(token: string) {
  try {
    const payload = await verifyToken(token)
    
    // Check cache first
    const cached = roleCache.get(payload.userId)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // Return cached role data
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name || '',
        role: cached.role,
      }
    }
    
    // Cache miss or expired - fetch from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })
    
    // Update cache
    if (user) {
      roleCache.set(user.id, {
        role: user.role,
        timestamp: now,
      })
    }
    
    return user
  } catch {
    return null
  }
}

/**
 * Invalidate role cache for a specific user
 * Call this when a user's role changes
 */
export function invalidateRoleCache(userId: string) {
  roleCache.delete(userId)
}

/**
 * Clear all role cache
 * Useful for testing or when needed
 */
export function clearRoleCache() {
  roleCache.clear()
}

