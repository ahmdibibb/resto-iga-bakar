# Requirements Document

## Introduction

Sistem QR Code Table Ordering adalah fitur yang memungkinkan customer untuk memesan makanan/minuman tanpa login dengan cara scan QR Code yang ada di setiap meja. Sistem ini menghilangkan kebutuhan autentikasi untuk customer, menggunakan session anonymous berbasis localStorage, dan mendukung dua metode pembayaran: QRIS (online via Xendit) dan Cash (bayar di kasir).

## Glossary

- **System**: Aplikasi web self-order restaurant
- **Customer**: Pengunjung restoran yang memesan tanpa login
- **Admin**: Pengguna dengan role ADMIN yang mengelola sistem dan monitoring
- **Kasir**: Pengguna dengan role KASIR yang memproses pesanan dan mengkonfirmasi pembayaran cash
- **QR_Code**: Kode QR unik per meja yang berisi URL dengan table ID dan token
- **Session_ID**: UUID yang di-generate otomatis untuk melacak customer anonymous
- **Table**: Meja restoran dengan status available/occupied
- **Order**: Pesanan yang dibuat oleh customer
- **Cart**: Keranjang belanja yang disimpan di localStorage
- **Payment_Method**: Metode pembayaran (QRIS atau CASH)
- **Order_Status**: Status pesanan (PENDING_PAYMENT, IN_KITCHEN, READY, COMPLETED, CANCELLED)
- **Payment_Status**: Status pembayaran (UNPAID, PAID, FAILED)
- **Xendit_Client**: Library/service untuk integrasi payment gateway QRIS

## Requirements

### Requirement 1: QR Code Generation dan Management

**User Story:** As an Admin, I want to generate unique QR codes for each table, so that customers can scan and start ordering without login.

#### Acceptance Criteria

1. THE Admin SHALL generate QR codes containing URL format `https://domain.com/menu?table={table_id}&token={static_token}`
2. WHEN Admin generates a QR code, THE System SHALL create a unique static token per table and store it in the database
3. THE System SHALL associate each QR code with a specific table record in the database
4. THE Admin SHALL view all generated QR codes with their associated table information
5. THE Admin SHALL download QR code images for printing
6. THE System SHALL validate that table_id and token exist in database when QR code is scanned

### Requirement 2: Anonymous Session Management

**User Story:** As a Customer, I want to browse and order without creating an account, so that I can quickly place my order.

#### Acceptance Criteria

1. WHEN Customer scans QR code and opens the URL, THE System SHALL generate a session_id using crypto.randomUUID()
2. THE System SHALL store session_id in localStorage for session persistence
3. WHEN Customer refreshes the page, THE System SHALL retrieve session_id from localStorage to maintain the session
4. IF a table has status "occupied" and Customer scans the same table QR code, THEN THE System SHALL display error message "Meja ini sedang digunakan. Hubungi staff jika ini keliru."
5. THE System SHALL allow only one active session per table at any given time
6. WHEN Customer completes order and payment, THE System SHALL mark the table as "available" and clear the session

### Requirement 3: Menu Browsing Without Authentication

**User Story:** As a Customer, I want to browse the menu without logging in, so that I can see available products immediately after scanning QR code.

#### Acceptance Criteria

1. WHEN Customer opens menu URL from QR code, THE System SHALL display menu page without requiring authentication
2. THE System SHALL display table name in the header (e.g., "Meja A1")
3. THE System SHALL allow Customer to filter menu by category (ALL, MAKANAN, MINUMAN)
4. THE System SHALL display product information including name, description, price, image, and stock status
5. THE System SHALL prevent adding out-of-stock items to cart
6. THE System SHALL store cart items in localStorage without server communication until checkout

### Requirement 4: Cart Management in LocalStorage

**User Story:** As a Customer, I want my cart to persist when I refresh the page, so that I don't lose my selections.

#### Acceptance Criteria

1. WHEN Customer adds item to cart, THE System SHALL store cart data in localStorage with structure `{productId, name, price, quantity}`
2. WHEN Customer updates item quantity, THE System SHALL update localStorage immediately
3. WHEN Customer removes item from cart, THE System SHALL remove it from localStorage
4. WHEN Customer refreshes page, THE System SHALL load cart from localStorage and display items
5. THE System SHALL validate stock availability before allowing quantity increase
6. THE System SHALL calculate total price from localStorage cart data

### Requirement 5: Checkout with Payment Method Selection

**User Story:** As a Customer, I want to choose between QRIS and Cash payment, so that I can pay using my preferred method.

