import { prisma } from './prisma'
import crypto from 'crypto'

export interface ValidationResult {
  valid: boolean
  error?: string
  table?: {
    id: string
    name: string
    status: string
  }
}

/**
 * Validate TAKEAWAY QR code token
 * 
 * @param qr_token - QR token from QR code
 * @returns Validation result WITHOUT table info (TAKEAWAY is independent)
 */
export async function validateTakeawayByToken(
  qr_token: string
): Promise<ValidationResult> {
  try {
    // Find TAKEAWAY table by name
    const takeawayTable = await prisma.table.findFirst({
      where: { name: 'TAKEAWAY' }
    })

    if (!takeawayTable) {
      return {
        valid: false,
        error: 'TAKEAWAY tidak tersedia. Hubungi staff.'
      }
    }

    // Verify QR token matches (constant-time comparison to prevent timing attacks)
    // First check if lengths match to avoid timingSafeEqual error
    if (takeawayTable.qr_token.length !== qr_token.length) {
      return {
        valid: false,
        error: 'QR Code tidak valid. Hubungi staff.'
      }
    }
    
    const tokenMatches = crypto.timingSafeEqual(
      Buffer.from(takeawayTable.qr_token),
      Buffer.from(qr_token)
    )

    if (!tokenMatches) {
      return {
        valid: false,
        error: 'QR Code tidak valid. Hubungi staff.'
      }
    }

    // CRITICAL: For TAKEAWAY, return valid WITHOUT table info
    // TAKEAWAY orders are completely independent of tables
    return {
      valid: true
      // Do NOT include table info for TAKEAWAY
    }
  } catch (error) {
    console.error('Error validating TAKEAWAY:', error)
    return {
      valid: false,
      error: 'Terjadi kesalahan. Silakan coba lagi.'
    }
  }
}

/**
 * Validate table availability and QR code token
 * 
 * @param tableId - Table ID from QR code
 * @param qr_token - QR token from QR code
 * @returns Validation result with error message if invalid
 */
export async function validateTableAvailability(
  tableId: string,
  qr_token: string
): Promise<ValidationResult> {
  try {
    // Check if table exists
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    })

    if (!table) {
      return {
        valid: false,
        error: 'QR Code tidak valid. Hubungi staff.'
      }
    }

    // Verify QR token matches (constant-time comparison to prevent timing attacks)
    // First check if lengths match to avoid timingSafeEqual error
    if (table.qr_token.length !== qr_token.length) {
      return {
        valid: false,
        error: 'QR Code tidak valid. Hubungi staff.'
      }
    }
    
    const tokenMatches = crypto.timingSafeEqual(
      Buffer.from(table.qr_token),
      Buffer.from(qr_token)
    )

    if (!tokenMatches) {
      return {
        valid: false,
        error: 'QR Code tidak valid. Hubungi staff.'
      }
    }

    // Table is valid (no status check - customers can order anytime)
    return {
      valid: true,
      table: {
        id: table.id,
        name: table.name,
        status: table.status
      }
    }
  } catch (error) {
    console.error('Error validating table:', error)
    return {
      valid: false,
      error: 'Terjadi kesalahan. Silakan coba lagi.'
    }
  }
}

/**
 * Validate QR code token format
 * 
 * @param token - QR token to validate
 * @returns true if token format is valid
 */
export function isValidQRToken(token: string): boolean {
  // QR token should be 64-character hex string (32 bytes)
  const hexRegex = /^[0-9a-f]{64}$/i
  return hexRegex.test(token)
}

/**
 * Validate table ID format
 * 
 * @param tableId - Table ID to validate
 * @returns true if table ID format is valid
 */
export function isValidTableId(tableId: string): boolean {
  // Table ID should be a CUID (starts with 'c')
  return tableId.length > 0 && tableId.startsWith('c')
}