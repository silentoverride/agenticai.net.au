import { env } from '$env/dynamic/private';
import { json, text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const parts = signature.split(',').reduce(
    (acc, part) => {
      const [key, val] = part.split('=');
      acc[key.trim()] = val;
      return acc;
    },
    {} as Record<string, string>
  );

  const timestamp = parts.t || '';
  const v1 = parts.v1 || '';

  if (!timestamp || !v1) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expected = bytesToHex(sig);
  return expected === v1;
}

export const POST: RequestHandler = async ({ request }) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return text('Webhook secret not configured', { status: 501 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  const isValid = await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

  if (!isValid) {
    return text('Invalid signature', { status: 401 });
  }

  let event: Record<string, any>;

  try {
    event = JSON.parse(rawBody || '{}');
  } catch {
    return text('Invalid JSON payload', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object || {};
    const metadata = session.metadata || {};

    const record = {
      receivedAt: new Date().toISOString(),
      event: event.type,
      stripeSessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || metadata.customer_email || null,
      customerPhone: session.customer_details?.phone || metadata.customer_phone || null,
      customerName: metadata.customer_name || null,
      company: metadata.company || null,
      source: metadata.source || 'unknown',
      transcriptPreview: metadata.transcript_preview || null,
      assessmentFeeAud: metadata.assessment_fee_aud || null
    };

    console.info('Stripe payment confirmed', JSON.stringify(record));

    if (env.ASSESSMENT_REPORT_AGENT_WEBHOOK_URL) {
      try {
        await fetch(env.ASSESSMENT_REPORT_AGENT_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(env.ASSESSMENT_REPORT_AGENT_WEBHOOK_SECRET
              ? { authorization: `Bearer ${env.ASSESSMENT_REPORT_AGENT_WEBHOOK_SECRET}` }
              : {})
          },
          body: JSON.stringify({
            type: 'stripe.payment.confirmed',
            ...record
          })
        });
      } catch (err) {
        console.error('Report agent notification failed for payment', err);
      }
    }
  }

  return new Response(null, { status: 200 });
};
