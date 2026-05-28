# Story 2.1: Command Center Priority Read Model

Status: done

## Story

As an operator,
I want the Command Center to show only work with a valid next action,
So that I can focus on the most important operational decisions today.

## Requirements Covered

FR1, FR2, FR3, FR5, FR6; NFR4; UX-DR1, UX-DR2, UX-DR15

## Acceptance Criteria

1. **Given** operational work exists across report review, follow-up, meeting brief, blocker, and commercial next-step domains, **when** the Command Center read model is derived, **then** items are ordered using the MVP priority order and passive metrics are excluded unless a valid next action exists; and bounded indexed queries avoid N+1 aggregation and apply list limits or pagination where needed.

2. **Given** a work item is eligible for the Command Center, **when** it is returned to the UI, **then** it includes client, current state, owner, due date or age when applicable, why it matters, consequence of inaction, priority reason, and next safe action; and all DTO fields are camelCase, serializable, and free of raw DB rows or server imports.

## Pre-conditions / Prerequisites

Epic 1 provides the Staff Portal foundation:
- Domain types in `src/lib/server/staff-portal/domain/`: `states.ts`, `actions.ts`, `roles.ts`
- Client-safe DTOs and presentation maps in `src/lib/staff-portal/dto.ts`
- Brownfield mappers in `src/lib/server/staff-portal/mappers/`: `brownfield-report-state.ts`, `gate-finding-state.ts`
- Action services: `get-available-actions.ts`, `commit-staff-action.ts`
- Existing queue read model: `read-models/list-report-review-queue.ts`
- Staff audit repositories and migration (`0017_staff_portal_action_audit_events.sql`)

The existing `StaffReportReviewQueueItemDto` in `dto.ts` provides the base pattern for queue item DTOs. Story 2-1 extends the read-model layer with a new `getCommandCenterItems(...)` read model that aggregates across report review, follow-up, meeting brief, and commercial work domains with priority ordering.

Follow-up, Meeting Brief, and Commercial Next Step domain states/tables do not exist yet — the Command Center read model for MVP prioritises from the existing pipeline/review/assessment data that is available, with domain-specific work types added as future epics build their read models.

## MVP Priority Order

The MVP Command Center derives priority from available brownfield data. Items are ordered by:

1. **Escalated/human_assist reports** — reports requiring human intervention (blocked, escalated, or human assist flagged)
2. **Delayed/stalled reports** — generation stalled or pipeline delays
3. **Generated reports needing review** — reports ready for review with no blocking findings
4. **Completed reports needing delivery decision** — pipeline completed but no approval evidence
5. **Routine/aged items** — items growing in age with no active blocker

Each item exposes a `priorityReason` string explaining why it appears at its position.

## Tasks / Subtasks

- [x] Create Command Center DTO types (AC: 2)
  - [x] Add `StaffCommandCenterItemDto` to `src/lib/staff-portal/dto.ts`
  - [x] Add `WorkItemType` type union to DTO
  - [x] Add `StaffCommandCenterResultDto` with `items`, `total`, `hasMore`
  - [x] Keep all DTOs serializable, camelCase, free of server imports

- [x] Create `getCommandCenterItems` read model (AC: 1)
  - [x] Create `src/lib/server/staff-portal/read-models/get-command-center-items.ts`
  - [x] Implement bounded query with LIMIT/OFFSET, avoid N+1
  - [x] Apply MVP priority ordering: escalated → delayed → generated → completed → routine
  - [x] Apply role filtering: admin sees all; operator sees assigned + shared-queue
  - [x] Filter passive metrics: lifecycle-blocked items excluded

- [x] Add route to expose Command Center data (AC: 2)
  - [x] Create `src/routes/operator/assessments/command-center/+page.server.ts`
  - [x] Apply auth/role checks, return governed DTOs, keep route thin

- [x] Write comprehensive tests (AC: 1, 2)
  - [x] Create `tests/staff-portal/read-models/get-command-center-items.test.ts`
  - [x] Test priority ordering, passive metric exclusion, role filtering, pagination, empty state, DTO shape, priority reasons, consequences
  - [x] 11 tests passing, zero regressions in 98 total staff-portal tests

## Dev Notes

### Architecture Context

The Command Center read model follows the pattern already established in `list-report-review-queue.ts`:

```ts
export interface ListReportReviewQueueInput {
  db: AsyncDb;
  actorId: string;
  role: 'admin' | 'operator';
  limit?: number;
  offset?: number;
}

export interface ListReportReviewQueueResult {
  items: StaffReportReviewQueueItemDto[];
  total: number;
  hasMore: boolean;
}
```

