# Story 1.5: Whole Report Guarded Decisions

Status: ready-for-dev

## Story

As an operator,
I want report-level decisions to be guarded by checklist and blocker rules,
So that only safe reports can become client-deliverable.

## Requirements Covered

FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR57, FR58, FR61, FR62; NFR1, NFR2; UX-DR21, UX-DR27, UX-DR28, UX-DR31

## Acceptance Criteria

1. **Given** unresolved blocking Gate Findings remain, **when** an operator attempts to approve a report, **then** approval is blocked and the UI explains the unresolved blockers and exposes the recovery path.

2. **Given** all blocking findings are resolved or overridden with reason, **when** the operator submits `approved`, `rejected`, `regeneration required`, or `clarification required`, **then** the action requires the report approval checklist: required review note, Reason Code, delivery impact review, and required Audit Event details; and high-risk decisions capture actor, timestamp, reason code, note, resulting Report State, and follow-on owner or work item where created.

3. **Given** a report is not currently `Approved`, **when** client delivery is requested or shown as an option, **then** delivery is unavailable; and `Regeneration required` only records that regeneration is needed while `Clarification required` creates or links an internal Follow-up without sending a client-facing request.

4. **Given** a high-risk state change is attempted, **when** the service processes it, **then** an Audit Event is always created — audit write failure prevents the state change from being reported as successful.

## Pre-conditions / Prerequisites

Story 1.2 provides the mutation backend framework (`commitStaffAction`, `getAvailableActions`, idempotency, audit persistence). Story 1.3 provides the workspace page, the assessment review read model with `reportState`, `humanReviewState`, `blockedReasons`, `availableActions`, and the API action endpoint. Story 1.4 provides individual gate finding actions.

The following report-level action IDs already exist in `StaffPortalActionId`: `approveReport`, `rejectReport`, `requestRegeneration`. The action `requestClarification` must be added to match `clarificationRequired` state and AC 2/3.

The brownfield report-state mapper already maps pipeline statuses into governed `ReportState`s including `approved`, `rejected`, `regenerationRequired`, `clarificationRequired`.

## Tasks / Subtasks

### 1. Add `requestClarification` action to domain layer

- [ ] Add `'requestClarification'` to the `StaffPortalActionId` union type in `src/lib/staff-portal/dto.ts`.
- [ ] Add `REQUEST_CLARIFICATION` to `STAFF_ACTIONS` in `src/lib/server/staff-portal/domain/actions.ts` with `requiresReasonCode: true`, `requiresNote: true`, target type `report`.
- [ ] Add transition rule from `inReview` → `clarificationRequired` in the report transition matrix in `src/lib/server/staff-portal/domain/states.ts`.
- [ ] Add `requestClarification` to `ACTIONS_REQUIRING_REASON_CODE` and `ACTIONS_REQUIRING_NOTE` in `domain/actions.ts`.
- [ ] Wire `requestClarification` eligibility in `getAvailableActions` — allowed only when report state is `inReview` and no unresolved blocking findings exist.

### 2. Build approval blocker into `getAvailableActions`

- [ ] In `getAvailableActions`, when computing report-level action descriptors (`approveReport`, `rejectReport`, `requestRegeneration`, `requestClarification`):
  - Check if any linked Gate Findings are unresolved (`open`, `inReview`, `escalatedFurther`, `conflict`).
  - If unresolved blocking findings exist, set `approveReport.enabled = false` and `blockedReason = 'unresolvedBlockingFinding'`.
  - If review note is missing, add `'note'` to `requiredAuditMetadata` for `approveReport`.
  - If audit metadata is incomplete, set `blockedReason = 'auditMetadataRequired'` or add to `requiredAuditMetadata` as appropriate.
  - Verify existing unit tests still pass; add new test cases for the blocker logic.

### 3. Build GuardedActionPanel UI component

- [ ] Create `src/lib/components/staff-portal/GuardedActionPanel.svelte` that renders report-level available actions from `report.actions`.
- [ ] For `approveReport`: show guarded "Approve" button. If blocked (`unresolvedBlockingFinding`), show the blocked reason text (via `BLOCKED_REASON_PRESENTATION`) plus a link back to the unresolved findings section. If enabled, require the approval checklist:
  - Review note (free text, required)
  - Reason Code (select from presentation metadata, required)
  - Delivery impact review (checkbox or confirm toggle, required)
  - Summary of Audit Event details that will be captured
