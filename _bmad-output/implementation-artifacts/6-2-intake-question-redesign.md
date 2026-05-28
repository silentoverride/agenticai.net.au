# Story 6.2: Intake Question Redesign (AICC-001)

Status: review

## Story

As a pipeline developer,
I want to redesign Annie's intake questions based on the AICC-002 audit findings,
So that each question maps to a specific downstream pipeline need and guardrails prevent unsafe content.

## Requirements Sourced From

- AICC-001 Useful Question Builder (`docs/agentic-workflows/ai-communication-clarity/aicc-001-v1-useful-question-builder.md`)
- AICC-002 Audit Report (`docs/aicc-002-intake-quality-audit-2026-05-28.md`) — detailed findings from Story 6.1
- JLA-005 Gate Architecture Review (Finding 5: intake-quality gate needs intake-quality signals)

## Acceptance Criteria

### AC1: All critical audit gaps addressed

**Given** the AICC-002 audit report from Story 6.1
**When** the intake script is redesigned
**Then** all five BLOCKING-severity gaps are addressed:
1. Text script now has ANNIE_GUARDRAILS (10 guardrail rules matching voice script constraints)
2. Compound Q1 broken into 3 sequential questions (business_overview, role_and_team, operating_history)
3. Budget Q6 separates "comfortable" from "maximum" investment
4. Timeline Q7 adds "waiting for trigger" classification via follow-up probes
5. Quality bar annotations added to every question

### AC2: Quality bar per question

**Given** the redesigned intake script
**When** a developer or LLM reads each question
**Then** every question includes a `qualityBar` field specifying what makes an answer "good enough" vs "needs re-probing"
**And** the quality bar is specific enough that an LLM can determine whether to accept or re-probe an answer

### AC3: Pipeline and gate criteria traceability

**Given** the redesigned intake script
**When** a developer traces a gate criterion to its source
**Then** every question includes `feedsPipelines` (which pipeline stages consume this answer) and `feedsGateCriteria` (which gate criteria this answer supports, with ● for BLOCKING)
**And** `BLOCKING_QUESTION_IDS` is exported with correct question IDs matching the actual script

### AC4: Backward compatibility

**Given** the existing chat webhook at `src/routes/api/stripe/webhook/+server.ts` and UI at `src/lib/components/ResumePrompt.svelte`
**When** the redesigned intake script is deployed
**Then** existing API consumers can still import `INTAKE_SCRIPT`, `IntakeQuestion`, `IntakeProgress`, `ChatMessage`, `TOTAL_QUESTIONS`, `getFollowUp()`
**And** `IntakeProgress.answers[]` still accepts `questionId` and `answer` fields
**And** no TypeScript compilation errors in files importing from `src/lib/assessment/intake-script.ts`

## Pre-conditions / Prerequisites

- AICC-002 audit complete at `docs/aicc-002-intake-quality-audit-2026-05-28.md`
- AICC-001 methodology at `docs/agentic-workflows/ai-communication-clarity/aicc-001-v1-useful-question-builder.md`
- Voice script at `docs/voice-agent-script.md` (reference for guardrail alignment)
- Existing `intake-script.ts` at `src/lib/assessment/intake-script.ts` (to be redesigned)

## Tasks / Subtasks

### Task 1: Design guardrails for text script ✅

- [x] Extract guardrails from voice script (`docs/voice-agent-script.md` §Guardrails)
- [x] Adapt for chat context (voice guardrails like "don't ask for passwords during the call" → "don't ask for passwords")
- [x] Add 2 additional guardrails not in voice script: PII minimization, regulated topic redirection
- [x] Export as `ANNIE_GUARDRAILS` constant array for injection into chat system prompt

### Task 2: Redesign questions addressing audit findings ✅

- [x] Break compound Q1 into business_overview, role_and_team, operating_history
- [x] Move AI readiness from Q4 to Q2 (allows adaptation of subsequent questions)
- [x] Add concrete_impact question (Q5) — quantifiable pain point impact, replacing vague original Q4/Q5
- [x] Redesign budget question (Q6): separate "comfortable" from "maximum" investment
- [x] Redesign timeline question (Q7): add trigger-event follow-up for non-urgent users
- [x] Add open_close catch-all question (Q8, optional) — captures anything missed

### Task 3: Add quality bar annotations ✅

- [x] Add `qualityBar` field to `IntakeQuestion` interface
- [x] Write specificity standard for each question (what makes answer sufficient vs needs re-probe)
- [x] Standards are actionable: LLM can determine whether to accept or probe further
- [x] Examples: "must name at least one specific software product," "must include frequency + impact"

