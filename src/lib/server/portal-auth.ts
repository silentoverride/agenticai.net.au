/**
 * Shared portal authentication helper — centralises the common
 * `isDatabaseAvailable → resolveUser → upsertUser` boilerplate.
 *
 * Every portal API route calls this as its first step instead of
 * repeating the same four lines across seven files.
 */

import { error } from '@sveltejs/kit';
import { resolveUser } from './auth';
import { assertSchema, getDb, isDatabaseAvailable } from './db';
import { getUser, upsertUser } from './portal';
import type { ResolvedUser } from './auth';

export type PortalAuthContext = ResolvedUser;

export async function requirePortalAuth(
  locals: App.Locals,
  url: URL
): Promise<PortalAuthContext> {
  if (!isDatabaseAvailable()) {
    throw error(503, 'Portal database not available in this environment');
  }

  const user = resolveUser(locals, url);

  try {
    const db = getDb();
    await assertSchema(db);

    if (user.isDevBypass) {
      // In dev bypass, enrich the user with their real email/name from the DB
      // so that receipt/report linking by email works during local testing.
      const dbUser = await getUser(user.userId);
      if (dbUser) {
        user.email = dbUser.email || user.email;
        user.name = dbUser.name || user.name;

        // Check access — revoked users cannot access the portal
        if (dbUser.role === 'revoked') {
          throw error(403, 'Portal access revoked. Please contact support.');
        }
      }
    } else {
      await upsertUser(user.userId, user.email, user.name || undefined);

      // Check access after upsert
      const dbUser = await getUser(user.userId);
      if (dbUser?.role === 'revoked') {
        throw error(403, 'Portal access revoked. Please contact support.');
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Database schema missing')) {
      throw error(503, err.message);
    }
    throw err;
  }

  return user;
}
