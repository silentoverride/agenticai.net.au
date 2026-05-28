import { llmChat } from '../llm';
import type { LlmResponse } from '../llm';
import type { AssessmentReportJob, BudgetSignal } from './types';
import type { AITool } from './tool-lookup';
import type { EvidenceMap } from './evidence-map';
import { formatToolsForPrompt } from './tool-lookup';
import { formatEvidenceMapForPrompt } from './evidence-map';

// ============================================================================
// Structure-First Drafting (HCMW-004)
// Phase 1: Structural plan — thesis, argument movement, section jobs, evidence placement
// Phase 2: Full report generated from the approved structural plan
// Fallback: single-pass if Phase 1 fails after retries
// ============================================================================

interface StructuralPlan {
  thesis: string;
  argumentMovement: string;
  sections: Array<{ job: string; whyHere: string }>;
  connectiveLogic: string;
  evidencePlacement: string;
  deliberateOmissions: string;
}

/**
 * Filter transcript to keep only user/business-owner utterances
 * by removing lines spoken by the AI agent.
 */
function filterUserUtterances(transcript: string): string {
  return transcript.replace(/^[ \t]*Agent:.*\n?/gmi, '').trim();
}

/**
 * Build the Phase 1 prompt: structural plan for the assessment report.
 * Adapted from HCMW-004 (Structure-First Draft) methodology.
 * The LLM produces a thesis, argument movement, section plan, evidence placement,
 * and deliberate omissions BEFORE writing prose.
 */
function buildStructurePlanPrompt(
  transcript: string,
  job: AssessmentReportJob,
  tools?: AITool[],
  evidenceMap?: EvidenceMap,
  budgetSignal?: BudgetSignal
) {
  const toolsSection = tools?.length ? formatToolsForPrompt(tools, budgetSignal) : '';
  const evidenceSection = evidenceMap?.claims.length ? formatEvidenceMapForPrompt(evidenceMap, budgetSignal) : '';
  const userTranscript = filterUserUtterances(transcript);

  return [
    {
      role: 'system' as const,
      content: `You are a structural editor and assessment architect. Your job is to produce the STRUCTURAL PLAN for an AI Business Assessment report — not the report itself. You are applying the Structure-First Draft methodology (HCMW-004).

WHAT YOU PRODUCE:
A structural plan that defines the argument the report will make, section by section. The full report will be written by a second pass that follows your plan.

THE PLAN MUST INCLUDE (return as JSON):

1. **thesis** (string, 1-2 sentences): The central argument. What should the reader believe, understand, or do after reading this report? Not the topic — the point. What's the one thing this business needs to understand?

2. **argumentMovement** (string, 3-5 sentences): How the piece moves. Where it opens, what it establishes first, where it turns, what it builds toward, and how it lands. Think of this as the narrative arc.

3. **sections** (array of { job: string, whyHere: string }): For each report section (Executive Summary, Pain Points, Quick Wins, Deeper Opportunities, Tool Recommendations, Implementation Roadmap, Financial Impact):
   - "job": What this section ACCOMPLISHES for the argument (not just what it covers). Example: "Establish urgency by naming the specific weekly cost of status quo — not a generic problem list."
   - "whyHere": Why this section comes where it does in the sequence. Example: "Quick Wins must come before Deeper Opportunities so the reader sees immediate ROI before larger investments."

4. **connectiveLogic** (string): What links each section to the next — the actual logical connections, not transition sentences. Example: "Pain Points → Quick Wins: Each Quick Win directly addresses a named pain point from the previous section. The transition is not 'additionally' — it's 'because of.'"

5. **evidencePlacement** (string): Where the strongest evidence goes and WHY. Which transcript quotes, tool research findings, or budget signals anchor which claims? Name specific evidence and which section it belongs in. Mark any weak spots where evidence is thin.

6. **deliberateOmissions** (string): What the report deliberately leaves out and WHY. Examples: a pain point that isn't actionable, a tool category that doesn't fit this business size, an opportunity that requires more intake data before it can be recommended.

RULES:
- Be specific to THIS business. Use the company name, industry, owner name, and concrete details from the transcript.
- Do not produce a generic plan that would work for any business.
- If the evidence is contradictory, surface the contradiction rather than picking a side.
- Mark any claim that would require inference (not directly supported by evidence) as such.
- The plan should make a genuine argument, not a checklist of report sections.

${evidenceSection ? 'EVIDENCE MAP AVAILABLE: Use the evidence map below to anchor your plan. Mark claims that trace to specific evidence items and flag claims that would need inference.' : ''}

Return ONLY valid JSON with keys: thesis, argumentMovement, sections, connectiveLogic, evidencePlacement, deliberateOmissions.
No markdown, no commentary, no preamble — just the JSON object.`,
    },
    {
      role: 'user' as const,
      content: `Produce a structural plan for this business assessment.

${job.company ? `Company: ${job.company}` : ''}
${job.customerName ? `Owner: ${job.customerName}` : ''}

TRANSCRIPT START:
${userTranscript.length > 5000 ? userTranscript.slice(0, 5000) + '\n...[truncated]' : userTranscript}
TRANSCRIPT END
${toolsSection}
${evidenceSection}

Return a JSON object with: thesis, argumentMovement, sections, connectiveLogic, evidencePlacement, deliberateOmissions.`,
    }
  ];
}

