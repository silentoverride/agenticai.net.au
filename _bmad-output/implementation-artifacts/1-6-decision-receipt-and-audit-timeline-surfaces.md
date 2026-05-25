# Story 1.6: Decision Receipt and Audit Timeline Surfaces

Status: ready-for-dev

## Story

As an operator,
I want successful decisions to produce visible receipts and audit history,
So that I can prove what changed and recover context later.

## Requirements Covered

FR31, FR57, FR58, FR59, FR60, FR61, FR62; NFR2; UX-DR22, UX-DR23, UX-DR30, UX-DR40

## Acceptance Criteria

1. **Given** a state-changing review action succeeds, **when** persistence confirms success, **then** a `DecisionReceipt` renders from the persisted event record with receipt/event ID, affected item, previous state, resulting state, actor, timestamp, rationale/reason, next owner/action, and audit reference; and no completed/success state is shown before persistence confirms success.

2. **Given** persisted audit events exist for a client, report, or finding, **when** `AuditTimeline` renders, **then** it shows event ID, actor, action, timestamp, affected entity, previous state, next state, rationale/summary, and linked receipt/context; and it never renders audit entries from local optimistic state.

3. **Given** an action is pending, duplicated, stale, permission-denied, validation-failed, or blocked, **when** the UI responds, **then** duplicate submission is prevented, prior visible state remains, and structured API errors distinguish staleState, permissionDenied, blockedAction, duplicateAction, validationFailed, and auditWriteFailed.

## Pre-conditions / Prerequisites

Stories 1.2–1.5 provide `commitStaffAction` with audit event persistence, `StaffActionReceiptDto`, `StaffActionMutationResultDto`, and `StaffActionErrorCode`. Story 1.5 provides the `GuardedActionPanel`. The `staff_action_audit_events` table and receipts are already persisted.

## Tasks / Subtasks

### 1. Build DecisionReceipt component

- [ ] Create `src/lib/components/staff-portal/DecisionReceipt.svelte` that renders a `StaffActionReceiptDto` as a compact receipt card.
- [ ] Show: receipt/event ID, affected item (target type + id), previous state, resulting state, actor, timestamp, rationale/reason, next owner/action, audit reference.
- [ ] Use `REPORT_STATE_PRESENTATION` / `GATE_FINDING_STATE_PRESENTATION` for state labels.
- [ ] Display with a success tone (green left border, success background) to indicate confirmation.
- [ ] Expose `data-testid="decision-receipt-{id}"`.

### 2. Build AuditTimeline component

- [ ] Create `src/lib/components/staff-portal/AuditTimeline.svelte` that renders an array of audit events.
- [ ] Wire an API endpoint or read model to fetch audit events for a given assessment: `GET /api/operator/assessments/[assessmentId]/audit-events`.
- [ ] Component props: `assessmentId: string`.
- [ ] Load events on mount via `onMount` with fetch; show loading state.
- [ ] Each timeline entry shows: event ID, actor name/ID, action label, timestamp, affected entity type/id, previous state, next state, rationale/summary.
- [ ] Use `REPORT_STATE_PRESENTATION` and `GATE_FINDING_STATE_PRESENTATION` for state labels.
- [ ] Never render entries from local optimistic state — only server-persisted events.
- [ ] Date grouping: group events by day with headings.
- [ ] Expose `data-testid="audit-timeline-entry-{id}"`.

### 3. Wire DecisionReceipt into existing action panels

- [ ] In `GateFindingCard.svelte`: after a successful action, render the receipt inline on the card (brief, auto-dismissing or persistent until next action).
- [ ] In `GuardedActionPanel.svelte`: after a successful report-level action, render the receipt inline.
- [ ] Clear the prior receipt when a new action starts.

### 4. Wire AuditTimeline into workspace page

- [ ] In `+page.svelte`, add an "Audit Timeline" section below the guarded actions panel that renders `<AuditTimeline assessmentId={review.assessmentId} />`.
- [ ] Show a loading state while events are fetched.
- [ ] If no events exist, show "No audit events recorded for this assessment."

### 5. Error handling tests

- [ ] Verify that all existing error codes are handled in both GateFindingCard and GuardedActionPanel.
- [ ] Add tests for AuditTimeline rendering with mock data.

## Implementation Notes

- DecisionReceipt can be a simple card component — no animation needed for MVP.
- AuditTimeline fetch should use a simple `+server.ts` endpoint that queries `staff_action_audit_events` by `assessment_id`.
- The API endpoint should be thin: authenticate, query events, return DTOs.
- Reuse existing types from `StaffActionReceiptDto`.

## Files to Create

- `src/lib/components/staff-portal/DecisionReceipt.svelte`
- `src/lib/components/staff-portal/AuditTimeline.svelte`
- `src/routes/api/operator/assessments/[assessmentId]/audit-events/+server.ts`

## Files to Modify

- `src/lib/components/staff-portal/GateFindingCard.svelte` — add receipt display
- `src/lib/components/staff-portal/GuardedActionPanel.svelte` — add receipt display
- `src/routes/operator/assessments/[assessmentId]/+page.svelte` — add audit timeline section
