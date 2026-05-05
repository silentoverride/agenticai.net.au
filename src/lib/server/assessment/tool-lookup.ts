import { env } from '$env/dynamic/private';

export interface AITool {
  name: string;
  url: string;
  one_line_description: string;
  pricing_hint: string;
  category: string;
  source: 'futurepedia' | 'taaft' | 'perplexity';
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

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
    })
  });

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

For each tool found, provide:
- name: exact product name
- url: link to the tool on futurepedia.io or theresanaiforthat.com (not the vendor's site)
- one_line_description: what it does in one sentence
- pricing_hint: free tier, starting price, or "contact for pricing"
- category: which pain point it solves (match one of the titles above)
- source: either "futurepedia" or "taaft"

Return ONLY a JSON array of tools. No markdown, no explanations. Limit to 8 tools total, prioritising tools with clear pricing and free tiers.`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
    })
  });

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
    const validTools = tools.filter((t: unknown) => t && typeof t === 'object' && (t as AITool).name && (t as AITool).url);
    
    // Deduplicate by name
    const seen = new Set<string>();
    const deduped = validTools.filter((t: AITool) => {
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
 * Quick lookup — extracts pain points and searches for tools in one call.
 * Best used as a pre-analysis step to enrich the report with real tool data.
 */
export async function lookupToolsForTranscript(transcript: string): Promise<AITool[]> {
  const start = Date.now();
  
  const painPoints = await extractPainPointsForToolLookup(transcript);
  if (!painPoints.length) {
    console.info('No pain points extracted, skipping tool lookup');
    return [];
  }

  const tools = await lookupToolsWithPerplexity(painPoints);
  console.info('Tool lookup complete', {
    painPoints: painPoints.length,
    toolsFound: tools.length,
    durationMs: Date.now() - start
  });

  return tools;
}

/**
 * Format discovered tools as markdown for inclusion in the LLM analysis prompt.
 */
export function formatToolsForPrompt(tools: AITool[]): string {
  if (!tools.length) return '';

  const lines = tools.map(t => {
    return `- **${t.name}** (${t.source}) — ${t.one_line_description}\n  - URL: ${t.url}\n  - Pricing: ${t.pricing_hint}\n  - Category: ${t.category}`;
  });

  return `\n\n---\nRESEARCHED AI TOOLS (from futurepedia.io and theresanaiforthat.com):\n${lines.join('\n')}\n---\n`;
}

/**
 * Merge discovered tools into an existing analysis JSON string.
 * Adds a "researched_tools" section and enriches quick_wins with URLs.
 */
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
      source: t.source
    }));

    // Try to enrich quick_wins with matching tool URLs
    if (Array.isArray(analysis.quick_wins)) {
      analysis.quick_wins = analysis.quick_wins.map((win: any) => {
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
