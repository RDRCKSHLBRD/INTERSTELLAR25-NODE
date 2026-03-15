-- 004_add_purchase_metadata.sql
-- Adds metadata tracking fields to the purchases table for email, customer name, and flexible JSON data.

ALTER TABLE purchases
  ADD COLUMN email VARCHAR(255),
  ADD COLUMN customer_name VARCHAR(255),
  ADD COLUMN metadata JSONB;

-- Optional future-proofing for shipping info
-- ALTER TABLE purchases ADD COLUMN shipping_address JSONB;
-- ALTER TABLE purchases ADD COLUMN billing_address JSONB;
