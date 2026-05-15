import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'
import { validateLoginData } from '@/lib/validation'
import { handleApiError, OrderValidationError, AuthenticationError } from '@/lib/errorHandler'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate all fields are present
    if (!email || !password) {
      throw new OrderValidationError('Email dan password harus diisi')
    }

    // Validate data format
    const validation = validateLoginData({ email, password })

    if (!validation.isValid) {
      const errorMessages: string[] = []

      if (validation.errors.email) {
        errorMessages.push(...validation.errors.email)
      }
      if (validation.errors.password) {
        errorMessages.push(...validation.errors.password)
      }

      throw new OrderValidationError(errorMessages.join(', '))
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      throw new AuthenticationError('Email atau password salah')
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      throw new AuthenticationError('Email atau password salah')
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    return handleApiError(error)
  }
}

