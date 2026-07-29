# Design Document: QR Code Table Ordering System

## Overview

The QR Code Table Ordering System is a self-service restaurant ordering platform that enables customers to order food and beverages without authentication by scanning QR codes placed on tables. The system supports anonymous sessions, two payment methods (QRIS and Cash), and provides role-based interfaces for Kasir (cashier) staff and Admin users.

### Key Features

- **Anonymous Ordering**: Customers can browse menu and place orders without creating accounts
- **QR Code Integration**: Each table has a unique QR code containing table ID and authentication token
- **Dual Payment Methods**: QRIS (online payment via Xendit) and Cash (pay at cashier)
- **Session Management**: Anonymous sessions tracked via localStorage with server-side validation
- **Real-time Updates**: Order status polling for live updates to customers and staff
- **Role-based Access**: Separate interfaces for Customer (public), Kasir (protected), and Admin (protected)

### System Goals

1. **Frictionless Ordering**: Minimize steps from QR scan to order placement
2. **Payment Flexibility**: Support both online and cash payment methods
3. **Operational Efficiency**: Streamline order processing for Kasir staff
4. **Table Management**: Prevent concurrent sessions on the same table
5. **Monitoring Capability**: Provide Admin with comprehensive order oversight


## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Customer[Customer Browser]
        Kasir[Kasir Dashboard]
        Admin[Admin Dashboard]
    end
    
    subgraph "Application Layer"
        NextJS[Next.js App Router]
        Middleware[Auth Middleware]
        API[API Routes]
    end
    
    subgraph "Business Logic Layer"
        OrderService[Order Service]
        PaymentService[Payment Service]
        SessionService[Session Service]
        TableService[Table Service]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        MySQL[(MySQL Database)]
    end
    
    subgraph "External Services"
        Xendit[Xendit Payment Gateway]
    end
    
    Customer -->|Scan QR| NextJS
    Customer -->|Browse/Order| API
    Kasir -->|Process Orders| API
    Admin -->|Monitor| API
    
    NextJS --> Middleware
    Middleware --> API
    API --> OrderService
    API --> PaymentService
    API --> SessionService
    API --> TableService
    
    OrderService --> Prisma
    PaymentService --> Prisma
    SessionService --> Prisma
    TableService --> Prisma
    
    Prisma --> MySQL
    PaymentService -.->|QRIS| Xendit
```

### Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        MenuPage[Menu Page]
        CheckoutPage[Checkout Page]
        PaymentPage[Payment Page]
        ReceiptPage[Receipt Page]
        KasirPage[Kasir Dashboard]
        AdminPage[Admin Dashboard]
    end
    
    subgraph "Shared Components"
        CustomerNavbar[Customer Navbar]
        CartSidebar[Cart Sidebar]
        OrderCard[Order Card]
        QRGenerator[QR Generator]
    end
    
    subgraph "State Management"
        LocalStorage[localStorage]
        PollingService[Polling Service]
    end
    
    MenuPage --> CustomerNavbar
    MenuPage --> CartSidebar
    MenuPage --> LocalStorage
    
    CheckoutPage --> CustomerNavbar
    CheckoutPage --> LocalStorage
    
    PaymentPage --> PollingService
    
    KasirPage --> OrderCard
    KasirPage --> PollingService
    
    AdminPage --> OrderCard
    AdminPage --> QRGenerator
    AdminPage --> PollingService
```

### Data Flow Diagrams

#### QRIS Payment Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant API as API Routes
    participant DB as Database
    participant X as Xendit (Placeholder)
    
    C->>F: Select QRIS Payment
    F->>API: POST /api/orders (status: PENDING_PAYMENT)
    API->>DB: Create Order
    API->>X: Generate QRIS Code
    X-->>API: Return QRIS String
    API-->>F: Order + QRIS Code
    F->>C: Display QRIS Code
    
    C->>C: Scan QRIS & Pay
    C->>F: Click "Saya Sudah Bayar"
    F->>API: PATCH /api/orders/[id]/confirm-payment
    API->>DB: Update status: IN_KITCHEN, payment_status: PAID
    API-->>F: Success
    F->>C: Show "Pesanan sedang diproses"
    
    Note over F,API: Polling every 5 seconds
    F->>API: GET /api/orders/[session_id]/status
    API->>DB: Query Order Status
    API-->>F: Current Status
```

#### Cash Payment Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant API as API Routes
    participant DB as Database
    participant K as Kasir
    
    C->>F: Select Cash Payment
    F->>API: POST /api/orders (status: IN_KITCHEN, payment_status: UNPAID)
    API->>DB: Create Order
    API-->>F: Order Created
    F->>C: Show "Pesanan sedang diproses"
    
    Note over K: Kasir sees order in queue
    K->>API: PATCH /api/orders/[id]/status (status: READY)
    API->>DB: Update Order Status
    
    Note over F,API: Polling detects status change
    F->>API: GET /api/orders/[session_id]/status
    API-->>F: Status: READY
    F->>C: Show "Pesanan siap! Silakan ke kasir"
    
    C->>K: Pay Cash at Counter
    K->>API: PATCH /api/orders/[id]/confirm-payment
    API->>DB: Update status: COMPLETED, payment_status: PAID
    API->>DB: Update table status: available
    API-->>K: Success
```

#### Table Session Management

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant API as API Routes
    participant DB as Database
    
    C->>F: Scan QR Code (table_id + token)
    F->>F: Generate session_id (UUID)
    F->>F: Store in localStorage
    F->>API: Validate table_id & token
    API->>DB: Check table exists & token matches
    API->>DB: Check table status
    
    alt Table Available
        API-->>F: Valid
        F->>F: Store tableNumber in localStorage
        F->>C: Show Menu
    else Table Occupied
        API-->>F: Error: Table Occupied
        F->>C: Show "Meja sedang digunakan"
    end
    
    Note over C,F: Customer places order
    F->>API: POST /api/orders (with session_id)
    API->>DB: Create Order + Update table status: occupied
    
    Note over C,K: Order completed
    API->>DB: Update order status: COMPLETED
    API->>DB: Update table status: available
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | React framework with server components |
| **UI Components** | React + TypeScript | Type-safe component development |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Backend** | Next.js API Routes | Serverless API endpoints |
| **ORM** | Prisma | Type-safe database access |
| **Database** | MySQL | Relational database |
| **Authentication** | JWT + Cookies | Token-based auth for staff |
| **Payment Gateway** | Xendit (Placeholder) | QRIS payment processing |
| **State Management** | localStorage + React State | Client-side state persistence |
| **Real-time Updates** | Polling (5s intervals) | Order status synchronization |


## Components and Interfaces

### Frontend Components

#### Customer-Facing Components

##### 1. Menu Page (`/app/menu/page.tsx`)

**Purpose**: Display product catalog with category filtering and cart management

**Props**: None (uses URL search params)

**State**:
```typescript
interface MenuPageState {
  products: Product[]
  filteredProducts: Product[]
  cart: CartItem[]
  loading: boolean
  selectedCategory: 'ALL' | 'MAKANAN' | 'MINUMAN'
}
```

**Key Features**:
- QR code parameter extraction (`?table={id}&token={token}`)
- Session ID generation and localStorage persistence
- Category-based product filtering
- Real-time cart updates
- Stock validation before adding to cart

**Dependencies**:
- `CustomerNavbar`: Display table information
- `CategoryNavbar`: Category filter controls
- `CartSidebar`: Shopping cart display and management

##### 2. Checkout Page (`/app/checkout/page.tsx`)

**Purpose**: Review order details and select payment method

**State**:
```typescript
interface CheckoutPageState {
  cart: CartItem[]
  customerName: string
  orderType: 'DINE_IN' | 'TAKEAWAY'
  tableNumber: string
  notes: string
  discountCode: string
  loading: boolean
  error: string
}
```

**Key Features**:
- Auto-fill table number from localStorage
- Order type selection (Dine-in / Takeaway)
- Customer name input (required for anonymous orders)
- Special notes textarea
- Discount code application
- Order summary with price breakdown

**Validation Rules**:
- Customer name is required
- Table number required for DINE_IN orders
- Cart must not be empty

##### 3. Payment Page (`/app/payment/[orderId]/page.tsx`)

**Purpose**: Handle payment method selection and payment confirmation

**State**:
```typescript
interface PaymentPageState {
  order: Order | null
  paymentMethod: 'QRIS' | 'CASH' | null
  qrisCode: string | null
  loading: boolean
  error: string
  pollingInterval: NodeJS.Timeout | null
}
```

**Key Features**:
- Payment method selection (QRIS / Cash)
- QRIS code display (from Xendit placeholder)
- "Saya Sudah Bayar" button for manual QRIS confirmation
- Real-time order status polling (5-second intervals)
- Automatic redirect to receipt page on completion

