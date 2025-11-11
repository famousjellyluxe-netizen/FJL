-- Add unsubscribe_token column to members table for secure unsubscribe functionality
-- This allows members to unsubscribe using a unique token instead of exposing their email

-- Add unsubscribe_token column
ALTER TABLE members
ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(64) UNIQUE;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_members_unsubscribe_token ON members(unsubscribe_token);

-- Generate tokens for existing members
-- Uses gen_random_uuid() and encodes it as hex for URL-safe tokens
UPDATE members
SET unsubscribe_token = encode(gen_random_bytes(32), 'hex')
WHERE unsubscribe_token IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN members.unsubscribe_token IS 'Unique token for secure unsubscribe links in emails';
