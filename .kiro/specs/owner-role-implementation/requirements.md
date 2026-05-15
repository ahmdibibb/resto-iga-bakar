# Requirements Document: OWNER Role Implementation

## Introduction

This document specifies the requirements for implementing a new OWNER role in the restaurant management system. The system currently supports three roles: ADMIN (full operational control), KASIR (cashier operations), and USER (customer). The OWNER role will provide strategic and business intelligence capabilities with view-only access to operational data and full access to analytics and financial reports, creating a clear separation of concerns between strategic oversight (OWNER) and operational management (ADMIN).

## Glossary

- **System**: The restaurant management web application
- **OWNER**: A user role with strategic oversight, view-only access to operational data, and full access to analytics and financial reports
- **ADMIN**: A user role with full operational control including CRUD operations on products, orders, users, and QR generation
- **KASIR**: A user role with cashier-specific permissions for order processing
- **USER**: A customer role with limited permissions for placing orders
- **Permission_Middleware**: Server-side code that validates user permissions before allowing access to routes or operations
- **RBAC**: Role-Based Access Control system that determines what actions each role can perform
- **Audit_Trail**: A log of sensitive operations performed by users for security and compliance
- **Dashboard**: The main interface showing key metrics and data visualizations
- **Analytics**: Detailed business intelligence reports including sales trends, product performance, and revenue analysis
- **Financial_Data**: Revenue, sales, payment methods, and other monetary information
- **CRUD**: Create, Read, Update, Delete operations
- **Owner_Dashboard**: A specialized read-only dashboard interface for OWNER users
- **Admin_Dashboard**: The operational dashboard interface for ADMIN users with full control capabilities

## Requirements

### Requirement 1: Database Schema Update

**User Story:** As a system administrator, I want the OWNER role to be defined in the database schema, so that users can be assigned this role.

#### Acceptance Criteria

1. THE System SHALL add OWNER to the UserRole enum in the Prisma schema
2. WHEN the schema migration is applied, THE System SHALL preserve all existing user data and role assignments
3. THE System SHALL support all four roles (ADMIN, OWNER, KASIR, USER) in the database
4. WHEN querying users, THE System SHALL return OWNER as a valid role value

### Requirement 2: Authentication and Authorization

**User Story:** As a developer, I want the authentication system to recognize and handle the OWNER role, so that OWNER users can access the system with appropriate permissions.

#### Acceptance Criteria

1. WHEN an OWNER user logs in, THE System SHALL generate a valid JWT token with role set to OWNER
2. THE Auth_Middleware SHALL recognize OWNER as a valid authenticated role
3. WHEN an OWNER user accesses protected routes, THE System SHALL validate their token and role
4. THE System SHALL provide permission checking utility functions that support OWNER role validation

### Requirement 3: Route Protection and Access Control

**User Story:** As a security engineer, I want route-level access control for OWNER users, so that they can only access authorized pages.

#### Acceptance Criteria

1. WHEN an OWNER user attempts to access /owner routes, THE Middleware SHALL allow access
2. WHEN an OWNER user attempts to access /admin routes, THE Middleware SHALL deny access and redirect to /owner
3. WHEN an OWNER user attempts to access KASIR-only routes, THE Middleware SHALL deny access
4. THE System SHALL implement route guards that check OWNER permissions before rendering pages

### Requirement 4: Owner Dashboard - View-Only Access

**User Story:** As an OWNER, I want a dedicated dashboard with read-only access to operational data, so that I can monitor business performance without accidentally modifying data.

#### Acceptance Criteria

1. THE System SHALL provide an Owner_Dashboard at /owner route
2. THE Owner_Dashboard SHALL display total menus, total orders, products sold, and revenue metrics
3. THE Owner_Dashboard SHALL display revenue charts with daily, weekly, and monthly views
4. THE Owner_Dashboard SHALL display recent orders in read-only format
5. WHEN an OWNER user views the dashboard, THE System SHALL NOT display any edit, delete, or create buttons
6. THE Owner_Dashboard SHALL include visual indicators showing that content is view-only
7. THE Owner_Dashboard SHALL refresh data automatically without requiring page reload

### Requirement 5: Analytics Access - Full Permissions

**User Story:** As an OWNER, I want full access to analytics and business intelligence reports, so that I can make informed strategic decisions.

#### Acceptance Criteria

