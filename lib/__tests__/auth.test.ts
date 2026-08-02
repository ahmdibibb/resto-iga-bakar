import { describe, it, expect, beforeEach } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  clearRoleCache,
  type JWTPayload,
} from '../auth'

describe('Auth Module - Whitebox Testing', () => {
  beforeEach(() => {
    clearRoleCache()
  })

  describe('hashPassword', () => {
    // Test Case 19: Path - hashing password berhasil
    it('should hash password successfully', async () => {
      const password = 'MySecurePassword123!'
      const hashed = await hashPassword(password)

      expect(hashed).toBeDefined()
      expect(hashed).not.toBe(password)
      expect(hashed.length).toBeGreaterThan(0)
      // bcrypt hash dimulai dengan $2a$ atau $2b$
      expect(hashed).toMatch(/^\$2[ab]\$/)
    })

    // Test Case 20: Path - hash yang berbeda untuk password yang sama
    it('should generate different hashes for same password (salt)', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    // Test Case 21: Path - verifikasi password yang benar
    it('should return true for correct password', async () => {
      const password = 'CorrectPassword123!'
      const hashed = await hashPassword(password)
      const isValid = await verifyPassword(password, hashed)

      expect(isValid).toBe(true)
    })

    // Test Case 22: Path - verifikasi password yang salah
    it('should return false for incorrect password', async () => {
      const password = 'CorrectPassword123!'
      const wrongPassword = 'WrongPassword456!'
      const hashed = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hashed)

      expect(isValid).toBe(false)
    })

    // Test Case 23: Branch - password kosong
    it('should return false for empty password', async () => {
      const password = 'TestPassword123!'
      const hashed = await hashPassword(password)
      const isValid = await verifyPassword('', hashed)

      expect(isValid).toBe(false)
    })
  })

  describe('signToken', () => {
    // Test Case 24: Path - membuat JWT token berhasil
    it('should create JWT token successfully', async () => {
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = await signToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      // JWT format: header.payload.signature
      expect(token.split('.')).toHaveLength(3)
    })

    // Test Case 25: Path - token berisi data payload yang benar
    it('should encode payload data correctly', async () => {
      const payload: JWTPayload = {
        userId: 'user-456',
        email: 'admin@example.com',
        role: 'ADMIN',
      }

      const token = await signToken(payload)
      const decoded = await verifyToken(token)

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.role).toBe(payload.role)
    })

    // Test Case 26: Branch - payload dengan data tambahan
    it('should handle additional payload fields', async () => {
      const payload: JWTPayload = {
        userId: 'user-789',
        email: 'owner@example.com',
        role: 'OWNER',
        name: 'John Doe',
        customField: 'custom-value',
      }

      const token = await signToken(payload)
      const decoded = await verifyToken(token)

      expect(decoded.name).toBe('John Doe')
      expect(decoded.customField).toBe('custom-value')
    })
  })

  describe('verifyToken', () => {
    // Test Case 27: Path - verifikasi token valid
    it('should verify valid token successfully', async () => {
      const payload: JWTPayload = {
        userId: 'user-111',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = await signToken(payload)
      const decoded = await verifyToken(token)

      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.role).toBe(payload.role)
      expect(decoded.iat).toBeDefined() // issued at
      expect(decoded.exp).toBeDefined() // expiration
    })

    // Test Case 28: Path - token tidak valid (dimodifikasi)
    it('should reject tampered token', async () => {
      const payload: JWTPayload = {
        userId: 'user-222',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = await signToken(payload)
      const tamperedToken = token.slice(0, -10) + 'tampered12'

      await expect(verifyToken(tamperedToken)).rejects.toThrow()
    })

    // Test Case 29: Path - token dengan format tidak valid
    it('should reject invalid token format', async () => {
      const invalidToken = 'this.is.not.a.valid.jwt'

      await expect(verifyToken(invalidToken)).rejects.toThrow()
    })

    // Test Case 30: Branch - token kosong
    it('should reject empty token', async () => {
      await expect(verifyToken('')).rejects.toThrow()
    })
  })

  describe('Token Integration', () => {
    // Test Case 31: Path - complete sign and verify flow
    it('should complete full token lifecycle', async () => {
      const originalPayload: JWTPayload = {
        userId: 'user-full-test',
        email: 'fulltest@example.com',
        role: 'ADMIN',
        name: 'Full Test User',
      }

      // Sign token
      const token = await signToken(originalPayload)
      expect(token).toBeDefined()

      // Verify token
      const decodedPayload = await verifyToken(token)
      expect(decodedPayload.userId).toBe(originalPayload.userId)
      expect(decodedPayload.email).toBe(originalPayload.email)
      expect(decodedPayload.role).toBe(originalPayload.role)
      expect(decodedPayload.name).toBe(originalPayload.name)
    })
  })
})
