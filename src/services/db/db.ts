import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';

// sql.js types (loaded globally via script tag)
interface SqlJsStatic {
  Database: new (data?: ArrayLike<number>) => Database;
}

interface Database {
  run(sql: string, params?: unknown[]): Database;
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>;
  prepare(sql: string): Statement;
  export(): Uint8Array;
  close(): void;
  getRowsModified(): number;
}

interface Statement {
  bind(params?: unknown[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): boolean;
}

// Global initSqlJs loaded from CDN
declare global {
  function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
}

const DB_STORAGE_KEY = 'rims_sqlite_db';
const SCHEMA_VERSION_KEY = 'schema_version';

let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

/**
 * Initialize the SQLite database using sql.js
 * Loads existing data from localStorage if available
 */
export async function initializeDatabase(): Promise<Database> {
  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  // Return existing database if already initialized
  if (db) {
    return db;
  }

  initPromise = (async () => {
    // Use global initSqlJs loaded from CDN script tag
    const SQL: SqlJsStatic = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });

    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem(DB_STORAGE_KEY);
    if (savedDb) {
      try {
        const binaryArray = Uint8Array.from(atob(savedDb), (c) => c.charCodeAt(0));
        db = new SQL.Database(binaryArray);
        console.log('Loaded existing SQLite database from localStorage');

        // Check and run migrations if needed
        await runMigrations(db);
      } catch (error) {
        console.error('Failed to load database from localStorage, creating new one:', error);
        db = new SQL.Database();
        initializeSchema(db);
      }
    } else {
      // Create new database
      db = new SQL.Database();
      initializeSchema(db);
      console.log('Created new SQLite database');
    }

    return db;
  })();

  return initPromise;
}

/**
 * Initialize the database schema
 */
function initializeSchema(database: Database): void {
  database.run(CREATE_TABLES_SQL);

  // Set schema version
  database.run(
    'INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)',
    [SCHEMA_VERSION_KEY, String(SCHEMA_VERSION)]
  );

  persistDatabase();
}

/**
 * Run any pending migrations
 */
async function runMigrations(database: Database): Promise<void> {
  const result = database.exec(
    `SELECT value FROM app_metadata WHERE key = '${SCHEMA_VERSION_KEY}'`
  );

  const currentVersion = result.length > 0 && result[0].values.length > 0
    ? parseInt(result[0].values[0][0] as string, 10)
    : 0;

  if (currentVersion < SCHEMA_VERSION) {
    console.log(`Migrating database from version ${currentVersion} to ${SCHEMA_VERSION}`);

    // Run CREATE TABLE IF NOT EXISTS to add any new tables
    database.run(CREATE_TABLES_SQL);

    // Version-specific migrations
    if (currentVersion < 2) {
      // Add email verification columns to users table
      try {
        database.run('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1');
      } catch {
        // Column may already exist
      }
      try {
        database.run('ALTER TABLE users ADD COLUMN email_verification_token TEXT');
      } catch {
        // Column may already exist
      }
      try {
        database.run('ALTER TABLE users ADD COLUMN email_verification_token_expires_at TEXT');
      } catch {
        // Column may already exist
      }
      console.log('Migration to v2: Added email verification columns');
    }

    // Migration: v2 → v3: Seed categories table from existing item categories
    if (currentVersion < 3) {
      migrateToV3Categories(database);
    }

    // Migration: v2 → v3: Rename item columns to generic equivalents
    if (currentVersion < 3) {
      migrateToV3FieldRenames(database);
    }

    // Update schema version
    database.run(
      'INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)',
      [SCHEMA_VERSION_KEY, String(SCHEMA_VERSION)]
    );

    persistDatabase();
  }
}

/**
 * Get the database instance
 * Returns null if database is not initialized
 */
export function getDatabase(): Database | null {
  return db;
}

/**
 * Get the database instance, throwing if not initialized
 * Use this only when you're certain the database should be ready
 */
export function getDatabaseOrThrow(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Check if the database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}

/**
 * Persist the database to localStorage
 */
export function persistDatabase(): void {
  if (!db) {
    return;
  }

  try {
    const data = db.export();
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem(DB_STORAGE_KEY, base64);
  } catch (error) {
    console.error('Failed to persist database to localStorage:', error);
  }
}

