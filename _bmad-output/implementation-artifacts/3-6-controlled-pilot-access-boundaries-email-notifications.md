# Story 3.6: Controlled Pilot Access, Boundaries & Email Notifications

## Status

**ID:** 3-6
**Epic:** Epic 3
**Status:** review
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

1. [x] Controlled Pilot Access, Boundaries & Email Notifications implementation
2. [x] Unit and integration tests
3. [x] Acceptance criteria verification

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

- **Agent Model Used:** GPT-5.1 Codex Max
- **Debug Log References:**
  - `npm exec vitest run` — 231 tests passed (217 baseline + 14 pilot access)
- **Completion Notes List:**
  - Created `src/lib/server/rate-limiter.ts`: in-memory sliding-window rate limiter (5 attempts per 15 min per IP) with `checkRateLimit()` and `requireRateLimit()` throw-on-exceed.
  - Created `src/routes/api/portal/access/+server.ts`: admin endpoint GET (list users with report/receipt stats) and POST (grant|revoke|set_admin actions), operator-only via `requireOperator`.
  - Updated `src/lib/server/portal-auth.ts`: revoked-role check after upsertUser returns 403 for revoked accounts.
- **Pre-existing (from earlier epics):**
  - Email notification on assessment ready already implemented in pipeline stageEmailDelivery via `sendReportReadyEmail`.
  - reportReadyTemplate, portalInvitationTemplate, welcomeTemplate all exist.
- **File List:**
  - `_bmad-output/implementation-artifacts/3-6-controlled-pilot-access-boundaries-email-notifications.md`
  - `src/lib/server/rate-limiter.ts`
  - `src/lib/server/portal-auth.ts`
  - `src/routes/api/portal/access/+server.ts`
  - `tests/portal/pilot-access.test.ts`

---

## Change Log

- 2026-05-23: Implemented rate limiter, admin access management API, portal auth access control check.
