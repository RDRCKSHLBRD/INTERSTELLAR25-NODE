-- Migration: Enable Guest Checkout (Minimal Changes)
-- File: migrations/007_guest_checkout_minimal.sql
-- Purpose: Add guest download system to existing structure

-- Add purchase type to distinguish user vs guest purchases
ALTER TABLE purchases 
ADD COLUMN purchase_type VARCHAR(20) DEFAULT 'user' 
CHECK (purchase_type IN ('user', 'guest'));

-- Create index for email lookups (since email field already exists)
CREATE INDEX idx_purchases_email ON purchases(email) WHERE email IS NOT NULL;

-- Create guest downloads table for secure token-based access
CREATE TABLE guest_downloads (
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

-- Create indexes for guest downloads
CREATE INDEX idx_guest_downloads_email ON guest_downloads(email);
CREATE INDEX idx_guest_downloads_token ON guest_downloads(token);
CREATE INDEX idx_guest_downloads_purchase ON guest_downloads(purchase_id);

-- Add constraint to ensure either user_id OR email exists (not both null)
ALTER TABLE purchases ADD CONSTRAINT check_user_or_guest 
    CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Add updated_at trigger for guest_downloads
CREATE TRIGGER update_guest_downloads_updated_at 
    BEFORE UPDATE ON guest_downloads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN purchases.purchase_type IS 'Type: user (logged in) or guest (email only)';
COMMENT ON COLUMN purchases.email IS 'Customer email - from user account OR entered at checkout';
COMMENT ON TABLE guest_downloads IS 'Secure download tokens for guest purchases';

-- Update existing purchases to set purchase_type
UPDATE purchases SET purchase_type = 'user' WHERE user_id IS NOT NULL;
UPDATE purchases SET purchase_type = 'guest' WHERE user_id IS NULL;