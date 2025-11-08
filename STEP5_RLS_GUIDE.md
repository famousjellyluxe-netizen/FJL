# Step 5: Row-Level Security (RLS) - Complete Guide

**Your position in deployment: Step 5 of 10**

---

## 🎯 What You Need to Do

You're at **Step 5: Configure Row-Level Security (RLS)** in the DATABASE_DEPLOYMENT_GUIDE.md

This is an **OPTIONAL** but **RECOMMENDED** security layer.

---

## ⚡ Super Quick Version (2 minutes)

### Just run these 2 SQL commands in Supabase SQL Editor:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_products" ON products
  FOR SELECT
  USING (is_active = true);
```

**Done!** ✅ Move to Step 6.

---

## 📖 Slightly Longer Version (5 minutes)

### What is RLS?

RLS (Row-Level Security) is a database feature that:
- ✅ Restricts which **rows** users can access
- ✅ Works automatically based on policies
- ✅ Adds extra security layer
- ✅ Complements your backend authentication

### For FJL Specifically:

Your backend already has:
- JWT token verification
- Role-based access control
- Permission checking
- Business logic validation

**RLS adds:** A database-level policy that only active products can be read publicly

### Why Just Products?

- Products are public (anyone can browse)
- Orders are sensitive (need auth)
- Users are sensitive (need auth)
- Admins are sensitive (need auth)

So we only add RLS to **products** to prevent someone from reading inactive products if they bypass the API.

---

## 🔧 Step-by-Step Instructions

### 1. Open Supabase SQL Editor

```
1. Go to https://app.supabase.com
2. Select your FJL project
3. Click "SQL Editor" (left sidebar)
4. Click "+ New query" or use existing query
```

---

### 2. Copy First Command

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

**What it does:**
- Turns ON row-level security for products table
- All existing SELECT queries will use RLS policies

---

### 3. Paste & Run It

1. Paste the command into the SQL editor
2. Click the blue "▶️ Run" button
3. Wait for success message
4. You should see: `"Execute successfully. 0 rows affected"`

---

### 4. Copy Second Command

```sql
CREATE POLICY "public_read_active_products" ON products
  FOR SELECT
  USING (is_active = true);
```

**What it does:**
- Creates a policy that allows SELECT
- Only returns rows where is_active = true
- Automatically hides inactive products

---

### 5. Paste & Run It

1. Paste the command into the SQL editor (new query)
2. Click the blue "▶️ Run" button
3. Wait for success message
4. You should see: `"Execute successfully. 0 rows affected"`

---

## ✅ Verify It Worked

Run these 3 commands to verify:

### Command 1: Check RLS Status

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'products';
```

**Expected output:**
```
tablename | rowsecurity
-----------|-------------
products   | true
```

✅ If you see `rowsecurity = true`, RLS is enabled!

---

### Command 2: Check Policy Exists

```sql
SELECT policyname, permissive
FROM pg_policies
WHERE tablename = 'products';
```

**Expected output:**
```
policyname                        | permissive
----------------------------------|----------
public_read_active_products       | true
```

✅ If you see the policy name, it was created successfully!

---

### Command 3: Test the Policy

```sql
SELECT COUNT(*) as active_products
FROM products
WHERE is_active = true;
```

**Expected output:**
```
active_products
-----------
[some number, or 0 if no products]
```

✅ If the query runs without errors, RLS is working!

---

## 🧪 Optional: Test More Advanced Cases

### Test 1: Can't Read Inactive Products

```sql
SELECT COUNT(*) as inactive_products
FROM products
WHERE is_active = false;
```

**Expected:** Returns 0 (blocked by RLS)

---

### Test 2: Count All Products

```sql
SELECT COUNT(*) as total_products
FROM products;
```

**Expected:** Returns count of ACTIVE products only (RLS filters)

---

## 📊 What RLS Actually Does

### Before RLS:
```sql
SELECT * FROM products;
-- Returns: ALL products (active AND inactive)
```

### After RLS:
```sql
SELECT * FROM products;
-- Returns: ONLY active products (RLS filters)

SELECT * FROM products WHERE is_active = false;
-- Returns: NOTHING (blocked by policy)
```

---

## 🔐 How Your Backend Benefits

### Your Backend Code (No Changes Needed!)

