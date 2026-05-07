// Test LLM with realistic assessment prompt size

const OLLAMA_BASE_URL = 'https://ollama.com';
const OLLAMA_API_KEY = '0ce3ffa848cb416e93b3f65c3c6d1e6e.oWdG0d2GOS1GNIfWet-7Snxm';
const model = 'kimi-k2.6:cloud';

// Build a system prompt similar to llm-analysis.ts
const systemPrompt = `You are an expert AI Business Assessment analyst. Analyze a business owner interview transcript and produce a structured assessment report in strict JSON format.

Output must be a valid JSON object with these exact keys:
{
  "executive_summary": "2-3 sentences summarizing the biggest findings",
  "pain_points": [
    { "title": "string", "description": "string", "severity": "high|medium|low", "frequency": "daily|weekly|monthly" }
  ],
  "quick_wins": [
    { "title": "string", "description": "string", "effort": "low|medium|high", "impact": "low|medium|high", "estimated_hours_saved_per_week": number, "recommended_tools": ["Tool Name (category)"] }
  ],
  "deeper_opportunities": [
    { "title": "string", "description": "string", "category": "automation|ai_agent|process_optimisation|knowledge_system", "estimated_setup_cost_aud": number, "estimated_monthly_value_aud": number }
  ],
  "tool_recommendations": [
    { "name": "string", "category": "string", "purpose": "string", "estimated_monthly_cost_aud": number, "setup_complexity": "low|medium|high" }
  ],
  "implementation_roadmap": [
    { "phase": "string", "week": "1-2|3-4|5-8", "actions": ["string"] }
  ],
  "financial_impact": {
    "hours_saved_per_week": number,
    "hourly_rate_assumed_aud": number,
    "weekly_value_aud": number,
    "annual_value_aud": number,
    "estimated_tool_costs_monthly_aud": number,
    "net_annual_value_aud": number
  }
}

Rules:
- Only recommend real, off-the-shelf tools.
- Base ALL findings on the transcript. Do not hallucinate.
- Be conservative with estimates when the transcript is sparse.`;

const transcript = `Test transcript for debugging. Customer John Example from Affinity Skin Cancer Clinics. Team of 3 doctors, 2 admin, 1 nurse. Main pain point is stocktake and reordering, manually done twice weekly. Looking to automate with AI.`;

const userPrompt = `Company: Affinity Skin Cancer Clinics
Owner: John Example
TRANSCRIPT START:
${transcript}
TRANSCRIPT END`;

const toolsSection = `RESEARCHED AI TOOLS\nCategory: CRM\n• HubSpot CRM (hubspot.com) – marketing automation and lead tracking.\n• Salesforce Essentials (salesforce.com) – sales pipeline management.\n\nCategory: Stock Management\n• Netstock (netstock.com) – inventory optimization using AI.\n• Unleashed Software (unleashedsoftware.com) – warehouse and inventory management.\n\nCategory: Automation\n• Zapier (zapier.com) – workflow automation between apps.\n• Make (make.com) – visual workflow builder and automation.\n\nCategory: AI Assistants\n• Claude (claude.ai) – general AI assistant for content and analysis.\n• ChatGPT (chatgpt.com) – conversational AI for research and drafting.`;

async function testWithCurrentSettings() {
  console.log('Test 1: Current settings (max_tokens=8192, timeout=45000ms)');
  const url = `${OLLAMA_BASE_URL}/v1/chat/completions`;
  
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt + '\n\n' + toolsSection },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 8192
      }),
      signal: AbortSignal.timeout(45000)
    });
    
    const elapsed = Date.now() - start;
    if (!res.ok) {
      console.log(`FAILED (${res.status}) after ${elapsed}ms`);
      const text = await res.text();
      console.log(text.slice(0, 500));
      return;
    }
    
    const data = await res.json();
    const tokens = data.usage?.total_tokens || '?';
    console.log(`✅ SUCCESS in ${elapsed}ms. Tokens: ${tokens}`);
    console.log('Response preview:', data.choices[0]?.message?.content?.slice(0, 300));
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(`❌ ERROR after ${elapsed}ms: ${err.name} - ${err.message}`);
  }
}

async function testWithReducedTokens() {
  console.log('\nTest 2: Reduced max_tokens=4096');
  const url = `${OLLAMA_BASE_URL}/v1/chat/completions`;
  
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt + '\n\n' + toolsSection },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 4096
      }),
      signal: AbortSignal.timeout(45000)
    });
    
    const elapsed = Date.now() - start;
    if (!res.ok) {
      console.log(`FAILED (${res.status}) after ${elapsed}ms`);
      return;
    }
    
    const data = await res.json();
    const tokens = data.usage?.total_tokens || '?';
    console.log(`✅ SUCCESS in ${elapsed}ms. Tokens: ${tokens}`);
    console.log('Response preview:', data.choices[0]?.message?.content?.slice(0, 300));
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(`❌ ERROR after ${elapsed}ms: ${err.name} - ${err.message}`);
  }
}

async function testWithShorterTimeout() {
  console.log('\nTest 3: Longer timeout (120000ms)');
  const url = `${OLLAMA_BASE_URL}/v1/chat/completions`;
  
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt + '\n\n' + toolsSection },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 8192
      }),
      signal: AbortSignal.timeout(120000)
    });
    
    const elapsed = Date.now() - start;
    if (!res.ok) {
      console.log(`FAILED (${res.status}) after ${elapsed}ms`);
      return;
    }
    
    const data = await res.json();
    const tokens = data.usage?.total_tokens || '?';
    console.log(`✅ SUCCESS in ${elapsed}ms. Tokens: ${tokens}`);
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(`❌ ERROR after ${elapsed}ms: ${err.name} - ${err.message}`);
  }
}

await testWithCurrentSettings();
await testWithReducedTokens();
await testWithShorterTimeout();
