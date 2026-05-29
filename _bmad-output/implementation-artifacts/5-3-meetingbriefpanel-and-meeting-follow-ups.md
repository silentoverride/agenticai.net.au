# Story 5.3: MeetingBriefPanel and Meeting Follow-ups

Status: done

## Story

As an operator,
I want Meeting Brief preparation and follow-up creation in one safe panel,
So that meeting context can lead to accountable next steps.

## Requirements Covered

FR46, FR49, FR50; NFR4, NFR5; UX-DR25

## Acceptance Criteria

### AC1: MeetingBriefPanel comprehensive display

**Given** Meeting Brief data is available on Client Profile
**When** MeetingBriefPanel renders
**Then** it shows meeting objective, talking points, sensitive issues, offer/next step, generated or updated timestamp, freshness, unresolved blockers, linked report/review state, readiness checklist, and mark-ready controls
**And** freshness, readiness, and blocked state are visible text and announced or discoverable when changed.

### AC2: Follow-up creation from Meeting Brief

**Given** staff create a follow-up from Meeting Brief notes
**When** the follow-up is saved
**Then** it is linked to the client and meeting brief source context
**And** an Audit Event records follow-up creation from meeting notes.

## Pre-conditions / Prerequisites

- Story 5.1 provides meeting brief repository, domain states, API route with GET/PUT
- Story 5.2 provides readiness validation, staleness detection, audit events for status changes
- Story 4.1 provides follow-up commitment model and `insertFollowUp`, `findFollowUpsByAssessment`
- Story 4.2 provides FollowUpEditor component pattern

## Tasks / Subtasks

### Task 1: Extract MeetingBriefPanel component

- Extract the meeting brief section from ClientProfile.svelte into its own component
- Accept props: meetingBrief, staleWarning, calendlyLink, assessmentId
- Include staleness warning banner, read-only content card, status badge, freshness timestamp
- Use data-testid attributes for test targeting

### Task 2: Readiness checklist and mark-ready controls

- Add a collapsible readiness section showing: status transitions, linked report state, staleness check
- "Mark Ready" button that calls PUT with status='ready'
- Show blocked reason if report not approved, with exception reason text input
- Show success/error feedback after action
- Accessibility: keyboard-operable, screen-reader announcements

### Task 3: Follow-up creation from meeting brief

- "Create Follow-up from Notes" button that opens a follow-up creation form
- Pre-populate with meeting brief notes as source context
- Save creates follow-up linked to assessment and meeting brief source
- Audit event records follow-up creation from meeting notes

### Task 4: Wire into ClientProfile

- Replace inline meeting brief section with MeetingBriefPanel
- Pass all required props from page data

### Task 5: Tests

- Unit tests for follow-up creation from meeting brief audit event
- Component tests for MeetingBriefPanel display states

## File List

- `src/lib/components/staff-portal/MeetingBriefPanel.svelte` (new)
- `src/lib/server/staff-portal/services/meeting-brief-followup.service.ts` (new)
- `src/lib/components/staff-portal/ClientProfile.svelte` (modify — replace inline section)
- `src/routes/operator/assessments/[assessmentId]/profile/+page.svelte` (modify if needed)
- `tests/staff-portal/services/meeting-brief-followup.test.ts` (new)
- `tests/staff-portal/components/meeting-brief-panel.test.ts` (new, optional)

## Dev Agent Record

### Previous Story Learnings (Story 5.2)

- PUT route supports `status`, `linkedReportId`, `exceptionReason`, `idempotencyKey`
- GET route returns `meetingBrief`, `calendly`, `staleWarning`
- State machine transitions defined in `meeting-brief-states.ts`:
  - draft → needsReview, ready, completed
  - needsReview → ready, completed, draft
  - ready → completed, stale, draft
  - stale → draft, needsReview, ready, completed
  - completed → (none — terminal)
- `recordMeetingBriefStatusChange` creates audit events on status changes
- `validateMeetingBriefReady` checks linked report approval
- `checkMeetingBriefStaleness` detects 30+ day idle
