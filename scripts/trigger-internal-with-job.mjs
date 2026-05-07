// Direct internal pipeline trigger with full job payload

const SESSION_ID = 'cs_test_a1P8OLPOYArKQXCLXqXvzQOWUcm4OKDdzIEc4lWy7p66canoh1MHRPnvh8';
const RETELL_CALL_ID = 'call_8153280819ccc61607fa29a9e93';
const INTERNAL_SECRET = 'cPf7vcbN2injNsoN/HHdKzOOXjfnYvS1GYmb3ua8H+Q=';

const job = {
  receivedAt: new Date().toISOString(),
  source: 'retell-voice-agent',
  event: 'call_analyzed',
  callId: RETELL_CALL_ID,
  sessionId: SESSION_ID,
  agentId: 'agent_f2c3a329dd93b747959fc1384e',
  customerName: 'John Example',
  customerEmail: 'johnexample@sharklasers.com',
  customerPhone: '+61468312233',
  company: 'Affinity Skin Cancer Clinics',
  paymentStatus: 'paid',
  transcript: `Interview with John Example, owner of Affinity Skin Cancer Clinics.

Team composition: 3 doctors, 2 admin staff, 1 nurse, 1 bookkeeper, plus the owner.

Current software tools: Best Practice (medical practice management), Xero (accounting), Outlook, Microsoft 365, WordPress website, Google Business Profile.

Key pain points identified:
1. Stocktake and stock reordering is done manually, taking 2-3 hours twice weekly. This is entirely dependent on the owner, creating a significant bottleneck and risk of stockouts of medical supplies.
2. Missed enquiries via Facebook and Google leading to late or missed responses to potential patients.
3. Manual report compilation from Xero and Best Practice for weekly P&L, doctor income, and balance sheet.

Repeated tasks consuming significant time:
- Stocktake and reordering (5-6 hours/week)
- Generating weekly doctor income invoices (2 hours/week)
- Manual report compilation and data extraction (3 hours/week)

Operating rhythm:
Daily morning huddles with front desk and doctors, email review, stock audits, bookkeeping review, financial reporting, and marketing content creation. Front desk handles bookings and intake, clinicians see patients, owner and bookkeeper run back office.

Lead response workflow:
Most inquiries come via phone and GP referrals. Front desk books appointments, takes basic details, sends SMS reminders, does intake on arrival, and updates Best Practice. Facebook and Google messages are monitored intermittently, leading to missed inquiries.

Knowledge documentation:
Procedures stored on shared drive and a physical front-desk folder. Generally well documented.

Reporting gaps:
Weekly reports (bookings, cancellations, income by doctor/item, P&L, balance sheet) are manually extracted and compiled into spreadsheets by the bookkeeper.

Priority outcome: Save owner time and reduce manual administrative burden.

Confidentiality requirements: Patient information is highly confidential and must remain protected. Brand consistency for marketing content is required.

The owner expressed interest in AI-powered automation to streamline stock management, patient communication, and reporting.
`,
  callDurationMs: 944064,
  disconnectionReason: 'agent_hangup',
  recordingUrl: 'https://example.com/recording.wav',
  fromNumber: '+61468312233',
  callerRole: 'Practice Manager / Owner',
  industry: 'Healthcare, skin cancer clinic',
  teamSize: '3 doctors, 2 admin, 1 nurse, 1 bookkeeper, 1 owner',
  currentTools: 'Best Practice, Xero, Outlook, Microsoft 365, WordPress, Google Business',
  topPainPoints: 'Stocktake and stock reordering depend on owner causing risk of stockouts; missed enquiries via Facebook/Google leading to late or missed responses.',
  repeatedTasks: 'Stocktake and reordering, generating weekly doctor income invoices, manual report compilation from Xero and Best Practice',
  operatingRhythm: 'Daily morning huddles with front desk and doctors, email review, stocktakes, bookkeeping review, financial reporting, marketing content creation; front desk handles bookings and intake, clinicians see patients, owner and bookkeeper run back office',
  leadCustomerResponseWorkflow: 'Mostly phone and GP referrals; front desk books appointments, takes basic details, sends SMS reminders, does intake on arrival and updates Best Practice; Facebook/Google messages monitored intermittently leading to missed enquiries',
  knowledgeDocumentationGaps: 'Procedures stored on shared drive and a physical front‑desk folder; no other gaps explicitly mentioned',
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

async function triggerPipeline() {
  console.log('Triggering internal pipeline...');
  console.log('Session:', SESSION_ID);
  console.log('Transcript length:', job.transcript.length, 'chars\n');
  
  const res = await fetch('https://agenticai.net.au/api/internal/run-pipeline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET
    },
    body: JSON.stringify(job)
  });
  
  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

async function monitorPipeline() {
  console.log('\nMonitoring pipeline...');
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 5000));
    
    const res = await fetch(`https://agenticai.net.au/api/assessment-transcript?sessionId=${SESSION_ID}&poll=${i}`);
    const status = await res.json();
    console.log(`[${new Date().toISOString()}] ${status.status}${status.error ? ' | ERROR: ' + status.error : ''}`);
    
    if (status.status === 'completed' || status.status === 'error') {
      console.log('\nFinal:', JSON.stringify(status, null, 2));
      break;
    }
  }
}

await triggerPipeline();
await monitorPipeline();
