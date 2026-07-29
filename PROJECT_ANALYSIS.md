# 📋 ANALISIS LENGKAP PROJECT RESTO IGA BAKAR

> **Sistem Informasi Manajemen Restoran Berbasis Web**  
> Dokumentasi Komprehensif - Version 1.0  
> Dibuat: 29 Juli 2026

---

## 📑 DAFTAR ISI

1. [Overview Project](#overview-project)
2. [Teknologi Stack](#teknologi-stack)
3. [Arsitektur Sistem](#arsitektur-sistem)
4. [Database Schema & Relasi](#database-schema--relasi)
5. [Design System](#design-system)
6. [Authentication & Authorization](#authentication--authorization)
7. [Fitur Utama & Business Logic](#fitur-utama--business-logic)
8. [Fitur Khusus & Optimisasi](#fitur-khusus--optimisasi)
9. [User Flows](#user-flows)
10. [API Documentation](#api-documentation)
11. [Setup & Deployment](#setup--deployment)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 OVERVIEW PROJECT

**Resto Iga Bakar** adalah sistem manajemen restoran berbasis web yang komprehensif, dibangun dengan teknologi modern untuk mengelola operasional restoran dari pemesanan hingga pembayaran. Project ini menggabungkan sistem Point of Sale (POS), manajemen inventory, dan dashboard analytics dalam satu platform terintegrasi.

### Karakteristik Utama:

- ✅ **Guest Checkout** - Customer tidak perlu login/register untuk order
- ✅ **Multi-Role System** - OWNER (view-only), ADMIN (full CRUD), KASIR (order management)
- ✅ **QR Code Table** - Scan QR untuk dine-in atau takeaway
- ✅ **Pre-Order Online** - Order via URL publik dengan WhatsApp notification
- ✅ **Real-Time Updates** - SSE + Polling untuk live order updates
- ✅ **Payment Gateway** - Integrasi Midtrans Snap (QRIS) & Cash
- ✅ **Inventory Management** - Auto stock deduction & low stock alerts
- ✅ **Analytics Dashboard** - Real-time metrics & PDF reports
- ✅ **Audit Trail** - Complete audit logging untuk compliance

---

## 💻 TEKNOLOGI STACK

### Frontend & Backend
```json
{
  "framework": "Next.js 16.2.4 (App Router)",
  "language": "TypeScript 5",
  "ui": "Tailwind CSS 4",
  "state": "SWR 2.4.1 (real-time data fetching)",
  "icons": "Lucide React",
  "charts": "Recharts 3.8.0",
  "pdf": "jsPDF 3.0.4 + jspdf-autotable",
  "qr": "qrcode.react 4.2.0"
}
```

### Database & ORM
```json
{
  "database": "MySQL 8.0+",
  "orm": "Prisma 6.18.0",
  "client": "@prisma/client 6.18.0"
}
```

### Authentication & Security
```json
{
  "auth": "JWT (JSON Web Token)",
  "crypto": "jose 6.1.0 (JWT signing/verify)",
  "hashing": "bcryptjs 3.0.3",
  "validation": "Custom validation utilities"
}
```

### Payment & Integrations
```json
{
  "payment": "Midtrans Snap API",
  "notification": "WhatsApp Business API",
  "storage": "Cloudinary (image upload)"
}
```

### DevOps & Tools
```json
{
  "package_manager": "npm",
  "runtime": "Node.js 20+",
  "dev_tools": "tsx, puppeteer"
}
```

---

## 🏗️ ARSITEKTUR SISTEM

### Struktur Folder (Next.js App Router)

```
resto-iga-bakar/
├── app/                          # Next.js App Router
│   ├── (routes)
│   │   ├── admin/               # Dashboard Admin
│   │   │   ├── page.tsx         # Main dashboard
│   │   │   ├── qr-generator/    # QR code generator
│   │   │   ├── reports/         # Sales reports
│   │   │   └── settings/        # System settings
│   │   ├── kasir/               # Dashboard Kasir
│   │   │   └── page.tsx         # Order queue & history
│   │   ├── owner/               # Dashboard Owner (View-Only)
│   │   │   ├── page.tsx         # Overview dashboard
│   │   │   ├── analytics/       # Deep analytics
│   │   │   ├── reports/         # Financial reports
│   │   │   ├── products/        # Product view
│   │   │   ├── orders/          # Order history
│   │   │   ├── users/           # User management view
│   │   │   └── settings/        # Settings view
│   │   ├── menu/                # Halaman menu customer
│   │   │   └── page.tsx         # Product listing + cart
│   │   ├── checkout/            # Halaman checkout
│   │   │   └── page.tsx         # Order form + payment method
│   │   ├── payment/             # Halaman pembayaran
│   │   │   └── [orderId]/       # Payment status page
│   │   ├── cart/                # Halaman keranjang
│   │   ├── login/               # Halaman login staff
│   │   ├── profile/             # Profile management
│   │   └── privacy-policy/      # Privacy policy
│   ├── api/                     # API Routes
│   │   ├── auth/
│   │   │   ├── login/           # POST - Staff login
│   │   │   ├── logout/          # POST - Logout
│   │   │   └── me/              # GET - Current user
│   │   ├── products/
│   │   │   ├── route.ts         # GET all, POST create
│   │   │   ├── [id]/            # GET, PUT, DELETE by ID
│   │   │   └── upload/          # POST - Image upload
│   │   ├── orders/
│   │   │   ├── route.ts         # GET all, POST create
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts     # GET, PUT by ID
│   │   │   │   ├── status/      # PATCH - Update status
│   │   │   │   ├── print/       # POST - Mark as printed
│   │   │   │   └── confirm-payment/ # PATCH - Confirm cash
│   │   │   ├── stream/          # GET - SSE for real-time
│   │   │   └── status/          # GET - Order status check
│   │   ├── payments/
│   │   │   ├── route.ts         # POST - Create payment
│   │   │   └── midtrans/
│   │   │       └── notification/ # POST - Webhook handler
│   │   ├── admin/
│   │   │   ├── analytics/       # GET - Dashboard stats
│   │   │   ├── reports/         # GET - Sales reports
│   │   │   ├── audit/           # GET - Audit logs
│   │   │   ├── users/           # CRUD users
│   │   │   ├── tables/          # CRUD tables
│   │   │   ├── banners/         # CRUD campaign banners
│   │   │   ├── orders/          # GET - All orders
│   │   │   └── upload/          # POST - File upload
│   │   ├── kasir/
│   │   │   └── orders/
│   │   │       ├── route.ts     # GET - Incoming orders
│   │   │       └── history/     # GET - History orders
│   │   ├── owner/
│   │   │   ├── analytics/       # GET - Full analytics
│   │   │   │   └── export/      # GET - Export data
│   │   │   ├── reports/         # GET - Financial reports
│   │   │   │   └── pdf/         # GET - Download PDF
│   │   │   ├── financial/       # GET - Financial summary
│   │   │   ├── audit/           # GET - Audit trail
│   │   │   └── users/           # GET - User list (view)
│   │   ├── tables/
│   │   │   └── validate/        # POST - Validate QR token
│   │   ├── banners/
│   │   │   └── active/          # GET - Active banner
│   │   ├── settings/            # GET, PUT - System settings
│   │   ├── profile/             # GET, PUT - User profile
│   │   └── dashboard/
│   │       ├── stats/           # GET - Dashboard stats
│   │       └── sales-report/    # GET - Sales report
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # React Components
│   ├── admin/
│   │   ├── AdminShell.tsx       # Admin layout wrapper
│   │   ├── ProductForm.tsx      # Product create/edit form
│   │   ├── ProductTable.tsx     # Product list table
│   │   ├── OrderList.tsx        # Order management table
│   │   ├── UserManagement.tsx   # User CRUD interface
│   │   ├── Analytics.tsx        # Analytics charts
│   │   ├── BannerManagement.tsx # Campaign banner CRUD
│   │   ├── RevenueBarChart.tsx  # Revenue chart component
│   │   ├── OrderDetailModal.tsx # Order details popup
│   │   └── LoadingSkeleton.tsx  # Loading placeholders
│   ├── kasir/
│   │   ├── OrderCard.tsx        # Order card component
│   │   ├── ReceiptPrinter.tsx   # Receipt print utility
│   │   └── types.ts             # Shared types
│   ├── owner/
│   │   ├── OwnerShell.tsx       # Owner layout wrapper
│   │   └── (other components)   # Owner-specific components
│   ├── navbar/
│   │   ├── Navbar.tsx           # Staff navbar
│   │   ├── CustomerNavbar.tsx   # Customer navbar
│   │   └── CategoryNavbar.tsx   # Menu category tabs
│   ├── ui/                      # Reusable UI components
│   ├── CartSidebar.tsx          # Shopping cart sidebar
│   ├── ErrorAlert.tsx           # Error display component
│   ├── Loading.tsx              # Loading spinner
│   └── StatusBadge.tsx          # Order status badge
├── lib/                          # Utilities & Business Logic
│   ├── auth.ts                  # JWT authentication
│   ├── permissions.ts           # Role-based access control
│   ├── apiPermissions.ts        # API permission middleware
│   ├── prisma.ts                # Prisma client singleton
│   ├── midtrans.ts              # Midtrans Snap integration
│   ├── whatsapp.ts              # WhatsApp API integration
│   ├── validation.ts            # Input validation utilities
│   ├── errorHandler.ts          # Error handling & custom errors
│   ├── auditLog.ts              # Audit logging utility
│   ├── orderEvents.ts           # Server-Sent Events manager
│   ├── paymentTimeout.ts        # Payment timeout scheduler
│   ├── tableValidation.ts       # Table QR validation
│   ├── timezone.ts              # Timezone utilities
│   ├── salesMetrics.ts          # Sales calculation logic
│   ├── pdfGenerator.ts          # Generic PDF generator
│   ├── generateSalesReportPDF.ts # Sales report PDF
│   ├── utils.ts                 # General utilities
│   └── hooks/
│       └── useAdminStats.ts     # SWR hooks for real-time data
├── prisma/                       # Database
│   ├── schema.prisma            # Database schema definition
│   ├── migrations/              # Database migrations
│   ├── seed.ts                  # Seed script (TypeScript)
│   ├── seed.sql                 # Seed data (SQL)
│   ├── seed.md                  # Seed documentation
│   └── database_setup.sql       # Initial database setup
├── scripts/                      # Utility scripts
│   ├── setup-database.js        # Database setup automation
│   └── test-database.js         # Database connection test
├── docs/                         # Documentation
│   ├── API_DOCUMENTATION.md     # API endpoint docs
│   ├── OWNER_ROLE_GUIDE.md      # Owner role guide
│   ├── PERMISSION_MATRIX.md     # Permission matrix
│   ├── FIX_AUTH_NOW.md          # MySQL auth fix quick guide
│   ├── MYSQL_AUTH_FIX.md        # MySQL auth detailed guide
│   ├── TROUBLESHOOTING.md       # Common issues & solutions
│   └── whatsapp-setup.md        # WhatsApp API setup
├── public/                       # Static assets
│   └── (images, icons, etc.)
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies & scripts
├── README.md                     # Project README
├── QUICK_START.md                # Quick setup guide
├── design.md                     # Design system documentation
└── PROJECT_ANALYSIS.md           # This file
```

### Arsitektur Aplikasi

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │   Customer  │  │    Kasir    │  │  Admin / Owner  │    │
│  │   (Guest)   │  │  (Authed)   │  │    (Authed)     │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
│         │                 │                   │             │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS MIDDLEWARE (middleware.ts)             │
│         ┌───────────────────────────────────────┐           │
│         │  JWT Token Verification & Role Check  │           │
│         │  - Public Routes: /menu, /checkout    │           │
│         │  - Protected: /admin, /kasir, /owner  │           │
│         └───────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS APP ROUTER (app/)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  API Routes  │  │  Components  │     │
│  │  (UI Layer)  │  │ (Controllers)│  │  (UI Blocks) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
          │                 │
          │                 ▼
          │       ┌─────────────────────────┐
          │       │   BUSINESS LOGIC (lib/) │
          │       │  - Auth & Permissions   │
          │       │  - Validation           │
          │       │  - Payment Integration  │
          │       │  - Audit Logging        │
          │       │  - PDF Generation       │
          │       └─────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    PRISMA ORM (lib/prisma.ts)               │
│         Database Query Builder & Type-Safe ORM              │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                      MYSQL DATABASE                         │
│  - Users, Products, Orders, Payments                        │
│  - Tables, Audit Logs, System Settings                      │
│  - Stock History, Campaign Banners                          │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Midtrans   │  │   WhatsApp   │  │  Cloudinary  │     │
│  │  (Payment)   │  │  (Notif)     │  │   (Images)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```



---

## 🗄️ DATABASE SCHEMA & RELASI

### Entity Relationship Diagram (ERD)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│     User     │         │    Table     │         │   Product    │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ email        │         │ name         │         │ name         │
│ name         │         │ qr_token     │         │ description  │
│ password     │         │ status       │         │ price        │
│ role         │         │ createdAt    │         │ image        │
│ createdAt    │         │ updatedAt    │         │ category     │
│ updatedAt    │         └──────────────┘         │ stock        │
└──────────────┘                │                 │ isActive     │
       │                        │                 │ createdAt    │
       │                        │                 │ updatedAt    │
       │                        │                 └──────────────┘
       │                        │                        │
       │ (1:N)                  │ (1:N)                 │ (1:N)
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │      Order       │
                      ├──────────────────┤
                      │ id (PK)          │
                      │ orderNumber      │
                      │ userId (FK)      │◄──────┐
                      │ table_id (FK)    │       │
                      │ session_id       │       │
                      │ customerName     │       │
                      │ customerPhone    │       │
                      │ status           │       │
                      │ payment_status   │       │
                      │ payment_method   │       │
                      │ totalAmount      │       │
                      │ orderType        │       │
                      │ tableNumber      │       │
                      │ notes            │       │
                      │ channel          │       │
                      │ pickupTime       │       │
                      │ printedAt        │       │
                      │ createdAt        │       │
                      │ updatedAt        │       │
                      └──────────────────┘       │
                         │            │          │
                    (1:N)│            │(1:1)     │
                         │            │          │
              ┌──────────┘            └──────────┼──────────┐
              ▼                                  ▼          │
    ┌──────────────────┐                ┌──────────────┐   │
    │    OrderItem     │                │   Payment    │   │
    ├──────────────────┤                ├──────────────┤   │
    │ id (PK)          │                │ id (PK)      │   │
    │ orderId (FK)     │                │ orderId (FK) │───┘
    │ productId (FK)   │────┐           │ method       │
    │ quantity         │    │           │ amount       │
    │ price            │    │           │ status       │
    │ subtotal         │    │           │ transactionId│
    │ createdAt        │    │           │ qris_string  │
    └──────────────────┘    │           │ expires_at   │
                            │           │ paidAt       │
                            │           │ createdAt    │
                            │           │ updatedAt    │
                            │           └──────────────┘
                            │
                            └─────────┐
                                      ▼
                            ┌──────────────────┐
                            │  StockHistory    │
                            ├──────────────────┤
                            │ id (PK)          │
                            │ productId (FK)   │
                            │ quantity         │
                            │ type (IN/OUT)    │
                            │ description      │
                            │ createdAt        │
                            └──────────────────┘

┌──────────────────┐         ┌──────────────────┐
│    AuditLog      │         │  SystemSetting   │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ timestamp        │         │ key              │
│ userId           │         │ value (JSON)     │
│ userRole         │         │ createdAt        │
│ action           │         │ updatedAt        │
│ resource         │         └──────────────────┘
│ result           │
│ metadata (JSON)  │         ┌──────────────────┐
└──────────────────┘         │ CampaignBanner   │
                             ├──────────────────┤
                             │ id (PK)          │
                             │ title            │
                             │ subtitle         │
                             │ imageUrl         │
                             │ isActive         │
                             │ createdAt        │
                             │ updatedAt        │
                             └──────────────────┘
```

### Detail Model Database

#### 1. **User** - Manajemen Pengguna

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // Hashed dengan bcryptjs (salt rounds: 10)
  role      UserRole @default(KASIR)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
}

enum UserRole {
  OWNER    // View-only, full analytics access
  ADMIN    // Full CRUD access (kecuali OWNER accounts)
  KASIR    // Order management only
}
```

**Penjelasan Role:**

| Role | Permissions | Use Case |
|------|-------------|----------|
| **OWNER** | ✅ Read all data<br>✅ Export analytics<br>✅ Download reports<br>❌ No write/delete | Pemilik restoran yang hanya monitoring |
| **ADMIN** | ✅ Full CRUD products<br>✅ Full CRUD orders<br>✅ Full CRUD users (except OWNER)<br>✅ Generate QR codes<br>✅ Manage settings | Manajer restoran yang handle operasional |
| **KASIR** | ✅ View orders<br>✅ Confirm cash payments<br>✅ Update order status<br>✅ Print receipts<br>❌ No product/user management | Staff kasir di counter |

#### 2. **Product** - Manajemen Menu

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  image       String?  // URL Cloudinary
  category    String?  // 'MAKANAN' atau 'MINUMAN'
  stock       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orderItems  OrderItem[]
  stockHistory StockHistory[]
}
```

**Fitur Produk:**
- **Auto Stock Deduction**: Stok otomatis berkurang saat order dibuat
- **Low Stock Alert**: Alert di dashboard jika stok < 10
- **Soft Delete**: Produk dengan riwayat order di-nonaktifkan (isActive=false) alih-alih dihapus
- **Image Upload**: Upload gambar ke Cloudinary via CldUploadWidget

#### 3. **Order** - Pesanan

```prisma
model Order {
  id             String        @id @default(cuid())
  orderNumber    String        @unique  // Format: ORD-01-0MBNK, ORD-02-0MBNK
  userId         String?       // Null untuk guest orders
  user           User?         @relation(fields: [userId], references: [id])
  session_id     String?       // UUID untuk tracking guest
  table_id       String?       // Relasi ke Table
  table          Table?        @relation(fields: [table_id], references: [id])
  customerName   String?       // Nama customer (wajib untuk guest)
  customerPhone  String?       // Nomor HP (untuk pre-order WA notif)
  status         OrderStatus   @default(PENDING_PAYMENT)
  payment_status PaymentStatus @default(UNPAID)
  payment_method PaymentMethod?
  totalAmount    Decimal       @db.Decimal(10, 2)
  orderType      OrderType     @default(DINE_IN)
  tableNumber    String?       // Nomor meja (legacy, replaced by table_id)
  notes          String?       @db.Text
  channel        OrderChannel  @default(DIRECT)
  pickupTime     DateTime?     // Jam ambil untuk pre-order
  printedAt      DateTime?     // Timestamp saat struk dicetak
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  items          OrderItem[]
  payment        Payment?

  // Indexes untuk query optimization
  @@index([session_id])
  @@index([table_id])
  @@index([status])
  @@index([payment_status])
  @@index([status, payment_status])
  @@index([printedAt])
  @@index([userId])
  @@index([createdAt])
  @@index([orderType])
  @@index([payment_method])
  @@index([channel])
  @@index([pickupTime])
}

enum OrderStatus {
  PENDING_PAYMENT  // Menunggu pembayaran customer
  PENDING          // (Legacy, sama dengan CONFIRMED)
  CONFIRMED        // Sudah bayar, diterima kasir
  PREPARING        // Sedang diproses
  IN_KITCHEN       // Di dapur (external kitchen)
  READY            // Siap disajikan
  COMPLETED        // Order selesai
  CANCELLED        // Order dibatalkan (stok dikembalikan)
}

enum PaymentStatus {
  UNPAID   // Belum bayar
  PENDING  // Menunggu konfirmasi gateway
  PAID     // Sudah bayar (confirmed)
  FAILED   // Pembayaran gagal
}

enum PaymentMethod {
  CASH  // Bayar tunai di kasir
  QRIS  // Bayar via QRIS (Midtrans Snap)
}

enum OrderType {
  DINE_IN   // Makan di tempat (perlu meja)
  TAKEAWAY  // Bawa pulang
}

enum OrderChannel {
  DIRECT     // Langsung via QR Code di restoran
  PREORDER   // Pre-order online via URL publik
  GOFOOD     // Future: Integrasi GoFood
  GRABFOOD   // Future: Integrasi GrabFood
  SHOPEEFOOD // Future: Integrasi ShopeeFood
}
```

**Order State Machine:**

```
[CUSTOMER SCAN QR]
      ↓
[ADD TO CART]
      ↓
[CHECKOUT]
      ↓
┌─────────────────────────────────────┐
│     PENDING_PAYMENT                 │
│  (Waiting for payment)              │
└─────────────────────────────────────┘
      │
      ├──[QRIS]──→ Customer scan QRIS ──→ Midtrans Webhook ──┐
      │                                                        │
      └──[CASH]──→ Customer to kasir ──→ Kasir confirm ──────┤
                                                               ↓
                                              ┌────────────────────────┐
                                              │      CONFIRMED         │
                                              │  (Payment confirmed)   │
                                              └────────────────────────┘
                                                        ↓
                                              [Kasir print struk]
                                                        ↓
                                              ┌────────────────────────┐
                                              │      PREPARING         │
                                              │  (Kitchen processing)  │
                                              └────────────────────────┘
                                                        ↓
                                              [Kitchen done]
                                                        ↓
                                              ┌────────────────────────┐
                                              │        READY           │
                                              │  (Ready to serve)      │
                                              └────────────────────────┘
                                                        ↓
                                              [Served to customer]
                                                        ↓
                                              ┌────────────────────────┐
                                              │      COMPLETED         │
                                              │  (Order finished)      │
                                              └────────────────────────┘
```

**Order Number Generation:**

```typescript
// Format: ORD-{seq}-0MBNK
// Sequential dari database, padded dengan 0
// Contoh: ORD-01-0MBNK, ORD-02-0MBNK, ORD-03-0MBNK, ...

const lastOrder = await prisma.order.findFirst({
  orderBy: { createdAt: 'desc' },
  select: { orderNumber: true }
})

let nextSeq = 1
if (lastOrder && lastOrder.orderNumber.startsWith('ORD-')) {
  const match = lastOrder.orderNumber.match(/ORD-(\d+)-0MBNK/)
  if (match) {
    nextSeq = parseInt(match[1], 10) + 1
  }
}

const orderNumber = `ORD-${nextSeq.toString().padStart(2, '0')}-0MBNK`
```

#### 4. **OrderItem** - Item dalam Order

```prisma
model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)  // Price snapshot saat order
  subtotal  Decimal  @db.Decimal(10, 2)  // price × quantity
  createdAt DateTime @default(now())

  @@index([orderId])
  @@index([productId])
}
```

**Catatan Penting:**
- Price di-snapshot saat order dibuat untuk menghindari perubahan harga produk mempengaruhi order lama
- Cascade delete: Jika order dihapus, semua item ikut terhapus

#### 5. **Payment** - Pembayaran

```prisma
model Payment {
  id            String        @id @default(cuid())
  orderId       String        @unique  // One-to-one dengan Order
  order         Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  method        PaymentMethod
  amount        Decimal       @db.Decimal(10, 2)
  status        PaymentStatus @default(PENDING)
  transactionId String?       @unique  // Midtrans order ID
  qris_string   String?       @db.Text // Midtrans Snap token
  expires_at    DateTime?     // Payment timeout (default: 10 menit)
  paidAt        DateTime?     // Timestamp saat payment confirmed
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```

**Payment Flow:**

**QRIS (Midtrans Snap):**
```
1. Customer pilih QRIS → Create order
2. Backend call Midtrans createSnapTransaction()
3. Get Snap token & redirect URL
4. Create payment record (status=PENDING, qris_string=token)
5. Schedule timeout (10 menit)
6. Customer redirect ke Snap payment page
7. Customer scan QRIS & pay
8. Midtrans send webhook → /api/payments/midtrans/notification
9. Verify signature → Update payment (status=PAID, paidAt=now)
10. Update order (payment_status=PAID, status=CONFIRMED)
11. Order masuk queue kasir
```

**CASH:**
```
1. Customer pilih CASH → Create order
2. Create payment record (status=PENDING)
3. Order masuk queue kasir dengan label "Tunggu konfirmasi kasir"
4. Customer datang ke kasir → Bayar tunai
5. Kasir klik "Confirm Payment" → PATCH /api/orders/{id}/confirm-payment
6. Update payment (status=PAID, paidAt=now)
7. Update order (payment_status=PAID, status=CONFIRMED)
8. Kasir bisa print struk
```

#### 6. **Table** - Manajemen Meja

```prisma
model Table {
  id        String      @id @default(cuid())
  name      String      @unique  // e.g., "Meja 1", "Meja 2", "TAKEAWAY"
  qr_token  String      @unique  // Token untuk validasi QR
  status    TableStatus @default(AVAILABLE)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  orders    Order[]
}

enum TableStatus {
  AVAILABLE  // Meja kosong
  OCCUPIED   // Meja sedang dipakai (ada order aktif)
}
```

**QR Code System:**

```typescript
// QR Code Format (Dine-In):
const qrData = {
  url: `${baseUrl}/menu?table=${table.id}&token=${table.qr_token}`,
  table_id: table.id,
  table_name: table.name,
  qr_token: table.qr_token
}

// QR Code Format (Takeaway):
const qrData = {
  url: `${baseUrl}/menu?takeaway=true&token=${takeawayTable.qr_token}`,
  takeaway: true,
  qr_token: takeawayTable.qr_token
}

// Validation Flow:
// 1. Customer scan QR → Extract table_id & qr_token dari URL
// 2. POST /api/tables/validate { tableId, qr_token }
// 3. Backend verify token match → Return table info
// 4. Frontend store di localStorage
```

#### 7. **StockHistory** - Riwayat Stok

```prisma
model StockHistory {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity    Int
  type        String   // 'IN' (masuk) atau 'OUT' (keluar)
  description String?  // e.g., "Order ORD-01-0MBNK" atau "Restok manual"
  createdAt   DateTime @default(now())

  @@index([productId])
  @@index([createdAt])
}
```

**Use Case:**
- Tracking semua perubahan stok produk
- Audit trail untuk inventory management
- Analisa pola penjualan produk

#### 8. **AuditLog** - Audit Trail

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  userId    String
  userRole  UserRole
  action    String   // 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'PERMISSION_DENIED'
  resource  String   // 'USER', 'PRODUCT', 'ORDER', 'ANALYTICS', 'SETTING'
  result    String   // 'SUCCESS', 'DENIED', 'FAILED'
  metadata  String?  @db.Text  // JSON string dengan additional context
  
  @@index([userId])
  @@index([userRole])
  @@index([action])
  @@index([resource])
  @@index([timestamp])
}
```

**Logging Example:**

```typescript
// lib/auditLog.ts
await logAudit({
  userId: user.id,
  userRole: user.role,
  action: 'CREATE',
  resource: 'PRODUCT',
  result: 'SUCCESS',
  metadata: JSON.stringify({
    productId: product.id,
    productName: product.name,
    price: product.price
  })
})

await logAudit({
  userId: user.id,
  userRole: 'KASIR',
  action: 'UPDATE',
  resource: 'USER',
  result: 'DENIED',
  metadata: JSON.stringify({
    reason: 'KASIR cannot modify users'
  })
})
```

#### 9. **SystemSetting** - Konfigurasi Sistem

```prisma
model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text  // JSON string
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Settings Keys:**

```typescript
// Restaurant Info
restaurant_name: "Resto Iga Bakar"
restaurant_logo: "https://cloudinary.com/logo.png"
restaurant_background: "https://cloudinary.com/bg.jpg"
operating_hours: { open: "11:00", close: "22:00" }
preorder_cutoff: "21:30"
preorder_min_minutes: 30

// Contact
restaurant_phone: "08123456789"
restaurant_address: "Jl. Example No. 123"
restaurant_email: "info@restoigabakar.com"

// Payment
payment_timeout_minutes: 10
midtrans_enabled: true
cash_enabled: true

// Features
preorder_enabled: true
whatsapp_notification_enabled: true
table_qr_enabled: true
```

#### 10. **CampaignBanner** - Banner Promosi

```prisma
model CampaignBanner {
  id        String   @id @default(cuid())
  title     String
  subtitle  String
  imageUrl  String
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Feature:**
- Hanya 1 banner bisa aktif
- Ditampilkan di halaman /menu sebagai hero banner
- Admin bisa create/edit/delete/activate banner



---

## 🎨 DESIGN SYSTEM

Project ini menggunakan **design system khusus** yang terinspirasi dari estetika kuliner high-end dengan filosofi: **"Let the food sizzle, the chrome must disappear"**.

Detail lengkap ada di `design.md`.

### Color Palette

```typescript
// Brand Colors (Neutral & Organic)
const colors = {
  // Primary
  ink: '#15110F',           // Smoked Black - primary text, CTA buttons
  canvas: '#FCFAF7',        // Clay Parchment - page background
  softCloud: '#F3EFE9',     // Warm Stone - card backgrounds
  
  // Text Hierarchy
  charcoal: '#3B3532',      // Burnt Charcoal - descriptions
  ash: '#5C5551',           // Low-emphasis text
  mute: '#8A8077',          // Subtitles, placeholders
  stone: '#A89E95',         // Secondary contrast text
  
  // Dividers
  hairline: '#D2C9BF',      // 1px borders & dividers
  hairlineSoft: '#EBE5DC',  // Soft shadows
  
  // Semantic Colors
  sale: '#C0392B',          // Fiery Sambal - errors, discounts
  saleDeep: '#8E1C10',      // Active error states
  success: '#2E7D32',       // Fresh Basil - success states
  successBright: '#4CAF50', // Active success on dark
  info: '#D35400',          // Ember Glow - highlights
  infoDeep: '#A04000',      // Pressed states
  
  // Culinary Accents (Optional)
  accentPink: '#D35400',    // Sweet & Spicy badge
  accentPinkDeep: '#922B21',// Extreme chili badge
  accentTeal: '#D4AC0D',    // Honey-glazed accent
}
```

### Typography

```typescript
// Font Families
const fonts = {
  display: 'Bebas Neue',      // Campaign headers only
  heading: 'Plus Jakarta Sans', // Section titles, tabs
  body: 'Inter',              // Body text, descriptions
}

// Type Scale
const typography = {
  displayCampaign: { size: '96px', weight: 700, lineHeight: 0.9, letterSpacing: '-1%' },
  headingXl: { size: '32px', weight: 700, lineHeight: 1.2 },
  headingLg: { size: '24px', weight: 700, lineHeight: 1.2 },
  headingMd: { size: '16px', weight: 600, lineHeight: 1.5 },
  bodyMd: { size: '16px', weight: 400, lineHeight: 1.6 },
  bodyStrong: { size: '16px', weight: 600, lineHeight: 1.5 },
  buttonLg: { size: '24px', weight: 600, lineHeight: 1.2 },
  buttonMd: { size: '16px', weight: 600, lineHeight: 1.5 },
  buttonSm: { size: '14px', weight: 600, lineHeight: 1.5 },
  captionMd: { size: '14px', weight: 500, lineHeight: 1.5 },
  captionSm: { size: '12px', weight: 600, lineHeight: 1.5 },
  utilityXs: { size: '9px', weight: 500, lineHeight: 1.5 },
}
```

### Spacing System (8px Base)

```typescript
const spacing = {
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '18px',
  xl: '24px',
  xxl: '30px',
  section: '48px+', // Section gaps
}
```

### Border Radius

```typescript
const rounded = {
  none: '0px',      // Product cards, headers, food photos
  md: '24px',       // Search inputs, table number pills
  lg: '30px',       // All main buttons, CTAs
  full: '9999px',   // Spiciness dots, icon buttons
}
```

### Component Patterns

#### Buttons

```tsx
// Primary CTA
<button className="
  bg-ink text-canvas
  px-8 py-4 rounded-full
  font-semibold tracking-wider uppercase
  hover:bg-charcoal transition-all
  active:scale-95
">
  Konfirmasi Order
</button>

// Secondary
<button className="
  bg-soft-cloud text-ink border border-hairline
  px-8 py-4 rounded-full
  font-semibold tracking-wider uppercase
  hover:bg-hairline-soft transition-all
">
  Kembali ke Menu
</button>

// On Image (Overlay)
<button className="
  bg-canvas text-ink
  px-6 py-3 rounded-full
  font-semibold
  shadow-lg
">
  Lihat Detail Menu
</button>
```

#### Cards

```tsx
// Product Card
<div className="
  bg-canvas border-0 rounded-none
  overflow-hidden
  hover:shadow-none
">
  {/* Square 1:1 image */}
  <div className="aspect-square bg-soft-cloud">
    <img src={product.image} className="w-full h-full object-cover" />
  </div>
  
  {/* Content (no padding on container) */}
  <div className="pt-4 pb-2">
    <span className="text-xs text-mute uppercase tracking-widest">
      {product.category}
    </span>
    <h3 className="text-base font-bold text-ink font-jakarta">
      {product.name}
    </h3>
    <p className="text-xs text-charcoal line-clamp-2">
      {product.description}
    </p>
    <p className="text-base font-extrabold text-ink">
      Rp {product.price.toLocaleString('id-ID')}
    </p>
  </div>
</div>

// Dashboard Card
<div className="bg-soft-cloud border border-hairline p-6 rounded-none">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-3xl font-bold text-ink">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-mute">
        {label}
      </p>
    </div>
    <div className="w-9 h-9 bg-canvas border border-hairline rounded-none">
      <Icon size={16} className="text-ink" />
    </div>
  </div>
</div>
```

#### Inputs

```tsx
// Text Input
<input
  type="text"
  className="
    w-full rounded-full
    border border-hairline bg-canvas
    text-ink px-4 py-3
    focus:outline-none focus:ring-1 focus:ring-ink
    transition-all
  "
  placeholder="Masukkan nama Anda"
/>

// Search Pill
<input
  type="search"
  className="
    w-full rounded-full
    bg-soft-cloud border-0
    text-ink px-4 py-2.5
    focus:bg-canvas focus:ring-2 focus:ring-ink
    transition-all
  "
  placeholder="Cari menu..."
/>
```

#### Status Badges

```tsx
// Order Status
const statusStyles = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-800 border-blue-200',
  PREPARING: 'bg-purple-50 text-purple-800 border-purple-200',
  READY: 'bg-green-50 text-green-800 border-green-200',
  COMPLETED: 'bg-soft-cloud text-ink border-hairline',
  CANCELLED: 'bg-sale/10 text-sale border-sale',
}

<span className={`
  inline-flex items-center gap-1
  px-2.5 py-0.5 rounded-full
  text-xs font-bold uppercase tracking-wider
  border ${statusStyles[status]}
`}>
  <span className="w-1.5 h-1.5 rounded-full bg-current" />
  {status}
</span>
```

### Layout Principles

1. **Flat Design** - No drop shadows, no elevation
2. **High Contrast** - Food photography on warm stone backgrounds
3. **Minimal Chrome** - UI elements stay neutral, food gets all the color
4. **Pill Geometry** - All interactive elements use rounded-full (30px)
5. **8px Grid** - All spacing follows 8px rhythm

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### JWT Authentication

```typescript
// lib/auth.ts

// 1. Hash Password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10) // 10 salt rounds
}

// 2. Verify Password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// 3. Sign JWT Token
export async function signToken(payload: JWTPayload): Promise<string> {
  const secret = process.env.JWT_SECRET || 'your-secret-key'
  const encodedKey = new TextEncoder().encode(secret)
  
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days expiration
    .sign(encodedKey)
}

// 4. Verify JWT Token
export async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = process.env.JWT_SECRET || 'your-secret-key'
  const encodedKey = new TextEncoder().encode(secret)
  
  const { payload } = await jwtVerify(token, encodedKey)
  return payload as JWTPayload
}

// 5. Get Current User (with Role Cache)
const roleCache = new Map<string, { role: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getCurrentUser(token: string) {
  const payload = await verifyToken(token)
  
  // Check cache first
  const cached = roleCache.get(payload.userId)
  const now = Date.now()
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: cached.role,
    }
  }
  
  // Cache miss - fetch from database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true },
  })
  
  // Update cache
  if (user) {
    roleCache.set(user.id, { role: user.role, timestamp: now })
  }
  
  return user
}
```

### Login Flow

```typescript
// app/api/auth/login/route.ts

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  
  // 1. Validate input
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email dan password harus diisi' },
      { status: 400 }
    )
  }
  
  // 2. Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  
  if (!user) {
    return NextResponse.json(
      { error: 'Email atau password salah' },
      { status: 401 }
    )
  }
  
  // 3. Verify password
  const isValid = await verifyPassword(password, user.password)
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Email atau password salah' },
      { status: 401 }
    )
  }
  
  // 4. Generate JWT token
  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
  
  // 5. Set httpOnly cookie
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
  
  const isProduction = process.env.NODE_ENV === 'production'
  
  response.cookies.set('token', token, {
    httpOnly: true,         // Cannot be accessed by JavaScript
    secure: isProduction,   // HTTPS only in production
    sameSite: 'lax',        // CSRF protection
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  
  return response
}
```

### Middleware Protection

```typescript
// middleware.ts

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const pathname = request.nextUrl.pathname

  // ===== PUBLIC ROUTES =====
  
  // Customer routes (no auth needed)
  const customerRoutes = ['/menu', '/checkout', '/payment', '/cart']
  const isCustomerRoute = customerRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Other public routes
  const publicRoutes = ['/login', '/']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // Public API routes
  const publicApiRoutes = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/products',    // Product listing is public
    '/api/orders',      // Guest can create orders
    '/api/payments',    // Guest can make payments
    '/api/tables/validate',
    '/api/settings',
  ]
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Allow public routes
  if (isCustomerRoute || isPublicRoute || isPublicApiRoute) {
    return NextResponse.next()
  }
  
  // ===== PROTECTED ROUTES =====
  
  // Redirect to login if no token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  try {
    const payload = await verifyToken(token)
    const userRole = payload.role
    
    // OWNER routes — only OWNER
    if (pathname.startsWith('/owner')) {
      if (userRole !== 'OWNER') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.next()
    }
    
    // ADMIN routes — only ADMIN (OWNER redirected to /owner)
    if (pathname.startsWith('/admin')) {
      if (userRole === 'OWNER') {
        return NextResponse.redirect(new URL('/owner', request.url))
      }
      if (userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.next()
    }
    
    // KASIR routes — only KASIR and ADMIN
    if (pathname.startsWith('/kasir')) {
      if (userRole === 'OWNER') {
        return NextResponse.redirect(new URL('/owner', request.url))
      }
      if (userRole !== 'KASIR' && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.next()
    }
    
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|ico|css|js|html)$).*)',
  ],
}
```

### Role-Based Permissions

```typescript
// lib/permissions.ts

