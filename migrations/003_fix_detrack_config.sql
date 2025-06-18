-- Fix Detrack configuration table - remove api_secret column if it exists
-- This migration handles the case where the old schema with api_secret still exists

-- First, try to drop the api_secret column if it exists
-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Create a backup of existing data
CREATE TABLE IF NOT EXISTS detrack_config_backup AS SELECT * FROM detrack_config;

-- Drop the old table
DROP TABLE IF EXISTS detrack_config;

-- Create the new table without api_secret
CREATE TABLE detrack_config (
  id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  base_url TEXT DEFAULT 'https://api.detrack.com/v2',
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Restore data from backup (excluding api_secret column)
INSERT INTO detrack_config (id, api_key, base_url, is_enabled, created_at, updated_at)
SELECT id, api_key, base_url, is_enabled, created_at, updated_at
FROM detrack_config_backup;

-- Drop the backup table
DROP TABLE detrack_config_backup; 