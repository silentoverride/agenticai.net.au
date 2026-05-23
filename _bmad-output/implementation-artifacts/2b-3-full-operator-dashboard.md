# Story 2b.3: Full Operator Dashboard

## Status

**ID:** 2b-3
**Epic:** Epic 2b
**Status:** backlog
**Priority:** (TBD)

---

## Story

As an operator, I want a full dashboard showing pipeline and gate health so that I can monitor system performance and intervene when needed.

---

## Acceptance Criteria

- Dashboard displays: total assessments processed today, pass/fail rates per gate, average pipeline duration, queue depth
- Per-gate breakdown: verdict distribution (approve/retry/block/escalate/human_assist), average confidence, average latency
- Recent assessments table: assessment ID, status, gates triggered, verdicts, timestamps
- NFR20: dashboard queries complete within 3 seconds
- View accessible only by operators (role-based access)

---

## FR / NFR / UX-DR References

- **FRs:** FR22, FR25
- **NFRs:** NFR20
- **UX-DRs:** (none)

---

## Dependencies

2b-1

---

## Tasks / Subtasks

1. Full Operator Dashboard implementation
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
