# FJL Database Schema - Quick Reference

**One-Page Schema Overview for Development**

---

## 📊 All Tables at a Glance

### ADMINS
```sql
id (UUID PK) | email* | full_name | password_hash | role* | is_active | last_login_at | created_at | updated_at
-- Roles: owner, manager, staff
-- Indexes: email, is_active, created_at DESC
```

### CATEGORIES
```sql
id (UUID PK) | name* | slug* | description | image_url | is_active | sort_order | created_at | updated_at
-- Indexes: slug, is_active, sort_order
```

### PRODUCTS
```sql
id (UUID PK) | sku* | name | description | category_id→categories | price* | original_price
image_url | images[] | total_stock | sleeve_type | available_colors[] | available_sizes[]
is_active | is_featured | created_at | updated_at
-- Indexes: sku, category_id, is_active, is_featured, created_at DESC, name/description (TRGM)
```

### PRODUCT_VARIANTS
```sql
id (UUID PK) | product_id→products | size* | color | stock_quantity | created_at | updated_at
-- UNIQUE: (product_id, size, color)
-- Indexes: product_id, stock_quantity, size
```

### USERS
```sql
id (UUID PK) | email* | first_name | last_name | phone | address | city | state | postal_code | country
is_member | order_count (denorm) | total_spent (denorm) | last_order_at (denorm) | created_at | updated_at
-- Indexes: email, created_at DESC, order_count DESC, total_spent DESC
```

### ORDERS
```sql
id (UUID PK) | order_number* | user_id→users | shipping_first_name | shipping_last_name | shipping_email
shipping_phone | shipping_address | shipping_city | shipping_state | shipping_postal_code | shipping_country
buyer_name | payment_method | subtotal* | tax* | shipping_cost | total_amount*
order_status* (pending|processing|shipped|delivered|cancelled) | payment_status* (pending|verified|failed)
created_at | paid_at | shipped_at | delivered_at | updated_at
-- Indexes: order_number, user_id, created_at DESC, status, payment_status, shipping_email
```

### ORDER_ITEMS
```sql
id (UUID PK) | order_id→orders | product_id→products | variant_id→product_variants
product_name (denorm) | product_sku (denorm) | size | color
unit_price | quantity | total_price | created_at
-- Indexes: order_id, product_id, variant_id
```

### MEMBERS
```sql
id (UUID PK) | email* | full_name | is_subscribed | signup_source | subscribed_at | unsubscribed_at | created_at | updated_at
-- Indexes: email, is_subscribed, subscribed_at DESC
```

### EMAIL_LOGS
```sql
id (UUID PK) | recipient_email | recipient_id | email_type
subject | template_data (JSONB) | status (pending|sent|failed|bounced) | error_message
created_at | sent_at | order_id→orders
-- Indexes: recipient_email, email_type, status, created_at DESC
```

### STORE_SETTINGS
```sql
id (UUID PK) | setting_key* | setting_value | setting_type (string|number|boolean|json) | created_at | updated_at
-- Indexes: setting_key
```

**Legend:** `*` = NOT NULL | `(denorm)` = Denormalized | `→` = Foreign Key | `[]` = Array Type | `()` = Check constraint

---

## 🔗 Relationships Summary

```
categories ←─── products ─────→ product_variants
                     ↓
                   orders ←───── users
                     ↓
                order_items ────→ products
                        ↓
                      email_logs

members (standalone newsletter table)
store_settings (global config)
admins (admin users)
```

---

## ✅ Common Queries

### Get All Active Products with Categories
```sql
SELECT p.*, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = TRUE
ORDER BY p.created_at DESC
LIMIT 20 OFFSET 0;
```

### Get Product with Variants
```sql
SELECT p.*,
  JSON_AGG(JSON_BUILD_OBJECT(
    'id', pv.id, 'size', pv.size, 'color', pv.color,
    'stock', pv.stock_quantity
  )) as variants
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.id = $1
GROUP BY p.id;
```

### Get Order with Items
```sql
SELECT o.*, u.first_name, u.last_name, u.email,
  JSON_AGG(JSON_BUILD_OBJECT(
    'id', oi.id, 'product_name', oi.product_name,
    'size', oi.size, 'color', oi.color,
    'quantity', oi.quantity, 'unit_price', oi.unit_price
  )) as items
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = $1
GROUP BY o.id, u.id;
```

### Low Stock Alert
```sql
SELECT p.id, p.sku, p.name, p.total_stock,
  COUNT(pv.id) as variant_count,
  MIN(pv.stock_quantity) as min_stock
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.is_active = TRUE AND p.total_stock < 10
GROUP BY p.id, p.sku, p.name, p.total_stock
ORDER BY p.total_stock ASC;
```

### Order Statistics (Daily)
```sql
SELECT DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  COUNT(DISTINCT user_id) as unique_customers,
  SUM(total_amount) as revenue,
  COUNT(CASE WHEN payment_status = 'verified' THEN 1 END) as paid_orders
FROM orders
GROUP BY DATE(created_at)
ORDER BY order_date DESC;
```

### Customer Lifetime Value
```sql
SELECT u.id, u.email, u.first_name, u.last_name,
  COUNT(o.id) as total_orders,
  SUM(CASE WHEN o.payment_status = 'verified' THEN o.total_amount ELSE 0 END) as total_spent,
  MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY total_spent DESC;
```

---

## 🔐 Validation Rules by Field

