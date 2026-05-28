# Story 6.3: Intake Completion Criteria (AICC-003)

Status: ready-for-dev

## Story

As a pipeline developer,
I want a clear definition of what "intake is complete" means,
So that the pipeline does not trigger prematurely on incomplete intake data.

## Requirements Sourced From

- AICC-003 Definition-of-Done Generator (`docs/agentic-workflows/ai-communication-clarity/aicc-003-v1-definition-of-done-generator.md`)
- AICC-003 Pre-Analysis (`_bmad-output/planning-artifacts/aicc-003-intake-definition-of-done-2026-05-28.md`) — comprehensive analysis produced during Story 6.1
- Redesigned Intake Script from Story 6.2 (`src/lib/assessment/intake-script.ts`)
- JLA-005 Gate Architecture Review (Finding 5: intake-quality gate should block pipeline)

## Acceptance Criteria

### AC1: AICC-003 definition of done formalised

**Given** the redesigned intake from Story 6.2 and the AICC-003 prompt
**When** the AICC-003 methodology is applied
**Then** compact and expanded definitions of done are produced, covering:
- **Compact DoD** (2-4 sentences): can be appended to the intake script header as a stopping rule
- **Expanded DoD**: Deliverable, Completeness Criteria, Quality Standard, Checkpoints, and Boundaries sections matching the AICC-003 output format

**And** the expanded DoD is saved to `docs/aicc-003-intake-definition-of-done-{date}.md`
**And** the compact DoD is embedded in the intake-script.ts file header (above the guardrails section)

### AC2: Critical bug fixed — intake-quality-check.ts question IDs

**Given** Story 6.2 redesigned the intake script from 6 to 8 questions with new IDs
**When** `intake-quality-check.ts` is updated
**Then** `BLOCKING_QUESTION_IDS` is replaced with an import from `$lib/assessment/intake-script`
**And** the hard-coded array `['business_overview', 'current_tools', 'pain_points', 'workflow_details', 'concrete_metrics']` is removed
**And** the actual blocking question IDs from the redesigned script are used: `['business_overview', 'role_and_team', 'operating_history', 'current_tools', 'pain_points', 'concrete_impact', 'budget']`
**And** `MIN_ANSWERS` is updated from 5 to 6 (must have at minimum 6 of 8 questions answered)

### AC3: Intake quality states replace binary sufficient/insufficient

**Given** the pre-analysis defines SUFFICIENT, ADEQUATE, INCOMPLETE, and INVALID states
**When** `checkIntakeSufficiency()` is updated
**Then** it returns a new field `quality: 'sufficient' | 'adequate' | 'incomplete' | 'invalid'` replacing the binary `sufficient` boolean
**And** state definitions are:
  - **SUFFICIENT**: All hard gates passed → Q1-Q7 (blocking) answered with substance, tool names detected, specific pain detected, budget signal detected
  - **ADEQUATE**: All hard gates passed EXCEPT budget signal missing → trigger with estimated budget
  - **INCOMPLETE**: Hard gates failed (transcript too short < 400 chars, or blocking questions incomplete, or < 6 of 8 answered) → DO NOT trigger pipeline
  - **INVALID**: No meaningful content (transcript < 100 chars, < 3 questions answered, customer clearly disengaged) → set to `failed`, do not retry

**And** `IntakeQualityResult` interface includes `quality` field with the enum type

### AC4: Blocking mode implemented in both webhook handlers

**Given** `INTAKE_QUALITY_BLOCK=true` environment variable is set
**When** the Retell webhook (`src/routes/api/retell-webhook/+server.ts`) receives a paid intake
**Then** if `checkIntakeSufficiency()` returns `quality: 'incomplete'` or `'invalid'`, the pipeline is NOT enqueued
**And** pipeline status is set to `human_assist` via `setPipelineStatus(sessionId, { status: 'human_assist', reason: qualityCheck.gaps.join('; ') })`
**And** the webhook returns a 200 OK response to Retell (do NOT throw — Retell retries 5xx)

