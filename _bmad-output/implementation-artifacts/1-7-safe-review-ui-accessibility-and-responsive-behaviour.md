# Story 1.7: Safe Review UI Accessibility and Responsive Behaviour

Status: done

## Story

As a keyboard or assistive-technology user,
I want review decisions to be fully operable and understandable,
So that safety-critical work is not blocked by accessibility gaps.

## Requirements Covered

FR57, FR58, FR63, FR64, FR65, FR66, FR67; NFR5, NFR7; UX-DR3, UX-DR11, UX-DR12, UX-DR13, UX-DR14, UX-DR29, UX-DR32, UX-DR39, UX-DR41

## Acceptance Criteria

1. **Given** the review queue, workspace, state badges, risk signals, blocker panel, guarded action panel, receipts, and audit timeline are rendered, **when** a keyboard-only user reviews, decides, blocks, unblocks, escalates, inspects audit history, or recovers from validation errors, **then** the workflow is completable without pointer input, and visible focus order follows State → risk/blocker → context/evidence → valid action → receipt/audit proof.

2. **Given** a screen reader user interacts with review flows, **when** state, blocker status, validation errors, loading states, stale-state warnings, or action results change, **then** the information is announced or discoverable through semantic markup and live regions where appropriate, and colour is never the only signal for success, warning, error, stale, permission, or blocked state.

3. **Given** viewport width changes from desktop to tablet or mobile, **when** complex report approval, escalation, delivery, or audit-sensitive decisions are displayed below the tested safe-review size, **then** the layout preserves state-first order and warns when the screen size is not suitable for safe review unless that flow has mobile test coverage.

## Pre-conditions / Prerequisites

Stories 1.1–1.6 provide all UI components: workspace page, GateFindingCard, GuardedActionPanel, DecisionReceipt, AuditTimeline. This story audits and fixes them all for accessibility and responsive behaviour.

## Tasks / Subtasks

### 1. Keyboard accessibility audit

- [ ] Audit all interactive elements in workspace page: GateFindingCard toggle buttons, action buttons, form controls, expandable sections.
- [ ] Ensure all actions are reachable and operable via Tab/Shift+Tab, Enter, Escape.
- [ ] Verify visible focus indicators on all interactive elements (focus ring, outline).
- [ ] Ensure escape key closes open forms and expandable sections.
- [ ] Test focus order: State → risk/blocker → context/evidence → valid action → receipt/audit proof.
- [ ] Add `tabindex` and `role` attributes where needed.

### 2. Screen reader audit

- [ ] Audit all components for proper ARIA attributes:
  - Live regions (`role="status"`, `role="alert"`) on success/error messages (already present in GateFindingCard, GuardedActionPanel — verify in DecisionReceipt, AuditTimeline).
  - `aria-live="polite"` on receipt and audit timeline content that updates dynamically.
  - `aria-expanded` on all expandable/collapsible sections.
  - `aria-controls` on toggle buttons pointing to controlled content.
  - Proper label associations (`for`/`id`) on all form controls.
- [ ] Verify colour is never the only signal: all state, risk, and blocker info has visible text labels (already compliant in existing components — audit new ones).

### 3. Responsive layout

- [ ] Audit workspace page layout below 768px viewport width.
- [ ] Ensure state-first order is preserved: Report State → Gate Findings → Guarded Actions → Receipt → Audit Timeline.
- [ ] Add responsive CSS: stack grids vertically on small screens.
- [ ] Add a warning banner when viewport width is below 480px: "This screen size is not recommended for safe review."
- [ ] Ensure all cards, buttons, and forms remain usable at 320px viewport width.

### 4. Colour contrast audit

- [ ] Check all component colour combinations against WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text).
- [ ] Fix any contrast failures in success/error/warning badges, confidence bar, risk signals.

## Implementation Notes

- Use CSS media queries for responsive layout — no JavaScript resize listeners.
- Add `@media (prefers-reduced-motion)` support for confidence bar animation.
- Use existing CSS custom properties throughout — this story fixes any hardcoded colours that slipped through.

## Files to Modify

- `src/lib/components/staff-portal/GateFindingCard.svelte` — accessibility updates
- `src/lib/components/staff-portal/GuardedActionPanel.svelte` — accessibility updates
- `src/lib/components/staff-portal/DecisionReceipt.svelte` — accessibility from creation
- `src/lib/components/staff-portal/AuditTimeline.svelte` — accessibility from creation
- `src/routes/operator/assessments/[assessmentId]/+page.svelte` — responsive layout
- `src/routes/operator/assessments/+page.svelte` — responsive layout if needed
