# Story 3.3: Assessment Status & Receipt Display

## Status

**ID:** 3-3
**Epic:** Epic 3
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a customer, I want to see the status of my assessment (queued/processing/ready) and view past receipts so that I know what's happening.

---

## Acceptance Criteria

- Dashboard shows list of assessments: date, status badge (queued/processing/delayed/ready/failed), CTA (view/pending/retry)
- Status polling auto-refreshes for in-progress assessments
- Receipt page shows: amount paid, date, payment method, assessment reference
- Receipt accessible from assessment card dropdown menu
- UX-DR32: empty state handling when no assessments exist

---

## FR / NFR / UX-DR References

- **FRs:** FR13, FR23
- **NFRs:** NFR4, NFR5, NFR9
- **UX-DRs:** UX-DR32, UX-DR34, UX-DR35, UX-DR37, UX-DR38

---

## Dependencies

3-1, 2a-7

---

## Tasks / Subtasks

1. Assessment Status & Receipt Display implementation
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