- [ ] For `rejectReport`, `requestRegeneration`, `requestClarification`: inline form collecting `reasonCode` (select) and `reason` (free text), matching the pattern from `GateFindingCard`.
- [ ] Disabled/blocked actions show the blocked reason as visible adjacent text — not colour alone.
- [ ] Use `BLOCKED_REASON_PRESENTATION` for blocked reason display.
- [ ] Expose `data-testid` hooks: `guarded-action-{actionId}`, `guarded-action-blocked-{actionId}`, `guarded-action-submit-{actionId}`.
- [ ] On success: call `onStateChange` callback to update parent state, show success message.
- [ ] On failure: handle `staleState`, `duplicateAction`, `permissionDenied`, `validationFailed`, `auditWriteFailed` error codes inline.

### 4. Wire guarded actions into the workspace page

- [ ] In `src/routes/operator/assessments/[assessmentId]/+page.svelte`, replace the existing static "Available Actions" card (which renders `review.availableActions` as rows) with the `GuardedActionPanel` component.
- [ ] Pass `review.availableActions`, the assessment ID, and the relevant report object.
- [ ] Add a `handleReportStateChange` handler that updates `review.reportState` and `review.blockedReasons` locally on success (matching the pattern from GateFindingCard).
- [ ] Verify the page loads without error and the guarded panel shows the correct actions for both blocked and unblocked states.

### 5. Delivery-gating guardrails (AC 3)

- [ ] Add `canDeliver: boolean` to `StaffAssessmentReviewDto` (or reuse from `GovernedReportDto` pattern) — this is `true` only when `reportState === 'approved'`.
- [ ] In the workspace page, hide or disable any "Deliver to client" button/CTA when `canDeliver === false`.
- [ ] Add a note/banner: "Report must be approved before client delivery is available."
- [ ] If no delivery action exists in MVP, ensure the read model surfaces `canDeliver` so future delivery surfaces respect the guard.

### 6. High-risk decision audit enforcement (AC 4)

- [ ] Verify in `commitStaffAction` that all report-level actions (`approveReport`, `rejectReport`, `requestRegeneration`, `requestClarification`) go through the audit creation path (already enforced by existing framework, verify with a test).
- [ ] Add test: `commitStaffAction` returns `auditWriteFailed` when audit insertion fails for a report-level action.
- [ ] Add test: `getAvailableActions` surfaces `unresolvedBlockingFinding` as blocked reason when unresolved findings exist.

## Implementation Notes

- GateFindingCard's inline action pattern (form with reasonCode/reason, submit to API, handle errors) should be reused for report-level actions.
- The approval checklist is additive to the inline form — it adds a review note, delivery impact toggle, and audit summary preview before the final submit.
- No new route or API endpoint needed — use the existing `/api/operator/assessments/[assessmentId]/actions` endpoint with `targetType: 'report'`.
- Brownfield mapping already handles `approved`, `rejected`, `regenerationRequired`, `clarificationRequired` states — no changes needed there.
- The `unresolvedBlockingFinding` blocked reason code already exists in `BlockedReason` type.

## Files to Create

- `src/lib/components/staff-portal/GuardedActionPanel.svelte`

## Files to Modify

- `src/lib/staff-portal/dto.ts` — add `requestClarification` to `StaffPortalActionId`
- `src/lib/server/staff-portal/domain/actions.ts` — add `REQUEST_CLARIFICATION`, add to reason-code/note lists
- `src/lib/server/staff-portal/domain/states.ts` — add `clarificationRequired` transition from `inReview`
- `src/lib/server/staff-portal/services/get-available-actions.ts` — add blocker check, add clarification action
- `src/lib/server/staff-portal/read-models/get-assessment-review.ts` — add `canDeliver` to DTO
- `src/routes/operator/assessments/[assessmentId]/+page.svelte` — replace static actions card with GuardedActionPanel
- `tests/staff-portal/services/get-available-actions.test.ts` — test blocker
- `tests/staff-portal/services/commit-staff-action.test.ts` — test audit failure for report-level actions

## Dev Agent Record

### Agent Model Used

To be completed by dev agent.

### Debug Log References

### Completion Notes List

### File List
