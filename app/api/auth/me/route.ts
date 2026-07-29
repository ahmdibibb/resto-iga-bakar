import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, AuthenticationError } from '@/lib/errorHandler'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      throw new AuthenticationError('Unauthorized')
    }

    const user = await getCurrentUser(token)

    if (!user) {
      throw new AuthenticationError('Unauthorized')
    }

    return NextResponse.json({ user })
  } catch (error) {
    return handleApiError(error)
  }
}

