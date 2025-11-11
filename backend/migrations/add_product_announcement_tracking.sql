-- Migration: Add Product Announcement Tracking
-- Date: 2025-11-11
-- Purpose: Track which products have been announced to newsletter subscribers

-- Add announced_at column to products table
-- NULL = not announced yet, TIMESTAMP = when announcement was sent
ALTER TABLE products
ADD COLUMN IF NOT EXISTS announced_at TIMESTAMP WITH TIME ZONE;

-- Add product_id to email_logs to track which products were in each announcement
ALTER TABLE email_logs
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Create index for faster queries on unannounced products
CREATE INDEX IF NOT EXISTS idx_products_announced_at ON products(announced_at)
WHERE announced_at IS NULL;

-- Create index for email logs by product
CREATE INDEX IF NOT EXISTS idx_email_logs_product_id ON email_logs(product_id);

-- Comment on columns
COMMENT ON COLUMN products.announced_at IS 'Timestamp when product announcement email was sent to subscribers. NULL means not yet announced.';
COMMENT ON COLUMN email_logs.product_id IS 'Product ID if email was a product announcement. Used to track which members received which product notifications.';
