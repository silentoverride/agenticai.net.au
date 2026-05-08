import { llmChat } from '../llm';
import type { AssessmentReportJob } from './types';
import type { AITool } from './tool-lookup';
import { formatToolsForPrompt } from './tool-lookup';

/**
 * Filter transcript to keep only user/business-owner utterances
 * by removing lines spoken by the AI agent.
 */
function filterUserUtterances(transcript: string): string {
  return transcript
    .split('\n')
    .filter(line => !/^\s*Agent:/i.test(line))
    .join('\n')
    .trim();
}

function buildAnalysisMessages(transcript: string, job: AssessmentReportJob, tools?: AITool[]) {
  const toolsSection = tools?.length ? formatToolsForPrompt(tools) : '';

  // Filter to user utterances only, removing scripted agent voice
  const userTranscript = filterUserUtterances(transcript);

  return [
    {
      role: 'system' as const,
      content: `You are an expert AI Business Assessment analyst. Analyze a business owner interview transcript and produce a structured assessment report in strict JSON format.

Required keys and types:
- executive_summary: string (2-3 sentences)
- pain_points: { title, description, severity: high|medium|low, frequency: daily|weekly|monthly }[]
- quick_wins: { title, description, effort: low|medium|high, impact: low|medium|high, estimated_hours_saved_per_week: number, recommended_tools: string[] }[]
- deeper_opportunities: { title, description, category: automation|ai_agent|process_optimisation|knowledge_system, estimated_setup_cost_aud: number, estimated_monthly_value_aud: number }[]
- tool_recommendations: { name, category, purpose, estimated_monthly_cost_aud: number, setup_complexity: low|medium|high }[]
- implementation_roadmap: { phase, week: 1-2|3-4|5-8, actions: string[] }[]
- financial_impact: { hours_saved_per_week, hourly_rate_assumed_aud, weekly_value_aud, annual_value_aud, estimated_tool_costs_monthly_aud, net_annual_value_aud } all numbers

Rules:
- Only recommend real, off-the-shelf tools.
- Base ALL findings on the transcript. Do not hallucinate.
- Be conservative with estimates when the transcript is sparse.
- When tool URLs are provided in the RESEARCHED AI TOOLS section, reference those exact tools and URLs in your recommendations.
${toolsSection}`,
    },
    {
      role: 'user' as const,
      content: `Analyze this business assessment interview transcript and return a JSON report.

${job.company ? `Company: ${job.company}` : ''}
${job.customerName ? `Owner: ${job.customerName}` : ''}

TRANSCRIPT START:
${userTranscript.length > 5000 ? userTranscript.slice(0, 5000) + '\n...[truncated]' : userTranscript}
TRANSCRIPT END`,
    }
  ];
}

export async function analyzeTranscript(job: AssessmentReportJob, tools?: AITool[]): Promise<string> {
  const messages = buildAnalysisMessages(job.transcript, job, tools);
  const response = await llmChat(messages, { temperature: 0.5, maxTokens: 4096, timeoutMs: 180000 });

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
    console.error('LLM returned invalid JSON for assessment analysis. Raw response (first 2000 chars):', response.content.slice(0, 2000));
    throw new Error('LLM returned invalid JSON for assessment analysis');
  }

  return response.content;
}
