import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { commitStaffAction, type CommitStaffActionInput } from '$lib/server/staff-portal/services/commit-staff-action';
import { mapGateFindingState } from '$lib/server/staff-portal/mappers/gate-finding-state';
import { createMemoryDb } from '../test-db';
import type { AsyncDb, DbResult } from '$lib/server/db';

const schemaSql = `
  CREATE TABLE users (clerk_id TEXT PRIMARY KEY, role TEXT);
  ${readFileSync('migrations/0017_staff_portal_action_audit_events.sql', 'utf8')}
`;

describe('commitStaffAction', () => {
  it('rejects missing actor authentication', async () => {
    const { db } = seededDb();
    const result = await commitStaffAction({ ...baseInput(db), actorId: null });
    expect(result).toMatchObject({ success: false, error: { code: 'permissionDenied' } });
  });

  it('rejects actors without a Staff Portal role', async () => {
    const { db, sqlite } = seededDb();
    sqlite.prepare('UPDATE users SET role = ? WHERE clerk_id = ?').run('client', 'operator-1');
    const result = await commitStaffAction(baseInput(db));
    expect(result).toMatchObject({ success: false, error: { code: 'permissionDenied' } });
  });

  it('denies operators assigned to a different reviewer', async () => {
    const { db } = seededDb();
    const result = await commitStaffAction(baseInput(db, {
      loadCurrentTarget: async () => ({
        targetType: 'gateFinding',
        state: mapGateFindingState({}),
        assignedOperatorId: 'operator-2'
      })
    }));
    expect(result).toMatchObject({ success: false, error: { code: 'permissionDenied', currentState: 'open' } });
  });

  it('returns staleState when expected state no longer matches', async () => {
    const { db } = seededDb();
    const result = await commitStaffAction(baseInput(db, { expectedState: 'resolved' }));
    expect(result).toMatchObject({ success: false, error: { code: 'staleState', currentState: 'open' } });
  });

  it('returns staleState when expected version is out of date', async () => {
    const { db } = seededDb();
    const result = await commitStaffAction(baseInput(db, { expectedVersion: 'old-version' }));
    expect(result).toMatchObject({ success: false, error: { code: 'staleState', currentState: 'open' } });
  });

  it('rejects disabled actions without writing an audit event', async () => {
    const { db } = seededDb();
    const result = await commitStaffAction(baseInput(db, {
      action: 'resolveFinding',
      expectedState: 'resolved',
      reasonCode: 'done',
      reason: 'Already resolved',
      loadCurrentTarget: async () => ({
        targetType: 'gateFinding',
        state: mapGateFindingState({ humanAssistStatus: 'approved', approvalEvidence: true })
      })
    }));
    expect(result).toMatchObject({ success: false, error: { code: 'blockedAction' } });
    await expect(countEvents(db)).resolves.toBe(0);
  });

  it('rejects missing gate findings without creating an audit event', async () => {
    const { db } = seededDb();
    const input = baseInput(db);
    delete input.loadCurrentTarget;

    const result = await commitStaffAction(input);

    expect(result).toMatchObject({ success: false, error: { code: 'blockedAction', currentState: 'open' } });
    await expect(countEvents(db)).resolves.toBe(0);
  });

  it('validates required audit metadata before persistence', async () => {
    const { db } = seededDb();
    const result = await commitStaffAction(baseInput(db, { action: 'resolveFinding' }));
    expect(result).toMatchObject({ success: false, error: { code: 'validationFailed' } });
    await expect(countEvents(db)).resolves.toBe(0);
  });

  it('creates an audit event and renders the receipt from persisted data', async () => {
    const { db } = seededDb();
    const result = await commitStaffAction(baseInput(db));
    expect(result).toMatchObject({
      success: true,
      state: 'inReview',
      receipt: {
        id: 'event-1',
        assessmentId: 'assessment-1',
        action: 'claimFinding',
        previousState: 'open',
        resultingState: 'inReview',
        auditReference: 'event-1'
      }
    });
    await expect(countEvents(db)).resolves.toBe(1);
  });

  it('returns the same persisted receipt for a same-key same-request retry', async () => {
    const { db } = seededDb();
    const input = baseInput(db);
    const first = await commitStaffAction(input);
    const retry = await commitStaffAction(input);

    expect(first.success).toBe(true);
    expect(retry).toEqual(first);
    await expect(countEvents(db)).resolves.toBe(1);
  });

  it('rejects same-key different-request retry without mutating state', async () => {
    const { db } = seededDb();
    await commitStaffAction(baseInput(db));
    const conflict = await commitStaffAction(baseInput(db, { targetId: 'gate-2' }));

    expect(conflict).toMatchObject({ success: false, error: { code: 'duplicateAction' } });
    await expect(countEvents(db)).resolves.toBe(1);
  });

  it('returns auditWriteFailed when audit insertion fails', async () => {
    const failingDb = failingAuditDb();
    const result = await commitStaffAction(baseInput(failingDb));
    expect(result).toMatchObject({ success: false, error: { code: 'auditWriteFailed', currentState: 'open' } });
  });

  it('rejects overrideFinding when reason code and note are missing', async () => {
    const { db } = seededDb();
    // overrideFinding requires reasonCode and reason — without them it should fail validation
    const result = await commitStaffAction(baseInput(db, {
      action: 'overrideFinding',
      targetId: 'gate-2'
    }));
    expect(result).toMatchObject({ success: false, error: { code: 'validationFailed' } });
    await expect(countEvents(db)).resolves.toBe(0);
  });

  it('accepts overrideFinding when all required metadata is provided', async () => {
    const { db } = seededDb();
    const result = await commitStaffAction(baseInput(db, {
      action: 'overrideFinding',
      targetId: 'gate-2',
      idempotencyKey: 'idem-override-1',
      idFactory: () => 'event-override-1',
      reasonCode: 'evidence_sufficient',
      reason: 'Supporting evidence confirms the finding is a false positive.'
    }));
    expect(result).toMatchObject({
      success: true,
      state: 'overriddenWithReason',
      receipt: {
        id: 'event-override-1',
        action: 'overrideFinding',
        previousState: 'open'
      }
    });
    await expect(countEvents(db)).resolves.toBe(1);
  });

  it('accepts requestClarification as a report-level action', async () => {
    const { db } = seededDb();
    const result = await commitStaffAction(baseInput(db, {
      action: 'requestClarification',
      targetType: 'report',
      targetId: null,
      reasonCode: 'evidence_sufficient',
      reason: 'Need more info',
      idempotencyKey: 'idem-clarify-1',
      expectedState: 'generated',
      loadCurrentTarget: async () => ({
        targetType: 'report',
        state: {
          state: 'generated',
          humanReviewState: 'none',
          approved: false,
          canDeliver: false,
          artifactPresent: true,
          risk: 'none',
          blockedReasons: [],
          staleReasons: []
        },
        version: 'v1',
        assignedOperatorId: null
      })
    }));

    expect(result).toMatchObject({ success: true, state: 'clarificationRequired' });
  });

  it('returns auditWriteFailed when audit insertion fails for a report-level action', async () => {
    const db = failingAuditDb();
    const result = await commitStaffAction({
      db,
      action: 'rejectReport',
      targetType: 'report',
      targetId: null,
      assessmentId: 'a1',
      actorId: 'op-1',
      role: 'operator',
      assignedOperatorId: null,
      sharedQueue: false,
      reasonCode: 'evidence_sufficient',
      reason: 'Report contains errors',
      idempotencyKey: 'idem-reject-1',
      expectedState: 'generated',
      now: () => new Date('2026-05-25T00:00:00.000Z'),
      idFactory: () => 'event-2',
      loadCurrentTarget: async () => ({
        targetType: 'report',
        state: {
          state: 'generated',
          humanReviewState: 'none',
          approved: false,
          canDeliver: false,
          artifactPresent: true,
          risk: 'none',
          blockedReasons: [],
          staleReasons: []
        },
        version: 'v1',
        assignedOperatorId: null
      })
    });

    expect(result).toMatchObject({ success: false, error: { code: 'auditWriteFailed' } });
  });
});

