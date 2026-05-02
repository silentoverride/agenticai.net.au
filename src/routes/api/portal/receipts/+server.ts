/**
 * GET /api/portal/receipts
 *
 * Returns all Stripe payment receipts belonging to the currently signed-in user.
 * Automatically syncs the Clerk user and links any pending receipts that match
 * the user's email address.
 *
 * @returns JSON array of {@link DbReceipt} rows.
 * @throws 401 — If the user is not authenticated.
 * @example
 * // Frontend
 * const res = await fetch('/api/portal/receipts');
 * const receipts = await res.json();
 * console.log(receipts[0].amount_cents);
 */

import { json, error } from '@sveltejs/kit';
import { getUserReceipts, upsertUser, linkPendingReceiptsByEmail } from '$lib/server/portal';
import { isDatabaseAvailable } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (!isDatabaseAvailable()) {
    throw error(503, 'Portal database not available in this environment');
  }

  const auth = locals.auth();
  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const user = locals.user;
  if (user) {
    upsertUser(auth.userId, user.email || '', user.name || undefined);
    const linked = linkPendingReceiptsByEmail(auth.userId, user.email || '');
    if (linked > 0) {
      console.info('Auto-linked receipts on portal load', { userId: auth.userId, linked });
    }
  }

  const receipts = getUserReceipts(auth.userId);
  return json(receipts);
};
