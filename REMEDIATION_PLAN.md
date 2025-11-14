# FJL Remediation Plan - Complete Action Plan

**Date:** November 2025
**Status:** PLANNING
**Target Launch:** 3-4 weeks
**Total Tasks:** 28 (5 Critical, 8 High, 12 Medium, 3 Low)

---

## EXECUTIVE SUMMARY

### Current State
- **Overall Score:** 5.8/10 (NOT PRODUCTION-READY)
- **Blocking Issues:** 5 CRITICAL
- **Must-Fix Issues:** 8 HIGH
- **Nice-to-Have:** 12 MEDIUM + 3 LOW

### Top 3 Immediate Actions (Next 48 Hours)
1. **FIX-001: Order Access Vulnerability** - Anyone can view any customer's order data (CRITICAL)
2. **FIX-004: Apply Database Migrations** - Code references missing columns causing runtime errors (CRITICAL)
3. **FIX-003: Add Settings Permission** - Settings endpoint broken for all users (CRITICAL)

### Timeline Summary
- **Phase 0 (Critical):** 15 hours → Blocks launch
- **Phase 1 (High):** 8 hours → Must complete before launch
- **Phase 2 (Medium):** 50 hours → Post-launch improvements
- **Phase 3 (Low):** 10 hours → Polish

**Total Effort:** ~93 hours → 3-4 weeks with focused team

---

## TABLE OF CONTENTS

