-- Migration: Add title_filters table
-- Description: Creates a table to store title filters for product fetching

CREATE TABLE IF NOT EXISTS title_filters (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    store_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_title_filters_user_store ON title_filters(user_id, store_id);
CREATE INDEX IF NOT EXISTS idx_title_filters_created_at ON title_filters(created_at); 