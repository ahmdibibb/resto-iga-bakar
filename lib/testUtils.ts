/**
 * Test utilities for generating test data
 * Useful for testing and development
 */

import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export interface TestUserData {
  email: string
  name: string
  password: string
  role: UserRole
}

/**
 * Generate a test user with the specified role
 */
export async function generateTestUser(
  role: UserRole,
  index: number = 1
): Promise<TestUserData> {
  const rolePrefix = role.toLowerCase()
  const hashedPassword = await bcrypt.hash(`${rolePrefix}123`, 10)

  return {
    email: `${rolePrefix}${index}@test.com`,
    name: `Test ${role} ${index}`,
    password: hashedPassword,
    role,
  }
}

/**
 * Generate multiple test users with different roles
 */
export async function generateTestUsers(config: {
  owners?: number
  admins?: number
  kasirs?: number
}): Promise<TestUserData[]> {
  const testUsers: TestUserData[] = []

  // Generate OWNER users
  if (config.owners) {
    for (let i = 1; i <= config.owners; i++) {
      testUsers.push(await generateTestUser('OWNER', i))
    }
  }

  // Generate ADMIN users
  if (config.admins) {
    for (let i = 1; i <= config.admins; i++) {
      testUsers.push(await generateTestUser('ADMIN', i))
    }
  }

  // Generate KASIR users
  if (config.kasirs) {
    for (let i = 1; i <= config.kasirs; i++) {
      testUsers.push(await generateTestUser('KASIR', i))
    }
  }

  return testUsers
}

/**
 * Generate test credentials for quick testing
 */
export function getTestCredentials(role: UserRole, index: number = 1) {
  const rolePrefix = role.toLowerCase()
  return {
    email: `${rolePrefix}${index}@test.com`,
    password: `${rolePrefix}123`,
  }
}

/**
 * Example usage:
 * 
 * // Generate a single test OWNER user
 * const ownerUser = await generateTestUser('OWNER', 1)
 * 
 * // Generate multiple test users
 * const testUsers = await generateTestUsers({
 *   owners: 2,
 *   admins: 3,
 *   kasirs: 2,
 *   users: 5
 * })
 * 
 * // Get test credentials
 * const credentials = getTestCredentials('OWNER', 1)
 * // Returns: { email: 'owner1@test.com', password: 'owner123' }
 */
