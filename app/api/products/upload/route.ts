import { NextRequest, NextResponse } from 'next/server'
import { withApiPermission } from '@/lib/apiPermissions'
import { handleApiError } from '@/lib/errorHandler'

/**
 * POST /api/products/upload
 * Upload product image from device to Cloudinary
 * Protected: ADMIN only
 */
export async function POST(request: NextRequest) {
  try {
    const { response } = await withApiPermission(request, {
      allowedRoles: ['ADMIN'],
      requireWrite: true,
      resource: 'PRODUCT'
    })
    if (response) return response

    const formData = await request.formData()
    const file = formData.get('file') as Blob | null

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 })
    }

    // Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png']
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Hanya diperbolehkan format JPG/JPEG dan PNG.' },
        { status: 400 }
      )
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

    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudinaryFormData,
    })

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json()
      return NextResponse.json({ 
        error: errorData.error?.message || 'Failed to upload to Cloudinary' 
      }, { status: cloudinaryResponse.status })
    }

    const data = await cloudinaryResponse.json()
    return NextResponse.json({ url: data.secure_url })
  } catch (error) {
    return handleApiError(error)
  }
}
