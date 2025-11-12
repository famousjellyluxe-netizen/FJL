-- Migration: Add stock deduction tracking to orders table
-- Description: Track when stock is deducted from inventory
-- Purpose: Enable proper stock automation - stock reduced only when payment verified

-- Add columns to track stock deduction
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stock_deducted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN orders.stock_deducted IS 'Flag to track if stock has been deducted for this order. Used to prevent double deduction and enable stock restoration on payment failure.';
COMMENT ON COLUMN orders.stock_deducted_at IS 'Timestamp when stock was deducted. Set when payment is verified and stock is reduced.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_stock_deducted ON orders(stock_deducted);
CREATE INDEX IF NOT EXISTS idx_orders_payment_stock ON orders(payment_status, stock_deducted);
