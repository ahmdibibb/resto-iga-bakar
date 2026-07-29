# Implementation Plan: QR Code Table Ordering System

## Overview

This implementation plan converts the QR Code Table Ordering System design into actionable coding tasks. The system enables anonymous customer ordering via QR codes, supports QRIS and Cash payment methods, and provides role-based interfaces for Kasir staff and Admin users.

**Key Implementation Approach**:
- Incremental development across 5 phases
- Database schema updates first to establish foundation
- Backend API development before frontend
- Integration and testing to ensure reliability
- Each task builds on previous work with no orphaned code

**Technology Stack**: Next.js 14 (App Router), TypeScript, Prisma ORM, MySQL, Tailwind CSS

## Tasks

### Phase 1: Database Schema Updates

- [x] 1. Update Prisma schema with new models and enums
  - Add `Table` model with fields: id, name, qr_token, status, createdAt, updatedAt
  - Add `TableStatus` enum with values: AVAILABLE, OCCUPIED
  - Update `UserRole` enum: replace KITCHEN with KASIR
  - Update `OrderStatus` enum: add PENDING_PAYMENT status
  - Update `Order` model: make userId nullable, add session_id, table_id, payment_status, payment_method fields
  - Update `Payment` model: add qris_string and expires_at fields
  - Add foreign key relationship from Order to Table
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [x] 2. Create and run database migration
  - Generate Prisma migration with `prisma migrate dev --name add-qr-table-ordering`
  - Verify migration creates tables table with correct schema
  - Verify migration updates orders table with new fields
  - Verify migration updates enums correctly
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [x] 3. Create seed data for tables
  - Create seed script to generate 10 sample tables (A1-A5, B1-B5)
  - Generate unique qr_token for each table using crypto.randomUUID()
  - Set all tables to AVAILABLE status initially
  - Update existing seed data to use KASIR role instead of KITCHEN
  - Run seed script with `npm run seed`
  - _Requirements: 1.2, 1.3, 12.1_

- [x] 4. Checkpoint - Verify database schema
  - Run `npx prisma studio` to verify tables exist
  - Verify Table model has correct fields and relationships
  - Verify Order model has nullable userId and new fields
  - Verify enums are updated correctly
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: Backend API Development

- [x] 5. Create Xendit placeholder service
  - Create `/lib/xendit.ts` file
  - Implement `generateQRIS(orderId: string, amount: number)` function returning mock QRIS data
  - Implement `checkPaymentStatus(transactionId: string)` function returning mock status
  - Add TODO comments for real Xendit API integration
  - Return mock data matching Xendit API response format
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 6. Create table validation and QR code generation API
  - [x] 6.1 Create GET `/api/admin/tables` endpoint
    - Fetch all tables with status
    - Return table list with id, name, qr_token, status
    - Protect with ADMIN role check
    - _Requirements: 1.4, 10.6_
  
  - [x] 6.2 Create POST `/api/admin/tables/generate-qr` endpoint
    - Accept tableId in request body
    - Generate QR code URL: `https://domain.com/menu?table={table_id}&token={qr_token}`
    - Use qrcode.react library to generate QR code data URL
    - Return table info and QR code data URL
    - Protect with ADMIN role check
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [x] 6.3 Create PATCH `/api/admin/tables/[id]/reset` endpoint
    - Accept table ID as parameter
    - Update table status to AVAILABLE
    - Return updated table data
    - Protect with ADMIN role check
    - _Requirements: 9.7, 10.5_

- [x] 7. Create table validation middleware
  - Create `/lib/tableValidation.ts` file
  - Implement `validateTableAvailability(tableId: string, qr_token: string)` function
  - Check table exists in database
  - Verify qr_token matches table record
  - Check table status is AVAILABLE
  - Return validation result with error messages
  - _Requirements: 1.6, 2.4, 15.1, 15.2_