**Given** `INTAKE_QUALITY_BLOCK=true` environment variable is set
**When** the Stripe webhook (`src/routes/api/stripe/webhook/+server.ts`) processes an Annie chat intake
**Then** if `checkIntakeSufficiency()` returns `quality: 'incomplete'` or `'invalid'`, the pipeline is NOT enqueued
**And** pipeline status is set to `human_assist`
**And** the webhook returns 200 OK to Stripe

**Given** `INTAKE_QUALITY_BLOCK` is NOT set or is `false`
**When** either webhook processes an intake
**Then** current shadow-mode behavior is preserved: log warnings via `console.warn()` but still enqueue the pipeline
**And** the TODO comments are removed from both webhook files

### AC5: ANNIE_GUARDRAILS wired into chat webhook system prompt

**Given** the redesigned intake script exports `ANNIE_GUARDRAILS` (10 guardrail rules)
**When** the Stripe webhook processes an Annie chat intake
**Then** `ANNIE_GUARDRAILS` is prepended to the system prompt before the intake script questions
**And** guardrails are joined with newlines and wrapped in a clear `SYSTEM CONSTRAINT:` prefix

### AC6: Heuristic estimators updated for new question structure

**Given** Story 6.2 changed the question structure (8 questions, new topics, split Q1)
**When** `estimateQuestionCount()` and `estimateBlockingCoverage()` are updated
**Then** the topic markers list matches the 8 actual question topics from `INTAKE_SCRIPT`
**And** `estimateBlockingCoverage()` uses 7 signal checks (one per blocking question) rather than 5
**And** the signal patterns match the actual question content (e.g., Q1b → role/team, Q1c → history/customers)

## Pre-conditions / Prerequisites

- AICC-003 methodology at `docs/agentic-workflows/ai-communication-clarity/aicc-003-v1-definition-of-done-generator.md`
- AICC-003 pre-analysis at `_bmad-output/planning-artifacts/aicc-003-intake-definition-of-done-2026-05-28.md`
- Redesigned intake script at `src/lib/assessment/intake-script.ts` (exports `ANNIE_GUARDRAILS` and `BLOCKING_QUESTION_IDS`)
- Intake quality check at `src/lib/server/assessment/intake-quality-check.ts` (to be fixed)
- Webhook handlers at `src/routes/api/retell-webhook/+server.ts` and `src/routes/api/stripe/webhook/+server.ts`
- JLA-005 review at `_bmad-output/planning-artifacts/jla-005-gate-architecture-review-2026-05-28.md`

## Tasks / Subtasks

### Task 1: Apply AICC-003 methodology and produce formal DoD

- [ ] Read the full AICC-003 prompt methodology at `docs/agentic-workflows/ai-communication-clarity/aicc-003-v1-definition-of-done-generator.md`
- [ ] Read the pre-analysis at `_bmad-output/planning-artifacts/aicc-003-intake-definition-of-done-2026-05-28.md`
- [ ] Answer the AICC-003 questions using the pre-analysis as input:
  - Who will use the output? → The webhook handlers and pipeline queue logic
  - What decision does this support? → "Should we spend ~$0.30-0.50 in LLM costs on this intake?"
  - Is this final or intermediate? → Intermediate — intake is complete enough to proceed to pipeline, not deliverable to end customer
  - What makes it useful vs just complete-looking? → Specific enough evidence that downstream gates can make real decisions, not guesswork
  - Natural checkpoints? → Two: (a) intake session ends, (b) payment completes. Check runs at both points.
  - What does it NOT continue into? → This does NOT define report quality, gate criteria, or pipeline output quality — it only answers "enough data to start?"
  - Format? → Both compact (2-4 sentences for code comments) and expanded (structured markdown for documentation)
- [ ] Produce compact DoD (2-4 sentences) — paste into `src/lib/assessment/intake-script.ts` header above the guardrails section
- [ ] Produce expanded DoD with labeled sections (Deliverable, Completeness Criteria, Quality Standard, Checkpoints, Boundaries) — save to `docs/aicc-003-intake-definition-of-done-{date}.md`
- [ ] Validate compact DoD against AICC-003 guardrails: practical language, matches task stakes, uses project language, no over-engineering

