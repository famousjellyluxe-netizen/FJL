-- Migration: Add stock deduction tracking columns to orders table
-- Date: November 2025
-- Description: Add columns to track when stock was deducted for an order

-- Add columns to track when stock was deducted
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted_at TIMESTAMP DEFAULT NULL;

-- Create index for faster queries on stock_deducted status
CREATE INDEX IF NOT EXISTS idx_orders_stock_deducted
ON orders(stock_deducted);

-- Add constraint: if stock_deducted is true, stock_deducted_at must be set
ALTER TABLE orders
ADD CONSTRAINT chk_stock_deducted_timestamp
CHECK (
  (stock_deducted = false AND stock_deducted_at IS NULL) OR
  (stock_deducted = true AND stock_deducted_at IS NOT NULL)
);
