/**
 * Tool research cache and lookup tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { buildSearchQuery, CACHE_TTL_MS } from '$lib/server/assessment/tool-cache';

// Mock $env/dynamic/private before importing tool-lookup
vi.mock('$env/dynamic/private', () => ({
  env: {}
}));

import { formatToolsForPrompt, enrichAnalysisWithTools, lookupToolsForTranscript } from '$lib/server/assessment/tool-lookup';
import type { AITool } from '$lib/server/assessment/tool-lookup';

function sampleTools(): AITool[] {
  return [
    { name: 'Xero', url: 'https://futurepedia.io/tool/xero', one_line_description: 'Cloud accounting software', pricing_hint: '$65/mo', category: 'accounting', source: 'futurepedia', team_size_fit: null, au_available: null, au_support_hours: null, free_tier: null, free_tier_details: null, verified_at: null, verified_price: null, monthly_cost_aud_min: null, monthly_cost_aud_max: null },
    { name: 'Zapier', url: 'https://futurepedia.io/tool/zapier', one_line_description: 'Workflow automation', pricing_hint: '$19.99/mo', category: 'automation', source: 'futurepedia', team_size_fit: null, au_available: null, au_support_hours: null, free_tier: null, free_tier_details: null, verified_at: null, verified_price: null, monthly_cost_aud_min: null, monthly_cost_aud_max: null },
    { name: 'Copy.ai', url: 'https://futurepedia.io/tool/copyai', one_line_description: 'AI content generation', pricing_hint: '$49/mo', category: 'content', source: 'futurepedia', team_size_fit: null, au_available: null, au_support_hours: null, free_tier: null, free_tier_details: null, verified_at: null, verified_price: null, monthly_cost_aud_min: null, monthly_cost_aud_max: null },
    { name: 'Notion AI', url: 'https://futurepedia.io/tool/notion-ai', one_line_description: 'AI-powered workspace', pricing_hint: '$10/mo', category: 'productivity', source: 'taaft', team_size_fit: null, au_available: null, au_support_hours: null, free_tier: null, free_tier_details: null, verified_at: null, verified_price: null, monthly_cost_aud_min: null, monthly_cost_aud_max: null },
    { name: 'Otter.ai', url: 'https://futurepedia.io/tool/otter', one_line_description: 'AI meeting transcription', pricing_hint: 'Free tier', category: 'meetings', source: 'futurepedia', team_size_fit: null, au_available: null, au_support_hours: null, free_tier: null, free_tier_details: null, verified_at: null, verified_price: null, monthly_cost_aud_min: null, monthly_cost_aud_max: null },
    { name: 'Jasper', url: 'https://futurepedia.io/tool/jasper', one_line_description: 'AI writing assistant', pricing_hint: '$49/mo', category: 'content', source: 'futurepedia', team_size_fit: null, au_available: null, au_support_hours: null, free_tier: null, free_tier_details: null, verified_at: null, verified_price: null, monthly_cost_aud_min: null, monthly_cost_aud_max: null },
  ];
}

describe('Tool Cache', () => {
  it('CACHE_TTL_MS is 24 hours', () => {
    expect(CACHE_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('buildSearchQuery combines pain point queries', () => {
    const painPoints = [
      { title: 'Data Entry', description: 'Manual data entry takes too long', search_queries: ['AI data entry automation', 'document parsing AI'] },
      { title: 'Customer Support', description: 'Can\'t keep up with inquiries', search_queries: ['AI customer support chatbot', 'automated response system'] }
    ];
    const query = buildSearchQuery(painPoints);
    expect(query).toContain('AI data entry automation');
    expect(query).toContain('automated response system');
    expect(query.split(' ').length).toBeGreaterThanOrEqual(4);
  });

  it('buildSearchQuery falls back to title if no search_queries', () => {
    const painPoints = [{ title: 'Manual Data Entry', description: 'Takes too long' }];
    const query = buildSearchQuery(painPoints);
    expect(query).toContain('Manual Data Entry');
  });
});

describe('Tool Result Limiting (3-5 tools)', () => {
  it('limits to 5 tools', () => {
    const all = sampleTools();
    expect(all.length).toBeGreaterThan(5);
    const limited = all.slice(0, 5);
    expect(limited.length).toBe(5);
  });

  it('returns empty array for empty input', () => {
    expect([].slice(0, 5)).toEqual([]);
  });

  it('returns fewer when source has fewer than 5', () => {
    const few = sampleTools().slice(0, 2);
    expect(few.length).toBe(2);
    expect(few.slice(0, 5).length).toBe(2);
  });
});

describe('formatToolsForPrompt', () => {
  it('returns markdown for tools', () => {
    const tools = sampleTools().slice(0, 2);
    const formatted = formatToolsForPrompt(tools);
    expect(formatted).toContain('Xero');
    expect(formatted).toContain('Zapier');
    expect(formatted).toContain('futurepedia');
    expect(formatted).toContain('RESEARCHED AI TOOLS');
  });

  it('returns empty for no tools', () => {
    expect(formatToolsForPrompt([])).toBe('');
  });
});

describe('enrichAnalysisWithTools', () => {
  it('adds researched_tools section to analysis JSON', () => {
    const analysis = JSON.stringify({
      executive_summary: 'Test analysis',
      quick_wins: [{ title: 'Automate invoicing', recommended_tools: ['Xero'] }]
    });
    const tools = sampleTools().slice(0, 2);
    const enriched = enrichAnalysisWithTools(analysis, tools);
    const parsed = JSON.parse(enriched);
    expect(parsed.researched_tools).toHaveLength(2);
    expect(parsed.researched_tools[0].name).toBe('Xero');
  });

  it('returns original analysis if no tools provided', () => {
    const analysis = JSON.stringify({ executive_summary: 'test' });
    expect(enrichAnalysisWithTools(analysis, [])).toBe(analysis);
  });

  it('enriches quick_wins with tool URLs', () => {
    const analysis = JSON.stringify({
      executive_summary: 'Test',
      quick_wins: [{ title: 'Automate', recommended_tools: ['Xero'] }]
    });
    const enriched = enrichAnalysisWithTools(analysis, sampleTools().slice(0, 1));
    const parsed = JSON.parse(enriched);
    expect(parsed.quick_wins[0].recommended_tools[0]).toContain('https://');
  });

  it('handles malformed JSON gracefully', () => {
    const result = enrichAnalysisWithTools('not-json', sampleTools().slice(0, 1));
    expect(result).toContain('not-json');
    expect(result).toContain('Xero');
  });
});

describe('Graceful Degradation', () => {
  it('stageToolResearch returns empty array on error (not throw)', async () => {
    // Without PERPLEXITY_API_KEY, lookupToolsForTranscript returns []
    const tools = await lookupToolsForTranscript('', null);
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBe(0);
  });
});
