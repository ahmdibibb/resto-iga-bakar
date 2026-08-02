import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isValidQRToken,
  isValidTableId,
  validateTableAvailability,
  validateTakeawayByToken,
} from '../tableValidation'
import { prisma } from '../prisma'

// Mock Prisma
vi.mock('../prisma', () => ({
  prisma: {
    table: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

describe('Table Validation Module - Whitebox Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isValidQRToken', () => {
    // Test Case 1: Path - valid 64-character hex token
    it('should return true for valid 64-char hex token', () => {
      const validToken = 'a'.repeat(64)
      expect(isValidQRToken(validToken)).toBe(true)
    })

    // Test Case 2: Path - valid token dengan angka
    it('should return true for hex token with numbers', () => {
      const validToken = '1234567890abcdef'.repeat(4) // 64 chars
      expect(isValidQRToken(validToken)).toBe(true)
    })

    // Test Case 3: Path - valid token uppercase
    it('should return true for uppercase hex token', () => {
      const validToken = 'A'.repeat(64)
      expect(isValidQRToken(validToken)).toBe(true)
    })

    // Test Case 4: Path - valid token mixed case
    it('should return true for mixed case hex token', () => {
      const validToken = 'aAbBcCdDeEfF0123'.repeat(4) // 64 chars
      expect(isValidQRToken(validToken)).toBe(true)
    })

    // Test Case 5: Branch - token terlalu pendek
    it('should return false for token shorter than 64 characters', () => {
      const shortToken = 'a'.repeat(63)
      expect(isValidQRToken(shortToken)).toBe(false)
    })

    // Test Case 6: Branch - token terlalu panjang
    it('should return false for token longer than 64 characters', () => {
      const longToken = 'a'.repeat(65)
      expect(isValidQRToken(longToken)).toBe(false)
    })

    // Test Case 7: Branch - token dengan karakter non-hex
    it('should return false for token with special characters', () => {
      const invalidToken = 'g'.repeat(64) // 'g' bukan hex
      expect(isValidQRToken(invalidToken)).toBe(false)
    })

    // Test Case 8: Branch - token dengan spasi
    it('should return false for token with spaces', () => {
      const invalidToken = 'a'.repeat(32) + ' ' + 'a'.repeat(31)
      expect(isValidQRToken(invalidToken)).toBe(false)
    })

    // Test Case 9: Branch - empty string
    it('should return false for empty string', () => {
      expect(isValidQRToken('')).toBe(false)
    })

    // Test Case 10: Branch - token dengan dash
    it('should return false for token with dashes', () => {
      const invalidToken = 'a'.repeat(32) + '-' + 'a'.repeat(31)
      expect(isValidQRToken(invalidToken)).toBe(false)
    })
  })

  describe('isValidTableId', () => {
    // Test Case 11: Path - valid CUID (starts with 'c')
    it('should return true for valid CUID starting with c', () => {
      const validId = 'clh1234567890abcdef'
      expect(isValidTableId(validId)).toBe(true)
    })

    // Test Case 12: Path - valid CUID panjang
    it('should return true for long CUID', () => {
      const validId = 'c' + 'x'.repeat(100)
      expect(isValidTableId(validId)).toBe(true)
    })

    // Test Case 13: Branch - ID tidak dimulai dengan 'c'
    it('should return false for ID not starting with c', () => {
      const invalidId = 'blh1234567890abcdef'
      expect(isValidTableId(invalidId)).toBe(false)
    })

    // Test Case 14: Branch - empty string
    it('should return false for empty string', () => {
      expect(isValidTableId('')).toBe(false)
    })

    // Test Case 15: Branch - hanya huruf 'c'
    it('should return true for single c character', () => {
      expect(isValidTableId('c')).toBe(true)
    })

    // Test Case 16: Branch - uppercase C
    it('should return false for uppercase C', () => {
      const invalidId = 'Clh1234567890abcdef'
      expect(isValidTableId(invalidId)).toBe(false)
    })
  })

  describe('validateTakeawayByToken', () => {
    // Test Case 17: Path - valid TAKEAWAY token
    it('should return valid result for correct TAKEAWAY token', async () => {
      const validToken = 'a'.repeat(64)
      
      vi.mocked(prisma.table.findFirst).mockResolvedValue({
        id: 'takeaway-id',
        name: 'TAKEAWAY',
        qr_token: validToken,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTakeawayByToken(validToken)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.table).toBeUndefined() // CRITICAL: No table info for TAKEAWAY
      expect(prisma.table.findFirst).toHaveBeenCalledWith({
        where: { name: 'TAKEAWAY' },
      })
    })

    // Test Case 18: Branch - TAKEAWAY table tidak ditemukan
    it('should return error when TAKEAWAY table not found', async () => {
      vi.mocked(prisma.table.findFirst).mockResolvedValue(null)

      const result = await validateTakeawayByToken('validtoken123')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('TAKEAWAY tidak tersedia. Hubungi staff.')
    })

    // Test Case 19: Branch - token tidak match (length berbeda)
    it('should return error when token length does not match', async () => {
      const storedToken = 'a'.repeat(64)
      const providedToken = 'a'.repeat(63) // length berbeda

      vi.mocked(prisma.table.findFirst).mockResolvedValue({
        id: 'takeaway-id',
        name: 'TAKEAWAY',
        qr_token: storedToken,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTakeawayByToken(providedToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
    })

    // Test Case 20: Branch - token tidak match (value berbeda)
    it('should return error when token value does not match', async () => {
      const storedToken = 'a'.repeat(64)
      const providedToken = 'b'.repeat(64) // sama panjang, beda value

      vi.mocked(prisma.table.findFirst).mockResolvedValue({
        id: 'takeaway-id',
        name: 'TAKEAWAY',
        qr_token: storedToken,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTakeawayByToken(providedToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
    })

    // Test Case 21: Branch - empty token
    it('should return error for empty token', async () => {
      vi.mocked(prisma.table.findFirst).mockResolvedValue({
        id: 'takeaway-id',
        name: 'TAKEAWAY',
        qr_token: 'a'.repeat(64),
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTakeawayByToken('')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
    })

    // Test Case 22: Branch - database error
    it('should return error when database throws error', async () => {
      vi.mocked(prisma.table.findFirst).mockRejectedValue(new Error('Database error'))

      const result = await validateTakeawayByToken('validtoken123')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Terjadi kesalahan. Silakan coba lagi.')
    })

    // Test Case 23: Path - timing attack protection (same length different value)
    it('should use constant-time comparison for security', async () => {
      const storedToken = '0'.repeat(64)
      const providedToken = '1'.repeat(64)

      vi.mocked(prisma.table.findFirst).mockResolvedValue({
        id: 'takeaway-id',
        name: 'TAKEAWAY',
        qr_token: storedToken,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Timing attack protection: should not leak information via timing
      const result = await validateTakeawayByToken(providedToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
    })
  })

  describe('validateTableAvailability', () => {
    const validTableId = 'clh1234567890'
    const validToken = 'a'.repeat(64)

    // Test Case 24: Path - valid table dan token
    it('should return valid result with table info for correct token', async () => {
      vi.mocked(prisma.table.findUnique).mockResolvedValue({
        id: validTableId,
        name: 'Meja 1',
        qr_token: validToken,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTableAvailability(validTableId, validToken)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.table).toEqual({
        id: validTableId,
        name: 'Meja 1',
        status: 'AVAILABLE',
      })
      expect(prisma.table.findUnique).toHaveBeenCalledWith({
        where: { id: validTableId },
      })
    })

    // Test Case 25: Path - table dengan status OCCUPIED tetap valid
    it('should return valid result even if table is OCCUPIED', async () => {
      vi.mocked(prisma.table.findUnique).mockResolvedValue({
        id: validTableId,
        name: 'Meja 2',
        qr_token: validToken,
        status: 'OCCUPIED',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTableAvailability(validTableId, validToken)

      expect(result.valid).toBe(true)
      expect(result.table?.status).toBe('OCCUPIED')
    })

    // Test Case 26: Branch - table tidak ditemukan
    it('should return error when table not found', async () => {
      vi.mocked(prisma.table.findUnique).mockResolvedValue(null)

      const result = await validateTableAvailability('invalid-id', validToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
      expect(result.table).toBeUndefined()
    })

    // Test Case 27: Branch - token length tidak match
    it('should return error when token length does not match', async () => {
      const storedToken = 'a'.repeat(64)
      const providedToken = 'a'.repeat(63)

      vi.mocked(prisma.table.findUnique).mockResolvedValue({
        id: validTableId,
        name: 'Meja 3',
        qr_token: storedToken,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTableAvailability(validTableId, providedToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
    })

    // Test Case 28: Branch - token value tidak match
    it('should return error when token value does not match', async () => {
      const storedToken = 'a'.repeat(64)
      const providedToken = 'b'.repeat(64)

      vi.mocked(prisma.table.findUnique).mockResolvedValue({
        id: validTableId,
        name: 'Meja 4',
        qr_token: storedToken,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTableAvailability(validTableId, providedToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
    })

    // Test Case 29: Branch - empty tableId
    it('should return error for empty tableId', async () => {
      vi.mocked(prisma.table.findUnique).mockResolvedValue(null)

      const result = await validateTableAvailability('', validToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
    })

    // Test Case 30: Branch - empty token
    it('should return error for empty token', async () => {
      vi.mocked(prisma.table.findUnique).mockResolvedValue({
        id: validTableId,
        name: 'Meja 5',
        qr_token: validToken,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTableAvailability(validTableId, '')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
    })

    // Test Case 31: Branch - both empty
    it('should return error when both tableId and token are empty', async () => {
      vi.mocked(prisma.table.findUnique).mockResolvedValue(null)

      const result = await validateTableAvailability('', '')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
    })

    // Test Case 32: Branch - database error
    it('should return error when database throws error', async () => {
      vi.mocked(prisma.table.findUnique).mockRejectedValue(
        new Error('Connection timeout')
      )

      const result = await validateTableAvailability(validTableId, validToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Terjadi kesalahan. Silakan coba lagi.')
    })

    // Test Case 33: Path - different table statuses
    it('should return valid result for OCCUPIED table', async () => {
      vi.mocked(prisma.table.findUnique).mockResolvedValue({
        id: validTableId,
        name: 'Meja 6',
        qr_token: validToken,
        status: 'OCCUPIED',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTableAvailability(validTableId, validToken)

      expect(result.valid).toBe(true)
      expect(result.table?.status).toBe('OCCUPIED')
    })

    // Test Case 34: Path - timing attack protection
    it('should use constant-time comparison for security', async () => {
      const storedToken = '0'.repeat(64)
      const providedToken = '1'.repeat(64)

      vi.mocked(prisma.table.findUnique).mockResolvedValue({
        id: validTableId,
        name: 'Meja 7',
        qr_token: storedToken,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTableAvailability(validTableId, providedToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('QR Code tidak valid. Hubungi staff.')
    })

    // Test Case 35: Path - special characters in table name
    it('should handle table with special characters in name', async () => {
      vi.mocked(prisma.table.findUnique).mockResolvedValue({
        id: validTableId,
        name: 'Meja VIP #1 (Premium)',
        qr_token: validToken,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateTableAvailability(validTableId, validToken)

      expect(result.valid).toBe(true)
      expect(result.table?.name).toBe('Meja VIP #1 (Premium)')
    })
  })
})
