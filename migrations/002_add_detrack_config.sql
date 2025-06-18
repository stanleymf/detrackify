-- Add Detrack configuration table
CREATE TABLE IF NOT EXISTS detrack_config (
  id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  base_url TEXT DEFAULT 'https://api.detrack.com/v2',
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
); 