**Payment Flows**:

**QRIS Flow**:
1. Display QRIS code
2. Customer scans and pays externally
3. Customer clicks "Saya Sudah Bayar"
4. Update order status to IN_KITCHEN, payment_status to PAID
5. Poll for status updates

**Cash Flow**:
1. Display "Pesanan sedang diproses" message
2. Poll for status updates
3. When status becomes READY, show "Silakan ke kasir untuk pembayaran"
4. Kasir confirms payment manually

##### 4. Receipt Page (`/app/receipt/[orderId]/page.tsx`)

**Purpose**: Display order confirmation and receipt

**State**:
```typescript
interface ReceiptPageState {
  order: Order | null
  loading: boolean
}
```

**Key Features**:
- Order summary display
- Payment method badge
- Order status indicator
- Table number display
- Timestamp information
- "Pesan Lagi" button to return to menu

#### Kasir Dashboard Components

##### 5. Kasir Page (`/app/kasir/page.tsx`)

**Purpose**: Display order queue and process orders

**State**:
```typescript
interface KasirPageState {
  orders: Order[]
  loading: boolean
  pollingInterval: NodeJS.Timeout | null
}
```

**Key Features**:
- Display orders with status IN_KITCHEN
- Payment method badges (QRIS: green, CASH: orange)
- "Selesai Dibuat" button to mark order as READY
- "Konfirmasi Pembayaran Cash" button for cash orders
- Real-time order updates via polling (5-second intervals)
- Order details: table, items, quantity, notes

**Order Card Display**:
```typescript
interface OrderCardProps {
  order: Order
  onStatusUpdate: (orderId: string, status: OrderStatus) => void
  onConfirmPayment: (orderId: string) => void
}
```

**Actions**:
- `PATCH /api/orders/[id]/status` - Update order status to READY
- `PATCH /api/orders/[id]/confirm-payment` - Confirm cash payment

#### Admin Dashboard Components

##### 6. Admin Page (`/app/admin/page.tsx`)

**Purpose**: Monitor all orders and system operations

**State**:
```typescript
interface AdminPageState {
  orders: Order[]
  filters: {
    status: OrderStatus | 'ALL'
    paymentMethod: PaymentMethod | 'ALL'
    tableNumber: string | 'ALL'
  }
  loading: boolean
  pollingInterval: NodeJS.Timeout | null
}
```

**Key Features**:
- View all orders with filtering
- Real-time updates via polling
- Order detail modal
- Analytics dashboard
- Manual table status reset capability

##### 7. QR Generator Page (`/app/admin/qr-generator/page.tsx`)

**Purpose**: Generate and manage table QR codes

**State**:
```typescript
interface QRGeneratorState {
  tables: Table[]
  selectedTable: Table | null
  qrCodeDataURL: string | null
  loading: boolean
}
```

**Key Features**:
- Generate QR codes for tables
- Display QR code preview
- Download QR code as image
- View all generated QR codes
- Table list with status indicators

### Shared Components

#### CustomerNavbar

**Purpose**: Display restaurant branding and table/order type information

**Props**:
```typescript
interface CustomerNavbarProps {
  tableNumber?: string | null
  isTakeaway?: boolean
  sticky?: boolean
}
```

**Features**:
- Restaurant name display
- Table badge (for dine-in orders)
- Takeaway badge (for takeaway orders)
- Sticky positioning option

#### CategoryNavbar

**Purpose**: Product category filter controls

**Props**:
```typescript
interface CategoryNavbarProps {
  selectedCategory: 'ALL' | 'MAKANAN' | 'MINUMAN'
  onCategoryChange: (category: 'ALL' | 'MAKANAN' | 'MINUMAN') => void
}
```

#### CartSidebar

**Purpose**: Display shopping cart with item management

**Props**:
```typescript
interface CartSidebarProps {
  cart: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onCheckout: () => void
}
```

**Features**:
- Item list with quantity controls
- Remove item button
- Total price calculation
- Checkout button
- Empty cart state
- Mobile-responsive drawer

#### OrderCard

**Purpose**: Display order information in Kasir and Admin dashboards

**Props**:
```typescript
interface OrderCardProps {
  order: Order
  showActions?: boolean
  onStatusUpdate?: (orderId: string, status: OrderStatus) => void
  onConfirmPayment?: (orderId: string) => void
}
```

**Features**:
- Order number display
- Table information
- Item list with quantities
- Payment method badge
- Payment status indicator
- Order status badge
- Action buttons (conditional)
- Timestamp display

### API Interfaces

#### Customer API Endpoints (Public)

```typescript
// GET /api/products
interface GetProductsResponse {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  category: string | null
  stock: number
  isActive: boolean
}[]

// POST /api/orders
interface CreateOrderRequest {
  items: {
    productId: string
    quantity: number
  }[]
  orderType: 'DINE_IN' | 'TAKEAWAY'
  tableNumber?: string
  notes?: string
  customerName: string
  session_id: string
  table_id?: string
}

interface CreateOrderResponse {
  id: string
  orderNumber: string
  status: OrderStatus
  totalAmount: number
  items: OrderItem[]
  createdAt: string
}

// GET /api/orders/[session_id]/status
interface GetOrderStatusResponse {
  id: string
  orderNumber: string
  status: OrderStatus
  payment_status: PaymentStatus
  totalAmount: number
  items: OrderItem[]
  table: {
    name: string
  } | null
}
```

#### Kasir API Endpoints (Protected)

```typescript
// GET /api/kasir/orders
interface GetKasirOrdersResponse {
  id: string
  orderNumber: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  totalAmount: number
  items: OrderItem[]
  table: {
    name: string
  } | null
  customerName: string | null
  notes: string | null
  createdAt: string
}[]

// PATCH /api/orders/[id]/status
interface UpdateOrderStatusRequest {
  status: OrderStatus
}

interface UpdateOrderStatusResponse {
  id: string
  status: OrderStatus
  updatedAt: string
}

// PATCH /api/orders/[id]/confirm-payment
interface ConfirmPaymentResponse {
  id: string
  status: OrderStatus
  payment_status: PaymentStatus
  updatedAt: string
}
```

#### Admin API Endpoints (Protected)

```typescript
// GET /api/admin/orders
interface GetAdminOrdersRequest {
  status?: OrderStatus
  paymentMethod?: PaymentMethod
  tableNumber?: string
}

interface GetAdminOrdersResponse {
  id: string
  orderNumber: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  totalAmount: number
  items: OrderItem[]
  table: {
    id: string
    name: string
    status: 'available' | 'occupied'
  } | null
  user: {
    name: string
  } | null
  customerName: string | null
  createdAt: string
  updatedAt: string
}[]

// GET /api/admin/analytics
interface GetAnalyticsResponse {
  totalOrders: number
  totalRevenue: number
  ordersByStatus: Record<OrderStatus, number>
  ordersByPaymentMethod: Record<PaymentMethod, number>
  recentOrders: Order[]
}

// POST /api/admin/tables/generate-qr
interface GenerateQRRequest {
  tableId: string
}

interface GenerateQRResponse {
  table: {
    id: string
    name: string
    qr_token: string
    qr_url: string
  }
  qrCodeDataURL: string
}

// PATCH /api/admin/tables/[id]/reset
interface ResetTableStatusResponse {
  id: string
  status: 'available' | 'occupied'
}
```

### External Service Interfaces

#### Xendit Payment Gateway (Placeholder)

```typescript
// /lib/xendit.ts

interface GenerateQRISRequest {
  orderId: string
  amount: number
}

interface GenerateQRISResponse {
  qr_string: string
  transaction_id: string
  expires_at: string
}

interface CheckPaymentStatusRequest {
  transaction_id: string
}

interface CheckPaymentStatusResponse {
  status: 'PENDING' | 'PAID' | 'FAILED'
  paid_at: string | null
}

// Placeholder implementations
export async function generateQRIS(
  orderId: string,
  amount: number
): Promise<GenerateQRISResponse> {
  // TODO: Implement real Xendit API call
  return {
    qr_string: `MOCK_QRIS_${orderId}_${amount}`,
    transaction_id: `TXN_${Date.now()}`,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  }
}

export async function checkPaymentStatus(
  transaction_id: string
): Promise<CheckPaymentStatusResponse> {
  // TODO: Implement real Xendit API call
  return {
    status: 'PENDING',
    paid_at: null
  }
}
```


## Data Models

### Database Schema

#### Tables Table

**Purpose**: Store restaurant table information and QR code tokens

```prisma
model Table {
  id        String   @id @default(cuid())
  name      String   @unique  // e.g., "A1", "B2", "12"
  qr_token  String   @unique  // Static token for QR code validation
  status    TableStatus @default(AVAILABLE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
}

enum TableStatus {
  AVAILABLE
  OCCUPIED
}
```

