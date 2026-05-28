# JLA-005 Gate Architecture Review — Agenticai Pipeline

**Date:** 2026-05-29
**Reviewer:** Dev Agent (subagent)
**Methodology:** JLA-005 v1 (`docs/agentic-workflows/judge-layer-architecture/jla-005-v1-judge-architecture-reviewer.md`)
**Inputs:** JLA-001 audit, current gate code (runner.ts, definitions.ts, pbw-detector.ts, gate-mode.ts), pipeline.ts

---

## 1. System Summary

The agenticai pipeline is a **single-agent assessment pipeline** (no multi-agent handoffs) that processes customer intake (voice or chat) through five stages:

```
Intake → Tool Research → Evidence Extraction → LLM Analysis → Gate Checkpoints → Save → Link → Gate → Email
```

**3 gates** exist:
- `quick-wins-verification` — validates Quick Wins against transcript evidence (QW-E1-3, QW-A1, R1/R2)
- `major-project-verification` — validates Deeper Opportunities against budget constraints (MP-E1, MP-A1/A2)
- `report-review` — final quality gate including taste (T1-T7) and PBW detection (RR-A0/A1, RR-T1-6, RR-Q1-3, RR-S1-3, RR-TC1-3)

**Gate mode** is configurable: `shadow` (log only) or `blocking` (prevent pipeline progression). Default: shadow.

**Key characteristics:**
- All 3 gates use the same GPT-5.5 judge model → **correlated judgment risk**
- Gates 1-2 run before report persistence; Gate 3 runs AFTER report is saved to R2/D1 → **placement gap**
- 8 pipeline actions have no gate coverage (JLA-001 BYPASS-1 through BYPASS-7)
- Staff Portal Epic 1 (Human Review) exists as downstream review surface for gate findings

---

## 2. Judge Placement Audit

### Current Gate Placement

| Gate | Pipeline Position | What It Guards | Placement Correct? | Issue |
|------|------------------|----------------|--------------------|-------|
| quick-wins-verification | After LLM Analysis, before Save | QW content quality | ✅ Correct | None |
| major-project-verification | After QW gate, before Save | MP content quality | ✅ Correct | None |
| report-review | After Save + Link, before Email | Report quality + delivery guard | ⚠️ **Wrong order** | Report persisted to R2/D1 BEFORE gate verdict. Blocked reports leave stale artifacts. |
| (none) | Tool Research (S0) | Perplexity API calls, tool data | ❌ Missing | GPT-5.5 cost incurs without tool quality validation |
| (none) | Evidence Extraction (S0.5) | Evidence map claims | ❌ Missing | Fabricated claims feed into analysis without pre-check |
| (none) | LLM Analysis (S1) | GPT-5.5 main generation | ❌ Missing | No structure plan validation before full generation |
| (none) | Intake → Enqueue | Pipeline trigger | ⚠️ Partial | `checkIntakeSufficiency()` exists but shadow-mode only |

### Pre-Pipeline Boundaries

| Boundary | Judge? | Status |
|----------|--------|--------|
| Voice call hang-up → pipeline trigger | `checkIntakeSufficiency()` (shadow) | ⚠️ Doesn't block |
| Chat intake submit → pipeline trigger | `checkIntakeSufficiency()` (shadow) | ⚠️ Doesn't block |
| Retry/duplicate submission → pipeline | Queue idempotency guard | ✅ Exists (sessionId-based) |

### Gate Communication

| From | To | What's Passed | Adequate? |
|------|----|---------------|-----------|
| QW gate → report-review | Verdict + action | ✅ via `priorGateResults` string | |
| MP gate → report-review | Verdict + action | ✅ via `priorGateResults` string | |
| Evidence map → report-review | Structured claims | ✅ via `formatEvidenceMapForPrompt()` | |
| Tool research → report-review | Tool list + MVTD stats | ✅ via `formatToolsForPrompt()` | |
| QW gate → MP gate | Nothing | ⚠️ No communication | Low-risk — they evaluate independent sections |

### Summary

