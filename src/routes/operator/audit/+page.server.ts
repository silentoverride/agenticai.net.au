import { error, fail } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { getDb } from '$lib/server/db';
import { getAuditTrail } from '$lib/server/staff-portal/read-models/get-client-audit-history';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
  const role = await requireOperator(locals, platform?.env.assessment_db) as 'operator' | 'admin';

  // Only admins can access the broader Audit Trail
  if (role !== 'admin') {
    throw error(403, 'Only admins can access the audit trail.');
  }

  const auth = locals.auth();
  const userId = auth.userId;
  if (!userId) {
    throw error(401, 'Not authenticated');
  }

  const db = getDb();

  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const offset = Number(url.searchParams.get('offset')) || 0;

  const result = await getAuditTrail({
    db,
    actorId: userId,
    role,
    limit,
    offset
  });

  return {
    events: result.events,
    total: result.total,
    hasMore: result.hasMore,
    limit,
    offset
  };
};