/**
 * Build the Phase 2 prompt: full report generated from the approved structural plan.
 * This injects the structural plan as a constraint so the LLM follows the argument
 * structure rather than producing a list.
 */
function buildReportFromPlanPrompt(
  transcript: string,
  job: AssessmentReportJob,
  plan: StructuralPlan,
  tools?: AITool[],
  evidenceMap?: EvidenceMap,
  budgetSignal?: BudgetSignal
) {
  const toolsSection = tools?.length ? formatToolsForPrompt(tools, budgetSignal) : '';
  const evidenceSection = evidenceMap?.claims.length ? formatEvidenceMapForPrompt(evidenceMap, budgetSignal) : '';
  const userTranscript = filterUserUtterances(transcript);
  const planJson = JSON.stringify(plan, null, 2);

  return [
    {
      role: 'system' as const,
      content: `You are an expert AI Business Assessment analyst. You write assessment reports that build an argument, not just list findings.

${evidenceSection ? 'BUILD THE REPORT FROM THE EVIDENCE MAP BELOW. Every claim in the report must trace back to a claim in the evidence map. Mark inferences as estimates, not facts. Gap items should be handled with the recommended approach — do not invent.' : ''}

STRUCTURAL PLAN (follow this exactly):
${planJson}

You MUST follow this plan when writing the report:
- The thesis is your north star — every section must advance it.
- Each section must do the job defined in the plan, not just cover its topic.
- Connect sections through the logical connections in the plan — do not use hollow transition phrases.
- Place evidence where the plan says — use named transcript quotes, tool data, and budget signals at the specified positions.
- Leave out what the plan says to leave out — do not fill deliberate omissions with filler.
- The opening must be specific to this assessment, not generic.
- The ending must land the argument, not restate "in conclusion."

Required output JSON keys and types:
- executive_summary: string (2-3 sentences that deliver the thesis, not a generic intro)
- pain_points: { title, description, severity: high|medium|low, frequency: daily|weekly|monthly }[]
- quick_wins: { title, description, effort: low|medium|high, impact: low|medium|high, estimated_hours_saved_per_week: number, recommended_tools: string[] }[]
- deeper_opportunities: { title, description, category: automation|ai_agent|process_optimisation|knowledge_system, estimated_setup_cost_aud: number, estimated_monthly_value_aud: number }[]
- tool_recommendations: { name, category, purpose, estimated_monthly_cost_aud: number, setup_complexity: low|medium|high }[]
- implementation_roadmap: { phase, week: 1-2|3-4|5-8, actions: string[] }[]
- financial_impact: { hours_saved_per_week, hourly_rate_assumed_aud, weekly_value_aud, annual_value_aud, estimated_tool_costs_monthly_aud, net_annual_value_aud } all numbers

Rules:
- Only recommend real, off-the-shelf tools.
- Base ALL findings on the evidence map if provided. Do not hallucinate.
- Be conservative with estimates when evidence is sparse.
- Disaggregate hours-saved claims (show per-workflow breakdown).
- Use Australian context: AUD, APPs, Fair Work, ATO.
- Tone: calibrated competence, not vendor enthusiasm.
- Never use "will save" — always "we estimate."
- Never recommend regulated-domain actions.
- Savings < 30 min/week: mention in prose, do not annualise.

ARTIFACT-READINESS REQUIREMENTS (HCMW-002: each report section must be independently usable as a separate deliverable):
- executive_summary: Must be self-contained — someone reading ONLY this section should understand the business, the central recommendation, the top 3 findings, and the financial impact. Include the company name.
- tool_recommendations: Each tool entry MUST include a "purpose" field explaining WHY this specific tool was chosen for THIS business (not just what it does generally). This supports procurement decisions without opening other sections.
- implementation_roadmap: Each phase must describe what specifically depends on completing prior phases. Include risk notes where setup complexity is high (medium or high tools).
- financial_impact: All 6 numeric fields must be populated. Zero is acceptable only when truly no data exists (never leave undefined).
${toolsSection}
${evidenceSection}`,
    },
    {
      role: 'user' as const,
      content: `Generate the full assessment report following the structural plan above. Return valid JSON.

${job.company ? `Company: ${job.company}` : ''}
${job.customerName ? `Owner: ${job.customerName}` : ''}

TRANSCRIPT START:
${userTranscript.length > 5000 ? userTranscript.slice(0, 5000) + '\n...[truncated]' : userTranscript}
TRANSCRIPT END`,
    }
  ];
}

