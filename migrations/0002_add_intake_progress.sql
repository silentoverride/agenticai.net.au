-- Migration 0002: Intake progress tracking for Annie chat
-- Created as part of Story 1.4 (Guided Annie Intake)
-- Range: 0001–0009 (Epic 1)

CREATE TABLE IF NOT EXISTS intake_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL UNIQUE,
  answers_json TEXT NOT NULL DEFAULT '[]',
  current_index INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_intake_progress_session_id
  ON intake_progress(session_id);

CREATE INDEX IF NOT EXISTS idx_intake_progress_completed
  ON intake_progress(completed);
