/**
 * GET /api/portal/user
 * PUT /api/portal/user
 *
 * Returns or updates the portal user record.
 *
 * @returns JSON with user profile.
 * @throws 404 — If the user is not found.
 */

import { json, error } from '@sveltejs/kit';
import { requirePortalAuth } from '$lib/server/portal-auth';
import { getUser, upsertUser } from '$lib/server/portal';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
  const { userId } = await requirePortalAuth(locals, url);
  const user = await getUser(userId);
  if (!user) {
    throw error(404, 'User not found');
  }

  return json({
    clerk_id: user.clerk_id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at,
  });
};

export const PUT: RequestHandler = async ({ request, locals, url }) => {
  const { userId, email, isDevBypass } = await requirePortalAuth(locals, url);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // During dev bypass, don't try to sync Clerk user details
  const clerkEmail = isDevBypass ? email : (locals.user?.email || '');

  const user = await upsertUser(
    userId,
    clerkEmail,
    typeof body.name === 'string' ? body.name : undefined,
    typeof body.phone === 'string' ? body.phone : undefined,
  );

  if (!user) {
    throw error(500, 'Failed to update profile');
  }

  return json({
    clerk_id: user.clerk_id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at,
  });
};