/**
 * Original single-pass prompt builder — preserved as fallback for Phase 1 failures.
 */
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

// ============================================================================
// Shared LLM call helpers
// ============================================================================

/** Generic retry wrapper for LLM calls with exponential backoff. */
async function llmCallWithRetry(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
  maxRetries: number = 3
): Promise<LlmResponse> {
  async function attempt(retries: number): Promise<LlmResponse> {
    try {
      return await llmChat(messages, { temperature: 0.5, maxTokens: 4096, ...options });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes('503') || msg.includes('overloaded') ||
        msg.includes('timed out') || msg.includes('AbortError') ||
        msg.includes('502') || msg.includes('5');
      if (isRetryable && retries > 0) {
        const delay = 5000 * Math.pow(3, maxRetries - retries); // 5s, 15s, 45s
        console.warn(`LLM call failed (${msg}), retrying in ${delay}ms (${retries} retries left)`);
        await new Promise(r => setTimeout(r, delay));
        return attempt(retries - 1);
      }
      throw err;
    }
  }
  return attempt(maxRetries);
}

/** Extract and validate JSON from an LLM response string. */
function extractJsonFromResponse(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return content;
  }
  console.warn('LLM response was not clean JSON, attempting to extract JSON block');
  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      JSON.parse(match[0]);
      return match[0];
    } catch {
      // Fall through
    }
  }
  console.error('LLM returned invalid JSON. Raw response (first 2000 chars):', content.slice(0, 2000));
  throw new Error('LLM returned invalid JSON for assessment analysis');
}

// ============================================================================
// 2-Phase Structure-First Analysis (HCMW-004)
// ============================================================================

/**
 * HCMW-004 Structure-First Drafting: 2-phase report generation.
 *
 * Phase 1: Produce a structural plan (thesis, argument movement, section jobs,
 *   evidence placement, deliberate omissions). Fast call (~2 min timeout).
 * Phase 2: Generate the full report following the structural plan.
 *   Standard call (~10 min timeout).
 *
 * If Phase 1 fails after retries, falls back gracefully to the single-pass
 * approach (preserving compatibility with the pre-HCMW-004 pipeline).
 *
 * Logs the structural plan for auditability.
 */
