/**
 * Story 9.4 — Evidence Traceability (OFEWG-009)
 *
 * Tests for evidence claim provenance extension, traceability matrix builder,
 * and unsourced claim flagging.
 */

import { describe, it, expect } from 'vitest';
import { buildTraceabilityMatrix } from '../../src/lib/server/assessment/traceability';
import type { EvidenceMap, EvidenceClaim } from '../../src/lib/server/assessment/evidence-map';

// ============================================================================
// Helpers
// ============================================================================

function makeClaim(overrides: Partial<EvidenceClaim> = {}): EvidenceClaim {
  return {
    id: 'claim-1',
    claim: 'Manual invoicing takes approximately 10 hours per week',
    type: 'pain_point',
    confidence: 'direct',
    transcript_evidence: ['"I spend about 10 hours a week on invoicing"'],
    performed_by: 'office manager',
    hours_per_week: 10,
    estimated_annual_cost_aud: null,
    tool_source_type: null,
    tool_source_name: null,
    tool_source_url: null,
    ...overrides
  };
}

function makeEvidenceMap(claims: EvidenceClaim[]): EvidenceMap {
  return {
    claims,
    coverage: {
      total_claims: claims.length,
      direct_claims: claims.filter(c => c.confidence === 'direct').length,
      inferred_claims: claims.filter(c => c.confidence === 'inferred').length,
      speculative_claims: claims.filter(c => c.confidence === 'speculative').length,
      coverage_rate: claims.length > 0
        ? claims.filter(c => c.confidence === 'direct').length / claims.length
        : 0
    },
    gaps: [],
    extracted_at: new Date().toISOString()
  };
}

// ============================================================================
// EvidenceClaim backward compatibility
// ============================================================================

describe('EvidenceClaim backward compatibility', () => {
  it('works without tool source fields (backward compatible)', () => {
    const claim = makeClaim();
    // Old code that doesn't know about tool_source_* fields should still work
    expect(claim.id).toBe('claim-1');
    expect(claim.claim).toContain('invoicing');
    expect(claim.confidence).toBe('direct');
    expect(claim.transcript_evidence).toHaveLength(1);
    // Tool source fields default to undefined/null
    expect(claim.tool_source_type).toBeNull();
    expect(claim.tool_source_name).toBeNull();
    expect(claim.tool_source_url).toBeNull();
  });

  it('accepts tool source fields when populated', () => {
    const claim = makeClaim({
      tool_source_type: 'futurepedia',
      tool_source_name: 'Zapier',
      tool_source_url: 'https://futurepedia.io/zapier'
    });

    expect(claim.tool_source_type).toBe('futurepedia');
    expect(claim.tool_source_name).toBe('Zapier');
    expect(claim.tool_source_url).toBe('https://futurepedia.io/zapier');
  });
});

// ============================================================================
// buildTraceabilityMatrix
// ============================================================================

