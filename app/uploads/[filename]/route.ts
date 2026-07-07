import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename)
    
    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return new NextResponse('File not found', { status: 404 })
    }

    const fileBuffer = await fs.readFile(filePath)
    
    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === '.png') contentType = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.gif') contentType = 'image/gif'
    else if (ext === '.svg') contentType = 'image/svg+xml'
    else if (ext === '.webp') contentType = 'image/webp'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        // Cache for 1 day in browser to optimize performance
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
