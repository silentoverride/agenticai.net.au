# AICC-003 — Intake Definition of Done

**Date:** 2026-05-28  
**Inputs:** Intake script (`intake-script.ts`), voice agent pipeline (Retell webhook), chat intake flow (Stripe webhook), Phase 1 AICC-002 audit findings  
**Purpose:** Define explicit, verifiable completion criteria for the business intake — the stopping rule that determines "this intake is sufficient to trigger the pipeline."

---

## Current Trigger Logic (Before)

| Source | Trigger | Intake quality check? |
|--------|---------|----------------------|
| Voice (Retell) | `call_analyzed` webhook + `paymentStatus === 'paid'` | ❌ None — pipeline triggers on call completion regardless of content quality |
| Voice (Stripe catch-up) | Stripe payment confirmed + transcript available via `retell_call_id` | ❌ None |
| Chat (Annie) | Stripe payment confirmed + `session_id` metadata | ❌ None — pipeline triggers on payment regardless of intake progress |

**The gap:** A customer who says "I don't know, next question please" to every question, or who hangs up at Q3, gets the same pipeline treatment as one who gives detailed, specific answers to all 10 questions.

---

## Definition of Done

### Hard Gates (MUST be satisfied)

An intake is considered **complete** when ALL of the following are true:

#### 1. Structural Completeness

| Criterion | Threshold | Rationale |
|-----------|-----------|-----------|
| Transcript length | ≥ 400 characters | Prevents 30-second hang-ups from triggering pipeline. Below 400 chars, the intake is almost certainly incomplete or the caller disconnected early. |
| Blocking questions answered | Q1–Q5 (business_overview, current_tools, pain_points, workflow_details, concrete_metrics) with answers > 10 characters each | These 5 questions feed BLOCKING gate criteria. Without them, the pipeline generates reports with zero evidence provenance — guaranteed gate failure at report-review stage. |
| Total answered questions | ≥ 8 of 10 | The remaining questions (Q6–Q10) feed TASTE criteria. Missing 1-2 is acceptable (pipeline degrades gracefully). Missing more = significant quality gap. |

#### 2. Content Quality Signals

| Signal | Detection | Rationale |
|--------|-----------|-----------|
| Tool names present (Q2) | At least one known tool name detected in transcript (keyword match against 30+ known tools) | Q2 feeds QW-E2 (tool grounding) and RR-TC1 (researched provenance). Without tool names, all tool citation checks fail. |
| Specific pain point (Q3) | At least one temporal anchor ("hours," "per week," "daily") | Q3 feeds QW-A1 (stated need) and MP-A1 (problem existence). Without a specific pain point, these blocking criteria fail. |
| Budget signal (Q8) | Dollar amount or budget language detected | Q8 feeds MP-E1 (budget alignment). Missing budget isn't blocking on its own, but combined with other gaps = insufficient intake. |

#### 3. Minimum Evidence Density

| Metric | Minimum | Rationale |
|--------|---------|-----------|
| Words with ≥ 4 characters (excludes "yes"/"no"/"ok") | ≥ 50 | Filters out minimal-effort responses |
| Unique customer statements (utterances separated by agent questions) | ≥ 8 | Ensures the customer actually spoke, not just the agent |

### Soft Signals (warn, don't block)

These indicate intake quality but are individually non-blocking:

| Signal | When to warn | Rationale |
|--------|-------------|-----------|
| No budget stated | Budget signal not detected + "budget" keyword absent | Budget is important for financial recommendations but explicitly not stated is valid ("I'd rather not discuss budget"). Different from missing. |
| No timeline preference | Q10 answer is vague ("exploring," "just looking") | Pipeline can still generate — just won't prioritize urgency. |
| Single-word answers dominate | >50% of answers < 30 characters | Suggests customer disengagement. Pipeline output will be weak but may still be useful. |

---

## Intake Quality States

The intake can be in one of four states:

| State | Definition | Action |
|-------|-----------|--------|
| **SUFFICIENT** | All hard gates passed. Q1–Q5 substantive. Tool names + specific pain + budget signal detected. | → Trigger pipeline |
| **ADEQUATE** | All hard gates passed EXCEPT budget signal missing. Q1–Q5 substantive. | → Trigger pipeline (budget will be estimated) |
| **INCOMPLETE** | Some hard gates failed (transcript too short, Q1–Q5 incomplete, or < 8 questions answered). | → DO NOT trigger pipeline. Wait for intake completion or flag for operator. |
| **INVALID** | No meaningful content (transcript < 100 chars, < 3 questions answered, customer clearly disengaged). | → Set status to `failed`. Do not retry. |

---

## Implementation

### Already Implemented (JLA-005 P2)

The `checkIntakeSufficiency()` function in `src/lib/server/assessment/intake-quality-check.ts` implements the hard gates and content quality checks as a lightweight, no-API-call function.

**Current mode:** Shadow (warn in logs, pipeline still triggers).  
**To activate blocking:** Set `INTAKE_QUALITY_BLOCK=true` env var.

### Where it's wired

| Location | Integration |
|----------|-------------|
| `src/routes/api/retell-webhook/+server.ts` | Voice intake: runs before `enqueueReportJob()`. Logs gaps if insufficient. |
| `src/routes/api/stripe/webhook/+server.ts` (voice-agent path) | Voice intake (catch-up): runs before `enqueueReportJob()`. Logs gaps. |
| `src/routes/api/stripe/webhook/+server.ts` (Annie chat path) | Chat intake: runs with structured answers from D1. More accurate than voice-only check. |

### What happens when intake is insufficient and blocking is active

1. Pipeline is NOT enqueued
2. Pipeline status set to `human_assist`
3. Operator notified (future: notification system)
4. Customer sees "A specialist is reviewing your intake" (async state UI)
5. Operator can: re-contact customer for missing details, manually override and trigger pipeline, or refund

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Customer gives detailed Q1–Q3 but rushes through Q4–Q10 with short answers | SUFFICIENT if Q4–Q5 are at least 10 chars each and total ≥ 8 answered. Pipeline generates with adequate evidence for blocking criteria but weaker taste scores. |
| Customer says "I'd rather not discuss budget" (Q8) | ADEQUATE. Explicit refusal is different from missing — note in evidence map as "customer declined to state." Pipeline uses industry average. |
| Customer provides excellent Q1–Q5 but Q6–Q10 are a single-word "no" | SUFFICIENT (blocking criteria met). Pipeline generates with strong evidence for structural quality but weaker AU market fit and timeline alignment. |
| Customer hangs up at Q3 (only Q1–Q3 answered) | INCOMPLETE. Pipeline not triggered. Status set to `human_assist`. |
| Voice transcription fails catastrophically (garbled text) | INCOMPLETE (transcript length may still pass but content quality signals will fail). Tool names and pain indicators won't be detected. |
| Customer answers all 10 questions but answers are vague ("we want to be more efficient") | SUFFICIENT structurally but ADEQUATE in quality. Pipeline runs but gate will likely BLOCK on QW-A1 (stated need requires specificity). This is correct behavior — the intake was completed but wasn't good enough, and the gate catches it at the report stage. |

---

## Transition Plan

| Phase | What | Trigger |
|-------|------|---------|
| Current | Shadow mode — all intakes trigger pipeline, quality check logs warnings | N/A |
| Phase 1 | Blocking mode (env var) — insufficient intakes stop pipeline, set to `human_assist` | `INTAKE_QUALITY_BLOCK=true` |
| Phase 2 | Monitor false positives (intakes marked insufficient that were actually fine) | 2 weeks of shadow mode data |
| Phase 3 | Tune thresholds based on data | After Phase 2 review |
| Final | Blocking enabled by default | When false positive rate < 5% |