1. [Phase 0: Critical Issues (BLOCKING)](#phase-0-critical-issues)
2. [Phase 1: High Priority Issues](#phase-1-high-priority-issues)
3. [Phase 2: Medium Priority Issues](#phase-2-medium-priority-issues)
4. [Phase 3: Low Priority Improvements](#phase-3-low-priority-improvements)
5. [QA & Verification Checklist](#qa--verification-checklist)
6. [Release Readiness Gates](#release-readiness-gates)
7. [Communication & Tracking](#communication--tracking)

---

# PHASE 0: CRITICAL ISSUES (BLOCKING)

*Objective: Fix all blocking issues preventing production launch. No deployment until ALL are resolved.*

---

## FIX-001: Order Access Vulnerability (Data Breach)

**Issue ID:** 1.1 | **Severity:** CRITICAL - DATA BREACH
**Audit Link:** ENGINEERING_AUDIT_REPORT.md § 1.1
**Status:** OPEN

### Problem
Public endpoints expose complete customer order data (names, addresses, phones, emails). Any user can access ANY customer's order by guessing order IDs or order numbers.

### Root Cause
Authentication middleware (`verifyJWT`) not applied to order GET endpoints at lines 45 and 58 of `src/routes/orders.js`.

### Impact Assessment
- **Legal Risk:** GDPR, CCPA, Nigeria DPA violations
- **Financial Risk:** Liability exposure, potential fines
- **Reputational Risk:** Major data breach
- **Business Risk:** Loses customer trust

### Proposed Fix

**File:** `src/routes/orders.js`

```javascript
// CURRENT CODE (INSECURE)
// Line 45
router.get('/number/:orderNumber', asyncHandler(async (req, res) => {
  const order = await orderService.getOrderByOrderNumber(req.params.orderNumber);
  res.json({ success: true, data: order });
}));

// Line 58
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  res.json({ success: true, data: order });
}));

// FIXED CODE
// Line 45
router.get('/number/:orderNumber',
  verifyJWT,  // ← ADD AUTHENTICATION
  asyncHandler(async (req, res) => {
    const order = await orderService.getOrderByOrderNumber(req.params.orderNumber);

    // Verify ownership: customer can only see own orders, admin can see all
    if (order.user_id !== req.user.id && req.user.role !== 'owner' && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.json({ success: true, data: order });
  })
);

// Line 58
router.get('/:id',
  verifyJWT,  // ← ADD AUTHENTICATION
  asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id);

    // Verify ownership
    if (order.user_id !== req.user.id && req.user.role !== 'owner' && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.json({ success: true, data: order });
  })
);
```

### Files to Modify
- `src/routes/orders.js` (Lines 45, 58)

### Tests Required

**Unit Test:**
```javascript
// Test: Unauthenticated request denied
describe('GET /api/orders/:id', () => {
  it('should deny access without JWT token', async () => {
    const res = await request(app).get('/api/orders/123');
    expect(res.status).toBe(401);
  });

  it('should deny access to other customer orders', async () => {
    const customerAToken = generateTestToken({ id: 'user-a', role: 'customer' });
    const orderB = await createTestOrder({ user_id: 'user-b' });

    const res = await request(app)
      .get(`/api/orders/${orderB.id}`)
      .set('Authorization', `Bearer ${customerAToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow customer to view own orders', async () => {
    const customerToken = generateTestToken({ id: 'user-a' });
    const order = await createTestOrder({ user_id: 'user-a' });

    const res = await request(app)
      .get(`/api/orders/${order.id}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(order.id);
  });

  it('should allow admin to view any order', async () => {
    const adminToken = generateTestToken({ id: 'admin-1', role: 'owner' });
    const order = await createTestOrder({ user_id: 'user-b' });

    const res = await request(app)
      .get(`/api/orders/${order.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
```

**Integration Test:**
```javascript
// Test: Enumerate orders via API
it('should prevent order enumeration attacks', async () => {
  const results = [];

  for (let i = 1; i <= 10; i++) {
    const res = await request(app).get(`/api/orders/${i}`);
    results.push(res.status);
  }

  // All should be 401 (unauthenticated)
  expect(results.every(status => status === 401)).toBe(true);
});
```

**E2E Test:**
```javascript
// Test: Customer workflow
describe('Customer order access', () => {
  it('should allow customer to view own order from confirmation page', async () => {
    // 1. Create order
    const order = await createTestOrder({ user_id: 'customer-123' });

    // 2. Get customer token
    const token = generateTestToken({ id: 'customer-123' });

    // 3. Access order details
    const res = await fetch(`/api/orders/${order.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(res.status).toBe(200);
    expect(res.data.order_number).toEqual(order.order_number);
  });
});
```

### Acceptance Criteria
- [ ] Unauthenticated requests return 401
- [ ] Customers cannot access other customers' orders (403)
- [ ] Customers can access own orders (200)
- [ ] Admins can access any order (200)
- [ ] Order enumeration attacks blocked
- [ ] No customer data leaked in any response
- [ ] API documentation updated

### Deployment Steps
1. **Create Feature Branch:** `git checkout -b security/fix-order-access-control`
2. **Apply Fix:** Modify `src/routes/orders.js` with code above
3. **Run Tests:** `npm test -- orders.test.js`
4. **Security Review:** Have 1+ senior engineer review
5. **Push & Create PR:**
   ```bash
   git add src/routes/orders.js
   git commit -m "security: Add authentication to order GET endpoints (FIX-001)"
   git push origin security/fix-order-access-control
   # Create PR with label: security, critical
   ```
6. **Merge to main:** After approval + tests green
7. **Deploy:** Standard deployment (no special flags needed)

### Rollback Plan
If issue discovered in production:
```bash
git revert <commit-sha>  # Revert the security fix (NOT recommended but possible)
# OR use feature flag to disable auth checks (temporary)
# Environment variable: DISABLE_ORDER_AUTH_CHECK=true
```

**Note:** Rollback should be last resort. Security fix should stay.

### Dependencies/Blockers
- Must have `verifyJWT` middleware working (already implemented)
- Requires test database setup

### Suggested Owner
**BACKEND_DEV** (Security-conscious backend engineer)

### Effort Estimate
**SMALL** (2 hours)

### Priority Tag
**CRITICAL**

---

## FIX-002: Stock Race Condition

**Issue ID:** 1.2 | **Severity:** CRITICAL - INVENTORY CORRUPTION
**Audit Link:** ENGINEERING_AUDIT_REPORT.md § 1.2
**Status:** OPEN

### Problem
Stock is validated at order creation (T1) but deducted much later during payment verification (T2). Multiple concurrent orders can pass validation and then cause stock to go negative after deduction.

### Root Cause
Separation between stock validation (orderService.createOrder lines 67-95) and stock deduction (orderService lines 419-440). Time gap allows race conditions.

### Impact Assessment
- **Business Risk:** Overselling, negative inventory
- **Revenue Risk:** Unexpected refunds due to fulfillment failure
- **Operational Risk:** Inventory discrepancies requiring manual fixing
- **Customer Risk:** Delayed/rejected orders

### Proposed Fix

**Option A: Database-Level Atomic Transaction (RECOMMENDED)**

**File:** `src/services/orderService.js`

```javascript
// CURRENT CODE (BROKEN)
async function createOrder(orderData) {
  // Validate stock - Lines 67-95
  for (const item of orderData.items) {
    const variant = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', item.variant_id)
      .single();

    if (item.quantity > variant.stock_quantity) {
      throw new Error('Insufficient stock');
    }
    // ← Gap between check and creation allows overbooking
  }

  // Create order - Lines 97-150
  const { data: order } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();

  return order;
  // Stock will be reduced MUCH LATER during payment (Lines 419-440)
  // Multiple orders can all pass validation → negative stock!
}

// FIXED CODE
async function createOrder(orderData) {
  try {
    // Use atomic transaction to make validation + deduction atomic
    const { data: order, error: txError } = await supabase.rpc(
      'create_order_with_stock_deduction',
      {
        order_data: {
          user_id: orderData.user_id,
          shipping_name: orderData.shipping_name,
          shipping_email: orderData.shipping_email,
          shipping_phone: orderData.shipping_phone,
          shipping_address: orderData.shipping_address,
          shipping_city: orderData.shipping_city,
          shipping_state: orderData.shipping_state,
          shipping_postal_code: orderData.shipping_postal_code,
          shipping_country: orderData.shipping_country,
          payment_method: orderData.payment_method,
          subtotal: orderData.subtotal,
          tax_amount: orderData.tax_amount,
          shipping_cost: orderData.shipping_cost,
          total_amount: orderData.total_amount,
          order_status: 'pending',
          payment_status: 'pending',
        },
        items: orderData.items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          sku: item.sku,
          size: item.size,
          color: item.color,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: item.total_price,
        }))
      }
    );

    if (txError) {
      // Check if error is due to insufficient stock
      if (txError.message.includes('insufficient stock')) {
        throw new Error(`Insufficient stock for one or more items`);
      }
      throw txError;
    }

    // Order created AND stock deducted atomically ✓
    return order;
  } catch (error) {
    if (error.message.includes('insufficient stock')) {
      throw new AppError('Insufficient stock for one or more items', 400);
    }
    throw error;
  }
}
```

**Database Stored Procedure (PostgreSQL in Supabase):**

```sql
-- Create stored procedure to handle atomic stock deduction
CREATE OR REPLACE FUNCTION create_order_with_stock_deduction(
  order_data jsonb,
  items jsonb[]
)
RETURNS TABLE (
  id uuid,
  order_number varchar,
  user_id uuid,
  order_status varchar,
  payment_status varchar,
  total_amount integer,
  created_at timestamp
) AS $$
DECLARE
  new_order_id uuid;
  item jsonb;
  variant_id uuid;
  quantity integer;
  current_stock integer;
BEGIN
  -- Start transaction
  BEGIN
    -- 1. Validate stock for all items (within transaction)
    FOREACH item IN ARRAY items
    LOOP
      variant_id := (item->>'variant_id')::uuid;
      quantity := (item->>'quantity')::integer;

      -- Get current stock
      SELECT stock_quantity INTO current_stock
      FROM product_variants
      WHERE id = variant_id
      FOR UPDATE;  -- Lock row to prevent race conditions

      -- Check if sufficient stock
      IF current_stock < quantity THEN
        RAISE EXCEPTION 'insufficient stock for variant %', variant_id;
      END IF;
    END LOOP;

    -- 2. Create order
    INSERT INTO orders (
      user_id, order_number, shipping_name, shipping_email,
      shipping_phone, shipping_address, shipping_city, shipping_state,
      shipping_postal_code, shipping_country, payment_method,
      subtotal, tax_amount, shipping_cost, total_amount,
      order_status, payment_status
    )
    VALUES (
      (order_data->>'user_id')::uuid,
      'ORD-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || lpad(random()::text, 4, '0'),
      order_data->>'shipping_name',
      order_data->>'shipping_email',
      order_data->>'shipping_phone',
      order_data->>'shipping_address',
      order_data->>'shipping_city',
      order_data->>'shipping_state',
      order_data->>'shipping_postal_code',
      order_data->>'shipping_country',
      order_data->>'payment_method',
      (order_data->>'subtotal')::integer,
      (order_data->>'tax_amount')::integer,
      (order_data->>'shipping_cost')::integer,
      (order_data->>'total_amount')::integer,
      'pending',
      'pending'
    )
    RETURNING id INTO new_order_id;

    -- 3. Deduct stock AND create order items atomically
    FOREACH item IN ARRAY items
    LOOP
      variant_id := (item->>'variant_id')::uuid;
      quantity := (item->>'quantity')::integer;

      -- Deduct stock (now guaranteed to succeed due to check above)
      UPDATE product_variants
      SET stock_quantity = stock_quantity - quantity
      WHERE id = variant_id;

      -- Create order item
      INSERT INTO order_items (
        order_id, product_id, variant_id, product_name, sku,
        size, color, unit_price, quantity, total_price
      )
      VALUES (
        new_order_id,
        (item->>'product_id')::uuid,
        variant_id,
        item->>'product_name',
        item->>'sku',
        item->>'size',
        item->>'color',
        (item->>'unit_price')::integer,
        quantity,
        (item->>'total_price')::integer
      );
    END LOOP;

    -- 4. Update product total_stock (denormalized field)
    UPDATE products
    SET total_stock = (
      SELECT COALESCE(SUM(stock_quantity), 0)
      FROM product_variants
      WHERE product_id = products.id
    )
    WHERE id IN (
      SELECT DISTINCT (item->>'product_id')::uuid
      FROM unnest(items) AS item
    );

    -- Return created order
    RETURN QUERY
    SELECT
      o.id, o.order_number, o.user_id, o.order_status,
      o.payment_status, o.total_amount, o.created_at
    FROM orders o
    WHERE o.id = new_order_id;

    -- Success - commit implicit
  EXCEPTION WHEN OTHERS THEN
    -- Rollback happens automatically on exception
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;
```

### Files to Modify
- `src/services/orderService.js` (createOrder function)
- Database: Create stored procedure `create_order_with_stock_deduction`
- `src/migrations/add_stock_deduction_procedure.sql` (new file)

### Tests Required

**Unit Test:**
```javascript
describe('Stock Race Condition Prevention', () => {
  it('should prevent overselling with concurrent orders', async () => {
    // Setup: Product has 5 units
    const variant = await createTestVariant({ stock_quantity: 5 });

    // Simulate 3 concurrent requests, each trying to order 2 units
    const promises = [
      createOrderWithItem({ variant_id: variant.id, quantity: 2 }),
      createOrderWithItem({ variant_id: variant.id, quantity: 2 }),
      createOrderWithItem({ variant_id: variant.id, quantity: 2 }),
    ];

    const results = await Promise.allSettled(promises);

    // 2 should succeed, 1 should fail (only 5 units available)
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    expect(succeeded).toBe(2);
    expect(failed).toBe(1);

    // Verify stock is correct (not negative)
    const updatedVariant = await getVariant(variant.id);
    expect(updatedVariant.stock_quantity).toBe(1);  // 5 - 2 - 2 = 1
    expect(updatedVariant.stock_quantity).toBeGreaterThanOrEqual(0);
  });

  it('should prevent stock from going negative', async () => {
    const variant = await createTestVariant({ stock_quantity: 3 });

    // Try to order more than available
    const order = await createOrderWithItem({
      variant_id: variant.id,
      quantity: 5  // More than 3 available
    });

    expect(order).toBeUndefined();  // Should fail

    // Verify stock didn't change
    const updatedVariant = await getVariant(variant.id);
    expect(updatedVariant.stock_quantity).toBe(3);
  });

  it('should be atomically consistent', async () => {
    // If order creation fails mid-way, stock should not be deducted
    const variant = await createTestVariant({ stock_quantity: 10 });
    const initialStock = variant.stock_quantity;

    try {
      // Attempt order creation with invalid data
      await createOrderWithItem({
        variant_id: variant.id,
        quantity: 5,
        invalid_field: 'should-cause-error'
      });
    } catch (error) {
      // Expected to fail
    }

    // Verify stock unchanged (rollback occurred)
    const updatedVariant = await getVariant(variant.id);
    expect(updatedVariant.stock_quantity).toBe(initialStock);
  });
});
```

**Integration Test:**
```javascript
describe('Concurrent Order Creation', () => {
  it('should handle 10 concurrent orders safely', async () => {
    const variant = await createTestVariant({ stock_quantity: 100 });

    // Create 10 concurrent orders, each for 10 units
    const promises = Array(10).fill(null).map(() =>
      createOrderWithItem({ variant_id: variant.id, quantity: 10 })
    );

    const results = await Promise.allSettled(promises);

    // Verify all succeeded
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    expect(succeeded).toBe(10);

    // Verify stock is exactly 0 (100 - 10*10)
    const updatedVariant = await getVariant(variant.id);
    expect(updatedVariant.stock_quantity).toBe(0);
  });
});
```

### Acceptance Criteria
- [ ] Stock validation and deduction are atomic
- [ ] Concurrent orders cannot exceed available stock
- [ ] Stock never goes negative
- [ ] All tests pass
- [ ] Load test with 100 concurrent orders succeeds
- [ ] Database transactions properly rolled back on error
- [ ] Stored procedure tested in Supabase environment

### Deployment Steps
1. **Create Feature Branch:** `git checkout -b fix/stock-race-condition`
2. **Create Migration:** Add stored procedure SQL
3. **Update Service:** Modify orderService.js
4. **Run Tests:** `npm test -- stock.test.js`
5. **Database Review:** Senior DBA reviews procedure
6. **Push & Create PR:**
   ```bash
   git add src/services/orderService.js src/migrations/add_stock_deduction_procedure.sql
   git commit -m "fix: Make order creation atomic with stock deduction (FIX-002)"
   git push origin fix/stock-race-condition
   ```
7. **Staging Deployment:** Deploy to staging first
8. **Stress Test:** 1000+ concurrent orders on staging
9. **Merge & Deploy:** After stress tests pass

### Rollback Plan
```bash
# If issue discovered:
# 1. Revert code change
git revert <commit-sha>

# 2. Drop procedure (if new)
# In Supabase SQL Editor:
DROP FUNCTION create_order_with_stock_deduction(jsonb, jsonb[]);

# 3. Redeploy previous version
```

### Dependencies/Blockers
- Database must support stored procedures (Supabase does)
- Requires understanding of PostgreSQL transactions
- Must test thoroughly in staging before production

### Suggested Owner
**BACKEND_DEV** + **DB_ADMIN** (Database expert)

### Effort Estimate
**LARGE** (6 hours including testing)

### Priority Tag
**CRITICAL**

---

## FIX-003: Add Missing Permission Definition

**Issue ID:** 1.3 | **Severity:** CRITICAL - FEATURE BROKEN
**Audit Link:** ENGINEERING_AUDIT_REPORT.md § 1.3
**Status:** OPEN

### Problem
Settings endpoint requires `manage_settings` permission that is never defined in the auth middleware, causing all users to receive 403 Forbidden.

### Root Cause
Middleware code at `src/routes/settings.js` line 25 calls `requirePermission('manage_settings')`, but the permission is not defined in the `adminPermissions` object in `src/middleware/auth.js`.

### Impact Assessment
- **Business Risk:** Admin cannot update store configuration
- **Feature Status:** Completely broken
- **User Impact:** Settings page unusable

### Proposed Fix

**File:** `src/middleware/auth.js`

```javascript
// CURRENT CODE (INCOMPLETE)
const adminPermissions = {
  owner: [
    'manage_products',
    'manage_categories',
    'manage_orders',
    'manage_customers',
    'manage_admins',
    // 'manage_settings' ← MISSING!
  ],
  manager: [
    'manage_products',
    'manage_categories',
    'manage_orders',
    // 'manage_settings' ← MISSING!
  ],
  staff: [
    'manage_products',
    'manage_categories',
    'manage_orders',
    // 'manage_settings' ← MISSING!
  ]
};

// FIXED CODE
const adminPermissions = {
  owner: [
    'manage_products',
    'manage_categories',
    'manage_orders',
    'manage_customers',
    'manage_admins',
    'manage_settings'  // ← ADD THIS
  ],
  manager: [
    'manage_products',
    'manage_categories',
    'manage_orders',
    'manage_settings'  // ← ADD THIS
  ],
  staff: [
    'manage_products',
    'manage_categories',
    'manage_orders',
    // staff CANNOT manage settings
  ]
};

// Also update requirePermission middleware to restrict settings to owner only
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Special case: Only owner can manage settings
    if (permission === 'manage_settings' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Only owner can manage store settings'
      });
    }

    // General permission check
    const userPermissions = adminPermissions[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Permission denied: ${permission}`
      });
    }

    next();
  };
}
```

### Files to Modify
- `src/middleware/auth.js` (Add permission definition + update requirePermission)

### Tests Required

**Unit Test:**
```javascript
describe('Settings Permission', () => {
  it('should allow owner to manage settings', async () => {
    const ownerToken = generateTestToken({ role: 'owner' });

    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ store_name: 'New Store Name' });

    expect(res.status).toBe(200);  // Not 403
  });

  it('should deny manager access to settings', async () => {
    const managerToken = generateTestToken({ role: 'manager' });

    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ store_name: 'New Name' });

    expect(res.status).toBe(403);
  });

  it('should deny staff access to settings', async () => {
    const staffToken = generateTestToken({ role: 'staff' });

    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ store_name: 'New Name' });

    expect(res.status).toBe(403);
  });

  it('should allow manager to update products', async () => {
    const managerToken = generateTestToken({ role: 'manager' });

    const res = await request(app)
      .put('/api/products/123')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'New Product' });

    // Should not be blocked by permission
    // May fail for other reasons, but not 403 permission denied
    expect(res.status).not.toBe(403);
  });
});
```

### Acceptance Criteria
- [ ] Owner can update settings (200 OK)
- [ ] Manager cannot update settings (403)
- [ ] Staff cannot update settings (403)
- [ ] Other permissions unaffected
- [ ] Tests pass

### Deployment Steps
1. **Create Feature Branch:** `git checkout -b fix/add-settings-permission`
2. **Update auth.js:** Add permission definition
3. **Run Tests:** `npm test -- permission.test.js`
4. **Push & Create PR:**
   ```bash
   git add src/middleware/auth.js
   git commit -m "fix: Add manage_settings permission definition (FIX-003)"
   git push origin fix/add-settings-permission
   ```
5. **Merge & Deploy:** After test approval

### Rollback Plan
Simple revert:
```bash
git revert <commit-sha>
```

### Dependencies/Blockers
None - standalone fix

### Suggested Owner
**BACKEND_DEV**

### Effort Estimate
**SMALL** (30 minutes)

### Priority Tag
**CRITICAL**

---

## FIX-004: Apply Database Migrations

**Issue ID:** 1.4 | **Severity:** CRITICAL - RUNTIME ERRORS
**Audit Link:** ENGINEERING_AUDIT_REPORT.md § 1.4
**Status:** OPEN

### Problem
Code references database columns that don't exist, causing "column does not exist" errors at runtime.

### Root Cause
Missing database migrations for:
1. `orders.stock_deducted` (BOOLEAN)
2. `orders.stock_deducted_at` (TIMESTAMP)
3. `members.unsubscribe_token` (VARCHAR)

### Impact Assessment
- **Feature Status:** BROKEN
- **Error Type:** Runtime database errors
- **Affected Features:** Payment verification, newsletter unsubscribe
- **User Experience:** Errors when using features

### Proposed Fix

**Migration 1: Add stock deduction tracking**

**File:** `migrations/001_add_stock_deducted_columns.sql`

```sql
-- Add columns to track when stock was deducted
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted_at TIMESTAMP DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_stock_deducted
ON orders(stock_deducted);

-- Add constraint: if stock_deducted is true, stock_deducted_at must be set
ALTER TABLE orders
ADD CONSTRAINT chk_stock_deducted_timestamp
CHECK (
  (stock_deducted = false AND stock_deducted_at IS NULL) OR
  (stock_deducted = true AND stock_deducted_at IS NOT NULL)
);
```

**Migration 2: Add newsletter unsubscribe token**

**File:** `migrations/002_add_unsubscribe_token.sql`

```sql
-- Add unsubscribe token for secure unsubscribe links
ALTER TABLE members ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(255) UNIQUE DEFAULT NULL;

-- Generate tokens for existing members
UPDATE members
SET unsubscribe_token = gen_random_uuid()::text
WHERE unsubscribe_token IS NULL;

-- Make column required for future inserts
ALTER TABLE members ALTER COLUMN unsubscribe_token SET NOT NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_members_unsubscribe_token
ON members(unsubscribe_token);
```

### How to Apply

**Option A: Manual in Supabase SQL Editor**
1. Go to Supabase dashboard → SQL Editor
2. Paste Migration 1 above → Click "Run"
3. Wait for success message
4. Paste Migration 2 above → Click "Run"
5. Verify with:
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'orders'
   AND column_name IN ('stock_deducted', 'stock_deducted_at');

   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'members'
   AND column_name = 'unsubscribe_token';
   ```

**Option B: Using Migration CLI (if available)**
```bash
# Run migrations in order
npm run migrate -- --file migrations/001_add_stock_deducted_columns.sql
npm run migrate -- --file migrations/002_add_unsubscribe_token.sql

# Verify
npm run migrate -- --status
```

**Option C: Programmatic (Node.js)**
```javascript
// migrations.js
const supabase = require('@supabase/supabase-js');

async function runMigrations() {
  const client = supabase.createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY  // Use service key for DDL
  );

  const migrations = [
    {
      name: '001_add_stock_deducted',
      sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT false;...`
    },
    {
      name: '002_add_unsubscribe_token',
      sql: `ALTER TABLE members ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(255) UNIQUE;...`
    }
  ];

  for (const migration of migrations) {
    console.log(`Running: ${migration.name}`);
    const { error } = await client.rpc('execute_sql', { sql: migration.sql });
    if (error) {
      console.error(`Failed: ${migration.name}`, error);
      return false;
    }
    console.log(`✓ ${migration.name}`);
  }

  return true;
}

