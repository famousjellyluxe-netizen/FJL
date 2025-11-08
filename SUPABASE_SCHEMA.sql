-- ============================================================================
-- FAMOUS JELLY LUXE (FJL) - PRODUCTION DATABASE SCHEMA
-- PostgreSQL 13+ (Supabase Compatible)
-- ============================================================================
-- This script creates the complete database schema for the FJL e-commerce
-- platform. Run this in Supabase SQL editor to initialize the database.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For FULLTEXT search

-- ============================================================================
-- TABLE 1: ADMINS
-- ============================================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff'
    CHECK (role IN ('owner', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_is_active ON admins(is_active);
CREATE INDEX idx_admins_created_at ON admins(created_at DESC);

COMMENT ON TABLE admins IS 'Admin users with role-based permissions (owner/manager/staff)';
COMMENT ON COLUMN admins.role IS 'Owner (all permissions), Manager (products/orders/customers/analytics), Staff (products/orders/analytics)';
COMMENT ON COLUMN admins.password_hash IS 'Bcrypt hashed password (cost 10)';

-- ============================================================================
-- TABLE 2: CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

COMMENT ON TABLE categories IS 'Product categories for filtering and organization';

-- ============================================================================
-- TABLE 3: PRODUCTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),

  -- Images
  image_url TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Inventory
  total_stock INT DEFAULT 0,

  -- Product Attributes
  sleeve_type VARCHAR(100),
  available_colors TEXT[] DEFAULT ARRAY[]::TEXT[],
  available_sizes TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON products USING GIN (description gin_trgm_ops);

COMMENT ON TABLE products IS 'Main product catalog with pricing, inventory, and metadata';
COMMENT ON COLUMN products.sku IS 'Unique product code (uppercase alphanumeric + hyphens)';
COMMENT ON COLUMN products.images IS 'Array of image URLs for product gallery';
COMMENT ON COLUMN products.available_colors IS 'Array of color options (e.g., ["Red", "Blue", "Green"])';
COMMENT ON COLUMN products.available_sizes IS 'Array of size options (e.g., ["XS", "S", "M", "L", "XL", "XXL"])';
COMMENT ON COLUMN products.total_stock IS 'Denormalized total across all variants (updated on variant changes)';
COMMENT ON COLUMN products.is_featured IS 'Featured on homepage carousel';

-- ============================================================================
-- TABLE 4: PRODUCT_VARIANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  color VARCHAR(50),

  -- Inventory
  stock_quantity INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE (product_id, size, color)
);

CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_stock_quantity ON product_variants(stock_quantity);
CREATE INDEX idx_variants_size ON product_variants(size);

COMMENT ON TABLE product_variants IS 'Size/color combinations with individual stock tracking';
COMMENT ON COLUMN product_variants.size IS 'Size variant (XS, S, M, L, XL, XXL)';
COMMENT ON COLUMN product_variants.color IS 'Color variant (nullable if not applicable)';
COMMENT ON COLUMN product_variants.stock_quantity IS 'Current stock for this size/color combination';

-- ============================================================================
-- TABLE 5: USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),

  -- Shipping Information
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),

  -- Member Status
  is_member BOOLEAN DEFAULT FALSE,

  -- Order Tracking (Denormalized for analytics)
  order_count INT DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_order_count ON users(order_count DESC);
CREATE INDEX idx_users_total_spent ON users(total_spent DESC);

COMMENT ON TABLE users IS 'Customer profiles with shipping info and order history';
COMMENT ON COLUMN users.is_member IS 'Tracks if customer is also a newsletter member';
COMMENT ON COLUMN users.order_count IS 'Denormalized count for analytics (updated on order creation)';
COMMENT ON COLUMN users.total_spent IS 'Denormalized sum for analytics (updated on payment verification)';

-- ============================================================================
-- TABLE 6: ORDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Shipping Information
  shipping_first_name VARCHAR(100) NOT NULL,
  shipping_last_name VARCHAR(100) NOT NULL,
  shipping_email VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(20),
  shipping_address VARCHAR(255) NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(100) NOT NULL,

  -- Buyer Information
  buyer_name VARCHAR(255) NOT NULL,

  -- Payment Information
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',

  -- Pricing
  subtotal DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) NOT NULL,
  shipping_cost DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,

  -- Status
  order_status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'verified', 'failed')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_shipping_email ON orders(shipping_email);

COMMENT ON TABLE orders IS 'Order headers with customer and payment information';
COMMENT ON COLUMN orders.order_number IS 'Auto-generated unique order ID (ORD-XXXXXXX format)';
COMMENT ON COLUMN orders.order_status IS 'Workflow: pending → processing → shipped → delivered (or cancelled)';
COMMENT ON COLUMN orders.payment_status IS 'Payment tracking: pending → verified/failed';
COMMENT ON COLUMN orders.user_id IS 'Links to customer (nullable for guest orders)';

-- ============================================================================
-- TABLE 7: ORDER_ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,

  -- Product Information (denormalized for order history)
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(50) NOT NULL,

  -- Item Details
  size VARCHAR(10),
  color VARCHAR(50),

  -- Pricing
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

COMMENT ON TABLE order_items IS 'Line items in orders (denormalized product data for historical reference)';
COMMENT ON COLUMN order_items.product_sku IS 'Denormalized SKU for reference when product is deleted';
COMMENT ON COLUMN order_items.unit_price IS 'Price at time of order (may differ from current product price)';

