/**
 * GET /api/portal/receipts/[id]
 *
 * Returns a single receipt by ID for the authenticated user.
 *
 * @returns {@link DbReceipt} row.
 * @throws 401 — If the user is not authenticated.
 * @throws 404 — If the receipt is not found.
 */

import { json, error } from '@sveltejs/kit';
import { requirePortalAuth } from '$lib/server/portal-auth';
import { getUserReceipt } from '$lib/server/portal';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const { userId } = await requirePortalAuth(locals, url);
  const receipt = await getUserReceipt(userId, params.id);
  if (!receipt) {
    throw error(404, 'Receipt not found');
  }

  return json(receipt);
};
