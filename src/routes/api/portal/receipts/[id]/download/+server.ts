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
 * @example
 * // Frontend — open in new tab
 * window.open(`/api/portal/receipts/${receiptId}/download`, '_blank');
 */

import { error } from '@sveltejs/kit';
import { getUserReceipt, upsertUser } from '$lib/server/portal';
import { isDatabaseAvailable } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!isDatabaseAvailable()) {
    throw error(503, 'Portal database not available in this environment');
  }

  const auth = locals.auth();
  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const user = locals.user;
  if (user) {
    await upsertUser(auth.userId, user.email || '', user.name || undefined);
  }

  const receipt = await getUserReceipt(auth.userId, params.id);
  if (!receipt) {
    throw error(404, 'Receipt not found');
  }

  if (receipt.receipt_url) {
    return new Response(null, {
      status: 302,
      headers: { location: receipt.receipt_url }
    });
  }

  const date = receipt.created_at
    ? new Date(receipt.created_at).toLocaleDateString('en-AU', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : '—';

  const amount = receipt.amount_cents
    ? `$${(receipt.amount_cents / 100).toFixed(2)} ${(receipt.currency || 'aud').toUpperCase()}`
    : 'N/A';

  const merchantEmail = env.DEFAULT_FROM_EMAIL || 'hello@agenticai.net.au';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice — ${receipt.company || 'AI Business Assessment'}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a2e;
      max-width: 640px;
      margin: 3rem auto;
      padding: 0 1.5rem;
      line-height: 1.5;
    }
    h1 { font-size: 1.5rem; margin: 0 0 1.5rem 0; border-bottom: 2px solid #1a1a2e; padding-bottom: 0.5rem; }
    .row { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid #f0f0f0; }
    .row.total { border-top: 2px solid #1a1a2e; border-bottom: none; margin-top: 0.5rem; padding-top: 1rem; }
    .label { font-size: 0.875rem; color: #888; flex-shrink: 0; }
    .value { font-size: 0.9375rem; font-weight: 500; text-align: right; word-break: break-all; }
    .value.total { font-size: 1.25rem; font-weight: 700; }
    .value.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.8125rem; color: #666; }
    .logo { font-weight: 700; font-size: 1.125rem; color: #0066ff; margin-bottom: 0.25rem; }
    .meta { font-size: 0.8125rem; color: #666; margin-bottom: 2rem; }
    .actions { margin-top: 2rem; text-align: center; }
    .btn {
      display: inline-block;
      background: #0066ff;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      border: none;
      cursor: pointer;
      font-size: 0.9375rem;
    }
    .btn:hover { background: #0052cc; }
    .hint { margin-top: 0.75rem; font-size: 0.8125rem; color: #888; }
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 1rem; }
    }
  </style>
</head>
<body>
  <div class="logo">Agentic AI</div>
  <div class="meta">ABN: pending &nbsp;|&nbsp; ${merchantEmail}</div>

  <h1>Tax Invoice / Receipt</h1>

  <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
  ${receipt.customer_name ? `<div class="row"><span class="label">Customer</span><span class="value">${escapeHtml(receipt.customer_name)}</span></div>` : ''}
  ${receipt.company ? `<div class="row"><span class="label">Company</span><span class="value">${escapeHtml(receipt.company)}</span></div>` : ''}
  ${receipt.customer_email ? `<div class="row"><span class="label">Email</span><span class="value">${escapeHtml(receipt.customer_email)}</span></div>` : ''}
  <div class="row"><span class="label">Service</span><span class="value">AI Business Assessment</span></div>
  <div class="row total"><span class="label">Total Paid</span><span class="value total">${amount}</span></div>
  ${receipt.stripe_session_id ? `<div class="row"><span class="label">Transaction ID</span><span class="value mono">${escapeHtml(receipt.stripe_session_id)}</span></div>` : ''}

  <div class="actions no-print">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    <p class="hint">Use your browser print dialog (Ctrl+P / Cmd+P) to save as PDF.</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
};

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
