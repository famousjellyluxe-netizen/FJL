# FJL Database Relationships & Entity Relationship Diagram

## 📊 Complete Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FAMOUS JELLY LUXE DATABASE                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              ADMIN MANAGEMENT
                              ═══════════════════

                              ┌──────────────┐
                              │    ADMINS    │
                              ├──────────────┤
                              │ id (PK)      │
                              │ email (UQ)   │
                              │ full_name    │
                              │ password_hash│
                              │ role         │◄─── (owner, manager, staff)
                              │ is_active    │
                              │ last_login_at│
                              │ created_at   │
                              │ updated_at   │
                              └──────────────┘


                         PRODUCT MANAGEMENT
                         ═══════════════════

    ┌──────────────┐         (1)         ┌──────────────┐         (1)         ┌─────────────────┐
    │ CATEGORIES   │◄────────FK────────┬─│  PRODUCTS    │◄────────FK────────┬─│PRODUCT_VARIANTS │
    ├──────────────┤                    │ ├──────────────┤                    │ ├─────────────────┤
    │ id (PK)      │                    └─│ id (PK)      │                    └─│ id (PK)         │
    │ name (UQ)    │                      │ sku (UQ)     │                      │ product_id (FK) │
    │ slug (UQ)    │                      │ name         │                      │ size            │
    │ description  │                      │ description  │                      │ color           │
    │ image_url    │                      │ category_id  │◄─┐                   │ stock_quantity  │
    │ is_active    │                      │ price        │  │                   │ created_at      │
    │ sort_order   │                      │ original_    │  │                   │ updated_at      │
    │ created_at   │                      │   price      │  │ (many)            │                 │
    │ updated_at   │                      │ image_url    │  │                   │ UNIQUE:         │
    └──────────────┘                      │ images[]     │  │ (product_id,      │ (product_id,    │
                                          │ total_stock  │  │  size, color)     │  size, color)   │
                                          │ sleeve_type  │  │                   └─────────────────┘
                                          │ available_   │  │
                                          │   colors[]   │  │
                                          │ available_   │  │
                                          │   sizes[]    │  │
                                          │ is_active    │  │
                                          │ is_featured  │  │
                                          │ created_at   │  │
                                          │ updated_at   │  │
                                          └──────────────┘  │
                                                           └──┐


                           ORDER MANAGEMENT
                           ═══════════════════

    ┌──────────────┐         (1)         ┌──────────────┐         (many)      ┌─────────────────┐
    │    USERS     │◄────────FK────────┬─│    ORDERS    │◄────────FK────────┬─│  ORDER_ITEMS    │
    ├──────────────┤                    │ ├──────────────┤                    │ ├─────────────────┤
    │ id (PK)      │                    └─│ id (PK)      │                    └─│ id (PK)         │
    │ email (UQ)   │                      │ order_number │                      │ order_id (FK)   │
    │ first_name   │                      │   (UQ)       │                      │ product_id (FK) │
    │ last_name    │                      │ user_id (FK) │◄─┐                   │ variant_id (FK) │
    │ phone        │                      │ shipping_*   │  │                   │ product_name    │
    │ address      │                      │   (multiple) │  │ (1)               │ product_sku     │
    │ city         │                      │ buyer_name   │  │                   │ size            │
    │ state        │                      │ payment_     │  │                   │ color           │
    │ postal_code  │                      │   method     │  │                   │ unit_price      │
    │ country      │                      │ subtotal     │  │                   │ quantity        │
    │ is_member    │                      │ tax          │  │                   │ total_price     │
    │ order_count  │◄─── Denormalized ───│ shipping_    │  │                   │ created_at      │
    │ (denorm)     │                      │   cost       │  │                   └─────────────────┘
    │ total_spent  │◄─── Denormalized ───│ total_amount │  │
    │ (denorm)     │                      │ order_status │  │
    │ last_order_at│◄─── Denormalized ───│ payment_     │  │
    │ created_at   │                      │   status     │  │
    │ updated_at   │                      │ created_at   │  │
    └──────────────┘                      │ paid_at      │  │
                                          │ shipped_at   │  │
                                          │ delivered_at │  │
                                          │ updated_at   │  │
                                          └──────────────┘  │
                                                           └──┐


                          CUSTOMER RELATIONS
                          ═══════════════════

                              ┌──────────────┐
                              │   MEMBERS    │
                              ├──────────────┤
                              │ id (PK)      │
                              │ email (UQ)   │
                              │ full_name    │
                              │ is_subscribed│
                              │ signup_source│
                              │ subscribed_at│
                              │ unsubscribed_│
                              │   at         │
                              │ created_at   │
                              │ updated_at   │
                              └──────────────┘


                          COMMUNICATION & AUDIT
                          ══════════════════════

    ┌──────────────┐         (1)         ┌──────────────────┐
    │    ORDERS    │◄────────FK────────┬─│  EMAIL_LOGS      │
    ├──────────────┤                    │ ├──────────────────┤
    │ ...          │                    └─│ id (PK)          │
    │              │                      │ recipient_email  │
    │              │                      │ recipient_id     │
    │              │                      │ email_type       │
    │              │                      │ subject          │
    │              │                      │ template_data    │
    │              │                      │   (JSONB)        │
    │              │                      │ status           │
    │              │                      │ error_message    │
    │              │                      │ created_at       │
    │              │                      │ sent_at          │
    │              │                      │ order_id (FK)    │◄─ (optional)
    │              │                      └──────────────────┘
    └──────────────┘


                        CONFIGURATION & SETTINGS
                        ═════════════════════════

                              ┌──────────────────┐
                              │ STORE_SETTINGS   │
                              ├──────────────────┤
                              │ id (PK)          │
                              │ setting_key (UQ) │
                              │ setting_value    │
                              │ setting_type     │
                              │ created_at       │
                              │ updated_at       │
                              └──────────────────┘