1. WHEN an OWNER user accesses analytics, THE System SHALL display all available analytics data
2. THE System SHALL allow OWNER users to view sales trends for any time period (7, 30, 90 days)
3. THE System SHALL allow OWNER users to view top-selling products with revenue breakdown
4. THE System SHALL allow OWNER users to view revenue by payment method (CASH, QRIS, EDC)
5. THE System SHALL allow OWNER users to view revenue by order type (DINE_IN, TAKEAWAY)
6. THE System SHALL allow OWNER users to export analytics data in PDF or CSV format
7. THE System SHALL allow OWNER users to view category-based revenue analysis (food vs drinks)

### Requirement 6: Reports Access - Full Permissions

**User Story:** As an OWNER, I want to view and download all financial and operational reports, so that I can analyze business performance and trends.

#### Acceptance Criteria

1. WHEN an OWNER user accesses the reports section, THE System SHALL display all available reports
2. THE System SHALL allow OWNER users to generate sales reports for any date range
3. THE System SHALL allow OWNER users to download reports in PDF format
4. THE System SHALL include revenue, order count, products sold, and payment method breakdown in reports
5. THE System SHALL allow OWNER users to view daily revenue reports
6. THE System SHALL allow OWNER users to view product sales reports

### Requirement 7: Products - View-Only Access

**User Story:** As an OWNER, I want to view product information without the ability to modify it, so that I can monitor inventory without operational interference.

#### Acceptance Criteria

1. WHEN an OWNER user views products, THE System SHALL display all product information including name, price, stock, category, and status
2. THE Owner_Dashboard SHALL NOT display "Add Product", "Edit", or "Delete" buttons for products
3. WHEN an OWNER user attempts to access product creation API endpoints, THE System SHALL return a 403 Forbidden error
4. WHEN an OWNER user attempts to access product update API endpoints, THE System SHALL return a 403 Forbidden error
5. WHEN an OWNER user attempts to access product delete API endpoints, THE System SHALL return a 403 Forbidden error
6. THE System SHALL allow OWNER users to view product stock levels and low-stock alerts

### Requirement 8: Orders - View-Only Access

**User Story:** As an OWNER, I want to view order information without the ability to modify order status, so that I can monitor operations without interfering with order fulfillment.

#### Acceptance Criteria

1. WHEN an OWNER user views orders, THE System SHALL display all order information including order number, customer, items, status, payment method, and total amount
2. THE Owner_Dashboard SHALL NOT display order status change buttons (confirm, prepare, complete, cancel)
3. WHEN an OWNER user attempts to access order update API endpoints, THE System SHALL return a 403 Forbidden error
4. THE System SHALL allow OWNER users to view order details including items and customer information
5. THE System SHALL allow OWNER users to filter and search orders by date, status, and payment method

### Requirement 9: Users - View-Only Access with Restrictions

**User Story:** As an OWNER, I want to view user information without the ability to modify users, so that I can monitor system access while maintaining security.

#### Acceptance Criteria

1. WHEN an OWNER user views the users list, THE System SHALL display all users except other OWNER accounts
2. THE Owner_Dashboard SHALL NOT display "Add User", "Edit", or "Delete" buttons for users
3. WHEN an OWNER user attempts to access user creation API endpoints, THE System SHALL return a 403 Forbidden error
4. WHEN an OWNER user attempts to access user update API endpoints, THE System SHALL return a 403 Forbidden error
5. WHEN an OWNER user attempts to access user delete API endpoints, THE System SHALL return a 403 Forbidden error
6. THE System SHALL display user roles, email, name, and creation date to OWNER users

### Requirement 10: QR Generator - No Access

**User Story:** As a system architect, I want to prevent OWNER users from accessing QR code generation features, so that operational tools remain under ADMIN control.

#### Acceptance Criteria

1. THE Owner_Dashboard SHALL NOT display a navigation link to QR Generator
2. WHEN an OWNER user attempts to access /owner/qr-generator route, THE System SHALL return a 404 Not Found error
3. WHEN an OWNER user attempts to access QR generation API endpoints, THE System SHALL return a 403 Forbidden error

### Requirement 11: Financial Data - Full Access

**User Story:** As an OWNER, I want full access to all financial metrics and data, so that I can monitor business financial performance comprehensively.

#### Acceptance Criteria

1. WHEN an OWNER user views financial data, THE System SHALL display total revenue for all time periods
2. THE System SHALL allow OWNER users to view revenue breakdown by payment method with exact amounts
3. THE System SHALL allow OWNER users to view revenue breakdown by order type with exact amounts
4. THE System SHALL allow OWNER users to view daily, weekly, and monthly revenue trends
5. THE System SHALL allow OWNER users to view average order value
6. THE System SHALL allow OWNER users to view total sales and profit margins
7. THE System SHALL display all financial metrics without rounding or approximation

### Requirement 12: ADMIN Permission Updates

