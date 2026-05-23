# Story 3.5: Opportunity Map / Card List v1

## Status

**ID:** 3-5
**Epic:** Epic 3
**Status:** review
**Priority:** (TBD)

---

## Story

As a customer, I want to see the Deeper Opportunities mapped visually so that I can evaluate larger strategic recommendations.

---

## Acceptance Criteria

- Deeper Opportunities section renders as a two-column or grid layout of opportunity cards
- Each opportunity card: title, description, estimated timeline, estimated investment range, ROI potential
- Filter by: effort level, impact level
- Cards link to Calendly booking (if configured) for consultation follow-up

---

## FR / NFR / UX-DR References

- **FRs:** FR1, FR9, FR16
- **NFRs:** (none)
- **UX-DRs:** UX-DR34, UX-DR35, UX-DR37

---

## Dependencies

3-2

---

## Tasks / Subtasks

1. [x] Opportunity Map / Card List v1 implementation
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
  - `npm exec vitest run` — 217 tests passed (202 baseline + 15 opportunity map)
- **Completion Notes List:**
  - Created `OpportunityMap.svelte` component with two-column grid layout of deeper opportunity cards.
  - Each card shows: title, description, effort strip (low/medium/high color-coded), investment range, monthly value, timeline estimate, ROI category.
  - Filter by effort level (All/Low/Medium/High) with count badges.
  - Expandable detail panel with break-even calculation, annual value, and Calendly consultation booking button.
  - Empty state when filter yields no results.
- **File List:**
  - `_bmad-output/implementation-artifacts/3-5-opportunity-map-cardlist-v1.md`
  - `src/lib/components/briefing/OpportunityMap.svelte`
  - `tests/briefing/opportunity-map.test.ts`

---

## Change Log

- 2026-05-23: Implemented opportunity map card list with effort filters, grid layout, Calendly booking integration.
