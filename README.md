# Resto Iga Bakar - Sistem Informasi Manajemen Restoran

Sistem informasi manajemen restoran berbasis web dengan Next.js, TypeScript, dan MySQL.

## Fitur

### User
- Melihat dan memilih produk
- Keranjang belanja
- Checkout
- Pembayaran (Tunai, QRIS)
- Menerima e-struk setelah pembayaran

### Admin
- Dashboard monitoring:
  - Stok produk
  - Produk terjual
  - Total penjualan harian dan bulanan
- CRUD produk (Create, Read, Update, Delete)

### Kasir
- Menerima orderan dari queue
- Konfirmasi pembayaran
- Print struk pesanan untuk kitchen
- Orderan diurutkan berdasarkan nomor order

## Tech Stack

- **Frontend & Backend**: Next.js 16 dengan TypeScript
- **Database**: MySQL dengan Prisma ORM
- **Authentication**: JWT (JSON Web Token)
- **Styling**: Tailwind CSS
- **Payment Gateway**: Midtrans Snap
- **Image Storage**: Cloudinary

---

## Panduan Setup dari Awal

Ikuti langkah-langkah berikut secara berurutan untuk menjalankan project ini di lingkungan lokal.

### Prasyarat

Pastikan perangkat Anda sudah terinstall:

| Perangkat | Versi Minimal | Link Download |
|---|---|---|
| **Node.js** | v18.x atau lebih baru | https://nodejs.org |
| **MySQL** | v8.0 | https://dev.mysql.com/downloads/ |
| **Git** | Terbaru | https://git-scm.com |

---

### Langkah 1 — Clone Repository

```bash
git clone https://github.com/username/resto-iga-bakar.git
cd resto-iga-bakar
```

---

### Langkah 2 — Install Dependencies

```bash
npm install
```

---

### Langkah 3 — Konfigurasi Environment Variables

Salin file contoh environment dan sesuaikan isinya:

```bash
# Windows (Command Prompt / PowerShell)
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Buka file `.env` dan isi setiap variabel yang dibutuhkan:

```env
# === DATABASE ===
# Ganti 'root' dan 'password' dengan kredensial MySQL Anda
DATABASE_URL="mysql://root:password@localhost:3306/resto_iga_bakar"

# === JWT SECRET ===
# Isi dengan string acak yang panjang dan aman (min. 32 karakter)
JWT_SECRET="ganti-dengan-string-rahasia-anda-minimal-32-karakter"

# === MIDTRANS (Payment Gateway) ===
# Daftar akun Sandbox di https://dashboard.sandbox.midtrans.com
# Ambil key di: Settings > Access Keys
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false

# === CLOUDINARY (Upload Gambar Produk) ===
# Daftar akun gratis di https://cloudinary.com
CLOUDINARY_CLOUD_NAME="nama_cloud_anda"
CLOUDINARY_UPLOAD_PRESET="nama_upload_preset_anda"

# === WHATSAPP (Opsional) ===
WA_PHONE_NUMBER_ID=your_phone_number_id
WA_ACCESS_TOKEN=your_whatsapp_access_token

# === LAINNYA ===
PAYMENT_TIMEOUT_MINUTES=10
BYPASS_PREORDER_PICKUP_TIME=true
NEXT_PUBLIC_BYPASS_PREORDER_PICKUP_TIME=true
```

> **Catatan:** Variabel `MIDTRANS_*` dan `CLOUDINARY_*` wajib diisi agar fitur pembayaran dan upload gambar produk dapat berfungsi.

---

### Langkah 4 — Setup Database MySQL

#### 4a. Buat Database

Login ke MySQL dan buat database baru:

```sql
-- Login ke MySQL
mysql -u root -p

-- Buat database
CREATE DATABASE resto_iga_bakar;
EXIT;
```

#### 4b. Fix Authentication MySQL 8.0+ (jika perlu)

Jika Anda mendapatkan error `Unknown authentication plugin 'sha256_password'` atau `caching_sha2_password`, jalankan perintah berikut di MySQL:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password_anda';
FLUSH PRIVILEGES;
```

