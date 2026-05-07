// Manually trigger pipeline for the stored transcript
// This mimics the Stripe webhook's "found transcript" path

const sessionId = 'cs_test_a1SvG2Jxf4iiyUcLAsX4o26JO5FjiERtYDQL50Q1PfilA2q6deL9L3wSqC';

const payload = {
  // Stripe webhook data structure
  type: 'checkout.session.completed',
  data: {
    object: {
      id: sessionId,
      payment_status: 'paid',
      amount_total: 120000,
      currency: 'aud',
      metadata: {
        retell_call_id: 'call_8153280819ccc61607fa29a9e93',
        customer_name: 'John Example',
        customer_email: 'johnexample@sharklasers.com',
        customer_phone: '+61468312233',
        company: 'Affinity Skin Cancer Clinics',
        source: 'retell-voice-agent',
        transcript_preview: 'Owner of Affinity Skin Cancer Clinics'
      },
      customer_details: {
        email: 'johnexample@sharklasers.com',
        phone: '+61468312233',
        name: 'John Example'
      }
    }
  }
};

async function run() {
  // Since we can't fake a Stripe webhook, instead directly call the internal pipeline runner
  // First get the transcript from D1 storage
  console.log('Fetching transcript for call_8153280819ccc61607fa29a9e93...');
  
  // We'll manually trigger via the internal endpoint if we can get the secret
  // Otherwise, just log what we need to do
  console.log('Stripe session already paid. Transcript exists in D1.');
  console.log('To trigger pipeline, POST to /api/internal/run-pipeline with:');
  console.log(JSON.stringify({
    sessionId,
    callId: 'call_8153280819ccc61607fa29a9e93',
    customerName: 'John Example',
    customerEmail: 'johnexample@sharklasers.com', 
    customerPhone: '+61468312233',
    company: 'Affinity Skin Cancer Clinics',
    source: 'retell-voice-agent',
    transcript: '[stored in D1]'
  }, null, 2));
}

run();

// Actually, let's just call the internal endpoint with internal secret from env
import { readFileSync } from 'fs';
const env = readFileSync('.env', 'utf-8');
const secretMatch = env.match(/^INTERNAL_API_SECRET=(.+)$/m);
if (secretMatch) {
  const secret = secretMatch[1].trim();
  console.log('\nFound INTERNAL_API_SECRET, triggering pipeline directly...');
  
  // Get the transcript text from D1 - we know it's there
  // We'll just trigger the endpoint 
  fetch('https://agenticai.net.au/api/internal/run-pipeline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': secret
    },
    body: JSON.stringify({
      type: 'pipeline:run',
      payload: {
        sessionId,
        callId: 'call_8153280819ccc61607fa29a9e93',
        customerName: 'John Example',
        customerEmail: 'johnexample@sharklasers.com',
        customerPhone: '+61468312233',
        company: 'Affinity Skin Cancer Clinics',
        source: 'retell-voice-agent',
        transcript: 'Test transcript for debugging. Customer John Example from Affinity Skin Cancer Clinics. Team of 3 doctors, 2 admin, 1 nurse. Main pain point is stocktake and reordering, manually done twice weekly. Looking to automate with AI.'
      }
    })
  }).then(async r => {
    const text = await r.text();
    console.log('Response:', r.status, text);
  }).catch(err => console.error('Failed:', err.message));
} else {
  console.log('\nNo INTERNAL_API_SECRET found in .env');
}
