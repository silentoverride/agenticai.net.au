import { redirect } from '@sveltejs/kit';
import { resolveUser } from '$lib/server/auth';
import { isDatabaseAvailable, getDb } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = resolveUser(locals, url);

  // Check if the user has a staff role — if so, send them to the operator dashboard
  if (isDatabaseAvailable()) {
    try {
      const db = getDb();
      const row = await db.queryOne<{ role: string | null }>(
        'SELECT role FROM users WHERE clerk_id = ?',
        user.userId
      );
      if (row?.role === 'operator' || row?.role === 'admin') {
        throw redirect(302, '/operator/dashboard');
      }
    } catch (err) {
      // Re-throw redirect errors, swallow others and fall through to client portal
      if (err instanceof Response) throw err;
      console.warn('[dashboard] role lookup failed:', err);
    }
  }

  throw redirect(302, `/portal/${user.userId}`);
};
