import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  verifyNotificationSignature,
  mapMidtransStatus,
  getSnapScriptUrl,
  MidtransError,
  type InternalPaymentStatus,
} from '../midtrans'

describe('Midtrans Module - Whitebox Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('verifyNotificationSignature', () => {
    // Test Case 32: Path - signature valid
    it('should return true for valid signature', () => {
      // Ensure env is set
      process.env.MIDTRANS_SERVER_KEY = 'test-midtrans-server-key'
      
      const orderId = 'ORDER-123'
      const statusCode = '200'
      const grossAmount = '100000'

      // Buat signature yang benar
      // Formula: SHA512(order_id + status_code + gross_amount + server_key)
      const crypto = require('node:crypto')
      const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
      const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`
      const validSignature = crypto
        .createHash('sha512')
        .update(raw)
        .digest('hex')

      const result = verifyNotificationSignature(
        orderId,
        statusCode,
        grossAmount,
        validSignature
      )

      expect(result).toBe(true)
    })

    // Test Case 33: Path - signature tidak valid
    it('should return false for invalid signature', () => {
      const orderId = 'ORDER-123'
      const statusCode = '200'
      const grossAmount = '100000'
      const invalidSignature = 'invalid-signature-hash'

      const result = verifyNotificationSignature(
        orderId,
        statusCode,
        grossAmount,
        invalidSignature
      )

      expect(result).toBe(false)
    })

    // Test Case 34: Path - signature dengan panjang berbeda
    it('should return false when signature length differs', () => {
      const orderId = 'ORDER-456'
      const statusCode = '200'
      const grossAmount = '50000'
      const shortSignature = 'short'

      const result = verifyNotificationSignature(
        orderId,
        statusCode,
        grossAmount,
        shortSignature
      )

      expect(result).toBe(false)
    })

    // Test Case 35: Branch - order ID kosong
    it('should handle empty order ID', () => {
      // Ensure env is set
      process.env.MIDTRANS_SERVER_KEY = 'test-midtrans-server-key'
      
      const crypto = require('node:crypto')
      const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
      const statusCode = '200'
      const grossAmount = '100000'

      const raw = `${statusCode}${grossAmount}${serverKey}`
      const signature = crypto.createHash('sha512').update(raw).digest('hex')

      const result = verifyNotificationSignature(
        '',
        statusCode,
        grossAmount,
        signature
      )

      expect(result).toBe(true)
    })
  })

  describe('mapMidtransStatus', () => {
    // Test Case 36: Path - status settlement -> PAID
    it('should map settlement to PAID', () => {
      const result = mapMidtransStatus('settlement')
      expect(result).toBe('PAID')
    })

    // Test Case 37: Path - status capture dengan fraud accept -> PAID
    it('should map capture with fraud accept to PAID', () => {
      const result = mapMidtransStatus('capture', 'accept')
      expect(result).toBe('PAID')
    })

    // Test Case 38: Path - status capture tanpa fraud accept -> PENDING
    it('should map capture without fraud accept to PENDING', () => {
      const result = mapMidtransStatus('capture', 'challenge')
      expect(result).toBe('PENDING')
    })

    // Test Case 39: Path - status pending -> PENDING
    it('should map pending to PENDING', () => {
      const result = mapMidtransStatus('pending')
      expect(result).toBe('PENDING')
    })

    // Test Case 40: Path - status deny -> FAILED
    it('should map deny to FAILED', () => {
      const result = mapMidtransStatus('deny')
      expect(result).toBe('FAILED')
    })

    // Test Case 41: Path - status failure -> FAILED
    it('should map failure to FAILED', () => {
      const result = mapMidtransStatus('failure')
      expect(result).toBe('FAILED')
    })

    // Test Case 42: Path - status expire -> FAILED
    it('should map expire to FAILED', () => {
      const result = mapMidtransStatus('expire')
      expect(result).toBe('FAILED')
    })

    // Test Case 43: Path - status cancel -> FAILED
    it('should map cancel to FAILED', () => {
      const result = mapMidtransStatus('cancel')
      expect(result).toBe('FAILED')
    })

    // Test Case 44: Path - status refund -> PAID
    it('should map refund to PAID', () => {
      const result = mapMidtransStatus('refund')
      expect(result).toBe('PAID')
    })

    // Test Case 45: Path - status partial_refund -> PAID
    it('should map partial_refund to PAID', () => {
      const result = mapMidtransStatus('partial_refund')
      expect(result).toBe('PAID')
    })

    // Test Case 46: Path - status tidak dikenal -> PENDING (default)
    it('should map unknown status to PENDING', () => {
      const result = mapMidtransStatus('unknown_status')
      expect(result).toBe('PENDING')
    })

    // Test Case 47: Branch - semua kombinasi status
    it('should handle all status combinations correctly', () => {
      const testCases: Array<{
        status: string
        fraud?: string
        expected: InternalPaymentStatus
      }> = [
        { status: 'settlement', expected: 'PAID' },
        { status: 'capture', fraud: 'accept', expected: 'PAID' },
        { status: 'capture', fraud: 'challenge', expected: 'PENDING' },
        { status: 'pending', expected: 'PENDING' },
        { status: 'deny', expected: 'FAILED' },
        { status: 'expire', expected: 'FAILED' },
        { status: 'cancel', expected: 'FAILED' },
        { status: 'refund', expected: 'PAID' },
      ]

      testCases.forEach(({ status, fraud, expected }) => {
        const result = mapMidtransStatus(status, fraud)
        expect(result).toBe(expected)
      })
    })
  })

  describe('getSnapScriptUrl', () => {
    // Test Case 48: Path - sandbox URL (production = false)
    it('should return sandbox URL when not in production', () => {
      const originalEnv = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = 'false'

      const url = getSnapScriptUrl()

      expect(url).toBe('https://app.sandbox.midtrans.com/snap/snap.js')

      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = originalEnv
    })

    // Test Case 49: Path - production URL (production = true)
    it('should return production URL when in production', () => {
      const originalEnv = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = 'true'

      const url = getSnapScriptUrl()

      expect(url).toBe('https://app.midtrans.com/snap/snap.js')

      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = originalEnv
    })

    // Test Case 50: Branch - default ke sandbox jika env tidak di-set
    it('should default to sandbox URL when env is not set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION
      delete process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION

      const url = getSnapScriptUrl()

      expect(url).toBe('https://app.sandbox.midtrans.com/snap/snap.js')

      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = originalEnv
    })
  })

  describe('MidtransError', () => {
    // Test Case 51: Path - membuat MidtransError dengan semua parameter
    it('should create MidtransError with all parameters', () => {
      const message = 'Test error'
      const statusCode = 400
      const response = { error: 'Bad request' }
      const code = 'TEST_ERROR'

      const error = new MidtransError(message, statusCode, response, code)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(MidtransError)
      expect(error.message).toBe(message)
      expect(error.statusCode).toBe(statusCode)
      expect(error.midtransResponse).toEqual(response)
      expect(error.code).toBe(code)
      expect(error.name).toBe('MidtransError')
    })

    // Test Case 52: Path - membuat MidtransError tanpa response dan code
    it('should create MidtransError without optional parameters', () => {
      const message = 'Simple error'
      const statusCode = 500

      const error = new MidtransError(message, statusCode)

      expect(error.message).toBe(message)
      expect(error.statusCode).toBe(statusCode)
      expect(error.midtransResponse).toBeUndefined()
      expect(error.code).toBeUndefined()
    })

    // Test Case 53: Branch - error dapat di-throw dan di-catch
    it('should be throwable and catchable', () => {
      const throwError = () => {
        throw new MidtransError('Test throw', 500)
      }

      expect(throwError).toThrow(MidtransError)
      expect(throwError).toThrow('Test throw')

      try {
        throwError()
      } catch (error) {
        expect(error).toBeInstanceOf(MidtransError)
        expect((error as MidtransError).statusCode).toBe(500)
      }
    })
  })
})
