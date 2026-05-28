# Story 4.5: Follow-up Audit Receipts and Failure States

Status: done

## Story

As an admin,
I want follow-up changes to produce audit evidence and clear failure states,
So that commitment history remains trustworthy.

## Requirements Covered

FR42, FR57, FR58, FR61, FR62; NFR2, NFR5; UX-DR22, UX-DR23, UX-DR31, UX-DR41

## Acceptance Criteria

### AC1: Follow-up changes create Audit Events

**Given** a follow-up is created, completed, deferred, reassigned, or has its due date changed
**When** persistence succeeds
**Then** Staff Portal creates an Audit Event where required and displays a receipt or visible success state from the persisted record
**And** duplicate submissions do not create duplicate audit events.

### AC2: Failure states with recovery guidance

**Given** a follow-up action fails because of permission, stale state, validation, duplicate submission, or audit write failure
**When** the UI receives the error
**Then** the prior state remains visible, recovery guidance is shown, and the error is announced or discoverable for assistive technology.

## Pre-conditions / Prerequisites

- Story 4.1 provides follow-up domain model, repository, `commitFollowUpAction` service, DTOs
- Story 4.2 provides FollowUpEditor component and follow-ups API routes
- Story 1.2 provides staff_action_audit_events table and audit infrastructure
- Story 1.5 provides guarded action decision flow pattern

## Tasks / Subtasks

### Task 1: Audit event recording on follow-up state changes

Update `commitFollowUpAction` to:
- Create a `follow_up_change` audit event on every successful state transition
- Include target ID, from_state, to_state, actor, reason/note
- Use idempotency_key to prevent duplicate audit events on retry

### Task 2: Follow-up receipt DTO

Extend the follow-up API to return a receipt DTO on successful actions:
- `FollowUpActionReceiptDto` with action, followUpId, previousStatus, resultingStatus, auditReference, createdAt
- UI surfaces the receipt as a success indicator

### Task 3: Error handling and recovery guidance

Ensure follow-up action error responses include:
- `currentState` (the persisted state that is still visible)
- `remediationHint` (what the operator can do next)
- Error announced or discoverable for assistive tech

### Task 4: Stale/validation guard checks

Add stale-state guard:
- Read current follow-up status before applying action
- Return `staleState` error with current state if the expected state doesn't match

## File List

- `src/lib/server/staff-portal/services/commit-follow-up-action.ts` (extend)
- `src/lib/server/staff-portal/repositories/follow-up.repository.ts` (verify/extend)
- `src/routes/api/operator/assessments/[assessmentId]/follow-ups/+server.ts` (extend)
- `src/lib/staff-portal/dto.ts` (verify/extend)
- `tests/staff-portal/services/commit-follow-up-action.test.ts` (extend)

## Dev Agent Record

### Previous Story Learnings (Story 4.4)

- Overdue detection is a separate service call, not integrated into read models — it's called by Command Center / Profile pipelines at query time
- Command Center read model now merges report and follow-up items with priority ordering
- deriveWhatMattersNow accepts `mostUrgentFollowUp` for detailed follow-up urgency
- StaffActionReceiptDto pattern from Epic 1 provides the template for audit receipts