### Task 2: Fix intake-quality-check.ts BLOCKING_QUESTION_IDS

- [ ] Replace hard-coded `BLOCKING_QUESTION_IDS` array with an import from `$lib/assessment/intake-script`
- [ ] Update BLOCKING_QUESTION_IDS to match the 7 redesigned blocking question IDs
- [ ] Update `MIN_ANSWERS` from 5 to 6 (8 questions total, must have 6 for viable intake)
- [ ] Verify import works in both SvelteKit dev server (`npm run dev`) and build (`npm run build`)
- [ ] Verify TypeScript compilation: `npx tsc --noEmit` or `npm run check`

### Task 3: Add intake quality states to IntakeQualityResult

- [ ] Define `type IntakeQuality = 'sufficient' | 'adequate' | 'incomplete' | 'invalid'`
- [ ] Add `quality: IntakeQuality` field to `IntakeQualityResult` interface
- [ ] Replace `sufficient: boolean` with `quality` field (or keep both fields during transition)
- [ ] Update `checkIntakeSufficiency()` logic:
  - INVALID: transcript < 100 chars or answer count < 3
  - INCOMPLETE: transcript ≥ 100 chars and < 400, OR blocking answers < 7, OR answer count < 6
  - ADEQUATE: all hard gates passed EXCEPT budget signal missing
  - SUFFICIENT: all hard gates passed including budget signal
- [ ] Update `recommendation` text in the return value to reflect quality state

### Task 4: Implement blocking mode in webhook handlers

- [ ] Update `src/routes/api/retell-webhook/+server.ts`:
  - Import `INTAKE_QUALITY_BLOCK` check pattern (use `$env/dynamic/private` or equivalent)
  - After `checkIntakeSufficiency()`, if `quality` is `incomplete` or `invalid` AND `INTAKE_QUALITY_BLOCK === 'true'`:
    - Log warning with full details
    - Call `setPipelineStatus(sessionId, { status: 'human_assist', error: reason })`
    - Return 200 OK (do NOT enqueue)
  - If `INTAKE_QUALITY_BLOCK` is not `true`: preserve shadow-mode (log + enqueue)
- [ ] Update `src/routes/api/stripe/webhook/+server.ts` (both voice-agent path and Annie chat path):
  - Same logic as retell-webhook for the voice-agent path
  - Same logic for Annie chat path (already has structured answers — more accurate check)
- [ ] Remove TODO comments from both webhook files
- [ ] Add structured logging to differentiate: `quality` state, which webhook path, blocking/shadow mode

### Task 5: Wire ANNIE_GUARDRAILS into chat webhook system prompt

- [ ] Import `ANNIE_GUARDRAILS` from `$lib/assessment/intake-script` in the Stripe webhook
- [ ] Locate the system prompt construction for Annie chat (likely in the `sendChatMessage` or equivalent function call)
- [ ] Prepend guardrails as: `SYSTEM CONSTRAINT:\n${ANNIE_GUARDRAILS.map(g => `- ${g}`).join('\n')}`
- [ ] Verify guardrails appear in the system context before the intake script questions
- [ ] Verify guardrails are not injected into voice (Retell) flow — voice script already has its own guardrails in `docs/voice-agent-script.md`

### Task 6: Update heuristic estimators for new question structure

- [ ] Update `estimateQuestionCount()` topic markers list to match the 8 actual topics from `INTAKE_SCRIPT`:
  - business_overview → 'business overview'
  - role_and_team → 'role'
  - operating_history → 'operating', 'customers'
  - current_tools → 'current tools'
  - pain_points → 'pain points'
  - concrete_impact → 'impact', 'numbers'
  - budget → 'budget'
  - timeline → 'timeline'
  - open_close → 'anything else', 'wrap up'
  - Remove old markers: 'workflow', 'metrics', 'customer channels', 'process consistency', 'ai readiness'
  - Keep 'business overview', 'current tools', 'pain points', 'budget', 'timeline' as they match new topics
