import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { validateEmail } from '@/lib/validation'
import { handleApiError, AuthenticationError, AuthorizationError, OrderValidationError, ConflictError, NotFoundError } from '@/lib/errorHandler'
import { withApiPermission, filterOwnerAccounts, isModifyingOwnerAccount } from '@/lib/apiPermissions'
import { logAdminOwnerModificationAttempt } from '@/lib/auditLog'

// GET all users (OWNER and ADMIN - OWNER cannot see other OWNER accounts)
export async function GET(request: NextRequest) {
    try {
        // Check permissions
        const { response, user } = await withApiPermission(request, {
            allowedRoles: ['OWNER', 'ADMIN'],
            resource: 'USER'
        })

        if (response) return response
        if (!user) throw new AuthenticationError()

        const searchParams = request.nextUrl.searchParams
        const role = searchParams.get('role')

        const where: any = {}
        if (role) where.role = role

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        })

        // Filter out OWNER accounts for non-OWNER users
        const filteredUsers = filterOwnerAccounts(users, user.role)

        return NextResponse.json(filteredUsers)
    } catch (error) {
        return handleApiError(error)
    }
}

// POST create user (ADMIN only - OWNER blocked, ADMIN cannot create OWNER accounts)
export async function POST(request: NextRequest) {
    try {
        // Check permissions - OWNER cannot create users
        const { response, user } = await withApiPermission(request, {
            allowedRoles: ['ADMIN'],
            requireWrite: true,
            resource: 'USER'
        })

        if (response) return response
        if (!user) throw new AuthenticationError()

        const { email, name, password, role } = await request.json()

        // Validation
        if (!email || !name || !password || !role) {
            throw new OrderValidationError('All fields are required')
        }

        // Check if ADMIN is trying to create OWNER account
        const ownerCheck = isModifyingOwnerAccount(user.role, role)
        if (!ownerCheck.allowed) {
            await logAdminOwnerModificationAttempt(user.userId, 'CREATE', '', {
                targetRole: role,
                endpoint: '/api/admin/users'
            })
            return NextResponse.json({ error: ownerCheck.error }, { status: 403 })
        }

        if (!['USER', 'ADMIN', 'KASIR'].includes(role)) {
            throw new OrderValidationError('Invalid role')
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            throw new ConflictError('Email already exists')
        }

        // Hash password
        const hashedPassword = await hashPassword(password)

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        })

        return NextResponse.json(newUser, { status: 201 })
    } catch (error) {
        return handleApiError(error)
    }
}
