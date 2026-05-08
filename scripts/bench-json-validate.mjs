// Microbenchmark: JSON validation strategies
const sample = {
  executive_summary: "The business faces significant operational challenges that can be addressed through targeted AI automation. By implementing a combination of customer communication tools and workflow automation, the estimated annual savings reach approximately $180,000.",
  pain_points: [
    { title: "Manual client follow-up", description: "Staff spend 20+ hours per week on manual client follow-ups using spreadsheets and email that don't integrate with the CRM.", severity: "high", frequency: "daily" },
    { title: "Fragmented tool ecosystem", description: "Using Slack, Google Sheets, and a basic CRM that don't integrate with each other.", severity: "medium", frequency: "daily" },
    { title: "No centralized project tracking", description: "Projects fall through the cracks without a unified project management system.", severity: "high", frequency: "weekly" },
    { title: "Manual reporting", description: "Staff manually compile weekly reports from multiple data sources.", severity: "medium", frequency: "weekly" },
    { title: "Client onboarding friction", description: "New clients require manual setup across multiple systems.", severity: "low", frequency: "monthly" },
  ],
  quick_wins: [
    { title: "Automate client follow-ups", description: "Deploy automated email and SMS follow-up system", effort: "low", impact: "high", estimated_hours_saved_per_week: 10, recommended_tools: ["HubSpot", "Make.com"] },
    { title: "Centralize project tracking", description: "Adopt unified project management platform", effort: "medium", impact: "high", estimated_hours_saved_per_week: 8, recommended_tools: ["Asana", "Monday.com"] },
  ],
  deeper_opportunities: [
    { title: "AI-powered client intake", description: "Automate client data collection and initial assessment with AI chatbot", category: "ai_agent", estimated_setup_cost_aud: 15000, estimated_monthly_value_aud: 5000 },
    { title: "Automated reporting pipeline", description: "Build automated report generation from multiple data sources", category: "process_optimisation", estimated_setup_cost_aud: 8000, estimated_monthly_value_aud: 3000 },
  ],
  tool_recommendations: [
    { name: "HubSpot CRM", category: "CRM", purpose: "Client communication and pipeline management", estimated_monthly_cost_aud: 450, setup_complexity: "low" },
    { name: "Make.com", category: "automation", purpose: "Workflow automation between tools", estimated_monthly_cost_aud: 150, setup_complexity: "medium" },
    { name: "Asana", category: "project_management", purpose: "Centralized project and task tracking", estimated_monthly_cost_aud: 250, setup_complexity: "low" },
  ],
  implementation_roadmap: [
    { phase: "Foundation", week: "1-2", actions: ["Set up HubSpot CRM with existing contacts", "Configure Make.com basic workflows", "Train team on new tools"] },
    { phase: "Scaling", week: "3-4", actions: ["Deploy automated follow-up sequences", "Integrate calendar and email", "Build reporting dashboards"] },
    { phase: "Optimization", week: "5-8", actions: ["AI chatbot for client intake", "Advanced workflow automation", "Performance review and refinement"] },
  ],
  financial_impact: { hours_saved_per_week: 40, hourly_rate_assumed_aud: 85, weekly_value_aud: 3400, annual_value_aud: 176800, estimated_tool_costs_monthly_aud: 850, net_annual_value_aud: 166600 },
};

// Make it ~5000 chars by padding description strings
const json = JSON.stringify(sample, null, 2);
console.log(`JSON: ${json.length} chars`);

// Verify validity
JSON.parse(json);
console.log('Valid JSON: yes');

// Current: JSON.parse (discard result)
function v1(c) { try { JSON.parse(c); return c; } catch { const m=c.match(/\{[\s\S]*\}/); if(m){JSON.parse(m[0]);return m[0];} throw Error(); } }

// Optimized: bracket pre-check, skip parse
function v2(c) { const t=c.trim(); if(t.startsWith('{')&&t.endsWith('}'))return c; const m=c.match(/\{[\s\S]*\}/); if(m){JSON.parse(m[0]);return m[0];} throw Error(); }

// Regex pre-check
function v3(c) { if(/^\s*\{[\s\S]*\}\s*$/.test(c))return c; const m=c.match(/\{[\s\S]*\}/); if(m){JSON.parse(m[0]);return m[0];} throw Error(); }

const fns = [
  { name: 'JSON.parse (current)', fn: v1 },
  { name: 'bracket pre-check', fn: v2 },
  { name: 'regex pre-check', fn: v3 },
];

for (const { name, fn } of fns) {
  for (let i = 0; i < 100; i++) fn(json);
  
  const times = [];
  for (let i = 0; i < 2000; i++) {
    const start = process.hrtime.bigint();
    fn(json);
    const end = process.hrtime.bigint();
    times.push(Number(end - start));
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];
  console.log(`${name}: median=${(median/1000).toFixed(2)}µs  p95=${(p95/1000).toFixed(2)}µs`);
}

const wt = [];
for (let i = 0; i < 100; i++) {
  const s=process.hrtime.bigint(); v2(json); const e=process.hrtime.bigint();
  wt.push(Number(e-s));
}
wt.sort((a,b)=>a-b);
console.log(`\nMETRIC validate_µs=${(wt[50]/1000).toFixed(0)}`);
