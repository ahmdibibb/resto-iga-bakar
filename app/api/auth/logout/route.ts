import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError } from '@/lib/errorHandler'
import { logUserAction } from '@/lib/auditLog'

const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (token) {
      const user = await getCurrentUser(token)
      if (user) {
        await logUserAction(
          user.id,
          user.role as UserRole,
          'LOGOUT',
          'USER',
          'SUCCESS',
          {
            endpoint: '/api/auth/logout',
            method: 'POST',
            ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
            userAgent: request.headers.get('user-agent') ?? undefined,
          }
        )
      }
    }

    const isSecure = request.headers.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production'

    const response = NextResponse.json({ message: 'Logged out successfully' })
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    })
    return response
  } catch (error) {
    return handleApiError(error)
  }
}
