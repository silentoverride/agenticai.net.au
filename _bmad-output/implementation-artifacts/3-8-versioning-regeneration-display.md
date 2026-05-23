# Story 3.8: Versioning, Regeneration & Display

## Status

**ID:** 3-8
**Epic:** Epic 3
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a customer, I want version tracking on my assessment so that I can see when it was last updated and request regeneration if needed.

---

## Acceptance Criteria

- Briefing displays version number and last-updated date
- Regeneration request: customer can click 'Re-run assessment' to trigger a new analysis with updated transcript
- Previous version preserved in R2 with key: `assessments/{assessmentId}/v{version}-briefing.json`
- Version history viewable: date, version number, status (current/archived)
- Rate limit regeneration to 1 per 30 days per assessment

---

## FR / NFR / UX-DR References

- **FRs:** FR9, FR27, FR28
- **NFRs:** (none)
- **UX-DRs:** (none)

---

## Dependencies

3-2

---

## Tasks / Subtasks

1. Versioning, Regeneration & Display implementation
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
