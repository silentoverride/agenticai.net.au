import { env } from '$env/dynamic/private';
import { json, text } from '@sveltejs/kit';
import { getTranscript, deleteTranscript, runReportPipeline } from '$lib/server/assessment-report';
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

    // For voice-agent flow: if retell_call_id is in metadata, run report pipeline directly
    const retellCallId = metadata.retell_call_id;
    if (retellCallId) {
      const stored = getTranscript(retellCallId);
      if (stored?.transcript) {
        const transcript = stored.transcript;
        const customerName = metadata.customer_name || session.customer_details?.name || '';
        const customerEmail = metadata.customer_email || session.customer_details?.email || '';
        const customerPhone = metadata.customer_phone || session.customer_details?.phone || '';
        const company = metadata.company || '';

        // Fire-and-forget local pipeline
        runReportPipeline({
          receivedAt: record.receivedAt,
          source: 'retell-voice-agent',
          sessionId: session.id,
          customerName,
          customerEmail,
          customerPhone,
          company,
          transcript
        }).then((result) => {
          console.info('Pipeline completed for retell call', { callId: retellCallId, reportId: result.savedReport?.id });
        }).catch((error) => {
          console.error('Pipeline failed for retell call', { callId: retellCallId, error: String(error) });
        });

        deleteTranscript(retellCallId);
      } else {
        console.info('Payment confirmed for retell call, but transcript not yet available', { callId: retellCallId });
      }
    }
  }

  return new Response(null, { status: 200 });
};