/**
 * Close and cleanup the database
 */
export function closeDatabase(): void {
  if (db) {
    persistDatabase();
    db.close();
    db = null;
    initPromise = null;
  }
}

/**
 * Execute a SQL query and return results
 * Returns empty array if database is not initialized
 */
export function execQuery<T>(sql: string, params: unknown[] = []): T[] {
  const database = getDatabase();
  if (!database) {
    return [];
  }

  const stmt = database.prepare(sql);
  stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row as T);
  }
  stmt.free();

  return results;
}

/**
 * Execute a SQL statement (INSERT, UPDATE, DELETE)
 * Returns the number of changes made, or 0 if database is not initialized
 */
export function execStatement(sql: string, params: unknown[] = []): number {
  const database = getDatabase();
  if (!database) {
    console.warn('Database not initialized, skipping statement:', sql);
    return 0;
  }

  database.run(sql, params);
  const changes = database.getRowsModified();
  persistDatabase();
  return changes;
}

/**
 * Execute multiple SQL statements in a transaction
 */
export function execTransaction(statements: Array<{ sql: string; params?: unknown[] }>): void {
  const database = getDatabase();
  if (!database) {
    console.warn('Database not initialized, skipping transaction');
    return;
  }

  database.run('BEGIN TRANSACTION');
  try {
    for (const { sql, params } of statements) {
      database.run(sql, params || []);
    }
    database.run('COMMIT');
    persistDatabase();
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  }
}

/**
 * Get the last inserted row ID
 */
export function getLastInsertRowId(): number {
  const database = getDatabase();
  if (!database) {
    return 0;
  }

  const result = database.exec('SELECT last_insert_rowid()');
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as number;
  }
  return 0;
}

/**
 * Migrate to schema v2: Seed the categories table.
 * Collects distinct categories already used on items and adds default categories,
 * preserving any data already in the database.
 */
function migrateToV3Categories(database: Database): void {
  const DEFAULT_CATEGORIES = [
    'Arduino',
    'Raspberry Pi',
    'BeagleBone',
    'Prototyping',
    'Kits & Projects',
    'Boards',
    'LCDs & Displays',
    'LEDs',
    'Power',
    'Cables',
    'Tools',
    'Robotics',
    'CNC',
    'Components & Parts',
    'Sensors',
    '3D Printing',
    'Wireless',
  ];

  // Gather categories already in use on items
  const existingResult = database.exec(
    "SELECT DISTINCT category FROM items WHERE category != ''"
  );
  const usedCategories: string[] = [];
  if (existingResult.length > 0) {
    for (const row of existingResult[0].values) {
      usedCategories.push(row[0] as string);
    }
  }

  // Merge: defaults first, then any item categories not already in the list
  const allCategories = [...DEFAULT_CATEGORIES];
  for (const cat of usedCategories) {
    if (!allCategories.includes(cat)) {
      allCategories.push(cat);
    }
  }

  const now = new Date().toISOString();
  for (let i = 0; i < allCategories.length; i++) {
    database.run(
      'INSERT OR IGNORE INTO categories (name, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [allCategories[i], i, now, now]
    );
  }

  console.log(`Migrated to v3: seeded ${allCategories.length} categories`);
}

/**
 * Migrate to schema v3: Rename item columns to generic equivalents.
 * product_model_number → model_number
 * vendor_part_number → part_number
 */
function migrateToV3FieldRenames(database: Database): void {
  database.run('ALTER TABLE items RENAME COLUMN product_model_number TO model_number');
  database.run('ALTER TABLE items RENAME COLUMN vendor_part_number TO part_number');
  console.log('Migrated to v3: renamed product_model_number → model_number, vendor_part_number → part_number');
}

/**
 * Get the next ID for a table (MAX(id) + 1)
 */
export function getNextId(tableName: string): number {
  const database = getDatabase();
  if (!database) {
    return 1;
  }

  const result = database.exec(`SELECT COALESCE(MAX(id), 0) + 1 FROM ${tableName}`);
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as number;
  }
  return 1;
}
