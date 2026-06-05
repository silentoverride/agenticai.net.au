/**
 * GET  /api/staff/clients/[clientId]/tasks  — list
 * POST /api/staff/clients/[clientId]/tasks  — create
 *
 * Update/delete/complete: [taskId]/+server.ts
 */

import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import {
  createTask,
  listTasks
} from '$lib/server/staff-portal/services/client-tasks.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (!role) throw error(403, 'Staff access required');
  const db = getDb();
  const items = await listTasks(db, params.clientId);
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

  const created = await createTask(db, {
    actorId,
    clientId: params.clientId,
    body
  });
  return json(created, { status: 201 });
};
