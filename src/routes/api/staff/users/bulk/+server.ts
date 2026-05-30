/**
 * POST /api/staff/users/bulk — Bulk deactivate or delete users
 */

import { json, error } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';
import { bulkAction, type BulkActionInput } from '$lib/server/user-management';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (role !== 'admin') throw error(403, 'Admin access required');

  const auth = locals.auth();
  const actorId = auth.userId || '';

  const body = (await request.json()) as BulkActionInput;
  body.actorId = actorId;

  if (!body.userIds || !Array.isArray(body.userIds) || body.userIds.length === 0) {
    return json({ success: false, error: 'No users selected.' }, { status: 400 });
  }

  if (!['deactivate', 'delete'].includes(body.action)) {
    return json({ success: false, error: 'Invalid action.' }, { status: 400 });
  }

  try {
    const result = await bulkAction(body);
    return json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ success: false, error: msg }, { status: 500 });
  }
};