- [ ] Update `estimateBlockingCoverage()` for 7 blocking questions:
  1. business_overview → industry/sector mentions
  2. role_and_team → role + team size mentions
  3. operating_history → history + acquisition channel mentions
  4. current_tools → known tool names
  5. pain_points → specific pain language
  6. concrete_impact → quantified impact mentions
  7. budget → budget signal patterns
- [ ] Verify each signal check aligns with the question's actual content and `qualityBar` definition

### Task 7: Validation — integration testing

- [ ] Test with sample intake transcripts:
  - Marketing Agency intake (detailed Q1-Q8, all signals present) → expect SUFFICIENT
  - Lorie Test Business intake (vague "efficient operations" answers) → expect ADEQUATE or INCOMPLETE
  - Disconnected-at-Q3 intake (3 short answers) → expect INCOMPLETE
  - Garbled/empty transcript → expect INVALID
- [ ] Test `checkIntakeSufficiency()` in both modes (shadow and blocking)
- [ ] Verify `npm run check` passes (TypeScript + Svelte validation)
- [ ] Verify `npm run build` succeeds (Cloudflare Pages adapter compatibility)

## File List

- `src/lib/assessment/intake-script.ts` (MODIFY — embed compact DoD in header comment; reference source for BLOCKING_QUESTION_IDS import)
- `src/lib/server/assessment/intake-quality-check.ts` (MODIFY — fix BLOCKING_QUESTION_IDS, add quality states, update estimators)
- `src/routes/api/retell-webhook/+server.ts` (MODIFY — implement blocking mode, remove TODO)
- `src/routes/api/stripe/webhook/+server.ts` (MODIFY — implement blocking mode for both voice and chat paths, wire ANNIE_GUARDRAILS, remove TODO)
- `docs/aicc-003-intake-definition-of-done-{date}.md` (NEW — expanded DoD in AICC-003 output format)
- `_bmad-output/planning-artifacts/aicc-003-intake-definition-of-done-2026-05-28.md` (REFERENCE — pre-analysis from Story 6.1)
- `docs/agentic-workflows/ai-communication-clarity/aicc-003-v1-definition-of-done-generator.md` (REFERENCE — methodology prompt)

## Dev Agent Record

### Context — What This Story Is and Isn't

**This is a code + documentation story.** The deliverables are:
1. Code changes: fix the broken `intake-quality-check.ts`, implement blocking mode in both webhooks, wire ANNIE_GUARDRAILS into chat
2. Documentation: formal AICC-003 output (compact + expanded DoD)

The AICC-003 pre-analysis at `_bmad-output/planning-artifacts/aicc-003-intake-definition-of-done-2026-05-28.md` is the primary spec. It was produced during Story 6.1 and defines ALL the intake quality states, thresholds, edge cases, and transition plan. This story IMPLEMENTS that spec — do not design new thresholds from scratch.

**This story DOES NOT:**
- Change the intake script questions (done in 6.2)
- Change the pipeline stages or gate criteria
- Add new API endpoints or routes
- Touch the queue consumer worker (queue producer only)
- Implement operator notification system (future story)

### Architecture Compliance — Pipeline Domain

This story operates in the **pipeline intake quality** domain. The code paths are:

```
Voice intake:
  Retell call_analyzed webhook → src/routes/api/retell-webhook/+server.ts
    → checkIntakeSufficiency() [THIS STORY: make blocking]
    → enqueueReportJob(queue, job) [SKIP IF INCOMPLETE/INVALID]

Voice intake (Stripe catch-up):
  Stripe checkout.session.completed webhook → src/routes/api/stripe/webhook/+server.ts (voice-agent path)
    → checkIntakeSufficiency() [THIS STORY: make blocking]
    → enqueueReportJob(queue, job) [SKIP IF INCOMPLETE/INVALID]

Chat intake:
  Stripe checkout.session.completed webhook → src/routes/api/stripe/webhook/+server.ts (Annie chat path)
    → checkIntakeSufficiency(transcript, structuredAnswers) [THIS STORY: make blocking]
    → enqueueReportJob(queue, job) [SKIP IF INCOMPLETE/INVALID]
```

