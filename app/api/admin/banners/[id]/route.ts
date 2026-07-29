import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiPermission } from '@/lib/apiPermissions'

// PATCH update a banner
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const perm = await withApiPermission(request, { allowedRoles: ['ADMIN', 'OWNER'] })
  if (perm.response) return perm.response

  try {
    const { id } = await params
    const body = await request.json()
    const { title, subtitle, imageUrl, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    // If setting this banner to active, deactivate all others
    if (isActive === true) {
      await prisma.campaignBanner.updateMany({
        where: { id: { not: id }, isActive: true },
        data: { isActive: false }
      })
    }

    const banner = await prisma.campaignBanner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive }),
      }
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error('[BANNER_PATCH]', error)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}

// DELETE a banner
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const perm = await withApiPermission(request, { allowedRoles: ['ADMIN', 'OWNER'] })
  if (perm.response) return perm.response

  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    await prisma.campaignBanner.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[BANNER_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}