export const PERMISSIONS = {
  OWNER: {
    dashboard: ['read'],
    analytics: ['read', 'export'],
    reports: ['read', 'download'],
    products: ['read'],
    orders: ['read'],
    users: ['read'],
    qr: [],  // Cannot generate QR
    financial: ['read'],
    ownerAccounts: ['create', 'read', 'update', 'delete'], // Only OWNER can manage OWNER accounts
  },
  
  ADMIN: {
    dashboard: ['read', 'write'],
    analytics: ['read', 'export_limited'],
    reports: ['read', 'download_operational'],
    products: ['create', 'read', 'update', 'delete'],
    orders: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'], // Cannot manage OWNER accounts
    qr: ['generate'],
    financial: ['read_limited'],
    ownerAccounts: [],  // No access to OWNER accounts
  },
  
  KASIR: {
    orders: ['create', 'read', 'update_status'],
    products: ['read'],
  },
} as const

// Permission check functions
export function hasReadAccess(role: UserRole, resource: string): boolean {
  if (role === 'OWNER') return true
  if (role === 'ADMIN') return !resource.startsWith('/owner')
  if (role === 'KASIR') {
    const kasirReadResources = ['/orders', '/products', '/api/orders', '/api/products']
    return kasirReadResources.some(r => resource.startsWith(r))
  }
  return false
}

