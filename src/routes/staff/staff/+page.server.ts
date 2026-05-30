import { error } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';
import { listStaffUsers, listStaffInvitations } from '$lib/server/staff-invite';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (role !== 'admin') {
    throw error(403, 'Only admins can manage staff');
  }

  const [users, invitations] = await Promise.all([
    listStaffUsers(),
    listStaffInvitations(),
  ]);

  return {
    users: users.map(u => ({
      clerkId: u.clerk_id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.created_at,
    })),
    invitations: invitations.local.map(i => ({
      id: i.id,
      email: i.email,
      role: i.role,
      status: i.status,
      invitedBy: i.invited_by,
      createdAt: i.created_at,
      acceptedAt: i.accepted_at,
    })),
  };
};