```

---

## 🔗 Relationship Cardinality & Integrity

### One-to-Many Relationships

| Parent Table | Child Table | FK Column | Cascade | Notes |
|---|---|---|---|---|
| categories | products | category_id | SET NULL | Allow orphaned products |
| products | product_variants | product_id | CASCADE | Delete variants when product deleted |
| users | orders | user_id | SET NULL | Preserve order history if user deleted |
| orders | order_items | order_id | CASCADE | Delete items when order deleted |
| orders | email_logs | order_id | SET NULL | Preserve logs if order deleted |

### One-to-One Relationships

**Implicit:** Each product variant is unique by (product_id, size, color)

```sql
UNIQUE (product_id, size, color)
```

---

## 📋 Relationship Data Flow Examples

### Example 1: Creating an Order

```
1. Frontend: POST /api/orders
   {
     items: [
       { product_id: "uuid-1", variant_id: "uuid-2", quantity: 2, size: "M", color: "Red" }
     ],
     shipping_email: "customer@example.com",
     shipping_first_name: "John",
     ...
   }

2. Backend: orderService.createOrder()

   Step 1: Get or create USER
   ├─ Check: users.email = "customer@example.com"
   ├─ Create if not exists with shipping info
   └─ Result: users.id = "user-uuid-1"

   Step 2: Create ORDER
   ├─ orders.insert({
   │   order_number: "ORD-1234567ABC",
   │   user_id: "user-uuid-1",
   │   order_status: "pending",
   │   payment_status: "pending",
   │   ...
   │ })
   └─ Result: orders.id = "order-uuid-1"

   Step 3: Create ORDER_ITEMS
   ├─ order_items.insert({
   │   order_id: "order-uuid-1",
   │   product_id: "uuid-1",
   │   variant_id: "uuid-2",
   │   product_name: "T-Shirt",
   │   product_sku: "TSH-001",
   │   quantity: 2,
   │   unit_price: 50.00,
   │   total_price: 100.00
   │ })
   └─ Result: order_items.id = "item-uuid-1"

   Step 4: Reduce Stock
   ├─ product_variants.update(
   │   stock_quantity = 10 - 2 = 8
   │   WHERE id = "uuid-2"
   │ )
   └─ Updates: product_variants.id = "uuid-2"

   Step 5: Update User Stats (Denormalized)
   ├─ users.update({
   │   order_count: 5,
   │   total_spent: 450.00,
   │   last_order_at: NOW()
   │ })
   └─ Result: users.id = "user-uuid-1"

   Step 6: Log Email
   ├─ email_logs.insert({
   │   recipient_email: "customer@example.com",
   │   email_type: "order_confirmation",
   │   order_id: "order-uuid-1",
   │   status: "pending"
   │ })
   └─ Result: email_logs.id = "log-uuid-1"

