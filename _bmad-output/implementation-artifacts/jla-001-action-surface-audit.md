# JLA-001 Action Surface Audit — Agenticai Pipeline

**Date:** 2026-05-29
**Auditor:** Dev Agent (subagent)
**Methodology:** JLA-001 v1 (`docs/agentic-workflows/judge-layer-architecture/jla-001-v1-action-surface-audit.md`)
**Scope:** Full assessment pipeline — webhooks, queue, stages, gates, staff portal

---

## 1. Action Inventory

Every distinct action the pipeline can take or trigger, classified by risk tier.

### Pipeline Stage Actions

| # | Action | Tier | Boundary Crossed | Affected Parties | Judge Needed? | Human Review? |
|---|--------|------|-----------------|------------------|---------------|---------------|
| S0a | `lookupToolsForTranscript()` — Perplexity web search | 1 | None (read-only) | None | After (validate tool quality) | No |
| S0b | `filterToolsByMVTD()` — classify tools by quality | 1 | None | None | No | No |
| S0c | `extractBudgetSignal()` — parse budget from text | 1 | None | None | No | No |
| S0.5 | `extractEvidenceMap()` — LLM extracts claims from transcript | 1 | None | None | After (verify claims not invented) | No |
| S1 | `analyzeTranscript()` — GPT-5.5 generates full analysis | 1 | None | None | Before (structure plan) + After (content check) | No |
| S1v | `parseAndValidateAnalysis()` — validate structured output | 1 | None | None | No | No |
| G1 | `runGate('quick-wins-verification')` — gate evaluation | 1* | None (read-only classification) | None | N/A (this IS the judge) | Findings only |
| G2 | `runGate('major-project-verification')` — gate evaluation | 1* | None | None | N/A | Findings only |
| G1p | Gate result persistence to D1 via `D1GateStore.insert()` | **2** | internal → D1 (reversible write) | Operators (view findings) | After (audit write completeness) | No |
| S2 | `saveReportToR2()` — persist analysis JSON to R2 | **2** | internal → R2 (reversible write) | Customer (gets report) | ⚠️ BEFORE final gate | Yes — should be after report-review |
| S2f | `saveReportUnified()` — fallback to filesystem write | **2** | internal → disk (reversible) | Dev/operator | No | No |
| S3a | `upsertReportMetadata()` — D1 metadata write | **2** | internal → D1 | Portal users | ⚠️ BEFORE final gate | No |
| S3b | `findOrCreateUserFromStripe()` — D1 user read/write | **2** | internal → D1 (reversible) | Customer | No | No |
| S3c | `linkReportToUser()` — D1 relationship write | **2** | internal → D1 | Customer | ⚠️ BEFORE final gate | No |
| G3 | `runGate('report-review')` — final gate (+ taste + PBW) | 1* | None | Customer | N/A | Findings routed to staff portal |
| S4 | `sendReportReadyEmail()` → SendGrid | **3** | internal → external (customer inbox) | Customer | ✅ Before (gated by report-review) | ✅ Should require approval |
| S4a | `sendWelcomeEmail()` → SendGrid | **3** | internal → external | Customer | No | No |
| S4b | `sendReceiptEmail()` → SendGrid | **3** | internal → external | Customer, finance | No | No |
| S4c | `sendPortalInvitationEmail()` → SendGrid | **3** | internal → external | Customer | No | No |

### Webhook Entry-Point Actions