**Fields**:
- `id`: Unique identifier (CUID)
- `name`: Human-readable table name/number
- `qr_token`: Static authentication token embedded in QR code
- `status`: Current table occupancy status
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp
- `orders`: Relation to orders placed at this table

**Indexes**:
- Primary key on `id`
- Unique index on `name`
- Unique index on `qr_token`
- Index on `status` for filtering available tables

#### Updated Orders Table

**Purpose**: Store customer orders with support for anonymous sessions

```prisma
model Order {
  id            String        @id @default(cuid())
  orderNumber   String        @unique
  userId        String?       // Nullable for anonymous orders
  user          User?         @relation(fields: [userId], references: [id])
  session_id    String?       // UUID for anonymous customer tracking
  table_id      String?       // Foreign key to tables
  table         Table?        @relation(fields: [table_id], references: [id])
  customerName  String?       // Required for anonymous orders
  status        OrderStatus   @default(PENDING_PAYMENT)
  payment_status PaymentStatus @default(UNPAID)
  payment_method PaymentMethod?
  totalAmount   Decimal       @db.Decimal(10, 2)
  orderType     OrderType     @default(DINE_IN)
  tableNumber   String?       // Deprecated: use table relation instead
  notes         String?       @db.Text
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  items         OrderItem[]
  payment       Payment?
}

enum OrderStatus {
  PENDING_PAYMENT  // Waiting for payment confirmation (QRIS)
  IN_KITCHEN       // Order confirmed, being prepared
  READY            // Order ready for pickup/delivery
  COMPLETED        // Order completed and paid
  CANCELLED        // Order cancelled
}

enum PaymentStatus {
  UNPAID
  PAID
  FAILED
}

enum PaymentMethod {
  CASH
  QRIS
  EDC
}

enum OrderType {
  DINE_IN
  TAKEAWAY
}
```

**Key Changes from Original Schema**:
- `userId` is now nullable to support anonymous orders
- Added `session_id` for anonymous customer tracking
- Added `table_id` foreign key to `tables` table
- Added `payment_status` field separate from order status
- Added `payment_method` field
- Added `PENDING_PAYMENT` to OrderStatus enum

**Fields**:
- `id`: Unique identifier
- `orderNumber`: Human-readable order number (e.g., "ORD-1234567890-ABC")
- `userId`: Optional reference to authenticated user
- `session_id`: UUID generated client-side for anonymous sessions
- `table_id`: Reference to table where order was placed
- `customerName`: Required for anonymous orders
- `status`: Current order processing status
- `payment_status`: Current payment status
- `payment_method`: Selected payment method
- `totalAmount`: Total order amount
- `orderType`: Dine-in or takeaway
- `notes`: Special instructions from customer

**Indexes**:
- Primary key on `id`
- Unique index on `orderNumber`
- Index on `userId` for user order history
- Index on `session_id` for anonymous order lookup
- Index on `table_id` for table order history
- Index on `status` for order queue filtering
- Index on `payment_status` for payment tracking
- Composite index on `(status, payment_status)` for Kasir queue

#### Updated Users Table

**Purpose**: Store staff user accounts with updated roles

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // Hashed with bcrypt
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
}

enum UserRole {
  ADMIN   // Full system access
  KASIR   // Order processing and payment confirmation
  USER    // Regular customer (deprecated for this feature)
}
```

**Key Changes**:
- Replaced `KITCHEN` role with `KASIR` role
- KASIR role has permissions for order processing and payment confirmation

#### Products Table (Unchanged)

```prisma
model Product {
  id          String      @id @default(cuid())
  name        String
  description String?
  price       Decimal     @db.Decimal(10, 2)
  image       String?
  category    String?     // "MAKANAN" or "MINUMAN"
  stock       Int         @default(0)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  orderItems  OrderItem[]
  stockHistory StockHistory[]
}
```

#### OrderItems Table (Unchanged)

```prisma
model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)
  subtotal  Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
}
```

#### Updated Payment Table

**Purpose**: Store payment transaction details

```prisma
model Payment {
  id            String        @id @default(cuid())
  orderId       String        @unique
  order         Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  method        PaymentMethod
  amount        Decimal       @db.Decimal(10, 2)
  status        PaymentStatus @default(PENDING)
  transactionId String?       @unique  // Xendit transaction ID
  qris_string   String?       // QRIS code string
  expires_at    DateTime?     // QRIS expiration time
  paidAt        DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```

**Key Changes**:
- Added `qris_string` field for storing QRIS code
- Added `expires_at` field for QRIS expiration tracking

### Data Relationships

```mermaid
erDiagram
    User ||--o{ Order : "places (optional)"
    Table ||--o{ Order : "hosts"
    Order ||--|{ OrderItem : "contains"
    Order ||--o| Payment : "has"
    Product ||--o{ OrderItem : "included in"
    Product ||--o{ StockHistory : "tracks"
    
    User {
        string id PK
        string email UK
        string name
        string password
        UserRole role
        datetime createdAt
        datetime updatedAt
    }
    
    Table {
        string id PK
        string name UK
        string qr_token UK
        TableStatus status
        datetime createdAt
        datetime updatedAt
    }
    
    Order {
        string id PK
        string orderNumber UK
        string userId FK "nullable"
        string session_id "nullable"
        string table_id FK "nullable"
        string customerName "nullable"
        OrderStatus status
        PaymentStatus payment_status
        PaymentMethod payment_method "nullable"
        decimal totalAmount
        OrderType orderType
        string notes "nullable"
        datetime createdAt
        datetime updatedAt
    }
    
    OrderItem {
        string id PK
        string orderId FK
        string productId FK
        int quantity
        decimal price
        decimal subtotal
        datetime createdAt
    }
    
    Product {
        string id PK
        string name
        string description "nullable"
        decimal price
        string image "nullable"
        string category "nullable"
        int stock
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Payment {
        string id PK
        string orderId FK UK
        PaymentMethod method
        decimal amount
        PaymentStatus status
        string transactionId UK "nullable"
        string qris_string "nullable"
        datetime expires_at "nullable"
        datetime paidAt "nullable"
        datetime createdAt
        datetime updatedAt
    }
```

### Data Validation Rules

#### Order Creation Validation

```typescript
// Order validation rules
const orderValidation = {
  items: {
    required: true,
    minLength: 1,
    validate: (items) => {
      // Each item must have valid productId and quantity > 0
      return items.every(item => 
        item.productId && 
        item.quantity > 0
      )
    }
  },
  orderType: {
    required: true,
    enum: ['DINE_IN', 'TAKEAWAY']
  },
  tableNumber: {
    required: (orderType) => orderType === 'DINE_IN',
    validate: (value) => value && value.trim().length > 0
  },
  customerName: {
    required: (userId) => !userId, // Required for anonymous orders
    validate: (value) => value && value.trim().length > 0
  },
  session_id: {
    required: (userId) => !userId, // Required for anonymous orders
    validate: (value) => {
      // Must be valid UUID v4
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(value)
    }
  },
  table_id: {
    required: (orderType) => orderType === 'DINE_IN',
    validate: async (tableId, qr_token) => {
      // Validate table exists and token matches
      const table = await prisma.table.findUnique({
        where: { id: tableId }
      })
      return table && table.qr_token === qr_token
    }
  }
}
```

#### Stock Validation

```typescript
// Stock validation before order creation
async function validateStock(items: OrderItem[]): Promise<ValidationResult> {
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    })
    
    if (!product) {
      return {
        valid: false,
        error: `Product ${item.productId} not found`
      }
    }
    
    if (!product.isActive) {
      return {
        valid: false,
        error: `Product ${product.name} is not available`
      }
    }
    
    if (product.stock < item.quantity) {
      return {
        valid: false,
        error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
      }
    }
  }
  
  return { valid: true }
}
```

#### Table Status Validation

```typescript
// Table status validation
async function validateTableAvailability(
  tableId: string,
  qr_token: string
): Promise<ValidationResult> {
  const table = await prisma.table.findUnique({
    where: { id: tableId }
  })
  
  if (!table) {
    return {
      valid: false,
      error: 'QR Code tidak valid. Hubungi staff.'
    }
  }
  
  if (table.qr_token !== qr_token) {
    return {
      valid: false,
      error: 'QR Code tidak valid. Hubungi staff.'
    }
  }
  
  if (table.status === 'OCCUPIED') {
    return {
      valid: false,
      error: 'Meja ini sedang digunakan. Hubungi staff jika ini keliru.'
    }
  }
  
  return { valid: true }
}
```

### State Transitions

#### Order Status State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: Create Order (QRIS)
    [*] --> IN_KITCHEN: Create Order (CASH)
    
    PENDING_PAYMENT --> IN_KITCHEN: Customer confirms payment
    PENDING_PAYMENT --> CANCELLED: Payment timeout (10 min)
    
    IN_KITCHEN --> READY: Kasir marks ready
    IN_KITCHEN --> CANCELLED: Admin cancels
    
    READY --> COMPLETED: Kasir confirms cash payment
    READY --> COMPLETED: Auto-complete (QRIS already paid)
    
    COMPLETED --> [*]
    CANCELLED --> [*]
```

**Valid Transitions**:

| From | To | Trigger | Actor |
|------|-----|---------|-------|
| PENDING_PAYMENT | IN_KITCHEN | Customer clicks "Saya Sudah Bayar" | Customer |
| PENDING_PAYMENT | CANCELLED | 10-minute timeout | System |
| IN_KITCHEN | READY | Kasir clicks "Selesai Dibuat" | Kasir |
| IN_KITCHEN | CANCELLED | Admin cancels order | Admin |
| READY | COMPLETED | Kasir confirms cash payment | Kasir |
| READY | COMPLETED | Auto-complete for QRIS orders | System |

#### Payment Status State Machine

```mermaid
stateDiagram-v2
    [*] --> UNPAID: Create Order (CASH)
    [*] --> PAID: Create Order (QRIS confirmed)
    
    UNPAID --> PAID: Kasir confirms payment
    UNPAID --> FAILED: Payment timeout
    
    PAID --> [*]
    FAILED --> [*]
```

#### Table Status State Machine

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE: Initial state
    
    AVAILABLE --> OCCUPIED: Order created
    
    OCCUPIED --> AVAILABLE: Order completed
    OCCUPIED --> AVAILABLE: Order cancelled
    OCCUPIED --> AVAILABLE: Admin manual reset
    
    AVAILABLE --> [*]
```


## Error Handling

### Error Categories

#### 1. Validation Errors (400 Bad Request)

**QR Code Validation**:
```typescript
class QRCodeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QRCodeValidationError'
  }
}

// Error scenarios:
// - Invalid table_id: "QR Code tidak valid. Hubungi staff."
// - Invalid qr_token: "QR Code tidak valid. Hubungi staff."
// - Table occupied: "Meja ini sedang digunakan. Hubungi staff jika ini keliru."
```

**Order Validation**:
```typescript
class OrderValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'OrderValidationError'
  }
}

