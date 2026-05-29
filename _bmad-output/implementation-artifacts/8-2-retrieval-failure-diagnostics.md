# Retrieval Failure Diagnostics — Tool Research Pipeline

> Built using the RRC-002 Retrieval Failure Triage methodology (`rrc-002-v1`).
> Applied to: `src/lib/server/assessment/tool-lookup.ts` and Perplexity → Futurepedia/TAAFT flow.
> Date: 2026-05-29

---

## 1. System Under Diagnosis

**Component:** `tool-lookup.ts` → `lookupToolsForTranscript()` → `lookupToolsWithPerplexity()`
**Flow:** Intake transcript → pain point extraction (Perplexity call 1) → Perplexity search Futurepedia/TAAFT (Perplexity call 2) → `AITool[]`
**Cache:** D1-backed, 24h TTL, keyed on canonicalized pain point keywords

---

## 2. Diagnosed Failure Modes

### F1 — Stale Data

| Property | Value |
|----------|-------|
| **Severity** | MEDIUM |
| **Observed** | Perplexity returning 2023 tool listings for 2025 tools (e.g., recommending deprecated versions, missing new entrant tools) |
| **Root cause** | Futurepedia/TAAFT catalog pages cached by Perplexity's indexer. No staleness check on cached search results. |
| **7-mode classification** | `stale_data` |
| **MVF (Minimum Viable Fix)** | Add `verified_at` timestamp to `AITool` (now `RetrievalRecord`). Gate checks: if `verified_at > 180 days old`, mark `confidence -= 0.3`. |
| **Full fix** | Direct Futurepedia API access (bypass Perplexity indexing latency). Requires Futurepedia API agreement. |
| **Interim mitigation** | Set cache TTL to 7 days (was 24h). Add `stale_since` field for consumers to make freshness-aware decisions. |
| **Fix trigger** | When Perplexity consistently returns tools > 6 months out of date for ≥2 consecutive assessments, or when a client flags a tool recommendation as outdated. |

### F2 — Non-Authoritative Source

