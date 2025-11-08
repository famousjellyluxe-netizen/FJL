# FJL Database Deployment Guide

**Production-Ready Supabase Schema Implementation**

---

## 🚀 Quick Start

### 1. Access Supabase Project

```
1. Go to https://supabase.com
2. Sign in to your project
3. Click "SQL Editor" in the left sidebar
4. Create a new query
```

### 2. Run Schema Script

```bash
# Copy the entire contents of: SUPABASE_SCHEMA.sql
# Paste into the Supabase SQL Editor
# Click "Run" button (▶)
# Wait for "Success" message
```

### 3. Verify Schema Creation

```sql
-- In SQL Editor, run:
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected output:
-- admins
-- categories
-- email_logs
-- members
-- orders
-- order_items
-- products
-- product_variants
-- store_settings
-- users
```

---

## 📋 Pre-Deployment Checklist

- [ ] Supabase project created
- [ ] JWT secret configured (min 32 chars)
- [ ] Email service configured (Resend API key)
- [ ] Storage bucket created ("product-images")
- [ ] Environment variables ready
- [ ] Backup strategy in place
- [ ] Row-level security policies planned
- [ ] Team access configured

---

## 🔧 Step-by-Step Implementation

### Step 1: Create Supabase Project

```bash
# Option A: CLI
supabase projects create --name fjl-db

# Option B: Web Console
# Go to https://app.supabase.com
# Click "New project"
# Name: "fjl-production" (or similar)
# Database password: Generate strong password
# Region: Choose closest to your users
```

### Step 2: Get Connection Details

From Supabase Dashboard:
```
1. Go to Project Settings → Database
2. Copy: Connection String (PostgreSQL)
3. Format: postgresql://user:password@host:5432/postgres

# Extract for .env:
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-key]
```

### Step 3: Initialize Database Schema

**Option A: Via Supabase Dashboard (Recommended)**

```
1. Open: https://app.supabase.com/project/[project-id]/sql
2. Create new query
3. Paste entire SUPABASE_SCHEMA.sql file
4. Click "Run"
5. Wait for completion (30-60 seconds)
```

**Option B: Via CLI**

```bash
supabase db push --project-id [project-id] < SUPABASE_SCHEMA.sql
```

**Option C: Via psql**

```bash
psql postgresql://user:password@host:5432/postgres \
  -f SUPABASE_SCHEMA.sql
```

### Step 4: Verify Schema

Run in SQL Editor:

```sql
-- Check all tables exist
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Expected: 10 tables

-- Check all indexes exist
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public';
-- Expected: 30+ indexes

-- Verify constraints
SELECT COUNT(*) FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND constraint_type = 'FOREIGN KEY';
-- Expected: 7 foreign keys
```

### Step 5: Configure Row-Level Security (Optional)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products readable by everyone" ON products
  FOR SELECT USING (is_active = true);

-- Admins can read/write orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );
```

### Step 6: Create Initial Admin User

**Important:** Use a strong password!

```bash
# Generate bcrypt hash (Node.js)
# Run this in backend project:
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourSecurePassword123', 10))"

# Copy the hash output, then run in SQL Editor:
INSERT INTO admins (email, full_name, password_hash, role, is_active)
VALUES (
  'your-email@example.com',
  'Admin Name',
  '$2a$10$[paste-hash-here]',
  'owner',
  TRUE
);

# Verify:
SELECT id, email, role FROM admins WHERE email = 'your-email@example.com';
```

### Step 7: Configure Environment Variables

**Backend `.env` file:**

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-key]

# Authentication
JWT_SECRET=[generate-32-char-random-string]
JWT_EXPIRE_ADMIN=7d
JWT_EXPIRE_USER=24h

# Email Service
RESEND_API_KEY=[your-resend-api-key]
RESEND_FROM_EMAIL=noreply@yourdomainname.com

# Storage
SUPABASE_STORAGE_BUCKET=product-images
SUPABASE_STORAGE_URL=https://[project].supabase.co/storage/v1/object/public/product-images/

# Server
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomainname.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Step 8: Test Connection from Backend

```bash
cd backend

# Install dependencies
npm install

# Test database connection
npm run test:db

# Expected output:
# ✓ Database connected successfully
# ✓ Verified 10 tables exist
# ✓ JWT configuration valid
```

### Step 9: Configure Storage Bucket

**In Supabase Dashboard:**

```
1. Go to Storage section
2. Create new bucket: "product-images"
3. Make public (Settings → Public)
4. Configure CORS:
   - Allowed origins: https://yourdomainname.com
   - Allowed methods: GET, HEAD, POST, DELETE
   - Allowed headers: Content-Type
5. Set max file size: 5 MB
```

### Step 10: Test API Endpoints

```bash
# Start backend
npm run dev

# Test health check
curl http://localhost:5000/health

# Test products endpoint
curl http://localhost:5000/api/products

# Test admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourSecurePassword123"
  }'

# Expected: { success: true, data: { token: "...", admin: {...} } }
```

---

## 📊 Database Monitoring

### Monitor Connections

```sql
-- Check active connections
SELECT usename, count(*) as connection_count
FROM pg_stat_activity
GROUP BY usename;

-- Monitor query performance
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Monitor Table Sizes

```sql
-- Largest tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor growth
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### Slow Query Log

```sql
-- Find slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- queries taking > 100ms
ORDER BY mean_time DESC;

-- Analyze query execution plan
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔄 Data Migration (If Upgrading Existing DB)

### Backup Existing Data

```bash
# Export current data
pg_dump \
  postgresql://old_user:password@old_host:5432/old_db \
  > backup_old_db.sql

# Restore to new database
psql postgresql://new_user:password@new_host:5432/new_db \
  < backup_old_db.sql
```