| # | Action | Tier | Boundary Crossed | Affected Parties | Judge Needed? | Human Review? |
|---|--------|------|-----------------|------------------|---------------|---------------|
| W1 | `saveIntakeTranscript()` — write transcript to R2 | **2** | internal → R2 | None (internal artifact) | No | No |
| W2 | `setPipelineStatus()` — write status to D1 | **2** | internal → D1 | Portal users | No | No |
| W3 | `enqueueReportJob()` → Cloudflare Queue.send() | **3** | internal → queue (trigger pipeline) | Pipeline resources, cost | ✅ Before (intake quality check exists — shadow mode) | Should escalate insufficient intake |
| W4 | `checkIntakeSufficiency()` — pre-flight quality check | 1 | None | None | N/A (this IS the check) | No |
| W5 | Payment processing (Stripe) — external, not our code | **4** | customer → Stripe → bank | Customer wallet, business revenue | N/A (Stripe handles) | N/A |
| W6 | `runPipelineInline()` — fallback when queue unavailable | 1-4* | All pipeline stages inline | Same as full pipeline | Same as pipeline gates | Same as pipeline |

### Queue Consumer Actions

| # | Action | Tier | Boundary Crossed | Affected Parties | Judge Needed? | Human Review? |
|---|--------|------|-----------------|------------------|---------------|---------------|
| Q1 | Queue.dequeue → `runPipelineInline()` | 1-4* | Dequeue → full pipeline | Same as pipeline | Same as pipeline gates | Same as pipeline |
| Q2 | Status update (`queued`, `processing`, `complete`, `error`) | **2** | internal → D1 | Portal users | No | No |

### Staff Portal Actions (summary — detailed audit separate)

| # | Action | Tier | Boundary Crossed | Affected Parties | Judge Needed? | Human Review? |
|---|--------|------|-----------------|------------------|---------------|---------------|
| SP1 | `commitStaffAction()` — lifecycle state change + audit write | **2** | internal → D1 | Operators, customer (indirect) | ✅ State guards exist in code | Yes — operator decision |
| SP2 | `commitFollowUpAction()` — follow-up lifecycle write | **2** | internal → D1 | Operators, customer (promises) | ✅ Guards exist | Yes — operator decision |
| SP3 | Meeting brief reads (read models) | 1 | None | None | No | No |
| SP4 | Calendly link access | 1 | None (external URL, no write) | None | No | No |

*Tier 1* = read-only. *Tier 2* = reversible writes. *Tier 3* = external side effects. *Tier 4* = high-risk.

---

## 2. Risk Map

### 2.1 Pipeline Execution Order and Gate Placement

```
Webhook Entry
│  W1: saveIntakeTranscript (R2)     ← TIER 2 — no prior gate
│  W2: setPipelineStatus (D1)        ← TIER 2 — no prior gate
│  W4: checkIntakeSufficiency        ← TIER 1 — quality check (shadow mode)
│  W3: enqueueReportJob (Queue)      ← TIER 3 — gated by W4 (shadow)
▼
Queue Consumer
│
├─ Stage 0:  Tool Research           ← TIER 1 — NO GATE COVERAGE ⚠️
├─ Stage 0.5: Evidence Extraction    ← TIER 1 — NO GATE COVERAGE ⚠️
├─ Stage 1:  LLM Analysis            ← TIER 1 — NO GATE COVERAGE ⚠️
│
├─ Gate: quick-wins-verification     ← GATE ✅ (position correct)
│  └─ Gate persist to D1              ← TIER 2 — gate results written
│
├─ Gate: major-project-verification  ← GATE ✅ (position correct)
│  └─ Gate persist to D1              ← TIER 2
│
├─ Stage 2:  Save Report (R2)        ← TIER 2 — ⚠️ BEFORE FINAL GATE
├─ Stage 3:  Link Report (D1)        ← TIER 2 — ⚠️ BEFORE FINAL GATE
│
├─ Gate: report-review               ← GATE ✅ (but after writes!)
│  └─ Gate persist to D1              ← TIER 2
│
└─ Stage 4:  Email Delivery           ← TIER 3 — ✅ correctly after final gate
```

### 2.2 Gate Bypass Inventory

