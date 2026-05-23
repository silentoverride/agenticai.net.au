# Story 1.6: Intake Interruption, Recovery & Session Resume

## Status

**ID:** 1-6
**Epic:** Epic 1
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a busy business owner, I want to take a break during intake and resume later so that I can complete the assessment at my own pace.

---

## Acceptance Criteria

- If user closes the browser or navigates away during intake, session state is saved to D1
- Returning user with an incomplete intake sees a resume prompt with last answered question context
- Resume flow restores Annie conversation to the point of interruption
- Session timeout (24h) after which incomplete intake expires and requires restart
- Clean error message on session expiry (not a broken page or blank state)

---

## FR / NFR / UX-DR References

- **FRs:** FR3, FR13
- **NFRs:** NFR10, NFR16
- **UX-DRs:** UX-DR32

---

## Dependencies

1-4

---

## Tasks / Subtasks

1. Intake Interruption, Recovery & Session Resume implementation
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