`getCommandCenterItems` extends this pattern with MVP priority ordering across report review items. Follow-up, meeting brief, and commercial next-step items can be added as domain-specific read models are built in later stories.

### MVP Priority Order

The `ORDER BY` clause should use a CASE expression:

```sql
ORDER BY
  CASE priority_group
    WHEN 'escalated' THEN 1
    WHEN 'delayed' THEN 2
    WHEN 'generated' THEN 3
    WHEN 'completed' THEN 4
    ELSE 5
  END,
  ps.created_at ASC
```

Priority groups are derived from `mapBrownfieldReportState()` output:
- `escalated`: state === 'escalated' (human_assist pipeline status)
- `delayed`: state === 'delayed'
- `generated`: state === 'generated' (ready pipeline status, no approval evidence)
- `completed`: state === 'generated' with pipeline 'completed' (needs delivery decision)
- `routine`: everything else with an enabled action

### Where to add code

| What | Path | Action |
|------|------|--------|
| DTO types | `src/lib/staff-portal/dto.ts` | Extend with new types |
| Read model | `src/lib/server/staff-portal/read-models/get-command-center-items.ts` | Create new file |
| Route | `src/routes/operator/assessments/command-center/+page.server.ts` | Create new route |
| Tests | `tests/staff-portal/read-models/get-command-center-items.test.ts` | Create new test file |

### Existing code patterns to follow

- **DB query pattern**: Use `input.db.queryAll<T>(sql, ...params)` and `input.db.queryOne<T>(sql, ...params)` for bounded queries (see `list-report-review-queue.ts`)
- **Row type**: Define a local `QueueQueryRow` interface inside the read model file
- **Role filtering**: Admin sees all; operator filters by `(har.operator_id IS NULL OR har.operator_id = ?)`
- **Governed state mapping**: Use `mapBrownfieldReportState()` from `../mappers/brownfield-report-state`
- **Action eligibility**: Use `getAvailableActions()` from `../services/get-available-actions`
- **DTO construction**: Build DTOs from governed state, never from raw DB fields directly

### Testing patterns

Follow the existing test at `tests/staff-portal/read-models/get-assessment-review.test.ts`:
- Use `describe`/`it`/`expect` from Vitest
- Use the test builders from `src/lib/server/staff-portal/testing/builders.ts`
- Set up D1-compatible test fixtures
- Test each priority tier in order

### What NOT to do

- Do NOT introduce generic command registry, workflow engine, plugin system, or global event bus
- Do NOT use Tailwind, shadcn, or third-party UI kits
- Do NOT introduce follow-up, meeting brief, or commercial next-step domain tables/services — those are Epic 4 and Epic 5
- Do NOT expose raw `pipeline_status`, `gateStatus`, or `rawStatus` in DTOs
- Do NOT compute action eligibility in route handlers or UI components
- Do NOT add `reviewer`, `sales`, or `manager` roles

## Dev Agent Record

### Agent Model Used

Claude (via pi-coding-agent)

### Debug Log References

- Initial implementation failed because `getAvailableActions` requires `providedAuditMetadata` to enable actions; all actions were disabled by missing audit metadata.
- Fixed by changing passive metric filtering from "no enabled action" to "lifecycle-blocked action" — audit-metadata-blocked is expected in list context.
- `mapBrownfieldReportState` maps `pipelineStatus: 'ready'` with `artifactPresent: true` and `approvalEvidence: false` to `generated` state with `approvalEvidenceRequired` blocked reason.
- `getAvailableActions` for `generated` state returns approveReport (lifecycle-enabled, audit-metadata-blocked), rejectReport, requestRegeneration, requestClarification.

### Completion Notes List

✅ Created `StaffCommandCenterItemDto`, `WorkItemType`, `StaffCommandCenterResultDto` in `src/lib/staff-portal/dto.ts`
✅ Created `getCommandCenterItems` read model in `src/lib/server/staff-portal/read-models/get-command-center-items.ts`
✅ Created thin route at `src/routes/operator/assessments/command-center/+page.server.ts`
✅ Wrote 11 tests covering priority ordering, passive metric exclusion, role filtering, pagination, empty state, DTO shape, priority reasons, and consequences
✅ All 98 staff-portal tests pass (12 test files, zero regressions)

### File List

- `src/lib/staff-portal/dto.ts` — extended with Command Center DTOs
- `src/lib/server/staff-portal/read-models/get-command-center-items.ts` — new read model
- `src/routes/operator/assessments/command-center/+page.server.ts` — new thin route
- `tests/staff-portal/read-models/get-command-center-items.test.ts` — new test file