### Migrate Data Safely

```sql
-- 1. Create new schema in parallel
CREATE SCHEMA IF NOT EXISTS fjl_new;

-- 2. Run all CREATE TABLE statements with schema prefix:
-- fjl_new.admins, fjl_new.users, etc.

-- 3. Migrate data (example):
INSERT INTO fjl_new.products (id, sku, name, price, ...)
SELECT id, sku, name, price, ...
FROM public.products;

-- 4. Verify counts match
SELECT COUNT(*) FROM public.products;
SELECT COUNT(*) FROM fjl_new.products;

-- 5. After verification, rename schemas:
ALTER SCHEMA public RENAME TO public_old;
ALTER SCHEMA fjl_new RENAME TO public;

-- 6. Drop old schema after testing
DROP SCHEMA public_old CASCADE;
```

---

## 🔐 Security Setup

### Enable Secure Passwords

```sql
-- Enforce password policy on admins
CREATE OR REPLACE FUNCTION validate_password()
RETURNS TRIGGER AS $$
BEGIN
  IF LENGTH(NEW.password_hash) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_password_policy
  BEFORE INSERT OR UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION validate_password();
```

### Audit Logging

```sql
-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(255),
  operation VARCHAR(10),
  admin_id UUID REFERENCES admins(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, operation, admin_id, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    current_setting('app.current_admin_id')::UUID,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach to sensitive tables
CREATE TRIGGER products_audit AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_changes();
CREATE TRIGGER orders_audit AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_changes();
```

---

## 📈 Performance Optimization

### Add Missing Indexes

```sql
-- Full-text search on products
CREATE INDEX idx_products_search ON products
  USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Orders by user and date
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Product variants by stock
CREATE INDEX idx_variants_low_stock ON product_variants(stock_quantity)
  WHERE stock_quantity < 10;
```

### Query Optimization

```sql
-- Before: Slow query (multiple JOINs)
SELECT * FROM orders o
JOIN users u ON o.user_id = u.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= NOW() - INTERVAL '30 days';

-- After: Optimized query (denormalized data)
SELECT
  o.*,
  u.first_name,
  u.email
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
LIMIT 20;

-- Fetch order items separately
SELECT oi.* FROM order_items oi
WHERE oi.order_id = $1;
```

---

## ✅ Post-Deployment Verification

### Complete Checklist

- [ ] All 10 tables created
- [ ] All indexes functional
- [ ] Foreign keys working
- [ ] Triggers active
- [ ] Admin user created
- [ ] Environment variables configured
- [ ] Storage bucket created
- [ ] Email service tested
- [ ] Backend API tests passing
- [ ] Frontend connecting to backend
- [ ] Real-time subscriptions working
- [ ] Backups automated

### Test Critical Paths

```bash
# 1. Create a product
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "price": 99.99,
    "category_id": "[category-uuid]"
  }'

# 2. Create an order
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{ "product_id": "[uuid]", "variant_id": "[uuid]", "quantity": 1 }],
    "shipping_email": "test@example.com",
    "shipping_first_name": "Test"
  }'

# 3. Register customer
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }'

# 4. Subscribe to newsletter
curl -X POST http://localhost:5000/api/customers/members/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "member@example.com",
    "full_name": "Jane Member"
  }'
```

---

## 🚨 Troubleshooting

### Connection Issues

```
Error: "FATAL: remaining connection slots reserved for non-replication superuser connections"

Solution:
- Check connection pooling configuration
- Use pgBouncer for connection management
- Increase max_connections in Supabase settings
```

### Slow Queries

```
Error: "Timeout" on large product listing

Solution:
1. Check indexes are being used:
   EXPLAIN SELECT * FROM products WHERE is_active = true;

2. Add pagination (always use LIMIT)

3. Denormalize data if needed

4. Archive old data (email_logs > 1 year)
```

### FK Constraint Violations

```
Error: "violates foreign key constraint"

Solution:
1. Check parent record exists before INSERT
2. Use CASCADE delete carefully
3. Verify relationships with:
   SELECT * FROM information_schema.table_constraints
   WHERE constraint_type = 'FOREIGN KEY';
```

### Storage Issues

```
Error: "File upload failed"

Solution:
1. Check bucket is public
2. Verify CORS settings
3. Ensure file size < 5MB
4. Check file type (JPEG/PNG/WebP)
```

---

## 🔄 Backup & Recovery

### Automated Backups (Supabase)

- Daily automatic backups (stored for 7 days)
- Point-in-time recovery available
- Manual backup export in Dashboard → Backups

### Manual Backup

```bash
# Export full database
pg_dump \
  postgresql://user:password@host:5432/postgres \
  -F custom -b -v -f fjl_backup.dump

# Export specific table
pg_dump \
  postgresql://user:password@host:5432/postgres \
  -t orders \
  -f orders_backup.sql

# Restore from backup
pg_restore -U postgres -d postgres fjl_backup.dump
```

### Recovery Procedure

```
1. In Supabase Dashboard, go to Backups
2. Select backup date
3. Click "Restore"
4. Confirm restoration
5. Verify data integrity
6. Notify users of downtime
```

---

## 📞 Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **FJL Backend Repo:** [Your GitHub repo]
- **Supabase Community:** https://discord.supabase.io

---

## 🎉 You're Live!

Your FJL database is now production-ready:

✅ 10 Core Tables
✅ Full CRUD APIs
✅ Real-Time Capabilities
✅ Audit Logging
✅ Performance Optimized
✅ Security Hardened
✅ Backup Strategy
✅ Monitoring In Place

Start accepting orders! 🚀
