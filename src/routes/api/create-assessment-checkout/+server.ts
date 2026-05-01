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
  caller_phone?: string;
  customer_phone?: string;
  callerPhone?: string;
  company?: string;
  retellCallId?: string;
  retell_call_id?: string;
};

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() || '';
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
  params.set('metadata[source]', body.source || 'website-chatbot');
  params.set('metadata[assessment_fee_aud]', '1200.00');
  params.set('metadata[transcript_preview]', (body.transcriptPreview || '').slice(0, 450));
  params.set('metadata[customer_name]', (body.customerName || '').slice(0, 120));
  params.set('metadata[customer_phone]', customerPhone.slice(0, 60));
  params.set('metadata[company]', (body.company || '').slice(0, 140));
  params.set('metadata[retell_call_id]', retellCallId.slice(0, 64));
  params.set('allow_promotion_codes', 'false');
  params.set('billing_address_collection', 'auto');
  params.set('phone_number_collection[enabled]', 'true');

  if (body.customerEmail) {
    params.set('customer_email', body.customerEmail);
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

  const stripeBody = await stripeResponse.json();

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
    const message = `Hi${body.customerName ? ` ${body.customerName}` : ''}, your secure Agentic AI Business Assessment payment link is ${stripeBody.url}. Once payment is complete, your transcript will be queued for analysis.`;
    responseBody.sms = { sent: false, status: 'queued' };

    sendTwilioSms(customerPhone, message)
      .then((sms) => {
        console.info('Assessment payment link SMS sent', {
          to: sms.to,
          sid: sms.sid,
          status: sms.status
        });
      })
      .catch((error) => {
        console.error('Unable to send assessment payment link SMS:', error);
      });
  }

  return json(responseBody);
};
