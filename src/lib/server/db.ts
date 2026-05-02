/**
 * Client Portal Database Module
 *
 * Provides a SQLite database (via better-sqlite3) for persisting portal users,
 * report ownership, and Stripe receipts. Designed for local development with a
 * schema that is forward-compatible with Cloudflare D1 migration.
 *
 * The database is created lazily on first `getDb()` call and uses WAL mode
 * for better concurrent read performance.
 *
 * @module db
 * @example
 * import { getDb, type DbUser } from '$lib/server/db';
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
 * @returns A better-sqlite3 Database instance ready for queries.
 * @example
 * const db = getDb();
 * const row = db.prepare('SELECT * FROM users WHERE clerk_id = ?').get('user_123');
 */
export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  ensureDir(DB_DIR);
  dbInstance = new Database(DB_PATH);
  dbInstance.pragma('journal_mode = WAL');
  initSchema(dbInstance);
  return dbInstance;
}

/**
 * Create tables and indexes if they do not already exist.
 *
 * Schema overview:
 * - `users` — portal users synced from Clerk (clerk_id is the primary key).
 * - `user_reports` — links between users and generated assessment reports.
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
