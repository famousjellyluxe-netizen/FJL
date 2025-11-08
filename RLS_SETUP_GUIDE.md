# FJL Row-Level Security (RLS) Setup Guide

**Complete Step-by-Step RLS Configuration for Supabase**

---

## 📋 What is RLS?

Row-Level Security (RLS) restricts which rows users can access in a table based on policies you define. It's a security layer that:

✅ Prevents unauthorized data access
✅ Enforces business logic at database level
✅ Works automatically with Supabase Auth
✅ Protects data even if API is compromised

---

## 🎯 RLS Strategy for FJL

### Tables That Need RLS:
1. **admins** - Only admins can access
2. **orders** - Admins can read/write all, customers can read own
3. **users** - Admin access, customer can read own
4. **products** - Public read (active only), admin write

### Tables That DON'T Need RLS:
- **categories** - Public read, admin write (not sensitive)
- **product_variants** - Public read, admin write (not sensitive)
- **order_items** - Protected via order_id access
- **members** - Public write (newsletter), admin read
- **email_logs** - Admin only (no RLS needed, handle in API)
- **store_settings** - Admin only (no RLS needed, handle in API)

---

## ⚠️ IMPORTANT: RLS Considerations for FJL

Since your FJL backend uses **JWT tokens (not Supabase Auth)**, you have **2 options**:

### Option A: Use API-Level Security (RECOMMENDED for FJL)
- Keep RLS disabled
- Implement all authorization in backend code
- No Supabase Auth needed
- Maximum flexibility
- **Your current setup uses this**

### Option B: Use Supabase RLS Policies
- Enable RLS for extra database-level protection
- Requires integrating Supabase Auth
- More complex, less flexible
- Extra security layer

---

## 🔒 OPTION A: Minimal RLS (Recommended for FJL)

Since your backend already has JWT-based authentication and authorization, you can use **minimal RLS** - just protect public access:

### Step 1: Enable RLS on Sensitive Tables

**Run in Supabase SQL Editor:**

```sql
-- Enable RLS on admin and order tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

**Verify:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('admins', 'orders', 'users');

-- Expected: rowsecurity = true for these 3 tables
```

---

### Step 2: Create Default DENY Policy (Belt & Suspenders)

```sql
-- Default: Deny all access
CREATE POLICY "deny_all_by_default" ON admins
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "deny_all_by_default" ON orders
  AS RESTRICTIVE
  FOR ALL
  USING (false);

CREATE POLICY "deny_all_by_default" ON users
  AS RESTRICTIVE
  FOR ALL
  USING (false);
```

**Why?** If no policy matches, Supabase defaults to ALLOW. We want to DENY by default, then whitelist specific access.

---

### Step 3: Allow Public Read on Active Products

```sql
-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read on active products only
CREATE POLICY "public_read_active_products" ON products
  FOR SELECT
  USING (is_active = true);

-- Admins can do everything (via API checks, not RLS)
CREATE POLICY "admin_manage_products" ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);
-- ⚠️ This policy depends on API authorization
```

---

## 🔐 OPTION B: Advanced RLS with Supabase Auth (If Needed)

If you want **database-level security**, you can add RLS policies that check for admin users:

### Step 1: Enable RLS on All Sensitive Tables

```sql
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
```

---

### Step 2: Create Admin Check Function

```sql
-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE id = user_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Step 3: Products Policy (Public Read + Admin Write)

```sql
-- Anyone can read active products
CREATE POLICY "public_read_products" ON products
  FOR SELECT
  USING (is_active = true);

-- Admins can insert, update, delete
CREATE POLICY "admin_manage_products" ON products
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_update_products" ON products
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_delete_products" ON products
  FOR DELETE
  USING (is_admin(auth.uid()));
```

---

### Step 4: Orders Policy (Admin Read + Write Only)

```sql
-- Admins can read all orders
CREATE POLICY "admin_read_orders" ON orders
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can insert orders
CREATE POLICY "admin_insert_orders" ON orders
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update orders
CREATE POLICY "admin_update_orders" ON orders
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Admins can delete orders
CREATE POLICY "admin_delete_orders" ON orders
  FOR DELETE
  USING (is_admin(auth.uid()));
```

---

### Step 5: Users Policy (Admin + Self)

```sql
-- Admins can read all users
CREATE POLICY "admin_read_users" ON users
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Users can read their own profile
CREATE POLICY "user_read_own" ON users
  FOR SELECT
  USING (id = auth.uid() OR is_admin(auth.uid()));

-- Admins can update users
CREATE POLICY "admin_update_users" ON users
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Admins can delete users
CREATE POLICY "admin_delete_users" ON users
  FOR DELETE
  USING (is_admin(auth.uid()));
```

---

### Step 6: Admins Policy (Self Only)

```sql
-- Admins can read their own data
CREATE POLICY "admin_read_self" ON admins
  FOR SELECT
  USING (id = auth.uid());

-- Admins can update own password
CREATE POLICY "admin_update_self" ON admins
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

---

### Step 7: Members Policy (Public Write + Admin Read)

```sql
-- Anyone can insert (newsletter signup)
CREATE POLICY "public_signup_members" ON members
  FOR INSERT
  WITH CHECK (true);

-- Admins can read
CREATE POLICY "admin_read_members" ON members
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can update (manage subscription)
CREATE POLICY "admin_manage_members" ON members
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
```

