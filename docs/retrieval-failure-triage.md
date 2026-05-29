# Retrieval Failure Triage: Tool Research Pipeline

> Generated using RRC-002 Retrieval Failure Triage methodology.
> Cross-referenced against Tool Retrieval Contract v1 (Story 8-1).
> Target: `src/lib/server/assessment/tool-lookup.ts` and `tool-cache.ts`.

---

## Agent Description

The `tool-lookup` agent is a Perplexity-powered tool research pipeline running inside a Cloudflare Pages/Worker SvelteKit app. It takes an intake transcript, extracts pain points via a separate Perplexity call (`extractPainPointsForToolLookup`), searches Futurepedia/TAAFT via Perplexity for matching AI tools (`lookupToolsWithPerplexity`), normalizes results through an MVTD quality filter, and enriches the LLM analysis with verified tool recommendations. D1 is used for 24h caching.

---

## Observed Failures

Seven structural retrieval failures were identified by the JLA-001 Action Surface Audit (31 actions mapped, 7 bypasses found) and the JLA-005 Gate Architecture Review. Each is triaged below against the seven RRC-002 failure modes.

---

## Failure 1: Redundant Pain Point Extraction Call

### Observed failure

`extractPainPointsForToolLookup()` makes a separate Perplexity call (up to 20s, ~$0.01-0.03) to extract pain points from the transcript, then passes them to the tool search. The main LLM analysis (`analyzeTranscript`) already extracts the same pain points from the same transcript as part of report generation.

### Most likely root cause

**Failure mode:** Context Rebuilding (mode 5)
**Confidence:** High
**Evidence from the code:** `tool-lookup.ts` lines 57-122 implement a full Perplexity pain point extraction with a unique system prompt (`"You extract business pain points..."`). The main `analyzeTranscript` prompt in `llm-analysis.ts` also extracts pain points redundantly. Two Perplexity calls derive the same information from the same transcript. Per assessment: one unnecessary API call, 10-20s added latency.
**Mechanism:** The agent re-discovers information it should have cached or received as a parameter. The pain point data already exists — either in Retell's `post_call_analysis` metadata or derivable from the transcript during the main analysis. The extraction call exists because `lookupToolsForTranscript` was designed as a standalone utility without access to the main analysis context.

### What this is NOT

**Not Overbuilding** — The fix isn't "use a different extraction model" or "batch extraction with other calls." The fix is structural: stop deriving what's already known.

### Minimum viable fix

Remove `extractPainPointsForToolLookup()` entirely. Refactor `lookupToolsForTranscript` to accept structured pain points from the caller:

```typescript
lookupToolsForTranscript(
  transcript: string,          // kept for search context
  painPoints: string[],        // from Retell metadata or main analysis
  db?: D1Database | null,
  budgetSignal?: BudgetSignal
): Promise<AITool[]>
```

The `pipeline.ts` caller already has access to pre-extracted pain points from the main analysis or Retell metadata. Pass them directly instead of re-deriving.

### What NOT to do

Do not add a "shared extraction cache" or "batch extraction with the main analysis." These add complexity without addressing the root cause: the data already exists at the call site.

### Verification

- After fix: only ONE Perplexity call per pipeline run for tool research (down from 2)
- Latency: pipeline completion time reduced by 10-20s per assessment
- Cost: ~$0.01-0.03 saved per assessment
- No regression in tool coverage (same pain points, same tool search)

### Contract cross-reference

- **Contract §6:** "The main LLM analysis (analyzeTranscript) already extracts pain points as part of report generation. We don't need to run a separate call just for search keywords." — Confirms this fix.
- **Contract guarantee affected:** Guarantee 5 (cache freshness) — fewer calls reduces cache pressure.

---

## Failure 2: Vendor URLs Instead of Directory Listings

### Observed failure

