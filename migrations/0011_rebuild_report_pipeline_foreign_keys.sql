-- Migration 0011: Rebuild reports and pipeline_status with full FK enforcement.
--
-- Previous migrations added relationship columns and unique indexes, but
-- SQLite/D1 cannot add foreign-key clauses to existing columns with ALTER
-- TABLE. This rebuild preserves data, nulls invalid relationship values, and
-- recreates the intended constraints.

PRAGMA foreign_keys = OFF;

CREATE TABLE reports_new (
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

INSERT INTO reports_new (
  id,
  user_id,
  receipt_id,
  call_id,
  session_id,
  customer_email,
  customer_name,
  company,
  r2_key,
  deck_url,
  title,
  created_at
)
SELECT
  id,
  CASE
    WHEN user_id IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE users.clerk_id = reports.user_id)
      THEN user_id
    ELSE NULL
  END,
  CASE
    WHEN receipt_id IS NOT NULL AND EXISTS (SELECT 1 FROM receipts WHERE receipts.id = reports.receipt_id)
      THEN receipt_id
    ELSE NULL
  END,
  CASE
    WHEN call_id IS NOT NULL AND EXISTS (SELECT 1 FROM transcripts WHERE transcripts.call_id = reports.call_id)
      THEN call_id
    ELSE NULL
  END,
  session_id,
  customer_email,
  customer_name,
  company,
  r2_key,
  deck_url,
  title,
  created_at
FROM reports;

DROP TABLE reports;
ALTER TABLE reports_new RENAME TO reports;

CREATE INDEX IF NOT EXISTS idx_reports_session ON reports(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_session_receipt ON reports(session_id, receipt_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_created ON reports(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_receipt_id ON reports(receipt_id);
CREATE INDEX IF NOT EXISTS idx_reports_email ON reports(customer_email);
CREATE INDEX IF NOT EXISTS idx_reports_call_id ON reports(call_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_call_id_unique
  ON reports(call_id)
  WHERE call_id IS NOT NULL;

CREATE TABLE pipeline_status_new (
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

INSERT INTO pipeline_status_new (
  session_id,
  status,
  deck_url,
  report_id,
  error,
  attempts,
  call_id,
  created_at,
  updated_at
)
SELECT
  session_id,
  status,
  deck_url,
  CASE
    WHEN report_id IS NOT NULL AND EXISTS (SELECT 1 FROM reports WHERE reports.id = pipeline_status.report_id)
      THEN report_id
    ELSE NULL
  END,
  error,
  attempts,
  CASE
    WHEN call_id IS NOT NULL AND EXISTS (SELECT 1 FROM transcripts WHERE transcripts.call_id = pipeline_status.call_id)
      THEN call_id
    ELSE NULL
  END,
  created_at,
  updated_at
FROM pipeline_status;

DROP TABLE pipeline_status;
ALTER TABLE pipeline_status_new RENAME TO pipeline_status;

CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_status(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_pipeline_status_call_id ON pipeline_status(call_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_status_report_id_unique
  ON pipeline_status(report_id)
  WHERE report_id IS NOT NULL;

PRAGMA foreign_keys = ON;
