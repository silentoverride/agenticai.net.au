/**
 * GET/POST /api/portal/access
 *
 * Admin endpoint for managing portal access.
 * GET  — list all users with their access status
 * POST — grant or revoke portal access for a specific customer
 *
 * Only staff and admins can use this endpoint.
 */
import { json, error } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';
import { getDb, assertSchema, isDatabaseAvailable } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform }) => {
  const db = platform?.env?.assessment_db;
  await requireStaff(locals, db);

  if (!isDatabaseAvailable()) {
    throw error(503, 'Database not available');
  }

  const localDb = getDb();
  await assertSchema(localDb);

  const rows = await localDb.queryAll(`
    SELECT u.clerk_id, u.email, u.name, u.role, u.company, u.created_at,
           (SELECT COUNT(*) FROM reports WHERE user_id = u.clerk_id) as report_count,
           (SELECT COUNT(*) FROM receipts WHERE user_id = u.clerk_id) as receipt_count
    FROM users u
    ORDER BY u.created_at DESC
  `);

  return json({ users: rows });
};

export const POST: RequestHandler = async ({ locals, request, platform }) => {
  const db = platform?.env?.assessment_db;
  await requireStaff(locals, db);

  if (!isDatabaseAvailable()) {
    throw error(503, 'Database not available');
  }

  const body = (await request.json()) as { clerkId?: string; action?: string };
  const { clerkId, action } = body;

  if (!clerkId || !action || !['grant', 'revoke', 'set_admin'].includes(action)) {
    throw error(400, 'Invalid request. Required: clerkId, action (grant|revoke|set_admin)');
  }

  const localDb = getDb();
  await assertSchema(localDb);

  if (action === 'set_admin') {
    await localDb.exec('UPDATE users SET role = ? WHERE clerk_id = ?', 'admin', clerkId);
  } else {
    // For pilot: grant/revoke means enabling/disabling portal access
    // We use role field: 'client' = access granted, 'revoked' = access denied
    const newRole = action === 'grant' ? 'client' : 'revoked';
    await localDb.exec('UPDATE users SET role = ? WHERE clerk_id = ?', newRole, clerkId);
  }

  return json({ success: true, clerkId, action });
};
