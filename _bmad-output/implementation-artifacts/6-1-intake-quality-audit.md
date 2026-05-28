# Story 6.1: Intake Quality Audit (AICC-002)

Status: ready-for-dev

## Story

As a pipeline developer,
I want to audit Annie's 10 intake questions against the AICC six-field framework,
So that gaps and ambiguities in intake are identified before they degrade report quality.

## Requirements Sourced From

- AICC-002 Vague Ask Auditor (`docs/agentic-workflows/ai-communication-clarity/aicc-002-v1-vague-ask-auditor.md`)
- Phase 1 diagnostics (preliminary audit findings at `_bmad-output/planning-artifacts/phase-1-diagnostics-2026-05-28.md` §Task 2)
- JLA-005 Gate Architecture Review (identified intake-quality as a needed separate gate)

## Acceptance Criteria

### AC1: Six-field gap report produced

**Given** the current 10-question intake script (`src/lib/assessment/intake-script.ts`) and the voice-adapted script (`docs/voice-agent-script.md`)
**When** the AICC-002 methodology is applied systematically against each question
**Then** the audit produces a structured gap report with three sections:
- **What's Here**: Fields adequately covered, with specific evidence from the intake script (e.g., the gate criteria cross-reference table in the intake header already satisfies Sources)
- **What's Missing**: Fields absent or too vague to act on, each with: which downstream stage needs it, what risk of missing it creates, and what intake change would capture it
- **What's Ambiguous**: Specific phrases, question framings, or concepts that could be interpreted multiple ways, each with: the alternative interpretations, which downstream stage misinterprets it, and the consequence of misinterpretation

**And** the report is saved as `docs/aicc-002-intake-quality-audit-{date}.md` with the full audit findings.

### AC2: Gap-to-pipeline traceability

**Given** the audit identifies a field that intake never captures (e.g., constraints)
**When** the gap is documented
**Then** it includes:
- Which downstream pipeline stage needs that field (tool research, evidence extraction, LLM analysis, specific gate criterion)
- What the risk of missing it is (e.g., "without constraints, Annie could probe regulated topics and produce non-compliant transcripts")
- What intake change would capture it (e.g., "add constraint guardrails to voice-agent-script.md §Guardrails")

### AC3: Question-level assessment

**Given** the 10 intake questions (Q1 business_overview through Q10 timeline)
**When** each question is assessed against the six AICC fields
**Then** every question receives a per-field coverage assessment (covered / partial / missing)
**And** questions that front-load BLOCKING gate criteria (Q1-Q5) are flagged if their phrasing could produce ambiguous evidence for those blocking criteria
**And** the audit identifies whether any BLOCKING gate criterion has zero intake questions mapping to it (coverage gap) or has questions whose phrasing is too ambiguous to reliably produce usable evidence (quality gap)

### AC4: Voice-specific findings

**Given** the intake is delivered through both Retell voice (`docs/voice-agent-script.md`) and Annie chat (`src/lib/assessment/intake-script.ts`)
**When** the AICC-002 audit is run
**Then** the report separately assesses the voice-adapted script for:
- Transcription risk: which questions contain tool names, numbers, or proper nouns likely to be mistranscribed (e.g., "HubSpot" → "hub spot", "Xero" → "zero")
- Voice-specific ambiguity: which text-optimized phrasings break down in spoken conversation (e.g., long compound questions that a caller would lose track of)
- Missing voice guardrails: whether the voice script adds or removes constraints relative to the text script

### AC5: Cross-reference with existing quality infrastructure

**Given** `src/lib/server/assessment/intake-quality-check.ts` already implements structural quality checks (transcript length, question count, keyword detection)
**When** the AICC-002 audit identifies quality gaps
**Then** each quality gap is assessed against the existing quality check to determine:
- Already caught by `checkIntakeSufficiency()` → note as "gap detected, operational guardrail exists"
- Not caught by `checkIntakeSufficiency()` → note as "gap undetected at runtime — needs quality check extension"
- Partially caught → note as "gap partially detected — current threshold/pattern insufficient, needs tuning"

## Pre-conditions / Prerequisites

- Intake script exists at `src/lib/assessment/intake-script.ts` (10 questions with gate criteria mapping)
- Voice agent script exists at `docs/voice-agent-script.md`
- AICC-002 methodology defined at `docs/agentic-workflows/ai-communication-clarity/aicc-002-v1-vague-ask-auditor.md`
- Phase 1 diagnostics available at `_bmad-output/planning-artifacts/phase-1-diagnostics-2026-05-28.md`
- Intake quality check implemented at `src/lib/server/assessment/intake-quality-check.ts`
- JLA-005 review available at `_bmad-output/planning-artifacts/jla-005-gate-architecture-review-2026-05-28.md` (recommends separate intake-quality gate)

