-- Migration 006: Create order notes table for customer communication
-- Allows admins and customers to add notes/messages to orders

CREATE TABLE IF NOT EXISTS order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,  -- User who created the note (admin or customer)
  author_type VARCHAR(20) NOT NULL, -- 'admin' or 'customer'
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes only visible to admins
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups by order
CREATE INDEX IF NOT EXISTS idx_order_notes_order_id
ON order_notes(order_id);

-- Index for pagination (newest first)
CREATE INDEX IF NOT EXISTS idx_order_notes_created_at
ON order_notes(created_at DESC);

-- Composite index for querying with visibility filter
CREATE INDEX IF NOT EXISTS idx_order_notes_order_visible
ON order_notes(order_id, is_internal);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_notes_update_timestamp
BEFORE UPDATE ON order_notes
FOR EACH ROW
EXECUTE FUNCTION update_order_notes_timestamp();

-- Add comments
COMMENT ON TABLE order_notes IS 'Customer and admin notes on orders for tracking updates, issues, and communication';
COMMENT ON COLUMN order_notes.is_internal IS 'If true, note is only visible to admins (e.g., refund reason, internal issues)';
COMMENT ON COLUMN order_notes.author_type IS 'Either "admin" or "customer" to determine visibility rules';
