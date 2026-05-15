/**
 * Script to create the first OWNER account
 * Run this script once during system initialization
 * 
 * Usage:
 *   npx ts-node scripts/create-first-owner.ts
 * 
 * Or add to package.json scripts:
 *   "create-owner": "ts-node scripts/create-first-owner.ts"
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function createFirstOwner() {
  try {
    console.log('='.repeat(50))
    console.log('Create First OWNER Account')
    console.log('='.repeat(50))
    console.log()

    // Check if any OWNER accounts already exist
    const existingOwners = await prisma.user.count({
      where: { role: 'OWNER' }
    })

    if (existingOwners > 0) {
      console.log('⚠️  OWNER accounts already exist in the system.')
      const confirm = await question('Do you want to create another OWNER account? (yes/no): ')
      
      if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('Operation cancelled.')
        rl.close()
        await prisma.$disconnect()
        process.exit(0)
      }
    }

    // Get user input
    const name = await question('Enter OWNER name: ')
    if (!name || !name.trim()) {
      throw new Error('Name is required')
    }

    const email = await question('Enter OWNER email: ')
    if (!email || !email.trim()) {
      throw new Error('Email is required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() }
    })

    if (existingUser) {
      throw new Error('Email already exists in the system')
    }

    const password = await question('Enter OWNER password (min 8 characters): ')
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    const confirmPassword = await question('Confirm password: ')
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match')
    }

    console.log()
    console.log('Creating OWNER account...')

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create OWNER user
    const owner = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
        role: 'OWNER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    console.log()
    console.log('✅ OWNER account created successfully!')
    console.log()
    console.log('Account Details:')
    console.log('-'.repeat(50))
    console.log(`ID:        ${owner.id}`)
    console.log(`Name:      ${owner.name}`)
    console.log(`Email:     ${owner.email}`)
    console.log(`Role:      ${owner.role}`)
    console.log(`Created:   ${owner.createdAt.toISOString()}`)
    console.log('-'.repeat(50))
    console.log()
    console.log('You can now login with this account.')
    console.log()

  } catch (error) {
    console.error()
    console.error('❌ Error creating OWNER account:')
    console.error(error instanceof Error ? error.message : 'Unknown error')
    console.error()
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

// Run the script
createFirstOwner()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
