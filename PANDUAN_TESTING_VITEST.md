# 🧪 Panduan Testing dengan Vitest - Resto Iga Bakar

Panduan lengkap untuk menjalankan dan memahami testing di project Resto Iga Bakar menggunakan **Vitest**.

---

## 📋 Daftar Isi

1. [Tentang Testing](#tentang-testing)
2. [Cara Menjalankan Test](#cara-menjalankan-test)
3. [Memahami Output Test](#memahami-output-test)
4. [Coverage Report](#coverage-report)
5. [Struktur Test Files](#struktur-test-files)
6. [Troubleshooting](#troubleshooting)
7. [Tips & Best Practices](#tips--best-practices)

---

## 🎯 Tentang Testing

### Apa itu Vitest?

Vitest adalah framework testing modern untuk JavaScript/TypeScript yang:
- ⚡ **Sangat cepat** - menggunakan Vite untuk kompilasi
- 🔄 **Watch mode** - otomatis re-run saat file berubah
- 📊 **Coverage report** - menampilkan berapa persen kode yang ter-test
- 🎨 **UI Mode** - interface visual untuk melihat test

### Test Coverage di Project Ini

```
📁 lib/__tests__/
├── setup.ts                 # Setup environment variables
├── auth.test.ts             # 13 test cases - Authentication
├── errorHandler.test.ts     # 35 test cases - Error handling
├── midtrans.test.ts         # 22 test cases - Payment gateway
├── permissions.test.ts      # 72 test cases - RBAC and Permissions
├── tableValidation.test.ts  # 35 test cases - QR Token & Table Validation
└── validation.test.ts       # 18 test cases - Input validation
```

**Total: 195 test cases** yang menguji fungsi-fungsi kritis seperti:
- Login & JWT authentication
- Password hashing & verification
- Input validation (email, password)
- Midtrans payment integration
- Role-based Access Control (RBAC) & Permissions
- QR Token and Table session validation
- Centralized Error Handling

---

## 🚀 Cara Menjalankan Test

### 1. Quick Test (Single Run)

Jalankan semua test sekali:

```bash
npm test
```

**Kapan digunakan:**
- Sebelum commit code
- Untuk verifikasi cepat semua test passing
- Di CI/CD pipeline

**Output yang diharapkan:**
```
✓ lib/__tests__/validation.test.ts (18)
✓ lib/__tests__/auth.test.ts (13)
✓ lib/__tests__/midtrans.test.ts (22)

Test Files  3 passed (3)
Tests  53 passed (53)
Duration  2.05s
```

---

### 2. Watch Mode (Development)

Test akan otomatis re-run saat ada file yang berubah:

```bash
npm run test:watch
```

**Kapan digunakan:**
- Saat sedang coding/development
- Untuk mendapat feedback cepat
- Debugging test yang gagal

**Fitur watch mode:**
- Press `a` untuk run all tests
- Press `f` untuk run failed tests only
- Press `q` untuk quit
- Otomatis detect perubahan file

---

### 3. UI Mode (Visual Interface)

Melihat test dalam tampilan web interaktif:

```bash
npm run test:ui
```

**Akan membuka browser di:** `http://localhost:51204/__vitest__/`

**Fitur UI Mode:**
- ✅ Lihat test yang passing/failing dengan visual
- 📊 Graph untuk melihat relasi antar test
- 🔍 Filter test by file atau status
- 📝 Lihat source code langsung di browser
- ⏱️ Durasi eksekusi per test

**Screenshot penting untuk skripsi!** 📸

---

### 4. Coverage Report

Melihat berapa persen kode yang sudah di-test:

```bash
npm run test:coverage
```

**Output:**
```
---------------------|---------|----------|---------|---------|
File                 | % Stmts | % Branch | % Funcs | % Lines |
---------------------|---------|----------|---------|---------|
All files            |   59.42 |    52.94 |   72.72 |   59.42 |
 auth.ts             |   48.38 |    16.66 |      50 |   48.38 |
 midtrans.ts         |   26.66 |       50 |   44.44 |   26.66 |
 validation.ts       |     100 |      100 |     100 |     100 |
---------------------|---------|----------|---------|---------|
```

**Coverage HTML Report:**

Setelah run coverage, buka file:
```
d:\resto-iga-bakar\coverage\index.html
```

Di browser untuk melihat **detail coverage per line** dengan highlight warna.

---

## 📊 Memahami Output Test

### Format Output Terminal

```
✓ lib/__tests__/auth.test.ts (13) 892ms
  ✓ Auth Module - Whitebox Testing (13) 892ms
    ✓ hashPassword (2) 886ms
      ✓ should hash password successfully 443ms
      ✓ should generate different hashes for same password (salt) 443ms
    ✓ verifyPassword (3) 3ms
      ✓ should return true for correct password 2ms
      ✓ should return false for incorrect password 1ms
      ✓ should return false for empty password
```

**Penjelasan:**
- ✓ = Test passed (hijau)
- ✗ = Test failed (merah)
- (13) = Jumlah test dalam suite
- 892ms = Waktu eksekusi

### Jika Test Gagal

```
✗ should return true for correct password
  AssertionError: expected false to be true
  
  Expected: true
  Received: false
  
  at lib/__tests__/auth.test.ts:38:25
```

**Informasi penting:**
- **Expected** = Nilai yang diharapkan
- **Received** = Nilai yang didapat
- **at ...** = Lokasi file & line number yang error

---

## 📈 Coverage Report

### Memahami Coverage Metrics

1. **% Stmts (Statements)** - Berapa persen statement tereksekusi
2. **% Branch** - Berapa persen percabangan (if/else) tertest
3. **% Funcs (Functions)** - Berapa persen fungsi dipanggil
4. **% Lines** - Berapa persen baris kode tereksekusi

### Target Coverage

| File | Target | Status | Catatan |
|------|--------|--------|---------|
| `validation.ts` | 100% | ✅ | Business logic murni |
| `auth.ts` | >50% | ✅ | Ada dependency ke database |
| `midtrans.ts` | >25% | ✅ | Ada network calls |

**Note:** Coverage rendah bukan berarti buruk jika fungsi bergantung pada:
- Database (Prisma)
- External API calls
- Network requests

Yang penting: **business logic kritis sudah ter-test dengan baik**.

### Melihat HTML Coverage Report

1. Jalankan: `npm run test:coverage`
2. Buka: `coverage/index.html` di browser
3. Klik nama file untuk lihat detail
4. **Hijau** = Kode tertest
5. **Merah** = Kode belum tertest
6. **Kuning** = Branch sebagian tertest

---

## 📁 Struktur Test Files

### Anatomy Test File

```typescript
import { describe, it, expect } from 'vitest'
import { functionToTest } from '../module'

describe('Module Name', () => {
  // Group tests untuk satu module
  
  describe('functionName', () => {
    // Group tests untuk satu function
    
    it('should do something when condition', () => {
      // Arrange: Setup data
      const input = 'test-data'
      
      // Act: Panggil function
      const result = functionToTest(input)
      
      // Assert: Verifikasi hasil
      expect(result).toBe(expected)
    })
  })
})
```

### Contoh Real: validation.test.ts

```typescript
describe('validatePassword', () => {
  // Test Case 1: Password kosong
  it('should reject empty password', () => {
    const result = validatePassword('')
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password tidak boleh kosong')
  })

  // Test Case 2: Password terlalu pendek
  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Abc123!')
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password minimal 8 karakter')
  })

  // Test Case 3: Password valid
  it('should accept valid password', () => {
    const result = validatePassword('MyP@ssw0rd')
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
```

### Setup File

File `lib/__tests__/setup.ts` berjalan sebelum semua test untuk setup environment:

```typescript
// Set environment variables untuk testing
process.env.JWT_SECRET = 'test-secret-key-for-testing'
process.env.MIDTRANS_SERVER_KEY = 'test-midtrans-server-key'
process.env.MIDTRANS_IS_PRODUCTION = 'false'
```

---

## 🐛 Troubleshooting

### Problem 1: Test Gagal Semua

**Error:**
```
Error: JWT_SECRET environment variable is not set
```

**Solusi:**
1. Pastikan file `.env` ada dan terisi
2. Atau, setup.ts sudah set environment variables
3. Restart terminal/IDE

---

### Problem 2: Coverage 0%

**Error:**
Coverage report menunjukkan 0% padahal test passing.

**Solusi:**
1. Pastikan file yang ditest ada di folder `lib/`
2. Check `vitest.config.ts` - coverage include pattern
3. Jalankan dengan flag: `npm run test:coverage -- --reporter=html`

---

### Problem 3: Watch Mode Tidak Detect Perubahan

**Solusi:**
1. Restart watch mode: `Ctrl+C` lalu `npm run test:watch` lagi
2. Update Vitest: `npm install vitest@latest -D`
3. Clear cache: hapus folder `.vitest` dan `node_modules/.vitest`

---

### Problem 4: Port Already in Use (UI Mode)

**Error:**
```
Port 51204 is already in use
```

**Solusi:**
1. Close browser tab Vitest UI yang masih running
2. Atau kill process: `npx kill-port 51204`
3. Atau gunakan port lain: `npm run test:ui -- --port 51205`

---

## 💡 Tips & Best Practices

### 1. Gunakan Descriptive Test Names

❌ **Buruk:**
```typescript
it('test 1', () => { ... })
```

✅ **Baik:**
```typescript
it('should reject password shorter than 8 characters', () => { ... })
```

---

### 2. Follow Arrange-Act-Assert Pattern

```typescript
it('should hash password successfully', async () => {
  // Arrange: Setup input data
  const password = 'MySecurePassword123!'
  
  // Act: Call function
  const hashed = await hashPassword(password)
  
  // Assert: Verify output
  expect(hashed).toBeDefined()
  expect(hashed).not.toBe(password)
})
```

---

### 3. Test Both Happy & Sad Paths

```typescript
describe('validateEmail', () => {
  // Happy path: Valid input
  it('should accept valid email', () => {
    expect(validateEmail('user@example.com').isValid).toBe(true)
  })
  
  // Sad path: Invalid input
  it('should reject invalid email', () => {
    expect(validateEmail('invalid-email').isValid).toBe(false)
  })
})
```

---

### 4. Gunakan Watch Mode Saat Development

Workflow development dengan TDD (Test-Driven Development):

1. **Red**: Tulis test → Test gagal (belum ada implementasi)
2. **Green**: Tulis code minimal → Test passing
3. **Refactor**: Improve code → Test tetap passing

Run dengan `npm run test:watch` untuk dapat feedback langsung.

---

### 5. Target Coverage yang Realistis

| Tipe Code | Target Coverage |
|-----------|-----------------|
| Business Logic | 90-100% |
| Utilities | 80-100% |
| API Routes | 50-70% |
| Components | 40-60% |

**Jangan obsesi 100% coverage** - fokus pada code yang:
- Kritis untuk business
- Sering berubah
- Kompleks/rawan bug

---

## 📸 Untuk Skripsi/Dokumentasi

### Screenshot yang Perlu Diambil:

1. **Terminal Output**: `npm test`
   - Tunjukkan semua test passing
   - Total test cases & durasi

2. **Coverage Report (Terminal)**:
   - Table coverage dengan persentase
   - Highlight file dengan 100% coverage

3. **Coverage Report (HTML)**:
   - Screenshot `coverage/index.html`
   - Detail coverage per file
   - Highlight hijau (tertest) vs merah (belum)

4. **Vitest UI** (Optional tapi bagus):
   - Graph test execution
   - Visual passing/failing tests
   - Source code view dengan highlight

5. **Watch Mode**:
   - Screenshot terminal watch mode
   - Tunjukkan auto-rerun saat file change

### Data untuk Tabel:

```
Testing Framework: Vitest v4.1.10
Total Test Files: 3
Total Test Cases: 53
  - validation.test.ts: 18 cases
  - auth.test.ts: 13 cases
  - midtrans.test.ts: 22 cases

Overall Coverage:
  - Statements: 59.42%
  - Branches: 52.94%
  - Functions: 72.72%
  - Lines: 59.42%

Critical Module Coverage:
  - validation.ts: 100% (Business logic)
  - auth.ts: 48% (Database dependent)
  - midtrans.ts: 26% (Network dependent)

Execution Time: ~2 seconds
Test Result: ✅ 100% Passing (53/53)
```

---

## 🔗 Referensi

- **Vitest Documentation**: https://vitest.dev/
- **Testing Best Practices**: https://testingjavascript.com/
- **Coverage Tools**: https://istanbul.js.org/

---

## ✅ Checklist Testing

Sebelum push/deploy, pastikan:

- [ ] `npm test` - All tests passing
- [ ] `npm run test:coverage` - Coverage target tercapai
- [ ] No console errors
- [ ] Critical paths tested (login, payment, validation)
- [ ] Environment variables di-set dengan benar

---

**Dibuat:** 2026  
**Project:** Resto Iga Bakar - Restaurant Management System  
**Testing Method:** Whitebox Testing (Path & Branch Coverage)  
**Framework:** Vitest + TypeScript

---

## 📞 Butuh Bantuan?

Jika ada masalah dengan testing:
1. Baca section [Troubleshooting](#troubleshooting)
2. Check file `lib/__tests__/README.md` untuk detail per test
3. Lihat dokumentasi Vitest official

Happy Testing! 🧪✨
