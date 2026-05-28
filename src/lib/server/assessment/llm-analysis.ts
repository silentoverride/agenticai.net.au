import { llmChat } from '../llm';
import type { LlmResponse } from '../llm';
import type { AssessmentReportJob, BudgetSignal } from './types';
import type { AITool } from './tool-lookup';
import type { EvidenceMap } from './evidence-map';
import { formatToolsForPrompt } from './tool-lookup';
import { formatEvidenceMapForPrompt } from './evidence-map';

/**
 * Filter transcript to keep only user/business-owner utterances
 * by removing lines spoken by the AI agent.
 */
function filterUserUtterances(transcript: string): string {
  return transcript.replace(/^[ \t]*Agent:.*\n?/gmi, '').trim();
}

function buildAnalysisMessages(
  transcript: string,
  job: AssessmentReportJob,
  tools?: AITool[],
  evidenceMap?: EvidenceMap,
  budgetSignal?: BudgetSignal
) {
  const toolsSection = tools?.length ? formatToolsForPrompt(tools, budgetSignal) : '';
  const evidenceSection = evidenceMap?.claims.length ? formatEvidenceMapForPrompt(evidenceMap, budgetSignal) : '';

  // Filter to user utterances only, removing scripted agent voice
  const userTranscript = filterUserUtterances(transcript);

  return [
    {
      role: 'system' as const,
      content: `You are an expert AI Business Assessment analyst. Analyze a business owner interview transcript and produce a structured assessment report in strict JSON format.

${evidenceSection ? 'BUILD THE REPORT FROM THE EVIDENCE MAP BELOW. Every claim in the report must trace back to a claim in the evidence map. Mark inferences as estimates, not facts. Gap items should be handled with the recommended approach — do not invent.' : ''}

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
- Base ALL findings on the evidence map if provided. Do not hallucinate.
- Be conservative with estimates when the evidence is sparse.
- Disaggregate hours-saved claims (show per-workflow breakdown).
- Use Australian context: AUD, APPs, Fair Work, ATO.
- Tone: calibrated competence, not vendor enthusiasm.
- Never use "will save" — always "we estimate."
- Never recommend regulated-domain actions.
- Savings < 30 min/week should be mentioned in prose, not annualised as dollars.
${toolsSection}
${evidenceSection}`,
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

export async function analyzeTranscript(
  job: AssessmentReportJob,
  tools?: AITool[],
  evidenceMap?: EvidenceMap,
  budgetSignal?: BudgetSignal
): Promise<string> {
  const messages = buildAnalysisMessages(job.transcript, job, tools, evidenceMap, budgetSignal);

  async function attempt(retries: number): Promise<LlmResponse> {
    try {
      return await llmChat(messages, { temperature: 0.5, maxTokens: 4096, timeoutMs: 120000 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes('503') || msg.includes('overloaded') ||
        msg.includes('timed out') || msg.includes('AbortError') ||
        msg.includes('502') || msg.includes('5');
      if (isRetryable && retries > 0) {
        const delay = 5000 * Math.pow(3, 3 - retries); // 5s, 15s, 45s
        console.warn(`LLM call failed (${msg}), retrying in ${delay}ms (${retries} retries left)`);
        await new Promise(r => setTimeout(r, delay));
        return attempt(retries - 1);
      }
      throw err;
    }
  }

  const response = await attempt(3);

  const trimmed = response.content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    // Clean JSON object — skip full parse for validation, pass through
    return response.content;
  }

  // Extraction path: response may have prefix/suffix text around JSON
  console.warn('LLM response was not clean JSON, attempting to extract JSON block');
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
