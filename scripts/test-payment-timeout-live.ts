/**
 * Live Integration Test for Payment Timeout with schedulePaymentTimeout
 * 
 * This script tests the actual schedulePaymentTimeout function by:
 * 1. Creating a test QRIS order
 * 2. Calling schedulePaymentTimeout (with reduced timeout for testing)
 * 3. Waiting for the timeout to trigger
 * 4. Verifying the order was cancelled
 * 
 * Usage:
 *   npx tsx scripts/test-payment-timeout-live.ts
 * 
 * Prerequisites:
 *   - Database is running and seeded
 *   - At least one table exists with status AVAILABLE
 *   - Temporarily modify TIMEOUT_DURATION in lib/paymentTimeout.ts to 30 seconds
 * 
 * IMPORTANT: This test requires modifying lib/paymentTimeout.ts temporarily:
 *   Change: const TIMEOUT_DURATION = 10 * 60 * 1000
 *   To:     const TIMEOUT_DURATION = 30 * 1000
 *   Remember to revert after testing!
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testLivePaymentTimeout() {
  console.log('🧪 Live Payment Timeout Integration Test\n')
  console.log('⚠️  IMPORTANT: Make sure TIMEOUT_DURATION in lib/paymentTimeout.ts is set to 30 seconds for testing!\n')

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
    const orderNumber = `LIVE-TEST-${Date.now()}`
    const sessionId = crypto.randomUUID()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        session_id: sessionId,
        table_id: table.id,
        customerName: 'Live Test Customer',
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

    // Step 6: Call schedulePaymentTimeout
    console.log('\n📋 Step 6: Calling schedulePaymentTimeout...')
    const { schedulePaymentTimeout } = await import('../lib/paymentTimeout')
    schedulePaymentTimeout(order.id)
    console.log('✅ Timeout scheduled')

    // Step 7: Wait for timeout to trigger (35 seconds to be safe)
    console.log('\n📋 Step 7: Waiting for timeout to trigger...')
    console.log('⏳ Waiting 35 seconds...')
    console.log('   Watch the console for [PAYMENT TIMEOUT] logs')
    
    await new Promise(resolve => setTimeout(resolve, 35000))

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
      console.log('\n🎉 All checks passed! schedulePaymentTimeout is working correctly.')
      console.log('\n⚠️  Remember to revert TIMEOUT_DURATION in lib/paymentTimeout.ts back to 10 minutes!')
    } else {
      console.log('\n⚠️  Some checks failed. Please review the implementation.')
      console.log('\nPossible issues:')
      console.log('   - TIMEOUT_DURATION might not be set to 30 seconds')
      console.log('   - The timeout might not have triggered yet (wait longer)')
      console.log('   - Check console for [PAYMENT TIMEOUT] logs')
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
testLivePaymentTimeout()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
