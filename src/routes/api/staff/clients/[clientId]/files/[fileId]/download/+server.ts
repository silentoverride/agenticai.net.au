/**
 * GET /api/staff/clients/[clientId]/files/[fileId]/download
 * Streams the file from R2 back to the client.
 */

import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import { downloadClientFile } from '$lib/server/staff-portal/services/client-files.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (!role) throw error(403, 'Staff access required');
  const db = getDb();
  const r2 = platform?.env?.assessment_blobs;
  if (!r2) throw error(500, 'R2 binding not available');
  const actorId = locals.auth?.()?.userId ?? 'system';

  const result = await downloadClientFile(db, {
    r2,
    actorId,
    clientId: params.clientId,
    fileId: params.fileId
  });
  if (!result) throw error(404, 'File not found');

  return new Response(result.body, {
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(result.file.fileName)}"`,
      'Cache-Control': 'private, max-age=0, must-revalidate'
    }
  });
};
