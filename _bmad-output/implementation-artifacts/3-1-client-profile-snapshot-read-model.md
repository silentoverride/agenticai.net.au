# Story 3.1: Client Profile Snapshot Read Model

Status: done

## Story

As an operator,
I want a governed Client Profile snapshot,
So that I can understand a client's operational state quickly.

## Requirements Covered

FR7, FR15, FR63, FR64; NFR3, NFR7; UX-DR5, UX-DR32, UX-DR33

## Acceptance Criteria

1. **Given** a permitted client or assessment is opened, **when** the Client Profile read model loads, **then** it includes business name, owner, journey stage, risk/value flags, current Report State, Human Review State, Meeting Brief State, Follow-up State, and Commercial Next Step Status; and the profile avoids conflicting lifecycle names across Client Profile, Command Center, and Human Review.

2. **Given** profile data is missing, stale, degraded, loading, error, or permission-denied, **when** the page renders, **then** the state is visible, accessible, and non-leaking; and state-changing actions are blocked or warned according to the server-provided action descriptors.

## Pre-conditions / Prerequisites

Epic 1 and Epic 2 provide the Staff Portal foundation:
- Domain types in `src/lib/server/staff-portal/domain/`: `states.ts`, `actions.ts`, `roles.ts`
- Client-safe DTOs and presentation maps in `src/lib/staff-portal/dto.ts`
- Brownfield mappers in `src/lib/server/staff-portal/mappers/`
- Action services: `get-available-actions.ts`, `commit-staff-action.ts`
- Existing queue and command center read models
- Staff audit repositories and migration (`0017_staff_portal_action_audit_events.sql`)
- `StaffReportReviewQueueItemDto`, `StaffCommandCenterItemDto` pattern DTOs in `dto.ts`

Follow-up, Meeting Brief, and Commercial Next Step domain states/tables do not yet exist — the Client Profile snapshot read model should derive placeholder/absent states for these domains (e.g., `not_available` or `no_data`) and gracefully handle null/missing data across all domain sections.

The existing `/operator/assessments/[assessmentId]` route family provides the route namespace pattern.

## Tasks / Subtasks

- [ ] Create Client Profile DTO types (AC: 1)
  - [ ] Add `StaffClientProfileSnapshotDto` to `src/lib/staff-portal/dto.ts`
  - [ ] Include fields: `clientId`, `businessName`, `ownerName`, `journeyStage`, `riskFlags`, `valueFlags`, `reportState`, `humanReviewState`, `meetingBriefState`, `followUpState`, `commercialNextStepStatus`
  - [ ] Add `StaffClientProfileResultDto` with `profile`, `hasData`, `degradedFields[]`, `errorCode?`
  - [ ] Keep all DTOs serializable, camelCase, free of server imports

- [ ] Create `getClientProfileSnapshot` read model (AC: 1)
  - [ ] Create `src/lib/server/staff-portal/read-models/get-client-profile-snapshot.ts`
  - [ ] Aggregate from existing assessments, pipeline_status, reports, and audit tables
  - [ ] Derive report state via brownfield mappers from Epic 1
  - [ ] Derive human review state from existing `human_assist_reviews`
  - [ ] Set follow-up, meeting brief, and commercial states as `not_available` for MVP (pre-requisite domains)
  - [ ] Apply role filtering: admin sees full detail; operator sees permitted clients

- [ ] Create route to expose Client Profile data (AC: 1, 2)
  - [ ] Create `src/routes/operator/assessments/[assessmentId]/profile/+page.server.ts` (or extend existing assessment route)
  - [ ] Apply auth/role checks using existing operator-auth helpers
  - [ ] Return governed DTO, keep route thin
  - [ ] Handle all error states: loading, missing, stale, degraded, permission-denied

- [ ] Write comprehensive tests (AC: 1, 2)
  - [ ] Create `tests/staff-portal/read-models/get-client-profile-snapshot.test.ts`
  - [ ] Test: populated profile with all fields, missing domain states, permission-denied/role filtering, degraded data, empty/null client, DTO shape, error states
  - [ ] Verify lifecycle names are consistent with Command Center and Human Review DTOs

## Dev Notes

### Architecture Context

The Client Profile snapshot follows the same read-model pattern as `list-report-review-queue.ts` and `get-command-center-items.ts`:

```ts
export interface GetClientProfileSnapshotInput {
  db: AsyncDb;
  actorId: string;
  actorRole: StaffRole;
  clientId: string; // or assessmentId
}

export interface StaffClientProfileSnapshotDto {
  clientId: string;
  businessName: string;
  ownerName: string;
  journeyStage: string;
  riskFlags: string[];
  valueFlags: string[];
  reportState: ReportState;
  humanReviewState: HumanReviewState;
  meetingBriefState: MeetingBriefState | 'not_available';
  followUpState: FollowUpState | 'not_available';
  commercialNextStepStatus: CommercialNextStepStatus | 'not_available';
}

export interface StaffClientProfileResultDto {
  profile: StaffClientProfileSnapshotDto | null;
  hasData: boolean;
  degradedFields: string[];
  errorCode: 'not_found' | 'permission_denied' | 'stale_data' | 'degraded' | null;
}
```

### Scope Boundary

This story creates the Client Profile snapshot read model and its governing DTO only. It does not build the profile UI page, What Matters Now panel, linked reports/findings section, activity/audit history, or continuity layout. Those are later stories in this epic.

The read model must be designed to be extensible: later stories will add the What Matters Now derivation, linked reports context, audit history, and follow-up/meeting/commercial sections. The DTO should use optional/nullable fields for domains not yet implemented.

### Architecture Guardrails

- Extend the existing SvelteKit 2 / Svelte 5 / Cloudflare Pages app; no new starter or framework. [Source: architecture.md]
- Server-only business rules under `src/lib/server/staff-portal/**`; routes remain thin. [Source: architecture.md]
- Client-safe DTOs in `src/lib/staff-portal/dto.ts`; camelCase, serializable, no server imports. [Source: architecture.md]
- Raw pipeline/gate/review status must be mapped into governed state before building DTOs. [Source: architecture.md]
- Role checks via existing `operator-auth.ts`; only `admin` and `operator` roles. [Source: architecture.md]
- `admin` sees full client detail; `operator` sees only permitted clients. [Source: UX-DR33, architecture.md]
- Bounded queries with indexed D1 access; avoid N+1 aggregation. [Source: architecture.md]
- Use existing `event.platform.env` for D1 binding access; do not rely on `process.env`. [Source: architecture.md, db.ts]
- No Tailwind, shadcn, Prisma, Hono, Lucia, workflow engine, or dashboard framework. [Source: architecture.md]
- DTO lifecycle terms must match Command Center and Human Review exactly. [Source: NFR3]

### Existing Code Context to Preserve

- `src/lib/server/db.ts` owns the async D1/local SQLite facade. [Source: `src/lib/server/db.ts`]
- `src/lib/server/operator-auth.ts` restricts operator surfaces to `operator` and `admin`. [Source: `src/lib/server/operator-auth.ts`]
- Existing raw sources include `pipeline_status`, `assessments`, `reports`, and `clients`. [Source: migrations]
- Follow-up, Meeting Brief, and Commercial Next Step tables do not exist in MVP yet. [Source: architecture.md, epics.md]
- Existing assessment route at `/operator/assessments/[assessmentId]` provides namespace pattern. [Source: existing routes]

### Suggested File Structure

```text
src/lib/staff-portal/
  dto.ts                          # ← add StaffClientProfileSnapshotDto, StaffClientProfileResultDto

src/lib/server/staff-portal/
  read-models/
    get-client-profile-snapshot.ts # NEW - client profile aggregation
    list-report-review-queue.ts    # existing
    get-command-center-items.ts    # existing

tests/staff-portal/
  read-models/
    get-client-profile-snapshot.test.ts  # NEW
```

### Testing

Testing should cover:
1. **Populated profile**: all fields return correctly from existing data sources
2. **Missing domain states**: follow-up/meeting/commercial return `not_available` gracefully
3. **Permission denied**: operator cannot access restricted client; non-leaking error
4. **Degraded data**: stale or missing data sources produce degraded state with clear field list
5. **Empty/null client**: profile returns `hasData: false` with clear error
6. **DTO shape**: all fields camelCase, no server imports, serializable
7. **Lifecycle consistency**: report state, human review state use same vocabulary as Command Center

### Implementation Sequence

1. Add DTO types to `src/lib/staff-portal/dto.ts`
2. Create `get-client-profile-snapshot.ts` read model with aggregation from existing data sources
3. Create route handler at `src/routes/operator/assessments/[assessmentId]/profile/+page.server.ts`
4. Write tests in `tests/staff-portal/read-models/get-client-profile-snapshot.test.ts`
5. Run `vitest run tests/staff-portal`
6. Run `npm run check`
