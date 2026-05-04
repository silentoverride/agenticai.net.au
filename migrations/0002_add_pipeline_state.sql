-- Migration 0002: Pipeline state, transcript storage, Stripe idempotency, report metadata

CREATE TABLE IF NOT EXISTS transcripts (
  call_id TEXT PRIMARY KEY,
  transcript TEXT NOT NULL,
  metadata TEXT,                -- JSON blob
  created_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT             -- set when pipeline picks it up
);

CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at);

CREATE TABLE IF NOT EXISTS pipeline_status (
  session_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'pending_transcript', 'running_llm', 'running_tools', 'running_deck', 'completed', 'error', 'retry')),
  deck_url TEXT,
  report_id TEXT,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_status(status, updated_at);

CREATE TABLE IF NOT EXISTS processed_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_processed_events_type ON processed_events(event_type, processed_at);

-- Optional: report metadata table (used to link report artifacts to portal users without filesystem scanning)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  call_id TEXT,
  session_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  company TEXT,
  r2_key TEXT,                  -- reference to R2 artifact path (Phase 2)
  deck_url TEXT,
  title TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_session ON reports(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_email ON reports(customer_email);
CREATE INDEX IF NOT EXISTS idx_reports_call_id ON reports(call_id);
