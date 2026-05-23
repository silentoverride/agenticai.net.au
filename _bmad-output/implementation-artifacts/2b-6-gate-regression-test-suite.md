# Story 2b.6: Gate Regression Test Suite

## Status

**ID:** 2b-6
**Epic:** Epic 2b
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a quality engineer, I want an automated regression test suite for gates so that prompt changes don't silently degrade quality.

---

## Acceptance Criteria

- Regression test suite: set of golden test cases covering: approve path, retry path, block path, escalate path, human_assist path
- Each test case defines: gate type, input content, expected verdict range
- CI-compatible: tests can run in GitHub Actions or similar
- Regression report: pass/fail per test case, verdict drift compared to baseline
- If regression rate drops below 80%, tests fail and block deployment

---

## FR / NFR / UX-DR References

- **FRs:** FR24, FR26, FR29
- **NFRs:** (none)
- **UX-DRs:** (none)

---

## Dependencies

2b-2

---

## Tasks / Subtasks

1. Gate Regression Test Suite implementation
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