#### Acceptance Criteria

1. WHEN Customer clicks checkout, THE System SHALL display payment method selection (QRIS or CASH)
2. THE System SHALL validate that cart is not empty before proceeding to checkout
3. THE System SHALL validate that table_id from QR code is valid
4. THE System SHALL include session_id in checkout payload
5. WHEN Customer selects payment method, THE System SHALL proceed to respective payment flow
6. THE System SHALL display table name during checkout process

### Requirement 6: QRIS Payment Flow (Online via Xendit)

**User Story:** As a Customer, I want to pay using QRIS, so that I can complete payment online without going to cashier.

#### Acceptance Criteria

1. WHEN Customer selects QRIS payment, THE System SHALL create order with status PENDING_PAYMENT
2. THE System SHALL call Xendit API to generate QRIS code (placeholder function in `/lib/xendit.ts` for now)
3. THE System SHALL display QRIS code to Customer for scanning
4. THE System SHALL display "Saya Sudah Bayar" button for manual payment confirmation by Customer
5. WHEN Customer clicks "Saya Sudah Bayar" button, THE System SHALL update order status to IN_KITCHEN and payment_status to PAID
6. WHEN payment is confirmed, THE System SHALL send order to Kasir queue
7. IF payment is not confirmed within 10 minutes, THEN THE System SHALL cancel order automatically and display "Pembayaran gagal, silakan coba lagi"
8. WHEN order status becomes IN_KITCHEN, THE System SHALL display confirmation page to Customer with message "Pesanan Anda sedang diproses oleh Kasir"

### Requirement 7: Cash Payment Flow (Pay at Cashier)

**User Story:** As a Customer, I want to pay with cash at the cashier, so that I can order first and pay later.

#### Acceptance Criteria

1. WHEN Customer selects Cash payment, THE System SHALL create order with status IN_KITCHEN and payment_status UNPAID
2. THE System SHALL send order to Kasir queue immediately
3. THE System SHALL display confirmation message "Pesanan sedang diproses oleh Kasir. Silakan siapkan pembayaran cash."
4. THE System SHALL poll order status every 5 seconds to show real-time updates
5. THE System SHALL display order details including table number and order items
6. WHEN Kasir marks order as READY, THE System SHALL notify Customer on their screen with message "Pesanan siap! Silakan ke kasir untuk pembayaran."
7. WHEN Customer pays cash at cashier, THE Kasir SHALL confirm payment and THE System SHALL update order status to COMPLETED and payment_status to PAID

### Requirement 8: Kasir Order Display and Processing

**User Story:** As Kasir staff, I want to see all incoming orders with payment method badges, so that I can process orders and confirm cash payments efficiently.

#### Acceptance Criteria

1. THE Kasir SHALL view all orders with status IN_KITCHEN
2. WHEN new order arrives, THE System SHALL display it in Kasir queue within 5 seconds (via polling)
3. THE System SHALL display order card with table name, items list, quantity, notes, and payment method badge
4. THE System SHALL display "QRIS" badge in green color for QRIS orders (already paid)
5. THE System SHALL display "CASH" badge in orange color for Cash orders (unpaid)
6. WHEN Kasir clicks "Selesai Dibuat", THE System SHALL update order status to READY
7. FOR Cash orders with status READY, THE System SHALL display "Konfirmasi Pembayaran Cash" button
8. WHEN Kasir clicks "Konfirmasi Pembayaran Cash", THE System SHALL update order status to COMPLETED and payment_status to PAID
9. THE System SHALL poll Kasir orders every 5 seconds for real-time updates
10. WHEN order status becomes COMPLETED, THE System SHALL update table status to "available"

### Requirement 9: Admin Order Monitoring

**User Story:** As Admin, I want to monitor all orders and their payment status, so that I can oversee restaurant operations.

#### Acceptance Criteria

1. THE Admin SHALL view all orders with filter options by status, payment_method, and table
2. THE System SHALL display order details including table name, items, payment method, payment status, and order status
3. THE Admin SHALL view real-time order updates via polling every 5 seconds
4. THE Admin SHALL view QRIS orders with payment_status PAID (no manual action required)
5. THE Admin SHALL view Cash orders with their current status (IN_KITCHEN, READY, COMPLETED)
6. THE System SHALL display order history with timestamps for status changes
7. THE Admin SHALL manually reset table status to "available" if needed for error recovery

### Requirement 10: Table Status Management

**User Story:** As the System, I want to track table occupancy status, so that multiple customers cannot use the same table simultaneously.

