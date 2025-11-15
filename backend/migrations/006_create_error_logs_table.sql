-- Migration 005: Create error logs table for centralized error tracking
-- Helps identify patterns and debug production issues

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type VARCHAR(100),
  error_message TEXT,
  error_stack TEXT,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  user_id UUID,
  user_role VARCHAR(50),
  status_code INTEGER,
  request_body TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  severity VARCHAR(20) DEFAULT 'medium', -- critical, high, medium, low
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at
ON error_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity
ON error_logs(severity);

CREATE INDEX IF NOT EXISTS idx_error_logs_endpoint
ON error_logs(endpoint);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id
ON error_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_error_logs_error_type
ON error_logs(error_type);

-- Composite index for time-range queries with severity
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_date
ON error_logs(severity, created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER error_logs_update_timestamp
BEFORE UPDATE ON error_logs
FOR EACH ROW
EXECUTE FUNCTION update_error_logs_timestamp();

-- Add comments
COMMENT ON TABLE error_logs IS 'Centralized error logging for debugging and monitoring';
COMMENT ON COLUMN error_logs.severity IS 'Error severity: critical, high, medium, low';
COMMENT ON COLUMN error_logs.metadata IS 'Additional context as JSON (stack traces, user data, etc)';
COMMENT ON COLUMN error_logs.resolved IS 'Whether error has been investigated/resolved';
