-- Add configuration tables for Product Labels and Driver Info
-- These will be user-specific and stored on the server

-- Product Labels table
CREATE TABLE product_labels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Driver Info table
CREATE TABLE driver_info (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  paynow_number TEXT NOT NULL,
  detrack_id TEXT NOT NULL,
  contact_no TEXT NOT NULL,
  price_per_drop TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_product_labels_user_id ON product_labels(user_id);
CREATE INDEX idx_driver_info_user_id ON driver_info(user_id); 