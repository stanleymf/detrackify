-- Migration to fix field mapping tables
-- Drop existing tables
DROP TABLE IF EXISTS global_field_mappings;
DROP TABLE IF EXISTS extract_processing_mappings;

-- Recreate global field mappings table with NULL store_id support
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

-- Recreate extract processing mappings table with NULL store_id support
CREATE TABLE extract_processing_mappings (
  id TEXT PRIMARY KEY,
  store_id TEXT, -- Allow NULL for global mappings
  dashboard_field TEXT NOT NULL,
  processing_type TEXT NOT NULL, -- 'date', 'time', 'description', 'itemCount'
  source_field TEXT NOT NULL,
  format TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE(store_id, dashboard_field)
);

-- Recreate indexes
CREATE INDEX idx_global_mappings_store_id ON global_field_mappings(store_id);
CREATE INDEX idx_extract_mappings_store_id ON extract_processing_mappings(store_id); 