**Key architectural boundary**: `intake-quality-check.ts` is a server-only module that runs at webhook time, BEFORE the pipeline queue producer. It is NOT a pipeline stage — it's a pre-flight check. It must never call LLMs, databases, or external services. It is purely structural analysis of the intake transcript.

**Environment variable**: `INTAKE_QUALITY_BLOCK` controls the mode. Set to `true` to activate blocking behavior. Absent or any value other than `true` = shadow mode (log warnings, enqueue anyway).

### Intake Quality State Machine

```
                    ┌──────────────┐
                    │  Webhook     │
                    │  received    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ checkIntake  │
                    │ Sufficiency()│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐─────────────┐
              │            │            │             │
         ┌────▼────┐  ┌───▼───┐  ┌─────▼────┐  ┌─────▼────┐
         │SUFFICIENT│  │ADEQUATE│  │INCOMPLETE│  │ INVALID  │
         │ All hard │  │ No     │  │ Hard     │  │ No       │
         │ gates    │  │ budget │  │ gates    │  │ content  │
         │ passed   │  │ signal │  │ failed   │  │ at all   │
         └────┬─────┘  └───┬───┘  └─────┬────┘  └─────┬────┘
              │            │            │             │
              │            │       ┌────▼────┐   ┌───▼────┐
              ▼            ▼       │BLOCKING │   │BLOCKING│
         ┌────────┐  ┌────────┐   │MODE ONLY│   │MODE ONLY│
         │Enqueue │  │Enqueue │   └────┬────┘   └───┬────┘
         │pipeline│  │pipeline│        │             │
         └────────┘  │(budget │   ┌────▼────┐   ┌───▼────┐
                     │est.)   │   │DO NOT   │   │Set     │
                     └────────┘   │enqueue  │   │failed  │
                                  │Set to   │   │status  │
                                  │human_   │   │Do NOT  │
                                  │assist   │   │retry   │
                                  └─────────┘   └────────┘
```

**Important**: `human_assist` status is already handled by `setPipelineStatus()` in the pipeline store. The UI at `src/routes/operator/assessments/+page.svelte` already handles the `human_assist` status. No UI changes needed in this story.

### Previous Story Learnings

**From Story 6.1 (Intake Quality Audit):**
- Critical bug found: `intake-quality-check.ts` BLOCKING_QUESTION_IDS references `workflow_details` and `concrete_metrics` — IDs that never existed in the actual intake script. Bug confirmed by examining v1 and v2 intake scripts. This story fixes it.
- Audit found intake quality check is shadow-only. The pre-analysis at `aicc-003-intake-definition-of-done-2026-05-28.md` produced a 4-state quality model. This story implements that model.
- The AICC methodology is designed for conversational application (ask → answer → produce). The pre-analysis already answered the AICC-003 questions. This story formalizes the output into compact + expanded format.

**From Story 6.2 (Intake Question Redesign):**
- Intake script redesigned from 6 to 8 questions. New IDs: `business_overview`, `role_and_team`, `operating_history`, `current_tools`, `pain_points`, `concrete_impact`, `budget`, `timeline`, `open_close`
- `BLOCKING_QUESTION_IDS` exported from `intake-script.ts` with 7 IDs (Q1-Q6, all except `ai_readiness` and `timeline` and `open_close`)
- `ANNIE_GUARDRAILS` exported as structured array with 10 rules
- Story 6.2 explicitly deferred the `intake-quality-check.ts` fix to this story

**From Epics 1-5 (Staff Portal):**
- `setPipelineStatus()` is the canonical pipeline status update function — already handles `human_assist` status
- Pattern: thin webhook handlers that delegate to server-side services
- Env var gating pattern from Staff Portal stories: `INTAKE_QUALITY_BLOCK` env var

### Git Intelligence

