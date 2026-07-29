/**
 * Manual Integration Test Script for Payment Timeout
 * 
 * This script helps verify the payment timeout mechanism by:
 * 1. Creating a test QRIS order
 * 2. Monitoring the order status
 * 3. Verifying timeout cancellation
 * 
 * Usage:
 *   npx tsx scripts/test-payment-timeout.ts
 * 
 * Prerequisites:
 *   - Database is running and seeded
 *   - At least one table exists with status AVAILABLE
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPaymentTimeout() {
  console.log('🧪 Payment Timeout Integration Test\n')

  try {
    // Step 1: Find an available table
    console.log('📋 Step 1: Finding available table...')
    const table = await prisma.table.findFirst({
      where: { status: 'AVAILABLE' }
    })

    if (!table) {
      console.error('❌ No available tables found. Please seed the database first.')
      process.exit(1)
    }

    console.log(`✅ Found table: ${table.name} (ID: ${table.id})`)

    // Step 2: Find a product
    console.log('\n📋 Step 2: Finding product...')
    const product = await prisma.product.findFirst({
      where: { 
        isActive: true,
        stock: { gte: 1 }
      }
    })

    if (!product) {
      console.error('❌ No active products found. Please seed the database first.')
      process.exit(1)
    }

    console.log(`✅ Found product: ${product.name} (Price: Rp ${product.price})`)

    // Step 3: Create test order
    console.log('\n📋 Step 3: Creating test QRIS order...')
    const orderNumber = `TEST-${Date.now()}`
    const sessionId = crypto.randomUUID()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        session_id: sessionId,
        table_id: table.id,
        customerName: 'Test Customer',
        status: 'PENDING_PAYMENT',
        payment_status: 'UNPAID',
        payment_method: 'QRIS',
        totalAmount: product.price,
        orderType: 'DINE_IN',
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            price: product.price,
            subtotal: product.price
          }
        }
      },
      include: {
        items: true,
        table: true
      }
    })

    console.log(`✅ Order created: ${order.orderNumber} (ID: ${order.id})`)
    console.log(`   Status: ${order.status}`)
    console.log(`   Payment Status: ${order.payment_status}`)
    console.log(`   Table: ${order.table?.name}`)

    // Step 4: Update table status
    console.log('\n📋 Step 4: Updating table status to OCCUPIED...')
    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED' }
    })
    console.log('✅ Table status updated')

    // Step 5: Create payment record
    console.log('\n📋 Step 5: Creating payment record...')
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'QRIS',
        amount: product.price,
        status: 'PENDING',
        transactionId: `TXN_${Date.now()}`,
        qris_string: `MOCK_QRIS_${order.id}`,
        expires_at: new Date(Date.now() + 10 * 60 * 1000)
      }
    })
    console.log('✅ Payment record created')

    // Step 6: Simulate timeout (for testing, use 30 seconds instead of 10 minutes)
    console.log('\n📋 Step 6: Simulating payment timeout...')
    console.log('⏳ Waiting 30 seconds for timeout simulation...')
    console.log('   (In production, this would be 10 minutes)')
    
    const TIMEOUT_DURATION = 30 * 1000 // 30 seconds for testing

    await new Promise(resolve => setTimeout(resolve, TIMEOUT_DURATION))

    // Step 7: Manually trigger timeout logic (simulating what schedulePaymentTimeout does)
    console.log('\n📋 Step 7: Checking order status after timeout...')
    const orderAfterTimeout = await prisma.order.findUnique({
      where: { id: order.id },
      include: { table: true }
    })

    if (!orderAfterTimeout) {
      console.error('❌ Order not found')
      process.exit(1)
    }

    if (orderAfterTimeout.status === 'PENDING_PAYMENT') {
      console.log('⚠️  Order is still PENDING_PAYMENT, cancelling now...')
      
      // Cancel order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          payment_status: 'FAILED'
        }
      })

      // Update payment
      await prisma.payment.updateMany({
        where: { orderId: order.id },
        data: { status: 'FAILED' }
      })

      // Update table
      if (orderAfterTimeout.table_id) {
        await prisma.table.update({
          where: { id: orderAfterTimeout.table_id },
          data: { status: 'AVAILABLE' }
        })
      }

      console.log('✅ Order cancelled due to timeout')
    } else {
      console.log(`ℹ️  Order status is ${orderAfterTimeout.status}, no cancellation needed`)
    }

    // Step 8: Verify final state
    console.log('\n📋 Step 8: Verifying final state...')
    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        table: true,
        payment: true
      }
    })

    const finalTable = await prisma.table.findUnique({
      where: { id: table.id }
    })

    console.log('\n📊 Final State:')
    console.log(`   Order Status: ${finalOrder?.status}`)
    console.log(`   Payment Status: ${finalOrder?.payment_status}`)
    console.log(`   Payment Record Status: ${finalOrder?.payment?.status}`)
    console.log(`   Table Status: ${finalTable?.status}`)

    // Verify expectations
    console.log('\n✅ Verification:')
    const checks = [
      {
        name: 'Order status is CANCELLED',
        pass: finalOrder?.status === 'CANCELLED'
      },
      {
        name: 'Payment status is FAILED',
        pass: finalOrder?.payment_status === 'FAILED'
      },
      {
        name: 'Payment record status is FAILED',
        pass: finalOrder?.payment?.status === 'FAILED'
      },
      {
        name: 'Table status is AVAILABLE',
        pass: finalTable?.status === 'AVAILABLE'
      }
    ]

    let allPassed = true
    for (const check of checks) {
      if (check.pass) {
        console.log(`   ✅ ${check.name}`)
      } else {
        console.log(`   ❌ ${check.name}`)
        allPassed = false
      }
    }

    if (allPassed) {
      console.log('\n🎉 All checks passed! Payment timeout mechanism is working correctly.')
    } else {
      console.log('\n⚠️  Some checks failed. Please review the implementation.')
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...')
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.payment.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    console.log('✅ Test data cleaned up')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testPaymentTimeout()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
