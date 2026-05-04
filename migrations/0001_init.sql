-- Migration 0001: Initial schema (users, user_reports, receipts)
-- NOTE: If these already exist in your D1 database, this migration can be skipped manually.
-- To create this migration in D1, run: npx wrangler d1 migrations apply assessment-db --local

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
