# Story 2b.2: Calibration Tooling

## Status

**ID:** 2b-2
**Epic:** Epic 2b
**Status:** backlog
**Priority:** (TBD)

---

## Story

As an operator, I want calibration tooling to tune gate prompts and thresholds so that gate accuracy improves over time.

---

## Acceptance Criteria

- Calibration interface: load a set of golden test cases, run gates, view pass/fail per case
- Golden test cases stored as JSON files: input transcript, expected gate verdict, notes
- Batch run: execute all gates against all golden cases, produce pass/fail report
- Prompt version tracking: each gate run records prompt_version for A/B comparison
- Threshold adjustment UI for applyGatePolicy confidence thresholds

---

## FR / NFR / UX-DR References

- **FRs:** FR14, FR22, FR24, FR25, FR26
- **NFRs:** (none)
- **UX-DRs:** (none)

---

## Dependencies

2b-1

---

## Tasks / Subtasks

1. Calibration Tooling implementation
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
