-- Detrackify Database Schema

-- Stores table - stores Shopify store configurations
CREATE TABLE stores (
  id TEXT PRIMARY KEY,
  shopify_domain TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  api_version TEXT DEFAULT '2024-01',
  webhook_secret TEXT,
  store_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Orders table - stores processed orders
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
  manually_edited_fields TEXT,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE(store_id, shopify_order_id)
);

-- Global field mappings table
CREATE TABLE global_field_mappings (
  id TEXT PRIMARY KEY,
  store_id TEXT, -- Allow NULL for global mappings
  dashboard_field TEXT NOT NULL,
  shopify_fields TEXT NOT NULL, -- JSON array of Shopify field paths
  separator TEXT DEFAULT ' ',
  no_mapping BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE(store_id, dashboard_field)
);

-- Extract processing mappings table
CREATE TABLE extract_processing_mappings (
  id TEXT PRIMARY KEY,
  store_id TEXT, -- Allow NULL for global mappings
  dashboard_field TEXT NOT NULL,
  processing_type TEXT NOT NULL, -- 'date', 'time', 'group', 'itemCount', 'description'
  source_field TEXT NOT NULL, -- e.g., 'order.tags', 'order.name', 'line_items'
  format TEXT NOT NULL, -- e.g., 'dd/mm/yyyy', 'first_two_letters', 'sum_quantities'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE(store_id, dashboard_field)
);

-- User sessions table for authentication
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table for basic authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Webhook events table for tracking webhook processing
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  shopify_order_id INTEGER,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Detrack configuration table
CREATE TABLE detrack_config (
  id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  base_url TEXT DEFAULT 'https://api.detrack.com/v2',
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- saved products
CREATE TABLE saved_products (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  label TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

-- Indexes for better performance
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_global_mappings_store_id ON global_field_mappings(store_id);
CREATE INDEX idx_extract_mappings_store_id ON extract_processing_mappings(store_id);
CREATE INDEX idx_webhook_events_store_id ON webhook_events(store_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at); 