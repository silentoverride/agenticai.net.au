import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getDb, setD1Binding } from '$lib/server/db';
import { requireOperator } from '$lib/server/operator-auth';
import { commitStaffAction } from '$lib/server/staff-portal/services/commit-staff-action';
import { createFollowUpForSource } from '$lib/server/staff-portal/services/create-follow-up-for-source';
import { staffActionRequestSchema } from '$lib/server/staff-portal/validation/staff-action.schema';
import type { StaffActionMutationErrorDto } from '$lib/staff-portal/dto';

export async function POST(event: RequestEvent) {
  const actorId = event.locals.auth().userId;
  if (!actorId) return errorResponse(401, 'permissionDenied', 'Not authenticated');
  const assessmentId = event.params.assessmentId;
  if (!assessmentId) return errorResponse(400, 'validationFailed', 'Assessment ID is required');

  try {
    const d1 = event.platform?.env?.assessment_db;
    if (d1) setD1Binding(d1);
    await requireOperator(event.locals, d1);
  } catch (err) {
    const status = statusFromError(err);
    return errorResponse(status, 'permissionDenied', status === 401 ? 'Not authenticated' : 'Operator access required');
  }

  let rawBody: unknown;
  try {
    rawBody = await event.request.json();
  } catch {
    return errorResponse(400, 'validationFailed', 'Request body must be valid JSON');
  }

  const parsed = staffActionRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorResponse(400, 'validationFailed', 'Action request is invalid');
  }

  const result = await commitStaffAction({
    db: getDb(),
    actorId,
    assessmentId,
    ...parsed.data
  });

  if (!result.success) {
    return json({ success: false, error: result.error }, { status: statusForServiceError(result.error.code) });
  }

  // When clarification is required on a report decision, auto-create a follow-up
  // linked to the report so the commitment is not lost after review.
  let followUp = undefined;
  if (parsed.data.action === 'requestClarification') {
    const fwResult = await createFollowUpForSource(getDb(), {
      assessmentId,
      title: parsed.data.reason
        ? `Clarification required — ${parsed.data.reason}`
        : 'Clarification required for report',
      description: `Auto-created from a Human Review decision. ${parsed.data.reason ?? 'No additional context provided.'}`,
      ownerId: actorId,
      source: 'human_review',
      clientVisiblePromise: false,
      reportId: parsed.data.targetId
    });
    if (fwResult.success) {
      followUp = fwResult.followUp;
    }
    // If follow-up creation fails, the audit event was already persisted.
    // We return success but without the follow-up reference so the UI
    // can warn that follow-up creation failed.
  }

  return json({ success: true, receipt: result.receipt, state: result.state, followUp });
}

function errorResponse(status: number, code: StaffActionMutationErrorDto['code'], message: string) {
  return json({ success: false, error: { code, message } }, { status });
}

function statusForServiceError(code: StaffActionMutationErrorDto['code']): number {
  switch (code) {
    case 'permissionDenied': return 403;
    case 'staleState': return 409;
    case 'duplicateAction': return 409;
    case 'blockedAction': return 422;
    case 'validationFailed': return 400;
    case 'auditWriteFailed': return 500;
  }
}

function statusFromError(err: unknown): number {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  return 403;
}
