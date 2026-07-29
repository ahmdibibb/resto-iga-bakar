# Permission Matrix - Role-Based Access Control

## Overview

This document provides a comprehensive permission matrix showing what each role can access and perform in the restaurant management system.

## Roles

- **OWNER**: Strategic oversight, view-only operational access, full analytics/financial access
- **ADMIN**: Operational management, full CRUD capabilities, limited financial visibility
- **KASIR**: Cashier operations, order processing
- **USER**: Customer role, limited to own orders

---

## Feature Access Matrix

### Dashboard & Analytics

| Feature | OWNER | ADMIN | KASIR | USER |
|---------|-------|-------|-------|------|
| Main Dashboard | ✅ View-only | ✅ Full | ✅ Limited | ❌ |
| Sales Analytics | ✅ Full access | ⚠️ Limited | ❌ | ❌ |
| Financial Reports | ✅ Full access | ⚠️ Limited | ❌ | ❌ |
| Export Analytics (CSV) | ✅ | ✅ | ❌ | ❌ |
| Export Analytics (PDF) | ✅ | ❌ | ❌ | ❌ |
| Revenue Trends | ✅ All periods | ⚠️ Limited | ❌ | ❌ |
| Top Products | ✅ | ✅ | ❌ | ❌ |
| Category Analysis | ✅ | ⚠️ Limited | ❌ | ❌ |

### Product Management

| Feature | OWNER | ADMIN | KASIR | USER |
|---------|-------|-------|-------|------|
| View Products | ✅ | ✅ | ✅ | ✅ |
| View Stock Levels | ✅ | ✅ | ✅ | ❌ |
| Low Stock Alerts | ✅ | ✅ | ✅ | ❌ |
| Create Product | ❌ | ✅ | ❌ | ❌ |
| Edit Product | ❌ | ✅ | ❌ | ❌ |
| Delete Product | ❌ | ✅ | ❌ | ❌ |
| Activate/Deactivate | ❌ | ✅ | ❌ | ❌ |

### Order Management

| Feature | OWNER | ADMIN | KASIR | USER |
|---------|-------|-------|-------|------|
| View All Orders | ✅ | ✅ | ✅ | ❌ |
| View Own Orders | ✅ | ✅ | ✅ | ✅ |
| Create Order | ✅ | ✅ | ✅ | ✅ |
| Update Order Status | ❌ | ✅ | ✅ | ❌ |
| Cancel Order | ❌ | ✅ | ✅ | ❌ |
| Confirm Payment | ❌ | ✅ | ✅ | ❌ |
| Print Receipt | ✅ | ✅ | ✅ | ✅ |
| Filter Orders | ✅ | ✅ | ✅ | ⚠️ Own only |

### User Management

| Feature | OWNER | ADMIN | KASIR | USER |
|---------|-------|-------|-------|------|
| View All Users | ✅* | ✅ | ❌ | ❌ |
| View OWNER Accounts | ✅ | ❌ | ❌ | ❌ |
| Create USER | ❌ | ✅ | ❌ | ❌ |
| Create ADMIN | ❌ | ✅ | ❌ | ❌ |
| Create KASIR | ❌ | ✅ | ❌ | ❌ |
| Create OWNER | ✅ | ❌ | ❌ | ❌ |
| Edit USER | ❌ | ✅ | ❌ | ❌ |
| Edit ADMIN | ❌ | ✅ | ❌ | ❌ |
| Edit KASIR | ❌ | ✅ | ❌ | ❌ |
| Edit OWNER | ✅ | ❌ | ❌ | ❌ |
| Delete USER | ❌ | ✅ | ❌ | ❌ |
| Delete ADMIN | ❌ | ✅** | ❌ | ❌ |
| Delete KASIR | ❌ | ✅ | ❌ | ❌ |
| Delete OWNER | ✅ | ❌ | ❌ | ❌ |

*Excludes other OWNER accounts  
**Cannot delete last ADMIN

### Financial Data

| Feature | OWNER | ADMIN | KASIR | USER |
|---------|-------|-------|-------|------|
| Total Revenue | ✅ Exact | ⚠️ Rounded | ❌ | ❌ |
| Revenue by Payment | ✅ Detailed | ⚠️ Summary | ❌ | ❌ |
| Revenue by Order Type | ✅ Detailed | ⚠️ Summary | ❌ | ❌ |
| Revenue Trends | ✅ All periods | ⚠️ Limited | ❌ | ❌ |
| Profit Margins | ✅ | ❌ | ❌ | ❌ |
| Growth Rate | ✅ | ❌ | ❌ | ❌ |
| Average Order Value | ✅ | ✅ | ❌ | ❌ |
| Financial Export | ✅ | ❌ | ❌ | ❌ |

