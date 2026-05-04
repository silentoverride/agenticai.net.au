import type { D1Database } from '@cloudflare/workers-types';
import Database from 'better-sqlite3';
import * as path from 'node:path';
import * as fs from 'node:fs';

const DB_DIR = process.env.DB_DIR || './app_data';
const DB_PATH = path.resolve(DB_DIR, 'portal.db');

let localDb: Database.Database | null = null;
let localDbError: Error | null = null;
let localDbUnavailable = false;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getLocalDb(): Database.Database {
  if (localDbUnavailable) {
    throw new Error(`Local DB unavailable: ${localDbError?.message || 'unknown'}`);
  }
  if (localDb) return localDb;

  try {
    ensureDir(DB_DIR);
    localDb = new Database(DB_PATH);
    localDb.pragma('journal_mode = WAL');
    initSchema(localDb);
    return localDb;
  } catch (err) {
    localDbUnavailable = true;
    localDbError = err instanceof Error ? err : new Error(String(err));
    console.error('Local DB init failed:', localDbError);
    throw localDbError;
  }
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      clerk_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
      report_id TEXT NOT NULL,
      stripe_session_id TEXT,
      deck_url TEXT,
      title TEXT,
      company TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_user_reports_user_id ON user_reports(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_reports_report_id ON user_reports(report_id);

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(clerk_id) ON DELETE CASCADE,
      customer_email TEXT,
      stripe_session_id TEXT UNIQUE,
      amount_cents INTEGER,
      currency TEXT,
      customer_name TEXT,
      company TEXT,
      receipt_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
    CREATE INDEX IF NOT EXISTS idx_receipts_session ON receipts(stripe_session_id);
  `);
}

// ---------------------------------------------------------------------------
// Unified async interface
// ---------------------------------------------------------------------------

export interface DbResult {
  changes: number;
  lastInsertRowid?: number | bigint;
}

export interface AsyncDb {
  queryOne<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T | null>;
  queryAll<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]>;
  exec(sql: string, ...params: unknown[]): Promise<DbResult>;
  raw(sql: string): { run(): Promise<void> };
}

// D1 async wrapper
function createD1Db(d1: D1Database): AsyncDb {
  return {
    async queryOne<T = Record<string, unknown>>(sql: string, ...params: unknown[]) {
      const stmt = d1.prepare(sql);
      const result = await stmt.bind(...params).first();
      return (result as T) || null;
    },
    async queryAll<T = Record<string, unknown>>(sql: string, ...params: unknown[]) {
      const stmt = d1.prepare(sql);
      const { results } = await stmt.bind(...params).all();
      return (results as T[]) || [];
    },
    async exec(sql, ...params) {
      const stmt = d1.prepare(sql);
      const result = await stmt.bind(...params).run();
      return { changes: result.meta?.changes || 0, lastInsertRowid: result.meta?.last_row_id };
    },
    raw(sql) {
      const stmt = d1.prepare(sql);
      return { run: () => stmt.run().then(() => undefined) };
    }
  };
}

// Local better-sqlite3 async wrapper
function createLocalDb(): AsyncDb {
  const db = getLocalDb();
  return {
    async queryOne<T = Record<string, unknown>>(sql: string, ...params: unknown[]) {
      const stmt = db.prepare(sql);
      const row = stmt.get(...params);
      return (row as T) || null;
    },
    async queryAll<T = Record<string, unknown>>(sql: string, ...params: unknown[]) {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      return (rows as T[]) || [];
    },
    async exec(sql, ...params) {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
    },
    raw(sql) {
      const stmt = db.prepare(sql);
      return { run: () => Promise.resolve(stmt.run()).then(() => undefined) };
    }
  };
}

let cachedDb: AsyncDb | null = null;
let isD1 = false;

/**
 * Get the unified async database client.
 *
 * In production (Cloudflare Workers / Pages), pass the D1Database binding
 * from `event.platform.env.assessment_db`.
 *
 * In local dev, falls back to better-sqlite3 file at `./app_data/portal.db`.
 */
export function getDb(d1Binding?: D1Database): AsyncDb {
  if (cachedDb) return cachedDb;

  if (d1Binding) {
    cachedDb = createD1Db(d1Binding);
    isD1 = true;
    console.info('DB: using Cloudflare D1');
  } else {
    try {
      cachedDb = createLocalDb();
      isD1 = false;
      console.info('DB: using local SQLite');
    } catch (err) {
      console.error('DB: local SQLite unavailable:', err);
      throw err;
    }
  }

  return cachedDb;
}

/** Returns true if the current runtime is using D1 (production). */
export function isD1Mode(): boolean {
  return isD1;
}

/** Check if the database is available (always true once getDb succeeds). */
export function isDatabaseAvailable(): boolean {
  return cachedDb !== null;
}

/** Get the last error if DB init failed (null if healthy). */
export function getDatabaseError(): Error | null {
  return localDbError;
}