### Task 4: Add pipeline and gate criteria mappings ✅

- [x] Add `feedsPipelines` field — which downstream stages consume each answer
- [x] Add `feedsGateCriteria` field — which gate criteria each answer supports (● = BLOCKING)
- [x] Export `BLOCKING_QUESTION_IDS` with actual question IDs matching the script
- [x] Q1-Q6 (business_overview through budget) cover all BLOCKING criteria
- [x] Q2 (ai_readiness) and Q7 (timeline) cover TASTE criteria only

### Task 5: Maintain backward compatibility ✅

- [x] All existing exports preserved: INTAKE_SCRIPT, IntakeQuestion, IntakeProgress, ChatMessage, TOTAL_QUESTIONS, getFollowUp()
- [x] IntakeQuestion interface extended (new fields are additive: qualityBar, feedsPipelines, feedsGateCriteria)
- [x] IntakeProgress.answers[] extended (meetsQualityBar is optional)
- [x] getFollowUp() function unchanged — same keyword-matching logic

## File List

- `src/lib/assessment/intake-script.ts` (MODIFIED — redesigned from 6 to 8 questions with guardrails, quality bars, pipeline mappings)
- `docs/aicc-002-intake-quality-audit-2026-05-28.md` (REFERENCE — audit findings driving the redesign)
- `src/lib/server/assessment/intake-quality-check.ts` (DEFERRED to Story 6.3 — BLOCKING_QUESTION_IDS still references old IDs; must be updated in 6.3 to match new script)

## Dev Agent Record

### Implementation Notes

**Scope:** Redesign `src/lib/assessment/intake-script.ts` only. The quality check fix (`intake-quality-check.ts` BLOCKING_QUESTION_IDS mismatch) is deferred to Story 6.3 (Intake Completion Criteria). This keeps Story 6.2 focused on the question design and avoids scope creep.

**Key design decisions:**

1. **8 questions (up from 6):** Q1 split into 3 parts (business + role/team + history). Added concrete_impact (Q5) to capture quantifiable pain data. Added open_close (Q8) as catch-all. AI readiness moved to Q2.

2. **ANNIE_GUARDRAILS exported as constant:** Rather than embedding guardrails in a comment, they're a structured array that can be injected into the LLM system prompt at the chat webhook level. The webhook handler can prepend these to Annie's prompt context.

3. **qualityBar uses natural language:** Rather than a formal type system (which an LLM wouldn't consume), qualityBar is prose that an LLM can use to evaluate answer sufficiency. Each bar includes a specific threshold and a re-probe trigger.

4. **BLOCKING_QUESTION_IDS exported:** Seven question IDs (business_overview, role_and_team, operating_history, current_tools, pain_points, concrete_impact, budget). These feed all BLOCKING gate criteria. Exported so `intake-quality-check.ts` can import them (Story 6.3).

5. **Backward compatibility preserved:** All existing exports unchanged. New fields are additive (qualityBar, feedsPipelines, feedsGateCriteria on IntakeQuestion; meetsQualityBar on answers). Old consumers that don't use these fields continue to work.

**What's deferred to Story 6.3:**
- Update `intake-quality-check.ts` BLOCKING_QUESTION_IDS to import from `intake-script.ts`
- Fix `estimateBlockingCoverage()` to match new question IDs
- Wire ANNIE_GUARDRAILS into chat webhook system prompt
- Implement intake-quality gate blocking logic
- Update `IntakeProgress.completed` to require quality bar satisfaction

### Completion Notes

Redesigned intake script addresses all 5 BLOCKING-severity gaps from the AICC-002 audit:
1. Text script now has ANNIE_GUARDRAILS (10 rules) matching voice script's 7 + 2 additional
2. Compound Q1 broken into 3 sequential questions with individual quality bars
3. Budget Q6 separates comfortable from maximum investment
4. Timeline Q7 adds trigger-event classification via follow-up probes
5. Quality bar annotations on all 8 questions (actionable specificity standards)

The script exports the same interface as v1 — existing consumers in `ResumePrompt.svelte` and the chat webhook continue to work. The `BLOCKING_QUESTION_IDS` bug in `intake-quality-check.ts` is deferred to Story 6.3.

## Story Completion

- **Created**: 2026-05-28
- **Status**: review
- **Epic**: 6 (Pipeline Intake Quality [AICC Workflow Family])
- **Next Story**: 6.3 (Intake Completion Criteria — AICC-003)

## Change Log

- 2026-05-28: Story created and implemented. Intake script redesigned from 6 to 8 questions. Tasks 1-5 completed. Status → review.