runMigrations().then(success => {
  process.exit(success ? 0 : 1);
});
```

### Files to Create/Modify
- `migrations/001_add_stock_deducted_columns.sql` (new)
- `migrations/002_add_unsubscribe_token.sql` (new)
- `migrations/index.js` (if using migration tracking - optional)

### Tests Required

**Verification Query:**
```sql
-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('orders', 'members')
ORDER BY table_name, ordinal_position;

-- Expected output:
-- orders | stock_deducted | boolean
-- orders | stock_deducted_at | timestamp without time zone
-- members | unsubscribe_token | character varying
```

**Integration Test:**
```javascript
describe('Database Migrations', () => {
  it('should have stock_deducted columns in orders table', async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('stock_deducted, stock_deducted_at')
      .limit(1);

    expect(error).toBeNull();  // No column missing error
    expect(data).toBeDefined();
  });

  it('should have unsubscribe_token in members table', async () => {
    const { data, error } = await supabase
      .from('members')
      .select('unsubscribe_token')
      .limit(1);

    expect(error).toBeNull();  // No column missing error
    expect(data).toBeDefined();
  });

  it('should enforce stock_deducted constraints', async () => {
    // Attempt invalid row
    const { error } = await supabase
      .from('orders')
      .insert({
        stock_deducted: true,
        stock_deducted_at: null,  // ← Invalid: true but no timestamp
        // ... other required fields
      });

    expect(error).toBeDefined();  // Should be rejected
  });
});
```

### Acceptance Criteria
- [ ] `orders.stock_deducted` column exists (BOOLEAN)
- [ ] `orders.stock_deducted_at` column exists (TIMESTAMP)
- [ ] `members.unsubscribe_token` column exists (VARCHAR)
- [ ] All indexes created
- [ ] Constraints enforced
- [ ] No "column does not exist" errors in app
- [ ] Payment verification feature works
- [ ] Newsletter unsubscribe feature works

### Deployment Steps
1. **Backup Database:** Supabase → Settings → Backups → Create backup
2. **Run Migration 1:**
   - In Supabase SQL Editor: Paste and run
   - Verify success
3. **Run Migration 2:**
   - In Supabase SQL Editor: Paste and run
   - Verify success
4. **Verify with Queries:** Run verification queries above
5. **Deploy Code:** Push code that uses these columns (FIX-002)

### Rollback Plan
If issue discovered:
```sql
-- Rollback Migration 2
ALTER TABLE members DROP COLUMN IF EXISTS unsubscribe_token;

