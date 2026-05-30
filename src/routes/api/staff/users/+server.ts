/**
 * GET  /api/staff/users         — List users (paginated, searchable)
 * POST /api/staff/users         — Create new user
 */

import { json, error } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';
import {
  listUsers, createUser, validateCreateUser, emailExists,
  type CreateUserInput,
} from '$lib/server/user-management';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (role !== 'admin') throw error(403, 'Admin access required');

  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const search = url.searchParams.get('search') || undefined;
  const roleFilter = url.searchParams.get('role') || undefined;
  const status = url.searchParams.get('status') || undefined;

  const result = await listUsers({ page, pageSize, search, role: roleFilter, status });
  return json(result);
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const role = await requireStaff(locals, platform?.env.assessment_db);
  if (role !== 'admin') throw error(403, 'Admin access required');

  const body = (await request.json()) as CreateUserInput;
  const errors = validateCreateUser(body);

  if (errors.length > 0) {
    return json({ success: false, errors }, { status: 422 });
  }

  // Check duplicate email
  const exists = await emailExists(body.email);
  if (exists) {
    return json({
      success: false,
      errors: [{ field: 'email', message: 'A user with this email already exists.' }],
    }, { status: 409 });
  }

  try {
    const user = await createUser(body);
    return json({ success: true, user }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api] User creation failed:', msg);
    return json({
      success: false,
      errors: [{ field: 'general', message: `Failed to create user: ${msg}` }],
    }, { status: 500 });
  }
};