## Tasks / Subtasks

### Task 1: Deep-read the AICC-002 methodology

- Read the full AICC-002 prompt at `docs/agentic-workflows/ai-communication-clarity/aicc-002-v1-vague-ask-auditor.md`
- Understand the six fields: goal, context, sources, constraints, quality bar, definition of done
- Understand the audit structure: What's Here, What's Missing, What's Ambiguous
- Note: the AICC-002 prompt is a conversation-driven methodology; for this story, apply it systematically rather than interactively

### Task 2: Apply AICC-002 to the text intake script

- Load `src/lib/assessment/intake-script.ts` — read ALL 10 questions, their followUps, feedsGateCriteria, and the header cross-reference table
- For each of the six AICC fields, assess coverage across the 10 questions:
  - **Goal**: Is the outcome named? Does the intake know what the pipeline needs? (Assessment: Likely ADEQUATE — the header cross-reference table explicitly connects each question to gate criteria)
  - **Context**: Would a smart person joining this work cold understand the situation? Is the "why now" clear? (Assessment: Likely ADEQUATE — extensive header documentation)
  - **Sources**: Are materials named? Is there a source hierarchy? (Assessment: Likely ADEQUATE — `feedsGateCriteria` provides explicit traceability)
  - **Constraints**: Are boundaries stated? Could the recipient make a technically correct but practically wrong choice? (Likely GAP — no constraints on what Annie should NOT ask)
  - **Quality bar**: Does the request define what "good" means? (Likely GAP — no qualitative standard for what constitutes a "good enough" answer)
  - **Definition of done**: Is there a stopping point? (Likely GAP — no explicit completion criteria)
- For each question individually, note ambiguities in wording, framing, or assumptions
- Document everything in the structured gap report

### Task 3: Apply AICC-002 to the voice script

- Load `docs/voice-agent-script.md`
- Compare against the text script — identify additions, omissions, and adaptations
- Assess voice-specific risks:
  - Which questions contain numbers that could be mistranscribed?
  - Which questions contain tool names or proper nouns at risk of homophone errors?
  - Are compound questions (text-optimized) broken into simpler spoken parts?
  - Does the voice script add or remove guardrails?
- Document voice-specific findings in a dedicated section of the gap report

### Task 4: Cross-reference findings with existing quality infrastructure

- Load `src/lib/server/assessment/intake-quality-check.ts`
- For each gap identified in the audit, determine:
  - Is this gap caught by the existing `checkIntakeSufficiency()` function?
  - If yes: which specific check covers it? Is the threshold adequate?
  - If no: what additional check would catch it?
- Document cross-references in the gap report

### Task 5: Gap-to-downstream-pipeline traceability matrix

- Produce a traceability matrix showing:
  - Each gap → which pipeline stage(s) affected → specific gate criterion impacted → risk if unaddressed
- Use the gate criteria cross-reference from the intake script header as the source of truth
- Flag gaps that affect BLOCKING criteria (QW-A1, QW-E1, QW-E2, QW-E3, MP-A1, MP-E1, RR-A0, RR-TC1, RR-TC2, RR-TC3) at higher severity

### Task 6: Write and save the formal gap report

- Write the complete audit to `docs/aicc-002-intake-quality-audit-2026-05-28.md`
- Follow the AICC-002 output structure: diagnostic table, what's likely to go wrong, targeted questions for critical gaps, and a rewritten/improved version
- Include question-level assessment table
- Save the file

### Task 7: Validation — checklist completeness

- Verify all 10 questions were assessed
- Verify all six AICC fields were assessed
- Verify every gap has: downstream stage, risk, fix suggestion
- Verify voice-specific findings are included
- Verify cross-reference with intake-quality-check.ts is complete

## File List

- `src/lib/assessment/intake-script.ts` (READ — the audit target, 10 intake questions with gate criteria mapping)
- `docs/voice-agent-script.md` (READ — voice-adapted script for Retell)
- `docs/agentic-workflows/ai-communication-clarity/aicc-002-v1-vague-ask-auditor.md` (READ — the AICC-002 methodology)
- `src/lib/server/assessment/intake-quality-check.ts` (READ — existing quality check for cross-reference)
- `_bmad-output/planning-artifacts/phase-1-diagnostics-2026-05-28.md` (READ — preliminary audit findings to incorporate/deepen)
- `_bmad-output/planning-artifacts/jla-005-gate-architecture-review-2026-05-28.md` (READ — recommends separate intake-quality gate)
- `docs/aicc-002-intake-quality-audit-2026-05-28.md` (NEW — the formal gap report deliverable)

## Dev Agent Record

### Context — What This Story Is and Isn't