---

### Langkah 5 — Setup Prisma ORM

```bash
# Generate Prisma Client dari schema
npx prisma generate

# Jalankan migrasi untuk membuat struktur tabel di database
npx prisma migrate dev --name init
```

Pastikan output migrasi menampilkan pesan sukses tanpa error.

---

### Langkah 6 — Import Data Awal (Seed)

Import data awal seperti akun admin, kasir, dan contoh produk:

```bash
npm run seed
```

**Akun default setelah seed:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@resto.com | admin123 |
| Kasir | kasir@resto.com | kasir123 |
| User | user1@example.com | user123 |

---

### Langkah 7 — Jalankan Development Server

```bash
npm run dev
```

Buka browser dan akses: **http://localhost:3000**

---

### Ringkasan Perintah Setup

Jika semua prasyarat sudah terpenuhi dan database sudah ada, berikut urutan perintah lengkapnya:

```bash
# 1. Clone & masuk ke direktori
git clone https://github.com/username/resto-iga-bakar.git
cd resto-iga-bakar

# 2. Install dependencies
npm install

# 3. Salin dan isi file environment
copy .env.example .env
# Edit file .env sesuai konfigurasi Anda

# 4. Setup Prisma & database
npx prisma generate
npx prisma migrate dev --name init

# 5. Isi data awal
npm run seed

# 6. Jalankan aplikasi
npm run dev
```

---

## Scripts yang Tersedia

| Script | Perintah | Fungsi |
|---|---|---|
| Development | `npm run dev` | Menjalankan server pengembangan lokal |
| Build | `npm run build` | Membuild aplikasi untuk production |
| Start | `npm run start` | Menjalankan aplikasi hasil build |
| Prisma Generate | `npm run db:generate` | Generate ulang Prisma Client |
| Prisma Migrate | `npm run db:migrate` | Menjalankan migrasi database |
| Prisma Studio | `npm run db:studio` | Membuka GUI database Prisma |
| DB Push | `npm run db:push` | Push schema ke database tanpa migrasi |
| Seed | `npm run seed` | Mengisi data awal ke database |
| Test | `npm run test` | Menjalankan semua unit test |
| Test Coverage | `npm run test:coverage` | Menjalankan test dengan laporan coverage |
| Test UI | `npm run test:ui` | Menjalankan test dengan tampilan UI |

---

## Database Schema

- **User**: Admin, Kasir, User
- **Product**: Produk dengan stok
- **Order**: Order dengan status (PENDING_PAYMENT, PENDING, CONFIRMED, PREPARING, IN_KITCHEN, READY, COMPLETED, CANCELLED)
- **OrderItem**: Item dalam order
- **Payment**: Pembayaran dengan metode (CASH, QRIS)
- **StockHistory**: History perubahan stok
- **AuditLog**: Log aktivitas sistem
- **SystemSetting**: Pengaturan sistem
- **CampaignBanner**: Banner promosi

---

## API Routes

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (Admin only)
- `GET /api/products/[id]` - Get single product
- `PUT /api/products/[id]` - Update product (Admin only)
- `DELETE /api/products/[id]` - Delete product (Admin only)

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get single order
- `PUT /api/orders/[id]` - Update order status

### Payments
- `POST /api/payments` - Create payment

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (Admin only)

### Kasir
- `GET /api/kitchen/orders` - Get kitchen orders (Kasir/Admin)

---

## Catatan Penting

1. **Payment System**: Sistem pembayaran menggunakan Midtrans Snap. Gunakan mode Sandbox untuk pengembangan.

2. **Security**: Wajib mengubah `JWT_SECRET` di production dengan nilai acak yang panjang dan aman.

3. **Database**: Pastikan backup database dilakukan secara berkala sebelum menjalankan migrasi baru.

4. **Cloudinary**: Upload gambar produk membutuhkan konfigurasi Cloudinary yang valid.

---

## License

MIT
