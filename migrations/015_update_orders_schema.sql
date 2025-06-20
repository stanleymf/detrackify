-- Migration: Update orders table to new schema with processed_data and raw_shopify_data
-- This migration converts the old orders table to the new format

-- Create a backup of the old orders table
CREATE TABLE orders_backup AS SELECT * FROM orders;

-- Drop the old orders table
DROP TABLE orders;

-- Create the new orders table with the updated schema
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  shopify_order_id INTEGER NOT NULL,
  shopify_order_name TEXT NOT NULL,
  status TEXT DEFAULT 'Ready for Export',
  processed_data TEXT NOT NULL, -- JSON string of processed order data
  raw_shopify_data TEXT NOT NULL, -- JSON string of original Shopify data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  exported_at DATETIME,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE(store_id, shopify_order_id)
);

-- Create indexes for the new schema
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at); 