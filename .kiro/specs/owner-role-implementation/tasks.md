# Implementation Plan: OWNER Role Implementation

## Overview

This implementation plan adds a new OWNER role to the restaurant management system, providing strategic oversight with view-only access to operational data and full access to analytics and financial reports. The implementation follows a requirements-first approach, creating clear separation of concerns between strategic oversight (OWNER) and operational management (ADMIN).

**Technology Stack:** Next.js 16, TypeScript, Prisma ORM, MySQL, React 19

## Tasks

- [x] 1. Database schema and migration
  - [x] 1.1 Update Prisma schema to add OWNER role to UserRole enum
    - Modify `prisma/schema.prisma` to include OWNER in the UserRole enum
    - _Requirements: 1.1, 1.3_
  
  - [x] 1.2 Create and apply database migration
    - Generate Prisma migration for the schema change
    - Apply migration to add OWNER role to database
    - Verify existing user data is preserved
    - _Requirements: 1.2, 21.1, 21.2, 21.5_
  
  - [ ]* 1.3 Create migration rollback script
    - Document rollback procedure in case migration needs to be reversed
    - _Requirements: 21.4_

- [x] 2. Authentication system updates
  - [x] 2.1 Update JWT token generation to support OWNER role
    - Modify `lib/auth.ts` to include OWNER role in JWT payload
    - Ensure OWNER role is properly encoded in tokens
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Update authentication middleware to recognize OWNER role
    - Modify `middleware.ts` to validate OWNER role tokens
    - Add OWNER to list of valid authenticated roles
    - _Requirements: 2.2, 2.3_
  
  - [x] 2.3 Create permission checking utility functions
    - Create `lib/permissions.ts` with role validation helpers
    - Implement `isOwner()`, `canModifyOwner()`, `hasReadAccess()`, `hasWriteAccess()` functions
    - _Requirements: 2.4, 13.1_
  
  - [ ]* 2.4 Write unit tests for authentication utilities
    - Test JWT generation with OWNER role
    - Test permission checking functions
    - _Requirements: 20.1, 20.2_

- [ ] 3. Route protection and middleware
  - [x] 3.1 Update middleware.ts for OWNER route protection
    - Add route guards for `/owner/*` paths
    - Redirect OWNER users from `/admin/*` to `/owner`
    - Block OWNER access to KASIR-only routes
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 3.2 Create API permission middleware
    - Create `lib/apiPermissions.ts` with request validation
    - Implement role-based endpoint access control
    - Add permission checks for GET (read) vs POST/PUT/DELETE (write) operations
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ]* 3.3 Write integration tests for route protection
    - Test OWNER access to authorized routes
    - Test OWNER blocked from unauthorized routes
    - Test middleware redirects
    - _Requirements: 20.3_

- [ ] 4. Checkpoint - Ensure authentication and routing work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Audit trail system
  - [x] 5.1 Create audit trail database model
    - Add AuditLog model to Prisma schema with fields: id, timestamp, userId, userRole, action, resource, result, metadata
    - Generate and apply migration
    - _Requirements: 14.4_
  
  - [x] 5.2 Implement audit logging service
    - Create `lib/auditLog.ts` with logging functions
    - Implement `logUserAction()`, `logPermissionDenial()`, `logAccountModification()` functions
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [x] 5.3 Integrate audit logging into permission middleware
    - Add audit logging to API permission checks
    - Log all permission denial attempts
    - _Requirements: 13.6, 14.3_
  
  - [ ]* 5.4 Write unit tests for audit logging
    - Test audit log creation
    - Test log data integrity
    - _Requirements: 20.6_

- [ ] 6. API endpoints - Analytics (full access for OWNER)
  - [x] 6.1 Create or update analytics API routes
    - Create/update `/api/owner/analytics/route.ts` for sales trends, top products, revenue breakdown
    - Implement GET endpoints for 7/30/90 day analytics
    - Add revenue by payment method and order type
    - Add category-based revenue analysis
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_
  
  - [x] 6.2 Add analytics export functionality
    - Implement PDF/CSV export endpoints in analytics API
    - _Requirements: 5.6_
  
  - [ ]* 6.3 Write integration tests for analytics API
    - Test OWNER can access all analytics endpoints
    - Test data accuracy and completeness
    - _Requirements: 20.4_