**User Story:** As an ADMIN, I want updated permissions that reflect the separation of concerns with OWNER role, so that I maintain operational control while OWNER has strategic oversight.

#### Acceptance Criteria

1. THE System SHALL allow ADMIN users to perform all CRUD operations on products
2. THE System SHALL allow ADMIN users to perform all order management operations
3. THE System SHALL allow ADMIN users to create, edit, and delete USER and KASIR accounts
4. WHEN an ADMIN user attempts to create an OWNER account, THE System SHALL return a 403 Forbidden error
5. WHEN an ADMIN user attempts to edit an OWNER account, THE System SHALL return a 403 Forbidden error
6. WHEN an ADMIN user attempts to delete an OWNER account, THE System SHALL return a 403 Forbidden error
7. THE System SHALL allow ADMIN users to view analytics with limited export capabilities
8. THE System SHALL allow ADMIN users to view operational reports but not all financial reports
9. THE System SHALL allow ADMIN users full access to QR code generation
10. THE System SHALL limit ADMIN access to detailed financial metrics (profit margins, comprehensive revenue analysis)

### Requirement 13: API Security and Permission Middleware

**User Story:** As a security engineer, I want comprehensive permission checks on all API routes, so that role-based access control is enforced consistently.

#### Acceptance Criteria

1. THE System SHALL implement Permission_Middleware that validates user roles before processing API requests
2. WHEN an API endpoint requires ADMIN permissions and an OWNER user makes a request, THE System SHALL return a 403 Forbidden error
3. WHEN an API endpoint allows OWNER read access and an OWNER user makes a GET request, THE System SHALL return the requested data
4. WHEN an API endpoint requires write permissions and an OWNER user makes a POST, PUT, or DELETE request, THE System SHALL return a 403 Forbidden error
5. THE Permission_Middleware SHALL check permissions for all routes under /api/admin, /api/owner, /api/products, /api/orders, and /api/users
6. THE System SHALL log all permission denial attempts to the Audit_Trail

### Requirement 14: Audit Trail for Sensitive Operations

**User Story:** As a compliance officer, I want an audit trail of sensitive operations, so that I can track who performed what actions and when.

#### Acceptance Criteria

1. WHEN an ADMIN user creates, updates, or deletes a user account, THE System SHALL log the operation to the Audit_Trail
2. WHEN an ADMIN user attempts to modify an OWNER account and is denied, THE System SHALL log the attempt to the Audit_Trail
3. WHEN an OWNER user attempts to perform a write operation and is denied, THE System SHALL log the attempt to the Audit_Trail
4. THE Audit_Trail SHALL include timestamp, user ID, user role, action attempted, resource affected, and result (success or failure)
5. THE System SHALL allow OWNER users to view the Audit_Trail for all operations
6. THE System SHALL allow ADMIN users to view the Audit_Trail for operations they performed

### Requirement 15: User Management - OWNER Account Creation

**User Story:** As a system administrator, I want controlled OWNER account creation, so that only authorized personnel can create OWNER accounts.

#### Acceptance Criteria

1. THE System SHALL allow existing OWNER users to create new OWNER accounts
2. THE System SHALL allow system-level initialization to create the first OWNER account
3. WHEN an ADMIN user attempts to create an OWNER account, THE System SHALL return a 403 Forbidden error with message "Only OWNER users can create OWNER accounts"
4. WHEN a KASIR or USER attempts to create an OWNER account, THE System SHALL return a 403 Forbidden error
5. THE System SHALL require email, name, password, and role fields when creating an OWNER account

### Requirement 16: UI/UX - Visual Indicators for Permissions

**User Story:** As an OWNER user, I want clear visual indicators showing which content is view-only, so that I understand my permission boundaries.

#### Acceptance Criteria

1. WHEN an OWNER user views read-only content, THE System SHALL display a "View Only" badge or icon
2. THE Owner_Dashboard SHALL use distinct styling (e.g., muted colors, lock icons) for read-only sections
3. WHEN an OWNER user hovers over read-only data, THE System SHALL display a tooltip explaining "You have view-only access to this data"
4. THE System SHALL hide all action buttons (edit, delete, create) from OWNER users
5. THE Owner_Dashboard navigation SHALL only show accessible sections (Dashboard, Analytics, Reports, View Products, View Orders, View Users)

### Requirement 17: Navigation and Routing

**User Story:** As an OWNER user, I want a navigation menu that only shows features I can access, so that I have a clear and uncluttered interface.

#### Acceptance Criteria

