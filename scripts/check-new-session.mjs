const sessionId = 'cs_test_a1P8OLPOYArKQXCLXqXvzQOWUcm4OKDdzIEc4lWy7p66canoh1MHRPnvh8';
const callId = 'call_8153280819ccc61607fa29a9e93';

async function check() {
  console.log('⏰', new Date().toISOString());
  
  // Check pipeline status
  const statusRes = await fetch(`https://agenticai.net.au/api/assessment-transcript?sessionId=${sessionId}`);
  const statusJson = await statusRes.json();
  console.log('\nPipeline status:');
  console.log(JSON.stringify(statusJson, null, 2));
  
  // Also check D1 directly
  console.log('\nDirect D1 query via wrangler in 3 seconds...');
}

check().catch(console.error);
