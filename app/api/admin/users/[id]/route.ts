import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { handleApiError, AuthenticationError, AuthorizationError, OrderValidationError, ConflictError, NotFoundError } from '@/lib/errorHandler'
import { withApiPermission, isModifyingOwnerAccount } from '@/lib/apiPermissions'
import { logAdminOwnerModificationAttempt } from '@/lib/auditLog'

// GET user by ID (OWNER and ADMIN - OWNER cannot view other OWNER accounts)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check permissions
        const { response, user } = await withApiPermission(request, {
            allowedRoles: ['OWNER', 'ADMIN'],
            resource: 'USER'
        })

        if (response) return response
        if (!user) throw new AuthenticationError()

        const { id } = await params

        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        if (!targetUser) {
            throw new NotFoundError('User', id)
        }

        // Block non-OWNER users from viewing OWNER accounts
        if (targetUser.role === 'OWNER' && user.role !== 'OWNER') {
            throw new AuthorizationError('You do not have permission to view OWNER accounts')
        }

        return NextResponse.json(targetUser)
    } catch (error) {
        return handleApiError(error)
    }
}

// PUT update user (ADMIN only - OWNER blocked, ADMIN cannot modify OWNER accounts)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check permissions - OWNER cannot update users
        const { response, user } = await withApiPermission(request, {
            allowedRoles: ['ADMIN'],
            requireWrite: true,
            resource: 'USER'
        })

        if (response) return response
        if (!user) throw new AuthenticationError()

        const { id } = await params

        const { email, name, role, password } = await request.json()

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
            where: { id },
        })

        if (!targetUser) {
            throw new NotFoundError('User', id)
        }

        // Check if ADMIN is trying to modify OWNER account
        const ownerCheck = isModifyingOwnerAccount(user.role, targetUser.role, id)
        if (!ownerCheck.allowed) {
            // Log the attempt
            await logAdminOwnerModificationAttempt(user.userId, 'UPDATE', id, {
                targetRole: targetUser.role,
                endpoint: `/api/admin/users/${id}`
            })
            
            return NextResponse.json(
                { error: ownerCheck.error },
                { status: 403 }
            )
        }

        // Check if trying to change role to OWNER
        if (role && role === 'OWNER') {
            const roleCheck = isModifyingOwnerAccount(user.role, role, id)
            if (!roleCheck.allowed) {
                await logAdminOwnerModificationAttempt(user.userId, 'UPDATE', id, {
                    targetRole: role,
                    endpoint: `/api/admin/users/${id}`
                })
                
                return NextResponse.json(
                    { error: roleCheck.error },
                    { status: 403 }
                )
            }
        }

        // Validate role if provided
        if (role && !['USER', 'ADMIN', 'KASIR'].includes(role)) {
            throw new OrderValidationError('Invalid role')
        }

        // Check email uniqueness if changing email
        if (email && email !== targetUser.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email },
            })

            if (existingUser) {
                throw new ConflictError('Email already exists')
            }
        }

        // Prepare update data
        const updateData: any = {}
        if (email) updateData.email = email
        if (name) updateData.name = name
        if (role) updateData.role = role
        if (password) {
            updateData.password = await hashPassword(password)
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                updatedAt: true,
            },
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        return handleApiError(error)
    }
}

// DELETE user (ADMIN only - OWNER blocked, ADMIN cannot delete OWNER accounts)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check permissions - OWNER cannot delete users
        const { response, user } = await withApiPermission(request, {
            allowedRoles: ['ADMIN'],
            requireDelete: true,
            resource: 'USER'
        })

        if (response) return response
        if (!user) throw new AuthenticationError()

        const { id } = await params

        // Prevent deleting self
        if (id === user.userId) {
            throw new OrderValidationError('Cannot delete your own account')
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
            where: { id },
        })

        if (!targetUser) {
            throw new NotFoundError('User', id)
        }

        // Check if ADMIN is trying to delete OWNER account
        const ownerCheck = isModifyingOwnerAccount(user.role, targetUser.role, id)
        if (!ownerCheck.allowed) {
            // Log the attempt
            await logAdminOwnerModificationAttempt(user.userId, 'DELETE', id, {
                targetRole: targetUser.role,
                endpoint: `/api/admin/users/${id}`
            })
            
            return NextResponse.json(
                { error: ownerCheck.error },
                { status: 403 }
            )
        }

        // Check if this is the last admin
        if (targetUser.role === 'ADMIN') {
            const adminCount = await prisma.user.count({
                where: { role: 'ADMIN' },
            })

            if (adminCount <= 1) {
                throw new OrderValidationError('Cannot delete the last admin user')
            }
        }

        // Delete user
        await prisma.user.delete({
            where: { id },
        })

        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error) {
        return handleApiError(error)
    }
}