| Field | Type | Rules | Example |
|-------|------|-------|---------|
| email | VARCHAR(255) | Valid email, lowercase, unique | "user@example.com" |
| password_hash | VARCHAR(255) | Bcrypt (cost 10), min 8 chars | "$2a$10$..." |
| name | VARCHAR(255) | 3-255 chars, trimmed | "Product Name" |
| phone | VARCHAR(20) | Optional, 10+ digits | "+1234567890" |
| sku | VARCHAR(50) | Uppercase, alphanumeric + hyphens | "TSH-001-RED" |
| price | DECIMAL(10,2) | Positive, 2 decimals | "99.99" |
| quantity | INT | Min 1 | 5 |
| address | VARCHAR(255) | 5-255 chars | "123 Main St" |
| city | VARCHAR(100) | 2-100 chars | "New York" |

---

## 🔄 Data Flow: Order Creation

```
POST /api/orders
  ├─ Validate request (9 required fields)
  ├─ Check product variants exist & have stock
  ├─ Get or create user (from shipping_email)
  ├─ INSERT orders
  ├─ INSERT order_items (multiple rows)
  ├─ UPDATE product_variants stock (reduce)
  ├─ UPDATE users stats (order_count, total_spent)
  ├─ INSERT email_logs (order_confirmation)
  └─ Response: { success: true, data: order }
```

---

## 📈 Performance Tips

### Best Practices
- Always use `LIMIT` on large tables
- Index foreign keys (automatic)
- Use denormalized fields for aggregates
- Partition by date for 100K+ rows
- Use `EXPLAIN ANALYZE` for slow queries
- Avoid `SELECT *` in production

### Common Slow Queries (DON'T DO THIS)
```sql
-- ❌ SLOW: Full table scan
SELECT * FROM orders;

-- ✅ FAST: With pagination
SELECT * FROM orders LIMIT 20 OFFSET 0;

-- ❌ SLOW: Unindexed filter
SELECT * FROM products WHERE description ILIKE '%text%';

-- ✅ FAST: Use GIN index
SELECT * FROM products WHERE description @@ to_tsquery('english', 'text');

-- ❌ SLOW: No index on status
SELECT * FROM orders WHERE order_status = 'pending' LIMIT 1000;

-- ✅ FAST: Index exists
-- Index already created: idx_orders_status
```

---

## 🚀 Real-Time Subscriptions (Supabase)

```javascript
// Subscribe to order updates
supabase
  .channel('orders')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'orders' },
    payload => console.log('New order:', payload.new)
  )
  .subscribe();

// Subscribe to product stock changes
supabase
  .channel('product_variants')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'product_variants' },
    payload => console.log('Stock updated:', payload.new)
  )
  .subscribe();
```

---

## 🗑️ Soft Delete (Products)

Instead of deleting products, set `is_active = FALSE`:

```sql
-- Don't do this:
DELETE FROM products WHERE id = $1;

-- Do this instead:
UPDATE products SET is_active = FALSE, updated_at = NOW()
WHERE id = $1;

-- This preserves order history and references
```

---

## 🔄 Update Timestamps (Automatic)

All tables have `created_at` and `updated_at` columns managed by triggers:

```sql
-- created_at: Set once on INSERT, never changes
-- updated_at: Set on INSERT, updated on every UPDATE

-- Example:
INSERT INTO products (sku, name, price)
VALUES ('TSH-001', 'T-Shirt', 49.99);
-- created_at = NOW(), updated_at = NOW()

UPDATE products SET price = 59.99 WHERE id = $1;
-- updated_at = NOW() (automatic)
```

---

## 📊 Current Data Volume (Expected)

| Table | Rows | Growth | Retention |
|-------|------|--------|-----------|
| admins | <20 | Yearly | Forever |
| categories | 10-50 | Yearly | Forever |
| products | 500-2K | Monthly | Forever (soft delete) |
| product_variants | 3K-20K | Monthly | Forever |
| users | 10K | Monthly | Forever |
| orders | 10K-100K | Daily | Forever |
| order_items | 30K-300K | Daily | Forever |
| members | 5K-50K | Monthly | Forever (unless unsubscribed) |
| email_logs | 50K+ | Daily | 1 year |
| store_settings | ~20 | Never | Forever |

---

## 🆘 Troubleshooting

### "Relation does not exist" Error
- Schema not deployed yet
- Run: `SUPABASE_SCHEMA.sql`
- Check table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'products';`

### "Unique violation" Error
- Duplicate email, SKU, or order_number
- Verify UNIQUE constraints: `SELECT email FROM users WHERE email = $1;`
- Handle in application layer

### "Foreign key violation" Error
- Parent record doesn't exist
- Check: `SELECT * FROM categories WHERE id = $1;`
- Always verify FK exists before INSERT

### Slow Queries
- Check indexes: `SELECT * FROM pg_indexes WHERE tablename = 'products';`
- Analyze plan: `EXPLAIN ANALYZE SELECT ...`
- Add missing indexes if needed

---

## 📋 Deployment Checklist

- [ ] Run SUPABASE_SCHEMA.sql
- [ ] Create admin user
- [ ] Set environment variables
- [ ] Create storage bucket
- [ ] Test all API endpoints
- [ ] Verify real-time subscriptions
- [ ] Monitor database health
- [ ] Set up backups

---

## 📞 Important Contacts

- **Schema Owner:** [You]
- **Supabase Project:** https://app.supabase.com/project/[project-id]
- **Database:** PostgreSQL 13+
- **Docs Location:** C:\Users\rapha\Desktop\FJL\

---

**Keep this file open for quick reference during development!**