3. Response: { success: true, data: { order with nested items } }
```

### Example 2: Getting Order History (Admin View)

```
GET /api/orders/customer/:userId

Query:
SELECT
  o.*,
  u.first_name,
  u.last_name,
  u.email,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'id', oi.id,
      'product_name', oi.product_name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'total_price', oi.total_price
    )
  ) as items
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 'user-uuid-1'
GROUP BY o.id, u.first_name, u.last_name, u.email
ORDER BY o.created_at DESC;

Result:
[
  {
    id: "order-uuid-1",
    order_number: "ORD-1234567ABC",
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    total_amount: 950.00,
    order_status: "pending",
    payment_status: "pending",
    items: [
      { id: "item-uuid-1", product_name: "T-Shirt", quantity: 2, ... },
      { id: "item-uuid-2", product_name: "Hoodie", quantity: 1, ... }
    ],
    created_at: "2025-11-08T10:30:00Z"
  },
  ...
]
```

### Example 3: Product with Variants

```
GET /api/products/:id

Query:
SELECT
  p.*,
  c.name as category_name,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'id', pv.id,
      'size', pv.size,
      'color', pv.color,
      'stock', pv.stock_quantity
    )
  ) as variants
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.id = 'product-uuid-1'
GROUP BY p.id, c.name;

Result:
{
  id: "product-uuid-1",
  sku: "TSH-001",
  name: "Classic T-Shirt",
  price: 50.00,
  category_name: "T-Shirts",
  available_colors: ["Red", "Blue", "Green"],
  available_sizes: ["XS", "S", "M", "L", "XL"],
  variants: [
    { id: "var-1", size: "M", color: "Red", stock: 8 },
    { id: "var-2", size: "M", color: "Blue", stock: 15 },
    { id: "var-3", size: "L", color: "Red", stock: 0 },
    ...
  ]
}
```

---

## 🔐 Foreign Key Constraints & Integrity

### Constraint Summary

```sql
-- Parent → Child relationships
categories(id) ← products(category_id)
   ON DELETE SET NULL
   -- Products can exist without category

products(id) ← product_variants(product_id)
   ON DELETE CASCADE
   -- Delete variants when product deleted

users(id) ← orders(user_id)
   ON DELETE SET NULL
   -- Preserve orders even if user deleted

orders(id) ← order_items(order_id)
   ON DELETE CASCADE
   -- Delete items when order deleted

products(id) ← order_items(product_id)
   ON DELETE RESTRICT
   -- Prevent product deletion if orders exist

product_variants(id) ← order_items(variant_id)
   ON DELETE SET NULL
   -- Allow variant deletion, preserve order items

orders(id) ← email_logs(order_id)
   ON DELETE SET NULL
   -- Preserve email logs even if order deleted
```

---

## 📊 Data Aggregation Queries

### 1. Order Summary Dashboard

```sql
SELECT
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT o.user_id) as unique_customers,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as avg_order_value,
  COUNT(CASE WHEN o.payment_status = 'verified' THEN 1 END) as paid_orders,
  COUNT(CASE WHEN o.order_status = 'shipped' THEN 1 END) as shipped_orders,
  COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered_orders