- [ ] 7. API endpoints - Reports (full access for OWNER)
  - [x] 7.1 Create or update reports API routes
    - Create/update `/api/owner/reports/route.ts` for sales reports
    - Implement date range filtering
    - Include revenue, order count, products sold, payment breakdown
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [x] 7.2 Add report PDF generation
    - Implement PDF download functionality for reports
    - _Requirements: 6.3_
  
  - [x] 7.3 Add daily and product sales reports
    - Implement daily revenue report endpoint
    - Implement product sales report endpoint
    - _Requirements: 6.5, 6.6_
  
  - [ ]* 7.4 Write integration tests for reports API
    - Test OWNER can generate and download reports
    - Test report data accuracy
    - _Requirements: 20.4_

- [ ] 8. API endpoints - Products (view-only for OWNER)
  - [x] 8.1 Update products API with OWNER read-only access
    - Modify `/api/products/route.ts` to allow OWNER GET requests
    - Block OWNER from POST/PUT/DELETE operations (return 403)
    - Add stock level and low-stock alert data to GET response
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 8.2 Update product detail API for OWNER access
    - Modify `/api/products/[id]/route.ts` to allow OWNER GET requests
    - Block OWNER from PUT/DELETE operations
    - _Requirements: 7.1, 7.4, 7.5_
  
  - [ ]* 8.3 Write unit tests for products API permissions
    - Test OWNER can read products
    - Test OWNER blocked from write operations
    - _Requirements: 20.2_

- [ ] 9. API endpoints - Orders (view-only for OWNER)
  - [x] 9.1 Update orders API with OWNER read-only access
    - Modify `/api/orders/route.ts` to allow OWNER GET requests
    - Block OWNER from POST/PUT operations (return 403)
    - Add filtering by date, status, payment method
    - _Requirements: 8.1, 8.3, 8.5_
  
  - [x] 9.2 Update order detail and status APIs for OWNER
    - Modify `/api/orders/[id]/route.ts` to allow OWNER GET requests
    - Block OWNER from status update endpoints (return 403)
    - _Requirements: 8.1, 8.3, 8.4_
  
  - [ ]* 9.3 Write unit tests for orders API permissions
    - Test OWNER can read orders
    - Test OWNER blocked from write operations
    - _Requirements: 20.2_

- [ ] 10. API endpoints - Users (view-only with restrictions for OWNER)
  - [x] 10.1 Update users API with OWNER read-only access
    - Modify `/api/admin/users/route.ts` to allow OWNER GET requests
    - Filter out other OWNER accounts from response
    - Block OWNER from POST/PUT/DELETE operations (return 403)
    - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 10.2 Update user detail API for OWNER access
    - Modify `/api/admin/users/[id]/route.ts` to allow OWNER GET requests
    - Block OWNER from PUT/DELETE operations
    - _Requirements: 9.1, 9.4, 9.5_
  
  - [ ]* 10.3 Write unit tests for users API permissions
    - Test OWNER can read users (excluding other OWNERs)
    - Test OWNER blocked from write operations
    - _Requirements: 20.2_

- [x] 11. Checkpoint - Ensure all API endpoints work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. API endpoints - ADMIN permission updates
  - [x] 12.1 Update user management APIs to restrict ADMIN from modifying OWNER accounts
    - Modify `/api/admin/users/route.ts` POST to block OWNER creation by ADMIN (return 403)
    - Modify `/api/admin/users/[id]/route.ts` PUT/DELETE to block OWNER modification by ADMIN (return 403)
    - Add audit logging for denied attempts
    - _Requirements: 12.4, 12.5, 12.6, 15.3_
  
  - [x] 12.2 Update analytics and reports APIs for ADMIN limitations
    - Limit ADMIN export capabilities in analytics endpoints
    - Restrict ADMIN access to detailed financial metrics
    - _Requirements: 12.7, 12.10_
  
  - [ ]* 12.3 Write integration tests for ADMIN restrictions
    - Test ADMIN blocked from creating OWNER accounts
    - Test ADMIN blocked from modifying OWNER accounts
    - _Requirements: 20.3_

- [x] 13. API endpoints - OWNER account creation
  - [x] 13.1 Create OWNER account creation endpoint
    - Create `/api/owner/users/route.ts` POST endpoint
    - Validate requester is OWNER role
    - Allow OWNER users to create new OWNER accounts
    - Return 403 for non-OWNER users with descriptive message
    - _Requirements: 15.1, 15.3, 15.4, 15.5_
  
  - [x] 13.2 Create system initialization script for first OWNER account
    - Create `scripts/create-first-owner.ts` for initial OWNER setup
    - _Requirements: 15.2_
  
  - [ ]* 13.3 Write unit tests for OWNER account creation
    - Test OWNER can create OWNER accounts
    - Test non-OWNER blocked from creating OWNER accounts
    - _Requirements: 20.2_