- [x] 8. Update order creation API for anonymous users
  - [x] 8.1 Update POST `/api/orders` endpoint
    - Make userId optional in request validation
    - Add session_id validation (must be valid UUID v4)
    - Add table_id validation using validateTableAvailability
    - Add customerName validation (required when userId is null)
    - Support payment_method selection (QRIS or CASH)
    - For QRIS: create order with status PENDING_PAYMENT, call generateQRIS
    - For CASH: create order with status IN_KITCHEN, payment_status UNPAID
    - Update table status to OCCUPIED when order is created
    - Return order data with QRIS code if applicable
    - _Requirements: 2.1, 2.2, 2.3, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 7.1, 7.2, 10.1_
  
  - [ ]* 8.2 Write unit tests for order creation
    - Test anonymous order creation with valid session_id
    - Test order rejection with invalid table token
    - Test order rejection when table is occupied
    - Test QRIS order creates PENDING_PAYMENT status
    - Test CASH order creates IN_KITCHEN status
    - Test table status updates to OCCUPIED
    - _Requirements: 2.1, 2.4, 6.1, 7.1, 10.1_

- [x] 9. Create order status polling API
  - Create GET `/api/orders/[session_id]/status` endpoint
  - Accept session_id as URL parameter
  - Find order by session_id
  - Return order status, payment_status, items, table info
  - Allow unauthenticated access (customer polling)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 10. Create payment confirmation API
  - [x] 10.1 Create PATCH `/api/orders/[id]/confirm-payment` endpoint
    - Accept order ID as parameter
    - For QRIS orders: update status to IN_KITCHEN, payment_status to PAID
    - For CASH orders: update status to COMPLETED, payment_status to PAID, table status to AVAILABLE
    - Return updated order data
    - Allow unauthenticated access for QRIS confirmation (customer action)
    - Require KASIR role for CASH confirmation
    - _Requirements: 6.5, 6.8, 7.7, 8.8_
  
  - [ ]* 10.2 Write integration tests for payment confirmation
    - Test QRIS payment confirmation updates status correctly
    - Test CASH payment confirmation by Kasir
    - Test table status updates to AVAILABLE after CASH payment
    - Test unauthorized access is rejected for CASH confirmation
    - _Requirements: 6.5, 7.7, 8.8, 10.4_

- [x] 11. Create Kasir order queue API
  - [x] 11.1 Create GET `/api/kasir/orders` endpoint
    - Fetch orders with status IN_KITCHEN or READY
    - Include order items, table info, payment method, payment status
    - Sort by createdAt ascending (oldest first)
    - Protect with KASIR or ADMIN role check
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 11.2 Create PATCH `/api/orders/[id]/status` endpoint
    - Accept order ID and new status in request body
    - Update order status (IN_KITCHEN → READY)
    - Return updated order data
    - Protect with KASIR or ADMIN role check
    - _Requirements: 8.6, 8.7_

- [x] 12. Create payment timeout handler
  - Create `/lib/paymentTimeout.ts` file
  - Implement `schedulePaymentTimeout(orderId: string)` function
  - Set 10-minute timeout for PENDING_PAYMENT orders
  - After timeout: update order status to CANCELLED, payment_status to FAILED
  - Update table status to AVAILABLE when order is cancelled
  - Call this function after creating QRIS orders
  - _Requirements: 6.7, 15.4_

- [x] 13. Update middleware for anonymous routes
  - Update `/middleware.ts` file
  - Add `/menu` to public customer routes (no auth required)
  - Add `/checkout` to public customer routes
  - Add `/payment/*` to public customer routes
  - Add `/receipt/*` to public customer routes
  - Update `/kitchen` route check to `/kasir` route check
  - Update role check from KITCHEN to KASIR
  - Allow unauthenticated POST to `/api/orders`
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 14. Checkpoint - Test backend APIs
  - Test table QR generation API with Postman/curl
  - Test anonymous order creation with valid session_id
  - Test order status polling endpoint
  - Test payment confirmation endpoints
  - Test Kasir order queue API
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Frontend Development

