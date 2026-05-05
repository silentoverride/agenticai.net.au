import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { isTwilioConfigured, sendTwilioSms } from '$lib/server/twilio';
import type { RequestHandler } from './$types';

const amountAudCents = 120000;

type CheckoutRequestBody = {
  args?: CheckoutFields;
} & CheckoutFields;

type CheckoutFields = {
  source?: string;
  transcriptPreview?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  caller_name?: string;
  caller_email?: string;
  caller_phone?: string;
  customer_phone?: string;
  callerPhone?: string;
  callerName?: string;
  callerEmail?: string;
  company?: string;
  retellCallId?: string;
  retell_call_id?: string;
};

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() || '';
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeVoiceEmail(raw: string): string | null {
  let cleaned = raw.trim().toLowerCase();
  cleaned = cleaned.replace(/\s+at\s+/g, '@');
  cleaned = cleaned.replace(/\s+dot\s+/g, '.');
  cleaned = cleaned.replace(/\bat\s+/g, '@');
  cleaned = cleaned.replace(/\bdot\s+/g, '.');
  cleaned = cleaned.replace(/\s+@\s+/g, '@');
  cleaned = cleaned.replace(/\s+\.\s+/g, '.');
  cleaned = cleaned.replace(/\s+/g, '');
  cleaned = cleaned.replace(/\.{2,}/g, '.');
  if (EMAIL_REGEX.test(cleaned)) {
    return cleaned;
  }
  return null;
}

export const POST: RequestHandler = async ({ request, url }) => {
  if (!env.STRIPE_SECRET_KEY) {
    return json(
      {
        message:
          'Stripe checkout is not configured. Set STRIPE_SECRET_KEY in the server environment.'
      },
      { status: 501 }
    );
  }

  const requestBody = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
  const body = requestBody.args || requestBody;
  const customerName = firstString(body.customerName, body.callerName, body.caller_name);
  const customerEmail = firstString(body.customerEmail, body.callerEmail, body.caller_email);
  const customerPhone = firstString(body.customerPhone, body.customer_phone, body.callerPhone, body.caller_phone);
  const retellCallId = firstString(body.retellCallId, body.retell_call_id);

  const siteUrl = env.PUBLIC_SITE_URL || `${url.protocol}//${url.host}`;
  const params = new URLSearchParams();

  params.set('mode', 'payment');
  params.set('success_url', `${siteUrl}/assessment/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${siteUrl}/?assessment=cancelled`);
  params.set('payment_method_types[0]', 'card');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'aud');
  params.set('line_items[0][price_data][unit_amount]', String(amountAudCents));
  params.set('line_items[0][price_data][product_data][name]', 'AI Business Assessment');
  params.set(
    'line_items[0][price_data][product_data][description]',
    'Agentic AI workflow intake, analysis, opportunity report, quick wins, and implementation roadmap.'
  );
  params.set('metadata[source]', body.source || '');
  params.set('metadata[assessment_fee_aud]', '1200.00');
  params.set('metadata[transcript_preview]', (body.transcriptPreview || '').slice(0, 450));
  params.set('metadata[customer_name]', customerName.slice(0, 120));
  params.set('metadata[customer_phone]', customerPhone.slice(0, 60));
  params.set('metadata[company]', (body.company || '').slice(0, 140));
  params.set('metadata[retell_call_id]', retellCallId.slice(0, 64));
  params.set('allow_promotion_codes', 'false');
  params.set('billing_address_collection', 'auto');
  params.set('phone_number_collection[enabled]', 'true');

  const sanitizedEmail = customerEmail ? sanitizeVoiceEmail(customerEmail) : null;
  if (sanitizedEmail) {
    params.set('customer_email', sanitizedEmail);
    params.set('metadata[customer_email]', sanitizedEmail);
  }

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'agenticai.net.au/1.0 (SvelteKit; Cloudflare Pages)',
      accept: 'application/json'
    },
    body: params
  });

  const stripeBody = (await stripeResponse.json()) as { url: string; error?: { message?: string } };

  if (!stripeResponse.ok) {
    return json(
      {
        message: stripeBody.error?.message || 'Unable to create Stripe Checkout session.'
      },
      { status: stripeResponse.status }
    );
  }

  const responseBody: {
    url: string;
    sms?: {
      sent: boolean;
      sid?: string;
      status?: string;
      message?: string;
    };
  } = { url: stripeBody.url };

  if (body.source === 'retell-voice-agent' && customerPhone && isTwilioConfigured()) {
    const message = `Hi${customerName ? ` ${customerName}` : ''}, your secure Agentic AI Business Assessment payment link is ${stripeBody.url}. Once payment is complete, your transcript will be queued for analysis.`;

    try {
      const sms = await sendTwilioSms(customerPhone, message);
      responseBody.sms = { sent: true, sid: sms.sid, status: sms.status };
    } catch (error: any) {
      responseBody.sms = { sent: false, status: 'failed', message: error instanceof Error ? error.message : 'SMS failed' };
    }
  }

  return json(responseBody);
};
