// SQL Schema definitions for RIMS database

export const SCHEMA_VERSION = 3;

export const CREATE_TABLES_SQL = `
-- App metadata for tracking initialization and schema version
CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  sign_in_count INTEGER NOT NULL DEFAULT 0,
  last_sign_in_at TEXT,
  last_sign_in_ip TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  email_verification_token TEXT,
  email_verification_token_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  product_model_number TEXT NOT NULL DEFAULT '',
  vendor_part_number TEXT NOT NULL DEFAULT '',
  vendor_name TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_value REAL NOT NULL DEFAULT 0,
  value REAL NOT NULL DEFAULT 0,
  picture TEXT,
  vendor_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  barcode TEXT NOT NULL DEFAULT '',
  reorder_point INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Stock history table
CREATE TABLE IF NOT EXISTS stock_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  change_type TEXT NOT NULL,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  previous_value REAL,
  new_value REAL,
  previous_category TEXT,
  new_category TEXT,
  notes TEXT NOT NULL DEFAULT '',
  user_id INTEGER,
  user_email TEXT,
  timestamp TEXT NOT NULL
);

-- Cost history table
CREATE TABLE IF NOT EXISTS cost_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  old_value REAL NOT NULL,
  new_value REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  timestamp TEXT NOT NULL
);

-- Item templates table
CREATE TABLE IF NOT EXISTS item_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_fields TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- BOMs table
CREATE TABLE IF NOT EXISTS boms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Vendor price cache table
CREATE TABLE IF NOT EXISTS vendor_price_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT NOT NULL UNIQUE,
  vendor TEXT NOT NULL,
  part_number TEXT NOT NULL,
  price REAL NOT NULL,
  in_stock INTEGER NOT NULL DEFAULT 0,
  stock_quantity INTEGER,
  vendor_url TEXT,
  last_checked TEXT NOT NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS idx_stock_history_item_id ON stock_history(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_timestamp ON stock_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_cost_history_item_id ON cost_history(item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_cache_key ON vendor_price_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_item_templates_category ON item_templates(category);
`;

export const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS vendor_price_cache;
DROP TABLE IF EXISTS boms;
DROP TABLE IF EXISTS item_templates;
DROP TABLE IF EXISTS cost_history;
DROP TABLE IF EXISTS stock_history;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS app_metadata;
`;
