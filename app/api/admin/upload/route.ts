import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Admin or Owner role required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as Blob | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Convert file to base64 data URL
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default'

    if (!cloudName) {
      return NextResponse.json({ error: 'Cloudinary cloud name is not configured' }, { status: 500 })
    }

    // Prepare Cloudinary request
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', base64Image)
    cloudinaryFormData.append('upload_preset', uploadPreset)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudinaryFormData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ 
        error: errorData.error?.message || 'Failed to upload to Cloudinary' 
      }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, url: data.secure_url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