- [x] 15. Update menu page for QR code handling
  - [x] 15.1 Update `/app/menu/page.tsx`
    - Extract `table` and `token` query parameters from URL
    - Generate session_id using crypto.randomUUID() if not in localStorage
    - Store session_id in localStorage
    - Validate table and token by calling backend API
    - Display error message if table is occupied or token is invalid
    - Store tableNumber in localStorage for checkout
    - Display table name in CustomerNavbar
    - Keep existing product listing and cart functionality
    - _Requirements: 1.6, 2.1, 2.2, 2.3, 3.1, 3.2, 15.1, 15.2_
  
  - [ ]* 15.2 Write component tests for menu page
    - Test session_id generation and localStorage storage
    - Test QR parameter extraction from URL
    - Test error display for invalid QR code
    - Test error display for occupied table
    - _Requirements: 2.1, 2.2, 2.4, 15.1, 15.2_

- [x] 16. Update checkout page for anonymous orders
  - [x] 16.1 Update `/app/checkout/page.tsx`
    - Load cart from localStorage
    - Load tableNumber from localStorage (auto-fill for dine-in)
    - Add customerName input field (required for anonymous orders)
    - Add payment method selection: QRIS or CASH radio buttons
    - Validate customerName is not empty before submission
    - On submit: call POST `/api/orders` with session_id, table_id, customerName, payment_method
    - Redirect to `/payment/[orderId]` after successful order creation
    - Display error messages for validation failures
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 15.3_
  
  - [ ]* 16.2 Write integration tests for checkout flow
    - Test order creation with QRIS payment method
    - Test order creation with CASH payment method
    - Test validation error for empty customerName
    - Test redirect to payment page after successful order
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 7.1_

- [-] 17. Create payment page
  - [x] 17.1 Create `/app/payment/[orderId]/page.tsx`
    - Fetch order details by orderId
    - Display payment method badge (QRIS or CASH)
    - For QRIS: display QR code using qrcode.react library
    - For QRIS: display "Saya Sudah Bayar" button
    - For CASH: display "Pesanan sedang diproses oleh Kasir" message
    - Implement polling: call GET `/api/orders/[session_id]/status` every 5 seconds
    - When status changes to IN_KITCHEN (QRIS) or READY (CASH), update UI
    - Display order items, table number, total amount
    - Stop polling when status becomes COMPLETED or CANCELLED
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.8, 7.2, 7.3, 7.4, 7.6, 14.1, 14.2, 14.3, 14.5, 14.6_
  
  - [ ]* 17.2 Write component tests for payment page
    - Test QRIS code display
    - Test "Saya Sudah Bayar" button functionality
    - Test CASH payment message display
    - Test polling service starts on mount
    - Test polling service stops on unmount
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 7.2, 7.3, 14.1_

- [x] 18. Create receipt page
  - Create `/app/receipt/[orderId]/page.tsx`
  - Fetch order details by orderId
  - Display order summary: order number, items, quantities, prices
  - Display payment method badge
  - Display order status badge
  - Display table number
  - Display timestamps (created, updated)
  - Add "Pesan Lagi" button redirecting to `/menu`
  - _Requirements: 6.8, 7.7_

- [x] 19. Create Kasir dashboard
  - [x] 19.1 Rename `/app/kitchen/page.tsx` to `/app/kasir/page.tsx`
    - Update page title to "Kasir Dashboard"
    - Fetch orders from GET `/api/kasir/orders`
    - Display order cards with table name, items, quantities, notes
    - Display payment method badge: QRIS (green), CASH (orange)
    - Display payment status indicator
    - For orders with status IN_KITCHEN: show "Selesai Dibuat" button
    - For CASH orders with status READY: show "Konfirmasi Pembayaran Cash" button
    - Implement polling: refresh orders every 5 seconds
    - On "Selesai Dibuat" click: call PATCH `/api/orders/[id]/status` with status READY
    - On "Konfirmasi Pembayaran Cash" click: call PATCH `/api/orders/[id]/confirm-payment`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_
  
  - [ ]* 19.2 Write component tests for Kasir dashboard
    - Test order list display with payment badges
    - Test "Selesai Dibuat" button updates order status
    - Test "Konfirmasi Pembayaran Cash" button confirms payment
    - Test polling service refreshes orders
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