| Bypass | What runs without gate coverage | Risk | Severity |
|--------|-------------------------------|------|----------|
| **BYPASS-1: Pre-analysis stages** | S0 (Tool Research), S0.5 (Evidence Extraction), S1 (LLM Analysis) all run before any gate | GPT-5.5 cost (~$0.30-0.50 per run) incurs even for garbage input. No tool research quality validation before LLM consumes the results. Evidence map hallucination not caught until report-review (after save). | **HIGH** — Cost + quality |
| **BYPASS-2: Report persisted before final gate** | S2 (Save Report R2) and S3 (Link Report D1) execute BEFORE report-review gate | Blocked reports are already persisted to R2/D1. A customer whose report is blocked by gate still has their data stored. Stale/unapproved reports accumulate in R2 and D1. Staff Portal may surface unreviewed reports. | **MEDIUM** — Data hygiene, storage cost |
| **BYPASS-3: No evidence provenance gate** | `extractEvidenceMap()` claims have no pre-pipeline validation | Evidence map LLM can fabricate claims from thin air. These claims feed into the LLM analysis prompt, contaminating the entire report. The report-review gate (A0 criterion) catches SOME orphan claims but only after the full report is generated. | **HIGH** — Quality |
| **BYPASS-4: Tool research quality not gated** | `lookupToolsForTranscript()` results feed into analysis with no pre-validation | Perplexity can return stale 2023 data for 2025 tools. Non-AU-available tools recommended. Tool hallucination (made-up tool names) passes through to report without gate catch until report-review (E2 criterion). MVTD filter catches structural quality but not content correctness. | **HIGH** — Credibility |
| **BYPASS-5: Transcription write before quality check** | `saveIntakeTranscript()` to R2 runs before `checkIntakeSufficiency()` | Low-quality transcripts are persisted to R2 regardless. Storage accumulates junk transcripts from hang-ups and test calls. No cleanup mechanism. | **LOW** — Storage |
| **BYPASS-6: No stage-routing isolation** | Queue consumer runs entire pipeline as one atomic unit | If tool research fails, LLM analysis still runs with empty tools. If LLM analysis times out, the pipeline doesn't recover gracefully. Each stage should be independently gated with circuit-breaker logic. | **MEDIUM** — Resilience |
| **BYPASS-7: Inline fallback skips queue isolation** | `runPipelineInline()` runs all stages synchronously in webhook handler | Webhook timeout risk (CF Pages: 30s worker limit). No retry capability. No queue persistence for crash recovery. | **MEDIUM** — Reliability |

### 2.3 Action Boundaries — Prioritized Build Order

Priority = consequence severity × frequency. High-frequency, high-consequence boundaries first.

| Priority | Boundary | Actions Protected | Rationale |
|----------|----------|-------------------|-----------|
| **P0** | Intake quality → pipeline entry | W3 (enqueue) | Incomplete intake triggers $0.30-0.50 GPT-5.5 cost per run. High volume (every assessment). W4 exists but is **shadow mode only** — doesn't actually block. Promote to blocking. |
| **P1** | Evidence provenance before analysis | S0.5 → S1 | Fabricated evidence claims contaminate entire downstream pipeline. One hallucinated claim cascades through analysis, tool recs, and report. Catch early to avoid wasting GPT-5.5 cost on poisoned analysis. |
| **P2** | Tool research quality before analysis consumption | S0 → S1 | Stale/wrong tool data cascades into analysis and customer-facing recommendations. MVTD filter exists but validates structure, not content. Add content-level gate on tool research output. |
| **P3** | Report persistence ordering | S2, S3 → G3 | Reports + metadata written before final gate verdict. Move `saveReport` and `linkReport` AFTER `report-review` so blocked reports aren't persisted. |
| **P4** | Stage-routing circuit breakers | All stages | Single-stage failure shouldn't silently degrade downstream stages. Add per-stage timeout/error isolation so tool research failure → empty tools (flagged) rather than analysis consuming stale data. |
| **P5** | Queue vs inline isolation | W6, Q1 | Inline fallback bypasses queue persistence and retry. Should be dev-only with production blocked entirely. |

---

## 3. First Boundary Recommendation

### Build a **blocking intake quality gate** at pipeline entry (P0).

