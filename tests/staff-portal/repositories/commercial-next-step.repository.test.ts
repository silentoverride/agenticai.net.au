import { describe, expect, it, beforeEach } from 'vitest';
import { createMemoryDb } from '../test-db';
import {
  findCommercialNextStepByAssessment,
  upsertCommercialNextStep,
  updateCommercialNextStep
} from '$lib/server/staff-portal/repositories/commercial-next-step.repository';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS commercial_next_steps (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'noAction',
    owner TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

describe('commercial-next-step repository', () => {
  function makeDb() {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    return { db, sqlite };
  }

  let fixtures: ReturnType<typeof makeDb>;

  beforeEach(() => {
    fixtures = makeDb();
  });

  const ASSESSMENT_ID = 'asst-com-001';

  it('returns null when no record exists', async () => {
    const result = await findCommercialNextStepByAssessment(fixtures.db, ASSESSMENT_ID);
    expect(result).toBeNull();
  });

  it('inserts and retrieves a commercial next step', async () => {
    const id = crypto.randomUUID();
    const created = await upsertCommercialNextStep(fixtures.db, {
      id,
      assessmentId: ASSESSMENT_ID,
      status: 'nurture',
      owner: 'Sarah (operator)',
      notes: 'Keep in touch monthly'
    });

    expect(created.id).toBe(id);
    expect(created.assessmentId).toBe(ASSESSMENT_ID);
    expect(created.status).toBe('nurture');
    expect(created.owner).toBe('Sarah (operator)');
    expect(created.notes).toBe('Keep in touch monthly');

    const found = await findCommercialNextStepByAssessment(fixtures.db, ASSESSMENT_ID);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(id);
  });

  it('upserts — updates existing record on conflict', async () => {
    const id = crypto.randomUUID();
    await upsertCommercialNextStep(fixtures.db, {
      id,
      assessmentId: ASSESSMENT_ID,
      status: 'noAction',
      owner: null,
      notes: 'Initial'
    });

    // Upsert with same ID — should update
    await upsertCommercialNextStep(fixtures.db, {
      id,
      assessmentId: ASSESSMENT_ID,
      status: 'discussOffer',
      owner: 'Bob',
      notes: 'Updated plan'
    });

    const found = await findCommercialNextStepByAssessment(fixtures.db, ASSESSMENT_ID);
    expect(found!.status).toBe('discussOffer');
    expect(found!.owner).toBe('Bob');
    expect(found!.notes).toBe('Updated plan');
  });

  it('updates individual fields with updateCommercialNextStep', async () => {
    const id = crypto.randomUUID();
    await upsertCommercialNextStep(fixtures.db, {
      id,
      assessmentId: ASSESSMENT_ID,
      status: 'noAction',
      owner: 'Alice',
      notes: 'Initial notes'
    });

    const updated = await updateCommercialNextStep(fixtures.db, {
      id,
      status: 'sendFollowUp',
      notes: 'Send proposal by Friday'
    });

    expect(updated!.status).toBe('sendFollowUp');
    expect(updated!.owner).toBe('Alice'); // unchanged
    expect(updated!.notes).toBe('Send proposal by Friday');
  });

  it('returns null when updating non-existent record', async () => {
    const result = await updateCommercialNextStep(fixtures.db, {
      id: 'nonexistent',
      status: 'nurture'
    });
    expect(result).toBeNull();
  });

  it('sets displayState based on status and staleness', async () => {
    const id = crypto.randomUUID();
    const created = await upsertCommercialNextStep(fixtures.db, {
      id,
      assessmentId: ASSESSMENT_ID,
      status: 'nurture',
      owner: null,
      notes: null
    });

    expect(created.displayState).toBe('active');
  });

  it('maps all statuses to correct display states', async () => {
    const cases: Array<{ status: string; expectedDisplay: string }> = [
      { status: 'noAction', expectedDisplay: 'draft' },
      { status: 'nurture', expectedDisplay: 'active' },
      { status: 'discussOffer', expectedDisplay: 'active' },
      { status: 'sendFollowUp', expectedDisplay: 'needsFollowUp' },
      { status: 'createFutureOpportunity', expectedDisplay: 'deferred' }
    ];

    for (const { status, expectedDisplay } of cases) {
      const id = crypto.randomUUID();
      const step = await upsertCommercialNextStep(fixtures.db, {
        id,
        assessmentId: `asst-${status}`,
        status: status as any,
        owner: null,
        notes: null
      });
      expect(step.displayState).toBe(expectedDisplay);
    }
  });
});