- [x] 20. Update Admin dashboard for table management
  - [x] 20.1 Update `/app/admin/page.tsx`
    - Add filter for payment_method (ALL, QRIS, CASH)
    - Add filter for table (dropdown with all tables)
    - Display payment method badge in order cards
    - Display payment status in order cards
    - Display table name in order cards
    - Add "Reset Table Status" button for each order
    - On "Reset Table Status" click: call PATCH `/api/admin/tables/[id]/reset`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.5_
  
  - [ ]* 20.2 Write integration tests for Admin dashboard
    - Test order filtering by payment method
    - Test order filtering by table
    - Test table status reset functionality
    - _Requirements: 9.1, 9.2, 9.7, 10.5_

- [x] 21. Create QR code generator page
  - Create `/app/admin/qr-generator/page.tsx`
  - Fetch all tables from GET `/api/admin/tables`
  - Display table list with name, status, and "Generate QR" button
  - On "Generate QR" click: call POST `/api/admin/tables/generate-qr`
  - Display QR code preview using qrcode.react library
  - Add "Download QR Code" button to save QR as image
  - Use html2canvas to convert QR code to downloadable image
  - Display table status indicator (AVAILABLE: green, OCCUPIED: red)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 22. Create polling service utility
  - Create `/lib/pollingService.ts` file
  - Implement `createPollingService(fetchFn, interval, maxRetries)` function
  - Support exponential backoff on errors
  - Provide start() and stop() methods
  - Handle cleanup on component unmount
  - _Requirements: 14.1, 14.2, 14.3, 14.6_

- [x] 23. Update CustomerNavbar component
  - Update `/components/navbar/CustomerNavbar.tsx`
  - Add tableNumber prop (optional)
  - Display table badge when tableNumber is provided (e.g., "Meja A1")
  - Keep existing isTakeaway badge functionality
  - Style table badge with blue background
  - _Requirements: 3.2, 3.6_

- [x] 24. Checkpoint - Test frontend flows
  - Test QR code scan → menu → checkout → payment flow
  - Test QRIS payment flow end-to-end
  - Test CASH payment flow end-to-end
  - Test Kasir dashboard order processing
  - Test Admin QR code generation
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Integration & Testing

- [x] 25. Implement error handling across all components
  - [x] 25.1 Create error handler utility
    - Create `/lib/errorHandler.ts` file
    - Implement `handleApiError(error)` function for API routes
    - Implement error classes: QRCodeValidationError, OrderValidationError, PaymentValidationError
    - Return appropriate HTTP status codes (400, 401, 403, 404, 409, 500)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_
  
  - [x] 25.2 Create ErrorAlert component
    - Create `/components/ErrorAlert.tsx` component
    - Accept error state with message, field, and type
    - Display error with appropriate styling (red for validation/server, yellow for network)
    - Add dismiss button
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 25.3 Add error handling to all API routes
    - Wrap API route handlers with try-catch blocks
    - Use handleApiError for consistent error responses
    - Log errors to console for debugging
    - _Requirements: 15.6, 15.7_
  
  - [x] 25.4 Add error handling to all frontend pages
    - Add error state to all page components
    - Display ErrorAlert component when errors occur
    - Implement cart recovery on checkout failure
    - Implement session recovery on localStorage loss
    - _Requirements: 15.5, 15.7_

- [x] 26. Implement payment timeout mechanism
  - Update POST `/api/orders` to call schedulePaymentTimeout for QRIS orders
  - Test timeout cancels order after 10 minutes
  - Test table status updates to AVAILABLE after timeout
  - Display timeout error message to customer
  - _Requirements: 6.7, 15.4_