```javascript
// GET /api/products - Public endpoint
const { data: products } = await supabase
  .from('products')
  .select('*');

// What happens:
// 1. Frontend sends request to backend
// 2. Backend queries Supabase
// 3. Supabase checks RLS policy
// 4. Only active products returned
// 5. Backend sends to frontend
```

**Result:** Double security!
- Backend filters logically
- Database also filters with RLS
- If backend has bug, RLS catches it

---

## 🎯 Why Only Products?

| Table | Needs RLS? | Why |
|-------|-----------|-----|
| products | ✅ YES | Public table, benefits from RLS |
| orders | ❌ NO | Already protected by API auth |
| users | ❌ NO | Already protected by API auth |
| admins | ❌ NO | Already protected by API auth |
| members | ❌ NO | Newsletter, handled by API |
| others | ❌ NO | Backend controls all access |

---

## 🚨 Common Issues & Fixes

### Issue 1: "Query returned no rows"

**Check if products exist:**
```sql
SELECT COUNT(*) FROM products;
```

**If 0 products, create a sample:**
```sql
INSERT INTO products (sku, name, price, is_active, category_id)
VALUES ('TEST-001', 'Test', 99.99, true, (SELECT id FROM categories LIMIT 1));
```

---

### Issue 2: "Permission denied"

**This shouldn't happen for RLS policies, but if it does:**
1. Make sure you're in SQL Editor (not Data Editor)
2. Try: `SELECT 1;` (simple test)
3. Refresh the page
4. Try again

---

### Issue 3: "Policy already exists"

**This means you've already run the command - it's OK!**
```sql
-- No need to run again
-- Just continue to verification
```

---

## 📚 Documentation Reference

If you want more info:

| Document | Content | Use When |
|----------|---------|----------|
| RLS_QUICK_DECISION.md | 2-minute summary | Need quick decision |
| RLS_CHECKLIST.md | Step-by-step checklist | Following along |
| RLS_SETUP_GUIDE.md | Detailed RLS info | Want deep knowledge |
| RLS_IMPLEMENTATION_SUMMARY.md | Complete overview | Understanding RLS |
| DATABASE_DEPLOYMENT_GUIDE.md | Full deployment guide | Deployment workflow |

---

## ✨ You Did It!

If all 5 verification commands passed:

✅ RLS is enabled
✅ Policy is created
✅ Public can read active products
✅ Inactive products are hidden
✅ Extra security layer added

---

## 🚀 Ready for Step 6?

Once RLS is configured, **move to Step 6: Create Initial Admin User**

### Next Steps:

1. **Step 6:** Create your first admin user
   - Generate bcrypt password hash
   - Insert admin record
   - Verify it created

2. **Step 7:** Set environment variables
   - SUPABASE_URL
   - Keys and secrets
   - Email configuration

3. **Step 8:** Test backend connection
   - Verify database connectivity
   - Confirm JWT setup

4. **Step 9:** Configure storage bucket
   - Create product-images bucket
   - Set CORS policies

5. **Step 10:** Test all API endpoints
   - Products, orders, customers
   - Authentication
   - Full workflow

---

## ✅ Checklist for Step 5

Before moving to Step 6:

- [ ] Read the RLS section above
- [ ] Understood what RLS does
- [ ] Know it's optional but recommended
- [ ] Ran the first SQL command (ALTER TABLE)
- [ ] Ran the second SQL command (CREATE POLICY)
- [ ] Ran all 3 verification commands
- [ ] All verification commands passed
- [ ] Products table has RLS enabled
- [ ] Policy is created and working
- [ ] Ready for Step 6

---

## 💡 Key Takeaway

**RLS is a database-level security feature that:**

- Works with your existing backend security
- Doesn't replace backend authentication
- Adds extra layer of defense
- Takes 5 minutes to implement
- Requires 2 SQL commands + verification

**For FJL:** Just one simple policy on products table.

---

## 🎉 Status: Step 5 Complete!

**Current Progress:**
```
✅ Step 1: Supabase Project
✅ Step 2: Connection Details
✅ Step 3: Deploy Schema
✅ Step 4: Verify Schema
✅ Step 5: RLS Configuration (YOU ARE HERE)
⏳ Step 6: Admin User
⏳ Step 7: Environment Variables
⏳ Step 8: Backend Connection
⏳ Step 9: Storage Bucket
⏳ Step 10: Test APIs
```

**Next:** Step 6 - Create Initial Admin User

---

**Ready to continue?** → Go to **DATABASE_DEPLOYMENT_GUIDE.md Step 6**
