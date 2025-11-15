-- Migration 003: Create order audit logs table for tracking order changes
-- This table records all changes made to orders, including who made them and when

CREATE TABLE IF NOT EXISTS order_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- e.g., 'status_updated', 'payment_verified', 'refunded', 'created'
  from_value VARCHAR(255), -- Previous value (nullable for new records)
  to_value VARCHAR(255), -- New value
  reason TEXT, -- Optional reason for the change (e.g., refund reason, cancellation note)
  metadata JSONB, -- Additional context (e.g., amount, transaction ID)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast lookups by order_id
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order_id
ON order_audit_logs(order_id);

-- Create index for fast lookups by admin_id
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_admin_id
ON order_audit_logs(admin_id);

-- Create index for fast lookups by action
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_action
ON order_audit_logs(action);

-- Create index for fast lookups by created_at (for time-range queries)
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_created_at
ON order_audit_logs(created_at DESC);

-- Create composite index for common queries (order + action + date)
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order_action_date
ON order_audit_logs(order_id, action, created_at DESC);

-- Add comment explaining the table
COMMENT ON TABLE order_audit_logs IS 'Audit trail for order changes - tracks who changed what, when, and optionally why';
COMMENT ON COLUMN order_audit_logs.action IS 'Type of change: created, status_updated, payment_verified, refunded, note_added, etc.';
COMMENT ON COLUMN order_audit_logs.metadata IS 'JSON object for additional context specific to the action (e.g. {"refund_amount": 5000, "reason_code": "customer_request"})';
