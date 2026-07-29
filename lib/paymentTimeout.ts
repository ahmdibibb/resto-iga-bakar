import { prisma } from './prisma'

// Read timeout duration from environment variable (default: 10 minutes)
// Set PAYMENT_TIMEOUT_MINUTES in .env to override
const TIMEOUT_MINUTES = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '10', 10)
const TIMEOUT_DURATION = TIMEOUT_MINUTES * 60 * 1000

/**
 * Schedule payment timeout for QRIS orders.
 * After PAYMENT_TIMEOUT_MINUTES, if payment is not confirmed, cancel the order.
 *
 * ⚠️  PRODUCTION NOTE:
 * This setTimeout implementation is suitable for single-instance development only.
 * In production, replace with a persistent job queue such as:
 *   - BullMQ + Redis  (recommended)
 *   - Vercel Cron Jobs
 *   - AWS SQS / Lambda scheduled functions
 *   - Database-based polling worker
 * Reasons: setTimeout does not survive server restarts and does not scale
 * across multiple instances.
 */
export function schedulePaymentTimeout(orderId: string): void {
  setTimeout(async () => {
    try {
      console.log(`[PAYMENT TIMEOUT] Checking order ${orderId}...`)

      const order = await prisma.order.findUnique({
        where: { id: orderId },
      })

      if (!order) {
        console.log(`[PAYMENT TIMEOUT] Order ${orderId} not found`)
        return
      }

      // Only cancel if still awaiting payment
      if (order.status === 'PENDING_PAYMENT') {
        console.log(`[PAYMENT TIMEOUT] Cancelling order ${orderId} due to payment timeout`)

        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED', payment_status: 'FAILED' },
        })

        await prisma.payment.updateMany({
          where: { orderId },
          data: { status: 'FAILED' },
        })

        if (order.table_id) {
          await prisma.table.update({
            where: { id: order.table_id },
            data: { status: 'AVAILABLE' },
          })
          console.log(`[PAYMENT TIMEOUT] Table ${order.table_id} set to AVAILABLE`)
        }

        console.log(`[PAYMENT TIMEOUT] Order ${orderId} cancelled successfully`)
      } else {
        console.log(
          `[PAYMENT TIMEOUT] Order ${orderId} status is ${order.status}, no action needed`
        )
      }
    } catch (error) {
      console.error(`[PAYMENT TIMEOUT] Error processing timeout for order ${orderId}:`, error)
    }
  }, TIMEOUT_DURATION)

  console.log(
    `[PAYMENT TIMEOUT] Scheduled timeout for order ${orderId} in ${TIMEOUT_MINUTES} minutes`
  )
}

/**
 * Cancel payment timeout.
 * Currently a no-op — implement job cancellation when migrating to a proper queue.
 */
export function cancelPaymentTimeout(orderId: string): void {
  // TODO: cancel the scheduled job when using BullMQ or similar
  console.log(`[PAYMENT TIMEOUT] Timeout cancelled for order ${orderId}`)
}
