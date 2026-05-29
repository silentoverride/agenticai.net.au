# ADR-001: Perplexity + Deterministic Confidence Pipeline + 3-Gate Quality Control

## Status
Accepted — implemented in `src/lib/server/assessment/tool-lookup.ts` and active in production.

## Context

The assessment pipeline's tool research phase has been hardened through two analyses: the v2 retrieval contract (`docs/tool-retrieval-contract-v2.md`) and the failure triage (`docs/retrieval-failure-triage.md`). This ADR documents the architectural decisions behind the current stack, triggered by:

**1. Partially enforced contract.** The v2 contract defines six guarantees. Three are fully enforced: confidence stripping at 0.4 (`tool-lookup.ts:normalizeTools()` line 398), AU availability as explicit boolean, and structured pricing fields. Three are partially enforced: source provenance (`computeSourceTier()` computes tier but TC1 gate checks only tool names, not tiers), cache freshness (`computeStaleness()` runs but `CACHE_TTL_MS` is 24h, not the intended 7d), and gate consumption (gates don't read `confidence` or `staleness`). Without an ADR, a future maintainer cannot distinguish "intended but pending" from "abandoned."

**2. Failure triage evidence.** Two failures trace to architectural choices documented here: Failure 2 — Perplexity returns vendor URLs more reliably than directory pages, motivating the decision to accept vendor URLs as primary source with directory listing as enrichment. Failure 3 — stale data without recency filtering, motivating `computeStaleness()` and the 3-tier freshness classification.

**Contract references:** Guarantees #1 (no hallucination pass-through), #2 (AU availability), #3 (structured pricing), #4 (source provenance), #5 (cache freshness), and #6 (low-confidence stripping) are the architectural contract this stack fulfills.

## Decision

The retrieval stack is: **Perplexity API** → **Futurepedia + TAAFT** → **Deterministic scoring** (`computeConfidence`, `computeSourceTier`, `computeStaleness`) → **D1 cache** (24h TTL via `tool-cache.ts`) → **3-gate quality control** (`gate/definitions.ts` TC1-TC3).

Six architectural decisions compose this stack:

1. **Perplexity as retrieval mechanism** — `lookupToolsWithPerplexity()` (`tool-lookup.ts:139`) sends structured prompts, parses JSON responses, passes to `normalizeTools()`. Replaces: direct directory scraping, Google PSE, internal catalog.
2. **Futurepedia + TAAFT as authoritative sources** — `computeSourceTier()` (`tool-lookup.ts:262`) maps `'futurepedia'` → `'high'`, `'taaft'` → `'medium'`, `'perplexity'` → `'low'`. Replaces: G2, Capterra, broad web search.
3. **Deterministic confidence scoring** — `computeConfidence()` (`tool-lookup.ts:315`) uses weighted field completeness scoring (0.0-1.0) rather than LLM evaluation. Replaces: LLM-based confidence, trust-all.
4. **Staleness-based freshness tracking** — `computeStaleness()` (`tool-lookup.ts:286`) classifies as fresh/aging/stale/unknown based on `verified_at`. Replaces: trusting timestamps indefinitely.
5. **D1 cache with 24h TTL** — `tool-cache.ts` line 10, SHA-256 keyed on search query. Replaces: Redis, no caching, file-based cache.
6. **Gate-based quality control** — TC1 (tool names), TC2 (description accuracy), TC3 (pricing accuracy) in `gate/definitions.ts:261-263`. Replaces: retrieve-time rejection, monolithic quality check.

**Implementation gaps:** Gates don't consume `source_tier` or `staleness` (`gate/definitions.ts:261` checks tool names only). Cache TTL is 24h, not target 7d — the discrepancy is deployment caution, not architectural intent.

## Consequences

### Positive

1. **Auditable provenance** — Every recommended tool carries `source_tier` computed deterministically from `source`. An operator can distinguish directory-verified tools from general web search results. Contract guarantee #4 satisfied.

2. **Zero-cost confidence scoring** — `computeConfidence()` is a pure function: no API call, no latency, no non-determinism. An LLM evaluator would add ~$0.005-0.01 per tool and produce inconsistent scores across runs. Contract guarantee #1 satisfied without ongoing cost.

3. **Staleness prevents silent data rot** — Without `computeStaleness()`, the pipeline would produce identical recommendations from the same cache entry indefinitely, regardless of how old the data is. Contract guarantee #5 enabled.

### Negative

1. **Perplexity vendor dependency** — The pipeline depends on a single paid API with no fallback. If Perplexity changes its response format, `normalizeTools()` (`tool-lookup.ts:367`) would break silently. No automated alert monitors API degradation or format drift.

2. **Directory freshness is uncontrollable** — Futurepedia and TAAFT don't expose entry freshness metadata. A tool with `staleness='fresh'` (queried today) could reference a directory entry last updated months ago. There is no mechanism to detect directory-level staleness independently.

3. **Cache TTL misalignment costs money** — `CACHE_TTL_MS` is 24h but staleness tolerance is 30 days. Perplexity costs run 3-7x higher than the target 7-day TTL for identical results. `computeStaleness()` does not trigger cache invalidation — stale tools persist until the 24h TTL expires.

4. **Gate consumption gap** — `confidence`, `source_tier`, and `staleness` are computed but gates don't read them. A tool with `confidence=0.41` and `source_tier='low'` passes TC1 the same as one with `confidence=0.90` and `source_tier='high'`. The evaluation layer is blind to quality metadata.

### Neutral

1. Perplexity returns vendor URLs more reliably than directory pages — `normalizeTools()` accepts both. More tools reach the pipeline, but the directory-provenance guarantee is weaker than the contract specifies.

2. D1 cache binds the architecture to Cloudflare — pragmatic given existing infrastructure, but the retrieval stack cannot operate outside Cloudflare without cache replacement.

## Alternatives Considered

### Alternative 1: Direct Futurepedia/TAAFT scraping
**Description:** Scrape directories directly, eliminating Perplexity dependency entirely.
**Why rejected:** Neither directory has a public API. HTML scraping would break on DOM changes and trigger rate limiting. The v2 contract guarantee #4 (provenance via `source_tier`) is satisfied by `computeSourceTier()` without scraping instability. This is the genuinely simpler alternative — it eliminates a paid vendor dependency — but the maintenance burden of a scraper with no API contract exceeds the Perplexity cost.

### Alternative 2: Vector database + semantic search
**Description:** Replace Perplexity with a Pinecone/pgvector semantic search over an indexed catalog of AI tools.
**Why rejected:** The 7 triage failures are metadata-level problems (source hierarchy, staleness, confidence), not semantic-retrieval problems. A vector DB would add $70-200/month infrastructure, new failure modes (index staleness, embedding drift), and a data ingestion pipeline without addressing any triaged failure. RRC-003 guardrail #6: this is overbuilding.

### Alternative 3: No caching — re-query every assessment
**Description:** Eliminate D1 cache. Every assessment triggers fresh Perplexity queries.
**Why rejected:** Increases Perplexity costs linearly with volume and adds 10-20s latency per assessment. For 50-100 assessments/month: cached ($0.02-0.06) vs. uncached ($1-3). The v2 contract guarantee #5 (cache with explicit staleness tracking) was designed for this tradeoff.

## Verification Plan

Track after 50 assessments or 30 days: confidence distribution (histogram across tiers), staleness distribution per assessment, Perplexity cost per assessment, TC1 pass/fail rate, and cache hit rate. Success: ≥70% of tools at `confidence ≥ 0.5`, ≤20% at `staleness='stale'`, cache hit rate ≥60%, TC1 fails at 0.

## Rollback Plan

Replacing Perplexity would require: rewrite `lookupToolsWithPerplexity()` (estimated 2-3 days), retain `normalizeTools()` (source-agnostic), replace the Perplexity-specific prompt (1 day), purge D1 cache (all entries stale with new source — 30-60 min downtime), update environment variables. `AITool` schema unchanged — no data migration needed. Other decisions (confidence, staleness, cache, gates) are code-level refactors reversible via standard git revert.
