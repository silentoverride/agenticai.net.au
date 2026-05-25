import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

const OPERATOR_ROLES = new Set(['operator', 'admin']);

export async function requireOperator(locals: App.Locals, db?: D1Database): Promise<string> {
  const auth = locals.auth();

  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const role = db
    ? await getD1Role(db, auth.userId)
    : await getLocalRole(auth.userId);

  if (!role || !OPERATOR_ROLES.has(role)) {
    throw error(403, 'Operator access required');
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
