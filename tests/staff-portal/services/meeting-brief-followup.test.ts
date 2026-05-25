import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';
import { createFollowUpFromMeetingBrief } from '$lib/server/staff-portal/services/meeting-brief-followup.service';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS follow_ups (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    owner_id TEXT,
    due_date TEXT,
    source TEXT NOT NULL DEFAULT 'client_profile',
    status TEXT NOT NULL DEFAULT 'open',
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
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

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
`;

describe('meeting-brief-followup', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  it('creates follow-up linked to meeting brief', async () => {
    const { db } = makeDb();

    const result = await createFollowUpFromMeetingBrief({
      db,
      assessmentId: 'asst-001',
      meetingBriefId: 'mb-001',
      actorId: 'op-001',
      description: 'Follow up on pricing discussion from meeting',
      dueDate: null,
      notesSnippet: 'Discuss offer for premium plan'
    });

    expect(result.success).toBe(true);
    expect(result.receipt).toBeDefined();
    expect(result.receipt!.target.type).toBe('followUp');
    expect(result.receipt!.action).toBe('completeFollowUp');
    expect(result.receipt!.reasonCode).toBe('from_meeting_brief');
  });

  it('creates follow-up with due date', async () => {
    const { db } = makeDb();

    const result = await createFollowUpFromMeetingBrief({
      db,
      assessmentId: 'asst-002',
      meetingBriefId: 'mb-002',
      actorId: 'op-001',
      description: 'Send proposal',
      dueDate: '2026-06-15',
      notesSnippet: 'Proposal follow-up'
    });

    expect(result.success).toBe(true);
    expect(result.receipt).toBeDefined();

    const row = await db.queryOne<{ due_date: string }>(
      'SELECT due_date FROM follow_ups WHERE assessment_id = ?',
      'asst-002'
    );
    expect(row?.due_date).toBe('2026-06-15');
  });

  it('includes notes snippet in audit reason', async () => {
    const { db } = makeDb();

    const result = await createFollowUpFromMeetingBrief({
      db,
      assessmentId: 'asst-003',
      meetingBriefId: 'mb-003',
      actorId: 'op-001',
      description: 'Call back about contract renewal',
      dueDate: null,
      notesSnippet: 'Contract renewal discussion'
    });

    expect(result.success).toBe(true);
    expect(result.receipt!.reason).toContain('Contract renewal discussion');
  });
});
