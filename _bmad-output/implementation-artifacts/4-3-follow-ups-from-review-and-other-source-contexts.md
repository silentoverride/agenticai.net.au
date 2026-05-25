# Story 4.3: Follow-ups from Review and Other Source Contexts

Status: ready-for-dev

## Story

As an operator,
I want to create or link follow-ups from operational decisions,
So that clarification and further action are not lost after review, meeting, or commercial work.

## Requirements Covered

FR33, FR34, FR38, FR49, FR54; NFR1, NFR2; UX-DR8, UX-DR24

## Acceptance Criteria

### AC1: Human Review → Follow-up

**Given** a Human Review decision requires clarification or further action,
**When** the operator records `Clarification required` or a follow-on action,
**Then** Staff Portal creates or links an internal Follow-up to the client and relevant report/finding;
**And** no client-facing clarification request is sent in MVP.

### AC2: Follow-up from any supported source

**Given** another supported context requests follow-up creation,
**When** the follow-up source is Client Profile, Human Review decision, Meeting Brief notes, or Commercial Next Step,
**Then** the same Follow-up service validates source, owner, due date, source object link, and consequence;
**And** unsupported source types return structured validation errors.

### AC3 (implied): Clarification-required on Report decision creates follow-up

**Given** an operator submits `Clarification required` on a Report decision,
**When** the guarded action panel confirms the decision,
**Then** `commitStaffAction` creates or links a Follow-up to the client with source `human_review`
**And** the follow-up is linked to the relevant report and/or gate finding;
**And** no audit/state change occurs if follow-up creation fails.

## Pre-conditions / Prerequisites

- Story 4.1 provides follow-up domain model, repository, `commitFollowUpAction` service, DTOs
- Story 4.2 provides FollowUpEditor component and follow-ups API routes (POST, PUT, GET)
- Epic 1 provides `commitStaffAction` service and guarded decision flow (Story 1.5)
- Epic 3 provides Client Profile with placeholder sections (Story 3.5)
- Epic 5 placeholder sections exist for Meeting Brief and Commercial Next Step

## Tasks / Subtasks

### Task 1: Follow-up service extension for source-context creation

- [ ] Add `createFollowUpForSource` service function that:
  - [ ] Accepts a source type and context (assessment_id, actor_id, source object ID)
  - [ ] Delegates to existing `insertFollowUp` repository
  - [ ] Links follow-up to the source object (report_id, gate_finding_id, etc.)
  - [ ] Returns structured error for unsupported source types
  - [ ] Returns created follow-up DTO on success
- [ ] Add idempotency key requirement to follow-up creation when sourced from a decision action

### Task 2: Wire Clarification-required into guarded decision flow (Story 1.5)

- [ ] In `commitStaffAction`, for action `clarificationRequired`
  - [ ] Create audit event for the report decision
  - [ ] Call `createFollowUpForSource` with `source: 'human_review'`
  - [ ] Link follow-up to report_id and (optionally) the specific gate_finding_id
  - [ ] If follow-up creation fails, return error — do not report success
  - [ ] Return receipt with follow-up reference
- [ ] In the Report Workspace guarded action panel, after `Clarification required` submit
  - [ ] Show follow-up details in the decision receipt
  - [ ] Link operator to the new follow-up on Client Profile

### Task 3: Add follow-up creation button/flow to Meeting Brief panel

- [ ] When `MeetingBriefPanel` or placeholder section is implemented (Epic 5)
  - [ ] Add "Create Follow-up" action that opens FollowUpEditor with `source: 'meeting_brief'`
  - [ ] Pass meeting_brief_id as linked object context
  - [ ] On save, call POST `/api/operator/assessments/[id]/follow-ups` with source
  - [ ] Show confirmation after creation

### Task 4: Add follow-up creation requirement to Commercial Next Step (Epic 5)

- [ ] When `CommercialNextStepPanel` is implemented (Story 5.4)
  - [ ] Status `discuss offer` and `send follow-up` require linked follow-up or note
  - [ ] Add follow-up creation flow for commercial context
  - [ ] Wire validation into Commercial Next Step commit action

### Task 5: Validation and error handling

- [ ] Validate source is one of: `client_profile`, `human_review`, `meeting_brief`, `commercial_next_step`
- [ ] For `human_review` source, require report_id or gate_finding_id link
- [ ] Return `validationFailed` error for missing required fields
- [ ] Return `validationFailed` error for unsupported source types
- [ ] Return `blockedAction` error if the source object does not permit follow-up creation

