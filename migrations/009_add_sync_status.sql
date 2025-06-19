-- Migration 009: Add sync_status table
CREATE TABLE IF NOT EXISTS sync_status (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  last_sync TEXT,
  total_products INTEGER DEFAULT 0,
  last_sync_status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, store_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_status_user_store ON sync_status(user_id, store_id); 