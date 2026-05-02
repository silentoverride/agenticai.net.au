/**
 * Client Portal Database Module
 *
 * Provides a SQLite database (via better-sqlite3) for persisting portal users,
 * report ownership, and Stripe receipts. Designed for local development with a
 * schema that is forward-compatible with Cloudflare D1 migration.
 *
 * In Cloudflare Workers (production), better-sqlite3 is unavailable because it
 * requires native C++ bindings. The module detects this and marks the database
 * as unavailable — callers should check {@link isDatabaseAvailable} before use.
 *
 * @module db
 * @example
 * import { getDb, isDatabaseAvailable, type DbUser } from '$lib/server/db';
 * if (!isDatabaseAvailable()) {
 *   // return 503 or skip DB operation
 * }
 * const db = getDb();
 * const user = db.prepare('SELECT * FROM users WHERE clerk_id = ?').get(id) as DbUser;
 */

import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import * as path from 'node:path';
import * as fs from 'node:fs';

/** Directory where the SQLite database file is stored. Defaults to `./app_data`. */
const DB_DIR = env.DB_DIR || './app_data';

/** Resolved absolute path to the SQLite database file. */
const DB_PATH = path.resolve(DB_DIR, 'portal.db');

/** Singleton database instance. Created once and reused for the process lifetime. */
let dbInstance: Database.Database | null = null;

/** Set to `true` if the native SQLite driver failed to load (e.g. Cloudflare Workers). */
let dbUnavailable = false;

/** The original error that caused database initialization to fail. */
let dbError: Error | null = null;

/**
 * Check whether the local SQLite database is functional.
 *
 * @returns `true` if `getDb()` will return a working connection, `false` if
 * the runtime does not support native SQLite (e.g. Cloudflare Workers).
 * @example
 * if (!isDatabaseAvailable()) {
 *   return json({ error: 'Portal database not available in this environment' }, { status: 503 });
 * }
 */
export function isDatabaseAvailable(): boolean {
  return !dbUnavailable;
}

/**
 * Get the error that caused the database to become unavailable.
 * Useful for logging diagnostics in production.
 *
 * @returns The initialization error, or `null` if the DB is healthy.
 */
export function getDatabaseError(): Error | null {
  return dbError;
}

/**
 * Ensure a directory exists on disk, creating it recursively if needed.
 * @param dir - Absolute or relative directory path.
 */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Initialise and return the shared SQLite database instance.
 *
 * On first call, this creates the database file (and parent directory),
 * enables WAL journal mode, and runs the schema initialiser.
 * Subsequent calls return the cached instance.
 *
 * If the runtime does not support native SQLite (e.g. Cloudflare Workers),
 * this throws a descriptive error on first call and marks the database as
 * permanently unavailable for the process lifetime.
 *
 * @returns A better-sqlite3 Database instance ready for queries.
 * @throws Error if the database cannot be initialised.
 * @example
 * if (!isDatabaseAvailable()) {
 *   throw error(503, 'Portal temporarily unavailable');
 * }
 * const db = getDb();
 */
export function getDb(): Database.Database {
  if (dbUnavailable) {
    throw new Error(
      `Database unavailable: ${dbError?.message || 'Native SQLite not supported in this environment'}`
    );
  }
  if (dbInstance) return dbInstance;

  try {
    ensureDir(DB_DIR);
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    initSchema(dbInstance);
    return dbInstance;
  } catch (err) {
    dbUnavailable = true;
    dbError = err instanceof Error ? err : new Error(String(err));
    console.error('Database initialization failed:', dbError);
    throw new Error(`Database unavailable: ${dbError.message}`);
  }
}

/**
 * Create tables and indexes if they do not already exist.
 *
 * Schema overview:
 * - `users` — portal users synced from Clerk (clerk_id is the primary key).
 * - `user_reports` — links between users and assessment reports.
 * - `receipts` — Stripe payment records. `user_id` is nullable so receipts
 *   can be stored before the customer has signed up for the portal.
 *
 * @param db - A connected better-sqlite3 Database instance.
 */
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
// Type definitions
// ---------------------------------------------------------------------------

/** A portal user synced from Clerk authentication. */
export type DbUser = {
  /** Clerk user ID (primary key). */
  clerk_id: string;
  /** Email address from Clerk. */
  email: string;
  /** Display name (nullable). */
  name: string | null;
  /** Phone number if provided (nullable). */
  phone: string | null;
  /** ISO-8601 timestamp when the row was created. */
  created_at: string;
};

/** A link between a portal user and an assessment report. */
export type DbReport = {
  /** Local row ID (primary key). */
  id: string;
  /** Foreign key to `users.clerk_id`. */
  user_id: string;
  /** The report ID (matches the filesystem directory name). */
  report_id: string;
  /** Stripe Checkout session ID that paid for this report (nullable). */
  stripe_session_id: string | null;
  /** URL to the generated Presenton PPTX deck (nullable). */
  deck_url: string | null;
  /** Human-readable title for the report list (nullable). */
  title: string | null;
  /** Company name extracted from the assessment job (nullable). */
  company: string | null;
  /** ISO-8601 timestamp when the row was created. */
  created_at: string;
};

/** A Stripe payment receipt stored for portal download. */
export type DbReceipt = {
  /** Local row ID (primary key). */
  id: string;
  /** Foreign key to `users.clerk_id`. Nullable until the user signs up. */
  user_id: string | null;
  /** Stripe Checkout session ID (unique). */
  stripe_session_id: string | null;
  /** Payment amount in the smallest currency unit (e.g. cents). */
  amount_cents: number | null;
  /** Three-letter currency code, e.g. `aud`. */
  currency: string | null;
  /** Customer email from the Stripe session (nullable). */
  customer_email: string | null;
  /** Customer name from the Stripe session (nullable). */
  customer_name: string | null;
  /** Company name from the assessment job (nullable). */
  company: string | null;
  /** URL to the Stripe-hosted receipt page (nullable). */
  receipt_url: string | null;
  /** ISO-8601 timestamp when the row was created. */
  created_at: string;
};
