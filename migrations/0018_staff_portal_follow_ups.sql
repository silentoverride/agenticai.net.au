-- Migration 0018: Follow-up commitments
-- Tracks operational promises with owner, due date, source, status, and audit trail.

CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_id TEXT,
  due_date TEXT,
  source TEXT NOT NULL DEFAULT 'client_profile',
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'completed', 'deferred', 'reassigned')),
  client_visible_promise INTEGER NOT NULL DEFAULT 0,
  consequence_of_inaction TEXT,
  notes TEXT,
  linked_report_id TEXT,
  linked_gate_finding_id TEXT,
  linked_meeting_brief_id TEXT,
  linked_commercial_step_id TEXT,
  support_issue_ref TEXT,
  admin_task_ref TEXT,
  delayed_journey_state TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_assessment_id ON follow_ups(assessment_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_owner_id ON follow_ups(owner_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(due_date);
