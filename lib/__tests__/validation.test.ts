import { describe, it, expect } from 'vitest'
import {
  validatePassword,
  validateEmail,
  validateLoginData,
} from '../validation'

describe('Validation Module - Whitebox Testing', () => {
  describe('validatePassword', () => {
    // Test Case 1: Path - password kosong
    it('should reject empty password', () => {
      const result = validatePassword('')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password tidak boleh kosong')
    })

    // Test Case 2: Path - password kurang dari 8 karakter
    it('should reject password with less than 8 characters', () => {
      const result = validatePassword('Abc@123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password minimal 8 karakter')
    })

    // Test Case 3: Path - tidak ada huruf besar
    it('should reject password without uppercase letter', () => {
      const result = validatePassword('abcd@1234')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Password harus mengandung minimal 1 huruf besar'
      )
    })

    // Test Case 4: Path - tidak ada huruf kecil
    it('should reject password without lowercase letter', () => {
      const result = validatePassword('ABCD@1234')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Password harus mengandung minimal 1 huruf kecil'
      )
    })

    // Test Case 5: Path - tidak ada angka
    it('should reject password without numbers', () => {
      const result = validatePassword('Abcd@efgh')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password harus mengandung minimal 1 angka')
    })

    // Test Case 6: Path - tidak ada simbol
    it('should reject password without special characters', () => {
      const result = validatePassword('Abcd1234')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Password harus mengandung minimal 1 simbol (!@#$%^&* dll)'
      )
    })

    // Test Case 7: Path - password valid (semua kondisi terpenuhi)
    it('should accept valid password meeting all requirements', () => {
      const result = validatePassword('MyP@ssw0rd')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    // Test Case 8: Branch - multiple errors
    it('should return multiple errors when multiple requirements fail', () => {
      const result = validatePassword('abc')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain('Password minimal 8 karakter')
      expect(result.errors).toContain(
        'Password harus mengandung minimal 1 huruf besar'
      )
      expect(result.errors).toContain('Password harus mengandung minimal 1 angka')
      expect(result.errors).toContain(
        'Password harus mengandung minimal 1 simbol (!@#$%^&* dll)'
      )
    })
  })

  describe('validateEmail', () => {
    // Test Case 9: Path - email kosong
    it('should reject empty email', () => {
      const result = validateEmail('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Email tidak boleh kosong')
    })

    // Test Case 10: Path - format email tidak valid (tanpa @)
    it('should reject email without @ symbol', () => {
      const result = validateEmail('invalidemail.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Format email tidak valid')
    })

    // Test Case 11: Path - format email tidak valid (tanpa domain)
    it('should reject email without domain', () => {
      const result = validateEmail('user@')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Format email tidak valid')
    })

    // Test Case 12: Path - format email tidak valid (dengan spasi)
    it('should reject email with spaces', () => {
      const result = validateEmail('user name@domain.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Format email tidak valid')
    })

    // Test Case 13: Path - email valid
    it('should accept valid email format', () => {
      const result = validateEmail('user@example.com')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    // Test Case 14: Path - email valid dengan subdomain
    it('should accept valid email with subdomain', () => {
      const result = validateEmail('user@mail.example.com')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('validateLoginData', () => {
    // Test Case 15: Path - email dan password kosong
    it('should reject when both email and password are empty', () => {
      const result = validateLoginData({ email: '', password: '' })
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toBeDefined()
      expect(result.errors.password).toBeDefined()
      expect(result.errors.email).toContain('Email tidak boleh kosong')
      expect(result.errors.password).toContain('Password tidak boleh kosong')
    })

    // Test Case 16: Path - email tidak valid, password kosong
    it('should reject when email is invalid and password is empty', () => {
      const result = validateLoginData({
        email: 'invalid-email',
        password: '',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toContain('Format email tidak valid')
      expect(result.errors.password).toContain('Password tidak boleh kosong')
    })

    // Test Case 17: Path - email valid, password kosong
    it('should reject when email is valid but password is empty', () => {
      const result = validateLoginData({
        email: 'user@example.com',
        password: '',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toBeUndefined()
      expect(result.errors.password).toContain('Password tidak boleh kosong')
    })

    // Test Case 18: Path - email dan password valid
    it('should accept valid email and password', () => {
      const result = validateLoginData({
        email: 'user@example.com',
        password: 'MyP@ssw0rd',
      })
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })
  })
})
