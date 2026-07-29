import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiPermission } from '@/lib/apiPermissions'

// GET all banners
export async function GET(request: NextRequest) {
  const perm = await withApiPermission(request, { allowedRoles: ['ADMIN', 'OWNER'] })
  if (perm.response) return perm.response

  try {
    const banners = await prisma.campaignBanner.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(banners)
  } catch (error) {
    console.error('[BANNERS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

// POST create new banner
export async function POST(request: NextRequest) {
  const perm = await withApiPermission(request, { allowedRoles: ['ADMIN', 'OWNER'] })
  if (perm.response) return perm.response

  try {
    const body = await request.json()
    const { title, subtitle, imageUrl, isActive } = body

    if (!title || !subtitle || !imageUrl) {
      return NextResponse.json({ error: 'Title, subtitle, and image are required' }, { status: 400 })
    }

    // If this banner is set to active, deactivate others
    if (isActive) {
      await prisma.campaignBanner.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      })
    }

    const banner = await prisma.campaignBanner.create({
      data: {
        title,
        subtitle,
        imageUrl,
        isActive: isActive || false
      }
    })

    return NextResponse.json(banner, { status: 201 })
  } catch (error) {
    console.error('[BANNERS_POST]', error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}