1. THE Owner_Dashboard SHALL display navigation items: Dashboard, Analytics, Reports, Products (view), Orders (view), Users (view)
2. THE Owner_Dashboard SHALL NOT display navigation items: QR Generator, Settings (if ADMIN-only)
3. WHEN an OWNER user clicks on a navigation item, THE System SHALL route to the appropriate view-only page
4. THE System SHALL display the OWNER user's name and role in the navigation header
5. THE System SHALL provide a logout button in the navigation

### Requirement 18: Data Refresh and Real-Time Updates

**User Story:** As an OWNER user, I want dashboard data to refresh automatically, so that I always see current business metrics without manual page reloads.

#### Acceptance Criteria

1. WHEN an OWNER user views the dashboard, THE System SHALL refresh statistics every 30 seconds
2. WHEN an OWNER user views the analytics page, THE System SHALL refresh charts every 60 seconds
3. THE System SHALL display a loading indicator during data refresh
4. WHEN data refresh fails, THE System SHALL display an error message and retry after 10 seconds
5. THE System SHALL allow OWNER users to manually trigger a data refresh with a refresh button

### Requirement 19: Error Handling and User Feedback

**User Story:** As an OWNER user, I want clear error messages when I attempt unauthorized actions, so that I understand system boundaries.

#### Acceptance Criteria

1. WHEN an OWNER user attempts an unauthorized action, THE System SHALL display a user-friendly error message
2. THE error message SHALL explain "You do not have permission to perform this action. OWNER role has view-only access."
3. WHEN an API request fails due to permissions, THE System SHALL return a 403 status code with a descriptive error message
4. THE System SHALL log permission errors to the browser console for debugging
5. THE System SHALL provide a "Contact Admin" link in permission error messages

### Requirement 20: Testing and Validation

**User Story:** As a QA engineer, I want comprehensive test coverage for OWNER role permissions, so that security boundaries are verified.

#### Acceptance Criteria

1. THE System SHALL include unit tests verifying OWNER users can access read-only endpoints
2. THE System SHALL include unit tests verifying OWNER users cannot access write endpoints
3. THE System SHALL include integration tests verifying ADMIN users cannot modify OWNER accounts
4. THE System SHALL include integration tests verifying OWNER users can view all analytics and reports
5. THE System SHALL include end-to-end tests verifying the complete OWNER user workflow from login to viewing reports
6. THE System SHALL include tests verifying the Audit_Trail logs permission violations correctly
7. THE System SHALL include tests verifying Permission_Middleware blocks unauthorized requests

### Requirement 21: Migration and Data Integrity

**User Story:** As a database administrator, I want a safe migration path for adding the OWNER role, so that existing data remains intact.

#### Acceptance Criteria

1. WHEN the database migration is executed, THE System SHALL add OWNER to the UserRole enum without affecting existing roles
2. THE System SHALL complete the migration without data loss
3. WHEN the migration is complete, THE System SHALL allow creation of OWNER users
4. THE System SHALL provide a rollback script in case migration needs to be reversed
5. THE System SHALL validate data integrity after migration by checking all existing user roles are still valid

### Requirement 22: Performance and Scalability

**User Story:** As a system architect, I want the OWNER role implementation to maintain system performance, so that additional permission checks do not degrade response times.

#### Acceptance Criteria

1. WHEN Permission_Middleware checks OWNER permissions, THE System SHALL complete the check within 10 milliseconds
2. THE System SHALL cache user role information to minimize database queries
3. WHEN an OWNER user loads the dashboard, THE System SHALL render the page within 2 seconds
4. THE System SHALL handle concurrent requests from multiple OWNER users without performance degradation
5. THE Permission_Middleware SHALL not increase API response time by more than 5%

### Requirement 23: Documentation and Training

**User Story:** As a system administrator, I want comprehensive documentation for the OWNER role, so that I can train users and troubleshoot issues.

#### Acceptance Criteria

1. THE System SHALL include user documentation explaining OWNER role capabilities and limitations
2. THE System SHALL include API documentation listing all endpoints accessible to OWNER users
3. THE System SHALL include a permission matrix document showing what each role can access
4. THE System SHALL include troubleshooting guides for common OWNER role issues
5. THE System SHALL include code comments explaining permission logic in middleware and API routes

---

## Summary

This requirements document defines 23 requirements with 123 acceptance criteria for implementing the OWNER role in the restaurant management system. The implementation creates a clear separation of concerns:

- **OWNER**: Strategic oversight with view-only operational access and full analytics/financial reporting
- **ADMIN**: Operational management with full CRUD capabilities but limited financial visibility and no ability to modify OWNER accounts

The requirements ensure security through comprehensive permission checks, audit trails, and role-based access control while providing OWNER users with the business intelligence tools needed for strategic decision-making.
