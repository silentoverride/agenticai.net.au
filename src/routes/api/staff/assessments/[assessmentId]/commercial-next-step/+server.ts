import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import {
  findCommercialNextStepByAssessment,
  upsertCommercialNextStep,
  updateCommercialNextStep
} from '$lib/server/staff-portal/repositories/commercial-next-step.repository';
import { validateFollowupContinuity } from '$lib/server/staff-portal/services/commercial-followup-requirement.service';
import {
  recordCommercialNextStepChange,
  requiresConfirmation
} from '$lib/server/staff-portal/services/commercial-audit.service';
import type { CommercialNextStepStatus, StaffActionReceiptDto } from '$lib/staff-portal/dto';

// ── Schemas ──

const VALID_STATUSES = ['noAction', 'nurture', 'discussOffer', 'sendFollowUp', 'createFutureOpportunity'] as const;

const upsertSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  owner: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  followUpNote: z.string().max(2000).nullable().optional(),
  confirmedNoFollowUp: z.boolean().optional(),
  idempotencyKey: z.string().max(100).optional()
}).strict();

// ── Routes ──

export async function GET(event: RequestEvent) {
  const assessmentId = event.params.assessmentId;
  if (!assessmentId) {
    return json({ success: false, error: { code: 'validationFailed', message: 'Assessment ID is required' } }, { status: 400 });
  }

  try {
    await requireStaff(event.locals, event.platform?.env?.assessment_db);
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
    await requireStaff(event.locals, event.platform?.env?.assessment_db);
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

  const body = parsed.data;

  // ── Follow-up continuity validation for high-intent statuses ──
  if (body.status) {
    const validationError = validateFollowupContinuity(
      body.status as CommercialNextStepStatus,
      body.followUpNote,
      body.confirmedNoFollowUp
    );
    if (validationError) {
      return json({
        success: false,
        error: { code: 'validationFailed', message: validationError },
        requiresFollowUp: true,
        currentStatus: body.status
      }, { status: 400 });
    }
  }

  const db = getDb();
  const existing = await findCommercialNextStepByAssessment(db, assessmentId);

  try {
    if (existing) {
      const previousStatus = existing.status;
      const previousOwner = existing.owner;

      const updated = await updateCommercialNextStep(db, {
        id: existing.id,
        ...(body.status ? { status: body.status as CommercialNextStepStatus } : {}),
        ...(body.owner !== undefined ? { owner: body.owner } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {})
      });

      // Record audit event if status or owner changed
      const newStatus = body.status ?? previousStatus;
      const newOwner = body.owner !== undefined ? body.owner : previousOwner;
      const needsAudit = body.status !== undefined || body.owner !== undefined;
      let receipt: StaffActionReceiptDto | null = null;

      if (needsAudit) {
        receipt = await recordCommercialNextStepChange(db, {
          assessmentId,
          commercialStepId: existing.id,
          actorId,
          previousStatus: previousStatus as CommercialNextStepStatus,
          newStatus: newStatus as CommercialNextStepStatus,
          previousOwner,
          newOwner,
          idempotencyKey: body.idempotencyKey ?? `commercial:${existing.id}:${Date.now()}`,
          reason: body.followUpNote ?? null
        });
      }

      // Determine if confirmation is needed
      const confirmRequired = requiresConfirmation(
        previousStatus as CommercialNextStepStatus,
        newStatus as CommercialNextStepStatus,
        previousOwner,
        newOwner
      );

      return json({ success: true, commercialStep: updated, receipt, confirmRequired });
    } else {
      const id = crypto.randomUUID();
      const created = await upsertCommercialNextStep(db, {
        id,
        assessmentId,
        status: (body.status ?? 'noAction') as CommercialNextStepStatus,
        owner: body.owner ?? null,
        notes: body.notes ?? null
      });

      // Record audit event for creation
      const receipt = await recordCommercialNextStepChange(db, {
        assessmentId,
        commercialStepId: id,
        actorId,
        previousStatus: 'noAction' as CommercialNextStepStatus,
        newStatus: (body.status ?? 'noAction') as CommercialNextStepStatus,
        previousOwner: null,
        newOwner: body.owner ?? null,
        idempotencyKey: body.idempotencyKey ?? `commercial:${id}:${Date.now()}`,
        reason: body.followUpNote ?? null
      });

      return json({ success: true, commercialStep: created, receipt, confirmRequired: false });
    }
  } catch (err) {
    console.error('Failed to save commercial next step:', err);
    return json({ success: false, error: { code: 'writeFailed', message: 'Failed to save commercial next step' } }, { status: 500 });
  }
}