The Perplexity prompt instructs: "link to the tool ON futurepedia.io or theresanaiforthat.com (NOT the vendor's own site)." But Perplexity frequently returns vendor URLs (`hubspot.com`, `zapier.com`) instead of directory listing URLs. `assessToolQuality()` rejects these as critical failures (`url must be futurepedia.io or theresanaiforthat.com`), silently dropping valid tools that were actually found.

### Most likely root cause

**Failure mode:** Wrong Retrieval Unit (mode 1)
**Confidence:** High
**Evidence from the code:** `tool-lookup.ts` lines 434-437 in `assessToolQuality`: the `url` field requires `futurepedia.io` or `theresanaiforthat.com` substrings. `filterToolsByMVTD()` drops these tools entirely. But the LLM DID find the tool — it just returned the wrong URL format. The retrieval unit requested (directory listing URL) is structurally incompatible with how Perplexity returns search results (it returns the most relevant page, which is often the vendor site).
**Mechanism:** The system asked for directory listing URLs but Perplexity's search results return the most authoritative/relevant page, which for a well-known tool is its vendor site. The retrieval unit (directory listing page) is structurally wrong for Perplexity's search behavior.

### What this is NOT

**Not Non-Authoritative Source** — Both the vendor URL and directory URL are "correct" in different ways. The vendor URL IS authoritative for the tool's features and pricing. The issue is the contract mismatch between what was requested and what Perplexity returns.

### Minimum viable fix

Relax the URL requirement in two ways:

1. **Primary source:** Accept vendor URLs as valid, ADDING a `source_url` field for the directory listing when available.
2. **Fallback behavior:** When a tool has a valid vendor URL but no directory URL, flag it as `source_verification: 'vendor_only'` instead of dropping it. The gate can distinguish "verified via directory listing" from "verified via vendor site."

```typescript
// In assessToolQuality, replace:
if (!tool.url.includes('futurepedia.io') && !tool.url.includes('theresanaiforthat.com'))
  criticalFailures.push('url (must be futurepedia.io or theresanaiforthat.com)');

// With:
const hasValidUrl = tool.url.length > 0 && (
  tool.url.includes('futurepedia.io') || tool.url.includes('theresanaiforthat.com') || tool.url.startsWith('https://')
);
if (!hasValidUrl) {
  criticalFailures.push('url (missing or invalid)');
}
// Add important failure instead:
if (!tool.url.includes('futurepedia.io') && !tool.url.includes('theresanaiforthat.com')) {
  importantFailures.push('source_url (vendor URL only — no directory listing confirmation)');
}
```

### What NOT to do

Do not add a second Perplexity call to "verify vendor URLs against directory listings." This doubles cost for marginal improvement. The gate should handle unverified URLs, not the retrieval layer.

### Verification

- `filterToolsByMVTD()` pass rate increases from current baseline
- Gate E2 (tool citation checking) catches vendor-only URLs as a taste ding, not a block
- No tools dropped from recommendations solely because Perplexity returned the vendor URL

### Contract cross-reference

- **Contract §4 (Guarantee 4):** Source provenance is tracked — vendor-only URLs carry a `source_verification` flag instead of being silently dropped.
- **Contract §7 (Fallback):** "No scenario causes pipeline failure. Tools are enrichment, not a requirement." — Dropping tools on URL format violates this.

---

## Failure 3: Stale Data Without Age Filtering

### Observed failure

Perplexity returns tools from outdated articles. Reports generated on 2026-05-01 recommended tools that were discontinued in 2024 or had pricing from 2023 articles. The search prompt has no date filtering: no `since:2025` clause, no recency requirement in the system prompt.

### Most likely root cause

**Failure mode:** Wrong Retrieval Unit (mode 1) + Non-Authoritative Source (mode 2)
**Confidence:** High
**Evidence from the code:** `lookupToolsWithPerplexity` prompt (lines 148-180) has no date filter. The system prompt says "Always return valid JSON arrays" but doesn't specify recency. `verified_at` is requested but treated as important (not critical) by MVTD. The 24h TTL in `tool-cache.ts` caches stale data just as readily as fresh data.
**Mechanism:** Perplexity searches the web broadly — it doesn't know to prefer recent articles unless told. Without a date discriminator in the retrieval query, 2023 Futurepedia articles about now-discontinued tools are returned alongside 2026 articles.

