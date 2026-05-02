/**
 * GET /api/portal/reports
 *
 * Returns all assessment reports belonging to the currently signed-in user.
 * Automatically syncs the Clerk user to the local database and triggers
 * orphan record linking (reports + receipts) by email on first load.
 *
 * @returns JSON array of {@link DbReport} rows.
 * @throws 401 — If the user is not authenticated.
 * @example
 * // Frontend
 * const res = await fetch('/api/portal/reports');
 * if (res.status === 401) { /* redirect to sign-in *\/ }
 * const reports = await res.json();
 */

import { json, error } from '@sveltejs/kit';
import { getUserReports, upsertUser, scanAndLinkReportsByEmail, linkPendingReceiptsByEmail } from '$lib/server/portal';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const auth = locals.auth();
  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const user = locals.user;
  if (user) {
    upsertUser(auth.userId, user.email || '', user.name || undefined);
    const linkedReports = scanAndLinkReportsByEmail(auth.userId, user.email || '');
    const linkedReceipts = linkPendingReceiptsByEmail(auth.userId, user.email || '');
    if (linkedReports > 0 || linkedReceipts > 0) {
      console.info('Auto-linked records on portal login', { userId: auth.userId, linkedReports, linkedReceipts });
    }
  }

  const reports = getUserReports(auth.userId);
  return json(reports);
};
