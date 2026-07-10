import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError } from '@/lib/errorHandler'

// GET all settings
export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany()
    
    // Map list of settings to key-value object
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc;
    }, {} as Record<string, string>)

    // Fallbacks
    const responseData = {
      restaurant_name: settingsMap['restaurant_name'] || 'Iga Bakar Ombenk',
      logo_url: settingsMap['logo_url'] || '/logo-v3.png',
      background_url: settingsMap['background_url'] || '/restaurant-bg.jpg',
    }

    return NextResponse.json(responseData)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT / Update settings (Owner and Admin allowed)
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Admin or Owner role required' }, { status: 403 })
    }

    const body = await request.json()
    const allowedKeys = ['restaurant_name', 'logo_url', 'background_url']

    // Update settings transactionally
    await prisma.$transaction(
      Object.entries(body).map(([key, value]) => {
        if (!allowedKeys.includes(key)) {
          throw new Error(`Invalid setting key: ${key}`)
        }
        return prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      })
    )

    return NextResponse.json({ success: true, message: 'Settings updated successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
