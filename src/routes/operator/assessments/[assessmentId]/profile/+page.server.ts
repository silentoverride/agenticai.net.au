import { error } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { getDb } from '$lib/server/db';
import { getClientProfileSnapshot } from '$lib/server/staff-portal/read-models/get-client-profile-snapshot';
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
    const profileResult = await getClientProfileSnapshot({
      db,
      clientId: params.assessmentId,
      actorId: userId,
      role
    });

    // Non-leaking permission denied
    if (profileResult.errorCode === 'permission_denied') {
      throw error(403, 'You do not have access to this assessment.');
    }

    return { profile: profileResult };
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500;
    if (status === 403) {
      throw error(403, 'You do not have access to this assessment.');
    }
    throw error(500, 'Could not load client profile data.');
  }
};
