-- Migration 009: Add composite indexes for product filtering performance
-- These indexes optimize common query patterns for filtering products
-- Expected to improve performance for:
-- 1. Active products by category (is_active, category_id)
-- 2. Featured products filter (is_active, is_featured)

-- Composite index: (is_active, category_id)
-- Optimizes: SELECT * FROM products WHERE is_active=true AND category_id='xyz'
-- This is one of the most common queries in the product listing
CREATE INDEX IF NOT EXISTS idx_products_is_active_category_id
ON products(is_active, category_id)
WHERE is_active = true;

-- Composite index: (is_active, is_featured)
-- Optimizes: SELECT * FROM products WHERE is_active=true AND is_featured=true
-- This speeds up featured product queries
CREATE INDEX IF NOT EXISTS idx_products_is_active_is_featured
ON products(is_active, is_featured)
WHERE is_active = true;

-- Add comments for documentation
COMMENT ON INDEX idx_products_is_active_category_id IS 'Composite index optimizing active products filtered by category';
COMMENT ON INDEX idx_products_is_active_is_featured IS 'Composite index optimizing active featured products queries';
