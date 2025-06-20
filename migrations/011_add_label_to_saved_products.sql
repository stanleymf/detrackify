-- Migration: Add label column to saved_products
ALTER TABLE saved_products ADD COLUMN label TEXT; 