- [ ] 27. End-to-end testing scenarios
  - [ ]* 27.1 Test complete QRIS payment flow
    - Customer scans QR code
    - Customer adds items to cart
    - Customer proceeds to checkout with QRIS
    - Customer sees QRIS code
    - Customer clicks "Saya Sudah Bayar"
    - Order appears in Kasir queue
    - Kasir marks order as READY
    - Customer sees "Pesanan siap" notification
    - _Requirements: 1.6, 2.1, 3.1, 4.1, 5.1, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.6, 14.5_
  
  - [ ]* 27.2 Test complete CASH payment flow
    - Customer scans QR code
    - Customer adds items to cart
    - Customer proceeds to checkout with CASH
    - Order appears in Kasir queue immediately
    - Kasir marks order as READY
    - Customer sees "Silakan ke kasir untuk pembayaran"
    - Customer pays at counter
    - Kasir confirms payment
    - Order status becomes COMPLETED
    - Table status becomes AVAILABLE
    - _Requirements: 1.6, 2.1, 3.1, 4.1, 5.1, 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 8.1, 8.6, 8.7, 8.8, 10.4_
  
  - [ ]* 27.3 Test table occupancy validation
    - Customer A scans QR code for Table A1
    - Customer A creates order (table becomes OCCUPIED)
    - Customer B scans same QR code for Table A1
    - Customer B sees "Meja ini sedang digunakan" error
    - Customer A completes order (table becomes AVAILABLE)
    - Customer B can now scan and order from Table A1
    - _Requirements: 2.4, 2.5, 10.1, 10.2, 10.3, 10.4, 15.2_
  
  - [ ]* 27.4 Test payment timeout scenario
    - Customer creates QRIS order
    - Customer does not confirm payment
    - After 10 minutes, order status becomes CANCELLED
    - Table status becomes AVAILABLE
    - Customer sees "Pembayaran gagal, silakan coba lagi" message
    - _Requirements: 6.7, 10.4, 15.4_
  
  - [ ]* 27.5 Test stock validation
    - Product has stock of 5
    - Customer adds 3 items to cart
    - Customer tries to add 3 more items
    - System shows "Stok tidak cukup" error
    - Customer can only add 2 more items
    - _Requirements: 3.5, 4.5, 15.3_

- [x] 28. Checkpoint - Verify all integrations
  - Test all API endpoints with various scenarios
  - Test error handling for all edge cases
  - Test polling services work correctly
  - Test payment timeout mechanism
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Deployment & Documentation

- [ ] 29. Prepare production environment
  - Update environment variables for production database
  - Configure Xendit API keys (when ready for real integration)
  - Set up production domain for QR code URLs
  - Test database migrations on production database
  - _Requirements: 1.1, 13.1_

- [ ] 30. Generate QR codes for all tables
  - Run seed script to create all restaurant tables
  - Use Admin QR generator page to generate QR codes for all tables
  - Download all QR code images
  - Print QR codes for physical placement on tables
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 31. Create user documentation
  - Document customer flow: scan QR → order → payment
  - Document Kasir workflow: view orders → mark ready → confirm payment
  - Document Admin workflow: monitor orders → generate QR codes → reset tables
  - Create troubleshooting guide for common issues
  - _Requirements: All requirements_

- [ ] 32. Final checkpoint - Production readiness
  - Verify all features work in production environment
  - Test QR codes scan correctly and redirect to menu
  - Test order creation and payment flows
  - Test Kasir and Admin dashboards
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- All code should be written in TypeScript following Next.js 14 App Router conventions
- Use Prisma for all database operations with type-safe queries
- Follow existing project structure and coding patterns
- Implement responsive design with Tailwind CSS for mobile compatibility
- Use react-hot-toast for user notifications
- Implement proper error handling and validation at all layers
- Test thoroughly before moving to next phase

## Implementation Guidelines

**Database Operations**:
- Always use Prisma Client for type-safe database access
- Use transactions for operations that modify multiple tables
- Validate data before database operations
- Handle database errors gracefully

**API Development**:
- Follow RESTful conventions for endpoint design
- Validate all inputs before processing
- Return appropriate HTTP status codes
- Use middleware for authentication and authorization
- Log errors for debugging

**Frontend Development**:
- Use React Server Components where possible for better performance
- Implement client components for interactive features
- Store session data in localStorage for persistence
- Use polling for real-time updates (5-second intervals)
- Display loading states during async operations
- Show error messages with clear instructions

**Security**:
- Validate QR code tokens on server side
- Prevent SQL injection with Prisma parameterized queries
- Sanitize user inputs
- Protect admin and Kasir routes with role-based access control
- Use HTTPS in production for secure communication

**Testing**:
- Write unit tests for validation functions and utilities
- Write integration tests for API endpoints
- Write component tests for React components
- Perform manual E2E testing for complete user flows
- Test error scenarios and edge cases
