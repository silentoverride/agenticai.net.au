// Check Ollama models available

const OLLAMA_BASE_URL = 'https://ollama.com';
const OLLAMA_API_KEY = '0ce3ffa848cb416e93b3f65c3c6d1e6e.oWdG0d2GOS1GNIfWet-7Snxm';

async function listModels() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      headers: { 'Authorization': `Bearer ${OLLAMA_API_KEY}` },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) {
      console.log('Status:', res.status);
      console.log(await res.text());
      return;
    }
    
    const data = await res.json();
    console.log('Available models:');
    for (const m of data.models || []) {
      console.log(m.name);
    }
    console.log('\nTotal models:', data.models?.length || 0);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function testModel(name, prompt) {
  console.log(`\n--- Testing ${name} ---`);
  const start = Date.now();
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model: name,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    const elapsed = Date.now() - start;
    if (!res.ok) {
      console.log(`❌ ${res.status} in ${elapsed}ms`);
      console.log(await res.text());
      return;
    }
    
    const data = await res.json();
    console.log(`✅ ${elapsed}ms | ${data.usage?.total_tokens || '?'} tokens | response: ${data.choices[0]?.message?.content?.slice(0, 80)}`);
  } catch (err) {
    console.log(`❌ ${err.name} after ${Date.now() - start}ms`);
  }
}

await listModels();

// Test known working models
await testModel('gemini-3-flash-preview', 'What is AI?');
await testModel('gemma3:27b', 'What is AI?');
await testModel('kimi-k2.6:cloud', 'What is AI?', { max_tokens: 100 });
