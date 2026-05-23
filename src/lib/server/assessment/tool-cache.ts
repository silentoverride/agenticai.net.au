/**
 * Tool research cache — caches Perplexity tool search results in D1 with 24h TTL.
 *
 * Uses a SHA-256 hash of the combined search query as the cache key.
 * Cache entries expire 24 hours after creation.
 */

import type { AITool } from './tool-lookup';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a SHA-256 hash for a cache key.
 */
async function hashQuery(query: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(query);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check the cache for a given search query.
 * Returns cached tools if found and not expired.
 */
export async function getCachedTools(
  db: D1Database | null | undefined,
  query: string
): Promise<AITool[] | null> {
  if (!db) return null;

  try {
    const queryHash = await hashQuery(query);
    const row = await db.prepare(
      'SELECT results_json FROM tool_research_cache WHERE query_hash = ? AND expires_at > datetime(\'now\')'
    ).bind(queryHash).first<{ results_json: string }>();

    if (row?.results_json) {
      const tools = JSON.parse(row.results_json) as AITool[];
      console.info('[tool-cache] Cache hit', { queryHash: queryHash.slice(0, 12), tools: tools.length });
      return tools;
    }

    console.info('[tool-cache] Cache miss', { queryHash: queryHash.slice(0, 12) });
    return null;
  } catch (err) {
    console.warn('[tool-cache] Cache lookup failed (continuing without cache):', err);
    return null;
  }
}

/**
 * Store tool research results in the cache.
 */
export async function setCachedTools(
  db: D1Database | null | undefined,
  query: string,
  tools: AITool[]
): Promise<void> {
  if (!db || tools.length === 0) return;

  try {
    const queryHash = await hashQuery(query);
    await db.prepare(
      `INSERT INTO tool_research_cache (query_hash, query_text, results_json, tool_count, expires_at)
       VALUES (?, ?, ?, ?, datetime('now', '+24 hours'))
       ON CONFLICT(query_hash) DO NOTHING`
    ).bind(
      queryHash,
      query.slice(0, 500),
      JSON.stringify(tools),
      tools.length
    ).run();

    console.info('[tool-cache] Stored', { queryHash: queryHash.slice(0, 12), tools: tools.length });
  } catch (err) {
    console.warn('[tool-cache] Cache store failed (non-blocking):', err);
  }
}

/**
 * Generate a combined search query from pain points for cache key purposes.
 */
export function buildSearchQuery(painPoints: Array<{ title: string; description: string; search_queries?: string[] }>): string {
  return painPoints
    .flatMap(p => p.search_queries || [p.title])
    .join(' ');
}

export { CACHE_TTL_MS };