export function hasWriteAccess(role: UserRole, resource: string): boolean {
  // OWNER has NO write access (view-only)
  if (role === 'OWNER') {
    // Exception: OWNER can create other OWNER accounts
    if (resource === '/api/owner/users' || resource === '/owner/users') {
      return true
    }
    return false
  }
  
  // ADMIN has write access except for OWNER accounts
  if (role === 'ADMIN') {
    if (resource.includes('/owner') || resource.includes('role=OWNER')) {
      return false
    }
    return true
  }
  
  // KASIR has limited write access
  if (role === 'KASIR') {
    const kasirWriteResources = ['/orders', '/api/orders']
    return kasirWriteResources.some(r => resource.startsWith(r))
  }
  
  return false
}

export function hasDeleteAccess(role: UserRole, resource: string): boolean {
  // OWNER has NO delete access
  if (role === 'OWNER') return false
  
  // ADMIN has delete access except for OWNER accounts
  if (role === 'ADMIN') {
    if (resource.includes('/owner') || resource.includes('role=OWNER')) {
      return false
    }
    return true
  }
  
  // KASIR has no delete access
  return false
}
```

### API Permission Middleware

```typescript
// lib/apiPermissions.ts

export async function withApiPermission(
  request: NextRequest,
  options: {
    allowedRoles: UserRole[]
    requireWrite?: boolean
    resource?: string
  }
) {
  const token = request.cookies.get('token')?.value
  
  if (!token) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      user: null,
    }
  }
  
  const user = await getCurrentUser(token)
  
  if (!user) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      user: null,
    }
  }
  
  // Check role
  if (!options.allowedRoles.includes(user.role as UserRole)) {
    // Log permission denial
    await logAudit({
      userId: user.id,
      userRole: user.role as UserRole,
      action: 'ACCESS',
      resource: options.resource || 'UNKNOWN',
      result: 'DENIED',
      metadata: { reason: 'Role not allowed' },
    })
    
    return {
      response: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
      user: null,
    }
  }
  
  // Check write permission
  if (options.requireWrite) {
    if (!hasWriteAccess(user.role as UserRole, options.resource || '')) {
      await logAudit({
        userId: user.id,
        userRole: user.role as UserRole,
        action: 'WRITE',
        resource: options.resource || 'UNKNOWN',
        result: 'DENIED',
        metadata: { reason: 'No write permission' },
      })
      
      return {
        response: NextResponse.json(
          { error: 'Forbidden - No write permission' },
          { status: 403 }
        ),
        user: null,
      }
    }
  }
  
  return { response: null, user }
}

