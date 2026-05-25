# Story 5.6: Meeting and Commercial Responsive Accessibility

Status: backlog

## Story

As a staff user on different devices or assistive technology,
I want meeting and commercial continuity flows to stay safe and understandable,
So that lightweight updates do not hide blockers or audit consequences.

## Requirements Covered

FR50, FR56, FR57, FR58; NFR5; UX-DR3, UX-DR37, UX-DR38, UX-DR39, UX-DR41

## Acceptance Criteria

### AC1: Responsive layout across breakpoints

**Given** Meeting Brief or Commercial Next Step surfaces render at desktop, tablet, or mobile widths
**When** layout adapts
**Then** state, blocker/freshness, context, valid action, and receipt/audit proof remain in order
**And** safety-critical information is not hidden behind hover-only or icon-only affordances.

### AC2: Observable, accessible, safe response states

**Given** staff submit meeting-ready, commercial-commit, complete, defer, cancel, or linked follow-up actions
**When** pending, success, recoverable failure, or stale/blocked states occur
**Then** each response is observable, accessible, duplicate-submit safe, and backed by persisted events where required
**And** automated tests cover success, validation failure, permission denial, stale state, duplicate submission prevention, receipt display, keyboard-only completion, and screen-reader discoverability.

## Pre-conditions / Prerequisites

- MeetingBriefPanel and CommercialNextStepPanel components exist (5.3, 5.4)
- Follow-up and audit services exist (4.5, 5.5)
- ClientProfile composes these panels (3.5)

## Tasks / Subtasks

### Task 1: Responsive audit — MeetingBriefPanel

- Audit all read/edit/receipt/confirmation states at 320px, 768px, 1024px, 1440px
- Ensure field labels, badges, buttons are fully visible
- Ensure overlays/confirm dialogs are centered and scrollable on small screens
- Ensure stale/blocked warnings are not hidden

### Task 2: Responsive audit — CommercialNextStepPanel

- Same audit for commercial panel: status dropdown, owner input, notes textarea, follow-up continuity section, receipt banner, confirmation overlay
- Ensure the confirmation overlay modal works on mobile (scroll, tap targets)

### Task 3: Duplicate-submit prevention

- Add loading spinner or disabled state on save buttons during pending state
- Ensure API idempotency key mechanism prevents double submission
- Verify visually and in tests

### Task 4: Keyboard-only completion

- Ensure all actionable elements (buttons, links, selects, inputs) are reachable via Tab
- Ensure overlay dialogs trap focus
- Ensure Escape dismisses overlays
- Test with keyboard-only

### Task 5: Screen-reader accessibility

- Audit aria-labels, roles, live regions for all dynamic content:
  - Receipt banners (role="status" or aria-live="polite")
  - Confirmation dialogs (role="dialog", aria-modal, aria-labelledby)
  - Error messages (role="alert")
  - Follow-up continuity section (describedby relationship)
- Add missing attributes

### Task 6: Test coverage

- Component tests for responsive layout (viewport mocking)
- Keyboard interaction tests
- Accessibility assertions (aria attributes, focus trapping)
- Duplicate-submit prevention test
- Error/validation/blocked state rendering tests

## File List

- `src/lib/components/staff-portal/MeetingBriefPanel.svelte` (modify — responsive + accessibility)
- `src/lib/components/staff-portal/CommercialNextStepPanel.svelte` (modify — responsive + accessibility)
- `tests/staff-portal/components/MeetingBriefPanel.test.ts` (new — expanded)
- `tests/staff-portal/components/CommercialNextStepPanel.test.ts` (new — expanded)
- `tests/staff-portal/components/ClientProfile.responsive.test.ts` (new)
