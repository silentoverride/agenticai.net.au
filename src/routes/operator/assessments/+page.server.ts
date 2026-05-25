import { error } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { getDb } from '$lib/server/db';
import { listReportReviewQueue } from '$lib/server/staff-portal/read-models/list-report-review-queue';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
  const role = await requireOperator(locals, platform?.env.assessment_db) as 'operator' | 'admin';

  const auth = locals.auth();
  const userId = auth.userId;
  if (!userId) {
    throw error(401, 'Not authenticated');
  }

  const db = getDb();

  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);
  const offset = Number(url.searchParams.get('offset')) || 0;

  const result = await listReportReviewQueue({
    db,
    actorId: userId,
    role,
    limit,
    offset
  });

  return {
    queue: result.items,
    total: result.total,
    hasMore: result.hasMore,
    limit,
    offset
  };
};
