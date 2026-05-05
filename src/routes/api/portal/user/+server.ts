import { json, error } from '@sveltejs/kit';
import { getUser, upsertUser } from '$lib/server/portal';
import { isDatabaseAvailable } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (!isDatabaseAvailable()) {
    throw error(503, 'Portal database not available');
  }

  const auth = await locals.auth();
  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const user = await getUser(auth.userId);
  if (!user) {
    throw error(404, 'User not found');
  }

  return json({
    clerk_id: user.clerk_id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at
  });
};

export const PUT: RequestHandler = async ({ request, locals }) => {
  if (!isDatabaseAvailable()) {
    throw error(503, 'Portal database not available');
  }

  const auth = await locals.auth();
  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const body = await request.json().catch(() => ({})) as {
    name?: string;
    phone?: string;
    company?: string;
  };

  const clerkUser = locals.user;

  // We store company in the user name field for now, or we could add a company column later
  const user = await upsertUser(
    auth.userId,
    clerkUser?.email || '',
    body.name,
    body.phone
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
    created_at: user.created_at
  });
};