// Error scenarios:
// - Empty cart: "Keranjang masih kosong"
// - Missing customer name: "Nama customer wajib diisi"
// - Missing table number (dine-in): "Nomor meja wajib diisi untuk Dine-in"
// - Invalid order type: "Order type harus Dine-in atau Takeaway"
// - Insufficient stock: "Stok tidak cukup untuk {product_name}"
```

**Payment Validation**:
```typescript
class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentValidationError'
  }
}

// Error scenarios:
// - Payment timeout: "Pembayaran gagal, silakan coba lagi"
// - Invalid payment method: "Metode pembayaran tidak valid"
```

#### 2. Authentication Errors (401 Unauthorized)

```typescript
class AuthenticationError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

// Error scenarios:
// - Missing token: "Unauthorized"
// - Invalid token: "Unauthorized"
// - Expired token: "Unauthorized"
```

#### 3. Authorization Errors (403 Forbidden)

```typescript
class AuthorizationError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

// Error scenarios:
// - Non-Kasir accessing /kasir routes: "Forbidden"
// - Non-Admin accessing /admin routes: "Forbidden"
```

#### 4. Not Found Errors (404 Not Found)

```typescript
class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}

// Error scenarios:
// - Product not found: "Product {id} not found"
// - Order not found: "Order {id} not found"
// - Table not found: "Table {id} not found"
```

#### 5. Conflict Errors (409 Conflict)

```typescript
class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

// Error scenarios:
// - Table already occupied: "Meja ini sedang digunakan"
// - Duplicate order number: "Order number already exists"
```

#### 6. Server Errors (500 Internal Server Error)

```typescript
class InternalServerError extends Error {
  constructor(message: string = 'Internal server error') {
    super(message)
    this.name = 'InternalServerError'
  }
}

// Error scenarios:
// - Database connection failure
// - Xendit API failure
// - Unexpected exceptions
```

### Error Handling Patterns

#### API Route Error Handler

```typescript
// /lib/errorHandler.ts

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)
  
  if (error instanceof QRCodeValidationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
  
  if (error instanceof OrderValidationError) {
    return NextResponse.json(
      { error: error.message, field: error.field },
      { status: 400 }
    )
  }
  
  if (error instanceof PaymentValidationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
  
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }
  
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    )
  }
  
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    )
  }
  
  if (error instanceof ConflictError) {
    return NextResponse.json(
      { error: error.message },
      { status: 409 }
    )
  }
  
  // Default to 500 for unknown errors
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

#### Frontend Error Handling

```typescript
// Error handling in React components

interface ErrorState {
  message: string
  field?: string
  type: 'validation' | 'network' | 'server'
}

function handleFetchError(response: Response, data: any): ErrorState {
  if (response.status === 400) {
    return {
      message: data.error || 'Validation error',
      field: data.field,
      type: 'validation'
    }
  }
  
  if (response.status === 401 || response.status === 403) {
    // Redirect to login
    window.location.href = '/login'
    return {
      message: 'Unauthorized',
      type: 'server'
    }
  }
  
  if (response.status === 404) {
    return {
      message: data.error || 'Resource not found',
      type: 'server'
    }
  }
  
  if (response.status === 409) {
    return {
      message: data.error || 'Conflict error',
      type: 'validation'
    }
  }
  
  if (response.status >= 500) {
    return {
      message: 'Server error. Please try again later.',
      type: 'server'
    }
  }
  
  return {
    message: 'An unexpected error occurred',
    type: 'server'
  }
}

// Network error handling
function handleNetworkError(error: Error): ErrorState {
  console.error('Network error:', error)
  return {
    message: 'Koneksi gagal. Silakan coba lagi.',
    type: 'network'
  }
}
```

#### Error Display Component

```typescript
// components/ErrorAlert.tsx

interface ErrorAlertProps {
  error: ErrorState | null
  onDismiss?: () => void
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) return null
  
  const bgColor = {
    validation: 'bg-red-50 border-red-200',
    network: 'bg-yellow-50 border-yellow-200',
    server: 'bg-red-50 border-red-200'
  }[error.type]
  
  const textColor = {
    validation: 'text-red-600',
    network: 'text-yellow-600',
    server: 'text-red-600'
  }[error.type]
  
  return (
    <div className={`rounded-xl border p-4 ${bgColor} animate-shake`}>
      <div className="flex items-start justify-between">
        <p className={`text-sm font-medium ${textColor}`}>
          ⚠️ {error.message}
        </p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-4 ${textColor} hover:opacity-70`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
```

### Error Recovery Strategies

#### Cart Recovery

```typescript
// If checkout fails, restore cart from localStorage
function recoverCart(): CartItem[] {
  try {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      return JSON.parse(savedCart)
    }
  } catch (error) {
    console.error('Failed to recover cart:', error)
  }
  return []
}
```

#### Session Recovery

```typescript
// If session is lost, regenerate and continue
function recoverSession(): string {
  let sessionId = localStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('session_id', sessionId)
  }
  return sessionId
}
```

#### Payment Timeout Handling

```typescript
// Automatically cancel order after 10 minutes for QRIS
async function schedulePaymentTimeout(orderId: string) {
  setTimeout(async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (order && order.status === 'PENDING_PAYMENT') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          payment_status: 'FAILED'
        }
      })
      
      // Update table status to available
      if (order.table_id) {
        await prisma.table.update({
          where: { id: order.table_id },
          data: { status: 'AVAILABLE' }
        })
      }
    }
  }, 10 * 60 * 1000) // 10 minutes
}
```

#### Polling Error Handling

```typescript
// Retry polling with exponential backoff
function createPollingService(
  fetchFn: () => Promise<any>,
  interval: number = 5000,
  maxRetries: number = 3
) {
  let retryCount = 0
  let timeoutId: NodeJS.Timeout | null = null
  
  async function poll() {
    try {
      await fetchFn()
      retryCount = 0 // Reset on success
      timeoutId = setTimeout(poll, interval)
    } catch (error) {
      console.error('Polling error:', error)
      retryCount++
      
      if (retryCount < maxRetries) {
        // Exponential backoff
        const backoffDelay = interval * Math.pow(2, retryCount)
        timeoutId = setTimeout(poll, backoffDelay)
      } else {
        console.error('Max polling retries reached')
        // Show error to user
      }
    }
  }
  
  function start() {
    poll()
  }
  
  function stop() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  
  return { start, stop }
}
```

### Logging Strategy

```typescript
// /lib/logger.ts

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, any>
  timestamp: string
  userId?: string
  sessionId?: string
}