-- ============================================================================
-- TABLE 8: MEMBERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),

  -- Subscription Status
  is_subscribed BOOLEAN DEFAULT TRUE,
  signup_source VARCHAR(100) DEFAULT 'homepage_modal',

  -- Timestamps
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_is_subscribed ON members(is_subscribed);
CREATE INDEX idx_members_subscribed_at ON members(subscribed_at DESC);

COMMENT ON TABLE members IS 'Newsletter subscribers (separate from customer accounts)';
COMMENT ON COLUMN members.signup_source IS 'Where subscription originated (homepage_modal, checkout, etc.)';
COMMENT ON COLUMN members.is_subscribed IS 'Current subscription status (false when unsubscribed)';

-- ============================================================================
-- TABLE 9: EMAIL_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  recipient_email VARCHAR(255) NOT NULL,
  recipient_id UUID,

  -- Email Details
  email_type VARCHAR(100) NOT NULL,
  subject VARCHAR(255),
  template_data JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,

  -- Association
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

COMMENT ON TABLE email_logs IS 'Email sending audit trail for tracking notifications';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email (order_confirmation, payment_verified, shipping_notification, member_welcome)';
COMMENT ON COLUMN email_logs.template_data IS 'JSONB object with email template variables and context';

-- ============================================================================
-- TABLE 10: STORE_SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string'
    CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_store_settings_key ON store_settings(setting_key);

COMMENT ON TABLE store_settings IS 'Global store configuration and feature flags';
COMMENT ON COLUMN store_settings.setting_type IS 'Data type for value parsing (string, number, boolean, json)';

-- ============================================================================
-- DEFAULT SETTINGS INITIALIZATION
-- ============================================================================
INSERT INTO store_settings (setting_key, setting_value, setting_type) VALUES
  ('store_name', 'Famous Jelly Luxe', 'string'),
  ('store_currency', 'NGN', 'string'),
  ('currency_symbol', '₦', 'string'),
  ('tax_rate', '0.075', 'number'),
  ('shipping_cost', '0', 'number'),
  ('featured_products_limit', '6', 'number'),
  ('low_stock_threshold', '10', 'number'),
  ('orders_per_page', '20', 'number'),
  ('products_per_page', '20', 'number'),
  ('max_image_size_mb', '5', 'number'),
  ('image_upload_formats', '["jpeg", "png", "webp"]', 'json')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- TRIGGER FUNCTIONS FOR AUDIT & AUTO-UPDATE
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS (OPTIONAL - for common queries)
-- ============================================================================

-- View for low stock products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
  p.id,
  p.sku,
  p.name,
  p.price,
  p.total_stock,
  COUNT(pv.id) as variant_count,
  MIN(pv.stock_quantity) as min_stock,
  MAX(pv.stock_quantity) as max_stock
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.is_active = TRUE
  AND p.total_stock < 10
GROUP BY p.id, p.sku, p.name, p.price, p.total_stock
ORDER BY p.total_stock ASC;

-- View for order statistics
CREATE OR REPLACE VIEW order_statistics AS
SELECT
  DATE(o.created_at) as order_date,
  COUNT(o.id) as total_orders,
  COUNT(DISTINCT o.user_id) as unique_customers,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as avg_order_value,
  COUNT(CASE WHEN o.payment_status = 'verified' THEN 1 END) as paid_orders,
  COUNT(CASE WHEN o.order_status = 'shipped' THEN 1 END) as shipped_orders
FROM orders o
GROUP BY DATE(o.created_at)
ORDER BY order_date DESC;

-- View for best selling products
CREATE OR REPLACE VIEW best_selling_products AS
SELECT
  p.id,
  p.sku,
  p.name,
  p.price,
  COUNT(oi.id) as total_sold,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.total_price) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.order_status != 'cancelled' OR o.id IS NULL
GROUP BY p.id, p.sku, p.name, p.price
ORDER BY total_quantity DESC;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - Remove in production)
-- ============================================================================

-- Create a sample admin user (password: TempPassword123)
-- Note: Replace password hash in production!
INSERT INTO admins (email, full_name, password_hash, role, is_active)
VALUES (
  'admin@fjl.com',
  'Admin User',
  '$2a$10$example_hash_here', -- REPLACE WITH ACTUAL BCRYPT HASH
  'owner',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Create sample categories
INSERT INTO categories (name, slug, description, is_active, sort_order) VALUES
  ('T-Shirts', 't-shirts', 'Quality T-shirt collection', TRUE, 1),
  ('Hoodies', 'hoodies', 'Comfortable hoodies and sweatshirts', TRUE, 2),
  ('Accessories', 'accessories', 'Hats, scarves, and more', TRUE, 3)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ROLE-LEVEL SECURITY (Optional - for Supabase Auth integration)
-- ============================================================================
-- Note: Configure Row Level Security (RLS) in Supabase dashboard

-- Example RLS policy for products (readable by anyone):
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Products are viewable by everyone" ON products
--   FOR SELECT USING (true);

-- Example RLS policy for orders (only owner and admins can read):
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Orders are viewable by admins" ON orders
--   FOR SELECT USING (auth.role() = 'authenticated' AND exists(select 1 from admins where id = auth.uid()));

-- ============================================================================
-- PERFORMANCE TIPS
-- ============================================================================
-- Run ANALYZE periodically to update table statistics:
-- ANALYZE;

-- Check slow queries:
-- SELECT query, calls, total_time, mean_time FROM pg_stat_statements
-- ORDER BY mean_time DESC LIMIT 10;

-- Monitor table sizes:
-- SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- BACKUP VERIFICATION
-- ============================================================================
-- Verify all tables created:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verify all indexes created:
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- All tables, indexes, and relationships have been created.
-- The database is now ready for production use.
-- ============================================================================
