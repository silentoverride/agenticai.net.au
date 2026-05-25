-- Migration 0017: Staff Portal action audit events
-- Durable lifecycle action receipts with actor-scoped idempotency.

CREATE TABLE IF NOT EXISTS staff_action_audit_events (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  reason_code TEXT,
  reason TEXT,
  request_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(actor_id, assessment_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_staff_action_audit_events_assessment_id
  ON staff_action_audit_events(assessment_id);
CREATE INDEX IF NOT EXISTS idx_staff_action_audit_events_actor_id
  ON staff_action_audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_staff_action_audit_events_action
  ON staff_action_audit_events(action);
CREATE INDEX IF NOT EXISTS idx_staff_action_audit_events_created_at
  ON staff_action_audit_events(created_at);
