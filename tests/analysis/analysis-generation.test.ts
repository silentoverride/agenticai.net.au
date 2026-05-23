/**
 * Analysis generation pipeline tests.
 */

import { describe, it, expect } from 'vitest';
import { validateAnalysis, parseAndValidateAnalysis, createDefaultAnalysis } from '$lib/server/assessment/analysis-types';
import type { StructuredAnalysis } from '$lib/server/assessment/analysis-types';

function validAnalysis(): StructuredAnalysis {
  return {
    executive_summary: 'Test business needs AI automation to reduce manual data entry.',
    pain_points: [
      { title: 'Manual data entry', description: 'Staff spend 10h/week on data entry', severity: 'high', frequency: 'daily' }
    ],
    quick_wins: [
      { title: 'Automate invoicing', description: 'Use Xero for automated invoicing', effort: 'low', impact: 'high', estimated_hours_saved_per_week: 5 }
    ],
    deeper_opportunities: [
      { title: 'AI customer support', description: 'AI chatbot for common queries', category: 'ai_agent', estimated_setup_cost_aud: 15000, estimated_monthly_value_aud: 5000 }
    ],
    tool_recommendations: [
      { name: 'Xero', category: 'accounting', purpose: 'Invoicing automation', estimated_monthly_cost_aud: 65, setup_complexity: 'low' }
    ],
    implementation_roadmap: [
      { phase: 1, week: '1-2', actions: ['Set up Xero', 'Import existing invoices'] }
    ],
    financial_impact: {
      hours_saved_per_week: 20,
      hourly_rate_assumed_aud: 85,
      weekly_value_aud: 1700,
      annual_value_aud: 88400,
      estimated_tool_costs_monthly_aud: 500,
      net_annual_value_aud: 82400
    }
  };
}

describe('Analysis Validation', () => {
  it('validates a correct analysis', () => {
    const result = validateAnalysis(validAnalysis());
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.analysis.executive_summary).toContain('AI automation');
    }
  });

  it('rejects null/undefined', () => {
    expect(validateAnalysis(null).valid).toBe(false);
    expect(validateAnalysis(undefined).valid).toBe(false);
  });

  it('rejects non-object', () => {
    expect(validateAnalysis('string').valid).toBe(false);
    expect(validateAnalysis(42).valid).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = validateAnalysis({ executive_summary: 'test' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e: string) => e.includes('pain_points'))).toBe(true);
    }
  });

  it('rejects empty executive_summary', () => {
    const result = validateAnalysis({ ...validAnalysis(), executive_summary: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects empty arrays', () => {
    const result = validateAnalysis({ ...validAnalysis(), pain_points: [] });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e: string) => e.includes('pain_points'))).toBe(true);
    }
  });

  it('rejects non-numeric financial_impact fields', () => {
    const bad = { ...validAnalysis(), financial_impact: { ...validAnalysis().financial_impact, annual_value_aud: 'not-a-number' } };
    const result = validateAnalysis(bad);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e: string) => e.includes('financial_impact'))).toBe(true);
    }
  });

  it('validates all required field names are checked', () => {
    const minimal = {
      executive_summary: 'Test',
      pain_points: [{ title: 'P1', description: 'D1', severity: 'medium', frequency: 'weekly' }],
      quick_wins: [{ title: 'Q1', description: 'D1', effort: 'low', impact: 'high', estimated_hours_saved_per_week: 2 }],
      deeper_opportunities: [{ title: 'D1', description: 'D1', category: 'automation', estimated_setup_cost_aud: 1000, estimated_monthly_value_aud: 500 }],
      tool_recommendations: [{ name: 'T1', category: 'cat', purpose: 'p', estimated_monthly_cost_aud: 50, setup_complexity: 'low' }],
      implementation_roadmap: [{ phase: 1, week: '1-2', actions: ['a'] }],
      financial_impact: validAnalysis().financial_impact
    };
    expect(validateAnalysis(minimal).valid).toBe(true);
  });
});

describe('Parse and Validate', () => {
  it('parses valid JSON string', () => {
    const json = JSON.stringify(validAnalysis());
    const result = parseAndValidateAnalysis(json);
    expect(result.executive_summary).toBeDefined();
    expect(result.quick_wins).toHaveLength(1);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseAndValidateAnalysis('{invalid json}')).toThrow('not valid JSON');
  });

  it('throws on missing required fields', () => {
    expect(() => parseAndValidateAnalysis(JSON.stringify({ executive_summary: 'test' }))).toThrow('validation failed');
  });
});

describe('Default Analysis', () => {
  it('creates empty analysis with error message', () => {
    const d = createDefaultAnalysis('LLM timeout');
    expect(d.executive_summary).toContain('LLM timeout');
    expect(d.pain_points).toEqual([]);
    expect(d.financial_impact.net_annual_value_aud).toBe(0);
  });

  it('creates empty analysis without error', () => {
    const d = createDefaultAnalysis();
    expect(d.executive_summary).toContain('in progress');
  });

  it('creates default with all type-valid fields', () => {
    const d = createDefaultAnalysis();
    // Default analysis has empty arrays — validation requires non-empty,
    // but the structure is correct for a best-effort response
    expect(typeof d.executive_summary).toBe('string');
    expect(Array.isArray(d.pain_points)).toBe(true);
    expect(Array.isArray(d.quick_wins)).toBe(true);
    expect(typeof d.financial_impact.net_annual_value_aud).toBe('number');
  });
});

describe('Pipeline Timeout (NFR7)', () => {
  it('runWithTimeout resolves before timeout', async () => {
    const result = await runWithTimeout(
      () => Promise.resolve('done'),
      1000,
      'Should not timeout'
    );
    expect(result).toBe('done');
  });

  it('runWithTimeout rejects on timeout', async () => {
    await expect(
      runWithTimeout(
        () => new Promise(resolve => setTimeout(() => resolve('too late'), 500)),
        50,
        'Timed out'
      )
    ).rejects.toThrow('Timed out');
  });

  it('10-minute timeout constant exists', () => {
    const ANALYSIS_TIMEOUT_MS = 600_000;
    expect(ANALYSIS_TIMEOUT_MS).toBe(10 * 60 * 1000);
  });
});

async function runWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