class Logger {
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString()
    }
    
    // In production, send to logging service
    // For now, console log
    console.log(JSON.stringify(entry))
  }
  
  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context)
  }
  
  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context)
  }
  
  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context)
  }
  
  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error?.message,
      stack: error?.stack
    })
  }
}

export const logger = new Logger()
```

**Logging Points**:
- Order creation: `logger.info('Order created', { orderId, sessionId, tableId })`
- Payment confirmation: `logger.info('Payment confirmed', { orderId, method })`
- QR code validation failure: `logger.warn('Invalid QR code', { tableId, token })`
- Stock validation failure: `logger.warn('Insufficient stock', { productId, requested, available })`
- API errors: `logger.error('API error', error, { endpoint, method })`
- Database errors: `logger.error('Database error', error, { operation })`


## Testing Strategy

### Overview

This feature is **NOT suitable for property-based testing** because:

1. **UI-Heavy Application**: The system is primarily composed of React components with user interactions, form submissions, and visual feedback
2. **External Service Integration**: Payment processing via Xendit involves external API calls with side effects
3. **CRUD Operations**: Most functionality involves database reads/writes without complex transformation logic
4. **Side Effects**: Order creation, payment confirmation, and table status updates are inherently side-effect operations
5. **No Universal Properties**: There are no pure functions with universal properties that hold across all inputs

Therefore, the testing strategy focuses on:
- **Unit Tests**: Test individual functions, components, and validation logic
- **Integration Tests**: Test API endpoints with database interactions
- **E2E Tests**: Test complete user flows from QR scan to order completion
- **Manual Testing**: Test payment flows and real-time updates

### Testing Pyramid

```
        /\
       /  \
      / E2E \
     /--------\
    /          \
   / Integration \
  /--------------\
 /                \
/   Unit Tests     \
--------------------
```

**Distribution**:
- Unit Tests: 60% (fast, isolated, many)
- Integration Tests: 30% (medium speed, database required)
- E2E Tests: 10% (slow, full system required)

### Unit Testing

#### 1. Validation Functions

**Test File**: `/lib/__tests__/validation.test.ts`

```typescript
describe('Order Validation', () => {
  describe('validateOrderItems', () => {
    it('should accept valid order items', () => {
      const items = [
        { productId: 'prod_1', quantity: 2 },
        { productId: 'prod_2', quantity: 1 }
      ]
      expect(validateOrderItems(items)).toBe(true)
    })
    
    it('should reject empty items array', () => {
      expect(() => validateOrderItems([])).toThrow('Items are required')
    })
    
    it('should reject items with zero quantity', () => {
      const items = [{ productId: 'prod_1', quantity: 0 }]
      expect(() => validateOrderItems(items)).toThrow('Quantity must be greater than 0')
    })
    
    it('should reject items without productId', () => {
      const items = [{ productId: '', quantity: 1 }]
      expect(() => validateOrderItems(items)).toThrow('Product ID is required')
    })
  })
  
  describe('validateTableNumber', () => {
    it('should accept valid table number for dine-in', () => {
      expect(validateTableNumber('A1', 'DINE_IN')).toBe(true)
    })
    
    it('should reject empty table number for dine-in', () => {
      expect(() => validateTableNumber('', 'DINE_IN'))
        .toThrow('Nomor meja wajib diisi untuk Dine-in')
    })
    
    it('should accept empty table number for takeaway', () => {
      expect(validateTableNumber('', 'TAKEAWAY')).toBe(true)
    })
  })
  
  describe('validateCustomerName', () => {
    it('should accept valid customer name', () => {
      expect(validateCustomerName('John Doe')).toBe(true)
    })
    
    it('should reject empty customer name', () => {
      expect(() => validateCustomerName(''))
        .toThrow('Nama customer wajib diisi')
    })
    
    it('should reject whitespace-only customer name', () => {
      expect(() => validateCustomerName('   '))
        .toThrow('Nama customer wajib diisi')
    })
  })
  
  describe('validateSessionId', () => {
    it('should accept valid UUID v4', () => {
      const uuid = crypto.randomUUID()
      expect(validateSessionId(uuid)).toBe(true)
    })
    
    it('should reject invalid UUID format', () => {
      expect(() => validateSessionId('invalid-uuid'))
        .toThrow('Invalid session ID format')
    })
    
    it('should reject empty session ID', () => {
      expect(() => validateSessionId(''))
        .toThrow('Session ID is required')
    })
  })
})
```

#### 2. Cart Management Functions

**Test File**: `/lib/__tests__/cart.test.ts`

```typescript
describe('Cart Management', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  
  describe('addToCart', () => {
    it('should add new item to empty cart', () => {
      const product = { id: 'prod_1', name: 'Nasi Goreng', price: 25000, stock: 10 }
      const cart = addToCart([], product)
      
      expect(cart).toHaveLength(1)
      expect(cart[0]).toEqual({
        productId: 'prod_1',
        name: 'Nasi Goreng',
        price: 25000,
        quantity: 1
      })
    })
    
    it('should increment quantity for existing item', () => {
      const existingCart = [{
        productId: 'prod_1',
        name: 'Nasi Goreng',
        price: 25000,
        quantity: 1
      }]
      const product = { id: 'prod_1', name: 'Nasi Goreng', price: 25000, stock: 10 }
      const cart = addToCart(existingCart, product)
      
      expect(cart).toHaveLength(1)
      expect(cart[0].quantity).toBe(2)
    })
    
    it('should throw error when stock is insufficient', () => {
      const existingCart = [{
        productId: 'prod_1',
        name: 'Nasi Goreng',
        price: 25000,
        quantity: 5
      }]
      const product = { id: 'prod_1', name: 'Nasi Goreng', price: 25000, stock: 5 }
      
      expect(() => addToCart(existingCart, product))
        .toThrow('Stok tidak cukup')
    })
    
    it('should throw error when product is out of stock', () => {
      const product = { id: 'prod_1', name: 'Nasi Goreng', price: 25000, stock: 0 }
      
      expect(() => addToCart([], product))
        .toThrow('Produk habis')
    })
  })
  
  describe('calculateTotal', () => {
    it('should calculate correct total for single item', () => {
      const cart = [{
        productId: 'prod_1',
        name: 'Nasi Goreng',
        price: 25000,
        quantity: 2
      }]
      
      expect(calculateTotal(cart)).toBe(50000)
    })
    
    it('should calculate correct total for multiple items', () => {
      const cart = [
        { productId: 'prod_1', name: 'Nasi Goreng', price: 25000, quantity: 2 },
        { productId: 'prod_2', name: 'Es Teh', price: 5000, quantity: 3 }
      ]
      
      expect(calculateTotal(cart)).toBe(65000)
    })
    
    it('should return 0 for empty cart', () => {
      expect(calculateTotal([])).toBe(0)
    })
  })
})
```

#### 3. React Component Tests

**Test File**: `/components/__tests__/CustomerNavbar.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import CustomerNavbar from '@/components/navbar/CustomerNavbar'

describe('CustomerNavbar', () => {
  it('should display restaurant name', () => {
    render(<CustomerNavbar />)
    expect(screen.getByText('Resto Iga Bakar')).toBeInTheDocument()
  })
  
  it('should display table badge for dine-in', () => {
    render(<CustomerNavbar tableNumber="A1" />)
    expect(screen.getByText('Meja A1')).toBeInTheDocument()
  })
  
  it('should display takeaway badge', () => {
    render(<CustomerNavbar isTakeaway={true} />)
    expect(screen.getByText('Takeaway')).toBeInTheDocument()
  })
  
  it('should not display badge when no table or takeaway', () => {
    render(<CustomerNavbar />)
    expect(screen.queryByText(/Meja/)).not.toBeInTheDocument()
    expect(screen.queryByText('Takeaway')).not.toBeInTheDocument()
  })
})
```

**Test File**: `/components/__tests__/CartSidebar.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import CartSidebar from '@/components/CartSidebar'