### What this is NOT

**Not Context Rebuilding** — The agent isn't re-deriving stale data. It's retrieving stale data from the web. The retrieval itself is flawed.

### Minimum viable fix

1. Add explicit recency to the search prompt AND system prompt:
   ```
   system: "You are an AI tool researcher. CRITICAL: only recommend tools that are CURRENTLY available (2026). Do not cite discontinued products, tools acquired and renamed, or articles older than 12 months."
   ```
2. Add `since:2025-01-01` to search terms.
3. In `assessToolQuality`, promote `verified_at` from important to critical: if a tool's `verified_at` is null or >12 months old, downgrade to a taste-only recommendation but keep it (don't drop).
4. In `tool-cache.ts`, add `cached_at` timestamp to cache entries. On retrieval, if `cached_at > 7 days ago`, force refresh regardless of TTL.

### What NOT to do

Do not add a "tool freshness checker" that re-queries Perplexity for each cached tool. Do not implement a separate tool database.

### Verification

- `verified_at` present on 100% of tools passing MVTD
- Cache entries older than 7 days trigger automatic refresh
- Report recommendations contain no tools documented as discontinued after 2024
- Gate QW-E2 (tool citation) catches any tool with `verified_at` > 12 months old

### Contract cross-reference

- **Contract §4 (Guarantee 4):** `verified_at` timestamp on every tool — must be enforced as critical, not important.
- **Contract §6 (Cache Contract):** 7-day TTL with explicit freshness check. Current code has 24h TTL but no freshness invalidation.

---

## Failure 4: Silent JSON Parse Failures

### Observed failure

When Perplexity returns markdown-formatted responses (e.g., ` ```json\n[...]\n``` `) instead of bare JSON arrays, the `JSON.parse` call in `lookupToolsWithPerplexity` fails silently. The catch block logs a warning with the first 200 characters and returns `[]`. The pipeline proceeds with zero tools, generating a report with no tool recommendations — and no operator ever knows a failure occurred.

### Most likely root cause

**Failure mode:** Overbuilding (mode 7)
**Confidence:** High
**Evidence from the code:** `tool-lookup.ts` lines 238-241:
```typescript
} catch {
  console.warn('Failed to parse tool lookup JSON:', content.slice(0, 200));
  return [];
}
```
The fix is prompt engineering (strip markdown fences before parsing), not a change to the Perplexity integration. The same pattern applies to `extractPainPointsForToolLookup` lines 117-122.
**Mechanism:** Perplexity sometimes wraps JSON in markdown code fences despite instructions to return "ONLY a valid JSON array." The parser assumes bare JSON and fails. This is a prompt robustness issue, not an architectural failure.

### What this is NOT

**Not Missing Provenance** — The failure IS observable (the console warning). The issue is that the recovery path (return `[]`) is unrecoverable — the operator never knows tools were lost.

### Minimum viable fix

