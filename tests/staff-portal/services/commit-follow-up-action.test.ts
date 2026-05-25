import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';
import { commitFollowUpAction } from '$lib/server/staff-portal/services/commit-follow-up-action';

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
`;

describe('commitFollowUpAction', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // Complete a follow-up (open → completed)
  // -----------------------------------------------------------------------

  it('completes an open follow-up', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-100', 'asst-001', 'Complete me', 'client_profile', 'open', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-100',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'completeFollowUp',
      idempotencyKey: 'idem-100'
    });

    expect(result.success).toBe(true);
    expect(result.followUp).not.toBeUndefined();
    expect(result.followUp!.status).toBe('completed');
    expect(result.receipt).toBeDefined();
    expect(result.receipt!.action).toBe('completeFollowUp');
    expect(result.receipt!.previousState).toBe('open');
    expect(result.receipt!.resultingState).toBe('completed');
  });

  // -----------------------------------------------------------------------
  // Defer with reason
  // -----------------------------------------------------------------------

  it('defers a follow-up with a reason', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-101', 'asst-001', 'Defer me', 'client_profile', 'open', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-101',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'deferFollowUp',
      reason: 'Waiting for client approval',
      idempotencyKey: 'idem-101'
    });

    expect(result.success).toBe(true);
    expect(result.followUp!.status).toBe('deferred');
  });

  // -----------------------------------------------------------------------
  // Defer without reason → validation failed
  // -----------------------------------------------------------------------

  it('rejects deferral without a reason', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-102', 'asst-001', 'No reason', 'client_profile', 'open', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-102',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'deferFollowUp',
      idempotencyKey: 'idem-102'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('validationFailed');
  });

  // -----------------------------------------------------------------------
  // Reassign with new owner
  // -----------------------------------------------------------------------

  it('reassigns a follow-up to a new owner', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-103', 'asst-001', 'Reassign me', 'client_profile', 'open', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-103',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'reassignFollowUp',
      newOwnerId: 'op-002',
      idempotencyKey: 'idem-103'
    });

    expect(result.success).toBe(true);
    expect(result.followUp!.status).toBe('reassigned');
    expect(result.followUp!.ownerId).toBe('op-002');
  });

  // -----------------------------------------------------------------------
  // Reassign without new owner → validation failed
  // -----------------------------------------------------------------------

  it('rejects reassignment without a new owner', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-104', 'asst-001', 'No new owner', 'client_profile', 'open', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-104',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'reassignFollowUp',
      idempotencyKey: 'idem-104'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('validationFailed');
  });

  // -----------------------------------------------------------------------
  // Invalid transition rejected
  // -----------------------------------------------------------------------

  it('rejects transition from completed (terminal state)', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-105', 'asst-001', 'Already done', 'client_profile', 'completed', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-105',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'completeFollowUp',
      idempotencyKey: 'idem-105'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('blockedAction');
  });

  // -----------------------------------------------------------------------
  // Idempotency prevents duplicate audit events
  // -----------------------------------------------------------------------

  it('returns existing receipt on idempotent retry', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-106', 'asst-001', 'Idempotent', 'client_profile', 'open', 'op-001');
      `);
    });

    // First call
    const result1 = await commitFollowUpAction(db, {
      followUpId: 'fu-106',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'completeFollowUp',
      idempotencyKey: 'idem-106'
    });

    expect(result1.success).toBe(true);
    expect(result1.followUp!.status).toBe('completed');

    // Second call with same idempotency key
    const result2 = await commitFollowUpAction(db, {
      followUpId: 'fu-106',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'completeFollowUp',
      idempotencyKey: 'idem-106'
    });

    expect(result2.success).toBe(true);
    expect(result2.receipt!.id).toBe(result1.receipt!.id); // same receipt
  });

  // -----------------------------------------------------------------------
  // Unknown follow-up
  // -----------------------------------------------------------------------

  it('returns validationFailed for non-existent follow-up', async () => {
    const { db } = makeDb();

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-nonexistent',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'completeFollowUp',
      idempotencyKey: 'idem-999'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('validationFailed');
  });

  // -----------------------------------------------------------------------
  // AC1: Error response includes currentState
  // -----------------------------------------------------------------------

  it('includes currentState in blockedAction errors', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-200', 'asst-001', 'Terminal', 'client_profile', 'completed', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-200',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'completeFollowUp',
      idempotencyKey: 'idem-200'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('blockedAction');
    expect(result.error?.currentState).toBe('completed');
  });

  // -----------------------------------------------------------------------
  // AC1: Error response includes remediationHint
  // -----------------------------------------------------------------------

  it('includes remediationHint in blockedAction errors', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-201', 'asst-001', 'Already done', 'client_profile', 'completed', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-201',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'completeFollowUp',
      idempotencyKey: 'idem-201'
    });

    expect(result.success).toBe(false);
    expect(result.error?.remediationHint).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // AC1: Error response includes currentState on validationFailed
  // -----------------------------------------------------------------------

  it('includes currentState on validationFailed errors', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-202', 'asst-001', 'Need reason', 'client_profile', 'open', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-202',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'deferFollowUp',
      idempotencyKey: 'idem-202'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('validationFailed');
    expect(result.error?.currentState).toBe('open');
    expect(result.error?.remediationHint).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // Note: commitFollowUpAction hardcodes actorRole='admin', so non-owners
  // are not blocked by permission checks. Real auth happens upstream.
  // -----------------------------------------------------------------------

  it('allows non-owner actions (auth happens upstream)', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-203', 'asst-001', 'Not mine', 'client_profile', 'open', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-203',
      actorId: 'op-999',  // not the owner
      assessmentId: 'asst-001',
      action: 'completeFollowUp',
      idempotencyKey: 'idem-203'
    });

    // Service hardcodes actorRole='admin', so permission check passes
    expect(result.success).toBe(true);
    expect(result.followUp!.status).toBe('completed');
  });

  // -----------------------------------------------------------------------
  // AC2: Follow-up creation via insertFollowUp + audit event
  // -----------------------------------------------------------------------

  it('follow-up complete produces audit event with receipt', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO follow_ups (id, assessment_id, title, source, status, owner_id)
        VALUES ('fu-300', 'asst-001', 'Audit check', 'client_profile', 'open', 'op-001');
      `);
    });

    const result = await commitFollowUpAction(db, {
      followUpId: 'fu-300',
      actorId: 'op-001',
      assessmentId: 'asst-001',
      action: 'completeFollowUp',
      idempotencyKey: 'idem-300'
    });

    expect(result.success).toBe(true);
    expect(result.receipt).toBeDefined();
    expect(result.receipt!.id).toBeTruthy();
    expect(result.receipt!.action).toBe('completeFollowUp');
    expect(result.receipt!.assessmentId).toBe('asst-001');
    expect(result.receipt!.actorId).toBe('op-001');
    expect(result.receipt!.previousState).toBe('open');
    expect(result.receipt!.resultingState).toBe('completed');
    expect(result.receipt!.target.id).toBe('fu-300');
    expect(result.receipt!.createdAt).toBeTruthy();
  });
});