-- Rollback Migration 1
ALTER TABLE orders DROP COLUMN IF EXISTS stock_deducted;
ALTER TABLE orders DROP COLUMN IF EXISTS stock_deducted_at;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_stock_deducted_timestamp;
DROP INDEX IF EXISTS idx_orders_stock_deducted;
```

**Note:** This is a data-modifying migration. Backups are essential before running.

### Dependencies/Blockers
- Requires database write access
- Should be run on staging first
- Must create backup before running on production

### Suggested Owner
**DB_ADMIN**

### Effort Estimate
**SMALL** (1 hour including verification)

### Priority Tag
**CRITICAL**

---

## FIX-005: Add Loading States to Critical Buttons

**Issue ID:** 3.1 | **Severity:** CRITICAL - UX/SAFETY
**Audit Link:** ENGINEERING_AUDIT_REPORT.md § 3.1
**Status:** OPEN

### Problem
Critical async buttons (Place Order, Save Product, Add to Cart) have no loading feedback, allowing users to double-click and potentially create duplicate orders.

### Root Cause
No loading state implementation on buttons that perform async operations.

### Impact Assessment
- **UX Risk:** Users unsure if actions succeeded
- **Financial Risk:** Double-clicks could create duplicate orders
- **Trust Risk:** App appears broken (no feedback)

### Proposed Fix

**Step 1: Create Reusable AsyncButtonHandler**

**File:** `js/async-button-handler.js` (new file)

```javascript
/**
 * AsyncButtonHandler - Manages loading states for async button operations
 * Prevents double-clicks, shows spinner, disables button during operation
 *
 * Usage:
 *   const handler = new AsyncButtonHandler('submitBtn', {
 *     loadingText: 'Processing...',
 *     timeout: 30000
 *   });
 *
 *   handler.on('click', async () => {
 *     const result = await someAsyncOperation();
 *     return result;
 *   });
 */
