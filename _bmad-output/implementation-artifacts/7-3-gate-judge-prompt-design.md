# Story 7.3: Gate Judge Prompt Design (JLA-002 + JLA-003)

Status: ready-for-dev

## Story

As a pipeline developer,
I want production-ready judge prompts for each validated gate,
So that gate decisions use structured criteria rather than implicit quality judgments.

## Acceptance Criteria

**Given** the validated gate architecture from Story 7.2
**When** JLA-002 is applied to design judge criteria for each gate
**Then** each gate has explicit criteria across authorization, evidence, exposure/risk, and policy dimensions
**And** criteria include what the gate must evaluate, what it can ignore, and anti-gaming protections.

**Given** the gate criteria are defined
**When** JLA-003 is applied to produce judge prompts
**Then** each prompt uses structured outcomes: ALLOW, BLOCK, REVISE, ESCALATE
**And** prompts include: role, context window, decision criteria, structured output format, anti-gaming safeguards, and examples of each outcome type.

**Given** a judge prompt is tested against known failure cases
**When** the prompt is evaluated
**Then** it correctly BLOCKs reports that should be blocked and ALLOWs reports that should pass
**And** false-allow and false-block rates are measurable through the evaluation suite in Story 7.4.

## Tasks/Subtasks

- [ ] Read JLA-002 methodology at `docs/agentic-workflows/judge-layer-architecture/jla-002-v1-judge-criteria-action-proposal-designer.md`
- [ ] Read JLA-003 methodology at `docs/agentic-workflows/judge-layer-architecture/jla-003-v1-judge-prompt-writer.md`
- [ ] Read JLA-005 review recommendations: P2 (deterministic split), P3 (raw transcript pass-through), P4 (evidence pre-check)
- [ ] Read current gate definitions: `src/lib/server/assessment/gate/definitions.ts`
- [ ] Apply JLA-002: For each of the 3 gates, design explicit criteria across all 4 dimensions (authorization, evidence, exposure/risk, policy)
- [ ] Apply JLA-003: Validate each gate prompt against structured outcome format (ALLOW, BLOCK, REVISE, ESCALATE)
- [ ] Identify which checks should be deterministic (per JLA-005 P2): tool citation, orphan claims, AU availability, budget band, structural completeness, hourly rate
- [ ] Document anti-gaming protections per gate (what the actor might do to pass)
- [ ] Produce the validated Gate Judge Specification document including all 3 prompts with annotated criteria
- [ ] File at `_bmad-output/implementation-artifacts/jla-002-003-gate-judge-spec.md`

## Dev Notes

### Context from Prior Work

The 3 gate prompts already exist in `src/lib/server/assessment/gate/definitions.ts` (425 lines). They were built during Phase 1 and refined during the JLA-005 P0/P1/P3/P4 fixes. They already include:

- Structured output format (verdict, action, confidence, reasoning, findings)
- Taste dimensions T1-T7 for report-review
- Evidence criteria (QW-E1-3, RR-A0, A0b, etc.)
- Safety criteria (QW-R1/R2, RR-S1-3)
- Tool credibility criteria (RR-TC1-3)
- Tone/quality criteria (RR-Q1-3, T1-T7)

**This story does NOT rewrite from scratch** — it validates the existing prompts against JLA-002/JLA-003 methodology and annotates them with explicit criteria dimensions.

### JLA-005 Impact on This Story

| JLA-005 Rec | Impact on 7.3 |
|-------------|---------------|
| P2: Split 7 deterministic checks | Extract these from LLM prompt into `gate/deterministic-checks.ts` |
| P3: Pass raw transcript | Add `{{transcript}}` placeholder to all gate prompts |
| P4: Evidence pre-check | Not for 7.3 — handled in pipeline reorder (separate) |

### Current Gate Prompt Structure (definitions.ts)

```
quick-wins-verification:
  role: "Quality assurance analyst..."
  criteria: QW-E1 (transcript evidence), QW-E2 (tool citation), QW-E3 (quantitative anchoring)
  authorization/regulatory: QW-R1/R2
  output: verdict, action (pass/block/escalate), confidence, reasoning, findings[]

major-project-verification:
  role: "Budget and ROI analyst..."
  criteria: MP-E1 (budget alignment), MP-A1/A2 (applicability)
  output: same structure

report-review:
  role: "Senior assessment reviewer..."
  criteria: RR-A0 (evidence traceability), RR-A0b (gap handling)
             RR-T1-7 (taste: specificity, credibility, structure, financial honesty, tone, safety)
             RR-S1-3 (safety: regulated advice, over-promise, PII)
             RR-TC1-3 (tool credibility: futurepedia, pricing, team fit)
             RR-Q1-3 (quality: executive summary, pain points, quick wins)
  output: same structure
```

## Dev Agent Record

### Implementation Plan

Read methodologies → audit existing prompts → apply JLA-002 criteria framework → annotate each gate with dimension coverage → produce specification document.

### File List

- `_bmad-output/implementation-artifacts/jla-002-003-gate-judge-spec.md` (NEW)

### Completion Notes

### Change Log

## Status

ready-for-dev
