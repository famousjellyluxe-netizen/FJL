-- Migration: Populate initial categories and backfill product category_id
-- Purpose: Set up the categories table with initial values and link existing products to categories
-- Created: 2025-11-13
-- Status: Ready for deployment

BEGIN;

-- Step 1: Insert initial categories
-- These categories replace the hard-coded sleeve_type values
INSERT INTO categories (name, slug, description, is_active, sort_order)
VALUES
  ('Short Sleeve', 'short-sleeve', 'Short sleeve clothing items', true, 1),
  ('Sleeveless', 'sleeveless', 'Sleeveless clothing items', true, 2),
  ('Cap', 'cap', 'Cap and hat items', true, 3)
ON CONFLICT (slug) DO NOTHING;  -- Prevent duplicates if migration runs multiple times

-- Step 2: Log the inserted categories for verification
-- (Optional: Query to verify insertion in post-migration check)
-- SELECT id, name, slug FROM categories WHERE slug IN ('short-sleeve', 'sleeveless', 'cap');

-- Step 3: Backfill products with category_id
-- Map existing sleeve_type values to category IDs

-- Update products with sleeve_type = 'sleeveless'
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'sleeveless'
  AND p.sleeve_type = 'sleeveless'
  AND p.category_id IS NULL;

-- Update products with sleeve_type = 'sleeve' or 'short-sleeve'
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'short-sleeve'
  AND (p.sleeve_type = 'sleeve' OR p.sleeve_type = 'short-sleeve')
  AND p.category_id IS NULL;

-- Update products with sleeve_type = 'cap' (if any exist)
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'cap'
  AND p.sleeve_type = 'cap'
  AND p.category_id IS NULL;

-- Step 4: Verify backfill
-- Count products by category to ensure proper mapping
-- SELECT c.name, c.slug, COUNT(p.id) as product_count
-- FROM categories c
-- LEFT JOIN products p ON c.id = p.category_id
-- GROUP BY c.id, c.name, c.slug;

-- Step 5: Optional - Add NOT NULL constraint after verifying no orphaned products
-- First check for any products still without category_id:
-- SELECT COUNT(*) FROM products WHERE category_id IS NULL;

-- If the count is 0, you can uncomment the next line to enforce NOT NULL constraint:
-- ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;

COMMIT;
