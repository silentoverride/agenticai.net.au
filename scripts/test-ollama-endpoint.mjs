// Test Ollama Cloud endpoint directly

const OLLAMA_BASE_URL = 'https://ollama.com';
const OLLAMA_API_KEY = '0ce3ffa848cb416e93b3f65c3c6d1e6e.oWdG0d2GOS1GNIfWet-7Snxm';
const model = 'kimi-k2.6:cloud';

async function testOpenAICompatible() {
  console.log('Testing OpenAI-compatible endpoint...');
  const url = `${OLLAMA_BASE_URL}/v1/chat/completions`;
  console.log('URL:', url);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      }),
      signal: AbortSignal.timeout(15000)
    });
    
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response:', text.slice(0, 500));
  } catch (err) {
    console.error('Error:', err.name, err.message);
  }
}

async function testOllamaChat() {
  console.log('\n\nTesting official Ollama /api/chat endpoint...');
  const url = `${OLLAMA_BASE_URL}/api/chat`;
  console.log('URL:', url);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false
      }),
      signal: AbortSignal.timeout(15000)
    });
    
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response:', text.slice(0, 500));
  } catch (err) {
    console.error('Error:', err.name, err.message);
  }
}

async function testOllamaTags() {
  console.log('\n\nTesting /api/tags endpoint...');
  const url = `${OLLAMA_BASE_URL}/api/tags`;
  console.log('URL:', url);
  
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${OLLAMA_API_KEY}` },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response:', text.slice(0, 500));
  } catch (err) {
    console.error('Error:', err.name, err.message);
  }
}

await testOpenAICompatible();
await testOllamaChat();
await testOllamaTags();
