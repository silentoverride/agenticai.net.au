const sessionId = 'cs_test_a187TmNny30dpn4Wc4V69pi0DCsniVxxqXHXzW3pVf5Cym1BhJRw6UJ5vI';

async function check() {
  const res = await fetch('https://agenticai.net.au/api/assessment-transcript?sessionId=' + sessionId);
  const data = await res.json();
  console.log('Status:', JSON.stringify(data, null, 2));
}

check();