### Task 6: Write tests

- [ ] Test: create follow-up with `human_review` source links to report
- [ ] Test: create follow-up with `meeting_brief` source links to meeting_brief
- [ ] Test: unsupported source returns validation error
- [ ] Test: `Clarification required` report decision creates audit + follow-up
- [ ] Test: `Clarification required` when follow-up creation fails returns error
- [ ] Test: idempotent follow-up creation — same request hash skips duplicate
- [ ] Test: DTO shape consistency for source-linked follow-ups

## Dev Notes

### Architecture Guardrails

- Follow-up creation from a decision action must go through `commitStaffAction` or an equally guarded service boundary
- The same follow-up service validates source, owner, due date, source object link, and consequence regardless of source [Source: epics.md Story 4.3 AC2]
- No client-facing clarification request is sent in MVP [Source: epics.md Story 4.3 AC1]
- Follow-up creation failure prevents decision from being reported as successful [Source: epics.md Story 4.1 AC, auditWriteFailed pattern]
- Route pattern established in Story 4.2: POST `/api/operator/assessments/[assessmentId]/follow-ups`
- Existing Zod validation schemas from 4.2 API routes extend to support source-context fields

### API Contract Extensions

```ts
// POST /api/operator/assessments/[assessmentId]/follow-ups
// Extended body for source-context creation:
interface CreateFollowUpBody {
  title: string;
  description: string | null;
  ownerId: string | null;
  dueDate: string | null;
  source: 'client_profile' | 'human_review' | 'meeting_brief' | 'commercial_next_step';
  clientVisiblePromise: boolean;
  consequenceOfInaction: string | null;
  notes: string | null;
  // Source-context links:
  reportId?: string;
  gateFindingId?: string;
  meetingBriefId?: string;
  commercialStepId?: string;
}
```

### Implementation Sequence

1. Extend `commitStaffAction` for `clarificationRequired` to create follow-up
2. Wire follow-up creation into existing guarded decision flow on Report workspace
3. Add service function for source-context follow-up creation with validation
4. Write tests
5. Run `vitest run tests/staff-portal/`
6. Run `npm run check`

### Files to Modify

- `src/lib/server/staff-portal/services/commitStaffAction.ts` — add clarificationRequired → follow-up creation
- `src/lib/server/staff-portal/services/commit-follow-up-action.ts` — existing, may extend
- `src/lib/server/staff-portal/repositories/follow-up.repository.ts` — verify insert supports source-object links
- `src/routes/api/operator/assessments/[assessmentId]/follow-ups/+server.ts` — extend POST validation
- `src/lib/staff-portal/dto.ts` — verify CreateFollowUpInput includes source-object fields
- `src/lib/components/staff-portal/FollowUpEditor.svelte` — optionally, accept pre-filled source context as props

### Files to Create

- `src/lib/server/staff-portal/services/create-follow-up-for-source.ts` — new service for source-context creation

### Source References

- [Source: epics.md#Story-43-Follow-ups-from-Review-and-Other-Source-Contexts]
- [Source: epics.md#Story-15-Whole-Report-Guarded-Decisions — clarification required action]
- [Source: epics.md#Story-41-Follow-up-Commitment-Model-and-Actions — follow-up domain model]
- [Source: 4-2-followupeditor-on-client-profile.md — existing API route and component patterns]
- [Source: src/lib/server/staff-portal/services/commitStaffAction.ts — guarded action boundary]

## Dev Agent Record

### Previous Story Learnings (Story 4.2)

- Follow-up API routes follow route → service → repository pattern
- DTOs must be camelCase, serializable, free of DB rows
- Zod validation on API body parsed as `unknown`
- `commitFollowUpAction` handles complete/defer/reassign via `FollowUpActionService`
- Svelte 5 `$state()` and `$derived()` for reactive local state
- `data-testid` hooks on form elements
- svelte-check must be clean before commit

### File List

- `src/lib/server/staff-portal/services/create-follow-up-for-source.ts` (new)
- `src/lib/server/staff-portal/services/commitStaffAction.ts` (modify)
- `src/lib/server/staff-portal/repositories/follow-up.repository.ts` (verify)
- `src/routes/api/operator/assessments/[assessmentId]/follow-ups/+server.ts` (extend)
- `src/lib/staff-portal/dto.ts` (verify)
- `tests/staff-portal/routes/follow-ups-from-sources.test.ts` (new)