function seededDb() {
  const memory = createMemoryDb(schemaSql);
  memory.sqlite.prepare('INSERT INTO users (clerk_id, role) VALUES (?, ?)').run('operator-1', 'operator');
  return memory;
}

function baseInput(db: AsyncDb, overrides: Partial<CommitStaffActionInput> = {}): CommitStaffActionInput {
  return {
    db,
    actorId: 'operator-1',
    assessmentId: 'assessment-1',
    action: 'claimFinding',
    targetType: 'gateFinding',
    targetId: 'gate-1',
    idempotencyKey: 'idem-1',
    expectedState: 'open',
    now: () => new Date('2026-05-25T00:00:00.000Z'),
    idFactory: () => 'event-1',
    loadCurrentTarget: async () => ({
      targetType: 'gateFinding',
      state: mapGateFindingState({}),
      version: 'current-version',
      assignedOperatorId: 'operator-1'
    }),
    ...overrides
  };
}

async function countEvents(db: AsyncDb): Promise<number> {
  const row = await db.queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM staff_action_audit_events');
  return row?.count ?? 0;
}

function failingAuditDb(): AsyncDb {
  return {
    async queryOne<T = Record<string, unknown>>(sql: string): Promise<T | null> {
      if (sql.includes('FROM users')) return { role: 'operator' } as T;
      return null;
    },
    async queryAll<T = Record<string, unknown>>(): Promise<T[]> { return []; },
    async exec(): Promise<DbResult> { throw new Error('audit write failed'); },
    raw() { return { run: async () => undefined }; }
  };
}
