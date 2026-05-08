/**
 * Client Portal Database Module — Async Dual-Mode
 *
 * Supports Cloudflare D1 in production and better-sqlite3 in local dev.
 * All queries are async to accommodate D1's Promise-based API.
 *
 * Initialise with `setD1Binding(event.platform.env.assessment_db)` from
 * hooks.server.ts or any server route that has access to the platform env.
 *
 * @module db
 */

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
    localDb.pragma('foreign_keys = ON');
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
      role TEXT DEFAULT 'client',
      company TEXT,
      address TEXT,
      avatar TEXT,
      abn TEXT,
      acn TEXT,
      website TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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

    CREATE INDEX IF NOT EXISTS idx_receipts_user_created ON receipts(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_receipts_pending_customer_email_lower
      ON receipts(LOWER(customer_email))
      WHERE user_id IS NULL AND customer_email IS NOT NULL;

    CREATE TABLE IF NOT EXISTS transcripts (
      call_id TEXT PRIMARY KEY,
      transcript TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      processed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at);

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(clerk_id) ON DELETE SET NULL,
      receipt_id TEXT REFERENCES receipts(id) ON DELETE SET NULL,
      call_id TEXT REFERENCES transcripts(call_id) ON DELETE SET NULL,
      session_id TEXT,
      customer_email TEXT,
      customer_name TEXT,
      company TEXT,
      r2_key TEXT,
      deck_url TEXT,
      title TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_reports_session_receipt ON reports(session_id, receipt_id);
    CREATE INDEX IF NOT EXISTS idx_reports_user_created ON reports(user_id, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_receipt_id ON reports(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_reports_email ON reports(customer_email);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_call_id_unique
      ON reports(call_id)
      WHERE call_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS pipeline_status (
      session_id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'pending_payment', 'running_llm', 'running_tools', 'running_deck', 'completed', 'error', 'retry')),
      deck_url TEXT,
      report_id TEXT REFERENCES reports(id) ON DELETE SET NULL,
      error TEXT,
      attempts INTEGER DEFAULT 0,
      call_id TEXT REFERENCES transcripts(call_id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_status(status, updated_at);
    CREATE INDEX IF NOT EXISTS idx_pipeline_status_call_id ON pipeline_status(call_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_status_report_id_unique
      ON pipeline_status(report_id)
      WHERE report_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS processed_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      processed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_processed_events_type ON processed_events(event_type, processed_at);
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

let cachedDb: AsyncDb | null = null;
let d1Binding: D1Database | undefined;

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
    async exec(sql: string, ...params: unknown[]) {
      const stmt = d1.prepare(sql);
      const result = await stmt.bind(...params).run();
      return { changes: result.meta?.changes ?? 0, lastInsertRowid: result.meta?.last_row_id };
    },
    raw(sql: string) {
      const stmt = d1.prepare(sql);
      return { run: () => stmt.run().then(() => undefined) };
    }
  };
}

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
    async exec(sql: string, ...params: unknown[]) {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
    },
    raw(sql: string) {
      const stmt = db.prepare(sql);
      return { run: () => Promise.resolve(stmt.run()).then(() => undefined) };
    }
  };
}

/** Pass the D1 binding from `event.platform.env.assessment_db`. Call once in hooks.server.ts. */
export function setD1Binding(db: D1Database | undefined) {
  if (db) {
    d1Binding = db;
    cachedDb = null;
    console.info('DB: D1 binding registered');
  }
}

/** Get the unified async database client. */
export function getDb(): AsyncDb {
  if (cachedDb) return cachedDb;

  if (d1Binding) {
    cachedDb = createD1Db(d1Binding);
    console.info('DB: using Cloudflare D1');
  } else {
    try {
      cachedDb = createLocalDb();
      console.info('DB: using local SQLite');
    } catch (err) {
      console.error('DB: local SQLite unavailable:', err);
      throw err;
    }
  }

  return cachedDb;
}

/** Returns true if we are connected to D1 (not local SQLite). */
export function isD1Mode(): boolean {
  return !!d1Binding;
}

/** Check if the database is available. */
export function isDatabaseAvailable(): boolean {
  if (cachedDb) return true;
  if (d1Binding) return true;
  try {
    getLocalDb();
    return true;
  } catch {
    return false;
  }
}

/** Get the last error if DB init failed. */
export function getDatabaseError(): Error | null {
  return localDbError;
}

/**
 * Execute a database operation with automatic unavailability fallback.
 *
 * Centralises the `if (!isDatabaseAvailable()) { … } const db = getDb()`
 * boilerplate used by every business-logic function. All unavailability
 * warnings share a canonical `[db] <label> skipped: database unavailable`
 * format so they are grep‑able and uniform.
 *
 * @param label   Human‑readable operation name used in log output.
 * @param fallback Value returned when the DB is unavailable.
 * @param fn      The actual database operation (receives `db`).
 * @returns The result of `fn` or `fallback`.
 */
export async function withDb<T>(
  label: string,
  fallback: T,
  fn: (db: AsyncDb) => Promise<T>
): Promise<T> {
  if (!isDatabaseAvailable()) {
    console.warn(`[db] ${label} skipped: database unavailable`);
    return fallback;
  }
  return fn(getDb());
}

// ---------------------------------------------------------------------------
// Type definitions (kept for backward compat)
// ---------------------------------------------------------------------------

export type DbUser = {
  clerk_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string | null;
  company: string | null;
  address: string | null;
  avatar: string | null;
  abn: string | null;
  acn: string | null;
  website: string | null;
  created_at: string;
};

export type DbReport = {
  id: string;
  user_id: string | null;
  receipt_id: string | null;
  call_id: string | null;
  session_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  r2_key: string | null;
  deck_url: string | null;
  title: string | null;
  company: string | null;
  created_at: string;
};

export type DbReceipt = {
  id: string;
  user_id: string | null;
  stripe_session_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  customer_email: string | null;
  customer_name: string | null;
  company: string | null;
  receipt_url: string | null;
  created_at: string;
};
