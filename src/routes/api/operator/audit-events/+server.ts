import { error, json } from '@sveltejs/kit';
import { getDb, setD1Binding } from '$lib/server/db';
import { requireOperator } from '$lib/server/operator-auth';
import { findRecentAuditEvents } from '$lib/server/staff-portal/repositories/staff-audit.repository';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
  const d1 = platform?.env.assessment_db;
  if (d1) setD1Binding(d1);

  const role = await requireOperator(locals, d1);
  if (role !== 'admin') {
    throw error(403, 'Only admins can view audit events');
  }

  const requestedLimit = Number(url.searchParams.get('limit') ?? '100');
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 100, 1), 200);
  const events = await findRecentAuditEvents(getDb(), limit);

  return json(
    {
      success: true,
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
        metadataJson: event.metadataJson,
        createdAt: event.createdAt
      }))
    },
    {
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
};
