-- Migration 0023: Meeting brief notes table
-- Stores staff-entered meeting briefs per assessment.
-- Column names match MeetingBriefRow interface in meeting-brief.repository.ts.
-- MeetingBriefState values validated at application layer (no D1 enum support).

CREATE TABLE IF NOT EXISTS staff_meeting_briefs (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  meeting_date TEXT,
  objective TEXT,
  talking_points TEXT,
  sensitive_issues TEXT,
  offer_next_step TEXT,
  follow_up_intention TEXT,
  final_agenda_notes TEXT,
  prep_checklist TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  linked_report_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_staff_meeting_briefs_assessment_id
  ON staff_meeting_briefs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_staff_meeting_briefs_status
  ON staff_meeting_briefs(status);
