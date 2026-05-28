-- Migration 0022: Governed gate finding decision table
-- Tracks staff decisions on individual gate findings with versioned state.
-- GateFindingState values validated at application layer (no D1 enum support).

CREATE TABLE IF NOT EXISTS staff_gate_finding_decisions (
  id TEXT PRIMARY KEY,
  gate_finding_id TEXT NOT NULL,
  assessment_id TEXT NOT NULL,
  finding_decision TEXT NOT NULL,
  override_reason TEXT,
  notes TEXT,
  reviewer_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_staff_gate_finding_decisions_gate_finding_id
  ON staff_gate_finding_decisions(gate_finding_id);
CREATE INDEX IF NOT EXISTS idx_staff_gate_finding_decisions_assessment_id
  ON staff_gate_finding_decisions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_staff_gate_finding_decisions_finding_decision
  ON staff_gate_finding_decisions(finding_decision);
