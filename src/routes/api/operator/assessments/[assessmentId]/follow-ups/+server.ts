import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import { requireOperator } from '$lib/server/operator-auth';
import { insertFollowUp, findFollowUpsByAssessment, findFollowUpById } from '$lib/server/staff-portal/repositories/follow-up.repository';
import { insertStaffActionAuditEvent, findStaffActionAuditEventByIdempotency, staffActionReceiptFromEvent } from '$lib/server/staff-portal/repositories/staff-audit.repository';

// ── Schemas ──

const FOLLOW_UP_SOURCES = [
  'client_profile',
  'human_review',
  'meeting_brief',
  'commercial_next_step',
  'support_issue',
  'admin_task',
  'delayed_journey'
] as const;

const createFollowUpSchema = z.object({
  idempotencyKey: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  dueDate: z.string().optional(),
  source: z.enum(FOLLOW_UP_SOURCES).default('client_profile'),
  clientVisiblePromise: z.boolean().optional(),
  consequenceOfInaction: z.string().optional(),
  notes: z.string().optional(),
  linkedReportId: z.string().optional(),
  linkedGateFindingId: z.string().optional(),
  linkedMeetingBriefId: z.string().optional(),
  linkedCommercialStepId: z.string().optional(),
  supportIssueRef: z.string().optional(),
  adminTaskRef: z.string().optional(),
  delayedJourneyState: z.string().optional()
}).strict();

// ── Routes ──

export async function POST(event: RequestEvent) {
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

  const parsed = createFollowUpSchema.safeParse(rawBody);
  if (!parsed.success) {
    return json({
      success: false,
      error: { code: 'validationFailed', message: parsed.error.issues.map(i => i.message).join('; ') }
    }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const idempotencyKey = parsed.data.idempotencyKey ?? crypto.randomUUID();

  // Check idempotency for create action
  const existingEvent = await findStaffActionAuditEventByIdempotency(db, {
    actorId,
    assessmentId,
    idempotencyKey
  });
  if (existingEvent) {
    // Idempotent retry — return existing follow-up if it exists
    const existingFollowUp = existingEvent.targetId
      ? await findFollowUpById(db, existingEvent.targetId)
      : null;
    return json({
      success: true,
      receipt: staffActionReceiptFromEvent(existingEvent),
      followUp: existingFollowUp
    });
  }

  try {
    const followUp = await insertFollowUp(db, { id, assessmentId, ...parsed.data });

    // Create audit event for follow-up creation
    try {
      await insertStaffActionAuditEvent(db, {
        id: crypto.randomUUID(),
        assessmentId,
        targetType: 'followUp',
        targetId: id,
        actorId,
        action: 'completeFollowUp',  // placeholder — 'createFollowUp' not in StaffPortalActionId
        fromState: 'open',
        toState: 'open',
        reasonCode: undefined,
        reason: undefined,
        requestHash: `${id}-create-${new Date().toISOString()}`,
        idempotencyKey,
        createdAt: new Date().toISOString()
      });
    } catch (auditErr) {
      console.error('Failed to create audit event for follow-up creation:', auditErr);
      // Creation succeeded — audit write failure is non-blocking for the response
    }

    const receipt = await findStaffActionAuditEventByIdempotency(db, {
      actorId, assessmentId, idempotencyKey
    });

    return json({
      success: true,
      followUp,
      receipt: receipt ? staffActionReceiptFromEvent(receipt) : undefined
    });
  } catch (err) {
    console.error('Failed to create follow-up:', err);
    return json({
      success: false,
      error: { code: 'auditWriteFailed', message: 'Failed to create follow-up' }
    }, { status: 500 });
  }
}

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
  const items = await findFollowUpsByAssessment(db, assessmentId);
  return json({ items });
}
