-- Migration 0021: Governed report state table
-- Separates Staff Portal decision state from raw pipeline/gate source data.
-- ReportState values validated at application layer (no D1 enum support).

CREATE TABLE IF NOT EXISTS staff_report_states (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  client_id TEXT,
  report_state TEXT NOT NULL,
  previous_state TEXT,
  reason_code TEXT,
  review_note TEXT,
  reviewer_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_staff_report_states_assessment_id
  ON staff_report_states(assessment_id);
CREATE INDEX IF NOT EXISTS idx_staff_report_states_report_state
  ON staff_report_states(report_state);
CREATE INDEX IF NOT EXISTS idx_staff_report_states_reviewer_id
  ON staff_report_states(reviewer_id);
