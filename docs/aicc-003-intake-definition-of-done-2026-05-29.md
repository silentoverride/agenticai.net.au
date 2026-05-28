# AICC-003 — Intake Definition of Done (Expanded)

**Date:** 2026-05-29  
**Methodology:** AICC-003 Definition-of-Done Generator  
**Input:** Pre-analysis (`_bmad-output/planning-artifacts/aicc-003-intake-definition-of-done-2026-05-28.md`), redesigned intake script (Story 6.2), gate criteria traceability header  
**Purpose:** Formal definition of "intake is complete enough to trigger the pipeline."

---

## Deliverable

A lightweight, no-API-call pre-flight check (`checkIntakeSufficiency()`) that evaluates intake transcripts against structural and content-quality gates. It returns a 4-state quality classification (SUFFICIENT / ADEQUATE / INCOMPLETE / INVALID) with gap diagnostics and a recommended action. The check runs at webhook time, BEFORE the pipeline is enqueued, and gates whether ~$0.30-0.50 in LLM costs should be committed.

**Format:** TypeScript function returning `IntakeQualityResult` with `quality`, `gaps`, `metrics`, and `recommendation` fields.  
**Length:** ~200 lines of server-only code. No external API calls, no database access, no LLM invocations.  
**Location:** `src/lib/server/assessment/intake-quality-check.ts`

---

## Completeness Criteria

The intake quality check must evaluate all of the following before classifying an intake:

1. **Transcript length** — below 100 chars = INVALID; below 400 chars = INCOMPLETE
2. **Question coverage** — below 3 questions answered = INVALID; below 6 = INCOMPLETE
3. **Blocking question coverage** — all 7 blocking questions (business_overview, current_tools, pain_points, workflow_details, concrete_metrics, process_consistency, budget) must have answers > 10 characters
4. **Tool name detection** — at least one known tool name from the 30+ tool indicator list must appear in the transcript
5. **Pain point specificity** — at least one temporal anchor or frustration keyword must appear
6. **Budget signal** — a dollar amount, budget phrase, or investment language must be detected

All 6 checks must be performed. Missing any check = incomplete implementation.

The quality classification must produce exactly one of four states:
- **SUFFICIENT** — all 6 checks pass
- **ADEQUATE** — all checks pass EXCEPT budget signal
- **INCOMPLETE** — any hard gate failed (length, question count, blocking coverage, tool names, pain specificity)
- **INVALID** — critically insufficient (transcript < 100 chars or < 3 answers)

The implementation must support two operational modes:
- **Shadow mode** (default): log warnings, enqueue pipeline anyway
- **Blocking mode** (`INTAKE_QUALITY_BLOCK=true`): skip pipeline for INCOMPLETE/INVALID, set status to `human_assist`

Both webhook entry points (Retell voice, Stripe voice + chat) must implement both modes identically.

---

## Quality Standard

*Based on the pre-analysis's own words and project context:*

**The intake check must be fast.** It runs at webhook time — every millisecond of latency is customer-facing. No database queries, no LLM calls, no external API requests. Pure string analysis only.

**The intake check must be conservative.** It blocks only when the pipeline would certainly produce a low-quality report. False positives (blocking adequate intakes) cost $1,200 in lost revenue. False negatives (passing insufficient intakes) cost $0.30-0.50 in wasted LLM expense plus operator time. The thresholds are tuned conservatively: block only clear failures.

**The intake check must be transparent.** Every gap is named explicitly in the return value. An operator reviewing a `human_assist` status must be able to see exactly what was missing and what to probe for. No opaque "quality score = 0.4" — specific, actionable gap messages.

**The intake check must not drift.** The blocking question list is imported from `intake-script.ts`, not hard-coded. When the intake script changes, the quality check changes with it. No synchronization bugs.

**The intake check separates structure from judgment.** It evaluates structural completeness (length, coverage, signals) — not content quality. Content quality assessment belongs to the pipeline gates. The intake check answers one question: "Is there enough to start?"

---

## Checkpoints

**Checkpoint 1: Webhook arrival.** Both webhook handlers call `checkIntakeSufficiency()` after payment confirmation but before `enqueueReportJob()`. This is the single gating point.

**Checkpoint 2: Operator review (blocking mode).** When blocking mode is active and an intake is INCOMPLETE or INVALID, the pipeline status is set to `human_assist`. An operator reviews the gaps and decides: re-contact customer, manually override and trigger pipeline, or refund.

No intermediate checkpoints between intake start and webhook arrival — the quality check runs at the end of the intake lifecycle, not mid-flow.

---

## Boundaries

**This defines intake completeness — NOT report quality.** The intake check says "enough data exists to start the pipeline." It does not say "the data is good enough to produce a quality report." That judgment belongs to the pipeline gates (quick-wins-verification, major-project-verification, report-review).

**This defines webhook-time gating — NOT pipeline-stage gating.** The intake check runs at the webhook entry point, before the pipeline queue. It is not a pipeline stage and does not appear in the pipeline status flow. It is a pre-flight check.

**This does not define operator notification.** When blocking mode sets status to `human_assist`, notification of the operator (email, Slack, dashboard alert) is a separate system — not part of this module.

**This does not define customer-facing messaging.** What the customer sees when their intake is held for review ("A specialist is reviewing your responses") is handled by the portal UI — not this module.

**This does not define retry logic.** When an intake is INCOMPLETE, the operator decides whether to re-contact the customer or refund. When an intake is INVALID, the status is set to `failed` with no automatic retry. The retry/refund workflow is a future story.

**This does not continue into pipeline optimization.** The intake quality thresholds are tuned for the current 10-question script and current gate criteria. If the intake script or gate criteria change substantially, the thresholds should be re-evaluated — but that is a different task.

---

## Compact Version

> The intake is SUFFICIENT when: all 7 blocking questions (business_overview, current_tools, pain_points, workflow_details, concrete_metrics, process_consistency, budget) have substantive answers (>10 chars each), at least one known tool name is present, a specific pain point with temporal anchor is detected, and the transcript exceeds 400 characters. The intake is ADEQUATE (pipeline runs with estimated budget) when everything passes except the budget signal. The intake is INCOMPLETE when any hard gate fails — do not trigger the pipeline. The intake is INVALID (transcript < 100 chars or < 3 answers) — set to failed, do not retry.

*(This compact version is embedded in `src/lib/server/assessment/intake-script.ts` header.)*