| Status | Count | Boundaries |
|--------|-------|------------|
| ✅ Correctly placed | 2 | QW gate, MP gate (before save) |
| ⚠️ Wrong order | 1 | Report-review (after save, should be before) |
| ⚠️ Partial (shadow) | 1 | Intake quality check |
| ❌ Missing | 3 | Tool research, evidence extraction, LLM analysis pre-check |

---

## 3. Failure Mode Assessment

### 3.1 Correlated Judgment — **HIGH RISK** ⚠️

All 3 gates use the **same GPT-5.5 model** with similar prompt structures (role → criteria → output format). The actor (LLM analysis generator) also uses GPT-5.5 via similar prompt patterns.

**Shared blind spot risk:**
- If GPT-5.5 has a bias toward "helpful" recommendations vs. critical evaluation, both actor and judge share it
- If the model hallucinates tool capabilities, the actor hallucinates them AND the judge may not catch them (same knowledge gap)
- Gate prompts use different structures (gate criteria vs. generation prompt) which mitigates SOME correlation, but the underlying model weights are identical

**Severity:** High. The judge is only as skeptical as the model allows. A genuinely novel failure pattern will slip past both actor and judge.

**Mitigation available:** Use a different model for gate evaluation (Claude, Gemini) — not currently implemented.

### 3.2 Specification Gaming — **MEDIUM RISK** ⚠️

**Can the actor win by writing more persuasive justifications rather than better evidence?**

The analysis generator (`analyzeTranscript()`) produces structured JSON that gates then evaluate. The structure is somewhat rigid (sections: pain_points, quick_wins, deeper_opportunities, etc.), but the LLM generates persuasive prose within each section.

**Gaming vectors:**
- Actor can write verbose justifications with high-confidence language to pass gates
- Taste dimensions (T1-T7) catch some "pretty but wrong" patterns, but are themselves LLM-evaluated
- The evidence map provides some grounding, but LLM can still frame weak evidence persuasively
- PBW detector catches some patterns (unsupported claims, buzzword padding) but doesn't prevent them

**Mitigation:** Structural claim extraction (evidence map), T1-T7 taste scoring, A0 orphan claim detection. These reduce gaming surface but the LLM judge still evaluates LLM output.

### 3.3 Escalation Drift — **LOW RISK** (currently) ✅

**Is escalation calibrated? Is human review real?**

- Gate mode `blocking` means BLOCK = pipeline stops
- Gate mode `shadow` means BLOCK = logged but pipeline continues
- Staff Portal Epic 1 provides Human Review workspace for gate findings
- Operators can resolve, override, or escalate findings
- No evidence of "rubber-stamp" behavior (system is early, review volume unknown)

**Current calibration:** Unknown — no production data on escalation rates, override rates, or review cycle time. Should add telemetry before drawing conclusions.

### 3.4 Latency and Cost — **MEDIUM CONCERN**

| Component | Model | Cost/Run | Latency |
|-----------|-------|----------|---------|
| LLM Analysis (actor) | GPT-5.5 | ~$0.30-0.50 | 30-120s |
| QW Gate (judge) | GPT-5.5 | ~$0.05-0.10 | 5-15s |
| MP Gate (judge) | GPT-5.5 | ~$0.05-0.10 | 5-15s |
| Report-Review Gate (judge) | GPT-5.5 | ~$0.10-0.20 | 10-30s |
| **Total per assessment** | | **~$0.50-0.90** | **50-180s** |

With ~$49 AUD assessment price and ~$0.50-0.90 cost per run, the margin is healthy. However:
- Judge cost (~$0.20-0.40) is ~40% of pipeline cost
- The report-review gate cost could be reduced by moving some checks to deterministic validation
- Evidence map claims that are deterministic (question count, tool name presence) shouldn't need an LLM

### 3.5 Judge Ownership — **MEDIUM CONCERN**

- Gate prompts live in `definitions.ts` (single file, 3 prompts + taste dimensions)
- No prompt versioning in production (version field exists in runner but defaults to 'v1')
- No A/B comparison framework for prompt changes
- No regression test suite for gate prompts (planned in 7.4)
- Gate results persist to D1 but no analytics dashboard for gate performance

**Gap:** Prompts are hardcoded TypeScript strings. There's no way to A/B test a new gate prompt without deploying code.

