/**
 * GET /api/portal/receipts/[id]/download
 *
 * Downloads or redirects to a single receipt. If the receipt has a Stripe
 * `receipt_url`, the client is redirected there. Otherwise a styled HTML
 * tax-invoice page is returned so the user can print / save as PDF.
 *
 * @param params.id - The receipt ID (local primary key from the `receipts` table).
 * @returns 302 redirect to Stripe receipt URL, or a printable HTML page.
 * @throws 401 — If the user is not authenticated.
 * @throws 404 — If the receipt is not found or not owned by this user.
 */

import { error } from '@sveltejs/kit';
import { requirePortalAuth } from '$lib/server/portal-auth';
import { getUserReceipt } from '$lib/server/portal';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const { userId } = await requirePortalAuth(locals, url);

  const receipt = await getUserReceipt(userId, params.id);
  if (!receipt) {
    throw error(404, 'Receipt not found');
  }

  // If Stripe provided a receipt_url, redirect the client there
  if (receipt.receipt_url) {
    return new Response(null, {
      status: 302,
      headers: { Location: receipt.receipt_url },
    });
  }

  // Otherwise generate a styled HTML tax invoice for printing
  const invoice = generateHtmlInvoice(receipt);
  return new Response(invoice, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="receipt-${receipt.id}.html"`,
    },
  });
};

function generateHtmlInvoice(receipt: NonNullable<Awaited<ReturnType<typeof getUserReceipt>>>): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice — ${receipt.customer_name || 'Receipt'}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 2rem; background: #f5f5f5; }
    .invoice { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #1a1a2e; }
    .meta { color: #666; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.75rem 0; border-bottom: 1px solid #e0e0e0; }
    th { color: #666; font-weight: 500; }
    .total { font-size: 1.25rem; font-weight: 600; }
    .actions { margin-top: 1.5rem; display: flex; gap: 0.75rem; }
    .btn { padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; font-size: 0.875rem; }
    .btn-primary { background: #0066ff; color: white; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    @media print { body { background: white; } .invoice { box-shadow: none; } .actions { display: none; } }
  </style>
</head>
<body>
  <div class="invoice">
    <h1>Tax Invoice</h1>
    <p class="meta">${new Date(receipt.created_at).toLocaleDateString('en-AU')}</p>
    <table>
      <tr><th>Customer</th><td>${receipt.customer_name || ''}</td></tr>
      <tr><th>Email</th><td>${receipt.customer_email || ''}</td></tr>
      <tr><th>Company</th><td>${receipt.company || 'N/A'}</td></tr>
      <tr><th>Service</th><td>AI Business Assessment</td></tr>
      <tr><th class="total">Total Paid</th><td class="total">$${(receipt.amount_cents! / 100).toFixed(2)} ${receipt.currency?.toUpperCase()}</td></tr>
      <tr><th>Transaction ID</th><td>${receipt.stripe_session_id || ''}</td></tr>
    </table>
    <div class="actions">
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;
}
