# Unit Testing - Resto Iga Bakar

Testing untuk fungsi-fungsi utility menggunakan **Vitest** dengan metode **Whitebox Testing**.

## 📊 Statistik Testing

- **Total Test Files**: 3
- **Total Test Cases**: 53
- **Status**: ✅ All Passing
- **Method**: Whitebox Testing (Path & Branch Coverage)

## 📁 File Testing

### 1. `validation.test.ts` - 18 Test Cases
Testing untuk validasi input user:
- `validatePassword()` - 8 test cases
- `validateEmail()` - 6 test cases
- `validateLoginData()` - 4 test cases

**Coverage**: 100% (Statements, Branches, Functions, Lines)

### 2. `auth.test.ts` - 13 Test Cases
Testing untuk sistem autentikasi:
- `hashPassword()` - 2 test cases
- `verifyPassword()` - 3 test cases
- `signToken()` - 3 test cases
- `verifyToken()` - 4 test cases
- Integration test - 1 test case

**Coverage**: ~48% (karena ada fungsi yang bergantung pada database)

### 3. `midtrans.test.ts` - 22 Test Cases
Testing untuk payment gateway integration:
- `verifyNotificationSignature()` - 4 test cases
- `mapMidtransStatus()` - 11 test cases
- `getSnapScriptUrl()` - 3 test cases
- `MidtransError` - 3 test cases
- Integration test - 1 test case

**Coverage**: ~26% (karena ada fungsi yang memerlukan network call)

## 🚀 Cara Menjalankan

### Quick Test (Single Run)
```bash
npm test
```

### Watch Mode (Auto-rerun on file change)
```bash
npm run test:watch
```

### UI Mode (Visual Interface)
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

## 📋 Output Contoh

```
✓ lib/__tests__/validation.test.ts (18 tests)
✓ lib/__tests__/auth.test.ts (13 tests)
✓ lib/__tests__/midtrans.test.ts (22 tests)

Test Files  3 passed (3)
Tests  53 passed (53)
Duration  2.05s
```

## 🎯 Metode Whitebox Testing

### Path Coverage
Menguji semua jalur eksekusi yang mungkin dalam fungsi.

**Contoh:**
```typescript
// Function dengan 2 paths
function validate(x) {
  if (x > 0) return "positive"  // Path 1
  return "non-positive"          // Path 2
}

// Test cases:
it("path 1: positive number", () => ...)  // ✓
it("path 2: negative number", () => ...)  // ✓
```

### Branch Coverage
Menguji semua percabangan (if/else, switch, ternary).

**Contoh:**
```typescript
// Function dengan multiple branches
function checkPassword(pwd) {
  if (!pwd) return {error: "empty"}           // Branch 1
  if (pwd.length < 8) return {error: "short"} // Branch 2
  return {valid: true}                        // Branch 3
}

// Test cases untuk semua branches
```

### Statement Coverage
Memastikan setiap statement tereksekusi minimal 1 kali.

### Condition Coverage
Menguji setiap kondisi boolean (true/false).

## 📝 Contoh Test Case

```typescript
describe('validatePassword', () => {
  // Test Case 1: Path - password kosong
  it('should reject empty password', () => {
    const result = validatePassword('')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password tidak boleh kosong')
  })

  // Test Case 2: Path - password valid
  it('should accept valid password', () => {
    const result = validatePassword('MyP@ssw0rd')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
```

## 🔧 Setup Environment

File `setup.ts` meng-configure environment variables:
```typescript
process.env.JWT_SECRET = 'test-secret-key-for-testing'
process.env.MIDTRANS_SERVER_KEY = 'test-midtrans-server-key'
process.env.MIDTRANS_IS_PRODUCTION = 'false'
```

## 📈 Coverage Report

Setelah menjalankan `npm run test:coverage`, buka:
```
coverage/index.html
```

Untuk melihat detail coverage per file dan per line.

## 🐛 Troubleshooting

### Test Gagal
1. Cek error message di output
2. Verifikasi expected vs actual value
3. Pastikan environment variables sudah di-set
4. Cek apakah mock data sudah benar

### Coverage Rendah
Coverage rendah wajar untuk fungsi yang:
- Bergantung pada database (Prisma)
- Memerlukan network call (fetch)
- Memerlukan external API

Fokus testing ada pada **business logic** yang tidak bergantung eksternal dependency.

## 📚 Dokumentasi Lengkap

Lihat file di root project:
- `TESTING_DOCUMENTATION.md` - Dokumentasi lengkap untuk skripsi
- `TESTING_GUIDE.md` - Quick reference guide

## ✨ Best Practices

1. **Descriptive test names**: Nama test menjelaskan apa yang di-test
2. **Arrange-Act-Assert**: Struktur test yang jelas
3. **One assertion per concept**: Fokus pada 1 konsep per test
4. **Test both happy and sad paths**: Test success dan error cases
5. **Independent tests**: Setiap test berdiri sendiri

## 📖 Untuk Skripsi

### Data yang Bisa Digunakan:
- Total test cases: **53**
- Test files: **3**
- Coverage target: **>80%** untuk fungsi kritis
- Testing method: **Whitebox (Path + Branch Coverage)**
- Framework: **Vitest**
- Pass rate: **100%**

### Screenshot yang Perlu:
1. Output terminal `npm test`
2. Coverage report HTML
3. Vitest UI (optional)
4. Coverage table

---

**Last Updated**: 2026
**Maintainer**: Resto Iga Bakar Development Team
