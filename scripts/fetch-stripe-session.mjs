// Fetch Stripe checkout session details
const sessionId = 'cs_test_a1SvG2Jxf4iiyUcLAsX4o26JO5FjiERtYDQL50Q1PfilA2q6deL9L3wSqC';
const key = 'process.env.STRIPE_TEST_KEY || "sk_test_..."';

const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
  headers: {
    'Authorization': `Basic ${btoa(key + ':')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
});

const data = await response.json();
console.log(JSON.stringify({
  id: data.id,
  status: data.status,
  payment_status: data.payment_status,
  metadata: data.metadata,
  customer_email: data.customer_email,
  customer_details: data.customer_details,
  created: data.created,
  amount_total: data.amount_total,
  currency: data.currency,
}, null, 2));
