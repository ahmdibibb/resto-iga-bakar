import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { validateEmail, validatePassword } from '@/lib/validation'
import { 
  handleApiError, 
  AuthenticationError, 
  OrderValidationError, 
  ConflictError 
} from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import { logUserAction } from '@/lib/auditLog'

/**
 * POST /api/owner/users
 * Create OWNER account (OWNER only)
 * Only OWNER users can create new OWNER accounts
 */
export async function POST(request: NextRequest) {
  try {
    // Check permissions - only OWNER can create OWNER accounts
    const { response, user } = await withApiPermission(request, {
      allowedRoles: ['OWNER'],
      requireWrite: true,
      resource: 'USER'
    })

    if (response) return response
    if (!user) throw new AuthenticationError()

    const { email, name, password } = await request.json()

    // Validation
    if (!email || !name || !password) {
      throw new OrderValidationError('Email, name, and password are required')
    }

    // Validate email format using centralized validator
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      throw new OrderValidationError(emailValidation.error || 'Invalid email format', 'email')
    }

    // Validate password strength using centralized validator
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      throw new OrderValidationError(passwordValidation.errors.join(', '), 'password')
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      throw new ConflictError('Email already exists')
    }

    // Hash password using centralized function
    const hashedPassword = await hashPassword(password)

    // Create OWNER user
    const newOwner = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'OWNER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    // Log the account creation
    await logUserAction(
      user.userId,
      user.role,
      'CREATE',
      'USER',
      'SUCCESS',
      {
        targetUserId: newOwner.id,
        targetUserRole: 'OWNER',
        endpoint: '/api/owner/users'
      }
    )

    return NextResponse.json(
      {
        ...newOwner,
        message: 'OWNER account created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
