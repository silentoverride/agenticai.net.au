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
import { upsertUser } from './portal';
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

  if (!user.isDevBypass) {
    try {
      const db = getDb();
      await assertSchema(db);
      await upsertUser(user.userId, user.email, user.name || undefined);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Database schema missing')) {
        throw error(503, err.message);
      }
      throw err;
    }
  }

  return user;
}
