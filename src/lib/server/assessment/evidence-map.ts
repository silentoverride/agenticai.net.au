/**
 * Evidence Map — structured claims extracted from transcript before report generation.
 *
 * Sits between Stage 0 (Tool Research) and Stage 1 (LLM Analysis).
 * Every claim in the final report must trace back to an entry in this map.
 *
 * The evidence map is:
 * 1. Extracted from the transcript by a focused LLM call
 * 2. Passed into the report generation prompt (the LLM builds the report FROM the map)
 * 3. Evaluated by gates (the report-review gate scores the map against criteria)
 *
 * This is the single source of truth for what we know vs. what we inferred.
 */

import { env } from '$env/dynamic/private';
import type { BudgetSignal } from './types';

// ============================================================================
// Evidence Claim Types
// ============================================================================

/** The source of a claim — was it directly stated or inferred? */
export type EvidenceConfidence = 'direct' | 'inferred' | 'speculative';

/** Categories of evidence claims. */
export type EvidenceClaimType =
  | 'pain_point'
  | 'workflow_detail'
  | 'tool_usage'
  | 'metric'
  | 'business_context'
  | 'customer_channel'
  | 'budget_signal';

/** A single evidence claim extracted from the transcript. */
export interface EvidenceClaim {
  /** Unique claim identifier. */
  id: string;
  /** The factual claim (e.g., "Manual invoicing takes approximately 10 hours per week"). */
  claim: string;
  /** Category of evidence. */
  type: EvidenceClaimType;
  /** How confident are we this was actually stated? */
  confidence: EvidenceConfidence;
  /** Exact transcript quotes supporting this claim. */
  transcript_evidence: string[];
  /** Who performs this task, if identifiable from transcript. */
  performed_by: string | null;
  /** Hours per week, if a metric claim. */
  hours_per_week: number | null;
  /** Estimated annual cost, if a financial claim. */
  estimated_annual_cost_aud: number | null;
  /** OFEWG-009: Tool research source for this claim (null if transcript-only). */
  tool_source_type?: 'futurepedia' | 'taaft' | 'perplexity' | null;
  /** OFEWG-009: Specific tool/catalog entry name. */
  tool_source_name?: string | null;
  /** OFEWG-009: Source URL for verification. */
  tool_source_url?: string | null;
}

/** Gaps where the report needs information but the transcript doesn't contain it. */
export interface EvidenceGap {
  /** What the report needs but the transcript doesn't provide. */
  field: string;
  /** Why this matters for report quality. */
  gate_impact: string;
  /** What the report SHOULD say instead of inventing. */
  recommended_handling: string;
}

/** Complete evidence map for a single assessment. */
export interface EvidenceMap {
  /** All extracted claims. */
  claims: EvidenceClaim[];
  /** Summary statistics. */
  coverage: {
    total_claims: number;
    direct_claims: number;
    inferred_claims: number;
    speculative_claims: number;
    coverage_rate: number; // direct / total (0-1)
  };
  /** Information the report needs but the transcript doesn't contain. */
  gaps: EvidenceGap[];
  /** Timestamp of extraction. */
  extracted_at: string;
}

// Re-export traceability types from the pure module (no env dependency)
export { buildTraceabilityMatrix, type TraceabilityMatrix, type TraceabilityEntry, type ClaimSourceType } from './traceability';

// ============================================================================
// Evidence Extraction
// ============================================================================

interface PerplexityEvidenceResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/**
 * Extract structured evidence from a transcript.
 * This is Stage 0.5 — runs after tool research, before report generation.
 *
 * The evidence map becomes the foundation for the report.
 * The LLM report generator receives this map and builds the report from it.
 *
 * @param transcript - Raw transcript
 * @param budgetSignal - Budget signal from PRE-3 detection (optional)
 * @returns Structured evidence map
 */