// Usage in API routes
export async function POST(request: NextRequest) {
  const { response, user } = await withApiPermission(request, {
    allowedRoles: ['ADMIN'],
    requireWrite: true,
    resource: 'PRODUCT',
  })
  
  if (response) return response // Permission denied
  
  // Continue with actual logic
  // ...
}
```

### Permission Matrix

| Resource | OWNER | ADMIN | KASIR |
|----------|-------|-------|-------|
| **Dashboard** | ✅ Read | ✅ Full | ❌ |
| **Products** | ✅ Read | ✅ CRUD | ✅ Read |
| **Orders** | ✅ Read | ✅ CRUD | ✅ Read, Update Status |
| **Users** | ✅ Read<br>✅ CRUD OWNER accounts | ✅ CRUD (except OWNER) | ❌ |
| **Analytics** | ✅ Read, Export | ✅ Read, Export Limited | ❌ |
| **Reports** | ✅ Download All | ✅ Download Operational | ❌ |
| **Financial** | ✅ Full Access | ✅ Limited | ❌ |
| **QR Generator** | ❌ | ✅ Generate | ❌ |
| **Settings** | ✅ Read | ✅ Full | ❌ |
| **Audit Logs** | ✅ Read All | ✅ Read Own | ❌ |



---

## 🚀 FITUR UTAMA & BUSINESS LOGIC

### 1. QR CODE TABLE SYSTEM

#### Dine-In QR Code Flow

```typescript
// Step 1: Admin Generate QR Code
// URL: /admin/qr-generator

