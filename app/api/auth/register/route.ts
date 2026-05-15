import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import { validateRegistrationData } from '@/lib/validation'
import { handleApiError, OrderValidationError, ConflictError } from '@/lib/errorHandler'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate all fields are present
    if (!email || !password || !name) {
      throw new OrderValidationError('Semua field harus diisi (nama, email, dan password)')
    }

    // Validate data format and password strength
    const validation = validateRegistrationData({ name, email, password })

    if (!validation.isValid) {
      // Combine all validation errors into a single message
      const errorMessages: string[] = []

      if (validation.errors.name) {
        errorMessages.push(...validation.errors.name)
      }
      if (validation.errors.email) {
        errorMessages.push(...validation.errors.email)
      }
      if (validation.errors.password) {
        errorMessages.push(...validation.errors.password)
      }

      throw new OrderValidationError(errorMessages.join(', '))
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      throw new ConflictError('Email sudah terdaftar. Silakan gunakan email lain atau login.')
    }

    const hashedPassword = await hashPassword(password)

    // Register only allows USER role
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        role: 'USER',
      },
    })

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

