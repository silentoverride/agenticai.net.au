import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  findStaffActionAuditEventByIdempotency,
  insertStaffActionAuditEvent,
  staffActionReceiptFromEvent
} from '$lib/server/staff-portal/repositories/staff-audit.repository';
import { lookupStaffActionIdempotency } from '$lib/server/staff-portal/repositories/staff-idempotency.repository';
import { createMemoryDb } from '../test-db';

const schemaSql = readFileSync('migrations/0017_staff_portal_action_audit_events.sql', 'utf8');

describe('staff action audit repository', () => {
  it('inserts an event and maps a persisted receipt DTO', async () => {
    const { db } = createMemoryDb(schemaSql);
    const event = await insertStaffActionAuditEvent(db, baseEvent());
    const receipt = staffActionReceiptFromEvent(event);

    expect(event.assessmentId).toBe('assessment-1');
    expect(event.targetType).toBe('gateFinding');
    expect(receipt).toMatchObject({
      id: 'event-1',
      assessmentId: 'assessment-1',
      action: 'claimFinding',
      actorId: 'staffer-1',
      previousState: 'open',
      resultingState: 'inReview',
      auditReference: 'event-1'
    });
  });

  it('looks up events by actor, assessment, and idempotency key scope', async () => {
    const { db } = createMemoryDb(schemaSql);
    await insertStaffActionAuditEvent(db, baseEvent());

    const found = await findStaffActionAuditEventByIdempotency(db, {
      actorId: 'staffer-1',
      assessmentId: 'assessment-1',
      idempotencyKey: 'idem-1'
    });
    const otherActor = await findStaffActionAuditEventByIdempotency(db, {
      actorId: 'staffer-2',
      assessmentId: 'assessment-1',
      idempotencyKey: 'idem-1'
    });

    expect(found?.id).toBe('event-1');
    expect(otherActor).toBeNull();
  });

  it('classifies duplicate same-hash retry and different-hash rejection', async () => {
    const { db } = createMemoryDb(schemaSql);
    await insertStaffActionAuditEvent(db, baseEvent({ requestHash: 'same-hash' }));

    await expect(insertStaffActionAuditEvent(db, baseEvent({ id: 'event-2' }))).rejects.toThrow();
    await expect(lookupStaffActionIdempotency(db, {
      actorId: 'staffer-1', assessmentId: 'assessment-1', idempotencyKey: 'idem-1', requestHash: 'same-hash'
    })).resolves.toMatchObject({ status: 'sameRequest' });
    await expect(lookupStaffActionIdempotency(db, {
      actorId: 'staffer-1', assessmentId: 'assessment-1', idempotencyKey: 'idem-1', requestHash: 'different-hash'
    })).resolves.toMatchObject({ status: 'conflict' });
  });

  it('queries all audit events for an assessment ordered newest first', async () => {
    const { db } = createMemoryDb(schemaSql);
    await insertStaffActionAuditEvent(db, baseEvent({
      id: 'event-1', action: 'claimFinding', fromState: 'open', toState: 'inReview',
      createdAt: '2026-05-25T10:00:00.000Z', idempotencyKey: 'idem-1'
    }));
    await insertStaffActionAuditEvent(db, baseEvent({
      id: 'event-2', action: 'resolveFinding', fromState: 'inReview', toState: 'resolved',
      createdAt: '2026-05-25T11:00:00.000Z', idempotencyKey: 'idem-2',
      reasonCode: 'evidence_sufficient', reason: 'Evidence checks out'
    }));

    const { findAuditEventsByAssessment } = await import('$lib/server/staff-portal/repositories/staff-audit.repository');
    const events = await findAuditEventsByAssessment(db, 'assessment-1');

    expect(events).toHaveLength(2);
    // Newest first
    expect(events[0].id).toBe('event-2');
    expect(events[0].action).toBe('resolveFinding');
    expect(events[0].reasonCode).toBe('evidence_sufficient');
    expect(events[1].id).toBe('event-1');
  });

  it('queries multiple assessments independently', async () => {
    const { db } = createMemoryDb(schemaSql);
    await insertStaffActionAuditEvent(db, baseEvent({ assessmentId: 'a1', id: 'e1', idempotencyKey: 'idem-a1' }));
    await insertStaffActionAuditEvent(db, baseEvent({ assessmentId: 'a2', id: 'e2', idempotencyKey: 'idem-a2' }));

    const { findAuditEventsByAssessment } = await import('$lib/server/staff-portal/repositories/staff-audit.repository');
    const a1Events = await findAuditEventsByAssessment(db, 'a1');
    expect(a1Events).toHaveLength(1);
    expect(a1Events[0].assessmentId).toBe('a1');

    const a2Events = await findAuditEventsByAssessment(db, 'a2');
    expect(a2Events).toHaveLength(1);
    expect(a2Events[0].assessmentId).toBe('a2');
  });
});

function baseEvent(overrides: Partial<Parameters<typeof insertStaffActionAuditEvent>[1]> = {}): Parameters<typeof insertStaffActionAuditEvent>[1] {
  return {
    id: 'event-1',
    assessmentId: 'assessment-1',
    targetType: 'gateFinding',
    targetId: 'gate-1',
    actorId: 'staffer-1',
    action: 'claimFinding',
    fromState: 'open',
    toState: 'inReview',
    reasonCode: null,
    reason: null,
    requestHash: 'hash-1',
    idempotencyKey: 'idem-1',
    metadataJson: null,
    createdAt: '2026-05-25T00:00:00.000Z',
    ...overrides
  };
}
