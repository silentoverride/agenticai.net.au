/**
 * Server load: list clients for the SSR-rendered list view.
 */

import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import { listClientsForOperator } from '$lib/server/staff-portal/services/clients.service';
import type { ClientListFilters, ClientStatus } from '$lib/staff-portal/clients.dto';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals, platform }) => {
  await requireStaff(locals, platform?.env.assessment_db);
  const db = getDb();

  const filters: ClientListFilters = {
    search: url.searchParams.get('search') ?? undefined,
    status: (url.searchParams.get('status') as ClientStatus | null) ?? undefined,
    assignedStaffId: url.searchParams.get('assignedStaffId') ?? undefined,
    page: Number(url.searchParams.get('page') ?? '1'),
    pageSize: Number(url.searchParams.get('pageSize') ?? '25'),
    sortBy: (url.searchParams.get('sortBy') as ClientListFilters['sortBy'] | null) ?? 'companyName',
    sortDir: (url.searchParams.get('sortDir') as 'asc' | 'desc' | null) ?? 'asc'
  };

  const result = await listClientsForOperator(db, filters);
  return { clients: result };
};