class AsyncButtonHandler {
  constructor(buttonId, options = {}) {
    this.button = document.getElementById(buttonId);
    if (!this.button) {
      console.error(`Button with ID "${buttonId}" not found`);
      return;
    }

    this.originalText = this.button.textContent;
    this.originalHTML = this.button.innerHTML;
    this.originalClass = this.button.className;
    this.isLoading = false;
    this.asyncCallback = null;

    // Configuration
    this.options = {
      loadingText: options.loadingText || 'Processing...',
      loadingClass: options.loadingClass || 'loading',
      spinner: options.spinner || '⏳ ',
      timeout: options.timeout || 30000,
      preventDoubleClick: options.preventDoubleClick !== false,
      onStart: options.onStart || null,
      onSuccess: options.onSuccess || null,
      onError: options.onError || null,
      onFinally: options.onFinally || null,
    };

    this.setupClickHandler();
  }

  setupClickHandler() {
    this.button.addEventListener('click', (e) => {
      // Prevent double-click if already loading
      if (this.isLoading && this.options.preventDoubleClick) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      // Execute async operation
      this.executeAsync();
    });
  }

  async executeAsync() {
    if (this.isLoading) return;
    if (!this.asyncCallback) {
      console.error('No async callback configured');
      return;
    }

    this.setLoading(true);

    // Call onStart callback
    if (this.options.onStart) {
      this.options.onStart();
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Request timeout')),
        this.options.timeout
      )
    );

    try {
      // Race against timeout
      const result = await Promise.race([
        this.asyncCallback(),
        timeoutPromise
      ]);

      // Call onSuccess callback
      if (this.options.onSuccess) {
        this.options.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('Async operation failed:', error);

      // Call onError callback
      if (this.options.onError) {
        this.options.onError(error);
      }

      // Show error to user
      const errorMsg = error.message || 'An error occurred. Please try again.';
      if (typeof showNotification === 'function') {
        showNotification(errorMsg, 'error');
      }

      throw error;
    } finally {
      this.setLoading(false);

      // Call onFinally callback
      if (this.options.onFinally) {
        this.options.onFinally();
      }
    }
  }

  setLoading(loading) {
    this.isLoading = loading;

    if (loading) {
      // Disable button and show loading state
      this.button.disabled = true;
      this.button.classList.add(this.options.loadingClass);

      // Add spinner and loading text
      const spinner = document.createElement('span');
      spinner.className = 'button-spinner';
      spinner.textContent = this.options.spinner;

      const text = document.createElement('span');
      text.className = 'button-text';
      text.textContent = this.options.loadingText;

      this.button.innerHTML = '';
      this.button.appendChild(spinner);
      this.button.appendChild(text);
    } else {
      // Re-enable button and restore original state
      this.button.disabled = false;
      this.button.classList.remove(this.options.loadingClass);
      this.button.textContent = this.originalText;

      // Try to restore original HTML if it was more complex
      if (this.originalHTML.includes('<')) {
        this.button.innerHTML = this.originalHTML;
      }
    }
  }

  on(event, callback) {
    if (event === 'click') {
      this.asyncCallback = callback;
    }
    return this;  // Allow chaining
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsyncButtonHandler;
}
```

**Step 2: CSS Styling**

**File:** `styles.css` (add to existing stylesheet)

```css
/* Loading state styles */
button.loading {
  opacity: 0.7;
  cursor: wait !important;
}

button.loading .button-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

button.loading .button-text {
  margin-left: 4px;
}

/* Disabled state (stronger visual feedback) */
button:disabled {
  pointer-events: none;
  opacity: 0.5;
}

/* Error state */
button.error {
  background-color: #dc2626;
  color: white;
}
```

**Step 3: Implement on "Place Order" Button**

**File:** `checkout.html`

```html
<!-- Before closing </body> tag -->
<script src="js/async-button-handler.js"></script>

<script>
  // Initialize async button handler for checkout
  const placeOrderHandler = new AsyncButtonHandler('placeOrderBtn', {
    loadingText: 'Creating Order...',
    timeout: 15000,  // 15 second timeout
    onStart: () => {
      // Optional: Disable form while submitting
      document.getElementById('checkoutForm').style.opacity = '0.6';
      document.getElementById('checkoutForm').style.pointerEvents = 'none';
    },
    onSuccess: (result) => {
      // Order created successfully
      if (result.success) {
        // Redirect to order confirmation
        window.location.href = `order-confirmation.html?order=${result.order_number}`;
      }
    },
    onError: (error) => {
      // Show error to user
      const errorMsg = error.message || 'Failed to create order. Please try again.';
      showNotification(errorMsg, 'error');
    },
    onFinally: () => {
      // Re-enable form
      const form = document.getElementById('checkoutForm');
      if (form) {
        form.style.opacity = '1';
        form.style.pointerEvents = 'auto';
      }
    }
  });

