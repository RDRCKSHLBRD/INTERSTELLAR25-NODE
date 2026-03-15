-- Migration: Enable Guest Downloads
-- File: migrations/008_guest_downloads.sql
-- Purpose: Add guest download system (same as 007 but for consistency)

-- Add purchase type to distinguish user vs guest purchases
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS purchase_type VARCHAR(20) DEFAULT 'user' 
CHECK (purchase_type IN ('user', 'guest'));

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(email) WHERE email IS NOT NULL;

-- Create guest downloads table
CREATE TABLE IF NOT EXISTS guest_downloads (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accessed_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guest_downloads_email ON guest_downloads(email);
CREATE INDEX IF NOT EXISTS idx_guest_downloads_token ON guest_downloads(token);
CREATE INDEX IF NOT EXISTS idx_guest_downloads_purchase ON guest_downloads(purchase_id);

-- Add constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_user_or_guest') THEN
        ALTER TABLE purchases ADD CONSTRAINT check_user_or_guest 
            CHECK (user_id IS NOT NULL OR email IS NOT NULL);
    END IF;
END $$;

-- Add trigger
DROP TRIGGER IF EXISTS update_guest_downloads_updated_at ON guest_downloads;
CREATE TRIGGER update_guest_downloads_updated_at 
    BEFORE UPDATE ON guest_downloads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing purchases
UPDATE purchases SET purchase_type = 'user' WHERE user_id IS NOT NULL AND purchase_type IS NULL;
UPDATE purchases SET purchase_type = 'guest' WHERE user_id IS NULL AND purchase_type IS NULL;
