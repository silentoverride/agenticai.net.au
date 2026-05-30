import { error } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';
import { getDb } from '$lib/server/db';
import { getCommandCenterItems } from '$lib/server/staff-portal/read-models/get-command-center-items';
import type { StaffRole } from '$lib/staff-portal/dto';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
  const role = await requireStaff(locals) as StaffRole;

  const auth = locals.auth();
  const userId = auth.userId;
  if (!userId) {
    throw error(401, 'Not authenticated');
  }

  const db = getDb();

  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);
  const offset = Number(url.searchParams.get('offset')) || 0;

  const result = await getCommandCenterItems({
    db,
    actorId: userId,
    role,
    limit,
    offset
  });

  return {
    items: result.items,
    total: result.total,
    hasMore: result.hasMore,
    limit,
    offset
  };
};
