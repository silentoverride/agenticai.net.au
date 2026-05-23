/**
 * Gate Definitions — the three canonical gate types.
 *
 * Each gate evaluates a specific pipeline artifact and is configured with:
 * - A system prompt that instructs the judge model
 * - A reasoning.effort level (low/medium/high)
 * - Feature flag and kill-switch env vars for operational control
 *
 * Gate types:
 *   quick-wins-verification    — validates that Quick Win recommendations are
 *                                supported by the transcript evidence
 *   major-project-verification — validates that deeper opportunity recommendations
 *                                are supported by the evidence
 *   report-review              — validates the complete briefing for quality,
 *                                accuracy, and safety
 */

import type { GateDefinition } from './types';

// ============================================================================
// Quick Wins Verification Gate
// ============================================================================

const QUICK_WINS_SYSTEM_PROMPT = `You are an expert business assessment quality evaluator.
Your role is to verify that each "Quick Win" recommendation in the assessment report
is clearly supported by evidence from the customer's intake transcript.

For each Quick Win, evaluate:
1. **Evidence support** — Does the transcript contain specific statements from the
   customer that justify this recommendation? Look for direct quotes or clear paraphrases.
2. **Hallucination check** — Is the recommendation based on something the customer
   actually said, not assumed or invented?
3. **Specificity** — Does the recommendation address the customer's specific situation,
   or is it generic?

Return a structured JSON verdict with:
- verdict: "approve" (all Quick Wins supported), "retry" (some unclear, needs regeneration),
  "block" (multiple hallucinations or unsupported claims), or "human_assist" (ambiguous)
- confidence: 0.0–1.0 float
- reasoning: concise explanation of your evaluation
- details: specific examples of supported/unsupported claims`;

const MAJOR_PROJECT_SYSTEM_PROMPT = `You are an expert business assessment quality evaluator.
Your role is to verify that "Deeper Opportunity" recommendations (major projects)
are supported by evidence from the customer's intake transcript.

For each Deeper Opportunity, evaluate:
1. **Evidence support** — Does the transcript contain specific customer statements
   justifying this as a meaningful opportunity?
2. **Proportionality** — Is the estimated effort/value proportional to what the
   customer described?
3. **Hallucination check** — No invented tools, costs, or timelines.

Return a structured JSON verdict with:
- verdict: "approve" (all supported), "retry" (some issues to regenerate),
  "block" (unsupported or hallucinated), "human_assist" (requires human judgment)
- confidence: 0.0–1.0 float
- reasoning: concise explanation
- details: specific findings`;

const REPORT_REVIEW_SYSTEM_PROMPT = `You are an expert business assessment quality evaluator.
Your role is to evaluate the complete Advisory Briefing for quality, accuracy, and safety.

Evaluate the entire briefing against these criteria:
1. **Completeness** — Does the briefing include all required sections?
2. **Accuracy** — Are the recommendations grounded in the transcript evidence?
3. **Safety** — Does any content resemble regulated professional advice
   (legal, financial, tax, medical, HR, compliance)?
4. **Clarity** — Is the language clear and actionable without being alarmist?

Return a structured JSON verdict with:
- verdict: "approve" (passes all checks), "retry" (minor issues to fix),
  "block" (significant quality or safety issues), "human_assist" (requires judgment),
  "escalate" (safety concern — escalate to human)
- confidence: 0.0–1.0 float
- reasoning: concise explanation
- details: specific section-by-section findings`;

// ============================================================================
// Gate Registry
// ============================================================================

/**
 * All registered gate definitions.
 * Each gate has a unique type identifier and a configured system prompt.
 */
export const GATE_DEFINITIONS: GateDefinition[] = [
  {
    type: 'quick-wins-verification',
    name: 'Quick Wins Verification',
    description: 'Validates that Quick Win recommendations are supported by transcript evidence.',
    systemPrompt: QUICK_WINS_SYSTEM_PROMPT,
    reasoningEffort: 'medium',
    enabled: true,
    featureFlag: 'GATE_QUICK_WINS_ENABLED',
    killSwitch: 'GATE_QUICK_WINS_KILL'
  },
  {
    type: 'major-project-verification',
    name: 'Major Project Verification',
    description: 'Validates that Deeper Opportunity recommendations are supported by transcript evidence.',
    systemPrompt: MAJOR_PROJECT_SYSTEM_PROMPT,
    reasoningEffort: 'high',
    enabled: true,
    featureFlag: 'GATE_MAJOR_PROJECT_ENABLED',
    killSwitch: 'GATE_MAJOR_PROJECT_KILL'
  },
  {
    type: 'report-review',
    name: 'Report Review',
    description: 'Evaluates the complete Advisory Briefing for quality, accuracy, and safety.',
    systemPrompt: REPORT_REVIEW_SYSTEM_PROMPT,
    reasoningEffort: 'high',
    enabled: true,
    featureFlag: 'GATE_REPORT_REVIEW_ENABLED',
    killSwitch: 'GATE_REPORT_REVIEW_KILL'
  }
];

/** Look up a gate definition by type. */
export function getGateDefinition(type: string): GateDefinition | undefined {
  return GATE_DEFINITIONS.find(g => g.type === type);
}

/** Check if a gate is enabled (respecting feature flags). */
export function isGateEnabled(
  gate: GateDefinition,
  envOverrides?: Record<string, string | undefined>
): boolean {
  if (!gate.enabled) return false;

  // Check feature flag
  if (gate.featureFlag) {
    const flags = envOverrides || process.env || {};
    const flagValue = flags[gate.featureFlag];
    if (flagValue === 'false' || flagValue === '0') return false;
  }

  // Check kill switch
  if (gate.killSwitch) {
    const flags = envOverrides || process.env || {};
    const killValue = flags[gate.killSwitch];
    if (killValue === 'true' || killValue === '1') return false;
  }

  return true;
}
