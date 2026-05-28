# Story 4.4: Due and Overdue Follow-up Surfacing

Status: done

## Story

As an operator,
I want due and overdue follow-ups to surface where I work,
So that client-visible promises and operational commitments are not missed.

## Requirements Covered

FR40, FR41, FR42; NFR4, NFR6; UX-DR4, UX-DR8, UX-DR16

## Acceptance Criteria

### AC1: Due/overdue follow-ups visible in Command Center

**Given** follow-ups are due or overdue
**When** the Command Center read model is derived
**Then** due and overdue follow-ups appear with owner, due date, status, source, consequence of inaction, and client-visible promise indicator
**And** priority treatment reflects due/overdue state without counting completed or passive items as active work.

### AC2: Due/overdue follow-ups visible in Client Profile

**Given** follow-ups are due or overdue for a client
**When** the Client Profile read model is derived
**Then** due and overdue follow-ups appear in the "What Matters Now" panel
**And** the next valid action, owner, and consequence are shown.

### AC3: First-overdue creates Audit Event for client-visible promises

**Given** a follow-up first becomes overdue
**When** overdue detection runs or the relevant read model is derived
**Then** client-visible promises create a first-overdue/missed Audit Event
**And** non-client-visible follow-ups at least create Activity visibility.

### AC4: Priority ordering respects urgency

**Given** multiple follow-ups have different due dates
**When** they are surfaced in Command Center or Client Profile
**Then** overdue items rank above due-soon items, which rank above items with no due date
**And** completed or deferred items are excluded from active work counts.

## Pre-conditions / Prerequisites

- Story 4.1 provides follow-up domain model, repository, DTOs
- Story 4.2 provides FollowUpEditor component and follow-ups API
- Story 4.3 provides createFollowUpForSource and source-context follow-ups
- Epic 2 provides Command Center read model (`getCommandCenterItems`)
- Epic 3 provides Client Profile read model (`getWhatMattersNow`, `getClientProfileSnapshot`)
- Audit Event infrastructure from Epic 1

## Tasks / Subtasks

### Task 1: Follow-up overdue detection service

Create `detectOverdueFollowUps` that:
- Queries open follow-ups with due dates in the past
- Checks if a first-overdue Audit Event already exists (idempotent)
- Creates audit event for client-visible promises, activity entry for others
- Returns list of newly-marked-overdue follow-up IDs

### Task 2: Extend Command Center read model with follow-up items

Update `getCommandCenterItems` to include:
- Follow-ups due within a configurable window (e.g. next 7 days)
- Overdue follow-ups (past due date, status=open)
- Follow-ups with no due date (lowest priority)
- Each item includes owner, due date, source, consequence, client-visible flag

### Task 3: Extend Client Profile / What Matters Now with follow-up urgency

Update `getWhatMattersNow` to include:
- Most urgent open follow-up (overdue first, then nearest due date)
- Show owner, due date, consequence, client-visible indicator
- "No outstanding follow-ups" when none exist

### Task 4: Wire follow-up priority rendering in Command Center UI

Update Command Center console items to render follow-up types:
- Show follow-up status badge (due-soon, overdue, no-date)
- Show client-visible promise indicator
- Navigation from follow-up item to Client Profile → FollowUpEditor

## File List

- `src/lib/server/staff-portal/services/detect-overdue-follow-ups.ts` (new)
- `src/lib/server/staff-portal/read-models/get-command-center-items.ts` (extend)
- `src/lib/server/staff-portal/read-models/get-what-matters-now.ts` (extend)
- `src/lib/staff-portal/dto.ts` (verify/extend)
- `tests/staff-portal/services/detect-overdue-follow-ups.test.ts` (new)
- `tests/staff-portal/read-models/get-command-center-items.test.ts` (extend)
- `tests/staff-portal/read-models/get-what-matters-now.test.ts` (extend)

## Dev Agent Record

### Previous Story Learnings (Story 4.3)

- Source-context follow-ups validate source-object links before creating
- requestClarification on a report auto-creates a follow-up with source=human_review
- Follow-up creation errors after a successful audit write are non-blocking
- Service pattern: validate → persist → return result with DTO shape
- Tests use createMemoryDb with inline SCHEMA for isolation
