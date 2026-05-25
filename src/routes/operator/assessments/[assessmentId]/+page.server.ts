import { error } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { getDb } from '$lib/server/db';
import { getAssessmentReview } from '$lib/server/staff-portal/read-models/get-assessment-review';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
  const role = await requireOperator(locals, platform?.env.assessment_db) as 'operator' | 'admin';

  const auth = locals.auth();
  const userId = auth.userId;
  if (!userId) {
    throw error(401, 'Not authenticated');
  }

  const db = getDb();

  try {
    const review = await getAssessmentReview({
      db,
      assessmentId: params.assessmentId,
      actorId: userId,
      role,
    });

    return { review };
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500;
    if (status === 403) {
      // Non-leaking permission denied — no object names, counts, or metadata
      throw error(403, 'You do not have access to this assessment.');
    }
    throw error(500, 'Could not load review data.');
  }
};
