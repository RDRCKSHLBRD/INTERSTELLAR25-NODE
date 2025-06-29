-- schema.sql
-- Complete database schema for Interstellar Packages
-- Run this first to create all tables and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS guest_downloads CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS playlist_songs CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS albums CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Artists table
CREATE TABLE artists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Albums table
CREATE TABLE albums (
    id SERIAL PRIMARY KEY,
    catalogue VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    cover_url TEXT,
    production_date VARCHAR(50),
    release_date VARCHAR(50),
    artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
    credit TEXT,
    description TEXT,
    tracks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Songs table
CREATE TABLE songs (
    id VARCHAR(10) PRIMARY KEY, -- Using existing ID format like '0101'
    name VARCHAR(255) NOT NULL,
    audio_url TEXT,
    duration VARCHAR(10), -- Format like '08:28'
    artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
    album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) UNIQUE NOT NULL,
    name_first VARCHAR(100),
    name_last VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Playlists table
CREATE TABLE playlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playlist songs junction table
CREATE TABLE playlist_songs (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
    song_id VARCHAR(10) REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, song_id)
);

-- Products table (for Stripe integration + song products)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    cat_id VARCHAR(50), -- Category ID
    price DECIMAL(10,2) NOT NULL,
    name VARCHAR(255) NOT NULL,
    catalogue_id VARCHAR(50) REFERENCES albums(catalogue),
    song_id VARCHAR(10) REFERENCES songs(id) ON DELETE CASCADE,
    description TEXT,
    stripe_product_id VARCHAR(255), -- Stripe product ID
    stripe_price_id VARCHAR(255), -- Stripe price ID
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carts table
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For anonymous carts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, product_id)
);

-- Purchase history table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    total_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    email VARCHAR(255),
    customer_name VARCHAR(255),
    metadata JSONB,
    purchase_type VARCHAR(20) DEFAULT 'user' CHECK (purchase_type IN ('user', 'guest')),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase items table
CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10,2)
);

-- User sessions table (for authentication)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guest downloads table for secure token-based access
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

-- Indexes for performance
CREATE INDEX idx_albums_artist_id ON albums(artist_id);
CREATE INDEX idx_albums_catalogue ON albums(catalogue);
CREATE INDEX idx_songs_album_id ON songs(album_id);
CREATE INDEX idx_songs_artist_id ON songs(artist_id);
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX idx_products_catalogue_id ON products(catalogue_id);
CREATE INDEX idx_products_song_id ON products(song_id) WHERE song_id IS NOT NULL;
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_email ON purchases(email) WHERE email IS NOT NULL;
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_guest_downloads_email ON guest_downloads(email);
CREATE INDEX idx_guest_downloads_token ON guest_downloads(token);
CREATE INDEX idx_guest_downloads_purchase ON guest_downloads(purchase_id);

-- Add constraint to ensure either user_id OR email exists (not both null)
ALTER TABLE purchases ADD CONSTRAINT check_user_or_guest 
    CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guest_downloads_updated_at BEFORE UPDATE ON guest_downloads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON COLUMN purchases.purchase_type IS 'Type: user (logged in) or guest (email only)';
COMMENT ON COLUMN purchases.email IS 'Customer email - from user account OR entered at checkout';
COMMENT ON TABLE guest_downloads IS 'Secure download tokens for guest purchases';

-- Success message
SELECT 'Database schema created successfully!' AS status;