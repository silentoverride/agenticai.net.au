# Story 2b.4: Human Assist Workflow

## Status

**ID:** 2b-4
**Epic:** Epic 2b
**Status:** backlog
**Priority:** (TBD)

---

## Story

As an operator, I want a human-in-the-loop workflow so that assessments flagged by gates can be reviewed and resolved manually.

---

## Acceptance Criteria

- Human assist queue: assessments with verdict 'human_assist' or 'escalate' appear in operator queue
- Review interface: operator sees the assessment transcript, generated analysis, gate verdict and reasoning
- Operator actions: approve (deliver as-is), edit (modify content), reject (do not deliver, notify customer)
- If approved: assessment transitions to ready state and delivery proceeds
- If rejected: customer receives notification that assessment could not be completed
- FR18: human assist workflow provides escalation path for complex or uncertain assessments

---

## FR / NFR / UX-DR References

- **FRs:** FR14, FR15, FR18, FR24, FR25, FR29
- **NFRs:** NFR20
- **UX-DRs:** (none)

---

## Dependencies

2b-1

---

## Tasks / Subtasks

1. Human Assist Workflow implementation
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