**Why first:**
- Highest frequency: runs on every assessment (every webhook call)
- Highest cost avoidance: prevents $0.30-0.50 GPT-5.5 waste per insufficient intake
- Lowest implementation effort: `checkIntakeSufficiency()` already exists and returns structured results — just needs `GATE_MODE=blocking` or equivalent to stop enqueue
- Most testable: deterministic heuristic checks (transcript length, question count, keyword detection) — no LLM call needed
- Downstream impact: blocks all subsequent stages, including the P1-P5 bypasses

**What changes:**
1. Set `checkIntakeSufficiency()` to **blocking mode** (currently shadow-only)
2. When insufficient: return 422 to webhook with structured gap report (not 202 Accepted)
3. When sufficient: proceed to enqueue (current behavior)
4. Add observability: log gap reasons with session IDs for operator review

**Expected impact:**
- Zero GPT-5.5 cost on incomplete intakes
- Cleaner R2/D1 storage (fewer junk reports)
- Better customer experience (no confusing low-quality reports)
- ~50% pipeline cost reduction for voice agent assessments (where hang-ups are common)

---

## 4. Summary Table

| Tier | Count | Actions |
|------|-------|---------|
| Tier 1 (Read-only) | 12 | Tool research, evidence extraction, LLM analysis, gate evaluation, structural validation, budget detection |
| Tier 2 (Reversible writes) | 13 | R2 save, D1 writes (report metadata, user records, gate results, pipeline status, audit events), filesystem fallback |
| Tier 3 (External side effects) | 5 | SendGrid emails (report-ready, welcome, receipt, portal invitation), Cloudflare Queue enqueue |
| Tier 4 (High-risk) | 1 | Stripe payment processing (external — not our code boundary) |
| **Total** | **31** | |

| Gate Coverage | Count | Status |
|---------------|-------|--------|
| Fully gated before action | 1 | Email delivery (S4) — correctly after report-review gate |
| Partially gated (shadow mode) | 2 | Intake quality (W4) — exists but doesn't block; Queue enqueue (W3) — depends on W4 |
| Gated after action (wrong order) | 2 | Report save (S2), Report link (S3) — gate runs AFTER writes |
| Not gated | 8 | Tool research (S0), Evidence extraction (S0.5), LLM analysis (S1), Tool MVTD (S0b), Budget extract (S0c), Analysis validation (S1v), Transcription save (W1), Status write (W2) |
| N/A (this is the gate) | 3 | All 3 gate evaluations (G1, G2, G3) |
| Staff portal (separate audit) | 4 | SP1-SP4 — have internal guards, not pipeline gates |

---

## 5. Action Boundary Crossings Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │              EXTERNAL WORLD                  │
                    │  ┌──────────┐  ┌─────────┐  ┌────────────┐  │
                    │  │ SendGrid │  │ Stripe  │  │ Cloudflare │  │
                    │  │ (email)  │  │(payment)│  │  (queue)   │  │
                    │  └────┬─────┘  └────┬────┘  └─────┬──────┘  │
                    └───────┼─────────────┼─────────────┼─────────┘
                            │ TIER 3      │ TIER 4      │ TIER 3
                    ┌───────┼─────────────┼─────────────┼─────────┐
                    │       ▼                          ▼          │
                    │  ┌──────────┐              ┌──────────┐     │
                    │  │  EMAILS  │              │  QUEUE   │     │
                    │  │  S4,S4a-c│              │ W3, Q1   │     │
                    │  └────┬─────┘              └────┬─────┘     │
                    │       │                         │           │
                    │       │    ┌────────────────────┘           │
                    │       │    │   APPLICATION BOUNDARY          │
                    │       │    ▼                                │
                    │  ┌──────────────┐                           │
                    │  │   PIPELINE   │                           │
                    │  │  S0,S0.5,S1  │  ← TIER 1 (no gates)     │
                    │  │  G1,G2,G3    │  ← TIER 1* (judge)       │
                    │  └──────┬───────┘                           │
                    │         │                                    │
                    │    ┌────┴────┐                               │
                    │    ▼         ▼                               │
                    │  ┌─────┐  ┌─────┐                            │
                    │  │ R2  │  │ D1  │  ← TIER 2                 │
                    │  │ S2  │  │ S3  │    (reversible)            │
                    │  └─────┘  └─────┘                            │
                    │                                              │
                    │  ┌──────────────────────┐                    │
                    │  │    STAFF PORTAL      │                    │
                    │  │  SP1, SP2, SP3, SP4  │  ← TIER 1-2        │
                    │  │  (separate audit)    │                    │
                    │  └──────────────────────┘                    │
                    └──────────────────────────────────────────────┘
