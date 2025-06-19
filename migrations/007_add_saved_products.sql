-- Create saved_products table
CREATE TABLE IF NOT EXISTS saved_products (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  variant_title TEXT,
  price TEXT NOT NULL,
  handle TEXT NOT NULL,
  tags TEXT NOT NULL,
  order_tags TEXT NOT NULL,
  store_id TEXT NOT NULL,
  store_domain TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(product_id, user_id)
); 