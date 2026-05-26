/**
 * PUT /api/operator/staff/user/[clerkId]/role
 *
 * Update a staff user's role. Admin-only.
 * Use to demote operators/admins back to client role.
 */

import { json, error } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { getDb, withDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals, platform }) => {
  const role = await requireOperator(locals, platform?.env.assessment_db);
  if (role !== 'admin') {
    throw error(403, 'Only admins can change staff roles');
  }

  const { clerkId } = params;
  if (!clerkId) {
    throw error(400, 'User ID is required');
  }

  const body = await request.json().catch(() => ({})) as { role?: string };
  if (!body.role || !['client', 'operator', 'admin'].includes(body.role)) {
    throw error(400, 'Role must be "client", "operator", or "admin"');
  }

  await withDb('updateUserRole', null, async db => {
    await db.exec(
      `UPDATE users SET role = ? WHERE clerk_id = ?`,
      body.role,
      clerkId
    );
  });

  return json({ success: true });
};
