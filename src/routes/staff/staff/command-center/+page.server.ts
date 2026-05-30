import { requireStaff } from '$lib/server/staff-auth';
import { getCommandCenterItems } from '$lib/server/staff-portal/read-models/get-command-center-items';
import { getDb } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const role = 'staff';
  const db = getDb();
  const actorId = locals.user?.id ?? '';

  const result = await getCommandCenterItems({
    db,
    actorId,
    role,
    limit: 50,
    offset: 0,
  });

  return {
    items: result.items,
    total: result.total,
    hasMore: result.hasMore,
    role,
  };
};