### Audit Trail

| Feature | OWNER | ADMIN | KASIR | USER |
|---------|-------|-------|-------|------|
| View All Logs | ✅ | ❌ | ❌ | ❌ |
| View Own Logs | ✅ | ✅ | ❌ | ❌ |
| Filter by User | ✅ | ❌ | ❌ | ❌ |
| Filter by Action | ✅ | ✅ | ❌ | ❌ |
| Filter by Resource | ✅ | ✅ | ❌ | ❌ |
| Filter by Date | ✅ | ✅ | ❌ | ❌ |
| Export Logs | ✅ | ❌ | ❌ | ❌ |

### QR Code & Tables

| Feature | OWNER | ADMIN | KASIR | USER |
|---------|-------|-------|-------|------|
| View Tables | ✅ | ✅ | ✅ | ❌ |
| Generate QR Codes | ❌ | ✅ | ❌ | ❌ |
| Reset Table | ❌ | ✅ | ❌ | ❌ |
| Validate QR Token | ✅ | ✅ | ✅ | ✅ |

---

## API Endpoint Permissions

### Analytics Endpoints

| Endpoint | Method | OWNER | ADMIN | KASIR | USER |
|----------|--------|-------|-------|-------|------|
| /api/owner/analytics | GET | ✅ | ⚠️ | ❌ | ❌ |
| /api/owner/analytics/export | GET | ✅ | ⚠️ CSV | ❌ | ❌ |
| /api/admin/analytics | GET | ✅ | ✅ | ❌ | ❌ |

### Reports Endpoints

| Endpoint | Method | OWNER | ADMIN | KASIR | USER |
|----------|--------|-------|-------|-------|------|
| /api/owner/reports | GET | ✅ | ⚠️ | ❌ | ❌ |
| /api/owner/reports/pdf | GET | ✅ | ❌ | ❌ | ❌ |
| /api/admin/reports | GET | ✅ | ✅ | ❌ | ❌ |

### Financial Endpoints

| Endpoint | Method | OWNER | ADMIN | KASIR | USER |
|----------|--------|-------|-------|-------|------|
| /api/owner/financial | GET | ✅ | ❌ | ❌ | ❌ |

### Audit Endpoints

| Endpoint | Method | OWNER | ADMIN | KASIR | USER |
|----------|--------|-------|-------|-------|------|
| /api/owner/audit | GET | ✅ | ❌ | ❌ | ❌ |
| /api/admin/audit | GET | ❌ | ✅ | ❌ | ❌ |

### User Endpoints

| Endpoint | Method | OWNER | ADMIN | KASIR | USER |
|----------|--------|-------|-------|-------|------|
| /api/admin/users | GET | ✅* | ✅ | ❌ | ❌ |
| /api/admin/users | POST | ❌ | ✅** | ❌ | ❌ |
| /api/admin/users/[id] | GET | ✅* | ✅ | ❌ | ❌ |
| /api/admin/users/[id] | PUT | ❌ | ✅** | ❌ | ❌ |
| /api/admin/users/[id] | DELETE | ❌ | ✅** | ❌ | ❌ |
| /api/owner/users | POST | ✅ | ❌ | ❌ | ❌ |

*Filtered (no OWNER accounts shown)  
**Cannot modify OWNER accounts

### Product Endpoints

| Endpoint | Method | OWNER | ADMIN | KASIR | USER |
|----------|--------|-------|-------|-------|------|
| /api/products | GET | ✅ | ✅ | ✅ | ✅ |
| /api/products | POST | ❌ | ✅ | ❌ | ❌ |
| /api/products/[id] | GET | ✅ | ✅ | ✅ | ✅ |
| /api/products/[id] | PUT | ❌ | ✅ | ❌ | ❌ |
| /api/products/[id] | DELETE | ❌ | ✅ | ❌ | ❌ |

### Order Endpoints

| Endpoint | Method | OWNER | ADMIN | KASIR | USER |
|----------|--------|-------|-------|-------|------|
| /api/orders | GET | ✅ All | ✅ All | ✅ All | ⚠️ Own |
| /api/orders | POST | ✅ | ✅ | ✅ | ✅ |
| /api/orders/[id] | GET | ✅ | ✅ | ✅ | ⚠️ Own |
| /api/orders/[id] | PUT | ❌ | ✅ | ✅ | ❌ |
| /api/orders/[id]/status | PUT | ❌ | ✅ | ✅ | ❌ |
| /api/orders/[id]/confirm-payment | POST | ❌ | ✅ | ✅ | ❌ |

