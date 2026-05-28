# Story 7.2: Gate Architecture Review (JLA-005)

Status: ready-for-dev

## Story

As a pipeline architect,
I want an architecture review of the 3-gate design,
So that we confirm the gates are the right number, at the right boundaries, and using the right judge types before investing in prompt writing.

## Acceptance Criteria

**Given** the action surface audit from Story 7.1 (`_bmad-output/implementation-artifacts/jla-001-action-surface-audit.md`) and current gate implementation details
**When** JLA-005 is applied
**Then** the review evaluates: (a) whether 3 gates are the right number, (b) whether they are placed at optimal pipeline boundaries, (c) whether specialist judges should replace the current monolithic approach, (d) failure modes if any gate is bypassed, and (e) whether memory provenance is adequate for gate decision context.

**Given** the architecture review recommends changes
**When** findings are documented
**Then** each recommendation includes: what should change, why, expected risk reduction, and whether it's a prerequisite or an optimization
**And** the review confirms or rejects the current 3-gate design before story 7.3 proceeds.

**Given** the review identifies the optimal gate boundaries
**When** the Staff Portal Epic 1 Human Review workspace is built
**Then** gate finding types and review flow align with the validated gate architecture.

## Tasks/Subtasks

- [ ] Read the JLA-005 methodology at `docs/agentic-workflows/judge-layer-architecture/jla-005-v1-judge-architecture-reviewer.md`
- [ ] Read the JLA-001 action surface audit at `_bmad-output/implementation-artifacts/jla-001-action-surface-audit.md`
- [ ] Read current gate implementation: `src/lib/server/assessment/gate/runner.ts`, `definitions.ts`, `pbw-detector.ts`, `gate-mode.ts`
- [ ] Read pipeline gate placement: `src/lib/server/assessment/pipeline.ts` (gate checkpoint section)
- [ ] Evaluate question (a): Are 3 gates the right number? (quick-wins-verification, major-project-verification, report-review)
- [ ] Evaluate question (b): Optimal placement — identify all placement issues found in JLA-001 (BYPASS-1 through BYPASS-7)
- [ ] Evaluate question (c): Should specialist judges replace monolithic approach? (e.g., separate evidence judge, tool judge, style judge)
- [ ] Evaluate question (d): Failure modes if each gate is bypassed — what happens?
- [ ] Evaluate question (e): Is memory provenance adequate? (evidence map, prior gate results, transcript context)
- [ ] Acknowledge prior Phase 1 JLA-005 work already completed (P0 sequencing fix, P1 gate communication, P3/P4 prompt fixes)
- [ ] Produce consolidated JLA-005 review document with verdict and prioritized recommendations
- [ ] Cross-reference with JLA-001 BYPASS findings — confirm or reject each
- [ ] File the review at `_bmad-output/implementation-artifacts/jla-005-gate-architecture-review.md`

## Dev Notes

### Context from Prior Work

**Phase 1 JLA-005 was partially executed** (2026-05-28) before formal stories existed. The following was already completed:

| Finding | Status | Details |
|---------|--------|---------|
| P0: Gate sequencing error | ✅ FIXED | `quick-wins-verification` and `major-project-verification` were positioned BEFORE LLM analysis but expected report content. Moved to AFTER `stageLlmAnalysis` in `pipeline.ts` line ~365. |
| P1: Gate communication gap | ✅ FIXED | Prior gate results were not passed to `report-review`. Now `priorGateResults` string is injected into `reviewContent` before the report-review gate. |
| P3: Report-review prompt structure | ✅ FIXED | Prompt updated to include taste dimensions (T1-T7) and PBW detection. |
| P4: Gate mode infrastructure | ✅ FIXED | `GATE_MODE=blocking` and `GATE_MODE=shadow` modes implemented via `gate-mode.ts`. |
| P2: Gate criteria gaps | ⚪ NOT YET | Each gate needs explicit criteria documentation (left for 7.3). |
| P5: Evaluation suites | ⚪ NOT YET | No automated gate testing exists (left for 7.4). |

**This story (7.2) validates what was already done and identifies what remains.**

### Architecture from JLA-001 Audit

The pipeline currently has:
- **3 gates**: quick-wins-verification, major-project-verification, report-review
- **Gate mode**: configurable via GATE_MODE env var (shadow | blocking)
- **Gate persistence**: results written to D1 via D1GateStore
- **8 ungated actions**: tool research, evidence extraction, LLM analysis, report save, report link, transcription save, status write, budget extract
- **7 bypasses**: most critical being B1 (pre-analysis stages), B2 (report persisted before gate), B3 (no evidence provenance)

### JLA-005 Review Template

The review should follow the JLA-005 methodology structure:
1. **Gate Inventory**: What gates exist now? What do they check?
2. **Placement Analysis**: For each gate, is it at the right pipeline boundary?
3. **Gap Analysis**: What should be gated that isn't?
4. **Redundancy Analysis**: Are any gates checking the same thing?
5. **Specialist vs. Monolithic**: Should we split gates into specialist judges?
6. **Memory Provenance**: Does each gate have enough context?
7. **Verdict**: Confirm, reject, or modify the current design
8. **Recommendations**: Prioritized list with prerequisite/optimization tags

### Key Reference Points

- Pipeline code: `src/lib/server/assessment/pipeline.ts` (lines 251-450)
- Gate runner: `src/lib/server/assessment/gate/runner.ts`
- Gate definitions: `src/lib/server/assessment/gate/definitions.ts` (425 lines, 3 gate prompts + taste dimensions)
- Gate mode: `src/lib/server/assessment/gate/gate-mode.ts`
- JLA-001 audit: `_bmad-output/implementation-artifacts/jla-001-action-surface-audit.md`

## Dev Agent Record

### Implementation Plan

Read methodology → cross-reference with JLA-001 audit + current gate code → evaluate 5 questions → produce consolidated review document acknowledging prior work.

### File List

- `_bmad-output/implementation-artifacts/jla-005-gate-architecture-review.md` (NEW)

### Completion Notes

### Change Log

## Status

ready-for-dev
