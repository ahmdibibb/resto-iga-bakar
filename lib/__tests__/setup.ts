import { beforeAll, beforeEach, afterAll, vi } from 'vitest'

// Set environment variables globally sebelum import modules
process.env.JWT_SECRET = 'test-secret-key-for-testing'
process.env.JWT_EXPIRATION = '7d'
process.env.MIDTRANS_SERVER_KEY = 'test-midtrans-server-key'
process.env.MIDTRANS_IS_PRODUCTION = 'false'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = 'false'

// Mock environment variables untuk testing
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-testing'
  process.env.JWT_EXPIRATION = '7d'
  process.env.MIDTRANS_SERVER_KEY = 'test-midtrans-server-key'
  process.env.MIDTRANS_IS_PRODUCTION = 'false'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = 'false'
})

beforeEach(() => {
  // Pastikan env tersedia di setiap test
  process.env.MIDTRANS_SERVER_KEY = 'test-midtrans-server-key'
})

afterAll(() => {
  vi.clearAllMocks()
})
