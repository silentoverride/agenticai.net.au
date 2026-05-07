// Send a properly signed Retell webhook to trigger the pipeline
// Uses the same signature format as Retell: v=timestamp,d=hmac_sha256(body+timestamp)

import { createHmac } from 'crypto';

const sessionId = 'cs_test_a1SvG2Jxf4iiyUcLAsX4o26JO5FjiERtYDQL50Q1PfilA2q6deL9L3wSqC';
const callId = 'call_8153280819ccc61607fa29a9e93';
const apiKey = 'key_45f2aee94a3807e3fa5784d34743';

const payload = {
  event: 'call_analyzed',
  call: {
    call_id: callId,
    agent_id: 'agent_annie_test',
    status: 'ended',
    transcript: 'Test transcript for debugging. Customer John Example from Affinity Skin Cancer Clinics. Team of 3 doctors, 2 admin, 1 nurse. Main pain point is stocktake and reordering, manually done twice weekly. Looking to automate with AI.',
    transcript_text: 'Test transcript for debugging. Customer John Example from Affinity Skin Cancer Clinics. Team of 3 doctors, 2 admin, 1 nurse. Main pain point is stocktake and reordering, manually done twice weekly. Looking to automate with AI.',
    summary: 'Affinity Skin Cancer Clinics needs AI automation for stocktake and reordering.',
    recording_url: null,
    start_timestamp: Math.floor(Date.now() / 1000) - 300,
    end_timestamp: Math.floor(Date.now() / 1000),
    duration_ms: 300000,
    disconnection_reason: 'user_hangup',
    direction: 'inbound',
    from_number: '+61468312233',
    to_number: '+61400000000',
    call_cost: { total_cost: 0.42 },
    metadata: {
      source: 'retell-voice-agent',
      customer_name: 'John Example',
      customer_email: 'johnexample@sharklasers.com',
      customer_phone: '+61468312233',
      company: 'Affinity Skin Cancer Clinics',
      payment_status: 'paid'
    },
    call_analysis: {
      summary: 'Skin cancer clinic interested in AI automation for manual stocktake.',
      custom_analysis_data: {
        caller_name: 'John Example',
        caller_email: 'johnexample@sharklasers.com',
        caller_phone: '+61468312233',
        company: 'Affinity Skin Cancer Clinics',
        industry: 'Healthcare',
        team_size: '7',
        current_tools: 'Manual spreadsheets',
        top_pain_points: 'Stocktake reordering is manual and done twice weekly',
        repeated_tasks: 'Stock counting, reorder lists',
        operating_rhythm: 'Three consult days, two procedure days per week',
        lead_customer_response_workflow: null,
        knowledge_documentation_gaps: null,
        reporting_visibility_gaps: null,
        estimated_time_loss_mentioned: '4-6 hours per week on stocktake',
        revenue_or_customer_impact_mentioned: 'Risk of stockouts',
        lead_response_gap: false,
        knowledge_gap: true,
        manual_reporting_gap: true,
        priority_outcome: 'Automated stock management with AI',
        privacy_or_compliance_constraints: 'Patient data must stay onshore',
        open_questions_for_follow_up: null,
        assessment_ready: true,
        verbal_approval_given: true,
        payment_link_sent: true,
        payment_status: 'paid',
        caller_role: 'Owner / Practice Manager'
      }
    },
    retell_llm_dynamic_variables: {}
  }
};

const body = JSON.stringify(payload);

// Generate Retell signature
const timestamp = Date.now();
const toSign = body + timestamp;
const digest = createHmac('sha256', apiKey).update(toSign).digest('hex');
const signature = `v=${timestamp},d=${digest}`;

console.log('Sending signed Retell webhook...');
console.log('Timestamp:', timestamp);
console.log('Signature:', signature);
console.log('Body length:', body.length, 'bytes');

try {
  const res = await fetch('https://agenticai.net.au/api/retell-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-retell-signature': signature
    },
    body
  });

  const text = await res.text();
  console.log('\nResponse status:', res.status);
  console.log('Response body:', text || '(empty body)');

  if (res.status === 204) {
    console.log('✅ Webhook accepted — pipeline triggered');
    console.log('\nWaiting 5s for pipeline to run, then checking status...');
    
    await new Promise(r => setTimeout(r, 5000));
    
    const statusRes = await fetch(`https://agenticai.net.au/api/assessment-transcript?sessionId=${sessionId}`);
    const statusJson = await statusRes.json();
    console.log('\nPipeline status after webhook:');
    console.log(JSON.stringify(statusJson, null, 2));
  } else {
    console.log('\n⚠️ Unexpected response. Webhook may have been rejected.');
  }
} catch (err) {
  console.error('Fetch failed:', err.message);
}