#### Acceptance Criteria

1. WHEN Customer scans QR code and creates session, THE System SHALL update table status to "occupied"
2. WHILE table status is "occupied", THE System SHALL prevent new sessions from being created for that table
3. WHEN order is completed (status COMPLETED), THE System SHALL update table status to "available"
4. WHEN order is cancelled, THE System SHALL update table status to "available"
5. THE Admin SHALL manually reset table status to "available" if needed
6. THE System SHALL display current table status in Admin dashboard

### Requirement 11: Middleware Authentication Bypass for Customer Routes

**User Story:** As a Customer, I want to access menu and ordering pages without authentication, so that I can order immediately after scanning QR code.

#### Acceptance Criteria

1. THE System SHALL allow unauthenticated access to `/menu` route
2. THE System SHALL allow unauthenticated access to `/checkout` route
3. THE System SHALL allow unauthenticated access to `/payment/*` routes
4. THE System SHALL allow unauthenticated access to `/receipt/*` routes
5. THE System SHALL allow unauthenticated POST to `/api/orders` endpoint
6. THE System SHALL maintain authentication requirements for `/admin` and `/kasir` routes
7. THE System SHALL validate session_id instead of user authentication for customer orders

### Requirement 12: Database Schema Updates

**User Story:** As a Developer, I want the database schema to support QR code table ordering, so that the system can store necessary data.

#### Acceptance Criteria

1. THE System SHALL add `tables` table with fields: id, name, qr_token, status (available/occupied), created_at, updated_at
2. THE System SHALL modify `orders` table to make `userId` field optional (nullable)
3. THE System SHALL add `session_id` field to `orders` table for anonymous customer tracking
4. THE System SHALL add `table_id` field to `orders` table as foreign key to `tables`
5. THE System SHALL maintain existing `payment_method` enum (CASH, QRIS, EDC)
6. THE System SHALL update `user_role` enum to replace KITCHEN with KASIR
7. THE System SHALL maintain existing `order_status` enum with addition of PENDING_PAYMENT status
8. THE System SHALL maintain existing `payment_status` enum (UNPAID, PAID, FAILED)

### Requirement 13: Xendit Integration Placeholder

**User Story:** As a Developer, I want a placeholder for Xendit integration, so that QRIS payment can be easily integrated later.

#### Acceptance Criteria

1. THE System SHALL create `/lib/xendit.ts` file with placeholder functions
2. THE Xendit_Client SHALL export function `generateQRIS(orderId, amount)` that returns mock QR string
3. THE Xendit_Client SHALL export function `checkPaymentStatus(transactionId)` that returns mock status
4. THE System SHALL include TODO comments indicating where real Xendit API calls should be implemented
5. THE System SHALL structure Xendit functions to accept orderId and amount as parameters
6. THE System SHALL return mock data structure matching expected Xendit API response format

### Requirement 14: Real-time Order Status Polling

**User Story:** As a Customer, I want to see my order status update in real-time, so that I know when my food is ready.

#### Acceptance Criteria

1. WHEN Customer is on order status page, THE System SHALL poll GET `/api/orders/[session_id]/status` every 5 seconds
2. THE System SHALL display current order status (PENDING_PAYMENT, IN_KITCHEN, READY, COMPLETED)
3. WHEN order status changes, THE System SHALL update UI within 5 seconds
4. THE System SHALL display estimated time or progress indicator for order preparation
5. WHEN order status becomes READY, THE System SHALL display prominent notification to Customer
6. THE System SHALL stop polling when order status becomes COMPLETED or CANCELLED

### Requirement 15: Error Handling and Validation

**User Story:** As the System, I want to handle errors gracefully, so that customers have a smooth experience even when issues occur.

#### Acceptance Criteria

1. WHEN QR code token is invalid, THE System SHALL display error "QR Code tidak valid. Hubungi staff."
2. WHEN table is already occupied, THE System SHALL display error "Meja ini sedang digunakan. Hubungi staff jika ini keliru."
3. WHEN product stock is insufficient, THE System SHALL display error "Stok tidak cukup untuk {product_name}"
4. WHEN payment timeout occurs (10 minutes), THE System SHALL cancel order and display "Pembayaran gagal, silakan coba lagi"
5. WHEN network error occurs during checkout, THE System SHALL display error "Koneksi gagal. Silakan coba lagi."
6. THE System SHALL log all errors to console for debugging purposes
7. THE System SHALL restore cart from localStorage if checkout fails
