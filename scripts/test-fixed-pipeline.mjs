// Quick reset + re-trigger old session with deployed fix
const SESSION = 'cs_test_a1P8OLPOYArKQXCLXqXvzQOWUcm4OKDdzIEc4lWy7p66canoh1MHRPnvh8';
const INTERNAL_SECRET = 'cPf7vcbN2injNsoN/HHdKzOOXjfnYvS1GYmb3ua8H+Q=';
const JOB = {
  receivedAt: new Date().toISOString(),
  source: 'retell-voice-agent',
  event: 'call_analyzed',
  callId: 'call_8153280819ccc61607fa29a9e93',
  sessionId: SESSION,
  customerName: 'John Example',
  customerEmail: 'johnexample@sharklasers.com',
  customerPhone: '+61468312233',
  company: 'Affinity Skin Cancer Clinics',
  paymentStatus: 'paid',
  transcript: `Interview with John Example, owner of Affinity Skin Cancer Clinics. Team of 3 doctors, 2 admin, 1 nurse, 1 bookkeeper, plus the owner. Current tools: Best Practice, Xero, Outlook, Microsoft 365, WordPress, Google Business. Main pain points: stocktake and reordering manually done twice weekly (5-6 hours), missed enquiries via Facebook/Google, manual report compilation from Xero and Best Practice. Priority outcome: save owner time.`,
  callDurationMs: 944064,
  callerRole: 'Practice Manager / Owner',
  industry: 'Healthcare, skin cancer clinic',
  teamSize: '3 doctors, 2 admin, 1 nurse, 1 bookkeeper, 1 owner',
  currentTools: 'Best Practice, Xero, Outlook, Microsoft 365, WordPress, Google Business',
  topPainPoints: 'Stocktake and stock reordering depend on owner causing risk of stockouts; missed enquiries via Facebook/Google leading to late or missed responses.',
  repeatedTasks: 'Stocktake and reordering, generating weekly doctor income invoices, manual report compilation from Xero and Best Practice',
  operatingRhythm: 'Daily morning huddles with front desk and doctors, email review, stocktakes, bookkeeping review, financial reporting, marketing content creation',
  leadCustomerResponseWorkflow: 'Mostly phone and GP referrals; front desk books appointments, takes basic details, sends SMS reminders, does intake on arrival and updates Best Practice; Facebook/Google messages monitored intermittently leading to missed enquiries',
  reportingVisibilityGaps: 'Weekly reports are manually extracted and compiled into spreadsheets by the bookkeeper',
  leadResponseGap: true,
  knowledgeGap: true,
  manualReportingGap: true,
  priorityOutcome: 'owner time saved',
  privacyOrComplianceConstraints: 'Patient information is highly confidential and must remain protected; brand consistency for marketing content is required',
  assessmentReady: true,
  verbalApprovalGiven: true,
  paymentLinkSent: true
};

async function run() {
  console.log('Triggering pipeline with deployed fix (120s timeout, deepseek-v4-flash, 4096 tokens)...');
  const start = Date.now();
  
  const res = await fetch('https://agenticai.net.au/api/internal/run-pipeline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET
    },
    body: JSON.stringify(JOB)
  });
  
  console.log('Trigger status:', res.status);
  const data = await res.json();
  console.log('Trigger response:', JSON.stringify(data, null, 2));
  
  // Monitor
  console.log('\nMonitoring...');
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const s = await fetch('https://agenticai.net.au/api/assessment-transcript?sessionId=' + SESSION + '&poll=' + i);
    const status = await s.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[${elapsed}s] ${status.status}${status.error ? ' | ' + status.error.slice(0, 80) : ''}`);
    
    if (status.status === 'completed' || status.status === 'error') {
      console.log('\nFINAL:', JSON.stringify(status, null, 2));
      break;
    }
  }
}

run().catch(console.error);
