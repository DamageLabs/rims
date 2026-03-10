export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS email_rate_limits (
  email TEXT PRIMARY KEY,
  last_sent_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '',
  schema TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_value REAL NOT NULL DEFAULT 0,
  value REAL NOT NULL DEFAULT 0,
  picture TEXT,
  category TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  barcode TEXT NOT NULL DEFAULT '',
  reorder_point INTEGER NOT NULL DEFAULT 0,
  inventory_type_id INTEGER NOT NULL DEFAULT 1,
  custom_fields TEXT NOT NULL DEFAULT '{}',
  parent_item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS cost_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  old_value REAL NOT NULL,
  new_value REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS item_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_fields TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS boms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  inventory_type_id INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(name, inventory_type_id)
);

CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_type_id ON categories(inventory_type_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS idx_items_type_id ON items(inventory_type_id);
CREATE INDEX IF NOT EXISTS idx_items_parent_id ON items(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_item_id ON stock_history(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_timestamp ON stock_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_cost_history_item_id ON cost_history(item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_cache_key ON vendor_price_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_item_templates_category ON item_templates(category);
`;
