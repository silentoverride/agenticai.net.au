// Manual trigger for the new session with current transcript

const SESSION_ID = 'cs_test_a1P8OLPOYArKQXCLXqXvzQOWUcm4OKDdzIEc4lWy7p66canoh1MHRPnvh8';
const RETELL_CALL_ID = 'call_8153280819ccc61607fa29a9e93';

async function triggerPipeline() {
  console.log('Triggering pipeline for session', SESSION_ID);
  
  // Step 1: POST to reset endpoint to set status to pending_transcript
  const resetRes = await fetch(`/api/assessment-transcript?sessionId=${SESSION_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('Reset status:', resetRes.status, await resetRes.json());
  
  // Step 2: Wait for Stripe webhook to process (it will find the transcript in D1)
  console.log('Waiting 10 seconds for Stripe webhook to process...');
  await new Promise(r => setTimeout(r, 10000));
  
  // Step 3: Check pipeline status
  for (let i = 0; i < 30; i++) {
    const statusRes = await fetch(`/api/assessment-transcript?sessionId=${SESSION_ID}&poll=${i}`);
    const status = await statusRes.json();
    console.log(`Poll ${i}:`, status);
    
    if (status.status && status.status !== 'pending_transcript' && status.status !== 'queued' && status.status !== 'running_llm' && status.status !== 'running_tools') {
      break;
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}

// We need to run this in the production context, so we can't just fetch from here
// Instead, let's trigger it via the Stripe webhook by resetting the session

async function resetAndMonitor() {
  console.log('Step 1: Reset session status to pending_transcript');
  const resetRes = await fetch('https://agenticai.net.au/api/assessment-transcript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: SESSION_ID })
  });
  console.log('Reset result:', await resetRes.json());
  console.log(); // Force new line for log capture
  
  console.log('Step 2: Poll pipeline status every 5 seconds...');
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://agenticai.net.au/api/assessment-transcript?sessionId=${SESSION_ID}&poll=${i}`);
    const status = await statusRes.json();
    console.log(`Poll ${i+1}:`, JSON.stringify(status));
    console.log(); // Force new line
    
    if (status.status === 'completed' || status.status === 'error') {
      break;
    }
  }
}

await resetAndMonitor();
