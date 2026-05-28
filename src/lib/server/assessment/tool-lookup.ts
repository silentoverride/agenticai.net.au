import { env } from '$env/dynamic/private';
import { getCachedTools, setCachedTools, buildSearchQuery } from './tool-cache';
import { computeBudgetAlignment } from './budget-detection';
import type { BudgetSignal } from './types';

export interface AITool {
  name: string;
  url: string;
  one_line_description: string;
  pricing_hint: string;
  category: string;
  source: 'futurepedia' | 'taaft' | 'perplexity';

  // v2: Taste-encoding fields for gate evaluation
  // null = unverified — the tool was found but these fields weren't confirmed
  team_size_fit: 'solo' | 'small' | 'medium' | 'enterprise' | null;
  au_available: boolean | null;
  au_support_hours: string | null;
  free_tier: boolean | null;
  free_tier_details: string | null;
  verified_at: string | null;
  verified_price: string | null;
  monthly_cost_aud_min: number | null;
  monthly_cost_aud_max: number | null;

  /** Budget alignment computed from PRE-3 budget detection (optional). */
  budget_alignment?: string;
  /** Source of the budget signal used for alignment (optional). */
  budget_signal_source?: string;
}

export interface PainPoint {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  search_queries: string[];
}

interface PerplexityCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/**
 * Extract pain points from a transcript for tool lookup.
 * Uses a lightweight LLM call to get structured pain points with search queries.
 */