const table = await prisma.table.create({
  data: {
    name: "Meja 5",
    qr_token: crypto.randomUUID(),
    status: 'AVAILABLE'
  }
})

const qrData = `${baseUrl}/menu?table=${table.id}&token=${table.qr_token}`

// Generate QR dengan qrcode.react
<QRCodeSVG value={qrData} size={256} />

// Step 2: Customer Scan QR
// Redirect to: /menu?table=xxx&token=yyy

// Step 3: Validate Table
// POST /api/tables/validate

const validationResult = await validateTable(tableId, qr_token)

if (!validationResult.valid) {
  return { error: 'QR Code tidak valid' }
}

// Step 4: Store di localStorage
localStorage.setItem('table_id', table.id)
localStorage.setItem('tableNumber', table.name)
localStorage.setItem('qr_token', qr_token)
localStorage.setItem('orderType', 'DINE_IN')

// Step 5: Customer Order
// Checkout akan auto-fill tableNumber

// Step 6: Create Order
const order = await prisma.order.create({
  data: {
    table_id: table.id,
    tableNumber: table.name,
    orderType: 'DINE_IN',
    // ... other fields
  }
})

// Step 7: Update Table Status
await prisma.table.update({
  where: { id: table.id },
  data: { status: 'OCCUPIED' }
})
```

#### Takeaway QR Code Flow

```typescript
// Step 1: Admin Generate Takeaway QR
// Special table dengan name = "TAKEAWAY"

const takeawayTable = await prisma.table.findFirst({
  where: { name: 'TAKEAWAY' }
})

const qrData = `${baseUrl}/menu?takeaway=true&token=${takeawayTable.qr_token}`

// Step 2: Customer Scan Takeaway QR
// Redirect to: /menu?takeaway=true&token=zzz

// Step 3: Validate Takeaway
// POST /api/tables/validate { tableId: 'TAKEAWAY_MARKER', qr_token, isTakeaway: true }

// Step 4: Store di localStorage (NO TABLE DATA!)
localStorage.setItem('orderType', 'TAKEAWAY')
localStorage.setItem('qr_token', qr_token)
localStorage.removeItem('tableNumber')  // CRITICAL
localStorage.removeItem('table_id')     // CRITICAL
localStorage.removeItem('channel')

// Step 5: Checkout
// No table number field shown
// Order created dengan table_id = null
```

#### Pre-Order Public URL Flow

```typescript
// Step 1: Share Public URL
const publicUrl = `${baseUrl}/menu?mode=preorder`

// Step 2: Customer Access (No QR needed)
// localStorage setup
localStorage.setItem('orderType', 'TAKEAWAY')
localStorage.setItem('channel', 'PREORDER')
localStorage.removeItem('tableNumber')
localStorage.removeItem('table_id')
localStorage.removeItem('qr_token')

// Step 3: Checkout Form (Extended)
// Required fields:
// - customerName
// - customerPhone (for WhatsApp notification)
// - pickupTime (dropdown: 11:00-22:00, min 30 minutes from now)

// Step 4: Validation
// - Jam pengambilan >= now + 30 minutes
// - Jam pengambilan: 11:00 - 22:00 WIB
// - Cutoff: 21:30 WIB (last order time)

const now = new Date()
const pickup = new Date(pickupTime)
const diffMinutes = (pickup - now) / 60000

if (now.getHours() >= 21 && now.getMinutes() > 30) {
  throw new Error('Restoran sudah close order untuk hari ini')
}

if (diffMinutes < 30) {
  throw new Error('Jam pengambilan minimal 30 menit dari sekarang')
}

if (pickup.getHours() < 11 || pickup.getHours() >= 22) {
  throw new Error('Jam pengambilan harus antara 11:00 – 22:00 WIB')
}

// Step 5: Create Order
const order = await prisma.order.create({
  data: {
    channel: 'PREORDER',
    orderType: 'TAKEAWAY',
    customerName,
    customerPhone,
    pickupTime,
    payment_method: 'QRIS', // Pre-order MUST use QRIS
    // ...
  }
})

// Step 6: WhatsApp Notification (when order ready)
await sendWhatsAppNotification(
  customerPhone,
  order.orderNumber,
  format(order.pickupTime, 'HH:mm')
)
```

### 2. ORDER MANAGEMENT

#### Create Order Flow

```typescript
// POST /api/orders

