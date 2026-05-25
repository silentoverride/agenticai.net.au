import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createMemoryDb } from '../test-db';
import type { StaffFollowUpDto, FollowUpSource } from '$lib/staff-portal/dto';

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

  CREATE INDEX IF NOT EXISTS idx_follow_ups_assessment_id ON follow_ups(assessment_id);
`;

describe('Follow-ups API route integration', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // POST: Create a follow-up via API
  // -----------------------------------------------------------------------

  it('GET returns follow-ups for an assessment', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id, due_date)
        VALUES ('fu-api-001', 'asst-fu-api', 'API test', 'client_profile', 'open', 'op-001', '2026-06-15');
        INSERT INTO follow_ups (id, assessment_id, title, source, status)
        VALUES ('fu-api-002', 'asst-fu-api', 'API test 2', 'human_review', 'completed');
      `);
    });

    // We can't easily hit the actual HTTP route in vitest,
    // so we test the underlying functions

    const { findFollowUpsByAssessment } = await import('$lib/server/staff-portal/repositories/follow-up.repository');
    const items = await findFollowUpsByAssessment(db, 'asst-fu-api');

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.id)).toEqual(expect.arrayContaining(['fu-api-001', 'fu-api-002']));
    expect(items.every((i) => i.assessmentId === 'asst-fu-api')).toBe(true);
  });

  // -----------------------------------------------------------------------
  // PUT: Update follow-up status via underlying service
  // -----------------------------------------------------------------------

  it('completes a follow-up via commitFollowUpAction', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-api-003', 'asst-fu-api', 'Complete me', 'client_profile', 'open', 'op-001');
      `);
    });

    const { commitFollowUpAction } = await import('$lib/server/staff-portal/services/commit-follow-up-action');
    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-api-003',
      actorId: 'op-001',
      assessmentId: 'asst-fu-api',
      action: 'completeFollowUp',
      idempotencyKey: 'api-idem-001'
    });

    expect(result.success).toBe(true);
    expect(result.followUp!.status).toBe('completed');
    expect(result.receipt!.action).toBe('completeFollowUp');
  });

  // -----------------------------------------------------------------------
  // PUT: Invalid action returns error
  // -----------------------------------------------------------------------

  it('rejects invalid action on completed follow-up', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status)
        VALUES ('fu-api-004', 'asst-fu-api', 'Already done', 'client_profile', 'completed');
      `);
    });

    const { commitFollowUpAction } = await import('$lib/server/staff-portal/services/commit-follow-up-action');
    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-api-004',
      actorId: 'op-001',
      assessmentId: 'asst-fu-api',
      action: 'completeFollowUp',
      idempotencyKey: 'api-idem-002'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('blockedAction');
  });

  // -----------------------------------------------------------------------
  // GET: Empty state
  // -----------------------------------------------------------------------

  it('GET returns empty list for assessment with no follow-ups', async () => {
    const { db } = makeDb();

    const { findFollowUpsByAssessment } = await import('$lib/server/staff-portal/repositories/follow-up.repository');
    const items = await findFollowUpsByAssessment(db, 'asst-empty');

    expect(items).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // DTO shape consistency
  // -----------------------------------------------------------------------

  it('DTOs have consistent camelCase shape from API', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id, due_date, client_visible_promise, consequence_of_inaction, notes, linked_report_id)
        VALUES ('fu-api-dto', 'asst-fu-api', 'DTO check', 'client_profile', 'open', 'op-001', '2026-07-01', 1, 'Client will miss deadline', 'Some notes', 'rpt-001');
      `);
    });

    const { findFollowUpById } = await import('$lib/server/staff-portal/repositories/follow-up.repository');
    const result = await findFollowUpById(db, 'fu-api-dto');
    expect(result).not.toBeNull();

    // Check camelCase keys
    const keys = Object.keys(result!);
    expect(keys).toContain('assessmentId');
    expect(keys).toContain('clientVisiblePromise');
    expect(keys).toContain('consequenceOfInaction');
    expect(keys).toContain('linkedReportId');
    expect(keys).toContain('createdAt');
    expect(keys).toContain('updatedAt');
    expect(keys).not.toContain('assessment_id');
    expect(keys).not.toContain('client_visible_promise');

    // Check values
    expect(result!.title).toBe('DTO check');
    expect(result!.ownerId).toBe('op-001');
    expect(result!.dueDate).toBe('2026-07-01');
    expect(result!.clientVisiblePromise).toBe(true);
    expect(result!.consequenceOfInaction).toBe('Client will miss deadline');
    expect(result!.notes).toBe('Some notes');
    expect(result!.linkedReportId).toBe('rpt-001');
  });
});
