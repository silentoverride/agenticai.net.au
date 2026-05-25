-- Migration 0019: Commercial next step tracking
-- Tracks staff-entered commercial next steps per assessment.
-- This is an operational record, not a CRM or AI-scored pipeline entry.

CREATE TABLE IF NOT EXISTS commercial_next_steps (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'noAction' CHECK(status IN (
    'noAction', 'nurture', 'discussOffer', 'sendFollowUp', 'createFutureOpportunity', 'not_available'
  )),
  owner TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_commercial_next_steps_assessment_id ON commercial_next_steps(assessment_id);
