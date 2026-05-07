const sessionId = 'cs_test_a1hQRC1slf3iNM3QEkYBsFp9mwMXCGTJsAuGmNpdeKhIIIc5kI6l8o0Gwp';

async function monitor() {
  console.log('Monitoring new session:', sessionId);
  for (let i = 0; i < 30; i++) {
    const res = await fetch('https://agenticai.net.au/api/assessment-transcript?sessionId=' + sessionId + '&poll=' + i);
    const status = await res.json();
    console.log(`[${i+1}] ${status.status}${status.error ? ' | ' + status.error.slice(0,80) : ''}`);
    
    if (status.status === 'completed') {
      console.log('\nSUCCESS! Report:', status.reportUrl || status.reportId);
      break;
    }
    if (status.status === 'error') {
      console.log('\nFAILED:', status.error);
      break;
    }
    if (status.status !== 'pending_transcript' && status.status !== 'queued') {
      console.log('\nStatus:', JSON.stringify(status, null, 2));
    }
    
    await new Promise(r => setTimeout(r, 5000));
  }
}

monitor().catch(console.error);
