import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const amountAudCents = 120000;

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

  const requestBody = (await request.json().catch(() => ({}))) as {
    args?: {
      source?: string;
      transcriptPreview?: string;
      customerEmail?: string;
      customerName?: string;
      customerPhone?: string;
      company?: string;
    };
    source?: string;
    transcriptPreview?: string;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    company?: string;
  };
  const body = requestBody.args || requestBody;

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
  params.set('metadata[customer_phone]', (body.customerPhone || '').slice(0, 60));
  params.set('metadata[company]', (body.company || '').slice(0, 140));
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
      'content-type': 'application/x-www-form-urlencoded'
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

  return json({ url: stripeBody.url });
};
