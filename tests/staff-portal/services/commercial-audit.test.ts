import { describe, expect, it, beforeEach } from 'vitest';
import { createMemoryDb } from '../test-db';
import {
  recordCommercialNextStepChange,
  requiresConfirmation
} from '$lib/server/staff-portal/services/commercial-audit.service';

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
    request_hash TEXT NOT NULL DEFAULT '',
    idempotency_key TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL
  );
`;

describe('commercial-audit service', () => {
  function makeDb() {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    return { db, sqlite };
  }

  let fixtures: ReturnType<typeof makeDb>;

  beforeEach(() => {
    fixtures = makeDb();
  });

  const ASSESSMENT_ID = 'asst-audit-001';
  const COMMERCIAL_ID = 'com-step-001';
  const ACTOR_ID = 'staffer-sarah';

  describe('recordCommercialNextStepChange', () => {
    it('records an audit event on status change', async () => {
      const receipt = await recordCommercialNextStepChange(fixtures.db, {
        assessmentId: ASSESSMENT_ID,
        commercialStepId: COMMERCIAL_ID,
        actorId: ACTOR_ID,
        previousStatus: 'noAction',
        newStatus: 'discussOffer',
        previousOwner: null,
        newOwner: 'Sarah',
        idempotencyKey: 'commercial:asst-audit-001:1'
      });

      expect(receipt.action).toBe('changeCommercialStep');
      expect(receipt.target.type).toBe('commercialNextStep');
      expect(receipt.target.id).toBe(COMMERCIAL_ID);
      expect(receipt.actorId).toBe(ACTOR_ID);
      expect(receipt.previousState).toContain('noAction');
      expect(receipt.resultingState).toContain('discussOffer');
    });

    it('records an audit event on owner change only', async () => {
      const receipt = await recordCommercialNextStepChange(fixtures.db, {
        assessmentId: ASSESSMENT_ID,
        commercialStepId: COMMERCIAL_ID,
        actorId: ACTOR_ID,
        previousStatus: 'nurture',
        newStatus: 'nurture',
        previousOwner: 'Alice',
        newOwner: 'Bob',
        idempotencyKey: 'commercial:asst-audit-001:2'
      });

      expect(receipt.resultingState).toContain('owner:Bob');
      expect(receipt.resultingState).toContain('nurture');
      expect(receipt.reasonCode).toBe('owner_change');
    });

    it('returns existing receipt on idempotent call', async () => {
      const first = await recordCommercialNextStepChange(fixtures.db, {
        assessmentId: ASSESSMENT_ID,
        commercialStepId: COMMERCIAL_ID,
        actorId: ACTOR_ID,
        previousStatus: 'noAction',
        newStatus: 'discussOffer',
        previousOwner: null,
        newOwner: 'Sarah',
        idempotencyKey: 'commercial:asst-audit-001:dup'
      });

      const second = await recordCommercialNextStepChange(fixtures.db, {
        assessmentId: ASSESSMENT_ID,
        commercialStepId: COMMERCIAL_ID,
        actorId: ACTOR_ID,
        previousStatus: 'noAction',
        newStatus: 'discussOffer',
        previousOwner: null,
        newOwner: 'Sarah',
        idempotencyKey: 'commercial:asst-audit-001:dup'
      });

      expect(second.id).toBe(first.id);
    });

    it('records high-intent status change correctly', async () => {
      const receipt = await recordCommercialNextStepChange(fixtures.db, {
        assessmentId: ASSESSMENT_ID,
        commercialStepId: COMMERCIAL_ID,
        actorId: ACTOR_ID,
        previousStatus: 'discussOffer',
        newStatus: 'sendFollowUp',
        previousOwner: 'Sarah',
        newOwner: 'Sarah',
        idempotencyKey: 'commercial:asst-audit-001:3'
      });

      expect(receipt.action).toBe('changeCommercialStep');
      expect(receipt.reasonCode).toBe('status_change');
    });

    it('includes reason when provided', async () => {
      const receipt = await recordCommercialNextStepChange(fixtures.db, {
        assessmentId: ASSESSMENT_ID,
        commercialStepId: COMMERCIAL_ID,
        actorId: ACTOR_ID,
        previousStatus: 'sendFollowUp',
        newStatus: 'noAction',
        previousOwner: 'Sarah',
        newOwner: 'Sarah',
        idempotencyKey: 'commercial:asst-audit-001:4',
        reason: 'Client declined, closing loop'
      });

      expect(receipt.reason).toBe('Client declined, closing loop');
    });
  });

  describe('requiresConfirmation', () => {
    it('returns true when dropping from high-intent to noAction', () => {
      expect(requiresConfirmation('discussOffer', 'noAction', 'Sarah', 'Sarah')).toBe(true);
      expect(requiresConfirmation('sendFollowUp', 'noAction', 'Bob', 'Bob')).toBe(true);
    });

    it('returns true when changing owner on high-intent status', () => {
      expect(requiresConfirmation('discussOffer', 'discussOffer', 'Sarah', 'Bob')).toBe(true);
      expect(requiresConfirmation('sendFollowUp', 'sendFollowUp', 'Alice', 'Charlie')).toBe(true);
    });

    it('returns false for low-intent status transitions', () => {
      expect(requiresConfirmation('noAction', 'nurture', null, 'Sarah')).toBe(false);
      expect(requiresConfirmation('nurture', 'createFutureOpportunity', 'Sarah', 'Sarah')).toBe(false);
    });

    it('returns false when owner stays the same on high-intent status', () => {
      expect(requiresConfirmation('discussOffer', 'sendFollowUp', 'Sarah', 'Sarah')).toBe(false);
    });

    it('returns false when status stays the same and owner is unchanged', () => {
      expect(requiresConfirmation('nurture', 'nurture', 'Sarah', 'Sarah')).toBe(false);
    });
  });
});
