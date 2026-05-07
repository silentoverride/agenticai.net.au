-- Migration 0005: Recreate pipeline_status table with updated status constraint
-- Removes 'pending_transcript', adds 'pending_payment'.
-- Also sets default 'pending_payment' on rows currently in 'pending_transcript'.

-- Step 1: Create new table with updated constraint
CREATE TABLE pipeline_status_new (
  session_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'pending_payment', 'running_llm', 'running_tools', 'running_deck', 'completed', 'error', 'retry')),
  deck_url TEXT,
  report_id TEXT,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  call_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Step 2: Copy data, converting 'pending_transcript' → 'pending_payment'
INSERT INTO pipeline_status_new (session_id, status, deck_url, report_id, error, attempts, call_id, created_at, updated_at)
SELECT session_id,
       CASE WHEN status = 'pending_transcript' THEN 'pending_payment' ELSE status END,
       deck_url, report_id, error, attempts, call_id, created_at, updated_at
FROM pipeline_status;

-- Step 3: Drop old table
DROP TABLE pipeline_status;

-- Step 4: Rename new table
ALTER TABLE pipeline_status_new RENAME TO pipeline_status;

-- Step 5: Recreate indexes
CREATE INDEX idx_pipeline_status ON pipeline_status(status, updated_at);
CREATE INDEX idx_pipeline_status_call_id ON pipeline_status(call_id);
