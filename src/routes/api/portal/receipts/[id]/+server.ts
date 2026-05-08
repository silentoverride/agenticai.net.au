/**
 * GET /api/portal/receipts/[id]
 *
 * Returns a single receipt belonging to the currently signed-in user.
 *
 * @param params.id - The receipt ID.
 * @returns JSON object with the {@link DbReceipt} row.
 * @throws 401 — If the user is not authenticated.
 * @throws 404 — If the receipt is not found or not owned by this user.
 */

import { json, error } from '@sveltejs/kit';
import { getUserReceipt } from '$lib/server/portal';
import { isDatabaseAvailable } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!isDatabaseAvailable()) {
    throw error(503, 'Portal database not available in this environment');
  }

  const auth = locals.auth();
  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const receipt = await getUserReceipt(auth.userId, params.id);
  if (!receipt) {
    throw error(404, 'Receipt not found');
  }

  return json(receipt);
};