Recent commits show this is active development on Epic 6:
- `cc20f82` fix(story-6-2): map Annie chat question keys to questionId for intake quality check
- `8ddbd73` feat(story-6-2): AICC-001 Intake Question Redesign
- `92b5d45` merge: story 6-1 AICC-002 Intake Quality Audit
- `ee89ef7` chore: phase-1 pipeline hardening — gates, diagnostics, evaluation corpus, agentic workflows
- `5b29565` feat(story-6-1): AICC-002 Intake Quality Audit — formal gap report

Note `cc20f82` — the chat webhook question key mapping fix. This is relevant: the Stripe webhook maps Annie chat question keys (which are actual question text strings) to `questionId` format. The `checkIntakeSufficiency()` function receives these structured answers. The mapping was added as a hotfix during Story 6.2.

### Latest Technical Information

- **SvelteKit 2 / Svelte 5 / Cloudflare Pages** — same stack as all Epics
- **Environment variables**: `$env/dynamic/private` for server-side env vars in SvelteKit
- **Pipeline Queue**: Cloudflare Queue producer API — `enqueueReportJob(queue, job)` returns `{ queued: boolean, inline: boolean }`
- **Pipeline Status**: `setPipelineStatus(sessionId, { status, error })` from `$lib/server/assessment/pipeline-store`
- **Retell webhook**: Must return 200 OK even on quality rejection — Retell retries 5xx responses
- **Stripe webhook**: Must return 200 OK even on quality rejection — Stripe retries non-2xx responses
- **No new dependencies** — all functionality uses existing modules

### Testing Requirements

- [ ] Unit test: `checkIntakeSufficiency()` returns correct `quality` for all 4 states with known test transcripts
- [ ] Unit test: `checkIntakeSufficiency()` with structured answers (Annie chat path) — verify question ID matching works
- [ ] Unit test: `checkIntakeSufficiency()` with transcript-only (voice path) — verify heuristic estimators work for new question structure
- [ ] Unit test: `estimateQuestionCount()` matches 8 new question topics
- [ ] Unit test: `estimateBlockingCoverage()` returns 0-7 for various transcripts
- [ ] Integration test: Mock webhook with INTAKE_QUALITY_BLOCK=true — verify pipeline not enqueued when incomplete
- [ ] Integration test: Mock webhook with INTAKE_QUALITY_BLOCK=true — verify pipeline enqueued when sufficient
- [ ] Integration test: Mock webhook without INTAKE_QUALITY_BLOCK — verify shadow mode behavior (always enqueues, logs warning)
- [ ] Integration test: Verify ANNIE_GUARDRAILS appears in chat system prompt
- [ ] Integration test: Verify ANNIE_GUARDRAILS does NOT appear in voice (Retell) flow

### Project Context Reference

- **Project**: agenticai-net-au — AI Business Assessment platform
- **Pipeline cost**: Each pipeline run costs ~$0.30-0.50 in LLM costs (GPT-5.5 gates + Kimi/Ollama Cloud analysis). Blocking insufficient intakes saves real money.
- **Customer price**: $1,200 AUD per assessment. Low-quality reports from incomplete intakes = poor customer experience at premium price.
- **Intake flow**: Business owner calls Annie (Retell voice) OR chats with Annie (web) → 8-question business context intake → Stripe payment → pipeline quality check → pipeline trigger → tool research → evidence extraction → LLM analysis → gate evaluation → report generation → email delivery
- **Quality check location**: `src/lib/server/assessment/intake-quality-check.ts` (server-only, no API calls)
- **Webhook entry points**: `src/routes/api/retell-webhook/+server.ts` (voice), `src/routes/api/stripe/webhook/+server.ts` (voice catch-up + chat)

## Story Completion

- **Created**: 2026-05-28
- **Status**: ready-for-dev
- **Epic**: 6 (Pipeline Intake Quality [AICC Workflow Family])
- **Prerequisite Stories**: 6.1 (Intake Quality Audit — AICC-002), 6.2 (Intake Question Redesign — AICC-001)
- **Next Stories**: Epic 7 (Pipeline Gate Hardening — JLA Workflow Family)
- **Completion Note**: Comprehensive story context engine analysis completed — dev agent has everything needed for implementation.

## Change Log

- 2026-05-28: Story created (ready-for-dev)
