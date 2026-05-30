import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import { commitFollowUpAction } from '$lib/server/staff-portal/services/commit-follow-up-action';

const updateFollowUpSchema = z.object({
  action: z.enum(['completeFollowUp', 'deferFollowUp', 'reassignFollowUp']),
  reason: z.string().optional(),
  newOwnerId: z.string().optional(),
  idempotencyKey: z.string().min(1, 'idempotencyKey is required')
}).strict();

export async function PUT(event: RequestEvent) {
  const auth = event.locals.auth();
  const actorId = auth.userId;
  if (!actorId) {
    return json({ success: false, error: { code: 'permissionDenied', message: 'Not authenticated' } }, { status: 401 });
  }

  const assessmentId = event.params.assessmentId;
  const followUpId = event.params.id;
  if (!assessmentId || !followUpId) {
    return json({ success: false, error: { code: 'validationFailed', message: 'Assessment ID and follow-up ID are required' } }, { status: 400 });
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

  const parsed = updateFollowUpSchema.safeParse(rawBody);
  if (!parsed.success) {
    return json({
      success: false,
      error: { code: 'validationFailed', message: parsed.error.issues.map(i => i.message).join('; ') }
    }, { status: 400 });
  }

  const db = getDb();
  const result = await commitFollowUpAction(db, {
    followUpId,
    actorId,
    assessmentId,
    ...parsed.data
  });

  if (result.success) {
    return json({ success: true, receipt: result.receipt, followUp: result.followUp });
  }

  const statusMap: Record<string, number> = {
    permissionDenied: 403, staleState: 409, duplicateAction: 409,
    blockedAction: 422, validationFailed: 400, auditWriteFailed: 500
  };
  return json({ success: false, error: result.error }, { status: statusMap[result.error?.code ?? ''] ?? 500 });
}
