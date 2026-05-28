# Story 4.1: Follow-up Commitment Model and Actions

Status: done

## Story

As an operator,
I want follow-ups to be explicit commitments with owner, due date, source, and status,
So that operational promises are trackable and auditable.

## Requirements Covered

FR32, FR35, FR36, FR37, FR38, FR39; NFR1, NFR2; UX-DR8, UX-DR24

## Acceptance Criteria

1. **Given** a follow-up is created, **when** staff submit it from a supported source, **then** it records client link, owner, due date, source, consequence of inaction, client-visible promise flag, status, and optional links to report, gate finding, meeting brief, commercial next step, support issue, admin/internal task, or delayed journey state; and validation errors are visible and associated with relevant fields.

2. **Given** a follow-up exists, **when** staff mark it open, completed, deferred with reason, or reassigned, **then** the transition is server-validated through the Staff Portal action boundary; and the previous visible state remains until persistence confirms success.

## Pre-conditions / Prerequisites

- Epic 1 provides Staff Portal foundation: domain types, DTOs, brownfield mappers, action services, audit repository, `commitStaffAction(...)` pattern
- Epic 2 provides Command Center read model patterns
- Epic 3 provides Client Profile layout and context patterns
- Existing `get-available-actions.ts` and `commit-staff-action.ts` provide the action boundary pattern
- Existing `staff_action_audit_events` migration (`0017`) provides audit persistence
- No follow-up table or domain state exists yet — needs migration

## Tasks / Subtasks

- [x] Create follow-up migration
  - [x] Create `migrations/0018_staff_portal_follow_ups.sql`
  - [x] Create `follow_ups` table with: id, assessment_id, title, description, owner_id, due_date, source, source_object_type, source_object_id, status, client_visible_promise, consequence_of_inaction, notes, linked_report_id, linked_gate_finding_id, linked_meeting_brief_id, linked_commercial_step_id, support_issue_ref, admin_task_ref, delayed_journey_state, created_at, updated_at
  - [x] Add migration to local SQLite test schema initialization

- [x] Create follow-up DTOs and domain types
  - [x] Add `FollowUpStatus` union to `src/lib/staff-portal/dto.ts`: 'open' | 'completed' | 'deferred' | 'reassigned'
  - [x] Add `FollowUpSource` union: 'client_profile' | 'human_review' | 'meeting_brief' | 'commercial_next_step' | 'support_issue' | 'admin_task' | 'delayed_journey'
  - [x] Add `StaffFollowUpDto` with all fields from migration, camelCase, serializable
  - [x] Add `CreateFollowUpInput` and `UpdateFollowUpInput` DTOs
  - [x] Add follow-up actions to `StaffPortalActionId`: 'completeFollowUp', 'deferFollowUp', 'reassignFollowUp'
  - [x] Add `FOLLOW_UP_ACTION_PRESENTATION` and `FOLLOW_UP_STATE_PRESENTATION` maps

- [x] Create follow-up domain state and action rules
  - [x] Create `src/lib/server/staff-portal/domain/follow-up-states.ts`
  - [x] Define valid transitions and blocked reasons
  - [x] Define `getAvailableFollowUpActions(...)` following the pattern from `get-available-actions.ts`

- [x] Create follow-up repository
  - [x] Create `src/lib/server/staff-portal/repositories/follow-up.repository.ts`
  - [x] CRUD: `insertFollowUp`, `updateFollowUp`, `findFollowUpById`, `findFollowUpsByAssessment`, `findFollowUpsByOwner`
  - [x] Bounded queries with LIMIT, no N+1

- [x] Create commitFollowUpAction service
  - [x] Create `src/lib/server/staff-portal/services/commit-follow-up-action.ts`
  - [x] Re-checks auth, state, idempotency, creates audit event, returns receipt
  - [x] Follow the `commitStaffAction(...)` pattern

- [x] Write comprehensive tests
  - [x] Create `tests/staff-portal/repositories/follow-up.repository.test.ts`
  - [x] Create `tests/staff-portal/services/commit-follow-up-action.test.ts`
  - [x] Test: create follow-up with all optional links
  - [x] Test: transition open → completed, deferred with reason, reassigned
  - [x] Test: invalid transitions rejected
  - [x] Test: audit event created on transition
  - [x] Test: idempotency prevents duplicate audit events
  - [x] Test: validation errors visible on missing required fields
  - [x] Test: DTO shape, camelCase, no server imports

## Dev Notes

### Follow-Up Migration Schema (0018)

```sql
CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_id TEXT,
  due_date TEXT,
  source TEXT NOT NULL DEFAULT 'client_profile',
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'completed', 'deferred', 'reassigned')),
  client_visible_promise INTEGER NOT NULL DEFAULT 0,
  consequence_of_inaction TEXT,
  notes TEXT,
  linked_report_id TEXT,
  linked_gate_finding_id TEXT,
  linked_meeting_brief_id TEXT,
  linked_commercial_step_id TEXT,
  support_issue_ref TEXT,
  admin_task_ref TEXT,
  delayed_journey_state TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_assessment_id ON follow_ups(assessment_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_owner_id ON follow_ups(owner_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(due_date);
```

### DTO Shape

```ts
export type FollowUpStatus = 'open' | 'completed' | 'deferred' | 'reassigned';
export type FollowUpSource = 'client_profile' | 'human_review' | 'meeting_brief' | 'commercial_next_step' | 'support_issue' | 'admin_task' | 'delayed_journey';

export interface StaffFollowUpDto {
  id: string;
  assessmentId: string;
  title: string;
  description: string | null;
  ownerId: string | null;
  dueDate: string | null;
  source: FollowUpSource;
  status: FollowUpStatus;
  clientVisiblePromise: boolean;
  consequenceOfInaction: string | null;
  notes: string | null;
  linkedReportId: string | null;
  linkedGateFindingId: string | null;
  linkedMeetingBriefId: string | null;
  linkedCommercialStepId: string | null;
  supportIssueRef: string | null;
  adminTaskRef: string | null;
  delayedJourneyState: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFollowUpInput {
  assessmentId: string;
  title: string;
  description?: string;
  ownerId?: string;
  dueDate?: string;
  source: FollowUpSource;
  clientVisiblePromise?: boolean;
  consequenceOfInaction?: string;
  notes?: string;
  linkedReportId?: string;
  linkedGateFindingId?: string;
  linkedMeetingBriefId?: string;
  linkedCommercialStepId?: string;
  supportIssueRef?: string;
  adminTaskRef?: string;
  delayedJourneyState?: string;
}
```

### Architecture Guardrails

- Follow the existing `commitStaffAction(...)` pattern for transitions
- Use existing audit event table; do not create separate follow-up audit storage
- Idempotency: `UNIQUE(actor_id, assessment_id, idempotency_key)` already exists
- Bounded queries: apply LIMIT on all list queries
- Previous visible state must remain until persistence confirms success [Source: AC 2]
- Draft UI state is covered in Story 4.2 — this story creates the server-side model
- No N+1 queries in repository patterns

### Implementation Sequence

1. Create DTOs and domain types in `dto.ts`
2. Create migration `0018_staff_portal_follow_ups.sql`
3. Create `follow-up.repository.ts`
4. Create `follow-up-states.ts` with transition rules
5. Create `commit-follow-up-action.ts`
6. Write tests
7. Run `vitest run tests/staff-portal/`
8. Run `npm run check`
