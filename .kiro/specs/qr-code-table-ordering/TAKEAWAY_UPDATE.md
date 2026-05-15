# TAKEAWAY QR Code Update

## Summary
Successfully separated TAKEAWAY QR code from regular table QR codes in the QR Generator page and updated the menu page to handle TAKEAWAY orders properly.

## Changes Made

### 1. Admin QR Generator Page (`app/admin/qr-generator/page.tsx`)
- **Separated TAKEAWAY from regular tables**: Added logic to filter tables into `regularTables` and `takeawayTable`
- **New TAKEAWAY section**: Created a dedicated section at the top with purple theme
  - Purple gradient background and borders
  - Shopping bag icon instead of utensils
  - Purple QR code color (#9333ea)
  - Separate "QR Code Takeaway" heading
- **Regular tables section**: Displays only numbered tables (1-10)
  - Orange theme maintained
  - Table count shows only regular tables

### 2. Menu Page (`app/menu/page.tsx`)
- **Added TAKEAWAY QR handling**: New logic to detect `takeaway=true` parameter
- **New validation function**: `validateTakeaway()` validates TAKEAWAY token
- **Updated initialization flow**:
  - If `takeaway=true` + token → validate takeaway, set orderType to TAKEAWAY
  - If `table` + token → validate table, set orderType to DINE_IN
- **Proper state management**: `isTakeaway` state derived from QR params and localStorage

### 3. Database Seed (`prisma/seed.ts`)
- **TAKEAWAY table already added**: Special table with name "TAKEAWAY" and unique QR token
- **Total tables**: 11 tables (1-10 + TAKEAWAY)

## How It Works

### For Admin:
1. Go to Admin Dashboard → QR Generator
2. See two sections:
   - **QR Code Takeaway** (purple, at top) - for takeaway orders
   - **Daftar Meja** (orange, below) - for dine-in tables (1-10)
3. Generate and download QR codes separately

### For Customers:

#### Takeaway Flow:
1. Scan TAKEAWAY QR code
2. URL: `/menu?takeaway=true&token=xxx`
3. Menu page validates token with TAKEAWAY table
4. Order type set to TAKEAWAY
5. Navbar shows "🥡 Takeaway" badge
6. No table number displayed

#### Dine-In Flow:
1. Scan table QR code (e.g., Table 5)
2. URL: `/menu?table=xxx&token=xxx`
3. Menu page validates table ID and token
4. Order type set to DINE_IN
5. Navbar shows "🍽️ Meja 5"
6. Table number stored

### For Kasir:
- Orders display correctly:
  - Dine-in: Shows "🍽️ Meja X"
  - Takeaway: Shows "🥡 Takeaway"
- Print struk shows order type

## Testing Steps

1. **Run database seed** (if not already done):
   ```bash
   npm run seed
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Test TAKEAWAY QR**:
   - Login as admin (admin@resto.com / admin123)
   - Go to QR Generator
   - Generate TAKEAWAY QR code
   - Download and scan (or manually visit the URL)
   - Verify menu page shows "🥡 Takeaway"
   - Place an order
   - Check Kasir dashboard shows "🥡 Takeaway"

4. **Test Table QR**:
   - Generate QR for Table 1
   - Download and scan
   - Verify menu page shows "🍽️ Meja 1"
   - Place an order
   - Check Kasir dashboard shows "🍽️ Meja 1"

## Files Modified
- `app/admin/qr-generator/page.tsx` - Separated TAKEAWAY from tables
- `app/menu/page.tsx` - Added TAKEAWAY QR handling
- `prisma/seed.ts` - Already includes TAKEAWAY table

## Build Status
✅ Build successful - all routes compiled without errors

## Next Steps
1. Run `npm run seed` to create TAKEAWAY table in database
2. Test TAKEAWAY QR code flow end-to-end
3. Test regular table QR code flow
4. Verify Kasir dashboard displays correctly for both order types
