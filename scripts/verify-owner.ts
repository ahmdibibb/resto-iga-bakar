/**
 * Verification script to check if OWNER user was created
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Verifying OWNER role implementation...\n')

    // Check if OWNER user exists
    const ownerUser = await prisma.user.findUnique({
      where: { email: 'owner@resto.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    if (ownerUser) {
      console.log('✅ OWNER user found:')
      console.log(`   Email: ${ownerUser.email}`)
      console.log(`   Name: ${ownerUser.name}`)
      console.log(`   Role: ${ownerUser.role}`)
      console.log(`   Created: ${ownerUser.createdAt}\n`)
    } else {
      console.log('❌ OWNER user not found\n')
    }

    // Check all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    console.log(`📊 Total users in database: ${allUsers.length}`)
    console.log('\nAll users:')
    allUsers.forEach((user) => {
      console.log(`   - ${user.email} (${user.role})`)
    })

    // Check audit logs
    const auditLogs = await prisma.auditLog.count()
    console.log(`\n📋 Total audit logs: ${auditLogs}`)

    // Check products
    const products = await prisma.product.count()
    console.log(`📦 Total products: ${products}`)

    // Check tables
    const tables = await prisma.table.count()
    console.log(`🪑 Total tables: ${tables - 1} dine-in + 1 TAKEAWAY QR code = ${tables} total`)

    console.log('\n✅ Database verification complete!')
  } catch (error) {
    console.error('❌ Error during verification:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
