/**
 * GET  /api/staff/clients/[clientId]/interactions  — list (with filters)
 * POST /api/staff/clients/[clientId]/interactions  — create
 *
 * Update/delete: [interactionId]/+server.ts
 */

import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import {
  createInteraction,
  listInteractions
} from '$lib/server/staff-portal/services/client-interactions.service';
import type { ClientInteractionFilters, ClientInteractionType } from '$lib/staff-portal/clients.dto';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (!role) throw error(403, 'Staff access required');
  const db = getDb();

  const filters: ClientInteractionFilters = {
    type: (url.searchParams.get('type') as ClientInteractionType | null) ?? undefined,
    staffId: url.searchParams.get('staffId') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined
  };

  const items = await listInteractions(db, params.clientId, filters);
  return json({ items });
};

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
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

  const created = await createInteraction(db, {
    actorId,
    clientId: params.clientId,
    body
  });
  return json(created, { status: 201 });
};
