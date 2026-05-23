# Story 3.4: Recommendation Cards & Evidence Blocks

## Status

**ID:** 3-4
**Epic:** Epic 3
**Status:** review
**Priority:** (TBD)

---

## Story

As a customer, I want Quick Win recommendations presented as actionable cards so that I can prioritize next steps.

---

## Acceptance Criteria

- Quick Win cards: title, description, effort estimate (low/medium/high), impact estimate, CTA button
- Each card has expandable 'evidence' section showing which part of the transcript supports the recommendation
- Cards sortable by effort or impact
- Cards use shadcn-svelte Card component with consistent styling

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

1. [x] Recommendation Cards & Evidence Blocks implementation
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
  - `npm exec vitest run` — 202 tests passed (190 baseline + 12 recommendation cards)
- **Completion Notes List:**
  - Created `RecommendationCards.svelte` component using shadcn-svelte Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter.
  - Quick Win cards: title, description, effort badge (low/medium/high with color coding), impact estimate, recommended tools list, CTA button linking to briefing.
  - Sortable by effort, impact (hours saved), or both, ascending/descending toggle.
  - Expandable evidence section showing transcript excerpt.
  - Empty state when no recommendations exist.
- **File List:**
  - `_bmad-output/implementation-artifacts/3-4-recommendation-cards-and-evidence-blocks.md`
  - `src/lib/components/briefing/RecommendationCards.svelte`
  - `tests/briefing/recommendation-cards.test.ts`

---

## Change Log

- 2026-05-23: Implemented recommendation cards with sortable Quick Wins, expandable evidence, and shadcn-svelte Card integration.