describe('CartSidebar', () => {
  const mockCart = [
    { productId: 'prod_1', name: 'Nasi Goreng', price: 25000, quantity: 2 },
    { productId: 'prod_2', name: 'Es Teh', price: 5000, quantity: 1 }
  ]
  
  it('should display cart items', () => {
    render(
      <CartSidebar
        cart={mockCart}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={jest.fn()}
        onCheckout={jest.fn()}
      />
    )
    
    expect(screen.getByText('Nasi Goreng')).toBeInTheDocument()
    expect(screen.getByText('Es Teh')).toBeInTheDocument()
  })
  
  it('should display correct total', () => {
    render(
      <CartSidebar
        cart={mockCart}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={jest.fn()}
        onCheckout={jest.fn()}
      />
    )
    
    expect(screen.getByText('Rp 55.000')).toBeInTheDocument()
  })
  
  it('should call onUpdateQuantity when quantity changed', () => {
    const onUpdateQuantity = jest.fn()
    render(
      <CartSidebar
        cart={mockCart}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={jest.fn()}
        onCheckout={jest.fn()}
      />
    )
    
    const incrementButton = screen.getAllByRole('button', { name: '+' })[0]
    fireEvent.click(incrementButton)
    
    expect(onUpdateQuantity).toHaveBeenCalledWith('prod_1', 3)
  })
  
  it('should call onRemoveItem when remove button clicked', () => {
    const onRemoveItem = jest.fn()
    render(
      <CartSidebar
        cart={mockCart}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={onRemoveItem}
        onCheckout={jest.fn()}
      />
    )
    
    const removeButtons = screen.getAllByRole('button', { name: /hapus/i })
    fireEvent.click(removeButtons[0])
    
    expect(onRemoveItem).toHaveBeenCalledWith('prod_1')
  })
  
  it('should display empty state when cart is empty', () => {
    render(
      <CartSidebar
        cart={[]}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={jest.fn()}
        onCheckout={jest.fn()}
      />
    )
    
    expect(screen.getByText(/keranjang kosong/i)).toBeInTheDocument()
  })
})
```

### Integration Testing

#### 1. API Endpoint Tests

**Test File**: `/app/api/__tests__/orders.test.ts`

```typescript
import { POST, GET } from '@/app/api/orders/route'
import { prisma } from '@/lib/prisma'

describe('POST /api/orders', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
  })
  
  it('should create order for anonymous customer', async () => {
    // Create test product
    const product = await prisma.product.create({
      data: {
        name: 'Nasi Goreng',
        price: 25000,
        stock: 10,
        isActive: true
      }
    })
    
    const request = new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: product.id, quantity: 2 }],
        orderType: 'DINE_IN',
        tableNumber: 'A1',
        customerName: 'John Doe',
        session_id: crypto.randomUUID()
      })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.orderNumber).toBeDefined()
    expect(data.totalAmount).toBe(50000)
    expect(data.items).toHaveLength(1)
  })
  
  it('should reject order with insufficient stock', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Nasi Goreng',
        price: 25000,
        stock: 1,
        isActive: true
      }
    })
    
    const request = new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: product.id, quantity: 5 }],
        orderType: 'DINE_IN',
        tableNumber: 'A1',
        customerName: 'John Doe',
        session_id: crypto.randomUUID()
      })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toContain('Stok tidak cukup')
  })
  
  it('should reject order without customer name', async () => {
    const request = new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: 'prod_1', quantity: 1 }],
        orderType: 'DINE_IN',
        tableNumber: 'A1',
        session_id: crypto.randomUUID()
      })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toContain('Nama customer wajib diisi')
  })
  
  it('should update product stock after order creation', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Nasi Goreng',
        price: 25000,
        stock: 10,
        isActive: true
      }
    })
    
    const request = new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: product.id, quantity: 3 }],
        orderType: 'DINE_IN',
        tableNumber: 'A1',
        customerName: 'John Doe',
        session_id: crypto.randomUUID()
      })
    })
    
    await POST(request)
    
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id }
    })
    
    expect(updatedProduct?.stock).toBe(7)
  })
})

describe('GET /api/orders/[session_id]/status', () => {
  it('should return order status for valid session', async () => {
    const sessionId = crypto.randomUUID()
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-TEST-001',
        session_id: sessionId,
        customerName: 'John Doe',
        status: 'IN_KITCHEN',
        payment_status: 'PAID',
        totalAmount: 50000,
        orderType: 'DINE_IN'
      }
    })
    
    const request = new Request(`http://localhost/api/orders/${sessionId}/status`)
    const response = await GET(request, { params: { session_id: sessionId } })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.status).toBe('IN_KITCHEN')
    expect(data.payment_status).toBe('PAID')
  })
  
  it('should return 404 for invalid session', async () => {
    const request = new Request('http://localhost/api/orders/invalid-session/status')
    const response = await GET(request, { params: { session_id: 'invalid-session' } })
    
    expect(response.status).toBe(404)
  })
})
```

**Test File**: `/app/api/__tests__/kasir-orders.test.ts`

```typescript
describe('GET /api/kasir/orders', () => {
  it('should return orders with IN_KITCHEN status', async () => {
    // Create test orders
    await prisma.order.createMany({
      data: [
        {
          orderNumber: 'ORD-001',
          customerName: 'John',
          status: 'IN_KITCHEN',
          payment_status: 'PAID',
          payment_method: 'QRIS',
          totalAmount: 50000,
          orderType: 'DINE_IN'
        },
        {
          orderNumber: 'ORD-002',
          customerName: 'Jane',
          status: 'READY',
          payment_status: 'UNPAID',
          payment_method: 'CASH',
          totalAmount: 30000,
          orderType: 'DINE_IN'
        }
      ]
    })
    
    const request = new Request('http://localhost/api/kasir/orders', {
      headers: {
        Cookie: `token=${validKasirToken}`
      }
    })
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].status).toBe('IN_KITCHEN')
  })
  
  it('should reject unauthorized access', async () => {
    const request = new Request('http://localhost/api/kasir/orders')
    const response = await GET(request)
    
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/orders/[id]/status', () => {
  it('should update order status to READY', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-001',
        customerName: 'John',
        status: 'IN_KITCHEN',
        payment_status: 'PAID',
        totalAmount: 50000,
        orderType: 'DINE_IN'
      }
    })
    
    const request = new Request(`http://localhost/api/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: {
        Cookie: `token=${validKasirToken}`
      },
      body: JSON.stringify({ status: 'READY' })
    })
    
    const response = await PATCH(request, { params: { id: order.id } })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.status).toBe('READY')
  })
})

describe('PATCH /api/orders/[id]/confirm-payment', () => {
  it('should confirm cash payment and complete order', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-001',
        customerName: 'John',
        status: 'READY',
        payment_status: 'UNPAID',
        payment_method: 'CASH',
        totalAmount: 50000,
        orderType: 'DINE_IN'
      }
    })
    
    const request = new Request(`http://localhost/api/orders/${order.id}/confirm-payment`, {
      method: 'PATCH',
      headers: {
        Cookie: `token=${validKasirToken}`
      }
    })
    
    const response = await PATCH(request, { params: { id: order.id } })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.status).toBe('COMPLETED')
    expect(data.payment_status).toBe('PAID')
  })
})
```

### End-to-End Testing

#### E2E Test Scenarios

**Test File**: `/e2e/customer-order-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Customer Order Flow - QRIS Payment', () => {
  test('should complete full order flow with QRIS payment', async ({ page }) => {
    // 1. Scan QR code (simulate by visiting URL)
    await page.goto('/menu?table=A1&token=test-token-123')
    
    // 2. Verify table badge is displayed
    await expect(page.getByText('Meja A1')).toBeVisible()
    
    // 3. Add items to cart
    await page.getByRole('button', { name: 'Tambah' }).first().click()
    await page.getByRole('button', { name: 'Tambah' }).nth(1).click()
    
    // 4. Verify cart count
    await expect(page.getByText('2 item')).toBeVisible()
    
    // 5. Go to checkout
    await page.getByRole('button', { name: 'Checkout' }).click()
    
    // 6. Fill customer information
    await page.getByLabel('Nama Customer').fill('John Doe')
    await page.getByLabel('Catatan Khusus').fill('Tidak pakai sambal')
    
    // 7. Proceed to payment
    await page.getByRole('button', { name: 'Lanjut ke Pembayaran' }).click()
    
    // 8. Select QRIS payment
    await page.getByRole('button', { name: 'QRIS' }).click()
    
    // 9. Verify QRIS code is displayed
    await expect(page.getByText(/QRIS/i)).toBeVisible()
    
    // 10. Confirm payment
    await page.getByRole('button', { name: 'Saya Sudah Bayar' }).click()
    
    // 11. Verify order confirmation
    await expect(page.getByText(/Pesanan sedang diproses/i)).toBeVisible()
    
    // 12. Wait for status update (polling)
    await page.waitForTimeout(6000)
    
    // 13. Verify order status changed
    await expect(page.getByText(/IN_KITCHEN|READY/i)).toBeVisible()
  })
})

