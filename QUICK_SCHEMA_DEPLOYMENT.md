# Quick Schema Deployment to New Supabase Project

**Your new Supabase project ID:** `kgkjbardkywvdjwseafe`

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Go to Your Supabase SQL Editor

1. Open: https://app.supabase.com
2. Select your **new FJL project**
3. Click **SQL Editor** (left sidebar)
4. Click **New query** (top right)

---

### Step 2: Copy & Run Schema Script

1. Open this file: `C:\Users\rapha\Desktop\FJL\SUPABASE_SCHEMA.sql`
2. Copy **ALL** the contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (▶ button at bottom right)
5. Wait for completion (should see ✅ "Success")

---

### Step 3: Verify Tables Were Created

In the same SQL Editor, run this quick check:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**You should see these 10 tables:**
- admins
- categories
- email_logs
- members
- orders
- order_items
- products
- product_variants
- store_settings
- users

---

### Step 4: Add Initial Admin User

In SQL Editor, run this:

```sql
INSERT INTO admins (email, full_name, password_hash, role, is_active)
VALUES (
  'admin@fjl.com',
  'FJL Admin',
  '$2a$10$7takuQX0FeLnfAwQAcBlseggl.Nz6OAutH4FVWaxxrBoO4wBOhiJi',
  'owner',
  TRUE
);
```

This creates an admin user with:
- Email: `admin@fjl.com`
- Password: `*fjlclothing#` (from bcrypt hash)

---

### Step 5: Test Connection from Backend

After deployment, test your connection:

```bash
cd C:\Users\rapha\Desktop\FJL\backend
node test-supabase-connection.js
```

**Expected output:**
```
✅ Supabase client created successfully
✅ Successfully connected to store_settings table
✅ Retrieved X record(s)
```

---

### Step 6: Start Backend

```bash
npm run dev
```

**Expected output:**
```
✅ Supabase client initialized successfully
✅ Database connected - Ready to go!
Server running on port 5000
```

---

## 🎯 Summary

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to SQL Editor | Editor is open |
| 2 | Paste & run SUPABASE_SCHEMA.sql | Tables created ✅ |
| 3 | Verify 10 tables exist | All tables present ✅ |
| 4 | Add admin user | Admin user created ✅ |
| 5 | Test connection | Connection works ✅ |
| 6 | Run npm run dev | Backend starts ✅ |

---

## 📝 Which File to Copy?

Location: `C:\Users\rapha\Desktop\FJL\SUPABASE_SCHEMA.sql`

This file contains all 10 tables with:
- ✅ All columns and data types
- ✅ Primary keys and foreign keys
- ✅ Indexes (30+)
- ✅ Constraints and defaults
- ✅ Initial data in store_settings

---

## ✨ After This Works

Once schema is deployed and backend starts:
1. Step 9: Configure Storage Bucket
2. Step 10: Test API Endpoints
3. Ready for frontend testing!

---

**Let me know once you've deployed the schema!** 🚀
