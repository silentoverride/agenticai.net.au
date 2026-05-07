// Direct internal pipeline trigger using INTERNAL_SECRET

const SESSION_ID = 'cs_test_a1P8OLPOYArKQXCLXqXvzQOWUcm4OKDdzIEc4lWy7p66canoh1MHRPnvh8';
const RETELL_CALL_ID = 'call_8153280819ccc61607fa29a9e93';
const INTERNAL_SECRET = 'cPf7vcbN2injNsoN/HHdKzOOXjfnYvS1GYmb3ua8H+Q=';

async function triggerInternalPipeline() {
  console.log('Triggering internal pipeline for session', SESSION_ID);
  
  const payload = {
    sessionId: SESSION_ID,
    retellCallId: RETELL_CALL_ID
  };
  
  const res = await fetch('https://agenticai.net.au/api/internal/run-pipeline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET
    },
    body: JSON.stringify(payload)
  });
  
  console.log('Status:', res.status, res.statusText);
  let data;
  try {
    data = await res.json();
    console.log('Response:', data);
  } catch {
    const text = await res.text();
    console.log('Text:', text);
  }
}

async function monitorPipeline() {
  console.log('Monitoring pipeline...\n');
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`https://agenticai.net.au/api/assessment-transcript?sessionId=${SESSION_ID}&poll=${i}`);
    const status = await res.json();
    console.log(`[${new Date().toISOString()}] Poll ${i+1}:`, JSON.stringify(status));
    
    if (status.status === 'completed' || status.status === 'error') {
      console.log('\nFinal status:', status.status);
      if (status.error) console.log('Error:', status.error);
      if (status.reportUrl) console.log('Report URL:', status.reportUrl);
      break;
    }
    
    await new Promise(r => setTimeout(r, 3000));
  }
}

await triggerInternalPipeline();
await monitorPipeline();