test.describe('Customer Order Flow - Cash Payment', () => {
  test('should complete full order flow with cash payment', async ({ page }) => {
    // 1-7: Same as QRIS flow
    await page.goto('/menu?table=A1&token=test-token-123')
    await page.getByRole('button', { name: 'Tambah' }).first().click()
    await page.getByRole('button', { name: 'Checkout' }).click()
    await page.getByLabel('Nama Customer').fill('Jane Doe')
    await page.getByRole('button', { name: 'Lanjut ke Pembayaran' }).click()
    
    // 8. Select Cash payment
    await page.getByRole('button', { name: 'Cash' }).click()
    
    // 9. Verify order confirmation
    await expect(page.getByText(/Pesanan sedang diproses/i)).toBeVisible()
    await expect(page.getByText(/Silakan siapkan pembayaran cash/i)).toBeVisible()
    
    // 10. Wait for Kasir to mark as READY (simulated)
    // In real test, this would be done by Kasir in parallel
    await page.waitForTimeout(6000)
    
    // 11. Verify "Pesanan siap" message
    await expect(page.getByText(/Pesanan siap/i)).toBeVisible()
  })
})

test.describe('Kasir Dashboard', () => {
  test('should process order and confirm cash payment', async ({ page }) => {
    // 1. Login as Kasir
    await page.goto('/login')
    await page.getByLabel('Email').fill('kasir@test.com')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Login' }).click()
    
    // 2. Navigate to Kasir dashboard
    await page.goto('/kasir')
    
    // 3. Verify order appears in queue
    await expect(page.getByText('ORD-')).toBeVisible()
    
    // 4. Mark order as ready
    await page.getByRole('button', { name: 'Selesai Dibuat' }).first().click()
    
    // 5. Verify order moved to ready state
    await expect(page.getByText('READY')).toBeVisible()
    
    // 6. Confirm cash payment
    await page.getByRole('button', { name: 'Konfirmasi Pembayaran Cash' }).click()
    
    // 7. Verify order completed
    await expect(page.getByText('COMPLETED')).toBeVisible()
  })
})
```

### Manual Testing Checklist

#### QR Code Flow
- [ ] Generate QR code for table
- [ ] Scan QR code with mobile device
- [ ] Verify table number appears in navbar
- [ ] Verify session persists after page refresh

#### Menu Browsing
- [ ] Filter by category (ALL, MAKANAN, MINUMAN)
- [ ] Add items to cart
- [ ] Update item quantity in cart
- [ ] Remove items from cart
- [ ] Verify cart persists in localStorage

#### Checkout Flow
- [ ] Verify customer name validation
- [ ] Verify table number validation for dine-in
- [ ] Switch between dine-in and takeaway
- [ ] Add special notes
- [ ] Verify order summary calculation

#### QRIS Payment
- [ ] Select QRIS payment method
- [ ] Verify QRIS code displays
- [ ] Click "Saya Sudah Bayar"
- [ ] Verify order status updates to IN_KITCHEN
- [ ] Verify payment timeout after 10 minutes

#### Cash Payment
- [ ] Select Cash payment method
- [ ] Verify order goes to Kasir queue immediately
- [ ] Verify order status updates in real-time
- [ ] Verify "Pesanan siap" message when READY

#### Kasir Dashboard
- [ ] Login as Kasir user
- [ ] Verify orders appear in queue
- [ ] Verify QRIS badge (green) for paid orders
- [ ] Verify CASH badge (orange) for unpaid orders
- [ ] Mark order as READY
- [ ] Confirm cash payment
- [ ] Verify order disappears from queue when COMPLETED

#### Admin Dashboard
- [ ] Login as Admin user
- [ ] View all orders
- [ ] Filter by status, payment method, table
- [ ] View order details
- [ ] Generate QR codes
- [ ] Reset table status manually

#### Error Scenarios
- [ ] Scan invalid QR code
- [ ] Try to use occupied table
- [ ] Add out-of-stock item to cart
- [ ] Submit order with empty cart
- [ ] Submit order without customer name
- [ ] Network error during checkout
- [ ] Payment timeout

### Performance Testing

#### Load Testing Scenarios

1. **Concurrent Orders**: Simulate 50 concurrent customers placing orders
2. **Polling Load**: Test 100 clients polling order status simultaneously
3. **Database Performance**: Measure query performance with 10,000+ orders
4. **Cart Operations**: Test localStorage performance with large carts (50+ items)

#### Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Page Load Time | < 2s | < 5s |
| API Response Time | < 500ms | < 2s |
| Order Creation | < 1s | < 3s |
| Polling Interval | 5s | 10s |
| Database Query | < 100ms | < 500ms |

### Test Coverage Goals

- **Unit Tests**: > 80% code coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: All critical user flows covered
- **Manual Tests**: All error scenarios verified


## Security Considerations

### Authentication and Authorization

#### Middleware Configuration

```typescript
// middleware.ts

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const pathname = request.nextUrl.pathname
  
  // Public routes (no authentication required)
  const publicRoutes = [
    "/menu",
    "/checkout",
    "/payment",
    "/receipt",
    "/cart",
    "/login",
    "/register",
    "/"
  ]
  
  // Public API routes
  const publicApiRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/products",
    "/api/orders"
  ]
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route)) ||
      publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Protected routes require authentication
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  try {
    const payload = await verifyToken(token)
    
    // Role-based access control
    if (pathname.startsWith("/kasir") && payload.role !== "KASIR" && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    
    if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}
```

#### API Route Protection

```typescript
// Example: /app/api/kasir/orders/route.ts

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const user = await getCurrentUser(token)
  
  if (!user || (user.role !== "KASIR" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  // Proceed with request
}
```

### Input Validation and Sanitization

#### SQL Injection Prevention

- **Use Prisma ORM**: All database queries use Prisma's parameterized queries
- **No raw SQL**: Avoid `prisma.$queryRaw` unless absolutely necessary
- **Input validation**: Validate all user inputs before database operations

```typescript
// Safe: Prisma parameterized query
const order = await prisma.order.findUnique({
  where: { id: orderId }
})

// Unsafe: Raw SQL (avoid)
// const order = await prisma.$queryRaw`SELECT * FROM orders WHERE id = ${orderId}`
```

#### XSS Prevention

- **React escaping**: React automatically escapes JSX content
- **Sanitize HTML**: Use DOMPurify for any user-generated HTML
- **Content Security Policy**: Set CSP headers to prevent inline scripts

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ]
  }
}
```

#### CSRF Protection

- **SameSite cookies**: Set `SameSite=Lax` for authentication cookies
- **Token validation**: Verify JWT tokens on every protected request

```typescript
// lib/auth.ts
export function setAuthCookie(token: string, response: NextResponse) {
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}
```

### Data Privacy

#### Anonymous Session Data

- **No PII in localStorage**: Only store session_id, cart, and table number
- **Session expiration**: Clear session data after order completion
- **No tracking**: Do not track customer behavior across sessions

```typescript
// Clear session data after order completion
function clearSessionData() {
  localStorage.removeItem('cart')
  localStorage.removeItem('session_id')
  localStorage.removeItem('tableNumber')
  localStorage.removeItem('orderType')
}
```

#### Password Security

- **Bcrypt hashing**: Hash all passwords with bcrypt (cost factor: 10)
- **No password in logs**: Never log passwords or tokens
- **Secure password reset**: Implement time-limited reset tokens

```typescript
import bcrypt from 'bcryptjs'

// Hash password
const hashedPassword = await bcrypt.hash(password, 10)

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword)
```

### QR Code Security

#### Token Generation

```typescript
// Generate secure random token for QR code
import crypto from 'crypto'

function generateQRToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
```

#### Token Validation

```typescript
// Validate QR code token
async function validateQRCode(tableId: string, token: string): Promise<boolean> {
  const table = await prisma.table.findUnique({
    where: { id: tableId }
  })
  
  if (!table) {
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(table.qr_token),
    Buffer.from(token)
  )
}
```

#### QR Code URL Format

```
https://domain.com/menu?table={table_id}&token={qr_token}
```

**Security Measures**:
- Use HTTPS in production
- Token is 64-character hex string (256 bits of entropy)
- Token is unique per table and stored in database
- Token validation happens server-side

### Rate Limiting

#### API Rate Limiting

```typescript
// lib/rateLimit.ts
import { LRUCache } from 'lru-cache'

type RateLimitOptions = {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max unique tokens per interval
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000
  })
  
  return {
    check: (limit: number, token: string) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0]
      if (tokenCount[0] === 0) {
        tokenCache.set(token, tokenCount)
      }
      tokenCount[0] += 1
      
      const currentUsage = tokenCount[0]
      const isRateLimited = currentUsage >= limit
      
      return {
        success: !isRateLimited,
        limit,
        remaining: limit - currentUsage,
        reset: Date.now() + options.interval
      }
    }
  }
}

// Usage in API route
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
})

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success, limit, remaining, reset } = await limiter.check(10, ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        }
      }
    )
  }
  
  // Process request
}
```

#### Rate Limit Targets

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/orders | 10 requests | 1 minute |
| POST /api/auth/login | 5 requests | 5 minutes |
| GET /api/products | 100 requests | 1 minute |
| GET /api/orders/[id]/status | 60 requests | 1 minute |

### Payment Security

#### Xendit Integration Security

```typescript
// lib/xendit.ts

// Store API key in environment variable
const XENDIT_API_KEY = process.env.XENDIT_API_KEY

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookToken: string
): boolean {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', webhookToken)
  hmac.update(payload)
  const digest = hmac.digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  )
}

// Handle Xendit webhook
export async function handleXenditWebhook(request: NextRequest) {
  const signature = request.headers.get('x-callback-token')
  const payload = await request.text()
  
  if (!signature || !verifyWebhookSignature(payload, signature, XENDIT_WEBHOOK_TOKEN)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // Process webhook
}
```

#### Payment Data Handling

- **No card data storage**: Never store credit card information
- **PCI DSS compliance**: Use Xendit for payment processing (PCI compliant)
- **Transaction logging**: Log all payment transactions for audit trail
- **Idempotency**: Implement idempotency keys to prevent duplicate charges

### Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="mysql://user:password@localhost:3306/database"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-secret-key-here"

# Xendit API Keys
XENDIT_API_KEY="xnd_development_..."
XENDIT_WEBHOOK_TOKEN="your-webhook-token"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Security Rules**:
- Never commit `.env` file to version control
- Use different secrets for development and production
- Rotate secrets regularly
- Use strong, randomly generated secrets

### Logging and Monitoring

#### Security Event Logging

```typescript
// Log security events
logger.warn('Failed login attempt', {
  email: email,
  ip: request.ip,
  timestamp: new Date().toISOString()
})

logger.warn('Invalid QR code access', {
  tableId: tableId,
  token: token.substring(0, 8) + '...', // Partial token for debugging
  ip: request.ip,
  timestamp: new Date().toISOString()
})

logger.error('Payment verification failed', {
  orderId: orderId,
  transactionId: transactionId,
  reason: 'Signature mismatch',
  timestamp: new Date().toISOString()
})
```

#### Monitoring Alerts

Set up alerts for:
- Multiple failed login attempts from same IP
- Unusual order patterns (e.g., 100 orders in 1 minute)
- Payment failures
- Database connection errors
- API rate limit violations

## Implementation Notes

### Development Workflow

#### Phase 1: Database Schema Updates
1. Update Prisma schema with new tables and fields
2. Create migration: `npx prisma migrate dev --name add-qr-table-ordering`
3. Run migration: `npx prisma migrate deploy`
4. Generate Prisma client: `npx prisma generate`
5. Seed test data: `npx prisma db seed`

#### Phase 2: Backend API Development
1. Implement table management endpoints
2. Update order creation endpoint for anonymous users
3. Implement Kasir order queue endpoint
4. Implement order status update endpoints
5. Implement payment confirmation endpoint
6. Add QR code validation logic
7. Add session management logic

#### Phase 3: Frontend Development
1. Update menu page for QR code parameter handling
2. Update checkout page for anonymous orders
3. Create payment page with QRIS/Cash selection
4. Create receipt page
5. Create Kasir dashboard
6. Update Admin dashboard with QR generator
7. Implement real-time polling service

#### Phase 4: Integration
1. Integrate Xendit placeholder
2. Test payment flows end-to-end
3. Test real-time updates
4. Test table status management
5. Test error scenarios

#### Phase 5: Testing and Deployment
1. Write unit tests
2. Write integration tests
3. Perform manual testing
4. Fix bugs
5. Deploy to staging
6. Perform UAT
7. Deploy to production

### Migration Strategy

#### Backward Compatibility

The system must maintain backward compatibility with existing authenticated user orders:

```typescript
// Support both authenticated and anonymous orders
const order = await prisma.order.create({
  data: {
    orderNumber: generateOrderNumber(),
    userId: userId || null, // Optional for anonymous
    session_id: sessionId || null, // Optional for authenticated
    customerName: customerName || null, // Required for anonymous
    // ... other fields
  }
})
```

#### Data Migration

If deploying to existing system with orders:

```sql
-- Add new columns with default values
ALTER TABLE orders ADD COLUMN session_id VARCHAR(255) NULL;
ALTER TABLE orders ADD COLUMN table_id VARCHAR(255) NULL;
ALTER TABLE orders ADD COLUMN payment_status ENUM('UNPAID', 'PAID', 'FAILED') DEFAULT 'PAID';
ALTER TABLE orders ADD COLUMN payment_method ENUM('CASH', 'QRIS', 'EDC') NULL;

-- Update existing orders to have PAID status
UPDATE orders SET payment_status = 'PAID' WHERE payment_status IS NULL;

-- Create tables table
CREATE TABLE tables (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  qr_token VARCHAR(255) UNIQUE NOT NULL,
  status ENUM('AVAILABLE', 'OCCUPIED') DEFAULT 'AVAILABLE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Deployment Checklist

#### Pre-Deployment
- [ ] Run all tests (unit, integration, E2E)
- [ ] Update environment variables
- [ ] Generate production JWT secret
- [ ] Configure Xendit production API keys
- [ ] Set up database backups
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Review security configurations

#### Deployment
- [ ] Deploy database migrations
- [ ] Deploy backend code
- [ ] Deploy frontend code
- [ ] Verify health checks
- [ ] Test critical flows
- [ ] Monitor error logs

#### Post-Deployment
- [ ] Generate QR codes for all tables
- [ ] Print and place QR codes on tables
- [ ] Train Kasir staff on new dashboard
- [ ] Train Admin on QR code management
- [ ] Monitor system performance
- [ ] Collect user feedback

### Performance Optimization

#### Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_tables_status ON tables(status);

-- Composite index for Kasir queue
CREATE INDEX idx_orders_kasir_queue ON orders(status, payment_status, created_at);
```

#### Caching Strategy

```typescript
// Cache product list (rarely changes)
const PRODUCT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

let productCache: { data: Product[], timestamp: number } | null = null

export async function getProducts() {
  const now = Date.now()
  
  if (productCache && (now - productCache.timestamp) < PRODUCT_CACHE_TTL) {
    return productCache.data
  }
  
  const products = await prisma.product.findMany({
    where: { isActive: true }
  })
  
  productCache = { data: products, timestamp: now }
  return products
}
```

#### Frontend Optimization

- **Code splitting**: Use dynamic imports for heavy components
- **Image optimization**: Use Next.js Image component
- **Lazy loading**: Load images and components on demand
- **Memoization**: Use React.memo for expensive components
- **Debouncing**: Debounce search and filter inputs

```typescript
// Example: Lazy load payment page
const PaymentPage = dynamic(() => import('./payment/[orderId]/page'), {
  loading: () => <Loading message="Memuat halaman pembayaran..." />
})
```

### Monitoring and Analytics

#### Key Metrics to Track

1. **Order Metrics**:
   - Orders per hour/day
   - Average order value
   - Order completion rate
   - Payment method distribution

2. **Performance Metrics**:
   - API response times
   - Page load times
   - Database query times
   - Polling frequency

3. **Error Metrics**:
   - Failed orders
   - Payment failures
   - QR code validation failures
   - API errors

4. **User Metrics**:
   - Active sessions
   - Cart abandonment rate
   - Average time to checkout
   - Table occupancy rate

#### Analytics Implementation

```typescript
// lib/analytics.ts

export function trackEvent(event: string, properties?: Record<string, any>) {
  // Send to analytics service (e.g., Google Analytics, Mixpanel)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, properties)
  }
}

// Usage
trackEvent('order_created', {
  order_id: order.id,
  order_type: order.orderType,
  payment_method: order.payment_method,
  total_amount: order.totalAmount,
  items_count: order.items.length
})

trackEvent('payment_confirmed', {
  order_id: order.id,
  payment_method: order.payment_method,
  amount: order.totalAmount
})
```

## Conclusion

This design document provides a comprehensive blueprint for implementing the QR Code Table Ordering System. The system enables frictionless ordering for customers while providing efficient order management tools for Kasir staff and comprehensive monitoring for Admin users.

### Key Design Decisions

1. **Anonymous Sessions**: Using localStorage-based sessions with server-side validation provides a seamless customer experience without requiring authentication
2. **Dual Payment Methods**: Supporting both QRIS and Cash accommodates different customer preferences and payment capabilities
3. **Role Separation**: Clear separation between Kasir (order processing) and Admin (monitoring) roles improves operational efficiency
4. **Real-time Updates**: 5-second polling provides near-real-time order status updates without WebSocket complexity
5. **Table Management**: QR code-based table identification with occupancy tracking prevents concurrent session conflicts

### Next Steps

1. Review and approve this design document
2. Proceed to task breakdown and implementation planning
3. Set up development environment and database
4. Begin implementation following the phased approach outlined above
5. Conduct thorough testing at each phase
6. Deploy to staging for UAT
7. Deploy to production with monitoring

