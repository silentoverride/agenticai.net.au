// Resend payment link for call_8153280819ccc61607fa29a9e93
// This mimics Retell calling the create-assessment-checkout endpoint

import { readFileSync } from 'fs';

const retellCallId = 'call_8153280819ccc61607fa29a9e93';
const customerName = 'John Example';
const customerEmail = 'johnexample@sharklasers.com';
const customerPhone = '+61468312233';
const company = 'Affinity Skin Cancer Clinics';

async function resendPaymentLink() {
  const envContent = readFileSync('.env', 'utf-8');
  const secretMatch = envContent.match(/^RETELL_TWILIO_WEBHOOK_SECRET=(.+)$/m);
  const webhookSecret = secretMatch ? secretMatch[1].trim() : null;

  console.log('Requesting new payment link...');
  console.log('Retell Call ID:', retellCallId);
  console.log('Customer:', customerName, '|', customerEmail, '|', customerPhone);

  const payload = {
    source: 'retell-voice-agent',
    customerName,
    customerEmail,
    customerPhone,
    company,
    retellCallId,
    transcriptPreview: 'Owner of Affinity Skin Cancer Clinics. Bulk-billing clinic in Penrith. Team of 3 doctors, 2 admin, 1 nurse. Needs AI automation for stocktake.',
    callerName: customerName,
    callerEmail: customerEmail,
    callerPhone: customerPhone
  };

  try {
    const res = await fetch('https://agenticai.net.au/api/create-assessment-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhookSecret ? { 'x-agenticai-webhook-secret': webhookSecret } : {})
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json().catch(() => ({}));
    
    console.log('\nResponse status:', res.status);
    if (res.ok) {
      console.log('✅ New payment link created');
      console.log('URL:', json.url);
      console.log('SMS:', json.sms);
    } else {
      console.log('❌ Failed:', json.message || json.error || 'Unknown error');
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

resendPaymentLink();
