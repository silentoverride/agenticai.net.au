/**
 * POST /api/operator/staff/invite
 *
 * Create a Clerk invitation for a new staff member.
 * Admin-only. Requires a valid email and role (operator|admin).
 */

import { json, error } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { createStaffInvitation } from '$lib/server/staff-invite';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const role = await requireOperator(locals, platform?.env.assessment_db);
  if (role !== 'admin') {
    throw error(403, 'Only admins can invite staff members');
  }

  const auth = locals.auth();
  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const body = await request.json().catch(() => ({})) as {
    email?: string;
    role?: string;
  };

  if (!body.email || typeof body.email !== 'string') {
    throw error(400, 'Email is required');
  }

  if (!body.role || !['operator', 'admin'].includes(body.role)) {
    throw error(400, 'Role must be "operator" or "admin"');
  }

  const email = body.email.trim().toLowerCase();
  const staffRole = body.role as 'operator' | 'admin';

  try {
    const invitation = await createStaffInvitation(email, staffRole, auth.userId);
    return json({ success: true, invitation });
  } catch (err) {
    console.error('[staff-invite] Failed to create invitation:', err);
    const message = err instanceof Error ? err.message : 'Failed to create invitation';
    throw error(500, message);
  }
};
