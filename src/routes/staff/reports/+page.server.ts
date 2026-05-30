import { error } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';
import { getDb } from '$lib/server/db';
import { listAllReports } from '$lib/server/staff-portal/read-models/list-all-reports';
import type { PageServerLoad } from './$types';
import type { StaffRole } from '$lib/staff-portal/dto';

export const load: PageServerLoad = async ({ locals, url }) => {
  const role = await requireStaff(locals) as StaffRole;

  const auth = locals.auth();
  const userId = auth.userId;
  if (!userId) {
    throw error(401, 'Not authenticated');
  }

  const db = getDb();

  const search = url.searchParams.get('search') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const dateFrom = url.searchParams.get('dateFrom') || undefined;
  const dateTo = url.searchParams.get('dateTo') || undefined;
  const sort = (url.searchParams.get('sort') || 'updated') as 'title' | 'customer' | 'status' | 'updated' | 'created';
  const order = (url.searchParams.get('order') || 'desc') as 'asc' | 'desc';
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const offset = Number(url.searchParams.get('offset')) || 0;

  const result = await listAllReports({
    db,
    actorId: userId,
    role,
    search,
    status,
    dateFrom,
    dateTo,
    sort,
    order,
    limit,
    offset
  });

  return {
    items: result.items,
    total: result.total,
    hasMore: result.hasMore,
    limit,
    offset,
    search: search || '',
    status: status || '',
    dateFrom: dateFrom || '',
    dateTo: dateTo || '',
    sort,
    order
  };
};
