/**
 * GET    /api/staff/clients/[clientId]  — read client record
 * PATCH  /api/staff/clients/[clientId]  — update client record
 * DELETE /api/staff/clients/[clientId]  — delete client (admin only)
 */

import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireAdmin, requireStaff } from '$lib/server/staff-auth';
import {
  editClient,
  getClient,
  removeClient
} from '$lib/server/staff-portal/services/clients.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (!role) throw error(403, 'Staff access required');
  const db = getDb();
  const client = await getClient(db, params.clientId);
  if (!client) throw error(404, 'Client not found');
  return json(client);
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
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

  const updated = await editClient(db, {
    actorId,
    clientId: params.clientId,
    body
  });
  if (!updated) throw error(404, 'Client not found');
  return json(updated);
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  // Admin only — clients cascade-delete a lot of sub-data.
  await requireAdmin(locals, platform?.env.assessment_db);
  const db = getDb();
  const actorId = locals.auth?.()?.userId ?? 'system';
  const ok = await removeClient(db, { actorId, clientId: params.clientId });
  if (!ok) throw error(404, 'Client not found');
  return json({ ok: true });
};
