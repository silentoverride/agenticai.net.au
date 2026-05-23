# Story 3.6: Controlled Pilot Access, Boundaries & Email Notifications

## Status

**ID:** 3-6
**Epic:** Epic 3
**Status:** ready-for-dev
**Priority:** (TBD)

---

## Story

As an operator, I want controlled access to the briefing portal during pilot so that only invited customers can see their assessments.

---

## Acceptance Criteria

- Access control: only customers with a completed assessment can access the portal
- Email notification sent when assessment is ready with magic link or sign-in prompt
- Admin can manually grant/revoke access to specific customers
- Rate limiting on login attempts (5 attempts per 15 minutes per IP)
- NFR16: unauthorized access returns 401 without revealing whether the email exists

---

## FR / NFR / UX-DR References

- **FRs:** FR3, FR4, FR5, FR6, FR13
- **NFRs:** NFR16
- **UX-DRs:** (none)

---

## Dependencies

3-1

---

## Tasks / Subtasks

1. Controlled Pilot Access, Boundaries & Email Notifications implementation
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
