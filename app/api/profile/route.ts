import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { 
  handleApiError, 
  AuthenticationError,
  NotFoundError,
  OrderValidationError
} from '@/lib/errorHandler'

// GET user profile
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value

        if (!token) {
            throw new AuthenticationError()
        }

        const user = await getCurrentUser(token)

        if (!user) {
            throw new AuthenticationError()
        }

        // Get user with order count
        const userWithStats = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
        })

        if (!userWithStats) {
            throw new NotFoundError('User', user.id)
        }

        return NextResponse.json({
            ...userWithStats,
            totalOrders: userWithStats._count.orders,
        })
    } catch (error) {
        return handleApiError(error)
    }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value

        if (!token) {
            throw new AuthenticationError()
        }

        const user = await getCurrentUser(token)

        if (!user) {
            throw new AuthenticationError()
        }

        const { name, email, currentPassword, newPassword } = await request.json()

        // Validate input
        if (!name || !email) {
            throw new OrderValidationError('Name and email are required')
        }

        // Check if email is already taken by another user
        if (email !== user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email },
            })

            if (existingUser) {
                throw new OrderValidationError('Email already in use', 'email')
            }
        }

        // Prepare update data
        const updateData: any = {
            name,
            email,
        }

        // If changing password, verify current password
        if (newPassword) {
            if (!currentPassword) {
                throw new OrderValidationError('Current password is required to change password', 'currentPassword')
            }

            const currentUser = await prisma.user.findUnique({
                where: { id: user.id },
            })

            if (!currentUser) {
                throw new NotFoundError('User', user.id)
            }

            const isPasswordValid = await bcrypt.compare(
                currentPassword,
                currentUser.password
            )

            if (!isPasswordValid) {
                throw new OrderValidationError('Current password is incorrect', 'currentPassword')
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10)
            updateData.password = hashedPassword
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        return handleApiError(error)
    }
}
