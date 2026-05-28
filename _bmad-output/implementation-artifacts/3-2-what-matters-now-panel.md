# Story 3.2: What Matters Now Panel (Read Model)

Status: done

## Story

As an operator,
I want the Client Profile to show what matters now,
So that I can identify the current blocker and next valid action immediately.

## Requirements Covered

FR8; NFR3, NFR4; UX-DR5, UX-DR18, UX-DR20

## Acceptance Criteria

1. **Given** a client has operational work or blockers, **when** the Client Profile renders, **then** the "What Matters Now" panel names the current blocker, next valid action, owner, due date if applicable, and consequence of ignoring it; and state precedence follows Blocked → Requires Decision → At Risk → Draft/Stale → Ready → Completed.

2. **Given** multiple states apply to the same client, **when** the panel decides the primary treatment, **then** the highest-precedence state controls primary messaging and available action display; and the source domain remains clear to staff.

## Pre-conditions / Prerequisites

- Story 3.1 provides the Client Profile snapshot read model (`getClientProfileSnapshot`)
- Epic 1 provides report state, human review state, action descriptors, and `getAvailableActions(...)`
- Epic 2 provides Command Center priority ordering patterns
- Follow-up, Meeting Brief, and Commercial Next Step domain states use `not_available` until those epics deliver

## Tasks / Subtasks

- [ ] Create What Matters Now DTO types (AC: 1)
  - [ ] Add `StaffWhatMattersNowDto` to `src/lib/staff-portal/dto.ts`
  - [ ] Include: `primaryTreatment`, `blockerName`, `blockerType`, `nextValidAction`, `nextActionRoute`, `ownerName`, `dueDate`, `consequenceOfInaction`, `sourceDomain`, `precedenceLevel`
  - [ ] Add `BlockerInfoDto` for structured blocker presentation
  - [ ] Keep all DTOs serializable, camelCase, free of server imports

- [ ] Create `deriveWhatMattersNow` read model (AC: 1, 2)
  - [ ] Create `src/lib/server/staff-portal/read-models/derive-what-matters-now.ts`
  - [ ] Derive priority from client's aggregated state across all domain sections
  - [ ] Apply state precedence: Blocked → Requires Decision → At Risk → Draft/Stale → Ready → Completed
  - [ ] Map highest-precedence state to primary treatment message, blocker info, next action, owner, due date, consequence
  - [ ] Ensure source domain (e.g., "Report Review", "Gate Finding", "Follow-up") is clear in the output
  - [ ] When no actionable state exists, return a clear "all clear" or "no current blockers" state

- [ ] Integrate with Client Profile read model (AC: 1)
  - [ ] Export `deriveWhatMattersNow` for use by the Client Profile route
  - [ ] The profile route calls derive after building the snapshot
  - [ ] Return What Matters Now data alongside the profile snapshot in the parent DTO

- [ ] Write comprehensive tests (AC: 1, 2)
  - [ ] Create `tests/staff-portal/read-models/derive-what-matters-now.test.ts`
  - [ ] Test: blocked precedence over requires decision, requires decision over at risk, at risk over draft/stale, draft/stale over ready, ready over completed
  - [ ] Test: multiple simultaneous states → highest precedence wins
  - [ ] Test: no actionable state → "all clear" response
  - [ ] Test: DTO shape and field correctness
  - [ ] Test: source domain clarity in output

## Dev Notes

### Architecture Context

The What Matters Now panel is a derived state computation, not a direct database read model. It consumes the Client Profile snapshot output and computes a single "most important thing" by applying the state precedence rules.

```ts
export interface DeriveWhatMattersNowInput {
  profile: StaffClientProfileSnapshotDto;
  availableActions: ActionDescriptor[];
}

export interface StaffWhatMattersNowDto {
  primaryTreatment: 'blocked' | 'requires_decision' | 'at_risk' | 'draft_stale' | 'ready' | 'completed' | 'all_clear';
  blockerName: string | null;
  blockerType: 'report_blocker' | 'gate_finding' | 'follow_up' | 'meeting_brief' | 'commercial' | null;
  nextValidAction: string | null;
  nextActionRoute: string | null;
  ownerName: string | null;
  dueDate: string | null; // ISO date
  consequenceOfInaction: string | null;
  sourceDomain: 'report_review' | 'gate_finding' | 'follow_up' | 'meeting_brief' | 'commercial' | null;
  precedenceLevel: number; // 1=highest
}
```

### Precedence Logic

The precedence engine evaluates each domain section of the client profile:

| Precedence | State | Domain Source | Example Message |
|------------|-------|---------------|-----------------|
| 1 (highest) | Blocked | Report/Gate Finding with unresolved blocking finding | "Report blocked by unresolved Gate Finding: ..." |
| 2 | Requires Decision | Report in review / Gate Finding open | "Gate Finding requires your decision" |
| 3 | At Risk | Follow-up overdue, report nearing deadline | "Follow-up overdue — was due 3 days ago" |
| 4 | Draft/Stale | Meeting Brief draft, Commercial Next Step missing | "Meeting Brief is still in draft" |
| 5 | Ready | All clear, no blockers, no pending actions | "Client profile ready — no current blockers" |
| 6 (lowest) | Completed | Everything done | "All client work is up to date" |

### Scope Boundary

This story creates only the read-model/DTO layer for What Matters Now. The UI panel rendering and integration into the Client Profile page layout is covered in Story 3.5 (Client Profile Continuity Layout).

### Architecture Guardrails

- Pure computation over existing DTOs; no new database queries in `deriveWhatMattersNow`
- Source domain must be clear to staff — "Report Review" vs "Gate Finding" vs "Follow-up" vs "Meeting Brief" vs "Commercial"
- State precedence uses the same lifecycle vocabulary as Command Center and Human Review
- No UI logic in the derivation function — returns typed DTO for the UI to render
- Non-leaking: permission-denied states produce minimal safe output

### Implementation Sequence

1. Add `StaffWhatMattersNowDto` to `src/lib/staff-portal/dto.ts`
2. Create `src/lib/server/staff-portal/read-models/derive-what-matters-now.ts` with precedence engine
3. Write tests in `tests/staff-portal/read-models/derive-what-matters-now.test.ts`
4. Run `vitest run tests/staff-portal`
5. Run `npm run check`
