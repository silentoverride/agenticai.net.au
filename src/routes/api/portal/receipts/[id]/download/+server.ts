/**
 * GET /api/portal/receipts/[id]/download
 *
 * Downloads or redirects to a single receipt. If the receipt has a Stripe
 * `receipt_url`, the client is redirected there. Otherwise a JSON receipt
 * payload is returned for display or manual download.
 *
 * @param params.id - The receipt ID (local primary key from the `receipts` table).
 * @returns 302 redirect to Stripe receipt URL, or JSON receipt payload.
 * @throws 401 — If the user is not authenticated.
 * @throws 404 — If the receipt is not found or not owned by this user.
 * @example
 * // Frontend — open in new tab
 * window.open(`/api/portal/receipts/${receiptId}/download`, '_blank');
 */

import { json, error } from '@sveltejs/kit';
import { getUserReceipt, upsertUser } from '$lib/server/portal';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  const auth = locals.auth();
  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const user = locals.user;
  if (user) {
    upsertUser(auth.userId, user.email || '', user.name || undefined);
  }

  const receipt = getUserReceipt(auth.userId, params.id);
  if (!receipt) {
    throw error(404, 'Receipt not found');
  }

  if (receipt.receipt_url) {
    return new Response(null, {
      status: 302,
      headers: { location: receipt.receipt_url }
    });
  }

  return json({
    id: receipt.id,
    date: receipt.created_at,
    amount: receipt.amount_cents ? `$${(receipt.amount_cents / 100).toFixed(2)}` : 'N/A',
    currency: receipt.currency?.toUpperCase(),
    customer_name: receipt.customer_name,
    company: receipt.company,
    description: `AI Business Assessment — ${receipt.company || 'General'}`,
    merchant: 'Agentic AI',
    merchant_email: env.DEFAULT_FROM_EMAIL || 'hello@agenticai.net.au'
  });
};
