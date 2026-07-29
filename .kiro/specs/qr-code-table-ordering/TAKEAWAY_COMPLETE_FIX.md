# TAKEAWAY Complete Fix - Individual Orders

## Problem
TAKEAWAY orders were still showing "Dine-in" and table number "TAKEAWAY" in checkout page, even though TAKEAWAY should be completely independent from tables.

## Root Cause
localStorage was persisting old `tableNumber` and `table_id` values from previous scans, causing checkout page to display incorrect information.

## Solution

### 1. Menu Page - Complete TAKEAWAY Independence
**File**: `app/menu/page.tsx`

TAKEAWAY now completely independent from table system:
```typescript
// TAKEAWAY - NO table data at all
localStorage.setItem('orderType', 'TAKEAWAY')
localStorage.setItem('qr_token', tokenFromQR)

// CRITICAL: Remove ALL table-related data
localStorage.removeItem('tableNumber')
localStorage.removeItem('table_id')
```

### 2. Checkout Page - Conditional Table Data Loading
**File**: `app/checkout/page.tsx`

Only load table data for DINE_IN orders:
```typescript
if (savedOrderType === 'TAKEAWAY') {
  setOrderType('TAKEAWAY')
  // Do NOT set tableNumber or tableId
} else if (savedOrderType === 'DINE_IN') {
  setOrderType('DINE_IN')
  if (savedTable) {
    setTableNumber(savedTable)
    setTableFromQR(true)
  }
  if (savedTableId) {
    setTableId(savedTableId)
  }
}
```

## Testing Instructions

### CRITICAL: Clear localStorage First!

**Before testing, you MUST clear localStorage:**

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → `http://localhost:3000`
4. **Delete these keys**:
   - `orderType`
   - `tableNumber`
   - `table_id`
   - `qr_token`
   - `cart` (optional, but recommended)
5. Refresh the page

### Test Case 1: TAKEAWAY Order

**Steps:**
1. Clear localStorage (see above)
2. Scan TAKEAWAY QR code or visit: `/menu?takeaway=true&token=xxx`
3. Check browser console - should see:
   ```
   TAKEAWAY mode set - NO table data
   ```
4. Add items to cart
5. Click checkout
6. Check browser console - should see:
   ```
   === CHECKOUT PAGE DEBUG ===
   savedOrderType: "TAKEAWAY"
   savedTable: null
   savedTableId: null
   ✅ Setting orderType to TAKEAWAY - NO table data
   === END DEBUG ===
   ```
7. **Expected Result**:
   - ✅ Purple "Takeaway" badge
   - ✅ NO "Nomor Meja" input field
   - ✅ NO "Dine-in" text
   - ✅ Clean, simple interface

### Test Case 2: DINE_IN Order

**Steps:**
1. Clear localStorage (see above)
2. Scan table QR code or visit: `/menu?table=xxx&token=xxx`
3. Check browser console - should see:
   ```
   (table validation messages)
   ```
4. Add items to cart
5. Click checkout
6. Check browser console - should see:
   ```
   === CHECKOUT PAGE DEBUG ===
   savedOrderType: "DINE_IN"
   savedTable: "5"
   savedTableId: "clx..."
   ✅ Setting orderType to DINE_IN
   ✅ Table number set: 5
   === END DEBUG ===
   ```
7. **Expected Result**:
   - ✅ Orange "Dine-in" badge
   - ✅ "Nomor Meja" input field with value "5"
   - ✅ Green checkmark "Nomor meja otomatis dari QR code"

### Test Case 3: Switch Between TAKEAWAY and DINE_IN

**Steps:**
1. Clear localStorage
2. Scan TAKEAWAY QR → Add items → Checkout → Verify purple badge
3. Go back to menu
4. Clear localStorage again
5. Scan table QR → Add items → Checkout → Verify orange badge with table number

## Visual Comparison

### TAKEAWAY (Correct):
```
┌─────────────────────────────────┐
│ 🛍️ Tipe Pesanan                │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🛍️ Takeaway                 │ │
│ │ Bawa pulang                  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### DINE_IN (Correct):
```
┌─────────────────────────────────┐
│ 🍽️ Tipe Pesanan                │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🍽️ Dine-in                  │ │
│ │ Makan di tempat              │ │
│ └─────────────────────────────┘ │
│                                 │
│ Nomor Meja *                    │
│ ┌─────────────────────────────┐ │
│ │ 5                            │ │
│ └─────────────────────────────┘ │
│ ✓ Nomor meja otomatis dari QR   │
└─────────────────────────────────┘
```

## Debugging

If you still see "Dine-in" for TAKEAWAY:

1. **Check console logs** - Look for:
   ```
   === CHECKOUT PAGE DEBUG ===
   savedOrderType: "TAKEAWAY"
   ```
   
2. **If savedOrderType is null or "DINE_IN"**:
   - localStorage was not cleared properly
   - Clear it manually and try again

3. **If savedTable shows "TAKEAWAY"**:
   - Old data is still in localStorage
   - Clear localStorage completely
   - Restart browser if needed

4. **Check localStorage directly**:
   - Open DevTools → Application → Local Storage
   - Verify `orderType` = "TAKEAWAY"
   - Verify `tableNumber` = null (not present)
   - Verify `table_id` = null (not present)

## Files Modified
1. `app/menu/page.tsx` - Complete TAKEAWAY independence
2. `app/checkout/page.tsx` - Conditional table data loading with debug logs

## Build Status
✅ Build successful - all routes compiled without errors

## Summary

**TAKEAWAY is now completely independent:**
- ❌ NO table_id
- ❌ NO tableNumber
- ❌ NO table validation
- ✅ Only orderType and qr_token
- ✅ Clean purple badge in checkout
- ✅ No table number input

**DINE_IN remains table-based:**
- ✅ Has table_id
- ✅ Has tableNumber
- ✅ Table validation required
- ✅ Orange badge with table number
- ✅ Table number input (read-only from QR)