export async function POST(request: NextRequest) {
  const {
    items,
    orderType,
    tableNumber,
    notes,
    customerName,
    customerPhone,
    pickupTime,
    channel,
    session_id,
    table_id,
    payment_method
  } = await request.json()

  // 1. Validation
  if (!items || items.length === 0) {
    throw new OrderValidationError('Items are required')
  }

  if (orderType === 'DINE_IN' && !table_id && !tableNumber) {
    throw new OrderValidationError('Nomor meja wajib diisi untuk Dine-in')
  }

  if (!customerName) {
    throw new OrderValidationError('Nama customer wajib diisi')
  }

  // 2. Validate Table (if DINE_IN with table_id)
  if (orderType === 'DINE_IN' && table_id) {
    const { validateTableAvailability } = await import('@/lib/tableValidation')
    const qr_token = body.qr_token
    
    const tableValidation = await validateTableAvailability(table_id, qr_token)
    
    if (!tableValidation.valid) {
      throw new OrderValidationError(tableValidation.error)
    }
  }

  // 3. Calculate Total & Validate Stock
  let totalAmount = 0
  const orderItems = []

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    })

    if (!product || !product.isActive) {
      throw new OrderValidationError(`Product ${item.productId} not available`)
    }

    if (product.stock < item.quantity) {
      throw new OrderValidationError(`Stok tidak cukup untuk ${product.name}`)
    }

    const subtotal = product.price.toNumber() * item.quantity
    totalAmount += subtotal

    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      subtotal: new Prisma.Decimal(subtotal),
    })
  }

  // 4. Generate Order Number
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true }
  })
  
  let nextSeq = 1
  if (lastOrder && lastOrder.orderNumber.startsWith('ORD-')) {
    const match = lastOrder.orderNumber.match(/ORD-(\d+)-0MBNK/)
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1
    }
  }

  const orderNumber = `ORD-${nextSeq.toString().padStart(2, '0')}-0MBNK`

  // 5. Determine Status
  let orderStatus = 'PENDING_PAYMENT'
  let paymentStatus = 'UNPAID'

  // 6. Create Order with Items
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: null, // Guest order
      session_id: session_id || null,
      table_id: orderType === 'DINE_IN' ? table_id : null,
      customerName,
      customerPhone,
      totalAmount: new Prisma.Decimal(totalAmount),
      status: orderStatus,
      payment_status: paymentStatus,
      payment_method,
      orderType,
      tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
      notes,
      channel: channel || 'DIRECT',
      pickupTime: pickupTime ? new Date(pickupTime) : null,
      items: {
        create: orderItems,
      },
    },
    include: {
      items: { include: { product: true } },
      table: true,
    },
  })

  // 7. Deduct Stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })

    await prisma.stockHistory.create({
      data: {
        productId: item.productId,
        quantity: item.quantity,
        type: 'OUT',
        description: `Order ${orderNumber}`,
      },
    })
  }

  // 8. Update Table Status (if DINE_IN)
  if (orderType === 'DINE_IN' && table_id) {
    await prisma.table.update({
      where: { id: table_id },
      data: { status: 'OCCUPIED' }
    })
  }

  // 9. Create Midtrans Snap (if QRIS)
  let snapData = null
  if (payment_method === 'QRIS') {
    const { createSnapTransaction } = await import('@/lib/midtrans')

    const gatewayOrderId = `PAY-${order.id}-${Date.now()}`

    const itemDetails = orderItems.map((item, index) => ({
      id: items[index].productId,
      price: Math.round(item.price.toNumber()),
      quantity: item.quantity,
      name: order.items[index]?.product?.name.substring(0, 50) || `Item ${index + 1}`,
    }))

    const snapResponse = await createSnapTransaction({
      orderId: order.id,
      gatewayOrderId,
      grossAmount: Math.round(totalAmount),
      customerDetails: {
        first_name: customerName.substring(0, 50),
        ...(customerPhone ? { phone: customerPhone } : {}),
      },
      itemDetails,
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'QRIS',
        amount: new Prisma.Decimal(totalAmount),
        status: 'PENDING',
        transactionId: gatewayOrderId,
        qris_string: snapResponse.token,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      }
    })

    snapData = {
      token: snapResponse.token,
      redirectUrl: snapResponse.redirectUrl,
      gatewayOrderId,
    }

    // Schedule payment timeout
    const { schedulePaymentTimeout } = await import('@/lib/paymentTimeout')
    schedulePaymentTimeout(order.id)
  }

  // 10. Emit Real-Time Event
  orderEventEmitter.emit('orderCreate', { id: order.id, orderNumber })

  // 11. Return Response
  return NextResponse.json({
    ...order,
    totalAmount: order.totalAmount.toNumber(),
    items: order.items.map(item => ({
      ...item,
      price: item.price.toNumber(),
      subtotal: item.subtotal.toNumber(),
    })),
    qris: snapData
  }, { status: 201 })
}
```

#### Update Order Status Flow

```typescript
// PATCH /api/orders/[id]/status

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status } = await request.json()

  // Validate status
  const validStatuses = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'IN_KITCHEN',
    'READY',
    'COMPLETED',
    'CANCELLED'
  ]

  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status' },
      { status: 400 }
    )
  }

  // Get current order
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, table: true }
  })

  if (!order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    )
  }

  // Handle CANCELLED status (restore stock)
  if (status === 'CANCELLED') {
    for (const item of order.items) {
      // Restore stock
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      })

      // Log stock history
      await prisma.stockHistory.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'IN',
          description: `Order ${order.orderNumber} cancelled`
        }
      })
    }

    // Free table if DINE_IN
    if (order.table_id) {
      await prisma.table.update({
        where: { id: order.table_id },
        data: { status: 'AVAILABLE' }
      })
    }
  }

  // Handle COMPLETED status (free table)
  if (status === 'COMPLETED' && order.table_id) {
    await prisma.table.update({
      where: { id: order.table_id },
      data: { status: 'AVAILABLE' }
    })
  }

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: params.id },
    data: { status },
    include: {
      items: { include: { product: true } },
      payment: true,
      table: true
    }
  })

  // Emit real-time event
  orderEventEmitter.emit('orderUpdate', {
    id: updatedOrder.id,
    status: updatedOrder.status
  })

  // Send WhatsApp notification (if pre-order and READY)
  if (
    status === 'READY' &&
    order.channel === 'PREORDER' &&
    order.customerPhone
  ) {
    const { sendWhatsAppNotification } = await import('@/lib/whatsapp')
    
    await sendWhatsAppNotification(
      order.customerPhone,
      order.orderNumber,
      order.pickupTime ? format(order.pickupTime, 'HH:mm') : 'segera'
    )
  }

  return NextResponse.json(updatedOrder)
}
```

#### Confirm Cash Payment Flow

```typescript
// PATCH /api/orders/[id]/confirm-payment
// Only for CASH payment method

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { payment: true }
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.payment_method !== 'CASH') {
    return NextResponse.json(
      { error: 'This endpoint is only for CASH payment' },
      { status: 400 }
    )
  }

  if (order.payment_status === 'PAID') {
    return NextResponse.json(
      { error: 'Payment already confirmed' },
      { status: 400 }
    )
  }

  // Update payment
  await prisma.payment.update({
    where: { orderId: order.id },
    data: {
      status: 'PAID',
      paidAt: new Date()
    }
  })

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      payment_status: 'PAID',
      status: 'CONFIRMED'
    }
  })

  // Emit event
  orderEventEmitter.emit('orderUpdate', {
    id: updatedOrder.id,
    status: 'CONFIRMED'
  })

  return NextResponse.json({ success: true })
}
```

### 3. PAYMENT INTEGRATION (Midtrans Snap)

#### Create Snap Transaction

```typescript
// lib/midtrans.ts

export async function createSnapTransaction({
  orderId,
  gatewayOrderId,
  grossAmount,
  customerDetails,
  itemDetails,
}: SnapTransactionParams) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  
  const baseUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

  const authString = Buffer.from(serverKey + ':').toString('base64')

  const payload = {
    transaction_details: {
      order_id: gatewayOrderId,
      gross_amount: grossAmount,
    },
    customer_details: customerDetails,
    item_details: itemDetails,
    credit_card: {
      secure: true,
    },
    enabled_payments: ['qris'], // Only QRIS
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/${orderId}?status=success`,
    },
  }

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authString}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Midtrans API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()

  return {
    token: data.token,
    redirectUrl: data.redirect_url,
  }
}
```

#### Webhook Handler

```typescript
// app/api/payments/midtrans/notification/route.ts

export async function POST(request: NextRequest) {
  const body = await request.json()

  const {
    order_id,
    transaction_status,
    fraud_status,
    signature_key,
  } = body

  // Verify signature
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  const expectedSignature = crypto
    .createHash('sha512')
    .update(order_id + transaction_status + grossAmount + serverKey)
    .digest('hex')

  if (signature_key !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // Find payment by transactionId (order_id from Midtrans)
  const payment = await prisma.payment.findUnique({
    where: { transactionId: order_id },
    include: { order: true }
  })

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  // Handle transaction status
  if (transaction_status === 'capture' || transaction_status === 'settlement') {
    if (fraud_status === 'accept' || !fraud_status) {
      // Payment success
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })

      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          payment_status: 'PAID',
          status: 'CONFIRMED'
        }
      })

      // Emit event
      orderEventEmitter.emit('orderUpdate', {
        id: payment.orderId,
        status: 'CONFIRMED'
      })
    }
  } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
    // Payment failed
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' }
    })

    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        payment_status: 'FAILED',
        status: 'CANCELLED'
      }
    })

    // Restore stock
    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: { items: true }
    })

    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      })

      await prisma.stockHistory.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'IN',
          description: `Order ${order.orderNumber} payment failed`
        }
      })
    }
  }

  return NextResponse.json({ status: 'OK' })
}
```

#### Payment Timeout

```typescript
// lib/paymentTimeout.ts

const timeoutMinutes = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '10')

export function schedulePaymentTimeout(orderId: string) {
  setTimeout(async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, items: true }
    })

    // If still unpaid, cancel order
    if (order && order.payment_status === 'UNPAID') {
      console.log(`Payment timeout for order ${order.orderNumber}`)

      // Update order & payment
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          payment_status: 'FAILED'
        }
      })

      if (order.payment) {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { status: 'FAILED' }
        })
      }

      // Restore stock
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        })

        await prisma.stockHistory.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: 'IN',
            description: `Order ${order.orderNumber} timeout`
          }
        })
      }

      // Free table
      if (order.table_id) {
        await prisma.table.update({
          where: { id: order.table_id },
          data: { status: 'AVAILABLE' }
        })
      }
    }
  }, timeoutMinutes * 60 * 1000)
}
```

### 4. REAL-TIME UPDATES (SSE + Polling)

```typescript
// app/api/orders/stream/route.ts

// Server-Sent Events for real-time order updates

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to order events
      const handleOrderCreate = (data: any) => {
        const message = `event: orderCreate\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      const handleOrderUpdate = (data: any) => {
        const message = `event: orderUpdate\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      orderEventEmitter.on('orderCreate', handleOrderCreate)
      orderEventEmitter.on('orderUpdate', handleOrderUpdate)

      // Keep-alive ping every 30 seconds
      const intervalId = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'))
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        orderEventEmitter.off('orderCreate', handleOrderCreate)
        orderEventEmitter.off('orderUpdate', handleOrderUpdate)
        clearInterval(intervalId)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// lib/orderEvents.ts

import { EventEmitter } from 'events'

class OrderEventEmitter extends EventEmitter {}

export const orderEventEmitter = new OrderEventEmitter()

// Usage in API routes
orderEventEmitter.emit('orderCreate', { id: order.id, orderNumber })
orderEventEmitter.emit('orderUpdate', { id: order.id, status })
```

**Frontend SSE + Polling:**

```typescript
// app/kasir/page.tsx

useEffect(() => {
  // Establish SSE connection
  const eventSource = new EventSource('/api/orders/stream')

  const handleUpdate = () => {
    fetchIncomingOrders()
    fetchHistoryOrders()
  }

  eventSource.addEventListener('orderUpdate', handleUpdate)
  eventSource.addEventListener('orderCreate', handleUpdate)

  eventSource.onerror = (err) => {
    console.warn('SSE connection error:', err)
  }

  // Fallback polling every 4 seconds
  // Guarantees real-time updates even if SSE fails
  const pollInterval = setInterval(() => {
    fetchIncomingOrders()
    fetchHistoryOrders()
  }, 4000)

  return () => {
    eventSource.close()
    clearInterval(pollInterval)
  }
}, [])
```



### 5. STOCK MANAGEMENT & ANALYTICS

#### Dashboard Stats (Real-Time with SWR)

```typescript
// lib/hooks/useAdminStats.ts

export function useAdminStats(period: 'today' | 'weekly' | 'monthly') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/analytics?period=${period}`,
    fetcher,
    { refreshInterval: 30000 } // Auto-refresh setiap 30 detik
  )
  
  return {
    chartData: data?.dailyRevenue || [],
    stats: {
      totalRevenue: data?.totalRevenue || 0,
      totalOrders: data?.totalOrders || 0,
      averageOrderValue: data?.averageOrderValue || 0,
      lowStockProducts: data?.lowStockProducts || [],
      topProducts: data?.topProducts || []
    },
    isLoading,
    isError: error,
    mutate
  }
}

