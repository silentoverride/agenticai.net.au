# Story 0.2: Shared Schema Contracts & Assessment Data Model

## Status

**ID:** 0-2
**Epic:** Epic 0
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a platform engineer, I want shared type contracts and data model definitions so that all pipeline stages and gates agree on the shape of assessment data.

---

## Acceptance Criteria

- `AssessmentBriefing`, `AssessmentOrder`, `PipelineStage`, `GateVerdict` types are defined in `src/lib/server/assessment/types.ts`
- Async state contract defines states: queued, generating, delayed, ready, failed, human_assist with user-facing titles and descriptions
- Empty/edge state contract defines pre-built states for: no assessment, no intake, no briefing, incomplete intake, stale briefing, partial generation
- Migration numbering convention documented: 0001–0009 Epic 1, 0010–0019 Epic 2a, 0020–0029 Epic 2b, 0030–0039 Epic 3, 0040+ future
- D1 table schema agreement documented (UX-DR30–33): assessment_orders, assessment_results, assessment_payments, assessment_gates tables
- schema-contract.md created at src/lib/server/assessment/schema-contract.md

---

## FR / NFR / UX-DR References

- **FRs:** FR17, FR11
- **NFRs:** (none)
- **UX-DRs:** UX-DR30, UX-DR31, UX-DR33

---

## Dependencies

0-1

---

## Tasks / Subtasks

1. Shared Schema Contracts & Assessment Data Model implementation
2. Unit and integration tests
3. Acceptance criteria verification

---

## Dev Notes

<!-- Implementation details, architecture decisions, and references go here. -->

**Project Structure Notes:**
- Story files: `_bmad-output/implementation-artifacts/`
- Source code: `src/`

**References:**
- epics.md
- sprint-status.yaml

---

## Dev Agent Record

- **Agent Model Used:** (TBD)
- **Debug Log References:** (TBD)
- **Completion Notes List:**
  - (TBD)
- **File List:**
  - (TBD)
