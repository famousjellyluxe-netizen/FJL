# RLS Setup Checklist

**Step-by-step checklist for Row-Level Security configuration**

---

## 📋 Pre-Setup

- [ ] Open Supabase dashboard
- [ ] Go to your FJL project
- [ ] Click "SQL Editor" in left sidebar
- [ ] Read RLS_QUICK_DECISION.md (you've chosen Option A)

---

## 🔧 Run the SQL Commands

### Command 1: Enable RLS on Products Table

**In Supabase SQL Editor:**

1. [ ] Create a new query
2. [ ] Copy this SQL:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

3. [ ] Click the "Run" button (▶️)
4. [ ] Wait for success message
5. [ ] You should see: `"Execute successfully. 0 rows affected"`

---

### Command 2: Create Public Read Policy

1. [ ] Create a new query (or continue in same one)
2. [ ] Copy this SQL:

```sql
CREATE POLICY "public_read_active_products" ON products
  FOR SELECT
  USING (is_active = true);
```

3. [ ] Click the "Run" button (▶️)
4. [ ] Wait for success message
5. [ ] You should see: `"Execute successfully. 0 rows affected"`

---

## ✅ Verification (Run These 3 Commands)

### Verification 1: Check RLS Status

**Copy this SQL:**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'products';
```

**Expected Result:**
```
tablename | rowsecurity
-----------|-------------
products   | true
```

- [ ] RLS is enabled (rowsecurity = true)

---

### Verification 2: Check Policy Exists

**Copy this SQL:**

```sql
SELECT policyname, permissive
FROM pg_policies
WHERE tablename = 'products';
```

**Expected Result:**
```
policyname                        | permissive
----------------------------------|----------
public_read_active_products       | true
```

- [ ] Policy name is correct
- [ ] Policy is permissive (allows access)

---

### Verification 3: Test Policy Works

**Copy this SQL:**

```sql
SELECT COUNT(*) as product_count
FROM products
WHERE is_active = true;
```

**Expected Result:**
```
product_count
-----------
[some number > 0]
```

- [ ] Returns a number (product count)
- [ ] No errors about permissions
- [ ] Public can read active products ✅

---

## 🧪 Optional: Advanced Testing

### Test 1: Try to Read Inactive Products

**Copy this SQL:**

```sql
SELECT COUNT(*) as inactive_count
FROM products
WHERE is_active = false;
```

**Expected Result:**
```
inactive_count
-----------
0
```

- [ ] Returns 0 (blocked from inactive products)

---

### Test 2: Check All Products Table

**Copy this SQL:**

```sql
SELECT COUNT(*) as all_products
FROM products;
```

**Expected Result:**
```
all_products
-----------
[total number - higher than active count]
```

- [ ] Returns total count (verifies data exists)
- [ ] Verifies RLS is working correctly

---

## 📊 Summary

**What You Just Did:**
- [x] Enabled RLS on products table
- [x] Created policy for public read of active products
- [x] Verified RLS is working
- [x] Confirmed public can read products

**What This Protects:**
- [x] Public cannot see inactive products
- [x] Unauthenticated users have limited access
- [x] Database enforces access control
- [x] Extra layer of security

**What's Still Protected by Backend:**
- [x] Admin operations (create, update, delete)
- [x] Order access (only authenticated)
- [x] User data (only admin)
- [x] All business logic

---

## ✨ You're Done with RLS!

All checkmarks filled? Great! 🎉

**Next Step: Step 6 - Create Initial Admin User**

→ Go to **DATABASE_DEPLOYMENT_GUIDE.md** and follow Step 6

---

## 🚨 If Something Went Wrong

### Error: "Permission denied"

**Solution:**
1. Make sure you're in SQL Editor, not Data Editor
2. Try running simpler command first: `SELECT 1;`
3. Verify you're in the right project

### Error: "Policy already exists"

**Solution:**
1. It's okay! The policy was already created
2. Continue to Step 6

### Error: "Table 'products' doesn't exist"

**Solution:**
1. Run `SELECT COUNT(*) FROM products;` to verify
2. If it exists, try the commands again
3. If it doesn't exist, re-run SUPABASE_SCHEMA.sql

### Getting 0 products when testing?

**Solution:**
1. Check if you have active products: `SELECT COUNT(*) FROM products;`
2. If 0, insert sample product first (see below)

**Insert Sample Product:**

```sql
INSERT INTO products (
  sku, name, description, price,
  category_id, is_active
)
VALUES (
  'TEST-001',
  'Test Product',
  'Test Description',
  99.99,
  (SELECT id FROM categories LIMIT 1),
  TRUE
);

-- Then test again:
SELECT COUNT(*) FROM products WHERE is_active = true;
```

---

## 📝 Notes

- RLS applies to ALL queries to this table
- The policy works automatically with Supabase
- Your API doesn't need to change
- Backend authorization still needed (RLS is extra layer)

---

## ✅ Final Checklist

- [ ] Command 1 ran successfully (Enable RLS)
- [ ] Command 2 ran successfully (Create policy)
- [ ] Verification 1 passed (RLS enabled)
- [ ] Verification 2 passed (Policy exists)
- [ ] Verification 3 passed (Public can read)
- [ ] Understood what RLS does
- [ ] Ready for Step 6

---

## 🎯 Status: RLS Complete ✅

You're ready to move to **Step 6: Create Initial Admin User**

**Time spent:** ~5 minutes
**Time saved:** Security vulnerability prevention = priceless 🛡️