// app/admin/page.tsx

const { chartData, stats, isLoading, mutate } = useAdminStats('monthly')

// Manual refresh button
<button onClick={() => mutate()}>
  Refresh Data
</button>
```

#### Sales Report PDF Generation

```typescript
// lib/generateSalesReportPDF.ts

export function generateSalesReportPDF(report: SalesReport) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('LAPORAN PENJUALAN', 105, 20, { align: 'center' })
  
  // Period
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Periode: ${formatDate(report.period.startDate)} - ${formatDate(report.period.endDate)}`,
    20, 35
  )
  
  // Summary
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RINGKASAN', 20, 50)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Revenue: Rp ${report.totalRevenue.toLocaleString('id-ID')}`, 20, 60)
  doc.text(`Total Produk Terjual: ${report.totalProductsSold}`, 20, 68)
  doc.text(`Revenue CASH: Rp ${report.revenueByMethod.CASH.toLocaleString('id-ID')}`, 20, 76)
  doc.text(`Revenue QRIS: Rp ${report.revenueByMethod.QRIS.toLocaleString('id-ID')}`, 20, 84)
  
  // Table: Product Sales
  autoTable(doc, {
    head: [['Produk', 'Qty Terjual', 'Revenue']],
    body: report.productSales.map(p => [
      p.productName,
      p.quantitySold.toString(),
      `Rp ${p.totalRevenue.toLocaleString('id-ID')}`
    ]),
    startY: 95,
    theme: 'grid',
    headStyles: {
      fillColor: [21, 17, 15],
      textColor: [252, 250, 247],
      fontStyle: 'bold'
    }
  })
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || 95
  doc.setFontSize(10)
  doc.text(`Digenerate pada: ${new Date().toLocaleString('id-ID')}`, 20, finalY + 15)
  
  // Save
  doc.save(`Laporan-Penjualan-${formatDate(new Date())}.pdf`)
}
```

---

## 🔥 FITUR KHUSUS & OPTIMISASI

### 1. Guest Checkout (No Login Required)

Customer tidak perlu membuat akun untuk order:

```typescript
// Generate session_id untuk tracking guest
const sessionId = localStorage.getItem('session_id') || crypto.randomUUID()
localStorage.setItem('session_id', sessionId)

// Order disimpan dengan userId = null
const order = await prisma.order.create({
  data: {
    userId: null,
    session_id: sessionId,
    customerName: 'John Doe',
    // ...
  }
})

// Multiple orders dari guest yang sama di-track via session_id
const guestOrders = await prisma.order.findMany({
  where: { session_id: sessionId }
})
```

### 2. Image Upload (Cloudinary)

```typescript
// components/admin/ProductForm.tsx

import { CldUploadWidget } from 'next-cloudinary'

<CldUploadWidget
  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
  options={{
    maxFiles: 1,
    resourceType: 'image',
    folder: 'resto-iga-bakar/products'
  }}
  onSuccess={(result) => {
    if (typeof result.info === 'object') {
      setImage(result.info.secure_url)
    }
  }}
>
  {({ open }) => (
    <button type="button" onClick={() => open()}>
      Upload Image
    </button>
  )}
</CldUploadWidget>
```

**Environment Setup:**

```env
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_UPLOAD_PRESET="your_upload_preset"
```

### 3. WhatsApp Notification

```typescript
// lib/whatsapp.ts

