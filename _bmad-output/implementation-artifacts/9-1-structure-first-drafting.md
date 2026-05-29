# Story 9.1: Structure-First Drafting (HCMW-004)

Status: ready-for-dev

## Story

As a pipeline developer,
I want the LLM analysis to produce a structural plan before writing the report,
So that assessment reports are argument-driven rather than list-driven.

**Requirements sourced from:** HCMW-004 Structure-First Draft — `docs/agentic-workflows/high-capability-model-workflows/hcmw-004-v1-the-structure-first-draft.md`

## Acceptance Criteria

### AC1: Structural plan generation

**Given** intake data and tool research results are available for an assessment
**When** HCMW-004 is applied to the LLM analysis prompt
**Then** the LLM first produces a structural plan (thesis/central argument, supporting arguments with evidence placement, counterargument handling, conclusion direction) before writing prose.

### AC2: Plan review step

**Given** the structural plan is produced
**When** it is reviewed before the full report is generated
**Then** the plan can be accepted, revised, or rejected without wasting a full generation
**And** rejected plans include structured feedback that guides the next attempt.

### AC3: Quality improvement

**Given** the structure-first approach is active
**When** reports are compared to the previous list-driven approach (A/B evaluation)
**Then** structured reports show clear argument progression, evidence-anchored claims, and logical conclusions.

## Pre-conditions / Prerequisites

- Pipeline codebase with existing LLM analysis prompt in `analyze-transcript.ts` or similar
- `docs/agentic-workflows/high-capability-model-workflows/hcmw-004-v1-the-structure-first-draft.md` prompt template
- Tool research and intake data pipeline stages already functional

## Tasks / Subtasks

### Task 1: Locate and integrate HCMW-004 prompt

- [ ] Find the existing analysis/synthesis prompt in the pipeline code
- [ ] Inject HCMW-004 as a structure-first wrapper: the LLM must produce a structural plan first, then write the report
- [ ] Add a review gate between plan generation and full report generation
- [ ] The plan includes: thesis/central argument, supporting arguments, evidence placement, counterargument handling, conclusion direction

### Task 2: Plan review step

- [ ] Add a plan-review step that lets the system (or human via Staff Portal) accept/reject/revise the plan
- [ ] Rejected plans include structured feedback for the next attempt
- [ ] Plan acceptance gates the full report generation

### Task 3: A/B evaluation support

- [ ] Add a flag or mode to toggle between structure-first and list-driven approaches
- [ ] Log the mode used for comparisons

### Task 4: Tests

- [ ] Unit test: structural plan output has required sections
- [ ] Unit test: plan rejection yields structured feedback
- [ ] Unit test: accepted plan proceeds to full generation

## File List

- Pipeline analysis prompt module (extend)
- `docs/agentic-workflows/high-capability-model-workflows/hcmw-004-v1-the-structure-first-draft.md` (reference)

## Dev Notes

### Architecture Guardrails

- The pipeline codebase is in `src/lib/server/pipeline/` or similar — locate the analysis/synthesis step
- HCMW-004 is a two-phase prompt: first generate plan, then (if accepted) generate full report
- Use a structured output format (JSON) for the plan so it can be programmatically parsed
- The plan review step should be a simple boolean gate: `planAccepted: true/false`
- For MVP, auto-accept plans (skip human review) but log the plan for audit