FROM orders o
WHERE o.created_at >= NOW() - INTERVAL '30 days';
```

### 2. Top Selling Products

```sql
SELECT
  p.id,
  p.sku,
  p.name,
  COUNT(oi.id) as times_ordered,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.total_price) as total_revenue,
  ROUND(100 * SUM(oi.quantity)::FLOAT / (
    SELECT SUM(quantity) FROM order_items
  ), 2) as percent_of_total_sales
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.order_status != 'cancelled'
GROUP BY p.id, p.sku, p.name
ORDER BY total_quantity_sold DESC
LIMIT 10;
```

### 3. Low Stock Alert

```sql
SELECT
  p.id,
  p.sku,
  p.name,
  p.total_stock,
  COUNT(pv.id) as variant_count,
  STRING_AGG(
    CONCAT(pv.size, ' - ', pv.color, ' (', pv.stock_quantity, ')'),
    ', '
  ) as variant_details
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.is_active = TRUE
  AND p.total_stock < (SELECT setting_value::INT FROM store_settings WHERE setting_key = 'low_stock_threshold')
GROUP BY p.id, p.sku, p.name, p.total_stock
ORDER BY p.total_stock ASC;
```

### 4. Customer Lifetime Value

```sql
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  COUNT(o.id) as total_orders,
  u.order_count,
  SUM(o.total_amount) as total_spent,
  AVG(o.total_amount) as avg_order_value,
  MAX(o.created_at) as last_order_date,
  (NOW() - MAX(o.created_at))::INTERVAL as days_since_last_order
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.order_count
ORDER BY total_spent DESC;
```

---

## 🔄 Relationship Integrity Checks

### Orphaned Records Check

```sql
-- Find products without category (should be allowed)
SELECT COUNT(*) FROM products WHERE category_id IS NULL;

-- Find orders without user (guest orders - should be allowed)
SELECT COUNT(*) FROM orders WHERE user_id IS NULL;

-- Find order items without variant (variant deleted - should be allowed)
SELECT COUNT(*) FROM order_items WHERE variant_id IS NULL AND product_id IS NOT NULL;
```

### Consistency Checks

```sql
-- Verify product total_stock matches sum of variants
SELECT p.id, p.total_stock, COALESCE(SUM(pv.stock_quantity), 0) as actual_stock
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.total_stock
HAVING p.total_stock != COALESCE(SUM(pv.stock_quantity), 0);

-- Verify user order_count matches actual orders
SELECT u.id, u.order_count, COUNT(o.id) as actual_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.order_status != 'cancelled'
GROUP BY u.id, u.order_count
HAVING u.order_count != COUNT(o.id);
```

---

## 🎯 Index Strategy for Relationships

### Join Performance Indexes

```sql
-- FK indexes (automatic for PRIMARY KEY)
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

-- Common filter indexes
CREATE INDEX idx_orders_created_at_desc ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_users_email ON users(email);

-- Analytics indexes
CREATE INDEX idx_users_order_count ON users(order_count DESC);
CREATE INDEX idx_users_total_spent ON users(total_spent DESC);
```

---

## 📈 Scalability Considerations

### Partitioning Strategy (for large tables)

**Orders Table (when > 1M rows):**
```sql
-- Partition by month
CREATE TABLE orders_2025_01 PARTITION OF orders
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**Order Items Table:**
- Automatically partitioned with orders

**Email Logs Table (when > 5M rows):**
- Archive older than 1 year
- Partition by month for remaining data

### Denormalization Rationale

| Field | Benefit | Cost |
|-------|---------|------|
| products.total_stock | Fast "in stock" checks | Must update on variant stock change |
| users.order_count | Analytics without aggregation | Must increment on order creation |
| users.total_spent | Customer LTV without SUM query | Must update on payment verification |
| order_items.product_name/sku | Historical reference | Duplicate data (but correct, frozen) |

---

## ✅ Relationship Verification Checklist

- [x] All FKs properly defined
- [x] Cascade/SET NULL policies documented
- [x] Unique constraints on appropriate fields
- [x] Indexes created for all FK columns
- [x] Data aggregation queries optimized
- [x] Orphaned record handling defined
- [x] Denormalization decisions documented
- [x] Integrity checks provided
- [x] Scalability plan in place
- [x] Real-time subscription paths identified
