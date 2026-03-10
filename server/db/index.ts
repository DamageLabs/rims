import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CREATE_TABLES_SQL } from './schema';
import { mapRowToEntity, mapRowsToEntities, buildInsertSQL, buildUpdateSQL } from './mapper';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/rims.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(CREATE_TABLES_SQL);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Generic query helpers
export function queryAll<T>(sql: string, params: unknown[] = [], jsonFields: string[] = []): T[] {
  const rows = getDatabase().prepare(sql).all(...params) as Record<string, unknown>[];
  return mapRowsToEntities<T>(rows, jsonFields);
}

export function queryOne<T>(sql: string, params: unknown[] = [], jsonFields: string[] = []): T | null {
  const row = getDatabase().prepare(sql).get(...params) as Record<string, unknown> | undefined;
  return row ? mapRowToEntity<T>(row, jsonFields) : null;
}

export function run(sql: string, params: unknown[] = []): Database.RunResult {
  return getDatabase().prepare(sql).run(...params);
}

export function insert<T>(table: string, data: Record<string, unknown>, jsonFields: string[] = []): T {
  const { sql, params } = buildInsertSQL(table, data, jsonFields);
  const result = getDatabase().prepare(sql).run(...params);
  const row = getDatabase().prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid) as Record<string, unknown>;
  return mapRowToEntity<T>(row, jsonFields);
}

export function update<T>(table: string, id: number, data: Record<string, unknown>, jsonFields: string[] = []): T | null {
  const { sql, params } = buildUpdateSQL(table, data, 'id = ?', [id], jsonFields);
  getDatabase().prepare(sql).run(...params);
  const row = getDatabase().prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToEntity<T>(row, jsonFields) : null;
}

export function deleteById(table: string, id: number): boolean {
  const result = getDatabase().prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function count(table: string, where?: string, params: unknown[] = []): number {
  const sql = where ? `SELECT COUNT(*) as count FROM ${table} WHERE ${where}` : `SELECT COUNT(*) as count FROM ${table}`;
  const row = getDatabase().prepare(sql).get(...params) as { count: number };
  return row.count;
}

// Re-export mapper utilities
export { mapRowToEntity, mapRowsToEntities, buildInsertSQL, buildUpdateSQL } from './mapper';

// Existing user/auth queries (preserved for auth routes)
export interface UserRow {
  id: number;
  email: string;
  password: string;
  role: string;
  sign_in_count: number;
  last_sign_in_at: string | null;
  last_sign_in_ip: string | null;
  email_verified: number;
  email_verification_token: string | null;
  email_verification_token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  password: string;
  role: string;
  signInCount: number;
  lastSignInAt: string | null;
  lastSignInIp: string | null;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationTokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    role: row.role,
    signInCount: row.sign_in_count,
    lastSignInAt: row.last_sign_in_at,
    lastSignInIp: row.last_sign_in_ip,
    emailVerified: row.email_verified === 1,
    emailVerificationToken: row.email_verification_token,
    emailVerificationTokenExpiresAt: row.email_verification_token_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const userQueries = {
  findByEmail(email: string): User | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as UserRow | undefined;
    return row ? rowToUser(row) : null;
  },

  findByVerificationToken(token: string): User | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE email_verification_token = ?').get(token) as UserRow | undefined;
    return row ? rowToUser(row) : null;
  },

  create(data: {
    email: string;
    password: string;
    role?: string;
    emailVerificationToken: string;
    emailVerificationTokenExpiresAt: string;
  }): User {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (email, password, role, sign_in_count, email_verified, email_verification_token, email_verification_token_expires_at, created_at, updated_at)
      VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?)
    `);
    const result = stmt.run(data.email, data.password, data.role || 'user', data.emailVerificationToken, data.emailVerificationTokenExpiresAt, now, now);
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRow;
    return rowToUser(row);
  },

  markEmailVerified(userId: number): User | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_token_expires_at = NULL, updated_at = ? WHERE id = ?`).run(now, userId);
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
    return row ? rowToUser(row) : null;
  },

  setVerificationToken(userId: number, token: string, expiresAt: string): User | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`UPDATE users SET email_verification_token = ?, email_verification_token_expires_at = ?, updated_at = ? WHERE id = ?`).run(token, expiresAt, now, userId);
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
    return row ? rowToUser(row) : null;
  },
};

export const rateLimitQueries = {
  canSendEmail(email: string): boolean {
    const db = getDatabase();
    const row = db.prepare('SELECT last_sent_at FROM email_rate_limits WHERE email = ?').get(email) as { last_sent_at: string } | undefined;
    if (!row) return true;
    const lastSent = new Date(row.last_sent_at);
    const now = new Date();
    return (now.getTime() - lastSent.getTime()) / (1000 * 60) >= 1;
  },

  recordEmailSent(email: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO email_rate_limits (email, last_sent_at) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET last_sent_at = ?`).run(email, now, now);
  },
};
