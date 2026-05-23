# Story 2a.3: Source Data Preservation & Artifact Storage

## Status

**ID:** 2a-3
**Epic:** Epic 2a
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a platform engineer, I want raw intake data preserved in R2 so that we have an immutable audit trail of what was submitted.

---

## Acceptance Criteria

- Raw transcript JSON stored in R2 with key: `assessments/{assessmentId}/transcript.json`
- Assessment metadata (customer info, timestamps, pipeline state) persisted to D1 `assessment_orders` table
- R2 bucket has CORS policy allowing read access only from application origin
- R2 artifact key convention documented: `assessments/{assessmentId}/{stage}-{timestamp}.json`
- UX-DR30: data preservation strategy documented

---

## FR / NFR / UX-DR References

- **FRs:** FR10, FR11
- **NFRs:** NFR4, NFR9
- **UX-DRs:** UX-DR30, UX-DR31

---

## Dependencies

0-2, 2a-2

---

## Tasks / Subtasks

1. Source Data Preservation & Artifact Storage implementation
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
