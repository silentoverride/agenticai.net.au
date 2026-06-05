/**
 * PATCH  /api/staff/clients/[clientId]/tasks/[taskId]  — edit / reschedule / complete
 * DELETE /api/staff/clients/[clientId]/tasks/[taskId]  — remove
 */

import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import {
  editTask,
  removeTask
} from '$lib/server/staff-portal/services/client-tasks.service';
import type { RequestHandler } from './$types';

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

  const updated = await editTask(db, {
    actorId,
    clientId: params.clientId,
    taskId: params.taskId,
    body
  });
  if (!updated) throw error(404, 'Task not found');
  return json(updated);
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (!role) throw error(403, 'Staff access required');
  const db = getDb();
  const actorId = locals.auth?.()?.userId ?? 'system';

  const ok = await removeTask(db, actorId, params.clientId, params.taskId);
  if (!ok) throw error(404, 'Task not found');
  return json({ ok: true });
};
