/**
 * DELETE /api/operator/staff/invite/[id]
 *
 * Revoke a pending staff invitation. Admin-only.
 */

import { json, error } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { revokeStaffInvitation } from '$lib/server/staff-invite';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const role = await requireOperator(locals, platform?.env.assessment_db);
  if (role !== 'admin') {
    throw error(403, 'Only admins can revoke staff invitations');
  }

  const { id } = params;
  if (!id) {
    throw error(400, 'Invitation ID is required');
  }

  try {
    await revokeStaffInvitation(id);
    return json({ success: true });
  } catch (err) {
    console.error('[staff-invite] Failed to revoke invitation:', err);
    const message = err instanceof Error ? err.message : 'Failed to revoke invitation';
    throw error(500, message);
  }
};
