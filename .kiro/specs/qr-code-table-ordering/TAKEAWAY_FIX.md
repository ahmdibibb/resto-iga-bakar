# TAKEAWAY Logic Fix

## Problem
Takeaway orders were showing as "Dine-in" in the checkout page and still requiring table number input, which is incorrect for takeaway orders.

## Root Causes
1. **Menu page**: TAKEAWAY validation was trying to use tableId "TAKEAWAY" (string) instead of finding the actual table ID
2. **Checkout page**: Still showing table number input field for TAKEAWAY orders
3. **Backend API**: Not properly handling TAKEAWAY orders without table_id

## Changes Made

### 1. Menu Page (`app/menu/page.tsx`)

#### Fixed TAKEAWAY Validation
- **Before**: Tried to validate with `tableId: 'TAKEAWAY'` (string literal)
- **After**: 
  - First fetches all tables from `/api/admin/tables`
  - Finds the TAKEAWAY table by name
  - Uses the actual table ID for validation
  - Stores table_id in localStorage for TAKEAWAY orders

```typescript
const validateTakeawayByToken = async (token: string) => {
  // Fetch all tables
  const response = await fetch('/api/admin/tables')
  const tables = await response.json()
  
  // Find TAKEAWAY table
  const takeawayTable = tables.find((t: any) => t.name === 'TAKEAWAY')
  
  // Validate with actual table ID
  const validationResponse = await fetch('/api/tables/validate', {
    method: 'POST',
    body: JSON.stringify({ tableId: takeawayTable.id, qr_token: token }),
  })
  
  return validationResponse.json()
}
```

### 2. Checkout Page (`app/checkout/page.tsx`)

#### Removed Table Number Input for TAKEAWAY
- **Before**: Showed "Nomor Meja" input field with "TAKEAWAY" placeholder
- **After**: Only shows the purple-themed Takeaway badge, no input field

#### Updated Order Creation Logic
- **Before**: Sent `tableNumber` and `table_id` for both DINE_IN and TAKEAWAY
- **After**: 
  - DINE_IN: Sends `tableNumber` and `table_id`
  - TAKEAWAY: Sends `tableNumber: null` and `table_id: null`

```typescript
body: JSON.stringify({
  items,
  orderType,
  tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : null,
  table_id: orderType === 'DINE_IN' ? tableId : null,
  qr_token: qrToken,
  payment_method: paymentMethod,
})
```

#### Removed Validation for TAKEAWAY Table Number
- **Before**: Required table number for both DINE_IN and TAKEAWAY
- **After**: Only requires table number for DINE_IN

### 3. Backend API (`app/api/orders/route.ts`)

#### Fixed Order Creation
- **Before**: Always set `table_id` regardless of order type
- **After**: Only set `table_id` for DINE_IN orders

```typescript
table_id: orderType === 'DINE_IN' ? (table_id || null) : null,
```

#### Fixed Table Status Update
- **Before**: Updated table status to OCCUPIED for any order with table_id
- **After**: Only updates table status for DINE_IN orders

```typescript
if (orderType === 'DINE_IN' && table_id) {
  await prisma.table.update({
    where: { id: table_id },
    data: { status: 'OCCUPIED' }
  })
}
```

## User Flow After Fix

### Dine-In Flow:
1. Scan table QR code (e.g., Table 5)
2. Menu page: Sets `orderType = 'DINE_IN'`, `tableNumber = '5'`, `table_id = 'xxx'`
3. Checkout page: Shows **orange** Dine-in section with table number "5"
4. Backend: Creates order with `table_id` and updates table status to OCCUPIED

### Takeaway Flow:
1. Scan TAKEAWAY QR code
2. Menu page: 
   - Finds TAKEAWAY table by name
   - Validates with actual table ID
   - Sets `orderType = 'TAKEAWAY'`, `table_id = 'xxx'` (TAKEAWAY table ID)
3. Checkout page: Shows **purple** Takeaway section, NO table number input
4. Backend: Creates order with `table_id = null` and `tableNumber = null`

## Visual Changes

### Checkout Page - TAKEAWAY Section

**Before:**
```
┌─────────────────────────────────┐
│ 🛍️ Tipe Pesanan                │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🛍️ Takeaway                 │ │
│ │ Bawa pulang                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Nomor Meja *                    │
│ ┌─────────────────────────────┐ │
│ │ TAKEAWAY                     │ │
│ └─────────────────────────────┘ │
│ ✓ Nomor meja otomatis dari QR   │
└─────────────────────────────────┘
```

**After:**
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

## Database Impact

### TAKEAWAY Orders:
- `orderType`: "TAKEAWAY"
- `table_id`: NULL
- `tableNumber`: NULL
- Table status: NOT updated (TAKEAWAY table remains AVAILABLE)

### DINE_IN Orders:
- `orderType`: "DINE_IN"
- `table_id`: Actual table ID (e.g., "clx...")
- `tableNumber`: Table name (e.g., "5")
- Table status: Updated to OCCUPIED

## Files Modified
1. `app/menu/page.tsx` - Fixed TAKEAWAY validation
2. `app/checkout/page.tsx` - Removed table number input for TAKEAWAY
3. `app/api/orders/route.ts` - Fixed backend logic for TAKEAWAY

## Build Status
✅ Build successful - all routes compiled without errors

## Testing Steps

1. **Test TAKEAWAY Flow**:
   - Scan TAKEAWAY QR code
   - Add items to cart
   - Go to checkout
   - Verify: Purple Takeaway section appears
   - Verify: NO table number input field
   - Verify: Only shows "Takeaway - Bawa pulang" badge
   - Complete order
   - Check database: `table_id` should be NULL, `tableNumber` should be NULL

2. **Test DINE_IN Flow**:
   - Scan table QR code (e.g., Table 5)
   - Add items to cart
   - Go to checkout
   - Verify: Orange Dine-in section appears
   - Verify: Table number "5" is shown
   - Complete order
   - Check database: `table_id` should have value, `tableNumber` should be "5"

3. **Test Kasir Dashboard**:
   - Create TAKEAWAY order
   - Check Kasir dashboard shows "🥡 Takeaway"
   - Create DINE_IN order
   - Check Kasir dashboard shows "🍽️ Meja X"

## Next Steps
- Test end-to-end TAKEAWAY flow
- Verify database records are correct
- Test Kasir dashboard display
