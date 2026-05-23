# Story 3.7: Follow-up CTA Panel & Recovery

## Status

**ID:** 3-7
**Epic:** Epic 3
**Status:** review
**Priority:** (TBD)

---

## Story

As a customer, I want a follow-up CTA panel so that I can book a consultation or take the next step after reading my briefing.

---

## Acceptance Criteria

- Panel at bottom of briefing: 'Ready to take the next step?' heading
- CTA buttons: Book a free consultation (Calendly), Download PDF, Share with team
- If Calendly not configured, show 'Contact us' link instead
- Panel is sticky on desktop, inline on mobile
- UX-DR18: CTA panel provides clear next-step guidance

---

## FR / NFR / UX-DR References

- **FRs:** FR1, FR9
- **NFRs:** (none)
- **UX-DRs:** UX-DR18, UX-DR34, UX-DR37

---

## Dependencies

3-2

---

## Tasks / Subtasks

1. [x] Follow-up CTA Panel & Recovery implementation
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
  - `npm exec vitest run` — 243 tests passed (231 baseline + 12 cta-panel)
- **Completion Notes List:**
  - Created `CtaPanel.svelte` component with 'Ready to take the next step?' heading and buttons for Book Consultation (Calendly), Download PDF, Share with Team.
  - Fallback to 'Contact Us' email link when Calendly not configured.
  - Sticky positioning on desktop, static/inline on mobile via media query.
  - Download PDF triggers via existing `/api/portal/reports/{id}/download` endpoint.
  - Share button uses Web Share API, falls back to clipboard copy.
  - Added CTA panel to briefing page after BriefingContent.
- **File List:**
  - `_bmad-output/implementation-artifacts/3-7-follow-up-cta-panel-recovery.md`
  - `src/lib/components/briefing/CtaPanel.svelte`
  - `src/routes/portal/[user_id]/briefing/[report_id]/+page.svelte`
  - `tests/briefing/cta-panel.test.ts`

---

## Change Log

- 2026-05-23: Implemented follow-up CTA panel with Calendly/PDF/Share buttons, sticky layout, and contact fallback.
