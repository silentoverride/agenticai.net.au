# Architecture Decision Record: Tool Research Retrieval Stack

> ADR-003 | 2026-05-29 | Pipeline retrieval architecture

## Status

**ACCEPTED** — In production. Revision planned per RRC-001 contract migration.

---

## Decision

**Use Perplexity as the retrieval mechanism for AI tool discovery, querying Futurepedia (primary) and TAAFT (secondary) as authoritative sources, with a structured RetrievalRecord contract replacing the legacy AITool type.**

---

## Context

The pipeline's tool research phase (`stageToolResearch` in `pipeline.ts`) discovers AI tools relevant to a business's pain points. The intake interview captures unstructured information (transcript), the pipeline extracts pain points, then searches for matching tools. Tools feed into the LLM analysis report and gate evaluations.

The current implementation has five structural issues:
1. No provenance tracking on tool data (hallucinated tools indistinguishable from real ones)
2. Two Perplexity calls per assessment (pain point extraction + tool search) — redundant latency/cost
3. Fragile substring-based tool enrichment (`enrichAnalysisWithTools()`)
4. No budget/pricing alignment between tool cost and customer budget
5. No source hierarchy between Futurepedia and TAAFT results

---

## Decision Drivers

1. **Auditability**: Every tool in a client report must be traceable to its source
2. **Cost efficiency**: Minimize Perplexity API calls per assessment
3. **AU relevance**: Australian businesses need AU-priced, AU-available tools
4. **Fail-safe**: Tool research is enrichment — pipeline must not fail if it's unavailable
5. **Gate integration**: Gates must have structured tool data to evaluate budget alignment and source reliability

---

## Considered Alternatives

### Alternative 1: Direct Futurepedia/TAAFT API Access

**Rejected** — neither Futurepedia nor TAAFT offer public APIs. Both are web catalogs without structured endpoints. Perplexity is the pragmatic bridge to structured data.

### Alternative 2: Static Hardcoded Tool Catalogue

**Rejected** — AI tool ecosystem changes too rapidly (new tools weekly, pricing changes monthly). A static catalogue would be stale within 30 days. However, a hardcoded AU-specific supplement for stable tools (Xero, MYOB, Employment Hero) is used as a fallback.

### Alternative 3: Google Custom Search (Futurepedia + TAAFT as sites)

**Rejected** — Google Custom Search API pricing is higher than Perplexity for the query volume. Perplexity's LLM-powered search provides better extraction of structured data from catalog pages.

### Alternative 4: Single Perplexity call (pain points + tools in one prompt)

**Considered** — Would eliminate one API call but increases prompt length and risks hallucinated tool names in a single-pass generation. The two-phase approach (extract pain points → search tools) provides a verification step: the LLM that extracts pain points is NOT the same LLM that searches for tools, creating a cross-check.

---

## Source Hierarchy

| Tier | Source | Use Case | Reliability |
|------|--------|----------|-------------|
| 1 | Futurepedia (via Perplexity) | Primary tool discovery | High (curated catalog) |
| 2 | TAAFT (via Perplexity) | Secondary validation | Medium (community-driven) |
| 3 | Hardcoded AU Catalogue | AU-specific stable tools | Very High (pre-verified) |
| 4 | LLM-generated | Fallback (stripped if confidence < 0.4) | Low (never used alone) |

**Conflict resolution**: When Futurepedia and TAAFT disagree on tool data, Futurepedia wins. Confidence reduced by 0.2. Both sources recorded in `RetrievalRecord.source` field.

---

## Staleness Policy

| Data Type | Max Age | Hard Limit | Rationale |
|-----------|---------|------------|-----------|
| Tool catalog results | 7 days | 30 days | Tools rarely change fundamentals within a week; pricing can change within a month |
| Pricing data | 7 days | 14 days | Prices change more frequently than tool existence |
| AU availability | 30 days | 90 days | Regional availability changes slowly |
| Cache key (Perplexity results) | 7 days | N/A | Cached by canonicalized pain point keywords, not raw transcript |

**Freshness signals**: `RetrievalRecord.verified_at` carries the ISO 8601 timestamp. Cache `hit` boolean indicates whether result came from cache. Gates check freshness: tools older than 30 days flagged as `warning`, tools older than 90 days flagged as `block`.

---

## Known Limitations

1. **AU ecosystem underrepresentation**: Both primary sources (Futurepedia, TAAFT) are US/EU-centric. AU-specific tools (e.g., government procurement platforms, AU-hosted SaaS) may not appear. Mitigated by hardcoded AU supplement.

2. **Perplexity indexing latency**: Perplexity's index of Futurepedia/TAAFT may lag behind the live catalogs by days to weeks. New tools appear with delay. Mitigated by 7-day cache TTL and explicit staleness signals.

3. **No tool categorization standard**: Neither Futurepedia nor TAAFT uses a consistent categorization taxonomy. Tool categories are inferred from Perplexity's natural language understanding of catalog pages. Categories may drift between queries.

4. **Budget alignment is heuristic**: Budget signals extracted from transcripts are approximate (min/max/confidence). Budget alignment classification (`within_budget` / `above_budget`) is a guideline, not a hard gate.

5. **Single point of failure**: Perplexity is the only retrieval mechanism. If Perplexity is unavailable, no tools are returned. Pipeline continues without tools (fallback contract).

---

## Monitoring Expectations

| Signal | Alert Threshold | Action |
|--------|-----------------|--------|
| Perplexity auth failures | > 10% of runs | Rotate API key, check billing |
| Cache hit rate | < 50% | Increase TTL or check query diversity |
| Tool count per assessment | = 0 for > 3 consecutive runs | Check Perplexity availability, check query format |
| Source distribution | TAAFT-only > 80% | Investigate Futurepedia accessibility |
| Confidence distribution | Mean < 0.5 | Check source quality, consider catalogue refresh |
| Staleness (tools > 30 days) | > 25% of tools | Reduce cache TTL, force cache invalidation |