```

### Boundary Crossing Severity

| Crossing | Actions | Gate Status | Recommended Action |
|----------|---------|-------------|-------------------|
| D1 writes (report + user) | S3a, S3b, S3c | AFTER report-review gate | Move to AFTER G3 |
| R2 writes (report) | S2 | AFTER report-review gate | Move to AFTER G3 |
| D1 writes (gate results) | G1p, G2p, G3p | During gate execution | ✅ Correct placement |
| D1 writes (pipeline status) | W2, Q2 | Before any gate | ✅ Low-risk — status metadata |
| D1 writes (audit events) | SP1, SP2 | Internal guards exist | ✅ Staff portal handles |
| SendGrid (customer email) | S4 | ✅ After G3 | ✅ Correct placement |
| SendGrid (transactional) | S4a, S4b, S4c | No gate | ✅ Low-risk — standard transactional |
| Cloudflare Queue | W3 | Intake check (shadow) | Promote to blocking |
| Stripe payment | W5 | N/A — Stripe handles | N/A |

---

## 6. File Inventory

Files audited for this action surface mapping:

| File | Purpose | Actions Mapped |
|------|---------|----------------|
| `src/lib/server/assessment/pipeline.ts` | Full pipeline orchestration | S0-S4, G1-G3 |
| `src/lib/server/assessment/queue.ts` | Queue producer + inline fallback | W3, Q1, Q2 |
| `src/lib/server/assessment/llm-analysis.ts` | GPT-5.5 analysis generation | S1 |
| `src/lib/server/assessment/tool-lookup.ts` | Perplexity tool research | S0a, S0b |
| `src/lib/server/assessment/evidence-map.ts` | Claim extraction | S0.5 |
| `src/lib/server/assessment/budget-detection.ts` | Budget parsing | S0c |
| `src/lib/server/assessment/analysis-types.ts` | Analysis validation | S1v |
| `src/lib/server/assessment/report-store-r2.ts` | R2 persistence | S2, S2f |
| `src/lib/server/assessment/emails.ts` | SendGrid email dispatch | S4, S4a-d |
| `src/lib/server/assessment/intake-quality-check.ts` | Pre-flight check | W4 |
| `src/lib/server/assessment/gate/runner.ts` | Gate orchestration + persistence | G1-G3, G1p-G3p |
| `src/lib/server/assessment/gate/gate-store.ts` | D1 gate persistence | G1p-G3p |
| `src/lib/server/assessment/gate/pbw-detector.ts` | PBW pattern detection | G3 (taste layer) |
| `src/lib/server/assessment/gate/definitions.ts` | Gate criteria | G1-G3 (prompts) |
| `src/lib/server/portal.ts` | Portal user/report linking | S3a-S3c |
| `src/routes/api/retell-webhook/+server.ts` | Voice intake entry | W1, W2, W3, W4 |
| `src/routes/api/stripe/webhook/+server.ts` | Chat intake + payment entry | W1, W2, W3, W4, W5, S4a-S4c |
| `src/lib/server/staff-portal/services/commit-staff-action.ts` | Staff portal writes | SP1 |
| `src/lib/server/staff-portal/services/commit-follow-up-action.ts` | Follow-up writes | SP2 |
