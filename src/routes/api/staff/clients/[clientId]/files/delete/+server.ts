/**
 * POST /api/staff/clients/[clientId]/files/delete
 * Multi-file delete with explicit confirmation.
 * Body: { fileIds: string[], confirm: true }
 */

import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import { removeClientFiles } from '$lib/server/staff-portal/services/client-files.service';
import type { RequestHandler } from './$types';

const schema = z.object({
  fileIds: z.array(z.string().min(1)).min(1).max(100),
  confirm: z.literal(true)
});

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (!role) throw error(403, 'Staff access required');
  const db = getDb();
  const r2 = platform?.env?.assessment_blobs;
  if (!r2) throw error(500, 'R2 binding not available');
  const actorId = locals.auth?.()?.userId ?? 'system';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw error(400, `Invalid request: ${parsed.error.issues[0]?.message ?? 'validation failed'}`);
  }

  const removed = await removeClientFiles(db, {
    r2,
    actorId,
    clientId: params.clientId,
    fileIds: parsed.data.fileIds
  });
  return json({ removed });
};
