/**
 * Evidence Traceability Matrix (OFEWG-009)
 *
 * Maps every evidence claim to its source provenance:
 * transcript → tool research → catalog entry → inference.
 *
 * This is a pure module — no env imports, no external API calls.
 * Separated from evidence-map.ts to enable testing without $env bindings.
 */

import type { EvidenceMap, EvidenceClaim, EvidenceConfidence } from './evidence-map';

// ============================================================================
// Traceability Types
// ============================================================================

/** Classification of a claim's evidence source. */
export type ClaimSourceType = 'transcript_direct' | 'transcript_inferred' | 'tool_research' | 'llm_inference_only';

/** A single entry in the traceability matrix. */
export interface TraceabilityEntry {
  claim_id: string;
  claim: string;
  source_type: ClaimSourceType;
  /** Transcript evidence, if any. */
  transcript_refs: string[];
  /** Tool research source, if any. */
  tool_source: { name: string; type: string; url?: string } | null;
  /** Confidence level. */
  confidence: EvidenceConfidence;
  /** Whether this claim is independently verifiable via external sources. */
  independently_verifiable: boolean;
}

/** Complete traceability matrix for an assessment. */
export interface TraceabilityMatrix {
  entries: TraceabilityEntry[];
  summary: {
    total_claims: number;
    transcript_direct: number;
    transcript_inferred: number;
    tool_research: number;
    llm_inference_only: number;
    verifiable_pct: number;
  };
  /** Warnings for claims that lack evidence provenance. */
  warnings: string[];
}

// ============================================================================
// Builder
// ============================================================================

/**
 * Build a traceability matrix from evidence map and tool research results.
 *
 * Maps each evidence claim to its source provenance:
 * - transcript_direct: claim backed by direct transcript quote
 * - transcript_inferred: claim reasonably inferred from context
 * - tool_research: claim backed by a tool research catalog entry
 * - llm_inference_only: claim with no external evidence source
 *
 * This is a deterministic, pure function — no LLM calls.
 */
export function buildTraceabilityMatrix(
  evidenceMap: EvidenceMap,
  tools?: Array<{ name: string; source: string; url?: string }>
): TraceabilityMatrix {
  const entries: TraceabilityEntry[] = [];
  const warnings: string[] = [];

  for (const claim of evidenceMap.claims) {
    // Determine source type
    let sourceType: ClaimSourceType = 'llm_inference_only';
    const transcriptRefs: string[] = [];
    let toolSource: TraceabilityEntry['tool_source'] = null;

    // Check transcript evidence
    if (claim.transcript_evidence.length > 0) {
      transcriptRefs.push(...claim.transcript_evidence.slice(0, 2));
      sourceType = claim.confidence === 'direct' ? 'transcript_direct' : 'transcript_inferred';
    }

    // Check tool research provenance
    if (claim.tool_source_name && tools) {
      const matched = tools.find(t =>
        t.name.toLowerCase() === claim.tool_source_name!.toLowerCase()
      );
      if (matched) {
        toolSource = {
          name: matched.name,
          type: matched.source,
          url: matched.url
        };
        // Tool research overrides transcript as the primary source for tool-type claims
        if ((claim.type as string) === 'tool_usage') {
          sourceType = 'tool_research';
        }
      }
    }

    // Flag unsourced claims
    const isVerifiable = transcriptRefs.length > 0 || toolSource !== null;
    if (!isVerifiable) {
      sourceType = 'llm_inference_only';
      warnings.push(`Claim "${claim.claim.slice(0, 80)}..." has no evidence source — flagged as LLM inference only.`);
    }

    entries.push({
      claim_id: claim.id,
      claim: claim.claim,
      source_type: sourceType,
      transcript_refs: transcriptRefs,
      tool_source: toolSource,
      confidence: claim.confidence,
      independently_verifiable: isVerifiable
    });
  }

  const counts = {
    transcript_direct: entries.filter(e => e.source_type === 'transcript_direct').length,
    transcript_inferred: entries.filter(e => e.source_type === 'transcript_inferred').length,
    tool_research: entries.filter(e => e.source_type === 'tool_research').length,
    llm_inference_only: entries.filter(e => e.source_type === 'llm_inference_only').length
  };

  return {
    entries,
    summary: {
      total_claims: entries.length,
      ...counts,
      verifiable_pct: entries.length > 0
        ? Math.round(((counts.transcript_direct + counts.transcript_inferred + counts.tool_research) / entries.length) * 100)
        : 0
    },
    warnings
  };
}
