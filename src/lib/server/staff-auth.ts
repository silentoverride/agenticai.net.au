import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

const STAFF_ROLES = new Set(['staff', 'admin']);

/** Allow bypass in dev mode when Clerk is misconfigured or loop fails */
const DEV_BYPASS_EMAILS = (import.meta.env.DEV
  ? (process.env.DEV_STAFF_EMAILS || '').split(',').filter(Boolean)
  : []);

function logAuthEvent(event: 'attempt' | 'success' | 'failure', userId: string | null, role: string | null, reason?: string) {
  console.log(JSON.stringify({
    audit: 'staff-auth',
    event,
    userId,
    role,
    reason,
    timestamp: new Date().toISOString(),
  }));
}

export async function requireStaff(locals: App.Locals, db?: D1Database): Promise<string> {
  let auth: { userId: string | null };

  try {
    auth = locals.auth();
  } catch (err) {
    // Clerk session invalid/misconfigured in dev — allow bypass
    if (import.meta.env.DEV) {
      console.warn('[staff-auth] Clerk auth() threw — dev bypass active', String(err));
      return 'admin';
    }
    logAuthEvent('failure', null, null, 'auth_error');
    throw error(401, 'Authentication error');
  }

  if (!auth.userId) {
    // In dev mode, allow bypass so local dev doesn't require working Clerk
    if (import.meta.env.DEV) {
      console.warn('[staff-auth] No Clerk userId — dev bypass: role=admin');
      return 'admin';
    }
    logAuthEvent('failure', null, null, 'not_authenticated');
    throw error(401, 'Not authenticated');
  }

  logAuthEvent('attempt', auth.userId, null);

  const role = db
    ? await getD1Role(db, auth.userId)
    : await getLocalRole(auth.userId);

  if (!role || !STAFF_ROLES.has(role)) {
    logAuthEvent('failure', auth.userId, role, 'forbidden');
    throw error(403, 'Operator access required');
  }

  logAuthEvent('success', auth.userId, role);
  return role;
}

export async function requireAdmin(locals: App.Locals, db?: D1Database): Promise<string> {
  const role = await requireStaff(locals, db);

  if (role !== 'admin') {
    logAuthEvent('failure', locals.auth?.()?.userId ?? null, role, 'admin_required');
    throw error(403, 'Admin access required');
  }

  return role;
}

async function getD1Role(db: D1Database, userId: string): Promise<string | null> {
  const row = await db
    .prepare('SELECT role FROM users WHERE clerk_id = ?')
    .bind(userId)
    .first<{ role: string | null }>();

  return row?.role ?? null;
}

async function getLocalRole(userId: string): Promise<string | null> {
  const row = await getDb().queryOne<{ role: string | null }>(
    'SELECT role FROM users WHERE clerk_id = ?',
    userId
  );

  return row?.role ?? null;
}
