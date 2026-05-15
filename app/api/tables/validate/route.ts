import { NextRequest, NextResponse } from 'next/server'
import { validateTableAvailability } from '@/lib/tableValidation'
import { handleApiError, QRCodeValidationError } from '@/lib/errorHandler'

/**
 * GET /api/tables/validate
 * Validate table availability and QR code token via query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get('table_id')
    const qr_token = searchParams.get('token')

    // Validate required fields
    if (!tableId || !qr_token) {
      throw new QRCodeValidationError('Table ID and QR token are required')
    }

    // Validate table availability
    const validationResult = await validateTableAvailability(tableId, qr_token)

    if (!validationResult.valid) {
      throw new QRCodeValidationError(validationResult.error || 'Table validation failed')
    }

    return NextResponse.json(validationResult)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/tables/validate
 * Validate table availability and QR code token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableId, qr_token, isTakeaway } = body

    // Validate required fields
    if (!tableId || !qr_token) {
      throw new QRCodeValidationError('Table ID and QR token are required')
    }

    // Handle TAKEAWAY validation separately
    if (isTakeaway === true || tableId === 'TAKEAWAY_MARKER') {
      // For TAKEAWAY, find the TAKEAWAY table by name and validate token
      const { validateTakeawayByToken } = await import('@/lib/tableValidation')
      const validationResult = await validateTakeawayByToken(qr_token)

      if (!validationResult.valid) {
        throw new QRCodeValidationError(validationResult.error || 'TAKEAWAY validation failed')
      }

      return NextResponse.json(validationResult)
    }

    // Regular table validation for DINE_IN
    const validationResult = await validateTableAvailability(tableId, qr_token)

    if (!validationResult.valid) {
      throw new QRCodeValidationError(validationResult.error || 'Table validation failed')
    }

    return NextResponse.json(validationResult)
  } catch (error) {
    return handleApiError(error)
  }
}
