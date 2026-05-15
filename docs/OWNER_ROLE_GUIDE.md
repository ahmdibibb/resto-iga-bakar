# OWNER Role User Guide

## Overview

The OWNER role provides strategic oversight and business intelligence capabilities with view-only access to operational data and full access to analytics and financial reports. This guide explains the capabilities, limitations, and best practices for OWNER users.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Capabilities](#capabilities)
3. [Limitations](#limitations)
4. [Dashboard Features](#dashboard-features)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Getting Started

### Login Credentials

**Default OWNER Account:**
- Email: `owner@resto.com`
- Password: `owner123`

**⚠️ Important:** Change the default password immediately after first login.

### Accessing the Dashboard

1. Navigate to the login page
2. Enter your OWNER credentials
3. You will be redirected to `/owner` dashboard
4. The dashboard displays key business metrics and analytics

---

## Capabilities

### ✅ Full Access

OWNER users have **full access** to the following:

#### 1. Analytics
- View sales trends (7/30/90 days)
- Top-selling products analysis
- Revenue breakdown by payment method (CASH, QRIS)
- Revenue breakdown by order type (DINE_IN, TAKEAWAY)
- Category-based revenue analysis
- Export analytics data (CSV format)

#### 2. Financial Reports
- Generate sales reports for any date range
- View comprehensive financial metrics:
  - Total revenue (exact amounts)
  - Revenue by payment method
  - Revenue by order type
  - Daily/weekly/monthly trends
  - Average order value
  - Growth rate calculations
- Download reports in PDF format
- View daily revenue reports
- View product sales reports

#### 3. Audit Trail
- View all audit logs across the system
- Filter logs by:
  - User
  - Action (CREATE, UPDATE, DELETE, VIEW, EXPORT)
  - Resource (USER, PRODUCT, ORDER, etc.)
  - Date range
- Track permission denials and security events

### 👁️ View-Only Access

OWNER users have **view-only access** to:

#### 1. Products
- View all product information
- See product details (name, price, stock, category, status)
- Monitor stock levels and low-stock alerts
- **Cannot:** Add, edit, or delete products

#### 2. Orders
- View all orders and their details
- Filter orders by status, payment method, and date
- View order items and customer information
- **Cannot:** Modify order status or cancel orders

#### 3. Users
- View all users (except other OWNER accounts)
- See user roles, email, name, and creation date
- View user statistics by role
- **Cannot:** Create, edit, or delete users

### ❌ No Access

OWNER users **cannot access**:

- QR Code Generator (ADMIN-only feature)
- Any write operations on operational data
- Other OWNER account information (security measure)

---

## Limitations

### View-Only Restrictions

**Why View-Only?**
The OWNER role is designed for strategic oversight, not operational management. This separation ensures:
- Clear division of responsibilities
- Reduced risk of accidental data modification
- Focus on business intelligence and decision-making

**What This Means:**
- No "Add", "Edit", or "Delete" buttons on operational pages
- All modification requests return 403 Forbidden errors
- Audit logs track all attempted write operations

### OWNER Account Management

**Creating OWNER Accounts:**
- Only OWNER users can create new OWNER accounts
- ADMIN users cannot create or modify OWNER accounts
- Use the system initialization script for the first OWNER account

**Security Measures:**
- OWNER accounts are hidden from ADMIN users
- Only OWNER users can view other OWNER accounts
- This prevents unauthorized access to strategic-level accounts

---

## Dashboard Features

### Main Dashboard (`/owner`)

**Key Metrics:**
- Total Menus
- Total Orders Today
- Total Products Sold
- Revenue Today

**Revenue Chart:**
- Toggle between Day/Week/Month views
- Interactive tooltips showing revenue and order count
- Auto-refreshes every 30 seconds

**Recent Orders:**
- View last 5 orders
- See order status, payment method, and total
- Click "View All" to see complete order list

### Analytics Page (`/owner/analytics`)

**Sales Trend Chart:**
- Visualize revenue over time
- Select 7, 30, or 90-day periods
- Export data in CSV format

**Top Products Table:**
- Ranked by quantity sold
- Shows category, quantity, and revenue
- Gold/silver/bronze badges for top 3

**Revenue Breakdown:**
- Payment method distribution
- Order type distribution
- Category-based revenue

**Auto-Refresh:**
- Data refreshes every 60 seconds
- Manual refresh button available

### Reports Page (`/owner/reports`)

**Date Range Selector:**
- Choose custom start and end dates
- Generate reports for any period

**Report Sections:**
- Summary metrics (revenue, orders, products sold, avg order value)
- Payment method breakdown
- Daily revenue table
- Product sales breakdown

**PDF Download:**
- Click "Download PDF" to export report
- Includes all report data in formatted PDF

### Products View (`/owner/products`)

**Product Table:**
- View all products with images
- See name, category, price, stock, and status
- Low stock alerts (< 10 units)

**Stock Monitoring:**
- Red indicators for low stock items
- Separate section showing all low-stock products

### Orders View (`/owner/orders`)

**Filters:**
- Status (Pending, Confirmed, Preparing, Ready, Completed, Cancelled)
- Payment Method (Cash, QRIS)
- Date

**Order Details Modal:**
- Click "View Details" to see full order information
- Customer information
- Order items with quantities and prices
- Payment information

### Users View (`/owner/users`)

**User Table:**
- View all users (excluding other OWNER accounts)
- See name, email, role, and creation date

**Role Filter:**
- Filter by Admin, Kasir, or User roles

**User Statistics:**
- Total users count
- Count by role (Admins, Kasir, Customers)

---

## Troubleshooting

### Common Issues

#### 1. "Access Denied" Error

**Problem:** You see a 403 Forbidden error when trying to perform an action.

**Solution:**
- This is expected for write operations (add, edit, delete)
- OWNER role has view-only access to operational data
- Contact an ADMIN user if changes are needed

#### 2. Dashboard Not Loading

**Problem:** Dashboard shows loading spinner indefinitely.

**Solution:**
1. Check your internet connection
2. Refresh the page (Ctrl+R or Cmd+R)
3. Clear browser cache and cookies
4. Try logging out and back in
5. Contact technical support if issue persists

#### 3. Data Not Refreshing

**Problem:** Dashboard data appears outdated.

**Solution:**
- Click the manual refresh button (circular arrow icon)
- Wait for auto-refresh (30-60 seconds depending on page)
- Check if there's an error message displayed

#### 4. Cannot See Other OWNER Accounts

**Problem:** Other OWNER accounts don't appear in Users list.

**Solution:**
- This is a security feature, not a bug
- OWNER accounts are hidden from the Users view
- Only system administrators can manage OWNER accounts

#### 5. Export Not Working

**Problem:** CSV or PDF export fails.

**Solution:**
1. Check browser popup blocker settings
2. Ensure you have permission to download files
3. Try a different browser
4. Check browser console for error messages

---

## FAQ

### General Questions

**Q: What is the difference between OWNER and ADMIN roles?**

A: 
- **OWNER:** Strategic oversight, view-only operational access, full analytics/financial access
- **ADMIN:** Operational management, full CRUD capabilities, limited financial visibility

**Q: Can I modify products or orders as an OWNER?**

A: No. OWNER role has view-only access to operational data. Contact an ADMIN user for modifications.

**Q: Why can't I see other OWNER accounts?**

A: This is a security measure. OWNER accounts are hidden from the Users view to prevent unauthorized access.

**Q: How do I create a new OWNER account?**

A: Only OWNER users can create OWNER accounts. Navigate to the user management section (when implemented) or use the system initialization script.

### Technical Questions

**Q: How often does the dashboard refresh?**

A: 
- Main dashboard: Every 30 seconds
- Analytics page: Every 60 seconds
- Manual refresh available on all pages

**Q: What data formats can I export?**

A:
- Analytics: CSV format
- Reports: PDF format

**Q: Are my actions logged?**

A: Yes. All actions, including view operations and permission denials, are logged in the audit trail.

**Q: Can I access the system from mobile devices?**

A: Yes. The dashboard is responsive and works on tablets and smartphones.

**Q: What browsers are supported?**

A: Modern browsers including Chrome, Firefox, Safari, and Edge (latest versions).

### Security Questions

**Q: How secure is my OWNER account?**

A: Very secure. OWNER accounts:
- Are hidden from ADMIN users
- Require authentication for all actions
- Have all actions logged in audit trail
- Cannot be modified by ADMIN users

**Q: What should I do if I suspect unauthorized access?**

A:
1. Change your password immediately
2. Review the audit trail for suspicious activity
3. Contact system administrator
4. Report the incident to security team

**Q: How long do I stay logged in?**

A: JWT tokens expire after 7 days. You'll need to log in again after that period.

---

## Best Practices

### Daily Operations

1. **Start with Dashboard:** Check key metrics and recent orders
2. **Review Analytics:** Monitor sales trends and top products
3. **Check Stock Levels:** Review low-stock alerts on Products page
4. **Monitor Orders:** Filter by status to track order flow
5. **Review Audit Trail:** Check for any unusual activity

### Weekly Tasks

1. **Generate Reports:** Create weekly sales reports
2. **Analyze Trends:** Compare week-over-week performance
3. **Review User Activity:** Check audit logs for the week
4. **Export Data:** Download analytics for record-keeping

### Monthly Tasks

1. **Comprehensive Reports:** Generate monthly financial reports
2. **Performance Analysis:** Review 30-day analytics
3. **Strategic Planning:** Use insights for business decisions
4. **Archive Reports:** Save PDF reports for records

### Security Best Practices

1. **Strong Passwords:** Use complex, unique passwords
2. **Regular Password Changes:** Update password every 90 days
3. **Secure Logout:** Always log out when finished
4. **Monitor Audit Trail:** Regularly review your activity logs
5. **Report Issues:** Immediately report any suspicious activity

---

## Contact & Support

### Need Help?

**For Operational Changes:**
- Contact ADMIN users for product, order, or user modifications

**For Technical Issues:**
- Email: support@resto.com
- Phone: [Your Support Number]

**For Security Concerns:**
- Email: security@resto.com
- Report immediately if you suspect unauthorized access

---

## Appendix

### Keyboard Shortcuts

- `Ctrl/Cmd + R`: Refresh page
- `Esc`: Close modals
- `Tab`: Navigate between form fields

### API Endpoints (For Developers)

**OWNER-Accessible Endpoints:**
- `GET /api/owner/analytics` - Analytics data
- `GET /api/owner/reports` - Sales reports
- `GET /api/owner/financial` - Financial metrics
- `GET /api/owner/audit` - Audit logs
- `POST /api/owner/users` - Create OWNER accounts
- `GET /api/products` - View products
- `GET /api/orders` - View orders
- `GET /api/admin/users` - View users (filtered)

### Permission Matrix

| Resource | OWNER | ADMIN | KASIR | USER |
|----------|-------|-------|-------|------|
| Analytics | Full | Limited | No | No |
| Financial Reports | Full | Limited | No | No |
| Products (View) | Yes | Yes | Yes | Yes |
| Products (Modify) | No | Yes | No | No |
| Orders (View) | Yes | Yes | Yes | Own |
| Orders (Modify) | No | Yes | Yes | No |
| Users (View) | Yes* | Yes | No | No |
| Users (Modify) | No | Yes** | No | No |
| Audit Trail | All | Own | No | No |
| QR Generator | No | Yes | No | No |

*Excludes other OWNER accounts  
**Cannot modify OWNER accounts

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team
