import { env } from '$env/dynamic/private';

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
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

interface StripeCheckoutSession {
  id: string;
  status: string;
  payment_status?: string;
  metadata: Record<string, string>;
  customer_email?: string;
  customer_details?: {
    email?: string;
    phone?: string;
    name?: string;
  };
  amount_total?: number;
  currency?: string;
}

export async function getCheckoutSession(sessionId: string): Promise<StripeCheckoutSession | null> {
  if (!env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY not configured');
    return null;
  }

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    const error = await response.text().catch(() => '');
    console.error('Stripe session fetch failed:', response.status, error);
    return null;
  }

  const data = await response.json();

  return {
    id: data.id,
    status: data.status,
    payment_status: data.payment_status,
    metadata: data.metadata || {},
    customer_email: data.customer_email,
    customer_details: data.customer_details,
    amount_total: data.amount_total,
    currency: data.currency
  };
}
