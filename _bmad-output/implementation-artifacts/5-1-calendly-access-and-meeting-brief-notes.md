# Story 5.1: Calendly Access and Meeting Brief Notes

Status: done

## Implementation Notes

- Fixed pre-existing bug in commercial-audit.service.ts where owner-only changes were not reflected in receipt resultingState
- Created migration 0024_site_settings.sql for Calendly link storage
- Created tests/staff-portal/routes/meeting-brief-api.test.ts (8 tests) covering CRUD, transitions, calendly config, DTO shape

## Story

As an operator,
I want to access scheduling context and maintain manual meeting brief notes,
So that meetings can be prepared without relying on an automated meeting system.

## Requirements Covered

FR43, FR44, FR46; NFR4; UX-DR9, UX-DR25, UX-DR30

## Acceptance Criteria

### AC1: Calendly link from client meeting surfaces

**Given** a relevant client meeting surface is displayed
**When** Calendly access is available
**Then** the configured Calendly link is accessible from the surface
**And** the link is presented as scheduling context, not as an automated booking workflow inside Staff Portal.

### AC2: Meeting Brief notes CRUD

**Given** an operator creates or updates Meeting Brief notes
**When** they save meeting date/time, objective, talking points, sensitive issues, offer or next step to discuss, follow-up intention, final agenda or agenda notes, or manual prep checklist
**Then** the notes are linked to the client and persisted as staff-entered meeting context
**And** draft notes remain visually distinct from committed state until saved.

## Pre-conditions / Prerequisites

- Client Profile snapshot read model (Epic 3) exists
- Client Profile page has What Matters Now panel and activity sections
- No meeting brief table or repository exists yet — must be created

## Tasks / Subtasks

### Task 1: Meeting briefs schema and repository

- Create `meeting_briefs` table migration
- Fields: id, assessment_id, meeting_date, objective, talking_points, sensitive_issues, offer_next_step, follow_up_intention, final_agenda_notes, prep_checklist, status (draft/needs_staff_review/ready/stale_refresh_needed/completed), linked_report_id, staleness_trigger, created_at, updated_at
- Repository: `findMeetingBriefByAssessment`, `upsertMeetingBrief`, `insertMeetingBrief`

### Task 2: Calendly settings model

- Add `calendly_link` to a settings/configuration table (or use a simple site config / env var lookup)
- Service function: `getCalendlyLink()` — returns configured URL or null

### Task 3: Meeting surface on Client Profile

- Add a "Meeting Brief" section to the Client Profile page
- Shows Calendly link when configured
- Shows editable fields from AC2
- Draft/committed visual distinction for unsaved changes

### Task 4: What Matters Now integration

- Extend `deriveWhatMattersNow` to detect when a client has a meeting brief with no meeting date set (treatment: `flag`)
- Show "Set meeting date/time" as a reminder action

## File List

- `src/lib/server/staff-portal/repositories/meeting-brief.repository.ts` (new)
- `src/lib/server/staff-portal/services/calendly.service.ts` (new)
- `src/lib/server/staff-portal/domain/meeting-brief-states.ts` (new)
- `src/routes/api/operator/assessments/[assessmentId]/meeting-brief/+server.ts` (new)
- `src/lib/staff-portal/dto.ts` (extend)
- Client Profile page (extend)
- `deriveWhatMattersNow` (extend)
- `tests/staff-portal/` (new test file)

## Dev Agent Record

### Previous Epic Learnings (Epic 4 pattern)

- Repository pattern with async db, SQLite-compatible queries
- DTO types in `src/lib/staff-portal/dto.ts` with `StaffFollowUpDto` as template for `MeetingBriefDto`
- `deriveWhatMattersNow` in profile read model — extend for meeting brief state
- Command Center items (epic 2) — extend for meeting brief work items in later stories
- Follow-up linking pattern — new meeting briefs can create follow-ups in later stories