1. Strip markdown fences before parsing:
```typescript
const cleaned = content
  .replace(/^```(?:json)?\s*\n?/gm, '')
  .replace(/\n?```\s*$/gm, '')
  .trim();
const parsed = JSON.parse(cleaned);
```
2. Log a structured error including the content length, first 500 chars, and whether stripping was applied.
3. Return a partial result if some tools parse successfully: iterate the array with individual try/catch.

### What NOT to do

Do not switch to a different model, add a parsing agent, or implement a "re-query on parse failure" loop. Do not add a human review gate for parse failures — the fix is deterministic.

### Verification

- Parse success rate increases to >95% (from current ~85-90% estimated)
- Structured log shows `strippedMarkdownFences: true` when stripping was applied
- Partial results returned instead of `[]` when individual tool entries fail

### Contract cross-reference

- **Contract §7 (Fallback Contract):** "Perplexity returns unparseable JSON → Return []". This contract clause is too aggressive. It should be: "Return best-effort parsed tools, log parse failures individually."

---

## Failure 5: Fragile Substring Matching in Tool Enrichment

### Observed failure

`enrichAnalysisWithTools()` matches LLM-recommended tool names to retrieved tool URLs using:
```typescript
toolName.toLowerCase().includes(t.name.toLowerCase()) ||
t.name.toLowerCase().includes(toolName.toLowerCase().split(' ')[0])
```
This breaks on: "HubSpot Marketing Hub" vs "HubSpot CRM" (false match), "Make (formerly Integromat)" vs "Make.com" (first word match fails), and "Xero" vs "Xero Practice Manager" (true but misleading). The enrichment links recommendations to wrong URLs silently.

### Most likely root cause

**Failure mode:** Missing Provenance (mode 4)
**Confidence:** Medium
**Evidence from the code:** `tool-lookup.ts` lines 390-405. The matching uses only string contains with no scoring, no normalization, and no disambiguation.
**Mechanism:** The retrieval layer returns tools by exact name, but the LLM analysis recommends tools by common name or variant. There's no provenance link between "the LLM said Xero" and "the tool lookup returned Xero (verified)". The matching is a best-effort heuristic that can't be traced back to verify correctness.

### What this is NOT

**Not Wrong Retrieval Unit** — The tools were correctly retrieved. The issue is linking them to recommendations after the fact.

### Minimum viable fix

Replace heuristic matching with a tool registry lookup:
```typescript
function matchToolName(recommendedName: string, tools: AITool[]): AITool | null {
  const normalized = recommendedName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  
  // 1. Exact match
  const exact = tools.find(t => t.name.toLowerCase() === normalized);
  if (exact) return exact;
  
  // 2. Normalized match (strip suffixes like "CRM", "Marketing")
  const base = normalized.split(' ').slice(0, 2).join(' ');
  const matched = tools.filter(t => t.name.toLowerCase().includes(base));
  
  // 3. If multiple matches, return highest confidence
  if (matched.length > 1) return matched.sort((a, b) => /* by confidence */)[0];
  if (matched.length === 1) return matched[0];
  
  return null; // No match — gate catches this
}
```

### What NOT to do

Do not add fuzzy matching libraries (fuse.js, etc.). Do not make the LLM return tool IDs instead of names — that couples the LLM prompt to the retrieval layer's internal identifiers.

### Verification

- Unit test: "HubSpot Marketing Hub" does NOT match "HubSpot CRM"
- Unit test: "Make" matches "Make (formerly Integromat)"
- Gate E2 (tool citation) catches unmatched tool recommendations: "Recommended tool X not found in retrieval results"

### Contract cross-reference

- **Contract §4 (Guarantee 4):** Source provenance is tracked. The matching function should record which retrieval result was linked to which recommendation.
- **Contract §8.5:** Gate E2 cross-references tool source and confidence. The enrichment must preserve the `url` → `RetrievalRecord` link.

---

## Failure 6: No Source Hierarchy Between Futurepedia and TAAFT

### Observed failure

Both directories are queried in a single Perplexity call and results are flattened. When Futurepedia says a tool is $29/month and TAAFT says $49/month, the first result wins. There's no defined source hierarchy to resolve conflicts.

### Most likely root cause

**Failure mode:** Non-Authoritative Source (mode 2)
**Confidence:** Medium
**Evidence from the code:** `lookupToolsWithPerplexity` prompt (line 148-180) combines both sources into a single search: "from futurepedia.io and theresanaiforthat.com". The deduplication in lines 224-231 uses name-only matching with no source-awareness. No conflict resolution exists.
**Mechanism:** Two sources with different authority levels (Futurepedia is larger, more actively maintained; TAAFT has better AU coverage for some categories) are treated as equivalent. When they disagree, there's no rule for which to trust.

### What this is NOT

**Not Missing Provenance** — The `source` field IS tracked on each tool. The issue is that two sources returned different data for the same tool and the system chose arbitrarily.

### Minimum viable fix

1. Define a source hierarchy: `Futurepedia > TAAFT > vendor site > LLM inference`.
2. When deduplicating, prefer the higher-authority source's data.
3. When sources disagree on a critical field (pricing, availability), flag as `source_conflict: true` with both values recorded.
4. Gate E2 checks: "source_conflict on pricing → human review recommendation."

### What NOT to do

Do not make separate Perplexity calls for each source. Do not add a third source (G2, Capterra) to "triangulate" — adds cost and complexity.

### Verification

- Source hierarchy documented in `tool-lookup.ts` as a constant
- Conflict detection: when two sources return different pricing for same tool name → `source_conflict: true`
- Gate E2: `source_conflict && pricing_diff > 50%` → BLOCK (taste-level)

### Contract cross-reference

- **Contract §8.5:** Gate definitions reference source and confidence. Source hierarchy gives these fields meaning.
- **Contract §4 (Guarantee 4):** Source provenance — strengthened by hierarchy (which source was trusted and why).

---

## Failure 7: Budget Alignment Computed on Null Pricing

### Observed failure

In `lookupToolsForTranscript` (lines 317-320):
```typescript
if (budgetSignal && budgetSignal.source !== 'none') {
  for (const tool of limited) {
    tool.budget_alignment = computeBudgetAlignment(null, null, budgetSignal);
    tool.budget_signal_source = budgetSignal.source;
  }
}
```
`monthly_cost_aud_min/max` are passed as `null` because the current `AITool` schema stores pricing as prose (`pricing_hint`) not structured numbers. `computeBudgetAlignment(null, null, budgetSignal)` produces garbage alignment — it says "within_budget" or "above_budget" without knowing the actual cost. This alignment is then stored on the tool and shown to the operator.

### Most likely root cause

**Failure mode:** Bad Write-Back (mode 6)
**Confidence:** High
**Evidence from the code:** The function signature takes `(min: number | null, max: number | null, budgetSignal)` but the call site always passes `(null, null)`. The alignment result is computed from budget alone, not budget-vs-cost. The computed field is stored on the tool object and treated as authoritative by downstream consumers.
**Mechanism:** A computation that requires pricing data was run without pricing data. The result (`computeBudgetAlignment(null, null, {...})`) is stored as confirmed fact on the tool. Downstream gates and the report generator treat `budget_alignment` as trustworthy. Garbage in → garbage stored → garbage displayed.

### What this is NOT

**Not Wrong Retrieval Unit** — The issue isn't what was retrieved. It's that a computation was performed on missing data and stored as fact.

### Minimum viable fix

1. If pricing is unavailable, set `budget_alignment = 'unknown'`, not a computed value.
2. Add the structured pricing fields from the contract (story 8-1): `pricing_monthly_usd_min`, `pricing_monthly_usd_max` to `AITool` as `monthly_cost_aud_min`, `monthly_cost_aud_max` (which already exist but are rarely populated).
3. Only compute alignment when at least one pricing field is non-null.
4. Gate addition: if `budget_alignment !== 'unknown'` AND `monthly_cost_aud_min === null`, flag as a taste issue — the alignment claims knowledge it doesn't have.

```typescript
if (budgetSignal && budgetSignal.source !== 'none') {
  for (const tool of limited) {
    if (tool.monthly_cost_aud_min !== null || tool.monthly_cost_aud_max !== null) {
      tool.budget_alignment = computeBudgetAlignment(
        tool.monthly_cost_aud_min,
        tool.monthly_cost_aud_max,
        budgetSignal
      );
    } else {
      tool.budget_alignment = 'unknown';
    }
    tool.budget_signal_source = budgetSignal.source;
  }
}
```

### What NOT to do

Do not add a third Perplexity call to "fill in missing pricing." The alignment should say "unknown" when pricing is unknown — this is honest, not broken.

### Verification

- `budget_alignment` is `'unknown'` when no pricing data is available
- Gate MP-E1 (budget alignment) treats `'unknown'` as a taste-level concern, not a pass
- No tool with alignment `within_budget`/`above_budget` has null pricing fields

### Contract cross-reference

- **Contract §3 (Guarantee 3):** "Pricing is structured, not prose." — This is the root cause. Until pricing is structured, budget alignment is impossible.
- **Contract §5:** Budget alignment contract requires `pricing_monthly_usd_min/max` to be numeric. Current code uses prose, which can't be compared.

---

## Summary Matrix

| # | Failure | Primary Mode | Secondary Mode | Confidence | Fix Complexity | Contract Guarantee Broken |
|---|---------|-------------|----------------|------------|----------------|--------------------------|
| 1 | Redundant extraction call | Context Rebuilding | — | High | Low (remove function) | G5 (cache freshness) |
| 2 | Vendor URLs dropped | Wrong Retrieval Unit | — | High | Low (relax URL check) | G4 (provenance), G7 (fallback) |
| 3 | Stale data without filters | Wrong Retrieval Unit | Non-Authoritative | High | Medium (prompt + cache) | G4 (verified_at) |
| 4 | Silent JSON parse failures | Overbuilding | — | High | Low (strip fences) | G7 (fallback policy) |
| 5 | Fragile tool name matching | Missing Provenance | — | Medium | Medium (matcher rewrite) | G4 (provenance linking) |
| 6 | No source hierarchy | Non-Authoritative | Missing Provenance | Medium | Low (define hierarchy) | G4 (source tracking) |
| 7 | Budget alignment on null | Bad Write-Back | Missing Provenance | High | Low (guard null) | G3 (structured pricing), G5 |

### Priority Order for Fixing

1. **Failure 7** (Bad Write-Back): Highest risk — actively produces misleading data displayed to operators
2. **Failure 1** (Context Rebuilding): Quickest win — one function deletion, 20s latency reduction per assessment
3. **Failure 4** (Overbuilding): Quickest win — one line of code, recovers silently dropped tools
4. **Failure 2** (Wrong Retrieval Unit): Medium impact — currently drops valid tools on URL format
5. **Failure 3** (Stale Data): Medium effort — requires prompt AND cache changes
6. **Failure 5** (Missing Provenance): Medium effort — matcher rewrite with tests
7. **Failure 6** (Non-Authoritative): Lowest priority — conflicts are rare in practice

### Contract Gap Analysis

The v1 contract (story 8-1) defines 5 guarantees and 10 changes. Against the current implementation:

| Contract Item | Current State | Gap |
|---------------|---------------|-----|
| Guarantee 1: No hallucination pass-through | No `confidence` field exists | **Missing** — need `RetrievalRecord.confidence` |
| Guarantee 2: AU availability non-negotiable | `au_available` is IMPORTANT (not CRITICAL) | **Misaligned** — should promote to CRITICAL |
| Guarantee 3: Pricing structured, not prose | `pricing_hint` is prose; `monthly_cost_aud_min/max` rarely populated | **Missing** — need structured pricing extraction |
| Guarantee 4: Source provenance tracked | `source` present; `verified_at` is IMPORTANT | **Partial** — `verified_at` should be CRITICAL |
| Guarantee 5: Cache freshness explicit | 24h TTL; no `cache_hit` field | **Missing** — need `cache_hit` and 7-day TTL |
| Change 1: Remove extraction call | Not done | **Open** |
| Change 2: Structured metadata input | Not done | **Open** |
| Change 8.5: Budget alignment feed | Partially done (null bug) | **Bug** (Failure 7) |

### Recommended Implementation Order for Epic 8

1. **8-2 (this triage):** Done — documents all failures and fixes
2. **8-3 (ADR):** Document architectural decisions informed by this triage
3. **Return to 8-1:** Implement the v1 contract with fixes from failures 1-7, then re-validate