**This is a documentation/analysis story.** The deliverable is a written gap report, not running code. The gap report feeds directly into Stories 6.2 (Intake Question Redesign using AICC-001) and 6.3 (Intake Completion Criteria using AICC-003). Do NOT modify intake questions or quality check code in this story — those are downstream stories.

**The Phase 1 diagnostics already did a preliminary high-level audit** (phase-1-diagnostics.md §Task 2). That audit identified:
- **Adequate**: Goal, Context, Sources
- **Missing**: Constraints, Quality bar, Definition of done, Conversational adaptation
- **Ambiguous**: Budget framing (Q8), "roughly" qualifiers (Q4-Q5), timeline framing (Q10)

This story **deepens and formalizes** that preliminary audit into a question-by-question, field-by-field gap report. Do not treat the phase-1 diagnostics as the finished audit — it's a starting point.

### Architecture Compliance — Pipeline Context

This story operates in the **pipeline domain**, not the Staff Portal domain. The code paths are:

```
Intake (Retell voice webhook OR Annie chat Stripe webhook)
  → src/lib/server/assessment/intake-store-r2.ts (save raw intake)
  → src/lib/server/assessment/intake-quality-check.ts (checkIntakeSufficiency)
  → src/lib/server/assessment/queue.ts (enqueueReportJob)
  → [pipeline stages: tool-lookup → evidence-map → gate → llm-analysis → gate → save → gate → email]
```

**Key architectural boundary**: The intake script lives in `src/lib/assessment/intake-script.ts` (shared, client-safe). The quality check lives in `src/lib/server/assessment/intake-quality-check.ts` (server-only). The voice script lives in `docs/voice-agent-script.md` (docs). The AICC methodology prompts live in `docs/agentic-workflows/ai-communication-clarity/`.

**No code changes in this story.** The deliverable is purely a documentation artifact. Code changes happen in Stories 6.2 and 6.3.

### Six-Field Framework Reference

The AICC framework evaluates any delegation/request against six fields:

| Field | What it means | Intake equivalent |
|-------|---------------|-------------------|
| **Goal** | Is the outcome named, not just the activity? | Does each question know why it's asked — what pipeline stage consumes the answer? |
| **Context** | Would a smart person joining cold understand the situation? | Does a new developer reading the intake script understand the pipeline dependency chain? |
| **Sources** | Are materials named? Is there a source hierarchy? | Are the gate criteria that consume each answer explicitly named and traceable? |
| **Constraints** | Are boundaries stated? Could the recipient make a technically correct but practically wrong choice? | Are there guardrails on what Annie should NOT ask? (regulated topics, sensitive data, competitor names) |
| **Quality bar** | Does the request define what "good" means? | Is there a standard for what makes an answer "specific enough" vs "needs re-probing"? |
| **Definition of done** | Is there a stopping point? Are checkpoints named? | When is intake complete enough to trigger the pipeline? What must be present? |

### Intake Question-to-Gate Mapping (from intake-script.ts header)

The intake script header already contains a comprehensive cross-reference table. Key BLOCKING criteria and their intake questions:

| Gate Criterion | Severity | Intake Questions |
|----------------|----------|------------------|
| QW-A1 Stated need | ● BLOCKING | Q1, Q2, Q3 |
| QW-E1 Traceability | ● BLOCKING | Q3, Q4, Q5 |
| QW-E2 Tool grounding | ● BLOCKING | Q2 |
| QW-E3 Number grounding | ● BLOCKING | Q4, Q5 |
| MP-A1 Problem existence | ● BLOCKING | Q1, Q3 |
| MP-E1 Budget alignment | ● BLOCKING | Q8 |
| RR-A0 Evidence traceability | ● BLOCKING | ALL questions |
| RR-TC1 Tool citation | ● BLOCKING | Q2 |
| RR-TC2 Description accuracy | ● BLOCKING | Q2 |
| RR-TC3 Pricing accuracy | ● BLOCKING | Q2 |

Questions Q1-Q5 are front-loaded with BLOCKING criteria. Questions Q6-Q10 primarily feed TASTE criteria. The audit must pay special attention to Q1-Q5 since gaps there directly cause gate failures.

### JLA-005 Finding — Intake-Quality Gate Needed

