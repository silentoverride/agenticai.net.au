/**
 * POST /api/staff/assessments/[assessmentId]/actions
 *
 * Commit a staff action against an assessment's governed state.
 * Delegates to central commitStaffAction service with Zod validation.
 */

import { json, error } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { getDb } from '$lib/server/db';
import { commitStaffAction } from '$lib/server/staff-portal/services/commit-staff-action';
import { staffActionRequestSchema } from '$lib/server/staff-portal/validation/staff-action.schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
  await requireOperator(locals, platform?.env.assessment_db);
  const db = getDb();

  const assessmentId = params.assessmentId;
  if (!assessmentId) throw error(400, 'Missing assessmentId');

  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid JSON body');

  const parsed = staffActionRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw error(400, parsed.error.issues.map((i) => i.message).join('; '));
  }

  const result = await commitStaffAction({
    db,
    actorId: locals.user?.id,
    assessmentId,
    action: parsed.data.action,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId ?? null,
    idempotencyKey: parsed.data.idempotencyKey,
    expectedState: parsed.data.expectedState,
    expectedVersion: parsed.data.expectedVersion,
    reasonCode: parsed.data.reasonCode,
    reason: parsed.data.reason,
    auditMetadata: parsed.data.auditMetadata
  });

  if (!result.success) {
    const status = result.error.code === 'permissionDenied' ? 403
      : result.error.code === 'staleState' ? 409
      : result.error.code === 'duplicateAction' ? 200 // idempotent replay
      : 422;

    if (status === 200) return json(result);
    throw error(status, result.error.message);
  }

  return json(result);
};