export async function analyzeTranscriptStructured(
  job: AssessmentReportJob,
  tools?: AITool[],
  evidenceMap?: EvidenceMap,
  budgetSignal?: BudgetSignal
): Promise<{ analysis: string; plan: StructuralPlan | null; usedStructureFirst: boolean }> {
  // ========================================================================
  // Phase 1: Structural Plan
  // ========================================================================
  const planMessages = buildStructurePlanPrompt(job.transcript, job, tools, evidenceMap, budgetSignal);

  let plan: StructuralPlan | null = null;
  let planAccepted = false;

  try {
    const planResponse = await llmCallWithRetry(planMessages, { timeoutMs: 120_000 }, 3);
    const planJson = extractJsonFromResponse(planResponse.content);

    // Parse and validate the structural plan
    const parsed = JSON.parse(planJson);
    if (
      typeof parsed.thesis === 'string' && parsed.thesis.length > 0 &&
      typeof parsed.argumentMovement === 'string' &&
      Array.isArray(parsed.sections) && parsed.sections.length >= 5 &&
      typeof parsed.connectiveLogic === 'string' &&
      typeof parsed.evidencePlacement === 'string' &&
      typeof parsed.deliberateOmissions === 'string'
    ) {
      plan = {
        thesis: parsed.thesis,
        argumentMovement: parsed.argumentMovement,
        sections: parsed.sections.map((s: any) => ({
          job: s.job || '',
          whyHere: s.whyHere || ''
        })),
        connectiveLogic: parsed.connectiveLogic,
        evidencePlacement: parsed.evidencePlacement,
        deliberateOmissions: parsed.deliberateOmissions
      };
      planAccepted = true;

      console.info('[llm-analysis:phase-1] Structural plan produced', {
        thesis: plan.thesis.slice(0, 100),
        sectionCount: plan.sections.length,
        hasEvidencePlacement: plan.evidencePlacement.length > 0,
        hasOmissions: plan.deliberateOmissions.length > 0
      });
    } else {
      console.warn('[llm-analysis:phase-1] Structural plan validation failed — invalid structure, falling back to single-pass', {
        hasThesis: typeof parsed.thesis === 'string',
        hasArgumentMovement: typeof parsed.argumentMovement === 'string',
        sectionCount: Array.isArray(parsed.sections) ? parsed.sections.length : 'not-array',
        hasConnectiveLogic: typeof parsed.connectiveLogic === 'string',
        hasEvidencePlacement: typeof parsed.evidencePlacement === 'string',
        hasOmissions: typeof parsed.deliberateOmissions === 'string'
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[llm-analysis:phase-1] Plan generation failed: ${msg}. Falling back to single-pass.`);
  }

  // ========================================================================
  // Phase 2: Full Report (or fallback to single-pass)
  // ========================================================================
  if (planAccepted && plan) {
    // Phase 2: Generate report from plan
    const reportMessages = buildReportFromPlanPrompt(job.transcript, job, plan, tools, evidenceMap, budgetSignal);

    try {
      const reportResponse = await llmCallWithRetry(reportMessages, { timeoutMs: 600_000 }, 3);
      const analysis = extractJsonFromResponse(reportResponse.content);

      console.info('[llm-analysis:phase-2] Report generated from structural plan', {
        analysisLength: analysis.length,
        planThesis: plan.thesis.slice(0, 80)
      });

      return { analysis, plan, usedStructureFirst: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[llm-analysis:phase-2] Report generation from plan failed: ${msg}. Falling back to single-pass.`);
    }
  }

  // Fallback: single-pass analysis
  console.info('[llm-analysis] Using single-pass fallback (structure-first not available or failed)');
  const analysis = await analyzeTranscript(job, tools, evidenceMap, budgetSignal);
  return { analysis, plan: null, usedStructureFirst: false };
}

/**
 * Original single-pass analysis — preserved for backward compatibility
 * and as the fallback when Phase 1 of structure-first fails.
 */
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