  // Define what happens when button is clicked
  placeOrderHandler.on('click', async () => {
    // Collect form data
    const formData = {
      first_name: document.getElementById('firstName').value,
      last_name: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      postal_code: document.getElementById('postalCode').value,
      country: document.getElementById('country').value,
      payment_method: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'bank_transfer',
    };

    // Validate form
    if (!formData.first_name || !formData.email || !formData.address) {
      throw new Error('Please fill in all required fields');
    }

    // Create order via API
    const response = await createOrderWithAPI(formData, window.Cart.items);

    return response;  // AsyncButtonHandler will check for success
  });
</script>
```

**Step 4: Implement on "Save Product" Button**

**File:** `admin/products.html`

```html
<script src="../js/async-button-handler.js"></script>

<script>
  const saveProductHandler = new AsyncButtonHandler('saveProductBtn', {
    loadingText: 'Saving Product...',
    timeout: 30000,  // 30 sec (images may take time)
    onStart: () => {
      const form = document.getElementById('productForm');
      if (form) {
        form.style.opacity = '0.6';
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.disabled = true);
      }
    },
    onSuccess: (result) => {
      showNotification('Product saved successfully!', 'success');
      // Reload products list
      if (typeof loadProducts === 'function') {
        loadProducts();
      }
    },
    onError: (error) => {
      showNotification(`Error: ${error.message}`, 'error');
    },
    onFinally: () => {
      const form = document.getElementById('productForm');
      if (form) {
        form.style.opacity = '1';
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.disabled = false);
      }
    }
  });

  saveProductHandler.on('click', async () => {
    const formData = new FormData(document.getElementById('productForm'));

    // Create product or update
    const response = await adminService.saveProduct(formData);

    return response;
  });
</script>
```

### Files to Create/Modify
- `js/async-button-handler.js` (new file)
- `styles.css` (add loading state styles)
- `checkout.html` (implement on place order button)
- `admin/products.html` (implement on save button)
- `admin/orders.html` (implement on status update button)
- Other pages with async buttons

### Tests Required

**Unit Test:**
```javascript
describe('AsyncButtonHandler', () => {
  it('should disable button while loading', async () => {
    const handler = new AsyncButtonHandler('testBtn', { timeout: 1000 });

    expect(handler.button.disabled).toBe(false);

    handler.on('click', async () => {
      await new Promise(r => setTimeout(r, 100));
    });

    // Trigger click
    const clickEvent = new MouseEvent('click');
    handler.button.dispatchEvent(clickEvent);

    // Button should be disabled during operation
    expect(handler.button.disabled).toBe(true);

    // Wait for operation to complete
    await new Promise(r => setTimeout(r, 150));

    // Button should be re-enabled
    expect(handler.button.disabled).toBe(false);
  });

  it('should prevent double-clicks', async () => {
    const handler = new AsyncButtonHandler('testBtn');
    let callCount = 0;

    handler.on('click', async () => {
      callCount++;
      await new Promise(r => setTimeout(r, 100));
    });

    const clickEvent = new MouseEvent('click');
    handler.button.dispatchEvent(clickEvent);
    handler.button.dispatchEvent(clickEvent);  // Double-click

    await new Promise(r => setTimeout(r, 150));

    expect(callCount).toBe(1);  // Should only call once
  });

  it('should handle errors gracefully', async () => {
    const handler = new AsyncButtonHandler('testBtn', {
      onError: jest.fn()
    });

    handler.on('click', async () => {
      throw new Error('Test error');
    });

    const clickEvent = new MouseEvent('click');
    handler.button.dispatchEvent(clickEvent);

    await new Promise(r => setTimeout(r, 50));

    expect(handler.options.onError).toHaveBeenCalled();
  });

  it('should timeout after specified duration', async () => {
    const handler = new AsyncButtonHandler('testBtn', { timeout: 100 });

    handler.on('click', async () => {
      await new Promise(r => setTimeout(r, 500));  // 500ms > 100ms timeout
    });

    const clickEvent = new MouseEvent('click');
    handler.button.dispatchEvent(clickEvent);

    await new Promise(r => setTimeout(r, 150));

    // Should timeout and show error
    expect(handler.isLoading).toBe(false);
  });
});
```

**E2E Test:**
```javascript
describe('Checkout with Loading State', () => {
  it('should show loading state during order creation', async () => {
    // Navigate to checkout
    await page.goto('/checkout.html');

    // Fill form
    await page.fill('#firstName', 'John');
    await page.fill('#lastName', 'Doe');
    // ... fill other fields

    // Click Place Order
    const placeOrderBtn = await page.$('#placeOrderBtn');

    // Check initial state
    expect(await placeOrderBtn.isEnabled()).toBe(true);

    // Click and monitor
    const clickPromise = page.click('#placeOrderBtn');

    // Wait a bit for loading state to show
    await page.waitForTimeout(100);

    // Check loading state
    const isLoading = await page.$eval('#placeOrderBtn', btn =>
      btn.classList.contains('loading')
    );
    expect(isLoading).toBe(true);

    // Check disabled
    expect(await placeOrderBtn.isEnabled()).toBe(false);

    // Wait for completion
    await clickPromise;

    // Should navigate to confirmation
    expect(page.url()).toContain('/order-confirmation.html');
  });
});
```

### Acceptance Criteria
- [ ] All async buttons have loading states
- [ ] Buttons disabled while loading
- [ ] Double-clicks prevented
- [ ] Loading text displayed
- [ ] Spinner animated
- [ ] Errors shown to user
- [ ] Timeout after 30 seconds
- [ ] Tests pass
- [ ] Works on mobile

### Deployment Steps
1. **Create Feature Branch:** `git checkout -b feature/async-button-loading-states`
2. **Create AsyncButtonHandler:** Add js/async-button-handler.js
3. **Add CSS:** Update styles.css
4. **Implement on Critical Buttons:**
   - Checkout: Place Order
   - Admin Products: Save Product
   - Admin Orders: Update Status
5. **Test in Browser:** Manual testing on all buttons
6. **Run Automated Tests:** `npm test`
7. **Push & Create PR:**
   ```bash
   git add js/async-button-handler.js styles.css checkout.html admin/products.html admin/orders.html
   git commit -m "feat: Add loading states to async buttons (FIX-005)"
   git push origin feature/async-button-loading-states
   ```
8. **Merge & Deploy:** After test approval

### Rollback Plan
Simply revert commits:
```bash
git revert <commit-sha>
```

### Dependencies/Blockers
- Requires frontend testing environment setup

### Suggested Owner
**FRONTEND_DEV**

### Effort Estimate
**LARGE** (10 hours - implement on all async buttons)

### Priority Tag
**CRITICAL**

---

# PHASE 1: HIGH PRIORITY ISSUES

*Objective: Fix all high-priority issues that must be resolved before launch.*

---

## FIX-006: Fix Customer Route Ordering

**Issue ID:** 2.1 | **Severity:** HIGH - FEATURE BROKEN
**Status:** OPEN

### Problem
Specific routes for `/members/subscribe` come after parameterized `/:id` route, making them unreachable.

### Root Cause
Express matches routes in order. When `/members/subscribe` is evaluated against `/:id`, it matches with id="members".

### Fix
Reorder routes: specific BEFORE parameterized

**File:** `src/routes/customers.js`

```javascript
// MOVE these routes BEFORE the /:id routes
router.get('/members/list', ...);
router.post('/members/subscribe', ...);
router.post('/members/unsubscribe', ...);
router.get('/members/:email', ...);

