# Phase 1 Diagnostics — Pipeline Agentic Workflow Integration

**Date:** 2026-05-28  
**Trigger:** Sprint Change Proposal — Workflow Integration Report  
**Tasks:** JLA-001 (Action Surface Audit), AICC-002 (Intake Audit), AIAS-001 (Karpathy Triplet Diagnostic)

---

## Task 1: JLA-001 — Pipeline Action Surface Audit

### Methodology

Applied the JLA-001 Action Surface Audit prompt against the full pipeline codebase at `src/lib/server/assessment/`. The audit classifies every action the pipeline can take or trigger across four risk tiers:

| Tier | Label | Description |
|------|-------|-------------|
| 1 | Read-only | Retrieve, analyze, classify — no external side effects |
| 2 | Reversible writes | Internal system writes with undo/recovery paths |
| 3 | External side effects | Actions affecting customers, external systems, or public visibility |
| 4 | High-risk | Spending money, deleting data, exposing PII, changing permissions |

### Full Action Inventory

#### Tier 1 — Read-only (12 actions)

| # | Action | Location | Notes |
|---|--------|----------|-------|
| 1 | Extract pain points from transcript | `tool-lookup.ts:extractPainPointsForToolLookup()` | Perplexity API call. Extracts 3-5 pain points with search queries. |
| 2 | Search for AI tools via Perplexity | `tool-lookup.ts:lookupToolsWithPerplexity()` | Queries Futurepedia/TAAFT through Perplexity. Returns up to 8 tools, deduplicated. |
| 3 | Check tool cache (D1 read) | `tool-cache.ts:getCachedTools()` | Reads cached tool results (24h TTL). Read-only. |
| 4 | Extract budget signal | `budget-detection.ts:extractBudgetSignal()` | Regex + keyword matching on transcript. No external calls. |
| 5 | Extract evidence map | `evidence-map.ts:extractEvidenceMap()` | LLM call (Kimi/Ollama) to extract structured claims from transcript. |
| 6 | Generate LLM analysis | `llm-analysis.ts:analyzeTranscript()` | Kimi/Ollama Cloud call. Core analysis generation. 10-minute timeout. |
| 7 | Run gate evaluation | `gate/runner.ts:runGate()` | GPT-5.5 API call. Produces verdict, confidence, reasoning, details. |
| 8 | Assess tool quality (MVTD) | `tool-lookup.ts:assessToolQuality()` | Local computation. Validates tools against MVTD critical fields. |
| 9 | Format tools for prompt | `tool-lookup.ts:formatToolsForPrompt()` | Local formatting. No external calls. |
| 10 | Validate structured analysis | `analysis-types.ts:parseAndValidateAnalysis()` | Local validation. Falls back to default analysis on failure. |
| 11 | Derive pipeline status (read) | `pipeline-store.ts` | D1 read. Returns current pipeline status. |
| 12 | Run budget alignment check | `budget-detection.ts:computeBudgetAlignment()` | Local computation. Tags tools with budget fit. |

#### Tier 2 — Reversible writes (7 actions)

| # | Action | Location | Notes |
|---|--------|----------|-------|
| 13 | Save tool results to cache | `tool-cache.ts:setCachedTools()` | D1 write. 24h TTL. Reversible (cache expiry). |
| 14 | Save report artifact to R2 | `report-store-r2.ts:saveReportUnified()` | R2 put. Immutable once written but can be superseded. |
| 15 | Save stage artifacts to R2 | `intake-store-r2.ts:saveStageArtifact()` | R2 put. Intermediate artifacts with timestamps. Non-destructive. |
| 16 | Save raw intake to R2 | `intake-store-r2.ts:saveRawIntake()` | R2 put. Audit trail — immutable by convention. |
| 17 | Set pipeline status (D1 write) | `pipeline-store.ts:setPipelineStatus()` | D1 upsert. Updates queued/generating/completed/error status. |
| 18 | Persist gate run record | `gate/gate-store.ts:D1GateStore.insert()` | D1 insert. Gate run records. Append-only in practice. |
| 19 | Save report metadata to D1 | `pipeline.ts:upsertReportMetadata()` | D1 upsert. Links report ID to session/customer metadata. |

