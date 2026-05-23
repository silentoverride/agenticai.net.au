-- Migration 0014: Human assist reviews table
-- Created as part of Story 2b.4 (Human Assist Workflow)
-- Range: 0010–0019 (Pipeline / Epic 2a)

-- Human assist reviews: tracks operator review decisions for flagged assessments
CREATE TABLE IF NOT EXISTS human_assist_reviews (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  gate_run_id TEXT NOT NULL,
  gate_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'in_review', 'approved', 'rejected', 'edited')),
  operator_id TEXT,
  operator_notes TEXT,
  edited_content TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (gate_run_id) REFERENCES assessment_gates(gate_run_id)
);

CREATE INDEX IF NOT EXISTS idx_human_assist_reviews_status
  ON human_assist_reviews(status);
CREATE INDEX IF NOT EXISTS idx_human_assist_reviews_assessment
  ON human_assist_reviews(assessment_id);
CREATE INDEX IF NOT EXISTS idx_human_assist_reviews_created
  ON human_assist_reviews(created_at);