export async function extractEvidenceMap(
  transcript: string,
  budgetSignal?: BudgetSignal
): Promise<EvidenceMap> {
  const perplexityKey = env.PERPLEXITY_API_KEY;
  if (!perplexityKey) {
    console.warn('PERPLEXITY_API_KEY not configured, returning empty evidence map');
    return emptyEvidenceMap();
  }

  const prompt = `You are an evidence extraction specialist. Your job is to extract ONLY what the customer actually said — not what you think they meant.

Below is a business assessment interview transcript. Extract every factual claim into a structured evidence map.

For each claim, classify:
- type: "pain_point" (frustration, waste, inefficiency), "workflow_detail" (how work is done), "tool_usage" (what tools they use), "metric" (specific numbers), "business_context" (industry, size, role), "customer_channel" (how customers reach them), "budget_signal" (money, cost, pricing)
- confidence: "direct" (the customer stated this explicitly), "inferred" (reasonably concluded from context), "speculative" (possible but not confirmed)
- performed_by: who does this task (role, not name), or null if unknown
- hours_per_week: if a numeric time claim, the number; otherwise null
- estimated_annual_cost_aud: if a dollar figure, the number in AUD; otherwise null

Also identify information GAPS — things the report needs but the transcript doesn't contain:
- field: what's missing
- gate_impact: why it matters for report quality
- recommended_handling: what the report should say instead of inventing

${budgetSignal && budgetSignal.source !== 'none' ? `Budget signal from PRE-3 detection: ${budgetSignal.min !== null ? `$${budgetSignal.min}-` : 'Up to '}$${budgetSignal.max} AUD/month (confidence: ${budgetSignal.confidence}). Include this as a budget_signal claim.` : ''}

Return ONLY a valid JSON object:
{
  "claims": [
    {
      "id": "claim-1",
      "claim": "what the customer said",
      "type": "pain_point",
      "confidence": "direct",
      "transcript_evidence": ["exact quote from transcript"],
      "performed_by": "office manager",
      "hours_per_week": 10,
      "estimated_annual_cost_aud": null
    }
  ],
  "gaps": [
    {
      "field": "hourly rate for time savings calculation",
      "gate_impact": "financial_impact cannot be calculated without a rate",
      "recommended_handling": "Use Australian SMB industry average and flag as assumed"
    }
  ]
}

Be conservative. If the transcript says "about 10 hours" use 10. If it says "a lot of time" don't guess. Mark it as speculative. DO NOT invent numbers.

TRANSCRIPT:
${transcript.slice(0, 12000)}${transcript.length > 12000 ? '...[truncated]' : ''}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${perplexityKey}`
      },
      body: JSON.stringify({
        model: env.PERPLEXITY_MODEL || 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are an evidence extraction specialist for business assessments. You extract only what was actually said — not what could be inferred. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4096
      }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Evidence extraction failed:', err instanceof Error ? err.message : String(err));
    return emptyEvidenceMap();
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    console.error('Evidence extraction API error:', await response.text().catch(() => ''));
    return emptyEvidenceMap();
  }

  const data = (await response.json()) as PerplexityEvidenceResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.warn('Evidence extraction returned empty');
    return emptyEvidenceMap();
  }

  try {
    const parsed = JSON.parse(content);
    const claims: EvidenceClaim[] = Array.isArray(parsed.claims)
      ? parsed.claims.filter((c: unknown) => c && typeof c === 'object')
      : [];
    const gaps: EvidenceGap[] = Array.isArray(parsed.gaps)
      ? parsed.gaps.filter((g: unknown) => g && typeof g === 'object')
      : [];

    const direct = claims.filter(c => c.confidence === 'direct').length;
    const inferred = claims.filter(c => c.confidence === 'inferred').length;
    const speculative = claims.filter(c => c.confidence === 'speculative').length;
    const total = claims.length;

    return {
      claims,
      coverage: {
        total_claims: total,
        direct_claims: direct,
        inferred_claims: inferred,
        speculative_claims: speculative,
        coverage_rate: total > 0 ? direct / total : 0
      },
      gaps,
      extracted_at: new Date().toISOString()
    };
  } catch (err) {
    console.warn('Failed to parse evidence map JSON:', String(content).slice(0, 200));
    return emptyEvidenceMap();
  }
}

