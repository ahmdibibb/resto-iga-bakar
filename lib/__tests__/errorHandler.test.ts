import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import {
  QRCodeValidationError,
  OrderValidationError,
  PaymentValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  handleApiError,
} from '../errorHandler'
import { MidtransError } from '../midtrans'

describe('Error Handler Module - Whitebox Testing', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    // Mock console.error untuk prevent noise di test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('Custom Error Classes', () => {
    describe('QRCodeValidationError', () => {
      // Test Case 1: Path - create QRCodeValidationError
      it('should create error with correct message and name', () => {
        const error = new QRCodeValidationError('Invalid QR code')

        expect(error.message).toBe('Invalid QR code')
        expect(error.name).toBe('QRCodeValidationError')
        expect(error instanceof Error).toBe(true)
      })
    })

    describe('OrderValidationError', () => {
      // Test Case 2: Path - create OrderValidationError dengan field
      it('should create error with message and field', () => {
        const error = new OrderValidationError('Invalid quantity', 'quantity')

        expect(error.message).toBe('Invalid quantity')
        expect(error.name).toBe('OrderValidationError')
        expect(error.field).toBe('quantity')
      })

      // Test Case 3: Branch - OrderValidationError tanpa field
      it('should create error without field', () => {
        const error = new OrderValidationError('Order validation failed')

        expect(error.message).toBe('Order validation failed')
        expect(error.field).toBeUndefined()
      })
    })

    describe('PaymentValidationError', () => {
      // Test Case 4: Path - create PaymentValidationError
      it('should create error with correct message and name', () => {
        const error = new PaymentValidationError('Payment method required')

        expect(error.message).toBe('Payment method required')
        expect(error.name).toBe('PaymentValidationError')
      })
    })

    describe('AuthenticationError', () => {
      // Test Case 5: Path - create AuthenticationError dengan message
      it('should create error with custom message', () => {
        const error = new AuthenticationError('Token expired')

        expect(error.message).toBe('Token expired')
        expect(error.name).toBe('AuthenticationError')
      })

      // Test Case 6: Branch - AuthenticationError dengan default message
      it('should create error with default message', () => {
        const error = new AuthenticationError()

        expect(error.message).toBe('Unauthorized')
        expect(error.name).toBe('AuthenticationError')
      })
    })

    describe('AuthorizationError', () => {
      // Test Case 7: Path - create AuthorizationError dengan message
      it('should create error with custom message', () => {
        const error = new AuthorizationError('Insufficient permissions')

        expect(error.message).toBe('Insufficient permissions')
        expect(error.name).toBe('AuthorizationError')
      })

      // Test Case 8: Branch - AuthorizationError dengan default message
      it('should create error with default message', () => {
        const error = new AuthorizationError()

        expect(error.message).toBe('Forbidden')
        expect(error.name).toBe('AuthorizationError')
      })
    })

    describe('NotFoundError', () => {
      // Test Case 9: Path - create NotFoundError dengan resource dan id
      it('should create error with resource and id in message', () => {
        const error = new NotFoundError('Order', 'order-123')

        expect(error.message).toBe('Order with id order-123 not found')
        expect(error.name).toBe('NotFoundError')
      })

      // Test Case 10: Path - NotFoundError dengan resource berbeda
      it('should create error for different resource types', () => {
        const error = new NotFoundError('Product', 'prod-456')

        expect(error.message).toBe('Product with id prod-456 not found')
      })
    })

    describe('ConflictError', () => {
      // Test Case 11: Path - create ConflictError
      it('should create error with correct message and name', () => {
        const error = new ConflictError('Resource already exists')

        expect(error.message).toBe('Resource already exists')
        expect(error.name).toBe('ConflictError')
      })
    })

    describe('InternalServerError', () => {
      // Test Case 12: Path - create InternalServerError dengan message
      it('should create error with custom message', () => {
        const error = new InternalServerError('Database connection failed')

        expect(error.message).toBe('Database connection failed')
        expect(error.name).toBe('InternalServerError')
      })

      // Test Case 13: Branch - InternalServerError dengan default message
      it('should create error with default message', () => {
        const error = new InternalServerError()

        expect(error.message).toBe('Internal server error')
        expect(error.name).toBe('InternalServerError')
      })
    })
  })

  describe('handleApiError', () => {
    describe('QRCodeValidationError handling', () => {
      // Test Case 14: Path - return 400 untuk QRCodeValidationError
      it('should return 400 status for QRCodeValidationError', () => {
        const error = new QRCodeValidationError('Invalid QR token')
        const response = handleApiError(error)

        expect(response).toBeInstanceOf(NextResponse)
        expect(response.status).toBe(400)
      })

      // Test Case 15: Path - return correct error message
      it('should return error message in response body', async () => {
        const error = new QRCodeValidationError('QR code expired')
        const response = handleApiError(error)

        const body = await response.json()
        expect(body.error).toBe('QR code expired')
      })

      // Test Case 16: Path - console.error dipanggil
      it('should log error to console', () => {
        const error = new QRCodeValidationError('Invalid QR')
        handleApiError(error)

        expect(consoleErrorSpy).toHaveBeenCalledWith('API Error:', error)
      })
    })

    describe('OrderValidationError handling', () => {
      // Test Case 17: Path - return 400 dengan field
      it('should return 400 with field for OrderValidationError', async () => {
        const error = new OrderValidationError('Quantity must be positive', 'quantity')
        const response = handleApiError(error)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toBe('Quantity must be positive')
        expect(body.field).toBe('quantity')
      })

      // Test Case 18: Branch - return 400 tanpa field
      it('should return 400 without field when field is undefined', async () => {
        const error = new OrderValidationError('Invalid order data')
        const response = handleApiError(error)

        const body = await response.json()
        expect(body.error).toBe('Invalid order data')
        expect(body.field).toBeUndefined()
      })
    })

    describe('PaymentValidationError handling', () => {
      // Test Case 19: Path - return 400 untuk PaymentValidationError
      it('should return 400 status for PaymentValidationError', async () => {
        const error = new PaymentValidationError('Invalid payment method')
        const response = handleApiError(error)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toBe('Invalid payment method')
      })
    })

    describe('AuthenticationError handling', () => {
      // Test Case 20: Path - return 401 untuk AuthenticationError
      it('should return 401 status for AuthenticationError', async () => {
        const error = new AuthenticationError('Invalid token')
        const response = handleApiError(error)

        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.error).toBe('Invalid token')
      })
    })

    describe('AuthorizationError handling', () => {
      // Test Case 21: Path - return 403 untuk AuthorizationError
      it('should return 403 status for AuthorizationError', async () => {
        const error = new AuthorizationError('Access denied')
        const response = handleApiError(error)

        expect(response.status).toBe(403)
        const body = await response.json()
        expect(body.error).toBe('Access denied')
      })
    })

    describe('NotFoundError handling', () => {
      // Test Case 22: Path - return 404 untuk NotFoundError
      it('should return 404 status for NotFoundError', async () => {
        const error = new NotFoundError('User', 'user-789')
        const response = handleApiError(error)

        expect(response.status).toBe(404)
        const body = await response.json()
        expect(body.error).toBe('User with id user-789 not found')
      })
    })

    describe('ConflictError handling', () => {
      // Test Case 23: Path - return 409 untuk ConflictError
      it('should return 409 status for ConflictError', async () => {
        const error = new ConflictError('Email already registered')
        const response = handleApiError(error)

        expect(response.status).toBe(409)
        const body = await response.json()
        expect(body.error).toBe('Email already registered')
      })
    })

    describe('MidtransError handling', () => {
      // Test Case 24: Path - preserve Midtrans status code
      it('should preserve status code from MidtransError', async () => {
        const error = new MidtransError('Payment gateway error', 502, undefined, 'GATEWAY_ERROR')
        const response = handleApiError(error)

        expect(response.status).toBe(502)
      })

      // Test Case 25: Branch - user-friendly message untuk 502
      it('should return user-friendly message for 502 error', async () => {
        const error = new MidtransError('Bad Gateway', 502)
        const response = handleApiError(error)

        const body = await response.json()
        expect(body.error).toBe('Layanan pembayaran sedang tidak dapat dihubungi')
      })

      // Test Case 26: Branch - generic message untuk non-502 Midtrans error
      it('should return generic message for other Midtrans errors', async () => {
        const error = new MidtransError('Payment failed', 400)
        const response = handleApiError(error)

        const body = await response.json()
        expect(body.error).toBe('Terjadi kesalahan pada layanan pembayaran')
      })

      // Test Case 27: Path - include error code in response
      it('should include error code in response body', async () => {
        const error = new MidtransError('Error', 500, undefined, 'PAYMENT_FAILED')
        const response = handleApiError(error)

        const body = await response.json()
        expect(body.code).toBe('PAYMENT_FAILED')
      })

      // Test Case 28: Branch - default code untuk Midtrans error tanpa code
      it('should use default code when code is not provided', async () => {
        const error = new MidtransError('Error', 500)
        const response = handleApiError(error)

        const body = await response.json()
        expect(body.code).toBe('MIDTRANS_ERROR')
      })
    })

    describe('InternalServerError handling', () => {
      // Test Case 29: Path - return 500 untuk InternalServerError
      it('should return 500 status for InternalServerError', async () => {
        const error = new InternalServerError('Database error')
        const response = handleApiError(error)

        expect(response.status).toBe(500)
        const body = await response.json()
        expect(body.error).toBe('Database error')
      })
    })

    describe('Unknown error handling', () => {
      // Test Case 30: Path - return 500 untuk unknown error
      it('should return 500 for unknown error types', async () => {
        const error = new Error('Unknown error')
        const response = handleApiError(error)

        expect(response.status).toBe(500)
        const body = await response.json()
        expect(body.error).toBe('Internal server error')
      })

      // Test Case 31: Branch - handle non-Error objects
      it('should handle non-Error objects', async () => {
        const error = 'String error'
        const response = handleApiError(error)

        expect(response.status).toBe(500)
        const body = await response.json()
        expect(body.error).toBe('Internal server error')
      })

      // Test Case 32: Branch - handle null error
      it('should handle null error', async () => {
        const response = handleApiError(null)

        expect(response.status).toBe(500)
        const body = await response.json()
        expect(body.error).toBe('Internal server error')
      })

      // Test Case 33: Branch - handle undefined error
      it('should handle undefined error', async () => {
        const response = handleApiError(undefined)

        expect(response.status).toBe(500)
        const body = await response.json()
        expect(body.error).toBe('Internal server error')
      })
    })

    describe('Response format consistency', () => {
      // Test Case 34: Path - all responses have error field
      it('should always include error field in response', async () => {
        const errors = [
          new QRCodeValidationError('test'),
          new OrderValidationError('test'),
          new AuthenticationError('test'),
          new NotFoundError('Resource', '123'),
          new InternalServerError('test'),
        ]

        for (const error of errors) {
          const response = handleApiError(error)
          const body = await response.json()
          expect(body).toHaveProperty('error')
        }
      })

      // Test Case 35: Path - responses are JSON
      it('should return JSON responses', () => {
        const error = new QRCodeValidationError('test')
        const response = handleApiError(error)

        expect(response.headers.get('content-type')).toContain('application/json')
      })
    })
  })
})
