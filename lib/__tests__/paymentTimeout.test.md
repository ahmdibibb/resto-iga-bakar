# Payment Timeout Manual Test Guide

## Overview
This document provides manual testing instructions for the payment timeout mechanism (Task 26).

## Requirements Being Tested
- **Requirement 6.7**: IF payment is not confirmed within 10 minutes, THEN THE System SHALL cancel order automatically and display "Pembayaran gagal, silakan coba lagi"
- **Requirement 15.4**: WHEN payment timeout occurs (10 minutes), THE System SHALL cancel order and display "Pembayaran gagal, silakan coba lagi"

## Test Setup

### Prerequisites
1. Database is running and seeded with tables
2. Application is running (`npm run dev`)
3. At least one table exists in the database with a valid QR token

## Test Cases

### Test Case 1: QRIS Order Timeout Cancellation

**Objective**: Verify that QRIS orders are automatically cancelled after 10 minutes if payment is not confirmed.

**Steps**:
1. Scan a table QR code or navigate to `/menu?table={table_id}&token={qr_token}`
2. Add items to cart
3. Proceed to checkout
4. Select **QRIS** as payment method
5. Enter customer name and submit order
6. Note the order ID from the payment page
7. **Do NOT click "Saya Sudah Bayar" button**
8. Wait for 10 minutes (or modify `TIMEOUT_DURATION` in `lib/paymentTimeout.ts` to 1 minute for faster testing)
9. Check the order status in the database or via polling

**Expected Results**:
- After 10 minutes, the order status should change to `CANCELLED`
- The payment status should change to `FAILED`
- The table status should change back to `AVAILABLE`
- The payment page should display: "Pembayaran Gagal" with message "Pembayaran gagal, silakan coba lagi"
- Console logs should show:
  ```
  [PAYMENT TIMEOUT] Scheduled timeout for order {orderId} in 10 minutes
  [PAYMENT TIMEOUT] Checking order {orderId}...
  [PAYMENT TIMEOUT] Cancelling order {orderId} due to payment timeout
  [PAYMENT TIMEOUT] Table {tableId} set to AVAILABLE
  [PAYMENT TIMEOUT] Order {orderId} cancelled successfully
  ```

**Database Verification**:
```sql
-- Check order status
SELECT id, orderNumber, status, payment_status, table_id 
FROM Order 
WHERE id = '{orderId}';

-- Check table status
SELECT id, name, status 
FROM Table 
WHERE id = '{tableId}';

-- Check payment status
SELECT id, orderId, status 
FROM Payment 
WHERE orderId = '{orderId}';
```

### Test Case 2: QRIS Order Confirmed Before Timeout

**Objective**: Verify that confirmed QRIS orders are NOT cancelled by the timeout mechanism.

**Steps**:
1. Scan a table QR code or navigate to `/menu?table={table_id}&token={qr_token}`
2. Add items to cart
3. Proceed to checkout
4. Select **QRIS** as payment method
5. Enter customer name and submit order
6. **Click "Saya Sudah Bayar" button** within 10 minutes
7. Wait for 10 minutes after order creation
8. Check the order status

**Expected Results**:
- Order status should be `IN_KITCHEN` (not `CANCELLED`)
- Payment status should be `PAID` (not `FAILED`)
- Table status should remain `OCCUPIED`
- Console logs should show:
  ```
  [PAYMENT TIMEOUT] Scheduled timeout for order {orderId} in 10 minutes
  [PAYMENT TIMEOUT] Checking order {orderId}...
  [PAYMENT TIMEOUT] Order {orderId} status is IN_KITCHEN, no action needed
  ```

### Test Case 3: Table Status Updates After Timeout

**Objective**: Verify that table status is correctly updated to AVAILABLE after timeout.

**Steps**:
1. Create a QRIS order for a specific table
2. Note the table ID
3. Verify table status is `OCCUPIED` in database
4. Wait for timeout (10 minutes)
5. Check table status in database

**Expected Results**:
- Table status should change from `OCCUPIED` to `AVAILABLE`
- Another customer should be able to scan the same table QR code and create a new order

**Database Verification**:
```sql
-- Before timeout
SELECT id, name, status FROM Table WHERE id = '{tableId}';
-- Expected: status = 'OCCUPIED'

-- After timeout
SELECT id, name, status FROM Table WHERE id = '{tableId}';
-- Expected: status = 'AVAILABLE'
```

### Test Case 4: Payment Page Displays Timeout Error

**Objective**: Verify that the payment page displays the correct error message when order is cancelled due to timeout.

**Steps**:
1. Create a QRIS order
2. Stay on the payment page (polling is active)
3. Wait for timeout (10 minutes)
4. Observe the payment page UI

**Expected Results**:
- The status message should update to show:
  - Icon: ❌
  - Title: "Pembayaran Gagal"
  - Description: "Pembayaran gagal, silakan coba lagi"
  - Background: Red (bg-red-50 border-2 border-red-200)
- Polling should stop after detecting CANCELLED status
- No error alerts should appear (the status message is sufficient)

### Test Case 5: CASH Orders Are Not Affected

**Objective**: Verify that CASH payment orders are not affected by the timeout mechanism.

**Steps**:
1. Create a CASH order
2. Wait for 10 minutes
3. Check order status

**Expected Results**:
- Order status should remain `IN_KITCHEN` (not cancelled)
- Payment status should remain `UNPAID`
- No timeout logs should appear for this order
- Table status should remain `OCCUPIED`

## Quick Test (Reduced Timeout)

For faster testing, you can temporarily reduce the timeout duration:

1. Open `lib/paymentTimeout.ts`
2. Change line 18 from:
   ```typescript
   const TIMEOUT_DURATION = 10 * 60 * 1000 // 10 minutes
   ```
   to:
   ```typescript
   const TIMEOUT_DURATION = 1 * 60 * 1000 // 1 minute for testing
   ```
3. Restart the development server
4. Run the test cases with 1-minute timeout instead of 10 minutes
5. **Remember to revert this change after testing!**

## Troubleshooting

### Timeout Not Triggering
- Check server console for timeout logs
- Verify the order was created with `payment_method: 'QRIS'`
- Ensure the server hasn't been restarted (setTimeout is in-memory)
- Check if the order status is still `PENDING_PAYMENT`

### Table Status Not Updating
- Verify the order has a `table_id` field
- Check database for foreign key constraints
- Look for error logs in the timeout handler

### Payment Page Not Updating
- Verify polling is active (check network tab for `/api/orders/status` calls)
- Check if polling interval is set to 5 seconds
- Ensure the session_id is correctly stored in localStorage

## Success Criteria

All test cases should pass with the following outcomes:
- ✅ QRIS orders are cancelled after 10 minutes if not confirmed
- ✅ Confirmed QRIS orders are not affected by timeout
- ✅ Table status updates to AVAILABLE after timeout
- ✅ Payment page displays correct error message
- ✅ CASH orders are not affected by timeout mechanism
- ✅ Console logs show correct timeout processing messages

## Notes

- The current implementation uses `setTimeout` which is suitable for development but should be replaced with a proper job queue system (Bull/BullMQ, Vercel Cron, etc.) in production
- The timeout is in-memory, so server restarts will clear scheduled timeouts
- For production, consider implementing a database-based job queue or scheduled task system