The JLA-005 Gate Architecture Review (2026-05-28) identified that:
- The quick-wins-verification gate is mispositioned (runs before LLM analysis but evaluates Quick Wins that don't exist yet)
- A separate **intake-quality gate** should exist before LLM analysis to verify minimum evidence density
- The existing `intake-quality-check.ts` is a lightweight structural check, not a gate — it's shadow-mode only

This directly relates to the AICC-002 audit: the audit should identify which intake quality signals would feed an intake-quality gate. The gap report should note where the existing `checkIntakeSufficiency()` checks align with AICC quality bar requirements and where they don't.

### Previous Story Learnings (Cross-Epic)

This is the first story in Epic 6 and the first story in the pipeline intake domain. There are no previous stories in this epic. However, relevant learnings from previous epics:

**From Epic 5-5 (Commercial Follow-up Requirement and Audit):**
- Audit event pattern: create server-side service that writes to `staff_action_audit_events` → this isn't directly applicable but establishes the project's approach to audit trails
- The pattern of "validate before persist, return structured errors" is established — the AICC-003 story (6.3) will need to follow this pattern when making intake completion a blocking gate

**From Epic 4-5 (Follow-up Audit Receipts and Failure States):**
- Dev Agent Record pattern established: previous story learnings, architecture compliance, and context sections in story files
- The `StaffActionReceiptDto` pattern from Epic 1 provides the template for structured responses — relevant when 6.3 implements the intake quality check as a blocking gate
- Stale-state guard pattern: `read current status before applying action, return staleState error` — relevant when intake quality becomes blocking

**From Epics 1-5 (Staff Portal):**
- All Staff Portal stories used the pattern: server-side domain services → thin API routes → typed DTOs → Svelte components consuming view models
- The pipeline intake domain has a different architecture: intake script (shared) → webhook handlers (thin) → pipeline worker (async queue consumer)
- The pipeline has NO UI components in scope for this epic — it's pure infrastructure

### Git Intelligence

Recent commit history (last 10 commits) shows work on the public-facing site (offer section layout, heading system, copy changes) — not the pipeline or intake code. The pipeline intake code at `src/lib/server/assessment/` and `src/lib/assessment/` has been stable during this period.

### Latest Technical Information

- **AICC Methodology**: Defined in `docs/agentic-workflows/ai-communication-clarity/`. Version v1. No API dependency — these are prompt templates for LLM-driven analysis.
- **Intake Quality Check**: Already implemented as `checkIntakeSufficiency()` in `src/lib/server/assessment/intake-quality-check.ts`. Currently shadow-mode (logs warnings, pipeline still triggers). Blocking mode activated by `INTAKE_QUALITY_BLOCK=true` env var.
- **Voice Integration**: Retell voice agent follows `docs/voice-agent-script.md`, adapted from `intake-script.ts`. Voice webhook at `src/routes/api/retell-webhook/+server.ts`. Chat webhook at `src/routes/api/stripe/webhook/+server.ts`.
- **Pipeline Tech Stack** (from architecture): SvelteKit 2 / Svelte 5 / TypeScript / Cloudflare Pages / D1 / R2 / Queue / Clerk. Perplexity API for tool research. Kimi/Ollama Cloud for LLM analysis. GPT-5.5 for gate evaluation.
- **No new libraries or frameworks needed** for this story — it's pure documentation/analysis.

### Testing Requirements

**No code tests needed** — this is a documentation deliverable. However, the gap report itself should be validated:

- [ ] All 10 intake questions assessed
- [ ] All six AICC fields assessed for each question (36 total field-question assessments minimum)
- [ ] Every gap has: downstream stage, risk description, and fix suggestion
- [ ] Voice-specific findings section included
- [ ] Cross-reference with `intake-quality-check.ts` complete
- [ ] Gap-to-pipeline traceability matrix included
- [ ] BLOCKING criteria gaps flagged at higher severity than TASTE criteria gaps
- [ ] Report saved to `docs/aicc-002-intake-quality-audit-2026-05-28.md`

### Project Context Reference

- **Project**: agenticai-net-au — AI Business Assessment platform
- **Intake flow**: Business owner calls Annie (Retell voice) OR chats with Annie (web) → 10-question business context intake → Stripe payment ($1,200 AUD) → pipeline triggers → tool research → evidence extraction → LLM analysis → gate evaluation → report generation → email delivery
- **This epic's scope**: Audit and redesign the intake phase only. The downstream pipeline code (tool-lookup, evidence-map, llm-analysis, gates, report generation) is NOT changed by this epic.
- **Intake script location**: `src/lib/assessment/intake-script.ts` (shared, used by both chat API and UI progress tracking)
- **Voice script**: `docs/voice-agent-script.md` (adapted from intake script for Retell voice agent)
- **Quality check**: `src/lib/server/assessment/intake-quality-check.ts` (server-side, shadow mode)

## Story Completion

- **Created**: 2026-05-28
- **Status**: ready-for-dev
- **Epic**: 6 (Pipeline Intake Quality [AICC Workflow Family])
- **Next Stories**: 6.2 (Intake Question Redesign — AICC-001), 6.3 (Intake Completion Criteria — AICC-003)
- **Completion Note**: Ultimate context engine analysis completed — comprehensive developer guide created. Phase 1 diagnostics findings incorporated as starting point. JLA-005 intake-quality gate recommendation cross-referenced.
