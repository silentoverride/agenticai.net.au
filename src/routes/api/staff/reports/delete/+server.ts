import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/staff-auth';
import { getDb } from '$lib/server/db';

interface DeleteReportsRequest {
  report_id?: string;
  report_ids?: string[];
}

export const POST: RequestHandler = async ({ request, locals }) => {
  // Explicit admin role verification
  await requireAdmin(locals);

  let body: DeleteReportsRequest;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const { report_id, report_ids } = body;

  // Input validation
  const idsToDelete: string[] = [];

  if (report_id && typeof report_id === 'string') {
    idsToDelete.push(report_id);
  }

  if (Array.isArray(report_ids)) {
    for (const id of report_ids) {
      if (typeof id === 'string' && id.length > 0) {
        idsToDelete.push(id);
      }
    }
  }

  if (idsToDelete.length === 0) {
    throw error(400, 'report_id or report_ids is required');
  }

  // Remove duplicates
  const uniqueIds = [...new Set(idsToDelete)];
  const db = getDb(locals);

  try {
    const placeholders = uniqueIds.map(() => '?').join(',');
    const result = await db.exec(
      `DELETE FROM reports WHERE id IN (${placeholders})`,
      ...uniqueIds
    );

    return json({
      success: true,
      deleted_count: result.changes,
      deleted_ids: uniqueIds
    });
  } catch (err) {
    console.error('[admin] Report deletion failed:', err);
    throw error(500, 'Failed to delete reports');
  }
};