| Property | Value |
|----------|-------|
| **Severity** | HIGH |
| **Observed** | Conflicting Futurepedia vs TAAFT results for the same tool name (different pricing, different features, one lists AU availability, other doesn't) |
| **Root cause** | Two sources queried sequentially without reconciliation. No source hierarchy. First source result wins. |
| **7-mode classification** | `non_authoritative_source` |
| **MVF** | Define source hierarchy: Futurepedia (primary) > TAAFT (secondary). If conflict: prefer Futurepedia, flag in `source` field, reduce `confidence` by 0.2. |
| **Full fix** | Cross-source reconciliation pipeline: run both queries, diff results, surface contradictions for manual catalog curation. |
| **Interim mitigation** | Add `source` field to `RetrievalRecord`. Gate stage RE1 checks: if `source: 'perplexity_taaft'` AND Futurepedia result existed for same tool, flag as `warning`. |
| **Fix trigger** | When a tool recommendation in a client report is materially wrong (wrong pricing tier, wrong feature set) due to TAAFT-only sourcing. |

### F3 — Wrong Retrieval Unit

| Property | Value |
|----------|-------|
| **Severity** | MEDIUM |
| **Observed** | Perplexity returning full webpage text instead of structured catalog entries. Tool names extracted from marketing copy, not from product listings. |
| **Root cause** | Query format: "AI tools for [pain point]" — Perplexity returns web search results, not structured catalog results. Web pages contain narrative descriptions, not tool listings. |
| **7-mode classification** | `wrong_retrieval_unit` |
| **MVF** | Constrain query format: "site:futurepedia.io [pain point] tool category" and "site:taaft.com [pain point] tool" to get catalog pages directly. |
| **Full fix** | Use Futurepedia and TAAFT structured APIs if available (category/tag endpoints → tool list → tool detail endpoints). |
| **Interim mitigation** | Add `search_query_used` to `RetrievalRecord` for auditability. Log which queries produced which results. |
| **Fix trigger** | When Perplexity returns results where > 50% of tools cannot be matched to known tool names from the catalog. |

### F4 — Missing Source

| Property | Value |
|----------|-------|
| **Severity** | LOW |
| **Observed** | Some tool categories have no Futurepedia or TAAFT listings (e.g., niche AU-specific tools, government procurement tools) |
| **Root cause** | Both sources are US/EU-centric. AU-specific tool ecosystem underrepresented. |
| **7-mode classification** | `missing_source` |
| **MVF** | Add hardcoded AU-specific tool catalogue for common tools (Xero, MYOB, Employment Hero, etc.) with pre-verified data. |
| **Full fix** | Integrate AU-specific tool directory (e.g., Australian Business Software Industry Association listings). |
| **Interim mitigation** | AU tools returned with `source: 'hardcoded_catalogue'` and `confidence: 0.9`. Mark missing categories in retrieval log. |
| **Fix trigger** | When ≥3 assessments in the same AU industry vertical receive zero tool recommendations. |

### F5 — Permission Gap

| Property | Value |
|----------|-------|
| **Severity** | LOW |
| **Observed** | Perplexity API key rotation causes intermittent auth failures. D1 access fails silently in some environments. |
| **Root cause** | No proactive API key health check. D1 connection errors swallowed. |
| **7-mode classification** | `permission_gap` |
| **MVF** | Add `PERPLEXITY_API_KEY` health check on pipeline start. Add D1 connectivity check. Log both as structured events. |
| **Full fix** | API key rotation automation with pre-rotation health check. D1 connection pool with retry. |
| **Interim mitigation** | Fallback contract: no scenario causes pipeline failure. Tools returned as `[]` on any permission/auth error. |
| **Fix trigger** | When Perplexity auth failures occur on > 10% of pipeline runs. |

### F6 — Provenance Gap

| Property | Value |
|----------|-------|
| **Severity** | HIGH |
| **Observed** | Current `AITool` type has no `source` or `verified_at` field. Consumer (report generator, gates) cannot distinguish real vs hallucinated tools. |
| **Root cause** | `AITool` is a flat type with only name, category, purpose, pricing, setup complexity. No provenance metadata. |
| **7-mode classification** | `provenance_gap` |
| **MVF** | Replace `AITool` with `RetrievalRecord` (per RRC-001 contract). Add `source`, `confidence`, `verified_at`, `search_query_used` fields. |
| **Full fix** | End-to-end provenance chain: intake question → pain point → search query → search result → tool record → report claim. |
| **Interim mitigation** | Gate stages RE1 (source provenance) and TC4 (evidence traceability) already reference provenance fields. |
| **Fix trigger** | Already triggered — the provenance gap is the structural issue the RRC-001 contract addresses. |

### F7 — Compilation Error

| Property | Value |
|----------|-------|
| **Severity** | LOW |
| **Observed** | `formatToolsForPrompt()` produces unstructured tool descriptions. Budget signal not incorporated into tool context. |
| **Root cause** | Format function is generic (name + description). No budget alignment, no team size fit, no AU availability surfacing. |
| **7-mode classification** | `compilation_error` |
| **MVF** | Extend `formatToolsForPrompt()` to include: pricing tier, budget alignment indicator, AU availability flag, confidence score. |
| **Full fix** | Structured tool context format that the LLM analysis prompt can reference by field (not parsed from prose). |
| **Interim mitigation** | Keep existing format. Add budget-aligned tools section to report prompt separately. |
| **Fix trigger** | When gate evaluator consistently flags tool recommendations as "above budget" or "not AU-available" — indicating the LLM isn't seeing this context. |

---

## 3. Priority Action Plan

| Priority | Failure Mode | Action | Effort |
|----------|-------------|--------|--------|
| 🔴 P0 | F6 Provenance Gap | Replace AITool with RetrievalRecord | 1 sprint |
| 🔴 P0 | F2 Non-Authoritative Source | Define source hierarchy + reconciliation | 1 sprint |
| 🟡 P1 | F1 Stale Data | Add `verified_at` + freshness check | 2 days |
| 🟡 P1 | F3 Wrong Retrieval Unit | Constrain query format to site: queries | 1 day |
| 🟢 P2 | F7 Compilation Error | Extend formatToolsForPrompt | 2 days |
| 🟢 P2 | F4 Missing Source | Hardcoded AU catalogue | 3 days |
| 🟢 P3 | F5 Permission Gap | Health checks on pipeline start | 1 day |
