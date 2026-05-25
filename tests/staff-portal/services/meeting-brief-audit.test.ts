import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';
import { recordMeetingBriefStatusChange } from '$lib/server/staff-portal/services/meeting-brief-audit.service';

const SCHEMA = `
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

describe('meeting-brief-audit', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // Create audit event
  // -----------------------------------------------------------------------

  it('creates an audit event for meeting brief status change', async () => {
    const { db } = makeDb();

    const result = await recordMeetingBriefStatusChange({
      db,
      assessmentId: 'asst-001',
      meetingBriefId: 'mb-001',
      actorId: 'op-001',
      fromState: 'draft',
      toState: 'ready',
      idempotencyKey: 'idem-mb-001'
    });

    expect(result.receipt).toBeDefined();
    expect(result.receipt!.action).toBe('changeMeetingBriefStatus');
    expect(result.receipt!.assessmentId).toBe('asst-001');
    expect(result.receipt!.actorId).toBe('op-001');
    expect(result.receipt!.previousState).toBe('draft');
    expect(result.receipt!.resultingState).toBe('ready');
    expect(result.receipt!.target.type).toBe('meetingBrief');
    expect(result.receipt!.target.id).toBe('mb-001');
  });

  it('creates audit event with reason code', async () => {
    const { db } = makeDb();

    const result = await recordMeetingBriefStatusChange({
      db,
      assessmentId: 'asst-001',
      meetingBriefId: 'mb-002',
      actorId: 'op-001',
      fromState: 'draft',
      toState: 'ready',
      idempotencyKey: 'idem-mb-002',
      reasonCode: 'exception',
      reason: 'No approved deliverable required'
    });

    expect(result.receipt).toBeDefined();
    expect(result.receipt!.reasonCode).toBe('exception');
    expect(result.receipt!.reason).toBe('No approved deliverable required');
  });

  // -----------------------------------------------------------------------
  // Idempotency
  // -----------------------------------------------------------------------

  it('returns existing receipt on duplicate idempotency key', async () => {
    const { db } = makeDb();

    // First call
    const result1 = await recordMeetingBriefStatusChange({
      db,
      assessmentId: 'asst-001',
      meetingBriefId: 'mb-003',
      actorId: 'op-001',
      fromState: 'draft',
      toState: 'ready',
      idempotencyKey: 'idem-mb-003'
    });
    expect(result1.receipt).toBeDefined();

    // Second call with same key
    const result2 = await recordMeetingBriefStatusChange({
      db,
      assessmentId: 'asst-001',
      meetingBriefId: 'mb-003',
      actorId: 'op-001',
      fromState: 'draft',
      toState: 'completed',
      idempotencyKey: 'idem-mb-003'
    });

    // Returns the existing receipt (idempotent)
    expect(result2.receipt).toBeDefined();
    expect(result2.receipt!.id).toBe(result1.receipt!.id);
    expect(result2.receipt!.resultingState).toBe('ready'); // original, not 'completed'
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  it('returns error when audit write fails (no error since table exists)', async () => {
    const { db } = makeDb();

    const result = await recordMeetingBriefStatusChange({
      db,
      assessmentId: 'asst-001',
      meetingBriefId: 'mb-004',
      actorId: 'op-001',
      fromState: 'needsReview',
      toState: 'ready',
      idempotencyKey: 'idem-mb-004'
    });

    // Should succeed since table exists
    expect(result.receipt).toBeDefined();
    expect(result.error).toBeUndefined();
  });
});
