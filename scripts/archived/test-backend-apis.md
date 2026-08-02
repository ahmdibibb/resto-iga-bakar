# Backend API Testing Checklist

## Phase 2 Backend APIs - Manual Testing Guide

### Prerequisites
1. Start development server: `npm run dev`
2. Ensure database is seeded: `npm run seed`
3. Have Postman/Thunder Client/curl ready

---

## ✅ Task 6: Table Management APIs

### 6.1 GET /api/admin/tables
**Test**: Fetch all tables
```bash
# Login as admin first to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@resto.com","password":"admin123"}'

# Then fetch tables (use token from login response)
curl http://localhost:3000/api/admin/tables \
  -H "Cookie: token=YOUR_TOKEN_HERE"
```
**Expected**: Returns 10 tables (1-10) with status AVAILABLE

### 6.2 POST /api/admin/tables/generate-qr
**Test**: Generate QR code for table
```bash
curl -X POST http://localhost:3000/api/admin/tables/generate-qr \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN_HERE" \
  -d '{"tableId":"TABLE_ID_FROM_STEP_6.1"}'
```
**Expected**: Returns table info with qr_url

### 6.3 PATCH /api/admin/tables/[id]/reset
**Test**: Reset table status to AVAILABLE
```bash
curl -X PATCH http://localhost:3000/api/admin/tables/TABLE_ID/reset \
  -H "Cookie: token=YOUR_TOKEN_HERE"
```
**Expected**: Returns updated table with status AVAILABLE

---

## ✅ Task 8: Order Creation API

### 8.1 POST /api/orders (Anonymous QRIS Order)
**Test**: Create order with QRIS payment
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId":"PRODUCT_ID","quantity":2}],
    "orderType": "DINE_IN",
    "customerName": "John Doe",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "table_id": "TABLE_ID",
    "payment_method": "QRIS"
  }'
```
**Expected**: 
- Returns order with status PENDING_PAYMENT
- Returns qris object with qr_string
- Table status updated to OCCUPIED

### 8.1 POST /api/orders (Anonymous CASH Order)
**Test**: Create order with CASH payment
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId":"PRODUCT_ID","quantity":1}],
    "orderType": "DINE_IN",
    "customerName": "Jane Doe",
    "session_id": "550e8400-e29b-41d4-a716-446655440001",
    "table_id": "TABLE_ID",
    "payment_method": "CASH"
  }'
```
**Expected**: 
- Returns order with status IN_KITCHEN
- payment_status is UNPAID
- Table status updated to OCCUPIED

---

## ✅ Task 9: Order Status Polling API

### 9. GET /api/orders/[session_id]/status
**Test**: Get order status by session_id
```bash
curl http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000/status
```
**Expected**: Returns order with status, payment_status, items, table info

---

## ✅ Task 10: Payment Confirmation API

### 10.1 PATCH /api/orders/[id]/confirm-payment (QRIS - Customer)
**Test**: Customer confirms QRIS payment
```bash
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/confirm-payment
```
**Expected**: 
- Order status updated to IN_KITCHEN
- payment_status updated to PAID

### 10.1 PATCH /api/orders/[id]/confirm-payment (CASH - Kasir)
**Test**: Kasir confirms cash payment
```bash
# Login as kasir first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kasir@resto.com","password":"kasir123"}'

# Confirm cash payment
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/confirm-payment \
  -H "Cookie: token=KASIR_TOKEN_HERE"
```
**Expected**: 
- Order status updated to COMPLETED
- payment_status updated to PAID
- Table status updated to AVAILABLE

---

## ✅ Task 11: Kasir Order Queue API

### 11.1 GET /api/kasir/orders
**Test**: Fetch Kasir order queue
```bash
curl http://localhost:3000/api/kasir/orders \
  -H "Cookie: token=KASIR_TOKEN_HERE"
```
**Expected**: Returns orders with status IN_KITCHEN or READY

### 11.2 PATCH /api/orders/[id]/status
**Test**: Update order status to READY
```bash
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Cookie: token=KASIR_TOKEN_HERE" \
  -d '{"status":"READY"}'
```
**Expected**: Order status updated to READY

---

## ✅ Task 12: Payment Timeout

### 12. Payment Timeout Handler
**Test**: Create QRIS order and wait 10 minutes
1. Create QRIS order (see Task 8.1)
2. Do NOT confirm payment
3. Wait 10 minutes
4. Check order status

**Expected**: 
- Order status updated to CANCELLED
- payment_status updated to FAILED
- Table status updated to AVAILABLE
- Console log shows timeout message

---

## ✅ Task 13: Middleware

### 13. Anonymous Routes
**Test**: Access customer routes without login
```bash
# Should work without authentication
curl http://localhost:3000/menu
curl http://localhost:3000/checkout
curl http://localhost:3000/payment/ORDER_ID
curl http://localhost:3000/receipt/ORDER_ID
```
**Expected**: All routes accessible without authentication

### 13. Kasir Routes
**Test**: Access /kasir without authentication
```bash
curl http://localhost:3000/kasir
```
**Expected**: Redirects to /login

**Test**: Access /kasir with Kasir token
```bash
curl http://localhost:3000/kasir \
  -H "Cookie: token=KASIR_TOKEN_HERE"
```
**Expected**: Access granted

---

## Summary Checklist

- [ ] All table management APIs work (GET, POST, PATCH)
- [ ] Order creation works for QRIS (PENDING_PAYMENT)
- [ ] Order creation works for CASH (IN_KITCHEN)
- [ ] Order status polling returns correct data
- [ ] QRIS payment confirmation works (customer)
- [ ] CASH payment confirmation works (Kasir)
- [ ] Kasir order queue shows IN_KITCHEN and READY orders
- [ ] Order status update works (IN_KITCHEN → READY)
- [ ] Payment timeout cancels order after 10 minutes
- [ ] Anonymous routes accessible without auth
- [ ] Kasir routes protected with KASIR role
- [ ] Middleware redirects /kitchen to /kasir

---

## Notes
- Replace `YOUR_TOKEN_HERE`, `TABLE_ID`, `PRODUCT_ID`, `ORDER_ID` with actual values
- Use browser DevTools Network tab to inspect responses
- Check server console for logs and errors
- Verify database changes with Prisma Studio: `npx prisma studio`
