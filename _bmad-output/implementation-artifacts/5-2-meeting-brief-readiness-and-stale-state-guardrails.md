# Story 5.2: Meeting Brief Readiness and Stale-State Guardrails

Status: done

## Story

As an operator,
I want Meeting Brief readiness to reflect report safety and freshness,
So that staff do not use stale or unsafe preparation context.

## Requirements Covered

FR45, FR47, FR48, FR50; NFR1, NFR2, NFR6; UX-DR25, UX-DR27, UX-DR31

## Acceptance Criteria

### AC1: Meeting Brief state transitions

**Given** a Meeting Brief exists
**When** staff set its state
**Then** supported states are draft, needs staff review, ready, stale/refresh needed, and completed
**And** Meeting Brief state changes create Audit Events.

### AC2: Ready state requires approved linked report

**Given** a linked report is not Approved
**When** staff attempt to mark the Meeting Brief ready
**Then** readiness is blocked unless an explicit no-approved-deliverable exception reason is provided
**And** exception use creates an Audit Event.

### AC3: Staleness warnings

**Given** an MVP stale-trigger event occurs after a Meeting Brief is marked ready
**When** the brief is displayed
**Then** Staff Portal warns that it may be stale
**And** stale or incomplete data visibly blocks or warns before use.

## Pre-conditions / Prerequisites

- Story 5.1 provides meeting brief repository, domain states, API route, and profile section
- Story 1.2 provides audit infrastructure (`insertStaffActionAuditEvent`, `staffActionReceiptFromEvent`)

## Tasks / Subtasks

### Task 1: State change audit events

- Extend the meeting brief PUT route to create audit events on state changes
- Use `insertStaffActionAuditEvent` with `meetingBrief` target type
- Idempotency support to prevent duplicate audit events

### Task 2: Ready-state guard (linked report check)

- Before allowing status transition to `ready`, check if `linkedReportId` exists and if the linked report is `approved`
- If not approved, require an `exceptionReason` field
- If exception is provided, create an audit event recording the exception

### Task 3: Staleness detection

- Define stale triggers: linked report state changes, long idle period (>30 days since last update)
- Service function: `checkMeetingBriefStaleness` — returns warning if stale triggers detected
- Extend the GET route to include `staleWarning` in response

### Task 4: UI warnings

- Meeting Brief section shows staleness warning banner when stale
- Ready-state error shows why blocked and exception reason option

## File List

- `src/lib/server/staff-portal/services/meeting-brief-audit.service.ts` (new)
- `src/lib/server/staff-portal/services/meeting-brief-readiness.ts` (new)
- `src/lib/server/staff-portal/services/meeting-brief-staleness.ts` (new)
- `src/routes/api/operator/assessments/[assessmentId]/meeting-brief/+server.ts` (extend)
- `src/lib/components/staff-portal/ClientProfile.svelte` (extend)
- `tests/staff-portal/` (new test file)

## Dev Agent Record

### Previous Story Learnings (Story 5.1)

- Meeting brief repository uses upsert pattern (insert or update based on existence)
- Calendly service reads from site_settings table or env var
- MeetingBriefDto serializes all fields including status
- PUT route currently handles status updates via `updateMeetingBrief`
- The profile page loads meeting brief in a single query
