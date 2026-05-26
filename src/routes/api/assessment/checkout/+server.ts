/**
 * POST /api/assessment/checkout
 *
 * Creates a Stripe Checkout session for the Annie chat intake flow.
 * After successful payment, Stripe redirects to success page and the
 * webhook handler queues the pipeline job.
 *
 * Returns the checkout URL for client-side redirect.
 */

import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { apiError } from '$lib/server/api-error';
import { setPipelineStatus, getPipelineStatus } from '$lib/server/assessment/pipeline-store';
import type { RequestHandler } from './$types';

interface SummaryItem {
  question: string;
  answer: string;
  followUpAnswer?: string;
}

interface CheckoutBody {
  sessionId: string;
  summary: SummaryItem[];
  customerName?: string;
  customerEmail?: string;
  company?: string;
  source?: string;
}

const AMOUNT_AUD_CENTS = 120000; // $1,200 AUD

export const POST: RequestHandler = async ({ request, url }) => {
  if (!env.STRIPE_SECRET_KEY) {
    throw apiError(501, 'Stripe checkout is not configured. Set STRIPE_SECRET_KEY in the server environment.');
  }

  const payload = await request.json<CheckoutBody>().catch(() => null);
  if (!payload?.sessionId || !payload?.summary || payload.summary.length === 0) {
    throw apiError(400, 'Missing required fields: sessionId, summary');
  }

  const siteUrl = env.PUBLIC_SITE_URL || `${url.protocol}//${url.host}`;
  const idempotencyKey = `checkout-${payload.sessionId}-${Date.now()}`;

  // Check if already paid (reconciliation guard)
  try {
    const existing = await getPipelineStatus(payload.sessionId);
    if (existing?.status === 'queued' || existing?.status === 'running_llm' || existing?.status === 'completed') {
      throw apiError(409, 'Assessment already has active pipeline processing.');
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err && (err as any).status === 409) throw err;
    // Ignore — pipeline status may not exist yet
  }

  // Build a brief summary of intake answers for Stripe metadata (max 450 chars per field)
  const summaryText = payload.summary
    .map(s => `${s.question}: ${s.answer}${s.followUpAnswer ? ` (follow-up: ${s.followUpAnswer})` : ''}`)
    .join('\n')
    .slice(0, 450);

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${siteUrl}/assessment/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${siteUrl}/?assessment=cancelled`);
  params.set('payment_method_types[0]', 'card');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'aud');
  params.set('line_items[0][price_data][unit_amount]', String(AMOUNT_AUD_CENTS));
  params.set('line_items[0][price_data][product_data][name]', 'AI Business Assessment');
  params.set(
    'line_items[0][price_data][product_data][description]',
    'Agentic AI Annie conversation, workflow analysis, 48-hour opportunity report, quick wins, and optional 30-minute consultation.'
  );
  params.set('metadata[source]', payload.source || 'annie-chat-intake');
  params.set('metadata[session_id]', payload.sessionId);
  params.set('metadata[assessment_fee_aud]', '1200.00');
  params.set('metadata[summary_preview]', summaryText);
  params.set('metadata[customer_name]', (payload.customerName || '').slice(0, 120));
  params.set('metadata[company]', (payload.company || '').slice(0, 140));
  params.set('allow_promotion_codes', 'false');
  params.set('billing_address_collection', 'auto');

  if (payload.customerEmail) {
    params.set('customer_email', payload.customerEmail);
    params.set('metadata[customer_email]', payload.customerEmail);
  }

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'agenticai.net.au/1.0 (SvelteKit; Cloudflare Pages)',
      'idempotency-key': idempotencyKey,
      accept: 'application/json'
    },
    body: params
  });

  const stripeBody = (await stripeResponse.json()) as { url: string; error?: { message?: string } };

  if (!stripeResponse.ok) {
    throw apiError(stripeResponse.status, stripeBody.error?.message || 'Unable to create Stripe Checkout session.');
  }

  // Save pipeline status as 'pending_payment' so the success page can show status
  await setPipelineStatus(payload.sessionId, { status: 'pending_payment' }).catch((err: Error) => {
    console.warn('[checkout] Could not save pending pipeline status:', err);
  });

  return json({ url: stripeBody.url });
};