export async function extractPainPointsForToolLookup(transcript: string): Promise<PainPoint[]> {
  const perplexityKey = env.PERPLEXITY_API_KEY;
  if (!perplexityKey) {
    console.warn('PERPLEXITY_API_KEY not configured, skipping pain point extraction for tool lookup');
    return [];
  }

  const prompt = `Analyze this business assessment interview transcript and extract the top 3-5 pain points or workflow gaps where an AI tool could help.

For each pain point, provide:
- title: short name of the problem
- description: what the business owner said about it
- severity: high, medium, or low
- search_queries: 2-3 search query strings to find AI tools for this problem (e.g., "AI lead response automation small business", "AI document parsing automation")

Return ONLY a JSON array of pain points. No markdown, no explanations.

TRANSCRIPT:
${transcript.slice(0, 8000)}${transcript.length > 8000 ? '...[truncated]' : ''}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

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
          { role: 'system', content: 'You extract business pain points and generate search queries for AI tool discovery. Always return valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2048
      }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Perplexity pain-point extraction timed out after 20000ms');
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const error = await response.text().catch(() => '');
    console.error('Pain point extraction failed:', error);
    return [];
  }

  const data = (await response.json()) as PerplexityCompletionResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.warn('Perplexity returned empty pain point extraction');
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    // Handle both {pain_points: [...]} and [...] formats
    const painPoints = Array.isArray(parsed) ? parsed : parsed.pain_points || parsed.painPoints || [];
    return painPoints.filter((p: unknown) => p && typeof p === 'object') as PainPoint[];
  } catch {
    console.warn('Failed to parse pain point extraction JSON:', content.slice(0, 200));
    return [];
  }
}

/**
 * Search Perplexity for AI tools matching a set of pain points.
 * Returns a deduplicated list of real tools from Futurepedia and TAAFT.
 */
export async function lookupToolsWithPerplexity(painPoints: PainPoint[]): Promise<AITool[]> {
  const perplexityKey = env.PERPLEXITY_API_KEY;
  if (!perplexityKey) {
    console.warn('PERPLEXITY_API_KEY not configured, skipping tool lookup');
    return [];
  }

  if (!painPoints.length) {
    return [];
  }

  // Build a comprehensive search query from all pain points
  const searchTerms = painPoints
    .flatMap(p => p.search_queries || [p.title])
    .join(' OR ');

  const prompt = `Find specific AI software tools from futurepedia.io and theresanaiforthat.com that solve these business problems:

${painPoints.map((p, i) => `${i + 1}. ${p.title}: ${p.description}`).join('\n')}

For each tool found, provide these fields. CRITICAL fields (MUST be present — the tool is useless without them):
- name: exact product name (no embellishments, no "AI-powered" prefix)
- url: link to the tool ON futurepedia.io or theresanaiforthat.com (NOT the vendor's own site — we need the directory listing as provenance)
- one_line_description: what it does in one sentence — be specific, not marketing
- pricing_hint: free, starting price in AUD if known, or "contact for pricing" if pricing is opaque
- category: which pain point title above it solves (exact match to one of the titles)
- source: "futurepedia" or "taaft"

IMPORTANT fields (provide if you can confirm — null is acceptable but drops the taste score):
- team_size_fit: "solo", "small" (1-10), "medium" (11-50), "enterprise" (50+), or null if you cannot find team size guidance
- au_available: true if the tool is explicitly available to Australian businesses (AUD pricing, .com.au domain, AU data centers, AU phone support), false if it appears US/UK only, null if truly unclear
- free_tier: true if there is ANY free tier or free trial (even time-limited), false if paid-only, null if unknown
- free_tier_details: what the free tier includes specifically (e.g., "1 event type free", "14-day trial", "up to 3 users free"), or null if unknown
- verified_at: current date in ISO 8601 format
- verified_price: the starting price you can actually confirm from the directory listing (e.g., "Free / $15 AUD/mo"), or null if pricing requires contacting sales

NICE TO HAVE fields (optional, only if the directory listing makes them obvious):
- au_support_hours: Australian-friendly support hours in AEST/AEDT timezone, or null if unknown
- monthly_cost_aud_min: minimum monthly cost in AUD, or null
- monthly_cost_aud_max: maximum monthly cost referenced in AUD, or null

PRIORITIZATION: A tool with all CRITICAL fields filled but IMPORTANT fields null is BETTER than a tool with sparse fields across the board. Prioritize tools where you can confirm all critical fields. Limit to 8 tools total.

CRITICAL RULE: If you cannot find a tool on futurepedia.io or theresanaiforthat.com, DO NOT INVENT IT. Return fewer tools rather than unverifiable ones. Mark fields as null if you cannot confirm them — do not guess.

Return ONLY a valid JSON array of tool objects. No markdown, no explanations.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

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
          { role: 'system', content: 'You are an AI tool researcher specialising in finding real, current software tools from futurepedia.io and theresanaiforthat.com. Always return valid JSON arrays with accurate URLs.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 4096
      }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Perplexity tool lookup timed out after 25000ms');
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const error = await response.text().catch(() => '');
    console.error('Tool lookup failed:', error);
    return [];
  }

  const data = (await response.json()) as PerplexityCompletionResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.warn('Perplexity returned empty tool lookup');
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    const tools = Array.isArray(parsed) ? parsed : parsed.tools || parsed.ai_tools || [];
    const validTools = normalizeTools(tools);
    
    // Deduplicate by name
    const seen = new Set<string>();
    const deduped = validTools.filter(t => {
      const key = t.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped;
  } catch {
    console.warn('Failed to parse tool lookup JSON:', content.slice(0, 200));
    return [];
  }
}

/**
 * Normalize raw tool objects from Perplexity into the v2 AITool schema.
 * Fields not present or invalid become null — the gate treats null as "unverified."
 */
function normalizeTools(raw: unknown[]): AITool[] {
  return raw
    .filter((t): t is Record<string, unknown> => t != null && typeof t === 'object')
    .map(t => ({
      name: String(t.name ?? '').trim(),
      url: String(t.url ?? '').trim(),
      one_line_description: String(t.one_line_description ?? ''),
      pricing_hint: String(t.pricing_hint ?? ''),
      category: String(t.category ?? ''),
      source: (['futurepedia', 'taaft', 'perplexity'].includes(String(t.source)) ? t.source : 'perplexity') as AITool['source'],
      team_size_fit: (['solo', 'small', 'medium', 'enterprise'].includes(String(t.team_size_fit)) ? t.team_size_fit : null) as AITool['team_size_fit'],
      au_available: typeof t.au_available === 'boolean' ? t.au_available : null,
      au_support_hours: typeof t.au_support_hours === 'string' ? String(t.au_support_hours) : null,
      free_tier: typeof t.free_tier === 'boolean' ? t.free_tier : null,
      free_tier_details: typeof t.free_tier_details === 'string' ? String(t.free_tier_details) : null,
      verified_at: typeof t.verified_at === 'string' ? String(t.verified_at) : null,
      verified_price: typeof t.verified_price === 'string' ? String(t.verified_price) : null,
      monthly_cost_aud_min: typeof t.monthly_cost_aud_min === 'number' ? t.monthly_cost_aud_min : null,
      monthly_cost_aud_max: typeof t.monthly_cost_aud_max === 'number' ? t.monthly_cost_aud_max : null,
    })) as AITool[];
}

/**
 * Quick lookup — extracts pain points and searches for tools in one call.
 * Best used as a pre-analysis step to enrich the report with real tool data.
 *
 * @param transcript - Raw transcript text
 * @param db - Optional D1 database for caching results (24h TTL)
 * @param budgetSignal - Optional budget signal for pricing alignment tagging
 * @returns Array of AI tools (limited to 5 most relevant) with budget alignment
 */
export async function lookupToolsForTranscript(
  transcript: string,
  db?: D1Database | null,
  budgetSignal?: BudgetSignal
): Promise<AITool[]> {
  const start = Date.now();

  const painPoints = await extractPainPointsForToolLookup(transcript);
  if (!painPoints.length) {
    console.info('No pain points extracted, skipping tool lookup');
    return [];
  }

  // Check cache first (if D1 is available)
  const searchQuery = buildSearchQuery(painPoints);
  if (db && searchQuery) {
    const cached = await getCachedTools(db, searchQuery);
    if (cached && cached.length > 0) {
      console.info('Tool lookup complete (cached)', {
        painPoints: painPoints.length,
        toolsFound: cached.length,
        durationMs: Date.now() - start
      });
      return cached.slice(0, 5);
    }
  }

  const tools = await lookupToolsWithPerplexity(painPoints);

  // Cache results (if D1 is available)
  if (db && searchQuery && tools.length > 0) {
    await setCachedTools(db, searchQuery, tools);
  }

  // Limit to 5 most relevant tools (AC: 3-5 tools)
  const limited = tools.slice(0, 5);

  // Tag tools with budget alignment if budget signal is available
  if (budgetSignal && budgetSignal.source !== 'none') {
    for (const tool of limited) {
      tool.budget_alignment = computeBudgetAlignment(null, null, budgetSignal);
      tool.budget_signal_source = budgetSignal.source;
    }
  }

  console.info('Tool lookup complete', {
    painPoints: painPoints.length,
    toolsFound: limited.length,
    totalRaw: tools.length,
    durationMs: Date.now() - start
  });

  return limited;
}

/**
 * Format discovered tools as markdown for inclusion in the LLM analysis prompt.
 * Includes budget alignment information when available.
 */
export function formatToolsForPrompt(tools: AITool[], budgetSignal?: BudgetSignal): string {
  if (!tools.length) return '';

  const budgetHeader = budgetSignal && budgetSignal.source !== 'none'
    ? `\n\n**Customer Budget Signal:** ${budgetSignal.min !== null ? `$${budgetSignal.min}–` : 'Up to '}$${budgetSignal.max} AUD/month (confidence: ${Math.round(budgetSignal.confidence * 100)}%)\n`
    : '';

  const lines = tools.map(t => {
    const alignmentNote = t.budget_alignment && t.budget_alignment !== 'no_budget_signal'
      ? ` [${t.budget_alignment.replace(/_/g, ' ')}]`
      : '';
    const verifiedInfo = t.verified_at
      ? ` | Verified: ${new Date(t.verified_at).toLocaleDateString('en-AU')}${t.verified_price ? ` @ ${t.verified_price}` : ''}`
      : '';
    const auInfo = t.au_available === true ? ' [AU available]' : t.au_available === false ? ' [NOT AU verified]' : '';
    const sizeInfo = t.team_size_fit ? ` [team: ${t.team_size_fit}]` : '';
    const freeInfo = t.free_tier === true ? ` [Free tier: ${t.free_tier_details || 'yes'}]` : t.free_tier === false ? ' [Paid only]' : '';
    return `- **${t.name}** (${t.source})${alignmentNote} — ${t.one_line_description}\n  - URL: ${t.url}${auInfo}${sizeInfo}${freeInfo}\n  - Pricing: ${t.pricing_hint}${verifiedInfo}\n  - Category: ${t.category}`;
  });

  return `\n\n---\nRESEARCHED AI TOOLS (from futurepedia.io and theresanaiforthat.com):${budgetHeader}\n${lines.join('\n')}\n---\n`;
}

/**
 * Merge discovered tools into an existing analysis JSON string.
 * Adds a "researched_tools" section and enriches quick_wins with URLs.
 */
import type { AnalysisQuickWin } from './types';

export function enrichAnalysisWithTools(analysisJson: string, tools: AITool[]): string {
  if (!tools.length) return analysisJson;

  try {
    const analysis = JSON.parse(analysisJson);

    // Add researched_tools section
    analysis.researched_tools = tools.map(t => ({
      name: t.name,
      url: t.url,
      description: t.one_line_description,
      pricing: t.pricing_hint,
      category: t.category,
      source: t.source,
      team_size_fit: t.team_size_fit,
      au_available: t.au_available,
      free_tier: t.free_tier,
      free_tier_details: t.free_tier_details,
      verified_price: t.verified_price,
      monthly_cost_aud_min: t.monthly_cost_aud_min,
      monthly_cost_aud_max: t.monthly_cost_aud_max
    }));

    // Try to enrich quick_wins with matching tool URLs
    if (Array.isArray(analysis.quick_wins)) {
      analysis.quick_wins = analysis.quick_wins.map((win: AnalysisQuickWin) => {
        if (!win.recommended_tools || !Array.isArray(win.recommended_tools)) return win;
        
        win.recommended_tools = win.recommended_tools.map((toolName: string) => {
          const matched = tools.find(t => 
            toolName.toLowerCase().includes(t.name.toLowerCase()) ||
            t.name.toLowerCase().includes(toolName.toLowerCase().split(' ')[0])
          );
          return matched ? `${toolName} → ${matched.url}` : toolName;
        });
        return win;
      });
    }

    return JSON.stringify(analysis, null, 2);
  } catch {
    // If JSON parsing fails, append tools as markdown at the end
    return analysisJson + '\n\n' + formatToolsForPrompt(tools).replace(/---\n/g, '');
  }
}

// ============================================================================
// Minimum Viable Tool Data (MVTD) — tool retrieval contract
// ============================================================================

/**
 * The Minimum Viable Tool Data specification.
 *
 * Each tool retrieved from Futurepedia/TAAFT MUST satisfy these requirements
 * for the pipeline gates (TC1-TC3) to verify it. Tools that can't satisfy
 * MVTD are flagged and excluded from recommendations.
 *
 * Three tiers:
 * - CRITICAL: Gate blocking — tool FAILS verification without these
 * - IMPORTANT: Taste scoring — missing these dims the taste score
 * - NICE: Informational — surfaced in report but not scored
 */
export interface ToolQualityAssessment {
  /** The tool being assessed. */
  tool: AITool;
  /** Whether the tool passes MVTD (all critical fields present). */
  passesMVTD: boolean;
  /** Critical field failures — these are blockers. */
  criticalFailures: string[];
  /** Important field failures — these ding taste scores. */
  importantFailures: string[];
  /** Quality score 0-1: critical fields present / total critical fields. */
  qualityScore: number;
}

export const MVTD = {
  critical: {
    name:       { description: 'Exact product name',               gateImpact: 'TC1 — tool must be named to verify provenance' },
    url:        { description: 'URL on futurepedia.io or theresanaiforthat.com (NOT vendor site)', gateImpact: 'TC1 — URL proves the tool was actually researched' },
    description:{ description: 'One-line description of what the tool does', gateImpact: 'TC2 — description accuracy cannot be checked without a description' },
    pricing:    { description: 'Pricing hint: free, starting price in AUD, or "contact for pricing"', gateImpact: 'TC3 — pricing accuracy cannot be checked without a pricing baseline' },
    category:   { description: 'Which pain point this tool addresses',            gateImpact: 'A2 — internal consistency (tool must match problem)' },
    source:     { description: 'futurepedia or taaft',            gateImpact: 'TC1 — provenance source for tool verification' }
  },
  important: {
    au_available:    { description: 'Is this tool available to Australian businesses?', gateImpact: 'T5 AU Market Fit — AU availability scoring' },
    team_size_fit:   { description: 'solo | small | medium | enterprise',              gateImpact: 'T2 Recommendation Credibility — team size match' },
    free_tier:        { description: 'Does a free tier or trial exist?',               gateImpact: 'T2 Recommendation Credibility — free tier check' },
    verified_at:      { description: 'Date of verification (ISO 8601)',                gateImpact: 'T2 Recommendation Credibility — freshness of research' },
    verified_price:    { description: 'Confirmed starting price (e.g., "Free / $15 AUD/mo")', gateImpact: 'T2 Recommendation Credibility — price verification' }
  }
} as const;

/**
 * Validate a tool against the MVTD.
 * Returns a quality assessment showing what passed and what didn't.
 */
export function assessToolQuality(tool: AITool): ToolQualityAssessment {
  const criticalFailures: string[] = [];
  const importantFailures: string[] = [];

  if (!tool.name || tool.name.trim().length === 0)
    criticalFailures.push('name');
  if (!tool.url || tool.url.trim().length === 0 || !(tool.url.includes('futurepedia.io') || tool.url.includes('theresanaiforthat.com')))
    criticalFailures.push('url (must be futurepedia.io or theresanaiforthat.com)');
  if (!tool.one_line_description || tool.one_line_description.trim().length === 0)
    criticalFailures.push('one_line_description');
  if (!tool.pricing_hint || tool.pricing_hint.trim().length === 0)
    criticalFailures.push('pricing_hint');
  if (!tool.category || tool.category.trim().length === 0)
    criticalFailures.push('category');
  if (!tool.source || !['futurepedia', 'taaft', 'perplexity'].includes(tool.source))
    criticalFailures.push('source (must be futurepedia or taaft)');

  if (tool.au_available === null)
    importantFailures.push('au_available (unknown → default to false in taste scoring)');
  if (!tool.team_size_fit)
    importantFailures.push('team_size_fit (unset → no size match score)');
  if (tool.free_tier === null)
    importantFailures.push('free_tier (unknown → default to false in taste scoring)');
  if (!tool.verified_at)
    importantFailures.push('verified_at (missing → research freshness unknown)');
  if (!tool.verified_price)
    importantFailures.push('verified_price (missing → price verification impossible)');

  const criticalTotal = Object.keys(MVTD.critical).length;
  const criticalPassing = criticalTotal - criticalFailures.length;

  return {
    tool,
    passesMVTD: criticalFailures.length === 0,
    criticalFailures,
    importantFailures,
    qualityScore: criticalPassing / criticalTotal
  };
}

/**
 * Filter a tool list to only those passing MVTD.
 * Also reports quality stats for monitoring.
 */
export function filterToolsByMVTD(tools: AITool[]): {
  passing: AITool[];
  failing: ToolQualityAssessment[];
  stats: {
    total: number;
    passMVTD: number;
    failMVTD: number;
    avgQualityScore: number;
    mostCommonCriticalFailure: string | null;
    mostCommonImportantFailure: string | null;
  };
} {
  const assessments = tools.map(assessToolQuality);
  const passing = assessments.filter(a => a.passesMVTD).map(a => a.tool);
  const failing = assessments.filter(a => !a.passesMVTD);

  // Aggregate quality stats
  const avgQuality = assessments.length > 0
    ? assessments.reduce((sum, a) => sum + a.qualityScore, 0) / assessments.length
    : 0;

  const criticalCounts = new Map<string, number>();
  const importantCounts = new Map<string, number>();
  for (const a of assessments) {
    for (const f of a.criticalFailures) criticalCounts.set(f, (criticalCounts.get(f) || 0) + 1);
    for (const f of a.importantFailures) importantCounts.set(f, (importantCounts.get(f) || 0) + 1);
  }

  const mostCritical = [...criticalCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const mostImportant = [...importantCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    passing,
    failing,
    stats: {
      total: tools.length,
      passMVTD: passing.length,
      failMVTD: failing.length,
      avgQualityScore: avgQuality,
      mostCommonCriticalFailure: mostCritical,
      mostCommonImportantFailure: mostImportant
    }
  };
}
