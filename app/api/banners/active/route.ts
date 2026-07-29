import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic' // Ensure it's not statically cached

export async function GET() {
  try {
    const banner = await prisma.campaignBanner.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    })

    if (!banner) {
      return NextResponse.json({ active: false })
    }

    return NextResponse.json({ active: true, banner })
  } catch (error) {
    console.error('[BANNER_ACTIVE_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch active banner' }, { status: 500 })
  }
}