// THEN add parameterized routes
router.get('/:id', ...);
router.put('/:id', ...);
```

### Effort: SMALL (1 hour)
### Owner: BACKEND_DEV
### Tests: Route-specific integration tests

---

## FIX-007: Protect Product Variants Endpoint

**Issue ID:** 2.2 | **Severity:** HIGH - COMPETITIVE INTELLIGENCE
**Status:** OPEN

### Problem
`GET /api/products/:id/variants` is public, allowing competitors to scrape real-time stock levels.

### Fix
Add `verifyJWT, requireAdmin` middleware to endpoint

**File:** `src/routes/products.js` (Line 143)

```javascript
// Add auth to variants endpoint
router.get('/:id/variants',
  verifyJWT,     // ← ADD
  requireAdmin,  // ← ADD
  asyncHandler(async (req, res) => {
    // ... existing code
  })
);
```

### Effort: SMALL (30 minutes)
### Owner: BACKEND_DEV
### Tests: Unit tests for auth checking

---

## FIX-008: Add Input Validation on Settings

**Issue ID:** 2.3 | **Severity:** HIGH - DATA CORRUPTION
**Status:** OPEN

### Problem
Settings endpoint accepts any data without validation, risking database corruption.

### Fix
Add validation chains using express-validator

**File:** `src/routes/settings.js`

```javascript
const { body, validationResult } = require('express-validator');

const validateSettings = [
  body('tax_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0-100'),
  body('shipping_cost')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Shipping cost cannot be negative'),
  body('store_name')
    .notEmpty()
    .trim()
    .withMessage('Store name required'),
];

router.put('/',
  verifyJWT,
  requireAdmin,
  requirePermission('manage_settings'),
  validateSettings,  // ← ADD
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... rest of endpoint
  })
);
```

### Effort: MEDIUM (2 hours)
### Owner: BACKEND_DEV
### Tests: Validation-specific unit tests

---

## FIX-009: Remove JWT Hardcoded Secret

**Issue ID:** 2.4 | **Severity:** HIGH - SECURITY
**Status:** OPEN

### Problem
JWT_SECRET has hardcoded fallback, allowing tokens to be forged if env variable not set.

### Fix
Remove fallback, require env variable

**File:** `src/config/jwt.js`

```javascript
// BEFORE
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';

// AFTER
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable not set');
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be at least 32 characters');
}

const JWT_SECRET = process.env.JWT_SECRET;
```

### Effort: SMALL (30 minutes)
### Owner: BACKEND_DEV
### Tests: Startup validation tests

---

## FIX-010: Improve Order Number Generation

**Issue ID:** 2.5 | **Severity:** HIGH - SECURITY
**Status:** OPEN

### Problem
Math.random() is predictable and not cryptographically secure.

### Fix
Use UUID for better randomness

**File:** `src/services/orderService.js`

```javascript
import { randomUUID } from 'crypto';

function generateOrderNumber() {
  // Format: ORD-XXXXXXXX (where X is UUID-based)
  const uniqueId = randomUUID().substring(0, 8).toUpperCase();
  return `ORD-${uniqueId}`;
}

// Example output: ORD-A7C3E2B9
```

### Effort: SMALL (1 hour)
### Owner: BACKEND_DEV
### Tests: Order number uniqueness tests

---

## FIX-011: Sanitize Image Upload Filenames

**Issue ID:** 2.6 | **Severity:** HIGH - SECURITY
**Status:** OPEN

### Problem
Image filenames not sanitized, allowing path traversal attacks.

### Fix
Use path.basename() to strip directory components

**File:** `src/routes/products.js` (Line 65)

```javascript
import path from 'path';

// BEFORE
const filename = `${productId}/${req.file.originalname}`;

// AFTER
const filename = `${productId}/${path.basename(req.file.originalname)}`;
```

### Effort: SMALL (1 hour)
### Owner: BACKEND_DEV
### Tests: Path traversal attack tests

---

## FIX-012: Fix Import Inconsistencies

**Issue ID:** 2.7 | **Severity:** HIGH - RUNTIME
**Status:** OPEN

### Problem
Order service uses both dynamic and direct imports inconsistently.

### Fix
Use consistent ES6 imports throughout

**File:** `src/services/orderService.js`

```javascript
// Use consistent imports at top of file
import {
  reduceOrderStockAtomic,
  restoreStock,
  getProductVariant
} from './productService.js';

// Then use throughout:
const result = await reduceOrderStockAtomic(items);
const restored = await restoreStock(variantId, quantity);
```

### Effort: SMALL (1 hour)
### Owner: BACKEND_DEV
### Tests: Integration tests

---

## FIX-013: Add Webhook Signature Verification

**Issue ID:** 2.8 | **Severity:** HIGH - SECURITY
**Status:** OPEN

### Problem
Webhook endpoints don't verify signatures, allowing fake email events.

### Fix
Add HMAC signature verification

**File:** `src/routes/webhooks.js`

```javascript
import crypto from 'crypto';

