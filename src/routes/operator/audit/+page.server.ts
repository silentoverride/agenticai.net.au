import { error } from '@sveltejs/kit';
import { getDb, setD1Binding } from '$lib/server/db';
import { requireOperator } from '$lib/server/operator-auth';
import { findRecentAuditEvents } from '$lib/server/staff-portal/repositories/staff-audit.repository';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const d1 = platform?.env.assessment_db;
  if (d1) setD1Binding(d1);

  const role = await requireOperator(locals, d1);
  if (role !== 'admin') {
    throw error(403, 'Only admins can view the audit stream');
  }

  const events = await findRecentAuditEvents(getDb(), 100);

  return {
    events: events.map(event => ({
      id: event.id,
      assessmentId: event.assessmentId,
      targetType: event.targetType,
      targetId: event.targetId,
      actorId: event.actorId,
      action: event.action,
      fromState: event.fromState,
      toState: event.toState,
      reasonCode: event.reasonCode,
      reason: event.reason,
      requestHash: event.requestHash,
      idempotencyKey: event.idempotencyKey,
      metadataJson: event.metadataJson,
      createdAt: event.createdAt
    }))
  };
};
