/**
 * GET  /api/staff/clients/[clientId]/files  — list files
 * POST /api/staff/clients/[clientId]/files  — upload file (multipart)
 *
 * Multi-delete: POST /api/staff/clients/[clientId]/files/delete
 * Download:     GET  /api/staff/clients/[clientId]/files/[fileId]/download
 */

import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import {
  getClientFiles,
  parseFileMeta,
  uploadClientFile
} from '$lib/server/staff-portal/services/client-files.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (!role) throw error(403, 'Staff access required');
  const db = getDb();
  const files = await getClientFiles(db, params.clientId);
  // Strip r2Key from the public response
  return json(files.map(({ r2Key, ...rest }) => rest));
};

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (!role) throw error(403, 'Staff access required');
  const db = getDb();
  const r2 = platform?.env?.assessment_blobs;
  if (!r2) throw error(500, 'R2 binding not available');
  const actorId = locals.auth?.()?.userId ?? 'system';

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw error(400, 'Missing file');

  const meta = parseFileMeta({
    category: form.get('category') ?? 'other',
    description: form.get('description') ?? null
  });

  const dto = await uploadClientFile(db, {
    r2,
    actorId,
    clientId: params.clientId,
    file,
    category: meta.category,
    description: meta.description ?? null
  });

  // Strip r2Key from public response
  const { r2Key, ...publicDto } = dto;
  return json(publicDto, { status: 201 });
};
