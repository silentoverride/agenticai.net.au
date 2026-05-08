/**
 * GET /api/portal/receipts
 *
 * Returns all Stripe payment receipts belonging to the currently signed-in user.
 * Automatically syncs the Clerk user and links any pending receipts that match
 * the user's email address.
 *
 * @returns JSON array of {@link DbReceipt} rows.
 * @throws 401 — If the user is not authenticated.
 */

import { json } from '@sveltejs/kit';
import { requirePortalAuth } from '$lib/server/portal-auth';
import { getUserReceipts, linkPendingReceiptsByEmail } from '$lib/server/portal';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
  const { userId, email } = await requirePortalAuth(locals, url);

  const linked = await linkPendingReceiptsByEmail(userId, email);
  if (linked > 0) {
    console.info('Auto-linked receipts on portal load', { userId, linked });
  }

  const receipts = await getUserReceipts(userId);
  return json(receipts);
};