---

## Permission Rules

### OWNER Role Rules

**✅ Can Do:**
1. View all operational data (products, orders, users)
2. Access all analytics and financial reports
3. Export analytics in CSV and JSON formats
4. Download reports in PDF format
5. View all audit logs
6. Create new OWNER accounts
7. View comprehensive financial metrics

**❌ Cannot Do:**
1. Modify products (create, edit, delete)
2. Modify orders (update status, cancel)
3. Modify users (create non-OWNER, edit, delete)
4. Generate QR codes
5. Reset tables
6. Any write operations on operational data

**🔒 Security:**
- OWNER accounts are hidden from ADMIN users
- Only OWNER users can create OWNER accounts
- All actions are logged in audit trail

### ADMIN Role Rules

**✅ Can Do:**
1. Full CRUD on products
2. Full CRUD on orders
3. Create/edit/delete USER, ADMIN, KASIR accounts
4. View analytics (limited)
5. Generate and download reports (limited)
6. Generate QR codes
7. Reset tables
8. View own audit logs

**❌ Cannot Do:**
1. Create or modify OWNER accounts
2. View OWNER accounts in user list
3. Access detailed financial metrics
4. Export analytics in PDF format
5. View all audit logs (only own)
6. Delete last ADMIN user

**🔒 Security:**
- Cannot see OWNER accounts
- Cannot modify OWNER accounts
- Attempts to modify OWNER accounts are logged

### KASIR Role Rules

**✅ Can Do:**
1. View products
2. Create orders
3. Update order status
4. Confirm payments
5. View all orders
6. Print receipts

**❌ Cannot Do:**
1. Modify products
2. View analytics
3. View financial reports
4. Manage users
5. Generate QR codes
6. Access audit logs

### USER Role Rules

**✅ Can Do:**
1. View products
2. Create orders
3. View own orders
4. Print own receipts

**❌ Cannot Do:**
1. View other users' orders
2. Modify products
3. Update order status
4. View analytics
5. Access admin features

---

## Permission Hierarchy

```
OWNER (Strategic Oversight)
├── Full Analytics Access
├── Full Financial Access
├── View-Only Operational Access
└── OWNER Account Management

ADMIN (Operational Management)
├── Full Product Management
├── Full Order Management
├── User Management (except OWNER)
├── Limited Analytics Access
└── QR Code Management

KASIR (Cashier Operations)
├── Order Processing
├── Payment Confirmation
└── View Products

USER (Customer)
├── Place Orders
└── View Own Orders
```

---

## Special Cases

### OWNER Account Protection

**Scenario:** ADMIN tries to create OWNER account  
**Result:** 403 Forbidden  
**Message:** "Only OWNER users can create OWNER accounts"  
**Logged:** Yes, in audit trail

**Scenario:** ADMIN tries to edit OWNER account  
**Result:** 403 Forbidden  
**Message:** "ADMIN users cannot modify OWNER accounts"  
**Logged:** Yes, in audit trail

**Scenario:** ADMIN tries to delete OWNER account  
**Result:** 403 Forbidden  
**Message:** "ADMIN users cannot delete OWNER accounts"  
**Logged:** Yes, in audit trail

### OWNER Write Restrictions

**Scenario:** OWNER tries to create product  
**Result:** 403 Forbidden  
**Message:** "Access denied. OWNER role has view-only access to products."  
**Logged:** Yes, in audit trail

**Scenario:** OWNER tries to update order status  
**Result:** 403 Forbidden  
**Message:** "Access denied. OWNER role has view-only access to orders."  
**Logged:** Yes, in audit trail

### Last ADMIN Protection

**Scenario:** ADMIN tries to delete last ADMIN user  
**Result:** 400 Bad Request  
**Message:** "Cannot delete the last admin user"  
**Logged:** Yes, in audit trail

---

## Implementation Notes

### Permission Checking

Permissions are checked at multiple levels:

1. **Middleware Level** (`middleware.ts`)
   - Route-based access control
   - Redirects unauthorized users

2. **API Level** (`lib/apiPermissions.ts`)
   - Endpoint-specific permission checks
   - Role validation
   - Write/delete operation checks

3. **UI Level** (React components)
   - Hide unauthorized buttons/features
   - Display view-only indicators
   - Show permission error messages

### Audit Logging

All permission checks are logged:

- Successful access
- Permission denials
- Write attempt by OWNER
- ADMIN attempt to modify OWNER

### Cache Optimization

Role information is cached for 5 minutes to minimize database queries:

- Cache hit: Return cached role
- Cache miss: Fetch from database and update cache
- Cache invalidation: On role change

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team