router.post('/resend', (req, res) => {
  const signature = req.headers['x-resend-signature'];
  const timestamp = req.headers['x-resend-timestamp'];

  // Verify signature
  const signedContent = `${timestamp}.${JSON.stringify(req.body)}`;
  const hash = crypto
    .createHmac('sha256', process.env.RESEND_WEBHOOK_SECRET)
    .update(signedContent)
    .digest('base64');

  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Safe to process
  processEmailEvent(req.body);
  res.json({ success: true });
});
```

### Effort: SMALL (1 hour)
### Owner: BACKEND_DEV
### Tests: Webhook security tests

---

# PHASE 2: MEDIUM PRIORITY ISSUES

*Objective: Address feature enhancements and reliability improvements. Can be scheduled post-launch if needed.*

---

**Note:** Phase 2 contains 12 medium-priority issues. See ENGINEERING_AUDIT_REPORT.md sections 4.1-4.12 for details on:

- Category slug collision prevention
- Asynchronous email service
- Order audit logging
- Product colors/sizes table normalization
- Real-time stock updates
- Rate limiting documentation
- CSRF protection on forms
- Mobile admin UI responsiveness
- Error logging service
- API documentation
- Customer notes system
- Shipment tracking integration

Each Medium priority task has effort estimates of 1-10 hours and can be scheduled independently post-launch.

---

# PHASE 3: LOW PRIORITY IMPROVEMENTS

*Objective: Polish and nice-to-have features for post-launch*

---

- Product review system
- Customer wishlists
- Bulk operations in admin
- Analytics dashboard enhancements
- Newsletter A/B testing

---

## QA & VERIFICATION CHECKLIST

### Phase 0 (Critical) Verification

**Security Tests:**
- [ ] Order access requires authentication
- [ ] Order access verifies ownership
- [ ] Stock never goes negative (stress test: 100 concurrent orders)
- [ ] Settings permission enforced
- [ ] JWT secret required (app won't start without it)
- [ ] Product variants endpoint requires admin auth
- [ ] Image upload sanitizes filenames
- [ ] Order numbers are unique and unguessable (1000 generated)

**Database Tests:**
- [ ] `orders.stock_deducted` column exists
- [ ] `orders.stock_deducted_at` column exists
- [ ] `members.unsubscribe_token` column exists
- [ ] All indexes created
- [ ] Constraints enforced

**UX Tests:**
- [ ] Place Order button disabled while loading
- [ ] Spinner visible during operation
- [ ] Double-clicks prevented
- [ ] Error shown on failure
- [ ] Timeout after 30 seconds
- [ ] Save Product button loading state works
- [ ] No duplicate orders possible

**Manual Testing:**
- [ ] Create test order end-to-end
- [ ] Verify stock deducted correctly
- [ ] Verify order cannot be accessed without auth
- [ ] Admin can view all orders
- [ ] Update store settings (tax, shipping, bank details)
- [ ] All settings persist

### Phase 1 (High) Verification

**Backend Tests:**
- [ ] Newsletter signup works (`/members/subscribe` reachable)
- [ ] Newsletter unsubscribe works
- [ ] Product variants endpoint protected
- [ ] Invalid settings rejected
- [ ] JWT secret required in environment
- [ ] Order numbers are cryptographically random
- [ ] Image uploads sanitized
- [ ] Order stock deduction consistent

**Integration Tests:**
- [ ] 100 concurrent orders process correctly
- [ ] No race conditions in stock management
- [ ] Emails sent asynchronously
- [ ] Webhooks verified

---

## RELEASE READINESS GATES

**Gate 1: All Critical Issues Closed**
```bash
# Verify all CRITICAL issues fixed
git log --oneline feature/dynamic-categories | grep "FIX-00[1-5]:" | wc -l
# Should show 5
```

**Gate 2: Database Migrations Applied**
```sql
-- Verify in Supabase
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name IN ('orders', 'members')
AND column_name IN ('stock_deducted', 'stock_deducted_at', 'unsubscribe_token');
-- Should return 3
```

**Gate 3: All Tests Pass**
```bash
npm test -- --coverage
# All tests must pass
# Coverage should be > 80%
```

**Gate 4: Security Audit Pass**
```bash
npm run security-check
# No high/critical vulnerabilities
```

**Gate 5: Load Test Pass (100+ concurrent users)**
```bash
# Artillery or similar
artillery run load-test-config.yml
# 95th percentile latency < 2 seconds
# Error rate < 0.1%
```

**Gate 6: Smoke Tests Pass**
```bash
# Basic functionality
npm run smoke-tests
# All critical user flows work
```

---

## COMMUNICATION & TRACKING

### GitHub Issue Template

```markdown
## [FIX-XXX] Issue Title

**Category:** Critical / High / Medium / Low
**Audit Link:** ENGINEERING_AUDIT_REPORT.md § X.X
**Milestone:** Phase 0 / Phase 1 / Phase 2 / Phase 3

### Description
[Copy from audit report]

### Root Cause
[From audit report]

### Proposed Solution
[From remediation plan]

### Files to Modify
- [ ] src/file1.js
- [ ] src/file2.js
- [ ] migrations/migration.sql

### Tests Required
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests (if applicable)

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Testing Checklist
- [ ] Local tests pass
- [ ] Staging tests pass
- [ ] Security review passed
- [ ] Code review passed

### Deployment
- Branch: `fix/issue-name`
- No database downtime required
- No feature flag needed
- Rollback: Simple revert
```

### Pull Request Template

```markdown
## Fixes #[ISSUE_NUMBER] FIX-[XXX]

### Changes Made
- [Change 1]
- [Change 2]
- [Change 3]

### Testing Done
- [Test 1]
- [Test 2]

### Deployment Notes
- No database changes required
- Backward compatible
- Ready for immediate deployment

### Checklist
- [ ] Tests pass
- [ ] Code reviewed
- [ ] No breaking changes
- [ ] Documentation updated
```

### Progress Tracking

Update this status in ENGINEERING_AUDIT_REPORT.md as fixes are completed:

```markdown
| Issue | Status | PR | Merged | Tested | Status |
|-------|--------|----|----|--------|---------|
| FIX-001 | OPEN | - | - | - | ❌ |
| FIX-002 | OPEN | - | - | - | ❌ |
| FIX-003 | OPEN | - | - | - | ❌ |
```

### Weekly Status Report Template

```
## Week of [DATE]

### Critical Issues
- FIX-001: [Status] - 80% complete
- FIX-002: [Status] - 50% complete
- FIX-003: [Status] - 100% complete ✓

### Blockers
- None

### Next Week Focus
- Complete FIX-002
- Start FIX-006

### Metrics
- Tests passing: 45/50
- Code coverage: 82%
- Security scan: 0 critical issues
```

---

## IMPLEMENTATION SEQUENCE

### **Day 1 (Critical Security)**
1. **FIX-003** (30 min) - Add settings permission → Unblocks settings
2. **FIX-001** (2 hrs) - Order access control → Blocks data breach
3. **FIX-004** (1 hr) - Apply migrations → Fixes runtime errors
4. **Tests & Verification** (1 hr)

**End of Day 1 Result:** 3 critical issues fixed

### **Day 2 (Inventory Integrity)**
1. **FIX-002** (6 hrs) - Stock race condition → Database atomic transaction
   - Create stored procedure
   - Apply migration
   - Update service code
   - Stress test (100 concurrent orders)
2. **Tests & Verification** (1 hr)

**End of Day 2 Result:** Inventory integrity guaranteed

### **Day 3-4 (UX & High Priority)**
1. **FIX-005** (10 hrs) - Loading states on all async buttons
   - Create AsyncButtonHandler
   - Implement on 5+ critical buttons
   - CSS styling
   - Manual testing
2. **FIX-006 to FIX-013** (8 hrs) - All high-priority security fixes
   - Route ordering
   - Input validation
   - JWT hardening
   - Order number generation
   - Image sanitization
   - Webhook verification

**End of Day 4 Result:** All critical + high-priority issues fixed

### **Day 5+ (QA & Documentation)**
1. Comprehensive testing
2. Security audit
3. Load testing
4. Documentation
5. Deploy to staging
6. Final UAT

---

## SUCCESS CRITERIA

**All Critical Issues Fixed:**
- [ ] FIX-001: Order access secured
- [ ] FIX-002: Stock race condition resolved
- [ ] FIX-003: Settings permission added
- [ ] FIX-004: Migrations applied
- [ ] FIX-005: Loading states implemented

**All High-Priority Issues Fixed:**
- [ ] FIX-006 through FIX-013 completed

**QA Passed:**
- [ ] All tests green
- [ ] Security audit pass
- [ ] Load test pass (100+ concurrent)
- [ ] Manual smoke tests pass

**Ready for Launch:**
- [ ] All gates passed
- [ ] Rollback plan tested
- [ ] Monitoring configured
- [ ] Team trained

---

## DOCUMENT HISTORY

| Date | Author | Change |
|------|--------|--------|
| Nov 2025 | Audit Team | Initial plan created |
| - | - | - |

---

**Remediation Plan Status:** READY FOR IMPLEMENTATION
**Approval Required:** YES
**Next Step:** Begin Phase 0 tasks