---

## ✅ My Recommendation for FJL

### Use **OPTION A** (Minimal RLS) Because:

✅ Your backend already has JWT + RBAC
✅ Simpler to maintain
✅ No Supabase Auth required
✅ More flexibility for custom logic
✅ Easier to debug
✅ Better performance (no extra checks)

**Just do:**
```sql
-- Enable RLS on products to prevent accidental direct access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active products
CREATE POLICY "public_read_products" ON products
  FOR SELECT
  USING (is_active = true);

-- That's it! Let your backend API handle the rest.
```

---

## 🚀 Implementation Steps

### If Using OPTION A (Recommended):

**Step 1: Enable RLS on Products**
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

**Step 2: Add Public Read Policy**
```sql
CREATE POLICY "public_read_products" ON products
  FOR SELECT
  USING (is_active = true);
```

**Step 3: Verify**
```sql
-- Run this to test
SELECT * FROM products WHERE is_active = true LIMIT 5;
-- Should return active products

-- Try to read inactive products
SELECT * FROM products WHERE is_active = false;
-- Should return empty (if any exist)
```

**That's all!** Your backend API handles the rest.

---

### If Using OPTION B (Advanced):

**Run all the policy creation SQL above** in sequence, then:

**Verify Policies Created:**
```sql
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename IN ('products', 'orders', 'users', 'admins', 'members');

-- Should show all your policies
```

**Test a Policy:**
```sql
-- Enable Supabase Auth for testing
SET jwt.claims.sub = 'your-admin-id-here';

-- Try to select products (should work)
SELECT id, name FROM products LIMIT 1;

-- Try to select admins (should fail - not logged in as admin)
SELECT id, email FROM admins;
```

---

## 🔍 Check RLS Status

```sql
-- See which tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- See all policies
SELECT tablename, policyname, permissive, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
```

---

## ⚠️ Important Notes

### Your Backend Handles Authorization

```javascript
// Your backend already does this:
// 1. JWT verification ✅
// 2. Role checking ✅
// 3. Permission validation ✅
// 4. Database access control ✅

// RLS is just an extra safety layer
// It's NOT required for your security
```

### When To Use Each Option

| Aspect | Option A (Minimal) | Option B (Advanced) |
|--------|-------------------|-------------------|
| Complexity | Simple | Complex |
| Maintenance | Easy | Harder |
| Performance | Fast | Slightly slower |
| Flexibility | High | Lower |
| Extra Security | Basic | Strong |
| Needs Supabase Auth | No | Yes |
| Best For | FJL | Enterprise apps |

---

## 🧪 Testing RLS

### Test Public Access (Should Work)

```sql
-- Public read of active products - SHOULD WORK
SELECT id, name, price
FROM products
WHERE is_active = true
LIMIT 5;
```

### Test Admin Access (If Using Option B)

```sql
-- Set admin user context
SET jwt.claims.sub = 'admin-uuid-here';

-- Try to read orders - SHOULD WORK (if admin)
SELECT * FROM orders LIMIT 1;
```

### Disable RLS to Compare

```sql
-- If you want to disable RLS temporarily for testing:
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing:
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

---

## 🚨 Troubleshooting

### "Query returned no rows"

**Cause:** RLS policy is blocking access
**Solution:**
1. Check which policies exist: `SELECT * FROM pg_policies WHERE tablename = 'products';`
2. Verify policy conditions
3. Test with `SET jwt.claims.sub = 'valid-id';`

### "Permission denied for schema public"

**Cause:** Role doesn't have access
**Solution:**
1. Check role permissions: `\du` (in psql)
2. Grant permissions: `GRANT USAGE ON SCHEMA public TO role_name;`

### "No rows returned from public products"

**Cause:** `is_active = false` or policy too restrictive
**Solution:**
1. Verify products exist and are active: `SELECT COUNT(*) FROM products WHERE is_active = true;`
2. Check policy: `SELECT * FROM pg_policies WHERE tablename = 'products';`
3. Test policy directly

---

## ✅ Verification Checklist

After implementing RLS, verify:

- [ ] RLS enabled on correct tables
- [ ] Policies created successfully
- [ ] Public can read active products
- [ ] Admins can do all operations (via API)
- [ ] Inactive products not visible to public
- [ ] Orders not accessible to unauthenticated users
- [ ] No performance degradation
- [ ] All API endpoints still work

---

## 🎓 Next Steps

### 1. Choose Your Option
- **Option A (Minimal):** Run 2 SQL commands ← RECOMMENDED
- **Option B (Advanced):** Run 20+ SQL commands

### 2. Run the SQL
```sql
-- Paste into Supabase SQL Editor
-- Click "Run"
-- Verify with checking commands above
```

### 3. Test Your API
```bash
# Test that products are accessible
curl http://localhost:5000/api/products

# Test that admin endpoints still work
curl -H "Authorization: Bearer [token]" \
  http://localhost:5000/api/products/[id]
```

### 4. Move to Step 6: Create Initial Admin User

---

## 🏁 You're Ready!

Once RLS is set up (or confirmed you don't need it), move to:
→ **Step 6: Create Initial Admin User** (next in deployment guide)

---

**Choose Option A for simplicity, Option B for maximum security.**
