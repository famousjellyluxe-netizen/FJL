-- Migration: Add unsubscribe token to members table
-- Date: November 2025
-- Description: Add secure unsubscribe tokens for newsletter management

-- Add unsubscribe token for secure unsubscribe links
ALTER TABLE members ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(255) UNIQUE DEFAULT NULL;

-- Generate tokens for existing members
UPDATE members
SET unsubscribe_token = gen_random_uuid()::text
WHERE unsubscribe_token IS NULL;

-- Make column required for future inserts
ALTER TABLE members ALTER COLUMN unsubscribe_token SET NOT NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_members_unsubscribe_token
ON members(unsubscribe_token);
