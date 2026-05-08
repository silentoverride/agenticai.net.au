import { error } from '@sveltejs/kit';
import type { SessionAuthObject } from '@clerk/backend';
import type { PendingSessionOptions } from '@clerk/shared/types';

export type ResolvedUser = {
  userId: string;
  email: string;
  name: string;
  isDevBypass: boolean;
};

export type AuthLocals = {
  auth: (options?: PendingSessionOptions) => SessionAuthObject;
  user: { id: string; email?: string; name?: string } | null;
};

/**
 * Resolve authenticated user from Clerk or dev bypass query parameter.
 *
 * In production, only Clerk auth is accepted.
 * In local development, requests may pass `?dev_user_id=` to bypass Clerk
 * authentication for testing purposes.
 *
 * @returns Resolved user with guaranteed userId and email.
 * @throws 401 when neither Clerk nor dev bypass credentials are present.
 */
export function resolveUser(locals: AuthLocals, url: URL): ResolvedUser {
  const auth = locals.auth();
  const devUserId = url.searchParams.get('dev_user_id');
  const isDevBypass = !import.meta.env.PROD && devUserId != null;

  if (!auth.userId && !isDevBypass) {
    throw error(401, 'Not authenticated');
  }

  const clerkUser = locals.user;
  const userId = auth.userId || devUserId || '';
  const email = clerkUser?.email || (isDevBypass ? 'dev@localhost' : '');
  const name = clerkUser?.name || '';

  return {
    userId,
    email,
    name,
    isDevBypass,
  };
}
