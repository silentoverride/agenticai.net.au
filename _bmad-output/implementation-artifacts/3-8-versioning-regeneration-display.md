# Story 3.8: Versioning, Regeneration & Display

## Status

**ID:** 3-8
**Epic:** Epic 3
**Status:** review
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

1. [x] Versioning, Regeneration & Display implementation
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
  - `npm exec vitest run` — 260 tests passed (243 baseline + 17 versioning)
- **Completion Notes List:**
  - Created `VersionInfo.svelte` component showing version number, last-updated date, Re-run Assessment button, version history panel.
  - Created POST `/api/assessment/:reportId/regenerate` endpoint with ownership verification and 30-day cooldown rate limiting.
  - R2 key pattern `assessments/{reportId}/v{version}-briefing.json` documented for version preservation.
  - Added VersionInfo to briefing page between content and CTA panel.
- **File List:**
  - `_bmad-output/implementation-artifacts/3-8-versioning-regeneration-display.md`
  - `src/lib/components/briefing/VersionInfo.svelte`
  - `src/routes/api/assessment/[report_id]/regenerate/+server.ts`
  - `tests/assessment/versioning.test.ts`

---

## Change Log

- 2026-05-23: Implemented versioning display, regeneration API, and version history for assessment briefing.
