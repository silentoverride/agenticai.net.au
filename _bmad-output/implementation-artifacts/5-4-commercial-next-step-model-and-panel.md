# Story 5.4: Commercial Next Step Model and Panel

Status: ready-for-dev

## Story

As an operator,
I want to record a staff-entered commercial next step,
So that commercial continuity is visible without becoming a CRM or AI score.

## Requirements Covered

FR51, FR52, FR53, FR55; NFR3; UX-DR10, UX-DR26, UX-DR43

## Acceptance Criteria

### AC1: Commercial Next Step record and statuses

**Given** a Client Profile or consultation handoff surface is displayed
**When** the operator records a Commercial Next Step
**Then** Staff Portal supports status values: no_action, nurture, discuss_offer, send_follow_up, create_future_opportunity
**And** the record includes owner and notes
**And** the UI makes clear that the next step is staff-entered and operational (not AI-scored).

### AC2: CommercialNextStepPanel states

**Given** CommercialNextStepPanel renders
**When** staff view or edit it
**Then** it supports states: missing, draft, active, needs_follow_up, completed, deferred, cancelled, stale
**And** it avoids AI scoring, probability, pipeline stage management, sales analytics, productivity tracking, and CRM framing.

## Pre-conditions / Prerequisites

- Story 5.3 provides MeetingBriefPanel component extraction pattern
- Client Profile page structure is established

## Tasks / Subtasks

### Task 1: Commercial Next Step domain and DTO

- Define `CommercialNextStepState` type with statuses: no_action, nurture, discuss_offer, send_follow_up, create_future_opportunity
- Define panel display states: missing, draft, active, needs_follow_up, completed, deferred, cancelled, stale
- Define `CommercialNextStepDto` interface (id, assessmentId, status, owner, notes, createdAt, updatedAt)

### Task 2: Repository and migration

- Create migration for `commercial_next_steps` table
- Create repository with CRUD operations: insert, update, findByAssessment

### Task 3: GET/PUT API route

- `GET /api/operator/assessments/[assessmentId]/commercial-next-step`
- `PUT /api/operator/assessments/[assessmentId]/commercial-next-step`
- Validation that status is one of the allowed values
- No AI-related fields accepted

### Task 4: CommercialNextStepPanel component

- Display panel on Client Profile showing: current status, owner, notes
- Inline edit: dropdown for status, text input for owner, textarea for notes
- Save via PUT route
- Panel states: loading, empty/missing, populated, validation error, saving, stale (30+ days idle)

### Task 5: Tests

- Repository CRUD tests
- Route integration tests
- Display state tests

## File List

- `src/lib/staff-portal/dto.ts` (extend — add CommercialNextStep types)
- `src/lib/server/staff-portal/domain/commercial-next-step-states.ts` (new)
- `src/lib/server/staff-portal/repositories/commercial-next-step.repository.ts` (new)
- `src/routes/api/operator/assessments/[assessmentId]/commercial-next-step/+server.ts` (new)
- `src/lib/components/staff-portal/CommercialNextStepPanel.svelte` (new)
- `src/lib/components/staff-portal/ClientProfile.svelte` (extend — add panel)
- `tests/staff-portal/repositories/commercial-next-step.repository.test.ts` (new)
- `tests/staff-portal/routes/commercial-next-step-api.test.ts` (new)
