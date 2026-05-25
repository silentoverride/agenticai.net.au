# Story 5.5: Commercial Follow-up Requirement and Audit

Status: backlog

## Story

As an operator,
I want high-intent commercial statuses to require follow-up continuity,
So that commercial commitments do not become ambiguous.

## Requirements Covered

FR54, FR56, FR57, FR58; NFR1, NFR2; UX-DR21, UX-DR26, UX-DR27

## Acceptance Criteria

### AC1: Follow-up required for high-intent statuses

**Given** Commercial Next Step status is `discussOffer` or `sendFollowUp`
**When** staff save the next step
**Then** the save requires either a linked Follow-up or a note explaining why no Follow-up is needed
**And** validation failures are visible, accessible, and do not change persisted state.

### AC2: Audit events on status/owner changes

**Given** Commercial Next Step status or owner changes
**When** persistence succeeds
**Then** Staff Portal creates an Audit Event and shows persisted success feedback
**And** risky or high-impact commercial actions require proportionate confirmation.

## Pre-conditions / Prerequisites

- Story 5.4 provides Commercial Next Step model, API, and panel
- Story 4.1 provides follow-up model and actions

## Tasks / Subtasks

### Task 1: Follow-up requirement service

- Create service that checks if a commercial status is "high intent"
- On PUT, validate that `discussOffer` or `sendFollowUp` statuses have a followUpNote or are linked to an existing follow-up
- Return validation error with clear message if not satisfied
- Allow bypass with a confirmation flag (`confirmedNoFollowUp: true`)

### Task 2: Audit events for commercial changes

- Create `recordCommercialNextStepChange` service that writes to `staff_action_audit_events`
- Trigger on status or owner change
- Include from/to states in audit event

### Task 3: Update PUT route

- Call follow-up requirement validation before persisting
- Return 400 with structured error if validation fails
- Call audit service after successful persistence
- Handle idempotency

### Task 4: Update CommercialNextStepPanel

- Add confirmation dialog when saving high-intent status without follow-up
- Show inline note field for "no follow-up needed" explanation
- Display audit receipt after save

### Task 5: Tests

- Service tests for follow-up requirement logic
- Route integration tests
- Panel state tests

## File List

- `src/lib/server/staff-portal/services/commercial-followup-requirement.service.ts` (new)
- `src/lib/server/staff-portal/services/commercial-audit.service.ts` (new)
- `src/routes/api/operator/assessments/[assessmentId]/commercial-next-step/+server.ts` (modify — add validation + audit)
- `src/lib/components/staff-portal/CommercialNextStepPanel.svelte` (modify — confirm dialog + audit display)
- `tests/staff-portal/services/commercial-followup-requirement.test.ts` (new)
- `tests/staff-portal/services/commercial-audit.test.ts` (new)
