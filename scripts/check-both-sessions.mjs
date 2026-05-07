const oldSession = 'cs_test_a1SvG2Jxf4iiyUcLAsX4o26JO5FjiERtYDQL50Q1PfilA2q6deL9L3wSqC';
const newSession = 'cs_test_a1P8OLPOYArKQXCLXqXvzQOWUcm4OKDdzIEc4lWy7p66canoh1MHRPnvh8';

async function check(sessionId, label) {
  const res = await fetch(`https://agenticai.net.au/api/assessment-transcript?sessionId=${sessionId}`);
  const json = await res.json();
  console.log(`\n${label} (${sessionId.slice(0, 32)}...)`);
  console.log(JSON.stringify(json, null, 2));
}

await check(oldSession, 'OLD session (original)');
await check(newSession, 'NEW session (just created)');

// Also check Stripe status of new session
import { readFileSync } from 'fs';
const env = readFileSync('.env', 'utf-8');
const keyMatch = env.match(/^STRIPE_SECRET_KEY=(.+)$/m);
if (keyMatch) {
  const key = keyMatch[1].trim();
  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${newSession}?expand[]=payment_intent`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  const stripeJson = await stripeRes.json();
  console.log('\nStripe new session:');
  console.log({ status: stripeJson.status, payment_status: stripeJson.payment_status, url: stripeJson.url?.slice(0,50)+'...' });
}