---

## 4. Specialist Judge Assessment

### Current: Monolithic Approach

All 3 gates are monolithic — each gate evaluates everything in one GPT-5.5 call:
- `quick-wins-verification`: evidence, tool correctness, safety, quality — all in one prompt
- `report-review`: evidence traceability (A0/A1), gap handling (A0b), taste (T1-T7), safety (S1-S3), tool credibility (TC1-3), quality (Q1-3) — 6 domains in one prompt

### Specialist Split Recommendation

| Current Gate | Split Into | Type | Rationale |
|-------------|-----------|------|-----------|
| quick-wins-verification | `qw-evidence` (LLM) | Judge | Check QW claims against transcript — needs LLM for semantic matching |
| quick-wins-verification | `qw-tool-citation` (deterministic) | **Deterministic** | Check tool names exist in tool-lookup cache — no LLM needed |
| quick-wins-verification | `qw-safety` (LLM) | Judge | Check for regulated advice, "will save" language — needs LLM |
| report-review | `rr-evidence-traceability` (deterministic) | **Deterministic** | Count orphan claims, check evidence map coverage — no LLM needed (A0, A0b) |
| report-review | `rr-taste` (LLM) | Judge | T1-T7 taste scoring — needs LLM for style judgment |
| report-review | `rr-safety` (LLM) | Judge | S1-S3 safety checks — needs LLM for nuanced policy violation detection |
| report-review | `rr-tool-credibility` (deterministic) | **Deterministic** | TC1-3: tool pricing in budget band, AU availability — checkable from structured data |

### What Should Become Deterministic

These checks do not need an LLM and cost $0:

1. **Tool name existence** — check `tool-lookup.ts` cache (`qw-tool-citation`)
2. **Orphan claim count** — count evidence map claims without source (A0)
3. **Gap data invention** — check if gap fields exist in evidence map (A0b)
4. **Tool pricing in budget band** — compare tool price vs. budget signal (TC1)
5. **AU availability** — check `au_available` field on tools (TC2)
6. **Structural completeness** — all 7 sections present (deterministic count)
7. **Hourly rate stated** — check financial impact section for rate annotation (RR-T4)

