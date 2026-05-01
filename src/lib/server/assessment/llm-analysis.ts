import { llmChat } from '../llm';
import type { AssessmentReportJob } from './types';

function buildAnalysisMessages(transcript: string, job: AssessmentReportJob) {
  return [
    {
      role: 'system' as const,
      content: `You are an expert AI Business Assessment analyst. Analyze a business owner interview transcript and produce a structured assessment report in strict JSON format.

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
- Be conservative with estimates when the transcript is sparse.`,
    },
    {
      role: 'user' as const,
      content: `Analyze this business assessment interview transcript and return a JSON report.

${job.company ? `Company: ${job.company}` : ''}
${job.customerName ? `Owner: ${job.customerName}` : ''}

TRANSCRIPT START:
${transcript.length > 30000 ? transcript.slice(0, 30000) + '\n...[truncated]' : transcript}
TRANSCRIPT END`,
    }
  ];
}

export async function analyzeTranscript(job: AssessmentReportJob): Promise<string> {
  const messages = buildAnalysisMessages(job.transcript, job);
  const response = await llmChat(messages, { temperature: 0.5, maxTokens: 8192, format: 'json' });

  try {
    JSON.parse(response.content);
  } catch {
    console.warn('LLM response was not valid JSON, attempting to extract JSON block');
    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        JSON.parse(match[0]);
        return match[0];
      } catch {
        // Fall through
      }
    }
    throw new Error('LLM returned invalid JSON for assessment analysis');
  }

  return response.content;
}
