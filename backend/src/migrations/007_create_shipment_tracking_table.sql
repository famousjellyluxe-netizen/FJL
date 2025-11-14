-- Migration 007: Create shipment tracking table for order fulfillment
-- Tracks package movement and delivery status

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number VARCHAR(100) UNIQUE,
  carrier VARCHAR(50), -- 'fedex', 'dhl', 'ghn', 'ups', 'local', etc
  carrier_service VARCHAR(100), -- e.g., 'Standard', 'Express', 'Overnight'
  status VARCHAR(50) DEFAULT 'pending', -- pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  origin_address TEXT, -- JSON: {street, city, state, zip, country}
  destination_address TEXT, -- JSON: {street, city, state, zip, country}
  weight_kg DECIMAL(10, 2),
  dimensions TEXT, -- JSON: {length, width, height, unit}
  contents TEXT, -- Brief description of package contents
  cost_amount INTEGER, -- In lowest currency unit (cents, kobo, etc)
  cost_currency VARCHAR(3),
  signature_required BOOLEAN DEFAULT false,
  insurance_amount INTEGER,
  metadata JSONB, -- Additional carrier-specific data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for lookups by order
CREATE INDEX IF NOT EXISTS idx_shipments_order_id
ON shipments(order_id);

-- Index for tracking number searches (customer-facing)
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number
ON shipments(tracking_number);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_shipments_status
ON shipments(status);

-- Composite index for order status queries
CREATE INDEX IF NOT EXISTS idx_shipments_order_status
ON shipments(order_id, status);

-- Index for delivery date queries
CREATE INDEX IF NOT EXISTS idx_shipments_delivery_date
ON shipments(actual_delivery_date);

-- Create shipment events table for detailed tracking
CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- picked_up, in_transit, out_for_delivery, delivered, exception
  status VARCHAR(50), -- Current status after event
  location VARCHAR(255), -- Where the event occurred
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  timestamp TIMESTAMP NOT NULL,
  description TEXT,
  remarks TEXT, -- Additional info from carrier
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for shipment events lookups
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id
ON shipment_events(shipment_id);

-- Index for event type queries
CREATE INDEX IF NOT EXISTS idx_shipment_events_type
ON shipment_events(event_type);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_shipment_events_timestamp
ON shipment_events(timestamp DESC);

-- Composite index for recent events on shipment
CREATE INDEX IF NOT EXISTS idx_shipment_events_recent
ON shipment_events(shipment_id, timestamp DESC);

-- Create trigger to update shipment updated_at
CREATE OR REPLACE FUNCTION update_shipment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipments_update_timestamp
BEFORE UPDATE ON shipments
FOR EACH ROW
EXECUTE FUNCTION update_shipment_timestamp();

-- Add comments
COMMENT ON TABLE shipments IS 'Shipment and delivery tracking for orders';
COMMENT ON COLUMN shipments.carrier IS 'Shipping carrier (FedEx, DHL, GHN, etc)';
COMMENT ON COLUMN shipments.status IS 'Current delivery status';
COMMENT ON COLUMN shipments.metadata IS 'Carrier-specific data (rate info, sender reference, etc)';
COMMENT ON TABLE shipment_events IS 'Detailed timeline of shipment events for customer tracking';
COMMENT ON COLUMN shipment_events.event_type IS 'Type of event: pickup, transit, delivery, exception';
COMMENT ON COLUMN shipment_events.location IS 'Where the event occurred (city, facility, etc)';
COMMENT ON COLUMN shipment_events.remarks IS 'Carrier-provided additional details or exception info';