function emptyEvidenceMap(): EvidenceMap {
  return {
    claims: [],
    coverage: { total_claims: 0, direct_claims: 0, inferred_claims: 0, speculative_claims: 0, coverage_rate: 0 },
    gaps: [{ field: 'unknown', gate_impact: 'Evidence extraction failed', recommended_handling: 'Flag for operator review' }],
    extracted_at: new Date().toISOString()
  };
}

/**
 * Format the evidence map as markdown for inclusion in the LLM analysis prompt.
 * This gives the report generator structured facts to build from, not a raw transcript to interpret.
 */
export function formatEvidenceMapForPrompt(evidenceMap: EvidenceMap, budgetSignal?: BudgetSignal): string {
  if (!evidenceMap.claims.length) return '';

  const budgetLine = budgetSignal && budgetSignal.source !== 'none'
    ? `\n**Budget Signal (PRE-3):** ${budgetSignal.min !== null ? `$${budgetSignal.min}–` : 'Up to '}$${budgetSignal.max} AUD/month (confidence: ${Math.round((budgetSignal.confidence ?? 0) * 100)}%)\n`
    : '';

  const directClaims = evidenceMap.claims.filter(c => c.confidence === 'direct');
  const inferredClaims = evidenceMap.claims.filter(c => c.confidence === 'inferred');
  const speculativeClaims = evidenceMap.claims.filter(c => c.confidence === 'speculative');

  const formatClaim = (c: EvidenceClaim) => {
    const parts = [`- **${c.type.replace(/_/g, ' ')}**: ${c.claim}`];
    if (c.performed_by) parts.push(`  - Performed by: ${c.performed_by}`);
    if (c.hours_per_week) parts.push(`  - Hours/week: ${c.hours_per_week}`);
    if (c.estimated_annual_cost_aud) parts.push(`  - Annual cost: $${c.estimated_annual_cost_aud} AUD`);
    parts.push(`  - Evidence: "${c.transcript_evidence[0] || 'no direct quote'}"`);
    // OFEWG-009: Tool research provenance
    if (c.tool_source_name) {
      const sourceDetail = c.tool_source_url
        ? `${c.tool_source_name} (${c.tool_source_url})`
        : c.tool_source_name;
      parts.push(`  - Tool source: ${sourceDetail} [${c.tool_source_type || 'unknown'}]`);
    }
    return parts.join('\n');
  };

  const sections = [];

  if (directClaims.length) {
    sections.push(`## VERIFIED CLAIMS (direct transcript statements)\n${directClaims.map(formatClaim).join('\n\n')}`);
  }

  if (inferredClaims.length) {
    sections.push(`## REASONABLE INFERENCES (supported by context)\n${inferredClaims.map(formatClaim).join('\n\n')}`);
  }

  if (speculativeClaims.length) {
    sections.push(`## SPECULATIVE (possible but not confirmed — DO NOT present as fact)\n${speculativeClaims.map(formatClaim).join('\n\n')}`);
  }

  if (evidenceMap.gaps.length) {
    sections.push(`## INFORMATION GAPS (report needs but transcript doesn't contain)\n${evidenceMap.gaps.map(g => `- **${g.field}**: ${g.gate_impact}\n  - Handling: ${g.recommended_handling}`).join('\n')}`);
  }

  return `\n\n---\nEVIDENCE MAP (extracted from transcript — use this as your foundation):\nCoverage: ${evidenceMap.coverage.direct_claims} direct / ${evidenceMap.coverage.total_claims} total (${Math.round(evidenceMap.coverage.coverage_rate * 100)}% coverage)${budgetLine}\n\n${sections.join('\n\n')}\n\nIMPORTANT: Build the report FROM this evidence map. Every claim in the report must trace back to a claim above. Mark inferences as estimates, not facts. Gap items should be handled with the recommended approach — do not invent.\n---\n`;
}
