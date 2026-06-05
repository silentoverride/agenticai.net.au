/**
 * GET  /api/staff/clients       — list clients (search, sort, paginate)
 * POST /api/staff/clients       — create a new client
 *
 * Both require staff role. Delete (admin-only) lives at [clientId]/+server.ts.
 */

import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import {
  createClient,
  listClientsForOperator
} from '$lib/server/staff-portal/services/clients.service';
import type { ClientListFilters, ClientStatus } from '$lib/staff-portal/clients.dto';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (!role) throw error(403, 'Staff access required');
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
  return json(result);
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (!role) throw error(403, 'Staff access required');
  const db = getDb();
  const actorId = locals.auth?.()?.userId ?? 'system';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON');
  }

  const created = await createClient(db, { actorId, body });
  return json(created, { status: 201 });
};
