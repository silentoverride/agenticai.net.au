// Test gemini-3-flash-preview with full assessment prompt
const url = 'https://ollama.com/v1/chat/completions';
const key = '0ce3ffa848cb416e93b3f65c3c6d1e6e.oWdG0d2GOS1GNIfWet-7Snxm';

const systemPrompt = `You are an expert AI Business Assessment analyst. Analyze a business owner interview transcript and produce a structured assessment report in strict JSON format.

Output must be a valid JSON object with exact keys: executive_summary, pain_points, quick_wins, deeper_opportunities, tool_recommendations, implementation_roadmap, financial_impact.

Rules:
- Only recommend real, off-the-shelf tools.
- Base ALL findings on the transcript. Do not hallucinate.
- Be conservative with estimates when the transcript is sparse.`;

const transcript = `Customer John Example from Affinity Skin Cancer Clinics. Team of 3 doctors, 2 admin, 1 nurse. Main pain point is stocktake and reordering, manually done twice weekly. Looking to automate with AI. Also struggling with patient recall letters and appointment reminders.`;

const userPrompt = `Analyze this business assessment interview transcript and return a JSON report.
Company: Affinity Skin Cancer Clinics
Owner: John Example
TRANSCRIPT START:
${transcript}
TRANSCRIPT END`;

async function test() {
  console.log('Testing gemini-3-flash-preview with full assessment prompt...\n');
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(60000)
    });
    
    const elapsed = Date.now() - start;
    console.log(`Status: ${res.status} in ${elapsed}ms`);
    
    if (!res.ok) {
      console.log('Error:', await res.text());
      return;
    }
    
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const total = data.usage?.total_tokens || '?';
    
    console.log(`Total tokens: ${total}`);
    console.log(`Response preview (${content.length} chars):`);
    console.log(content.slice(0, 500));
    
    // Validate JSON
    try {
      JSON.parse(content);
      console.log('\n✅ Valid JSON!');
    } catch {
      console.log('\n❌ Not valid JSON');
    }
  } catch(e) {
    console.log(`ERROR: ${e.name} after ${Date.now()-start}ms`);
  }
}

await test();
