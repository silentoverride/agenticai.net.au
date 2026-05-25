import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';
import { insertFollowUp, findFollowUpById, findFollowUpsByAssessment, findFollowUpsByOwner, updateFollowUpStatus } from '$lib/server/staff-portal/repositories/follow-up.repository';

const SCHEMA = `
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

describe('follow-up.repository', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // Create follow-up with all optional links
  // -----------------------------------------------------------------------

  it('creates a follow-up with all optional fields', async () => {
    const { db } = makeDb();

    const followUp = await insertFollowUp(db, {
      id: 'fu-001',
      assessmentId: 'asst-001',
      title: 'Review compliance report',
      description: 'Need to check Q3 compliance data',
      ownerId: 'op-001',
      dueDate: '2026-06-01',
      source: 'client_profile',
      clientVisiblePromise: true,
      consequenceOfInaction: 'Client may miss regulatory deadline',
      notes: 'Urgent',
      linkedReportId: 'rpt-001',
      linkedGateFindingId: 'gate-001',
      linkedMeetingBriefId: null,
      linkedCommercialStepId: null,
      supportIssueRef: null,
      adminTaskRef: null,
      delayedJourneyState: null
    });

    expect(followUp.id).toBe('fu-001');
    expect(followUp.assessmentId).toBe('asst-001');
    expect(followUp.title).toBe('Review compliance report');
    expect(followUp.ownerId).toBe('op-001');
    expect(followUp.dueDate).toBe('2026-06-01');
    expect(followUp.source).toBe('client_profile');
    expect(followUp.status).toBe('open');
    expect(followUp.clientVisiblePromise).toBe(true);
    expect(followUp.linkedReportId).toBe('rpt-001');
    expect(followUp.linkedGateFindingId).toBe('gate-001');
    expect(followUp.createdAt).toBeTruthy();
    expect(followUp.updatedAt).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // Find follow-up by id
  // -----------------------------------------------------------------------

  it('finds a follow-up by id', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-002', 'asst-001', 'Test follow-up', 'client_profile', 'open', 'op-001');
      `);
    });

    const result = await findFollowUpById(db, 'fu-002');
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test follow-up');
  });

  // -----------------------------------------------------------------------
  // Find follow-ups by assessment
  // -----------------------------------------------------------------------

  it('finds all follow-ups for an assessment', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status)
        VALUES ('fu-010', 'asst-002', 'Follow-up A', 'client_profile', 'open');
        INSERT INTO follow_ups (id, assessment_id, title, source, status)
        VALUES ('fu-011', 'asst-002', 'Follow-up B', 'human_review', 'completed');
        INSERT INTO follow_ups (id, assessment_id, title, source, status)
        VALUES ('fu-012', 'asst-003', 'Other assessment', 'client_profile', 'open');
      `);
    });

    const result = await findFollowUpsByAssessment(db, 'asst-002');

    expect(result).toHaveLength(2);
    expect(result.map((f) => f.id)).toEqual(expect.arrayContaining(['fu-010', 'fu-011']));
  });

  // -----------------------------------------------------------------------
  // Find follow-ups by owner
  // -----------------------------------------------------------------------

  it('finds follow-ups by owner', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-020', 'asst-001', 'Mine', 'client_profile', 'open', 'op-001');
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-021', 'asst-002', 'Theirs', 'client_profile', 'open', 'op-002');
      `);
    });

    const result = await findFollowUpsByOwner(db, 'op-001');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('fu-020');
  });

  // -----------------------------------------------------------------------
  // Update follow-up status
  // -----------------------------------------------------------------------

  it('updates follow-up status and notes', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, notes)
        VALUES ('fu-030', 'asst-001', 'Deferred item', 'client_profile', 'open', 'Original notes');
      `);
    });

    const updated = await updateFollowUpStatus(db, {
      id: 'fu-030',
      status: 'deferred',
      notes: 'Deferred: waiting for client response'
    });

    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('deferred');
    expect(updated!.notes).toBe('Deferred: waiting for client response');
  });

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  it('returns empty array when no follow-ups exist for assessment', async () => {
    const { db } = makeDb();

    const result = await findFollowUpsByAssessment(db, 'asst-999');
    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // DTO shape
  // -----------------------------------------------------------------------

  it('returns DTOs with consistent camelCase shape', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-dto', 'asst-001', 'DTO test', 'client_profile', 'open', 'op-001');
      `);
    });

    const result = await findFollowUpById(db, 'fu-dto');
    expect(result).not.toBeNull();
    expect(Object.keys(result!).every((k) => /^[a-z][a-zA-Z0-9]*$/.test(k))).toBe(true);
    expect(result!).toHaveProperty('assessmentId');
    expect(result!).toHaveProperty('clientVisiblePromise');
    expect(result!).toHaveProperty('ownerId');
    expect(result!).toHaveProperty('linkedReportId');
  });
});
