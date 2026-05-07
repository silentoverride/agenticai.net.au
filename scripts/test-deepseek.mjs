const url = 'https://ollama.com/v1/chat/completions';
const key = '0ce3ffa848cb416e93b3f65c3c6d1e6e.oWdG0d2GOS1GNIfWet-7Snxm';

async function testModel(name) {
  console.log(`\n--- Testing ${name} ---`);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model: name,
        messages: [{role:'user', content:'Hello, can you hear me?'}],
        max_tokens: 100
      }),
      signal: AbortSignal.timeout(30000)
    });
    const elapsed = Date.now() - start;
    const data = await res.json();
    console.log(`${elapsed}ms | tokens=${data.usage?.total_tokens || '?'} | content:`, JSON.stringify(data.choices?.[0]?.message?.content?.slice(0, 60)));
  } catch(e) {
    console.log(`ERROR: ${e.name} after ${Date.now()-start}ms`);
  }
}

await testModel('deepseek-v4-flash:cloud');
await testModel('deepseek-v4-flash');