**Estimated savings:** Moving these 7 checks from LLM to deterministic would reduce the report-review gate prompt size by ~30% and improve reliability (deterministic checks don't hallucinate).

---

## 5. Memory and Provenance Assessment

### Current State

| Memory Type | Source | Labeled? | Can Become Instruction? |
|------------|--------|----------|------------------------|
| Evidence map claims | `extractEvidenceMap()` LLM | ✅ Partial (direct/inferred/speculative) | ✅ Feeds into analysis prompt |
| Pipeline status (D1) | `setPipelineStatus()` writes | ❌ Not labeled by provenance | ✅ Status drives queue behavior |
| Gate results (D1) | `D1GateStore.insert()` | ✅ Stores verdict, confidence, reasoning | ✅ Staff Portal displays findings |
| Staff Portal audit events | `commitStaffAction()` writes | ✅ Timestamp, actor, state changes | ✅ Drives portal state |
| R2 report artifacts | `saveReportToR2()` writes | ❌ Reports are flat JSON — no provenance on individual claims | ✅ Delivered to customer |

### Gaps

| Gap | Risk | Priority |
|-----|------|----------|
| **Evidence map is LLM-generated and feeds into analysis** — one hallucinated claim cascades through entire pipeline | Actor consumes unverified evidence as fact | P1 |
| **Gate results are LLM-generated and feed into downstream gates** — a false-allow in QW gate means the MP gate works with "verified" content that isn't | Compounding errors across gates | P2 |
| **No provenance on analysis claims within the report** — customer can't trace "why this recommendation" | Report credibility | P2 |
| **Pipeline status is not labeled** — can't distinguish "completed normally" from "completed with shadow-mode gate failures" | Operational visibility | P3 |

### Key Finding: "Hidden Context Soup"

The report-review gate receives:
- Full analysis JSON
- Evidence map (LLM-generated)
- Tool research results (Perplexity → LLM)
- Prior gate results (LLM-generated)
- Budget signal (deterministic)

**Four of five inputs are LLM-generated.** The only ground-truth input (budget signal) is deterministic. This is a classic "hidden context soup" problem — the judge is evaluating LLM-generated content against other LLM-generated content, with the original transcript as the only anchor, and even the transcript is mediated through the evidence map.

**Recommendation:** Always pass the raw transcript to every gate. The gates currently receive `content` (the analysis + tool data + evidence map) but should also receive the original transcript for direct cross-reference against claims.

---

## 6. Human Review Assessment

### Current State

The Staff Portal (Epic 1) provides:
- ✅ Report review workspace with gate findings surfaced
- ✅ Operator can resolve, override, or escalate findings
- ✅ Audit events for all decision actions
- ✅ Override requires reason
- ✅ Whole-report approval checklist (all blockings resolved, reason code selected)
- ❌ No telemetry on review rates, override rates, or escalation rates
- ❌ No feedback loop from human overrides back to gate prompts
- ❌ No calibration data for false-allow vs false-block rates per gate

### Assessment

**Is human review real?** Yes — designed to be. But unmeasured.

**Is it calibrated?** Unknown — no production data yet.

**Does it feed back?** No — human overrides are not analyzed to improve gate prompts. Every override that corrects a false-block is wasted learning.

### Recommendation

Add a feedback loop: when an operator overrides a gate finding, that override should be tagged with which gate criterion it contradicted. These overrides become the gold-standard training data for tuning gate prompts in Story 7.3 and the evaluation suite in Story 7.4.

---

## 7. Verdict on Current 3-Gate Design

### Confirmed: Keep 3 gates but restructure

The 3-gate design is **fundamentally sound** but needs restructuring:

| Decision | Rationale |
|----------|-----------|
| **Keep quick-wins-verification** | ✅ Correct boundary. Covers highest-volume customer-facing claims. |
| **Keep major-project-verification** | ✅ Correct boundary. Budget alignment needs separate evaluation from QW quality. |
| **Keep report-review** | ✅ Necessary as final quality gate. Taste + safety dimensions require holistic evaluation. |
| **Split deterministic checks from LLM gates** | 7 checks currently in LLM prompts should be deterministic. Estimated 30% cost reduction, 100% reliability improvement for those checks. |
| **Move report-review BEFORE save** | BYPASS-2 (JLA-001): reports persisted before gate verdict. Fix: reorder stages so report-review gate runs before `stageSaveReport`. |
| **Add intake quality blocking mode** | BYPASS-1 (JLA-001): insufficient intake wastes GPT-5.5 cost. Fix: promote `checkIntakeSufficiency()` to blocking (not shadow). |
| **Add evidence pre-check gate** | BYPASS-3 (JLA-001): evidence map fabrication. Fix: add lightweight deterministic pre-check on evidence map before it feeds into analysis. |

### Rejected: Do NOT add gates for tool research or LLM analysis

Adding gates at every stage would be over-engineering:
- **Tool research**: MVTD filter provides deterministic quality check. Content-level validation belongs in the RRC epic (Epic 8), not as a pipeline gate.
- **LLM analysis**: The 3 existing gates already evaluate analysis content. A pre-analysis structure gate would add cost without proportional benefit — the analysis prompt already has structure constraints.

---

## 8. Remediation Roadmap

Priority = consequence severity × implementation effort. Focus on fixes that prevent worst outcomes with least effort.

| # | Recommendation | Type | Effort | Consequence if Not Fixed | Depends On |
|---|---------------|------|--------|--------------------------|------------|
| **P0** | Promote intake quality to blocking mode | Quick fix | Low | GPT-5.5 cost wasted on insufficient intakes. Low-quality reports delivered to customers. | None (code exists) |
| **P1** | Move report-review BEFORE stageSaveReport | Bug fix | Low | Blocked reports persist to R2/D1. Stale artifacts accumulate. Portal surfaces unapproved reports. | None |
| **P2** | Split 7 deterministic checks from LLM gates | Refactor | Medium | ~$0.05-0.10 wasted per assessment on LLM checks that code can do. Deterministic checks that hallucinate (can happen in LLM). | None |
| **P3** | Pass raw transcript to all gates | Enhancement | Low | "Hidden context soup" — judge evaluates LLM output against LLM output. Missed contradictions between analysis and transcript. | None |
| **P4** | Add evidence map pre-check (deterministic) | Enhancement | Medium | Fabricated evidence claims go undetected until report-review (after all LLM cost is sunk). | P2 (reuses deterministic check patterns) |
| **P5** | Add gate telemetry dashboard | Infrastructure | Medium | No visibility into false-allow/false-block rates. No calibration data for 7.4 evaluation suites. | None |
| **P6** | Human override → gate feedback loop | Enhancement | Large | Wasted learning — every override that corrects a false-block is lost. Gate prompts never improve from human corrections. | P5 (telemetry) |
| **P7** | Multi-model judge (different LLM for gate vs actor) | Infrastructure | Large | Shared blind spots between actor and judge. Both models share GPT-5.5 biases. | None (vendor procurement) |

### Quick Wins (this sprint)

1. **P0**: One-line change — remove shadow-mode bypass in webhook
2. **P1**: Reorder pipeline stages — move gate before save
3. **P3**: Pass `job.transcript` to `runGateCheckpoint()` alongside `content`

### Medium Build (next sprint)

4. **P2**: Extract deterministic checks into `gate/deterministic-checks.ts`
5. **P4**: Evidence map pre-check using same deterministic patterns
6. **P5**: Gate telemetry → D1 analytics table

### Significant Investment (future)

7. **P6**: Override feedback loop requires Staff Portal changes
8. **P7**: Multi-model judge requires vendor setup, cost analysis, A/B framework

---

## 9. Cross-Reference with JLA-001 Findings

| JLA-001 Finding | JLA-005 Verdict | Action |
|-----------------|-----------------|--------|
| BYPASS-1: Pre-analysis stages ungated | **Confirmed** — P0 priority | Add blocking intake quality check |
| BYPASS-2: Report persisted before final gate | **Confirmed** — P1 priority | Move report-review before save |
| BYPASS-3: No evidence provenance gate | **Confirmed** — P4 priority | Add deterministic evidence pre-check |
| BYPASS-4: Tool research quality not gated | **Deferred** to Epic 8 (RRC) | Not a gate problem — retrieval contract issue |
| BYPASS-5: Transcription write before quality check | **Accepted** — low risk | Storage cost negligible. Add cleanup cron if needed. |
| BYPASS-6: No stage-routing isolation | **Deferred** | Stage routing is queue consumer concern, not gate concern |
| BYPASS-7: Inline fallback skips queue isolation | **Accepted** — dev-only | Inline fallback is intentional for local dev. Production uses queue. |

---

## 10. Recommended 3-Gate Architecture (Post-Fix)

```
Intake (voice/chat)
│  ✅ checkIntakeSufficiency() — BLOCKING
│     If insufficient → 422 with gap report
│
▼ Queue Consumer
│
├─ Stage 0:  Tool Research (Perplexity)
├─ Stage 0.5: Evidence Extraction (LLM)
│     ✅ Deterministic evidence pre-check
│     If fabricated claims detected → flag, don't feed into analysis
│
├─ Stage 1:  LLM Analysis (GPT-5.5)
│
├─ Gate 1: quick-wins-verification (GPT-5.5)
│     ✅ Split: deterministic tool-citation check runs first ($0)
│     ✅ Then: LLM evidence verification on remaining claims
│
├─ Gate 2: major-project-verification (GPT-5.5)
│     ✅ Receives transcript directly for budget cross-reference
│
├─ Gate 3: report-review (GPT-5.5)
│     ✅ Split: 7 deterministic checks run first ($0)
│     ✅ Then: LLM taste + safety evaluation
│     ✅ Receives raw transcript + evidence map + prior gate results
│
├─ Stage 2: Save Report (R2)         ← MOVED AFTER gate
├─ Stage 3: Link Report (D1)         ← MOVED AFTER gate
│
└─ Stage 4: Email Delivery (SendGrid)
      ✅ Only if all 3 gates passed (blocking mode)
```
