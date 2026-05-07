// Resend Retell webhook with transcript and paid status to trigger pipeline

const RETELL_CALL_ID = 'call_8153280819ccc61607fa29a9e93';
const RETELL_API_KEY = 'key_45f2aee94a3807e3fa5784d34743';

// Generate HMAC-SHA256 signature
async function sign(body, timestamp) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(RETELL_API_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const msg = encoder.encode(body + String(timestamp));
  const sig = await crypto.subtle.sign('HMAC', key, msg);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendWebhook() {
  const timestamp = Date.now();
  
  const payload = {
    event: 'call_analyzed',
    call: {
      call_id: RETELL_CALL_ID,
      agent_id: 'agent_f2c3a329dd93b747959fc1384e',
      transcript: `Interview with John Example, owner of Affinity Skin Cancer Clinics.
Team of 3 doctors, 2 admin, 1 nurse, 1 bookkeeper, plus the owner.
Current tools: Best Practice, Xero, Outlook, Microsoft 365, WordPress, Google Business.
Main pain points: stocktake and reordering manually done twice weekly (5-6 hours), missed enquiries via Facebook/Google, manual report compilation from Xero and Best Practice.
Priority outcome: save owner time.`,
      metadata: {
        customer_name: 'John Example',
        customer_email: 'johnexample@sharklasers.com',
        customer_phone: '+61468312233',
        company: 'Affinity Skin Cancer Clinics',
        payment_status: 'paid',
        caller_role: 'Practice Manager / Owner',
        industry: 'Healthcare, skin cancer clinic',
        team_size: '3 doctors, 2 admin, 1 nurse, 1 bookkeeper, 1 owner',
        current_tools: 'Best Practice, Xero, Outlook, Microsoft 365, WordPress, Google Business',
        top_pain_points: 'Stocktake and stock reordering depend on owner causing risk of stockouts; missed enquiries via Facebook/Google leading to late or missed responses.',
        repeated_tasks: 'Stocktake and reordering, generating weekly doctor income invoices, manual report compilation from Xero and Best Practice',
        operating_rhythm: 'Daily morning huddles with front desk and doctors, email review, stocktakes, bookkeeping review, financial reporting, marketing content creation',
        lead_customer_response_workflow: 'Mostly phone and GP referrals; front desk books appointments, takes basic details, sends SMS reminders, does intake on arrival and updates Best Practice; Facebook/Google messages monitored intermittently leading to missed enquiries',
        reporting_visibility_gaps: 'Weekly reports are manually extracted and compiled into spreadsheets by the bookkeeper',
        lead_response_gap: true,
        knowledge_gap: true,
        manual_reporting_gap: true,
        priority_outcome: 'owner time saved',
        privacy_or_compliance_constraints: 'Patient information is highly confidential and must remain protected; brand consistency for marketing content is required',
        assessment_ready: true,
        verbal_approval_given: true,
        payment_link_sent: true
      },
      duration_ms: 944064,
      recording_url: 'https://example.com/recording.wav',
      from_number: '+61468312233'
    }
  };
  
  const body = JSON.stringify(payload);
  const signature = await sign(body, timestamp);
  
  const res = await fetch('https://agenticai.net.au/api/retell-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-retell-signature': `v=${timestamp},d=${signature}`
    },
    body
  });
  
  console.log('Retell webhook status:', res.status);
  console.log('Response:', await res.text());
  
  return payload;
}

async function monitorStripeSession(sessionId) {
  console.log('\nMonitoring Stripe session:', sessionId);
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await fetch('https://agenticai.net.au/api/assessment-transcript?sessionId=' + sessionId + '&poll=' + i);
    const status = await res.json();
    console.log(`[${i+1}] ${status.status}${status.error ? ' | ' + status.error.slice(0,80) : ''}`);
    
    if (status.status === 'completed' || status.status === 'error') {
      console.log('\nFinal:', JSON.stringify(status, null, 2));
      break;
    }
  }
}

const payload = await sendWebhook();
console.log('\nWebhook sent. Waiting 3s then monitoring...');
await new Promise(r => setTimeout(r, 3000));

// Monitor the NEW Stripe session
await monitorStripeSession('cs_test_a1hQRC1slf3iNM3QEkYBsFp9mwMXCGTJsAuGmNpdeKhIIIc5kI6l8o0Gwp');
