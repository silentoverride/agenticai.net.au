const sessionId = 'cs_test_a1SvG2Jxf4iiyUcLAsX4o26JO5FjiERtYDQL50Q1PfilA2q6deL9L3wSqC';
const key = 'process.env.STRIPE_TEST_KEY || "sk_test_..."';

const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
});

const json = await res.json();
console.log(JSON.stringify({
  id: json.id,
  status: json.status,
  payment_status: json.payment_status,
  metadata: json.metadata,
  customer_email: json.customer_email,
  customer_details: json.customer_details,
}, null, 2));
