import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { withApiPermission } from '@/lib/apiPermissions'
import { handleApiError } from '@/lib/errorHandler'

/**
 * POST /api/products/upload
 * Upload product image from local device to public/uploads
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
    const file = formData.get('file') as File | null

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

    // Validate extension
    const ext = path.extname(file.name).toLowerCase()
    const allowedExtensions = ['.png', '.jpg', '.jpeg']
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: 'Ekstensi file tidak didukung. Hanya diperbolehkan ekstensi .png, .jpg, atau .jpeg.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate a unique filename
    const filename = `product-${Date.now()}${ext}`
    
    // Ensure public/uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadDir, { recursive: true })
    
    const filePath = path.join(uploadDir, filename)
    await fs.writeFile(filePath, buffer)
    
    // Return relative public path
    const fileUrl = `/uploads/${filename}`
    
    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    return handleApiError(error)
  }
}
