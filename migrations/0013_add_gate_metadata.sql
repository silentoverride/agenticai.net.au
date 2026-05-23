-- Migration 0013: Add gate metadata table
-- Created as part of Story 0.3 (GPT-5.5 Gate Module Infrastructure)
-- Range: 0010–0019 (Pipeline / Epic 2a)

-- Assessment gates table: records each gate evaluation run
CREATE TABLE IF NOT EXISTS assessment_gates (
  gate_run_id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  gate_type TEXT NOT NULL CHECK(gate_type IN (
    'quick-wins-verification',
    'major-project-verification',
    'report-review',
    'release-readiness'
  )),
  verdict TEXT NOT NULL CHECK(verdict IN (
    'approve', 'retry', 'block', 'escalate', 'human_assist'
  )),
  confidence REAL NOT NULL DEFAULT 0.0,
  reasoning TEXT,
  details TEXT,
  token_usage JSON,
  -- prompt_tokens INTEGER,
  -- completion_tokens INTEGER,
  -- total_tokens INTEGER,
  model TEXT,
  prompt_version TEXT DEFAULT 'v1',
  reasoning_effort TEXT DEFAULT 'medium',
  evaluation_time_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assessment_gates_assessment_id
  ON assessment_gates(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_gates_gate_type
  ON assessment_gates(gate_type);
CREATE INDEX IF NOT EXISTS idx_assessment_gates_verdict
  ON assessment_gates(verdict);
CREATE INDEX IF NOT EXISTS idx_assessment_gates_created_at
  ON assessment_gates(created_at);
