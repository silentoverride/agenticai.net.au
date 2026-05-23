# Story 2b.1: Gate Mode Promotion Framework

## Status

**ID:** 2b-1
**Epic:** Epic 2b
**Status:** backlog
**Priority:** (TBD)

---

## Story

As an operator, I want to promote gates from shadow mode to blocking mode so that gates actively protect delivery quality.

---

## Acceptance Criteria

- Env var configuration: each gate has `GATE_{TYPE}_ENABLED` (flag) and `GATE_{TYPE}_KILL` (kill switch)
- Shadow mode: gates log verdicts but pipeline continues regardless of result
- Blocking mode: if gate verdict is block or escalate, pipeline is halted and marked for human review
- Partial block: verdict is retry → pipeline retries the stage (max configurable retries, default 2)
- Human_assist verdict triggers escalation to operator dashboard (Story 2b-4)
- Promotion from shadow → blocking requires zero code changes (env var toggle only)
- NFR20: gate evaluation latency adds at most 30 seconds to pipeline time

---

## FR / NFR / UX-DR References

- **FRs:** FR14, FR18, FR20, FR25
- **NFRs:** NFR20
- **UX-DRs:** (none)

---

## Dependencies

2a-6

---

## Tasks / Subtasks

1. Gate Mode Promotion Framework implementation
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
