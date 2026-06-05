/**
 * PUT /api/staff/users/user/[clerkId]/role
 *
 * Update a staff user's role. Admin-only.
 * Use to demote staff/admins back to client role.
 */

import { json, error } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';
import { getDb, withDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (role !== 'admin') {
    throw error(403, 'Only admins can change staff roles');
  }

  const { clerkId } = params;
  if (!clerkId) {
    throw error(400, 'User ID is required');
  }

  const body = await request.json().catch(() => ({})) as { role?: string };
  if (!body.role || !['client', 'staff', 'admin'].includes(body.role)) {
    throw error(400, 'Role must be "client", "staff", or "admin"');
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
