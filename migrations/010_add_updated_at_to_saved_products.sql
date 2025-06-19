-- Migration: Add updated_at column to saved_products
ALTER TABLE saved_products ADD COLUMN updated_at TEXT; 