describe('buildTraceabilityMatrix', () => {
  it('classifies direct transcript claims as transcript_direct', () => {
    const claim = makeClaim({ confidence: 'direct' });
    const evidenceMap = makeEvidenceMap([claim]);
    const matrix = buildTraceabilityMatrix(evidenceMap);

    expect(matrix.entries).toHaveLength(1);
    expect(matrix.entries[0].source_type).toBe('transcript_direct');
    expect(matrix.entries[0].independently_verifiable).toBe(true);
  });

  it('classifies inferred claims as transcript_inferred', () => {
    const claim = makeClaim({
      confidence: 'inferred',
      transcript_evidence: ['"We probably need to automate some things"']
    });
    const evidenceMap = makeEvidenceMap([claim]);
    const matrix = buildTraceabilityMatrix(evidenceMap);

    expect(matrix.entries[0].source_type).toBe('transcript_inferred');
  });

  it('classifies tool-type claims with tool source as tool_research', () => {
    const claim = makeClaim({
      type: 'tool_usage',
      confidence: 'inferred',
      transcript_evidence: ['"We use spreadsheets for everything"'],
      tool_source_type: 'futurepedia',
      tool_source_name: 'Zapier',
      tool_source_url: 'https://futurepedia.io/zapier'
    });
    const evidenceMap = makeEvidenceMap([claim]);
    const tools = [{ name: 'Zapier', source: 'futurepedia', url: 'https://futurepedia.io/zapier' }];
    const matrix = buildTraceabilityMatrix(evidenceMap, tools);

    expect(matrix.entries[0].source_type).toBe('tool_research');
    expect(matrix.entries[0].tool_source).toEqual({
      name: 'Zapier',
      type: 'futurepedia',
      url: 'https://futurepedia.io/zapier'
    });
  });

  it('flags claims with no evidence as llm_inference_only', () => {
    const claim = makeClaim({
      confidence: 'speculative',
      transcript_evidence: [] // No transcript evidence
      // No tool source either
    });
    const evidenceMap = makeEvidenceMap([claim]);
    const matrix = buildTraceabilityMatrix(evidenceMap);

    expect(matrix.entries[0].source_type).toBe('llm_inference_only');
    expect(matrix.entries[0].independently_verifiable).toBe(false);
    expect(matrix.warnings.length).toBeGreaterThan(0);
    expect(matrix.warnings[0]).toContain('LLM inference only');
  });

  it('produces correct summary counts', () => {
    const claims = [
      makeClaim({ id: 'c1', confidence: 'direct', transcript_evidence: ['"I spend 10 hours"'] }),
      makeClaim({ id: 'c2', confidence: 'inferred', transcript_evidence: ['"Probably need automation"'] }),
      makeClaim({ id: 'c3', confidence: 'speculative', transcript_evidence: [] })
    ];
    const evidenceMap = makeEvidenceMap(claims);
    const matrix = buildTraceabilityMatrix(evidenceMap);

    expect(matrix.summary.total_claims).toBe(3);
    expect(matrix.summary.transcript_direct).toBe(1);
    expect(matrix.summary.transcript_inferred).toBe(1);
    expect(matrix.summary.llm_inference_only).toBe(1);
    expect(matrix.summary.tool_research).toBe(0);
    expect(matrix.summary.verifiable_pct).toBe(67); // 2 of 3
  });

  it('handles empty evidence map', () => {
    const evidenceMap = makeEvidenceMap([]);
    const matrix = buildTraceabilityMatrix(evidenceMap);

    expect(matrix.entries).toHaveLength(0);
    expect(matrix.warnings).toHaveLength(0);
    expect(matrix.summary.total_claims).toBe(0);
    expect(matrix.summary.verifiable_pct).toBe(0);
  });

  it('matches tool sources case-insensitively', () => {
    const claim = makeClaim({
      type: 'tool_usage',
      confidence: 'inferred',
      transcript_evidence: ['"We need automation"'],
      tool_source_type: 'taaft',
      tool_source_name: 'HUBSPOT', // uppercase
    });
    const evidenceMap = makeEvidenceMap([claim]);
    const tools = [{ name: 'hubspot', source: 'taaft', url: 'https://taaft.com/hubspot' }]; // lowercase
    const matrix = buildTraceabilityMatrix(evidenceMap, tools);

    expect(matrix.entries[0].source_type).toBe('tool_research');
    expect(matrix.entries[0].tool_source!.name).toBe('hubspot');
  });

  it('non-tool-type claims with tool source remain transcript-based', () => {
    const claim = makeClaim({
      type: 'pain_point', // not tool_usage
      confidence: 'direct',
      transcript_evidence: ['"Invoicing takes forever"'],
      tool_source_type: 'perplexity',
      tool_source_name: 'Xero',
    });
    const evidenceMap = makeEvidenceMap([claim]);
    const tools = [{ name: 'Xero', source: 'perplexity' }];
    const matrix = buildTraceabilityMatrix(evidenceMap, tools);

    // Should still be transcript_direct since it's a pain_point, not tool_usage
    expect(matrix.entries[0].source_type).toBe('transcript_direct');
    // But tool_source is still populated
    expect(matrix.entries[0].tool_source!.name).toBe('Xero');
  });
});