- [x] 14. API endpoints - Financial data (full access for OWNER)
  - [x] 14.1 Create financial metrics API
    - Create `/api/owner/financial/route.ts` with comprehensive financial data
    - Include total revenue, revenue by payment method, revenue by order type
    - Include daily/weekly/monthly trends, average order value, profit margins
    - Return exact amounts without rounding
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ]* 14.2 Write integration tests for financial API
    - Test OWNER can access all financial data
    - Test data accuracy and precision
    - _Requirements: 20.4_

- [x] 15. API endpoints - Audit trail access
  - [x] 15.1 Create audit trail API endpoints
    - Create `/api/owner/audit/route.ts` for OWNER to view all audit logs
    - Create `/api/admin/audit/route.ts` for ADMIN to view their own logs
    - Add filtering by date, user, action, resource
    - _Requirements: 14.5, 14.6_
  
  - [ ]* 15.2 Write integration tests for audit trail API
    - Test OWNER can view all audit logs
    - Test ADMIN can view only their logs
    - _Requirements: 20.6_

- [x] 16. Owner dashboard UI - Main dashboard page
  - [x] 16.1 Create Owner dashboard layout and navigation
    - Create `app/owner/layout.tsx` with navigation menu
    - Include navigation items: Dashboard, Analytics, Reports, Products, Orders, Users
    - Exclude QR Generator from navigation
    - Add user name, role display, and logout button
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
  
  - [x] 16.2 Create Owner dashboard home page
    - Create `app/owner/page.tsx` with dashboard overview
    - Display metrics: total menus, total orders, products sold, revenue
    - Add revenue charts with daily/weekly/monthly views
    - Display recent orders in read-only format
    - Add "View Only" badges and visual indicators
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 16.1, 16.2, 16.3_
  
  - [x] 16.3 Implement auto-refresh for dashboard data
    - Add 30-second auto-refresh for statistics
    - Add loading indicators during refresh
    - Add manual refresh button
    - Implement error handling with retry logic
    - _Requirements: 4.7, 18.1, 18.3, 18.4, 18.5_
  
  - [ ]* 16.4 Write component tests for Owner dashboard
    - Test dashboard renders correctly
    - Test auto-refresh functionality
    - Test view-only indicators display

- [x] 17. Owner dashboard UI - Analytics page
  - [x] 17.1 Create Owner analytics page
    - Create `app/owner/analytics/page.tsx`
    - Display sales trends for 7/30/90 days
    - Display top-selling products with revenue breakdown
    - Display revenue by payment method and order type
    - Display category-based revenue analysis
    - Add export buttons for PDF/CSV
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 17.2 Implement auto-refresh for analytics
    - Add 60-second auto-refresh for charts
    - Add loading indicators
    - _Requirements: 18.2, 18.3_
  
  - [ ]* 17.3 Write component tests for analytics page
    - Test analytics data displays correctly
    - Test export functionality

- [x] 18. Owner dashboard UI - Reports page
  - [x] 18.1 Create Owner reports page
    - Create `app/owner/reports/page.tsx`
    - Add date range selector
    - Display sales reports with revenue, order count, products sold
    - Add payment method breakdown
    - Add PDF download button
    - Include daily revenue and product sales reports
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 18.2 Write component tests for reports page
    - Test report generation
    - Test PDF download

- [x] 19. Owner dashboard UI - Products view page
  - [x] 19.1 Create Owner products view page
    - Create `app/owner/products/page.tsx`
    - Display all products with name, price, stock, category, status
    - Show stock levels and low-stock alerts
    - Hide all action buttons (Add, Edit, Delete)
    - Add "View Only" indicators
    - Add tooltips explaining view-only access
    - _Requirements: 7.1, 7.2, 7.6, 16.1, 16.2, 16.3, 16.4_
  
  - [ ]* 19.2 Write component tests for products view
    - Test products display correctly
    - Test no action buttons are shown

- [x] 20. Owner dashboard UI - Orders view page
  - [x] 20.1 Create Owner orders view page
    - Create `app/owner/orders/page.tsx`
    - Display all orders with order number, customer, items, status, payment method, total
    - Add filters for date, status, payment method
    - Hide status change buttons
    - Add "View Only" indicators
    - _Requirements: 8.1, 8.2, 8.5, 16.1, 16.2, 16.3, 16.4_
  
  - [x] 20.2 Create order detail modal for OWNER
    - Create read-only order detail view
    - Display items and customer information
    - _Requirements: 8.4_
  
  - [ ]* 20.3 Write component tests for orders view
    - Test orders display correctly
    - Test filters work
    - Test no action buttons are shown

