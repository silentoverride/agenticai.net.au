import { env } from '$env/dynamic/private';

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
