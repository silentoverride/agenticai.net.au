# Story 2a.7: Pipeline Status Views (User-Facing)

## Status

**ID:** 2a-7
**Epic:** Epic 2a
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a paying customer, I want to see the real-time status of my assessment pipeline so that I know when my briefing will be ready.

---

## Acceptance Criteria

- Status display shows: assessment state (queued/generating/delayed/ready/failed), estimated time remaining, progress steps (intake → analysis → review → ready)
- Status page auto-refreshes every 10 seconds via polling or SSE
- On completion: status transitions to ready with download/view CTA
- On failure: clear error message with support contact information
- NFR4: status views load within 2 seconds
- NFR5: auto-refresh rate respects user's battery/data preferences (reduced on mobile)
- NFR9: status data cached for 30 seconds, reads from cache-hit
- NFR19: accessible status indicators (aria-live region, color + icon + text)

---

## FR / NFR / UX-DR References

- **FRs:** FR13, FR23
- **NFRs:** NFR4, NFR5, NFR9, NFR19
- **UX-DRs:** UX-DR32, UX-DR34, UX-DR35, UX-DR37, UX-DR38

---

## Dependencies

2a-4, 2a-6

---

## Tasks / Subtasks

1. Pipeline Status Views (User-Facing) implementation
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
