const sessionId = 'cs_test_a1SvG2Jxf4iiyUcLAsX4o26JO5FjiERtYDQL50Q1PfilA2q6deL9L3wSqC';

async function check() {
  const res = await fetch(`https://agenticai.net.au/api/assessment-transcript?sessionId=${sessionId}`);
  const json = await res.json();
  console.log('Status at', new Date().toISOString());
  console.log(JSON.stringify(json, null, 2));
}

check().catch(console.error);
