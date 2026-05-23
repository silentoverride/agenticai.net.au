# Story 3.1: Clerk Auth & Private Briefing Room Shell

## Status

**ID:** 3-1
**Epic:** Epic 3
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a customer, I want to sign in with Clerk so that I can access my private assessment briefing room.

---

## Acceptance Criteria

- Clerk authentication configured: sign in / sign up with email + Google OAuth
- Post-authentication redirect to /dashboard (private briefing room)
- Briefing room shell layout: sidebar navigation (assessments, settings) + main content area
- Unauthenticated users are redirected to sign-in page
- UX-DR29: authentication modals used sparingly — inline form preferred over overlay
- UX-DR6, UX-DR39/40: premium moments for return visits, test coverage for auth flows, accessibility coverage

---

## FR / NFR / UX-DR References

- **FRs:** FR3, FR4, FR5, FR6, FR13
- **NFRs:** NFR10, NFR16
- **UX-DRs:** UX-DR6, UX-DR29, UX-DR34, UX-DR35, UX-DR37, UX-DR38, UX-DR39, UX-DR40

---

## Dependencies

1-1

---

## Tasks / Subtasks

1. Clerk Auth & Private Briefing Room Shell implementation
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
