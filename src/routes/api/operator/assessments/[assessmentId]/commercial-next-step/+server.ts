import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import { requireOperator } from '$lib/server/operator-auth';
import {
  findCommercialNextStepByAssessment,
  upsertCommercialNextStep,
  updateCommercialNextStep
} from '$lib/server/staff-portal/repositories/commercial-next-step.repository';

// ── Schemas ──

const VALID_STATUSES = ['noAction', 'nurture', 'discussOffer', 'sendFollowUp', 'createFutureOpportunity'] as const;

const upsertSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  owner: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional()
}).strict();

// ── Routes ──

export async function GET(event: RequestEvent) {
  const assessmentId = event.params.assessmentId;
  if (!assessmentId) {
    return json({ success: false, error: { code: 'validationFailed', message: 'Assessment ID is required' } }, { status: 400 });
  }

  try {
    await requireOperator(event.locals, event.platform?.env?.assessment_db);
  } catch {
    return json({ success: false, error: { code: 'permissionDenied', message: 'Operator access required' } }, { status: 403 });
  }

  const db = getDb();
  const commercialStep = await findCommercialNextStepByAssessment(db, assessmentId);

  return json({ success: true, commercialStep });
}

export async function PUT(event: RequestEvent) {
  const auth = event.locals.auth();
  const actorId = auth.userId;
  if (!actorId) {
    return json({ success: false, error: { code: 'permissionDenied', message: 'Not authenticated' } }, { status: 401 });
  }

  const assessmentId = event.params.assessmentId;
  if (!assessmentId) {
    return json({ success: false, error: { code: 'validationFailed', message: 'Assessment ID is required' } }, { status: 400 });
  }

  try {
    await requireOperator(event.locals, event.platform?.env?.assessment_db);
  } catch {
    return json({ success: false, error: { code: 'permissionDenied', message: 'Operator access required' } }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await event.request.json();
  } catch {
    return json({ success: false, error: { code: 'validationFailed', message: 'Request body must be valid JSON' } }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(rawBody);
  if (!parsed.success) {
    return json({
      success: false,
      error: { code: 'validationFailed', message: parsed.error.issues.map(i => i.message).join('; ') }
    }, { status: 400 });
  }

  const db = getDb();
  const existing = await findCommercialNextStepByAssessment(db, assessmentId);

  try {
    if (existing) {
      const updated = await updateCommercialNextStep(db, {
        id: existing.id,
        ...parsed.data
      });
      return json({ success: true, commercialStep: updated });
    } else {
      const id = crypto.randomUUID();
      const created = await upsertCommercialNextStep(db, {
        id,
        assessmentId,
        status: parsed.data.status ?? 'noAction',
        owner: parsed.data.owner ?? null,
        notes: parsed.data.notes ?? null
      });
      return json({ success: true, commercialStep: created });
    }
  } catch (err) {
    console.error('Failed to save commercial next step:', err);
    return json({ success: false, error: { code: 'writeFailed', message: 'Failed to save commercial next step' } }, { status: 500 });
  }
}
