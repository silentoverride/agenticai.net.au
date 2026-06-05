/**
 * GET /api/staff/users
 *
 * List staff users and pending invitations. Admin-only.
 */

import { json, error } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';
import { listStaffUsers, listStaffInvitations } from '$lib/server/staff-invite';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (role !== 'admin') {
    throw error(403, 'Only admins can view staff management');
  }

  const [users, invitations] = await Promise.all([
    listStaffUsers(),
    listStaffInvitations(),
  ]);

  return json({ users, invitations: invitations.local });
};
