const sessionId = 'cs_test_a1SvG2Jxf4iiyUcLAsX4o26JO5FjiERtYDQL50Q1PfilA2q6deL9L3wSqC';

async function poll() {
  const res = await fetch(`https://agenticai.net.au/api/assessment-transcript?sessionId=${sessionId}`);
  const txt = await res.text();
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${time} → ${txt}`);
}

console.log('Polling every 10s...');
poll(); // initial
const interval = setInterval(poll, 10000);

// Stop after 2 minutes
setTimeout(() => {
  clearInterval(interval);
  console.log('Done');
}, 120000);
