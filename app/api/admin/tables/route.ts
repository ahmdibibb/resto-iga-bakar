import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/errorHandler'
import { withApiPermission } from '@/lib/apiPermissions'
import crypto from 'crypto'

/**
 * GET /api/admin/tables
 * Fetch all tables with their status
 * Protected: ADMIN only
 */
export async function GET(request: NextRequest) {
  try {
    const { response } = await withApiPermission(request, {
      allowedRoles: ['ADMIN'],
      resource: 'TABLE'
    })
    if (response) return response

    const tables = await prisma.table.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(tables)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/tables
 * Create a new table
 * Protected: ADMIN only
 */
export async function POST(request: NextRequest) {
  try {
    const { response } = await withApiPermission(request, {
      allowedRoles: ['ADMIN'],
      resource: 'TABLE'
    })
    if (response) return response

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Nama meja wajib diisi' }, { status: 400 })
    }

    // Check if table name already exists
    const existingTable = await prisma.table.findFirst({
      where: { name: name.trim() }
    })

    if (existingTable) {
      return NextResponse.json({ error: `Meja dengan nama "${name}" sudah ada` }, { status: 400 })
    }

    const qr_token = crypto.randomBytes(32).toString('hex')

    const table = await prisma.table.create({
      data: {
        name: name.trim(),
        qr_token,
        status: 'AVAILABLE'
      }
    })

    return NextResponse.json(table, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