export async function sendWhatsAppNotification(
  phone: string,
  orderNumber: string,
  pickupTime: string
) {
  const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID
  const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN
  
  // Format phone: remove leading 0, add 62
  const formattedPhone = phone.startsWith('0')
    ? '62' + phone.slice(1)
    : phone
  
  const message = `
🔔 *Pesanan Anda Siap!*

Order: #${orderNumber}
Jam Pengambilan: ${pickupTime}

Silakan ambil di Resto Iga Bakar.
Terima kasih! 🙏
  `.trim()
  
  const response = await fetch(
    `https://graph.facebook.com/v17.0/${WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      })
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp API error:', error)
    throw new Error('Failed to send WhatsApp notification')
  }
  
  return await response.json()
}
```

**Setup WhatsApp Business API:**

1. Buat akun di [Meta for Developers](https://developers.facebook.com/)
2. Create App → Select Business → WhatsApp
3. Get Phone Number ID & Access Token
4. Add to `.env`

### 4. Receipt Printing

```typescript
// components/kasir/ReceiptPrinter.tsx

export function printReceipt(order: Order, onSuccess: () => void) {
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Struk #${order.orderNumber}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            width: 300px;
            margin: 0 auto;
            padding: 10px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; }
          .item-name { text-align: left; }
          .item-price { text-align: right; }
        </style>
      </head>
      <body>
        <div class="center">
          <h2>RESTO IGA BAKAR</h2>
          <p>Jl. Example No. 123</p>
          <p>Telp: 08123456789</p>
        </div>
        
        <div class="line"></div>
        
        <div class="center">
          <p class="bold">Order: #${order.orderNumber}</p>
          <p>${new Date().toLocaleString('id-ID')}</p>
          ${order.tableNumber ? `<p>Meja: ${order.tableNumber}</p>` : ''}
          ${order.orderType === 'TAKEAWAY' ? '<p>TAKEAWAY</p>' : ''}
        </div>
        
        <div class="line"></div>
        
        <table>
          ${order.items.map(item => `
            <tr>
              <td class="item-name">
                ${item.product.name} x${item.quantity}
              </td>
              <td class="item-price">
                ${(item.price * item.quantity).toLocaleString('id-ID')}
              </td>
            </tr>
          `).join('')}
        </table>
        
        <div class="line"></div>
        
        <table>
          <tr>
            <td class="item-name bold">TOTAL</td>
            <td class="item-price bold">
              Rp ${order.totalAmount.toLocaleString('id-ID')}
            </td>
          </tr>
          <tr>
            <td class="item-name">Bayar via</td>
            <td class="item-price">${order.payment_method}</td>
          </tr>
        </table>
        
        <div class="line"></div>
        
        <div class="center">
          <p>Terima kasih atas kunjungan Anda!</p>
          <p>Selamat menikmati</p>
        </div>
      </body>
    </html>
  `
  
  // Open print window
  const printWindow = window.open('', '', 'width=400,height=600')
  
  if (printWindow) {
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
      
      // Mark as printed in database
      fetch(`/api/orders/${order.id}/print`, { method: 'POST' })
        .then(() => onSuccess())
        .catch(console.error)
    }
  }
}
```

---

## 📊 USER FLOWS DIAGRAM

### Flow 1: Dine-In Order (Table QR)

```
[Customer]
   │
   ├─ Scan QR Code Meja 5
   │    └─ URL: /menu?table=xxx&token=yyy
   │
   ├─ Validate Table
   │    └─ POST /api/tables/validate
   │         └─ localStorage: table_id, tableNumber, qr_token, orderType=DINE_IN
   │
   ├─ Browse Menu & Add to Cart
   │    └─ localStorage: cart = [items]
   │
   ├─ Checkout
   │    └─ Auto-fill: Table Number = "Meja 5"
   │    └─ Fill: Customer Name
   │    └─ Choose Payment: CASH / QRIS
   │
   ├─ Create Order
   │    └─ POST /api/orders
   │         ├─ Stock deducted
   │         ├─ Table status = OCCUPIED
   │         └─ status = PENDING_PAYMENT
   │
   ├─ Payment
   │    ├─ [QRIS] → Midtrans Snap → Customer scan → Webhook → status=CONFIRMED
   │    └─ [CASH] → Customer ke kasir → Kasir confirm → status=CONFIRMED
   │
   ├─ Order masuk Queue Kasir
   │
   ├─ Kasir Print Struk → Kitchen
   │
   ├─ Status Updates
   │    └─ CONFIRMED → PREPARING → READY → COMPLETED
   │
   └─ Table status = AVAILABLE ✅
```

### Flow 2: Takeaway Order (Public QR)

```
[Customer]
   │
   ├─ Scan QR Takeaway
   │    └─ URL: /menu?takeaway=true&token=zzz
   │
   ├─ Validate Takeaway
   │    └─ localStorage: orderType=TAKEAWAY (NO table data)
   │
   ├─ Browse & Add to Cart
   │
   ├─ Checkout
   │    └─ Fill: Customer Name
   │    └─ Choose Payment: CASH / QRIS
   │
   ├─ Create Order (table_id = null)
   │
   ├─ Payment → status=CONFIRMED
   │
   ├─ Order masuk Queue Kasir
   │
   ├─ Kasir Print Struk → Kitchen
   │
   ├─ Status: PREPARING → READY
   │
   └─ Customer ambil pesanan ✅
```

### Flow 3: Pre-Order Online

```
[Customer]
   │
   ├─ Access Public URL
   │    └─ URL: /menu?mode=preorder
   │
   ├─ localStorage: channel=PREORDER, orderType=TAKEAWAY
   │
   ├─ Browse & Add to Cart
   │
   ├─ Checkout (Extended Form)
   │    ├─ Fill: Customer Name
   │    ├─ Fill: Customer Phone (WhatsApp)
   │    ├─ Select: Pickup Time (11:00-22:00, min 30 min)
   │    └─ Payment: QRIS ONLY
   │
   ├─ Create Order
   │    └─ POST /api/orders { channel: 'PREORDER', pickupTime }
   │
   ├─ Midtrans Payment
   │    └─ Customer scan QRIS → Webhook → status=CONFIRMED
   │
   ├─ Order masuk Queue Kasir
   │
   ├─ Kitchen Process
   │    └─ status: PREPARING → READY
   │
   ├─ WhatsApp Notification
   │    └─ "Pesanan Anda Siap! #ORD-XX-0MBNK. Jam: 14:00"
   │
   └─ Customer datang & ambil ✅
```

---

## 📚 API DOCUMENTATION

Dokumentasi lengkap API ada di `docs/API_DOCUMENTATION.md`.

### Authentication Endpoints

```
POST   /api/auth/login          # Staff login
POST   /api/auth/logout         # Logout
GET    /api/auth/me             # Get current user
```

### Product Endpoints

```
GET    /api/products            # List all products
POST   /api/products            # Create product (ADMIN only)
GET    /api/products/[id]       # Get single product
PUT    /api/products/[id]       # Update product (ADMIN only)
DELETE /api/products/[id]       # Delete/deactivate product (ADMIN only)
POST   /api/products/upload     # Upload product image
```

### Order Endpoints

```
GET    /api/orders              # List orders
POST   /api/orders              # Create order (Guest/Authed)
GET    /api/orders/[id]         # Get order details
PATCH  /api/orders/[id]/status  # Update order status
PATCH  /api/orders/[id]/confirm-payment  # Confirm cash payment (KASIR)
POST   /api/orders/[id]/print   # Mark order as printed
GET    /api/orders/stream       # SSE for real-time updates
```

### Payment Endpoints

```
POST   /api/payments            # Create payment
POST   /api/payments/midtrans/notification  # Midtrans webhook
```

### Admin Endpoints

```
GET    /api/admin/analytics     # Dashboard statistics
GET    /api/admin/reports       # Sales reports
GET    /api/admin/audit         # Audit logs
GET    /api/admin/users         # List users
POST   /api/admin/users         # Create user
PUT    /api/admin/users/[id]    # Update user
DELETE /api/admin/users/[id]    # Delete user
GET    /api/admin/tables        # List tables
POST   /api/admin/tables        # Create table
POST   /api/admin/tables/generate-qr  # Generate QR code
GET    /api/admin/banners       # List banners
POST   /api/admin/banners       # Create banner
PUT    /api/admin/banners/[id]  # Update banner
DELETE /api/admin/banners/[id]  # Delete banner
```

### Kasir Endpoints

```
GET    /api/kasir/orders        # Incoming orders queue
GET    /api/kasir/orders/history  # Order history
```

### Owner Endpoints

```
GET    /api/owner/analytics     # Full analytics
GET    /api/owner/analytics/export  # Export data
GET    /api/owner/reports       # Financial reports
GET    /api/owner/reports/pdf   # Download PDF report
GET    /api/owner/financial     # Financial summary
GET    /api/owner/audit         # Full audit trail
GET    /api/owner/users         # View all users
```

### Table Endpoints

```
POST   /api/tables/validate     # Validate QR token
```

### Settings Endpoints

```
GET    /api/settings            # Get system settings
PUT    /api/settings            # Update settings (ADMIN only)
```

---

## 🚀 SETUP & DEPLOYMENT

### Prerequisites

```bash
# Required
- Node.js 20+
- MySQL 8.0+
- npm atau yarn

# Optional (untuk development)
- Git
- VS Code
```

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd resto-iga-bakar

# 2. Install dependencies
npm install

# 3. Setup database
# Import database setup SQL
mysql -u root -p < prisma/database_setup.sql

# 4. Configure environment
cp .env.example .env
# Edit .env dengan kredensial Anda

# 5. Generate Prisma Client
npm run db:generate

# 6. Test database connection
npm run db:test

# 7. Run development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/resto_iga_bakar"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRATION="7d"

# Development Mode
NODE_ENV="development"
BYPASS_PREORDER_PICKUP_TIME=true
NEXT_PUBLIC_BYPASS_PREORDER_PICKUP_TIME=true

# Midtrans Payment
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxx"
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxx"
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false

# WhatsApp Business API
WA_PHONE_NUMBER_ID="your_phone_number_id"
WA_ACCESS_TOKEN="your_whatsapp_access_token"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_UPLOAD_PRESET="your_upload_preset"

# App URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Payment Timeout (minutes)
PAYMENT_TIMEOUT_MINUTES=10
```

### Database Scripts

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes
npm run db:push

# Open Prisma Studio (DB GUI)
npm run db:studio

# Seed database dengan sample data
npm run seed

# Setup database otomatis
npm run db:setup

# Test database connection
npm run db:test
```

### Production Deployment

```bash
# Build untuk production
npm run build

# Start production server
npm run start

# Atau dengan PM2
pm2 start npm --name "resto-iga-bakar" -- start
```

**Production Checklist:**

- ✅ Set `NODE_ENV=production`
- ✅ Set `BYPASS_PREORDER_PICKUP_TIME=false`
- ✅ Use production Midtrans keys
- ✅ Set strong `JWT_SECRET` (min 32 characters)
- ✅ Enable HTTPS (secure cookies)
- ✅ Setup database backups
- ✅ Configure firewall & security
- ✅ Setup monitoring (Sentry, etc.)
- ✅ Setup SSL certificate
- ✅ Configure proper CORS

---

## 🐛 TROUBLESHOOTING

### Common Issues

#### 1. MySQL Authentication Error

```
Error: ER_NOT_SUPPORTED_AUTH_MODE: Client does not support authentication protocol
```

**Solution:** Lihat `docs/FIX_AUTH_NOW.md` atau `docs/MYSQL_AUTH_FIX.md`

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```

#### 2. Database Connection Failed

```
Error: Can't reach database server at `localhost:3306`
```

**Solution:**
- Pastikan MySQL service berjalan
- Cek `DATABASE_URL` di `.env`
- Test dengan: `npm run db:test`

#### 3. Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution:**

```bash
npm run db:generate
```

#### 4. Port 3000 Already in Use

```
Error: Port 3000 is already in use
```

**Solution:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

#### 5. Payment Timeout Not Working

**Solution:** Ensure server is running continuously (not serverless)

#### 6. Real-Time Updates Not Working

**Solution:**
- Check SSE connection di Network tab
- Fallback polling akan handle ini
- Ensure no proxy blocking SSE

---

## 📝 KESIMPULAN

**Resto Iga Bakar** adalah sistem manajemen restoran full-stack yang komprehensif dengan fitur-fitur modern:

✅ **Guest Checkout** - Tanpa perlu login  
✅ **Multi-Channel Orders** - Dine-in, Takeaway, Pre-order  
✅ **QR Code System** - Table management via QR  
✅ **Real-Time Updates** - SSE + Polling  
✅ **Payment Gateway** - Midtrans Snap (QRIS)  
✅ **Role-Based Access** - OWNER, ADMIN, KASIR  
✅ **Analytics Dashboard** - Real-time metrics  
✅ **Audit Trail** - Complete logging  
✅ **WhatsApp Notification** - Pre-order alerts  
✅ **Receipt Printing** - Thermal printer ready  

### Tech Stack Summary

```
Frontend:  Next.js 16 + TypeScript + Tailwind CSS
Backend:   Next.js API Routes + Middleware
Database:  MySQL + Prisma ORM
Auth:      JWT + bcryptjs
Payment:   Midtrans Snap
Storage:   Cloudinary
Notif:     WhatsApp Business API
Real-Time: Server-Sent Events + Polling
PDF:       jsPDF + autotable
QR:        qrcode.react
```

### Kontak & Support

- **Documentation**: `docs/` folder
- **API Docs**: `docs/API_DOCUMENTATION.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`
- **Quick Start**: `QUICK_START.md`
- **Design System**: `design.md`

---

**📅 Last Updated**: 29 Juli 2026  
**📦 Version**: 1.0  
**👨‍💻 Status**: Production Ready

