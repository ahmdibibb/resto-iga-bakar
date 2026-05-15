# API Documentation - OWNER Role Endpoints

## Overview

This document provides comprehensive API documentation for all endpoints accessible to OWNER users, including request/response formats, authentication requirements, and permission details.

## Table of Contents

1. [Authentication](#authentication)
2. [Analytics Endpoints](#analytics-endpoints)
3. [Reports Endpoints](#reports-endpoints)
4. [Financial Endpoints](#financial-endpoints)
5. [Audit Trail Endpoints](#audit-trail-endpoints)
6. [User Management Endpoints](#user-management-endpoints)
7. [Products Endpoints](#products-endpoints)
8. [Orders Endpoints](#orders-endpoints)
9. [Error Responses](#error-responses)
10. [Permission Matrix](#permission-matrix)

---

## Authentication

All API endpoints require authentication via JWT token stored in cookies.

**Authentication Method:** Cookie-based JWT  
**Cookie Name:** `token`  
**Token Expiration:** 7 days

**Headers Required:**
```
Cookie: token=<jwt_token>
Content-Type: application/json (for POST/PUT requests)
```

**Authentication Errors:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Valid token but insufficient permissions

---

## Analytics Endpoints

### GET /api/owner/analytics

Get analytics data for various metrics.

**Access:** OWNER, ADMIN (limited)

**Query Parameters:**
- `type` (required): Type of analytics
  - `overview`: General overview metrics
  - `sales-trend`: Sales trend over time
  - `top-products`: Top-selling products
  - `revenue-breakdown`: Revenue by payment method and order type
  - `category-revenue`: Revenue by product category
- `days` (optional): Number of days to analyze (default: 30)
  - Valid values: 7, 30, 90

**Example Request:**
```bash
GET /api/owner/analytics?type=sales-trend&days=30
Cookie: token=<jwt_token>
```

**Example Response (sales-trend):**
```json
{
  "salesTrend": [
    {
      "date": "2024-01-01",
      "revenue": 1500000,
      "orders": 25
    },
    {
      "date": "2024-01-02",
      "revenue": 1800000,
      "orders": 30
    }
  ]
}
```

**Example Response (top-products):**
```json
{
  "topProducts": [
    {
      "name": "Iga Bakar Madu",
      "category": "MAKANAN",
      "quantitySold": 150,
      "totalRevenue": 12750000
    }
  ]
}
```

**Example Response (revenue-breakdown):**
```json
{
  "revenueByMethod": {
    "CASH": 5000000,
    "QRIS": 3000000
  },
  "revenueByOrderType": {
    "DINE_IN": 6000000,
    "TAKEAWAY": 2000000
  }
}
```

---

### GET /api/owner/analytics/export

Export analytics data in CSV or JSON format.

**Access:** OWNER, ADMIN (CSV only)

**Query Parameters:**
- `days` (optional): Number of days (default: 30)
- `format` (required): Export format
  - `csv`: CSV format (OWNER and ADMIN)
  - `json`: JSON format (OWNER only)
- `type` (required): Type of data to export
  - `overview`, `sales-trend`, `top-products`, `revenue-breakdown`

**Example Request:**
```bash
GET /api/owner/analytics/export?days=30&format=csv&type=sales-trend
Cookie: token=<jwt_token>
```

**Response:**
- Content-Type: `text/csv` or `application/json`
- Content-Disposition: `attachment; filename="analytics-*.csv"`

**ADMIN Limitation:**
- ADMIN users can only export in CSV format
- Attempting PDF export returns 403 Forbidden

---

## Reports Endpoints

### GET /api/owner/reports

Generate sales reports for a specific date range.

**Access:** OWNER, ADMIN (limited)

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `type` (optional): Report type
  - `sales`: Sales report (default)
  - `daily-revenue`: Daily revenue breakdown
  - `product-sales`: Product sales breakdown

**Example Request:**
```bash
GET /api/owner/reports?startDate=2024-01-01&endDate=2024-01-31&type=sales
Cookie: token=<jwt_token>
```

**Example Response:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "days": 31
  },
  "totalRevenue": 45000000,
  "totalOrders": 500,
  "totalProductsSold": 1200,
  "averageOrderValue": 90000,
  "revenueByMethod": {
    "CASH": 25000000,
    "QRIS": 20000000
  },
  "revenueByOrderType": {
    "DINE_IN": 35000000,
    "TAKEAWAY": 10000000
  },
  "dailyRevenue": [
    {
      "date": "2024-01-01",
      "amount": 1500000,
      "orders": 20
    }
  ],
  "productSales": [
    {
      "productId": "...",
      "productName": "Iga Bakar Madu",
      "quantitySold": 150,
      "totalRevenue": 12750000
    }
  ]
}
```

---

### GET /api/owner/reports/pdf

Download sales report as PDF.

**Access:** OWNER only

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

**Example Request:**
```bash
GET /api/owner/reports/pdf?startDate=2024-01-01&endDate=2024-01-31
Cookie: token=<jwt_token>
```

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="sales-report-*.pdf"`

---

## Financial Endpoints

### GET /api/owner/financial

Get comprehensive financial metrics.

**Access:** OWNER only (ADMIN blocked)

**Query Parameters:**
- `period` (optional): Aggregation period (default: monthly)
  - `daily`: Daily aggregation
  - `weekly`: Weekly aggregation
  - `monthly`: Monthly aggregation
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Example Request:**
```bash
GET /api/owner/financial?period=monthly&startDate=2024-01-01&endDate=2024-12-31
Cookie: token=<jwt_token>
```

**Example Response:**
```json
{
  "period": "monthly",
  "dateRange": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z"
  },
  "summary": {
    "totalRevenue": 540000000,
    "totalOrders": 6000,
    "totalProductsSold": 15000,
    "averageOrderValue": 90000,
    "averageRevenuePerPeriod": 45000000,
    "growthRate": 15.5
  },
  "revenueByPaymentMethod": {
    "CASH": 300000000,
    "QRIS": 240000000
  },
  "revenueByOrderType": {
    "DINE_IN": 420000000,
    "TAKEAWAY": 120000000
  },
  "revenueByCategory": {
    "MAKANAN": 450000000,
    "MINUMAN": 90000000
  },
  "revenueTrends": [
    {
      "period": "2024-01",
      "revenue": 45000000,
      "orders": 500
    }
  ]
}
```

**Notes:**
- All amounts are exact (no rounding)
- Growth rate is calculated by comparing first half vs second half of period
- ADMIN users receive 403 Forbidden when accessing this endpoint

---

## Audit Trail Endpoints

### GET /api/owner/audit

Get audit logs (OWNER sees all, ADMIN sees own).

**Access:** OWNER (all logs), ADMIN (own logs only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `userId` (optional): Filter by user ID
- `action` (optional): Filter by action
  - `CREATE`, `UPDATE`, `DELETE`, `VIEW`, `EXPORT`, `PERMISSION_DENIED`
- `resource` (optional): Filter by resource
  - `USER`, `PRODUCT`, `ORDER`, `ANALYTICS`, `REPORT`, `PAYMENT`, `TABLE`, `AUDIT_LOG`
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Example Request:**
```bash
GET /api/owner/audit?page=1&limit=50&action=PERMISSION_DENIED&startDate=2024-01-01
Cookie: token=<jwt_token>
```

**Example Response:**
```json
{
  "logs": [
    {
      "id": "...",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "userId": "...",
      "userRole": "OWNER",
      "action": "PERMISSION_DENIED",
      "resource": "PRODUCT",
      "result": "DENIED",
      "metadata": {
        "endpoint": "/api/products",
        "method": "POST",
        "reason": "OWNER role has view-only access"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 150,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### GET /api/admin/audit

Get audit logs for current ADMIN user.

**Access:** ADMIN only

**Query Parameters:** Same as `/api/owner/audit` (except `userId` is automatically set to current user)

**Example Request:**
```bash
GET /api/admin/audit?page=1&limit=50
Cookie: token=<jwt_token>
```

**Response:** Same format as `/api/owner/audit` but filtered to current user's logs only

---

## User Management Endpoints

### POST /api/owner/users

Create a new OWNER account.

**Access:** OWNER only

**Request Body:**
```json
{
  "email": "newowner@resto.com",
  "name": "New Owner",
  "password": "SecurePassword123"
}
```

**Validation:**
- Email: Valid email format, must be unique
- Name: Required, non-empty string
- Password: Minimum 8 characters

**Example Request:**
```bash
POST /api/owner/users
Cookie: token=<jwt_token>
Content-Type: application/json

{
  "email": "newowner@resto.com",
  "name": "New Owner",
  "password": "SecurePassword123"
}
```

**Example Response:**
```json
{
  "id": "...",
  "email": "newowner@resto.com",
  "name": "New Owner",
  "role": "OWNER",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "message": "OWNER account created successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error (invalid email, weak password, etc.)
- `403 Forbidden`: Non-OWNER user attempting to create OWNER account
- `409 Conflict`: Email already exists

---

### GET /api/admin/users

Get list of users (OWNER accounts filtered out for non-OWNER users).

**Access:** OWNER, ADMIN

**Query Parameters:**
- `role` (optional): Filter by role (USER, ADMIN, KASIR)

**Example Request:**
```bash
GET /api/admin/users?role=ADMIN
Cookie: token=<jwt_token>
```

**Example Response:**
```json
[
  {
    "id": "...",
    "email": "admin@resto.com",
    "name": "Admin Resto",
    "role": "ADMIN",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Notes:**
- OWNER accounts are automatically filtered out for non-OWNER users
- This is a security measure to prevent unauthorized access

---

### GET /api/admin/users/[id]

Get user details by ID.

**Access:** OWNER, ADMIN

**Example Request:**
```bash
GET /api/admin/users/clx00000000000000000000001
Cookie: token=<jwt_token>
```

**Example Response:**
```json
{
  "id": "clx00000000000000000000001",
  "email": "admin@resto.com",
  "name": "Admin Resto",
  "role": "ADMIN",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `403 Forbidden`: Non-OWNER user attempting to view OWNER account
- `404 Not Found`: User not found

---

## Products Endpoints

### GET /api/products

Get list of all products.

**Access:** Public (no authentication required)

**Query Parameters:**
- `includeStock` (optional): Include stock information (boolean)
- `category` (optional): Filter by category (MAKANAN, MINUMAN)
- `isActive` (optional): Filter by active status (boolean)

**Example Request:**
```bash
GET /api/products?includeStock=true&category=MAKANAN
```

**Example Response:**
```json
[
  {
    "id": "...",
    "name": "Iga Bakar Madu",
    "description": "Iga bakar dengan bumbu madu yang manis dan gurih",
    "price": 85000,
    "category": "MAKANAN",
    "stock": 50,
    "isActive": true,
    "image": "https://..."
  }
]
```

**Notes:**
- OWNER users can view all products but cannot modify them
- Stock information included when `includeStock=true`
- Low stock alert when stock < 10

---

### POST /api/products

Create a new product.

**Access:** ADMIN only (OWNER blocked)

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 50000,
  "category": "MAKANAN",
  "stock": 100,
  "image": "https://..."
}
```

**Error Response for OWNER:**
```json
{
  "error": "Access denied. OWNER role has view-only access to products."
}
```
Status: `403 Forbidden`

---

## Orders Endpoints

### GET /api/orders

Get list of orders.

**Access:** OWNER (all orders), ADMIN (all orders), KASIR (all orders), USER (own orders only)

**Query Parameters:**
- `status` (optional): Filter by status
  - `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`
- `paymentMethod` (optional): Filter by payment method (CASH, QRIS)
- `date` (optional): Filter by date (YYYY-MM-DD)
- `limit` (optional): Number of results (default: 50)

**Example Request:**
```bash
GET /api/orders?status=COMPLETED&paymentMethod=CASH&limit=20
Cookie: token=<jwt_token>
```

**Example Response:**
```json
{
  "orders": [
    {
      "id": "...",
      "customerName": "John Doe",
      "totalAmount": 150000,
      "status": "COMPLETED",
      "payment_method": "CASH",
      "orderType": "DINE_IN",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "items": [
        {
          "id": "...",
          "productId": "...",
          "quantity": 2,
          "subtotal": 150000,
          "product": {
            "name": "Iga Bakar Madu"
          }
        }
      ],
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

**Notes:**
- OWNER users can view all orders but cannot modify them
- Includes order items and customer information

---

### PUT /api/orders/[id]

Update order status.

**Access:** ADMIN, KASIR only (OWNER blocked)

**Request Body:**
```json
{
  "status": "PREPARING"
}
```

**Error Response for OWNER:**
```json
{
  "error": "Access denied. OWNER role has view-only access to orders."
}
```
Status: `403 Forbidden`

---

## Error Responses

### Standard Error Format

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data or validation error
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Valid authentication but insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `500 Internal Server Error`: Server error

### Common Error Messages

**Authentication Errors:**
```json
{ "error": "Authentication required" }
{ "error": "Invalid or expired token" }
```

**Permission Errors:**
```json
{ "error": "Access denied. Required role: OWNER" }
{ "error": "Access denied. OWNER role has view-only access to operational data." }
{ "error": "Only OWNER users can create OWNER accounts" }
{ "error": "ADMIN users cannot create or modify OWNER accounts" }
```

**Validation Errors:**
```json
{ "error": "Email, name, and password are required" }
{ "error": "Invalid email format" }
{ "error": "Password must be at least 8 characters long" }
{ "error": "Email already exists" }
```

---

## Permission Matrix

| Endpoint | OWNER | ADMIN | KASIR | USER |
|----------|-------|-------|-------|------|
| **Analytics** |
| GET /api/owner/analytics | ✅ Full | ⚠️ Limited | ❌ | ❌ |
| GET /api/owner/analytics/export | ✅ CSV/JSON | ⚠️ CSV only | ❌ | ❌ |
| **Reports** |
| GET /api/owner/reports | ✅ Full | ⚠️ Limited | ❌ | ❌ |
| GET /api/owner/reports/pdf | ✅ | ❌ | ❌ | ❌ |
| **Financial** |
| GET /api/owner/financial | ✅ | ❌ | ❌ | ❌ |
| **Audit Trail** |
| GET /api/owner/audit | ✅ All logs | ❌ | ❌ | ❌ |
| GET /api/admin/audit | ❌ | ✅ Own logs | ❌ | ❌ |
| **Users** |
| GET /api/admin/users | ✅ View* | ✅ View | ❌ | ❌ |
| GET /api/admin/users/[id] | ✅ View* | ✅ View | ❌ | ❌ |
| POST /api/admin/users | ❌ | ✅** | ❌ | ❌ |
| PUT /api/admin/users/[id] | ❌ | ✅** | ❌ | ❌ |
| DELETE /api/admin/users/[id] | ❌ | ✅** | ❌ | ❌ |
| POST /api/owner/users | ✅ | ❌ | ❌ | ❌ |
| **Products** |
| GET /api/products | ✅ View | ✅ View | ✅ View | ✅ View |
| POST /api/products | ❌ | ✅ | ❌ | ❌ |
| PUT /api/products/[id] | ❌ | ✅ | ❌ | ❌ |
| DELETE /api/products/[id] | ❌ | ✅ | ❌ | ❌ |
| **Orders** |
| GET /api/orders | ✅ All | ✅ All | ✅ All | ⚠️ Own only |
| POST /api/orders | ✅ | ✅ | ✅ | ✅ |
| PUT /api/orders/[id] | ❌ | ✅ | ✅ | ❌ |

*Excludes other OWNER accounts  
**Cannot modify OWNER accounts

---

## Rate Limiting

Currently, there are no rate limits implemented. However, best practices recommend:

- Maximum 100 requests per minute per user
- Maximum 1000 requests per hour per user
- Bulk operations should be paginated

---

## Changelog

### Version 1.0 (2024)
- Initial API documentation
- OWNER role endpoints documented
- Permission matrix created
- Error response formats standardized

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team