#### Tier 3 — External side effects (6 actions)

| # | Action | Location | Notes |
|---|--------|----------|-------|
| 20 | Send report-ready email | `emails.ts:sendReportReadyEmail()` | SendGrid API. Customer-facing. Contains report access link. **CRITICAL: once sent, customer has report access.** |
| 21 | Link report to portal user | `portal.ts:linkReportToUser()` | Creates Clerk user↔report association. Enables portal access. |
| 22 | Find or create user from Stripe | `portal.ts:findOrCreateUserFromStripe()` | Creates Clerk user if not exists. External identity system mutation. |
| 23 | Send welcome email | `emails.ts:sendWelcomeEmail()` | SendGrid API. Post-assessment booking. |
| 24 | Send receipt email | `emails.ts:sendReceiptEmail()` | SendGrid API. Tax invoice. |
| 25 | Send portal invitation email | `emails.ts:sendPortalInvitationEmail()` | SendGrid API. Portal access invitation. |

#### Tier 4 — High-risk (1 action)

| # | Action | Location | Notes |
|---|--------|----------|-------|
| 26 | Queue job with retry | `queue.ts:enqueueReportJob()` | Cloudflare Queue send. On failure, retries cause re-execution. **Risk: idempotency — double-processing could send duplicate emails, duplicate charges.** Pipeline has no idempotency key at the queue level (unlike Staff Portal's `commitStaffAction` which enforces `UNIQUE(actor_id, assessment_id, idempotency_key)`). |

### Risk Map

The pipeline's action surface flows in a mostly linear sequence:

```
Intake (Retell) → [queue] →
  Tool Research (Tier 1) →
    Evidence Extraction (Tier 1) →
      Gate: quick-wins-verification (Tier 1) →
        LLM Analysis (Tier 1) →
          Gate: major-project-verification (Tier 1) →
            Save Report (Tier 2) →
              Link Report (Tier 3) →
                Gate: report-review (Tier 1) →
                  Email Delivery (Tier 3)
```

**Current gate coverage:**
- Three gates currently running in **shadow mode** — they log verdicts but do not block the pipeline.
- No gate runs before email delivery (Tier 3). The `report-review` gate runs, but even if it BLOCKs, the email is still sent in shadow mode.
- No gate covers the `linkReportToUser` or `findOrCreateUserFromStripe` actions — these are Tier 3 actions with no judgment.
- No gate at the queue ingestion boundary — duplicate queue messages can re-execute the full pipeline.

**Instrumentation priority:**

| Priority | Boundary | Action(s) | Risk | Current gate? | Recommendation |
|----------|----------|-----------|------|---------------|----------------|
| **1** | Email delivery | `sendReportReadyEmail()` | Email contains report access. Once sent, customer has portal access. | report-review gate runs but is shadow-mode only | **Promote report-review gate to blocking mode** before email delivery. Gate must ALLOW before email sends. |
| **2** | Queue→Pipeline | `enqueueReportJob()` | Duplicate queue messages cause double-processing (duplicate emails, duplicate R2 writes) | None | **Add idempotency key to queue messages**. Deduplicate at the queue consumer level. |
| **3** | Portal user link | `linkReportToUser()`, `findOrCreateUserFromStripe()` | Creates Clerk user accounts, links report access | None | **Add pre-link authorization check**: is report approved? is payment confirmed? is customer email verified? |
| **4** | Tool research | `lookupToolsWithPerplexity()` | Stale/missing tool data silently degrades report quality | None (MVTD runs post-facto) | MVTD already catches critical field failures. Add pre-pipeline freshness check on cached tools. |
| **5** | LLM analysis | `analyzeTranscript()` | Hallucinated analysis presented as facts | major-project-verification (shadow) | Promote major-project-verification to blocking after JLA-005 confirms gate design. |

### First Boundary Recommendation

**Build the judge for email delivery first.** The `report-review` gate already exists and evaluates report content. The change is operational: promote it from shadow mode to blocking mode and place it as a hard gate before `stageEmailDelivery()` rather than as a checkpoint within the pipeline. This is the boundary where pipeline output becomes customer-visible — it's the highest combination of risk and volume.

---

## Task 2: AICC-002 — Intake Quality Audit

### Methodology

Applied the AICC-002 Vague Ask Auditor prompt against the intake script at `src/lib/assessment/intake-script.ts` and supporting infrastructure at `src/lib/server/assessment/intake-store-r2.ts`, `retell-job.ts`, and `voice-agent-script.md`.

### Assessment Against the Six-Field Framework

#### What's Here (Adequately Covered)

| Field | Coverage | Evidence |
|-------|----------|----------|
| **Goal** | **Adequate** | "Business context capture" is the stated purpose. The intake explicitly feeds the pipeline stages: each question is mapped to gate criteria (QW-A1, MP-A2, RR-TC1-3, etc.) with severity indicators (● BLOCKING, ◐ TASTE). The connection from intake → pipeline is stronger than typical intakes. |
| **Context** | **Adequate** | The intake script has excellent header documentation: a gate criteria → evidence type → intake question cross-reference table. A smart person joining cold would understand why each question exists and what it feeds. |
| **Sources** | **Adequate (for intake domain)** | Sources ARE named: each question declares `feedsGateCriteria` explicitly. Q1 feeds QW-A1, MP-A2, RR-A0, RR-T3, RR-T5. Q2 feeds QW-A1, QW-E2, RR-TC1-3, MP-E3, RR-T2. The traceability from question → gate criterion → pipeline stage is complete. |

The intake is stronger than expected. It already maps every question to downstream pipeline needs — which is what AICC-001 would produce as a redesign recommendation. The team has essentially done AICC-001 work without the formal methodology.

#### What's Missing (Gaps)

| Field | Gap | What's Likely to Go Wrong |
|-------|-----|--------------------------|
| **Constraints** | No explicit constraints on what Annie should NOT ask | Annie could probe into regulated areas (health data, political opinions, competitor names, sensitive financial details) without guardrails. The intake has no "stop" conditions for sensitive topics. |
| **Quality bar** | No qualitative description of what makes intake answers "good enough" | The intake measures completeness (10 questions asked) but not quality (did the customer give specific, actionable answers?). Q3 asks for "a specific example from this week" but there's no check that the answer is actually specific. A customer could answer every question vaguely and the pipeline would still launch. |
| **Definition of done** | No explicit stopping rule for intake | The intake has 10 questions but follow-ups can extend it. There's no declaration of "intake is complete enough to trigger the pipeline." The pipeline triggers when the call ends (Retell webhook), not when intake quality is sufficient. The `assessmentReady` field from Retell is boolean but its derivation is opaque. |
| **Conversational adaptation** | The intake script is text-optimized but delivered through voice (Retell) | The Retell voice agent follows `voice-agent-script.md` which is adapted from the intake script. However, there's no feedback loop: if voice transcription quality is poor, the pipeline gets degraded text without knowing it came from audio with errors. The gap between "what Annie asked" and "what the customer heard" is unmeasured. |

#### What's Ambiguous

| Phrase/Concept | Ambiguity | Risk |
|----------------|-----------|------|
| "A ballpark like 'a couple hundred' or 'up to a thousand'" (Q8 budget) | This primes the customer with specific numbers, which could anchor their response to the suggested range regardless of actual budget. | The budget signal could be artificially constrained by Annie's framing. A customer who might spend $2,000/month may say "$500-1,000" because Annie suggested it. |
| "roughly how many hours per week" (Q4-Q5) | "Roughly" is not qualified. Different customers will interpret precision differently. | One customer's "roughly 5 hours" may mean 3-7 hours; another may mean 2-15 hours. The financial impact calculations downstream depend on this precision. |
| "quick wins this month" vs "planning over the next quarter" (Q10) | The framing is timeline-anchored (month vs quarter), not urgency-anchored. | A customer could choose "next quarter" because they're methodical, not because it's low urgency. The pipeline treats the answer as a binary urgency signal. |
| "comfortable monthly investment" (Q8) | "Comfortable" conflates willingness-to-pay with ability-to-pay. | A customer with $10K disposable budget who is risk-averse might say "$200" because it's "comfortable." The report would under-scope recommendations. |

### What's Likely to Go Wrong With the Intake as Written

1. **Vague answers become precise-looking numbers.** The pipeline extracts budget signals, time-loss estimates, and financial impact from the transcript. If a customer says "probably 5 hours, maybe more," the pipeline may anchor on "5 hours" and produce a financial model that looks precise but is built on a guess.

2. **Premature pipeline launch.** The pipeline triggers when the Retell webhook fires (call ends), not when intake quality is sufficient. An incomplete call (customer hung up at Q5) would still trigger the full pipeline with half the evidence.

3. **Voice transcription errors silently degrade quality.** Words like "HubSpot" → "hub spot" or "Xero" → "zero" would produce wrong tool citations and confuse gate checks. The pipeline has no transcription quality gate.

4. **The budget anchoring effect.** Annie's Q8 framing ("a couple hundred or up to a thousand") could systematically understate actual customer budgets, producing sub-scale recommendations.

### Key Finding

The intake script is **already well-designed** — it maps questions to gate criteria, front-loads blocking criteria in the first 5 questions, and uses probing follow-ups. The remaining gaps (definition of done, constraints, voice quality feedback) are about operational guardrails, not question design.

The AICC workflow's value for this intake is not in redesigning questions (AICC-001) — those are already structured. It's in adding:

1. **Definition of Done (AICC-003):** Explicit stopping rule — what must be present before pipeline trigger.
2. **Constraints field:** Topics Annie must avoid or redirect.
3. **Quality bar:** What makes an answer "specific enough" vs "needs re-probing."
4. **Voice-specific adaptation:** How the text-optimized intake adapts to audio with transcription checks.

---

## Task 3: AIAS-001 — Karpathy Triplet Diagnostic

### Methodology

Applied the AIAS-001 Karpathy Triplet Diagnostic against the assessment pipeline codebase at `src/lib/server/assessment/` and its supporting infrastructure.

### Phase 1 — The Editable Surface

**What controls this system's behavior?**

The pipeline's behavior is controlled by:

| Surface | Location | Modifiability | Isolation | Version Control |
|---------|----------|---------------|-----------|-----------------|
| LLM analysis prompt | `src/lib/server/assessment/llm-analysis.ts` | ✓ Changeable | Medium — prompt structure affects downstream gate evaluation | ✓ Git |
| Gate system prompts | `src/lib/server/assessment/gate/definitions.ts` | ✓ Changeable | High — each gate prompt is independent | ✓ Git |
| Gate policy (blocking vs shadow) | Env vars `GATE_MODE_*` + `gate/gate-mode.ts` | ✓ Runtime changeable | High — per-gate | ✓ Git + env |
| Perplexity tool lookup prompt | `src/lib/server/assessment/tool-lookup.ts` (inline) | ✓ Changeable | High — independent of LLM analysis | ✓ Git |
| Evidence extraction prompt | `src/lib/server/assessment/evidence-map.ts` | ✓ Changeable | Medium — feeds into LLM analysis | ✓ Git |
| Model selection | Env vars `LLM_MODEL_*`, `PERPLEXITY_MODEL`, `GPT55_MODEL` | ✓ Runtime changeable | High — per-stage | ✓ Git + env |
| MVTD specification | `src/lib/server/assessment/tool-lookup.ts:MVTD` | ✓ Changeable | High — affects gate TC1-3 evaluation | ✓ Git |
| Budget detection logic | `src/lib/server/assessment/budget-detection.ts` | ✓ Changeable | High — independent LLM-free logic | ✓ Git |
| Queue routing | `workers/stages/` (separate worker) | ✓ Changeable | Medium — stage order matters | ✓ Git |

**GATE CHECK — Editable Surface:** ✅ PASSES
- (a) **Specific**: Every item above can be named as a specific file path or env var.
- (b) **Isolated**: Gate prompts, tool lookup prompts, and model selection are independently modifiable. LLM analysis prompt depends on evidence extraction output and tool research output — changes cascade to gate evaluation.
- (c) **Version-controlled**: All prompt code is in Git. Env vars are documented.

### Phase 2 — The Metric

**How is performance currently measured?**

| Metric | Automated? | Single number? | Compute time | Correlates with business value? |
|--------|------------|----------------|--------------|-------------------------------|
| Gate verdicts (approve/block/escalate) | ✓ Automated | No (per-gate, not unified) | ~45s per gate | Partial — gates measure technical quality, not business impact |
| Gate confidence scores | ✓ Automated | No (per-gate) | Same as above | Weak — confidence can be high on wrong judgments |
| MVTD pass rate | ✓ Automated | Yes (% tools passing) | <1s (local) | Partial — measures tool data quality, not report quality |
| Evidence coverage rate | ✓ Automated | Yes (% direct + inferred claims) | Included in evidence extraction | Moderate — higher coverage = more anchored claims |
| Pipeline success rate | ✓ Automated | Yes (% completed vs failed) | Per run | Weak — "completed" doesn't mean "good" |
| Pipeline duration | ✓ Automated | Yes (seconds) | Per run | Weak — faster isn't better for quality |
| Cost per assessment | ✓ Computable | Yes (AUD) | Per run sum | Moderate — important for business but not quality |
| Customer satisfaction | ❌ Not measured | N/A | N/A | Strong correlation — but requires human survey |

**Is there a unified "this pipeline is performing well" metric?** No.

**GATE CHECK — Metric:** ❌ FAILS
- (a) **Not automatically computable without human judgment**: Report quality assessment requires a human to judge whether the report is actually useful, accurate, and well-structured. Gates produce scores but they measure gate compliance, not end-to-end quality.
- (b) **No unified evaluable metric within a bounded time window**: Multiple metrics exist but none capture overall pipeline quality in a single number computable after each run.
- (c) **Not expressible as a single scalar**: The closest candidate is a weighted composite of gate scores + evidence coverage + MVTD pass rate, but weights are arbitrary without calibration against human quality judgments.
- (d) **Correlation to business value is unclear**: Gate pass rates don't necessarily correlate with client satisfaction or business outcomes. A report could pass all gates and still be unhelpful to the client.

**Blocker:** The pipeline lacks a calibrated quality evaluation benchmark. Without a set of "known good" and "known bad" reports with human annotations, there's no ground truth to optimize against. The gate evaluation suites (JLA-004, Story 7.4) would partially address this, but only for gate-level quality — not end-to-end report quality.

### Phase 3 — The Time Budget

**Experiment cycle time:**

| Component | Time | Cost |
|-----------|------|------|
| Tool research (Perplexity) | ~20s | ~$0.01-0.02 |
| Evidence extraction (LLM) | ~30s | ~$0.05-0.10 |
| LLM analysis (Kimi/Ollama) | ~60s | ~$0.15-0.30 |
| Gate evaluation × 3 (GPT-5.5) | ~135s | ~$0.10-0.20 |
| Save/link/email | ~5s | ~$0.001 |
| **Total per experiment** | **~4 minutes** | **~$0.30-0.50** |

**Can hundreds of experiments run overnight?** Barely. At 4 min/experiment, 100 experiments = 400 minutes (~6.7 hours). At max parallelism of 3 (avoiding Perplexity rate limits), ~2.2 hours. Cost: $30-50 for 100 experiments.

**Can experiments run in a sandbox?** Yes — the pipeline can run on stored test transcripts without affecting production. Test transcripts exist in `app_data/reports/`. But sandboxed experiments would still call production Perplexity, Kimi, and GPT-5.5 APIs (no local mock) — real costs apply.

**GATE CHECK — Time Budget:** ✅ PASSES (marginally)
- (a) **Under 10 minutes per experiment**: ✓ 4 minutes average.
- (b) **Cost acceptable**: ~$30-50 for 100 experiments is reasonable for optimization work.
- (c) **Sandboxed environment**: ✓ Can use test transcripts. Real API costs but no production impact.

### Phase 4 — Verdict

**BLOCKER REPORT**

| Gate | Status | Blocker |
|------|--------|---------|
| Editable Surface | ✅ PASSED | Prompt templates, model selection, gate definitions, MVTD spec — all specific, isolated, version-controlled. |
| Metric | ❌ FAILED | No unified, automatically-computable quality metric exists. Gate scores and evidence coverage rate are partial proxies. No calibrated ground truth (human-annotated good/bad reports) to validate proxies against. |
| Time Budget | ✅ PASSED | ~4 min per experiment, ~$0.30-0.50 cost, sandboxable on test transcripts. |

### Blocker Details

**Metric Blocker — Specific Gap:** The pipeline generates reports but has no automated way to evaluate report quality end-to-end. The three gates check structural compliance (quick-wins-verification, major-project-verification) and content quality (report-review with taste scoring + PBW detection), but:
- Gate scores are per-gate, not unified
- No ground truth exists — there's no corpus of reports annotated by humans with quality judgments
- Gate evaluation suites (JLA-004/Story 7.4) will create per-gate test cases, but not end-to-end report quality benchmarks

**Why it matters:** An optimization loop told to "maximize gate scores" would learn to write reports that satisfy the gates without necessarily being useful to clients. Without a calibrated quality metric, optimization would optimize for gate compliance, not business value.

**Concrete next step:**
1. Build a calibrated evaluation corpus: 20-30 reports with human annotations (quality score 1-5, usefulness rating, accuracy rating) — this is a distinct task from JLA-004 gate eval suites
2. Validate whether a composite of gate scores + evidence coverage rate + MVTD pass rate correlates with human quality judgments
3. If correlation is strong enough (r > 0.7), the composite becomes the optimization metric
4. If correlation is weak, the human-annotated corpus itself becomes the optimization target (more expensive per evaluation)

**Remediation Sequence:**

| Step | What | Effort | Depends on |
|------|------|--------|------------|
| 1 | Build human-annotated report quality corpus (20-30 reports) | Medium | Access to past reports + domain expert time |
| 2 | Validate gate score composite against human annotations | Small | Step 1 |
| 3 | Set gate evaluation suites (JLA-004) as gate-level guardrails | Medium | JLA-003 judge prompts |
| 4 | Run AIAS-001 again with validated metric | Small | Step 2 |
| 5 | AIAS-002 metric gaming pre-mortem | Small | Step 4 (if program.md produced) |

**Honest Timeline Estimate:** The pipeline is **weeks, not months** from auto-optimization readiness. The main blocker (metric) requires human annotation effort (20-30 report reviews) + validation analysis. The editable surface and time budget are ready. If annotation can be done in a sprint, the system could be optimization-ready in 2-3 weeks.

---

## Summary — Phase 1 Findings

| Task | Verdict | Key Finding |
|------|---------|-------------|
| **JLA-001** | Action surface mapped | 26 actions identified. Critical gap: email delivery (Tier 3) has no blocking gate. Queue idempotency missing. Report-review gate runs shadow-mode before email sends — highest priority fix. |
| **AICC-002** | Intake is well-designed | The intake already maps every question to gate criteria. Gaps are operational (no definition of done, no constraints, no voice-quality guard), not structural. AICC-001 redesign is unnecessary — focus on AICC-003 (definition of done) and constraints. |
| **AIAS-001** | **BLOCKER** — not ready for auto-optimization | Editable surface ✅, time budget ✅, metric ❌. No unified quality metric exists. Needs human-annotated report corpus + composite metric validation. Ready in 2-3 weeks after annotation work. |

### Phase 1 → Phase 2 Handoff

With Phase 1 complete, the immediate next actions are:

1. **JLA-005 (Gate Architecture Review):** Validate the 3-gate design using the action surface map from JLA-001. Confirm optimal gate boundaries, specialist vs monolithic judges, and blocking mode criteria.

2. **Promote report-review gate to blocking mode:** Move the gate before `stageEmailDelivery()` and switch from shadow to blocking. This is the highest-risk boundary identified.

3. **AICC-003 (Intake Definition of Done):** Define explicit stopping rules for intake — what must be present before pipeline trigger. This closes the premature-pipeline-launch gap.

4. **Build evaluation corpus:** Assemble 20-30 annotated reports for metric validation (AIAS-001 blocker remediation).

These map to:
- Epic 7 Story 7.2 (Gate Architecture Review) — JLA-005
- Epic 7 Story 7.3 (Gate Judge Prompt Design) — report-review blocking mode
- Epic 6 Story 6.3 (Intake Completion Criteria) — AICC-003
- Epic 10 Story 10.1 prerequisite work — evaluation corpus
