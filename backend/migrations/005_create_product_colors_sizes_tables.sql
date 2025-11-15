-- Migration 004: Normalize product colors and sizes into separate tables
-- This improves queryability and allows efficient filtering by color/size

-- Create product_colors table
CREATE TABLE IF NOT EXISTS product_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, color)
);

-- Create index for fast lookups by product
CREATE INDEX IF NOT EXISTS idx_product_colors_product_id
ON product_colors(product_id);

-- Create index for fast lookups by color (to find all products with a specific color)
CREATE INDEX IF NOT EXISTS idx_product_colors_color
ON product_colors(color);

-- Create product_sizes table
CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, size)
);

-- Create index for fast lookups by product
CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id
ON product_sizes(product_id);

-- Create index for fast lookups by size (to find all products with a specific size)
CREATE INDEX IF NOT EXISTS idx_product_sizes_size
ON product_sizes(size);

-- Add comments
COMMENT ON TABLE product_colors IS 'Normalized product color variations - allows efficient filtering by color';
COMMENT ON TABLE product_sizes IS 'Normalized product size variations - allows efficient filtering by size';