- [x] 21. Owner dashboard UI - Users view page
  - [x] 21.1 Create Owner users view page
    - Create `app/owner/users/page.tsx`
    - Display all users except other OWNER accounts
    - Show user roles, email, name, creation date
    - Hide all action buttons (Add, Edit, Delete)
    - Add "View Only" indicators
    - _Requirements: 9.1, 9.2, 9.6, 16.1, 16.2, 16.3, 16.4_
  
  - [ ]* 21.2 Write component tests for users view
    - Test users display correctly (excluding OWNERs)
    - Test no action buttons are shown

- [x] 22. Checkpoint - Ensure all UI pages render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 23. Admin dashboard updates
  - [x] 23.1 Update Admin user management UI
    - Modify `components/admin/UserManagement.tsx` to hide OWNER accounts from list
    - Disable "Create OWNER" option for ADMIN users
    - Add tooltips explaining ADMIN cannot modify OWNER accounts
    - _Requirements: 12.4, 12.5, 12.6_
  
  - [x] 23.2 Update Admin analytics UI with limitations
    - Modify admin analytics to show limited export options
    - Hide detailed financial metrics from ADMIN view
    - _Requirements: 12.7, 12.10_
  
  - [ ]* 23.3 Write component tests for Admin UI updates
    - Test OWNER accounts hidden from ADMIN
    - Test ADMIN cannot access OWNER creation

- [x] 24. Error handling and user feedback
  - [x] 24.1 Create error handling components
    - Create `components/PermissionError.tsx` for permission denied messages
    - Include user-friendly error messages explaining OWNER view-only access
    - Add "Contact Admin" link
    - _Requirements: 19.1, 19.2, 19.5_
  
  - [x] 24.2 Implement API error responses
    - Ensure all API endpoints return 403 with descriptive messages for permission errors
    - Add error logging to browser console
    - _Requirements: 19.3, 19.4_
  
  - [ ]* 24.3 Write tests for error handling
    - Test permission error messages display correctly
    - Test API error responses

- [x] 25. Seed data and testing utilities
  - [x] 25.1 Update seed script to include OWNER users
    - Modify `prisma/seed.ts` to create test OWNER accounts
    - _Requirements: 15.2_
  
  - [x] 25.2 Create test data generation utilities
    - Create helper functions for generating test users with different roles
    - _Requirements: 20.1, 20.2_

- [ ] 26. Integration and end-to-end testing
  - [ ]* 26.1 Write end-to-end tests for OWNER workflow
    - Test complete OWNER user journey: login → dashboard → analytics → reports
    - Test OWNER blocked from unauthorized actions
    - _Requirements: 20.5_
  
  - [ ]* 26.2 Write integration tests for permission middleware
    - Test middleware blocks unauthorized requests across all endpoints
    - _Requirements: 20.7_
  
  - [ ]* 26.3 Write integration tests for audit trail
    - Test audit logs created correctly for all sensitive operations
    - _Requirements: 20.6_

- [x] 27. Performance optimization
  - [x] 27.1 Implement role caching in authentication
    - Add caching for user role information to minimize database queries
    - Ensure cache invalidation on role changes
    - _Requirements: 22.2_
  
  - [x] 27.2 Optimize permission middleware performance
    - Ensure permission checks complete within 10ms
    - Minimize API response time impact (< 5% increase)
    - _Requirements: 22.1, 22.5_
  
  - [ ]* 27.3 Write performance tests
    - Test dashboard loads within 2 seconds
    - Test concurrent OWNER user requests
    - _Requirements: 22.3, 22.4_

- [x] 28. Documentation
  - [x] 28.1 Create user documentation
    - Document OWNER role capabilities and limitations
    - Create troubleshooting guide
    - _Requirements: 23.1, 23.4_
  
  - [x] 28.2 Create API documentation
    - Document all endpoints accessible to OWNER users
    - Create permission matrix showing role access
    - _Requirements: 23.2, 23.3_
  
  - [x] 28.3 Add code comments
    - Add comments explaining permission logic in middleware and API routes
    - _Requirements: 23.5_

- [x] 29. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The implementation follows a bottom-up approach: database → API → UI
- All API endpoints must implement proper permission checks and audit logging
- All UI components must include view-only indicators for OWNER users
- Performance requirements must be validated before deployment

## Testing Strategy

- Unit tests validate individual functions and permission checks
- Integration tests validate API endpoints and role-based access control
- Component tests validate UI rendering and user interactions
- End-to-end tests validate complete user workflows
- Performance tests validate response times and scalability

## Security Considerations

- All write operations must be blocked for OWNER users at the API level
- Permission checks must occur on the server side, not just in the UI
- Audit trail must log all sensitive operations and permission denials
- ADMIN users must not be able to create or modify OWNER accounts
- JWT tokens must properly encode and validate OWNER role
