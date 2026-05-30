/**
 * PUT    /api/staff/users/[id]  — Update user
 * DELETE /api/staff/users/[id]  — Delete user
 */

import { json, error } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';
import {
  updateUser, deleteUser,
  validateUpdateUser, emailExists,
  type UpdateUserInput,
} from '$lib/server/user-management';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (role !== 'admin') throw error(403, 'Admin access required');

  const body = (await request.json()) as UpdateUserInput;
  const errors = validateUpdateUser(body);

  if (errors.length > 0) {
    return json({ success: false, errors }, { status: 422 });
  }

  // Check duplicate email
  if (body.email) {
    const exists = await emailExists(body.email, params.id);
    if (exists) {
      return json({
        success: false,
        errors: [{ field: 'email', message: 'Another user already has this email address.' }],
      }, { status: 409 });
    }
  }

  try {
    const user = await updateUser(params.id, body);
    if (!user) throw error(404, 'User not found');
    return json({ success: true, user });
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    return json({
      success: false,
      errors: [{ field: 'general', message: `Update failed: ${msg}` }],
    }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (role !== 'admin') throw error(403, 'Admin access required');

  // Get the actor's ID from auth context
  const auth = locals.auth();
  const actorId = auth.userId || '';

  const result = await deleteUser(params.id, actorId);
  if (!result.success) {
    return json({ success: false, error: result.error }, { status: 400 });
  }

  return json({ success: true });
};
