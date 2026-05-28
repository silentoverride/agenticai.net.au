# Story 1.1: Canonical State Types & Brownfield Mapper

**Status:** ready-for-dev
**Epic:** 1 — Safety Spine & Brownfield State Mapping
**Created:** 2026-05-29
**Phase:** Staff Portal

---

## User Story

As a **system**, I need canonical Staff Portal state types and a brownfield mapping layer so that raw pipeline/gate statuses are mapped to governed decision states with a single source of truth.

---

## Acceptance Criteria

### Already Implemented ✅

- [x] `domain/states.ts` defines canonical state unions: `ReportState`, `GateFindingState`, `HumanReviewState`, `BlockedReason`, `StaleReason`, `RiskSignal` — also `FollowUpStatus`/`MeetingBriefState`/`CommercialNextStepStatus` in companion files
- [x] State unions exported as `const` objects with `as const satisfies Record` for exhaustiveness
- [x] `mappers/brownfield-report-state.ts` — `mapBrownfieldReportState()` handles all documented raw states
- [x] `mappers/gate-finding-state.ts` — `mapGateFindingState()` handles gate verdict → governed state
- [x] Conflicting states resolve to governed states with explicit conflict markers (e.g., `CONFLICT` state, `conflictingRecords` blocked reason)
- [x] `GovernedReportState` and `GovernedGateFindingState` interfaces exist with risk/blocked/stale signals
- [x] Client-safe DTOs in `src/lib/staff-portal/dto.ts` with full presentation metadata
- [x] Staff Portal directory structure matches AR-2: `domain/`, `mappers/`, `actions/`, `transitions/`, `audit/`, `receipts/`, `read-models/`, `repositories/`, `services/`, `testing/`
- [x] Vitest tests exist: `brownfield-report-state.test.ts` (40+ cases), `gate-finding-state.test.ts`

### Remaining Work 🔧

- [ ] **Brownfield mapping fixture CSV** — Architecture requires `testing/fixtures/brownfield-mapping.csv` enumerating ALL mapping combinations as a single source of truth. Create this CSV file covering every combination in the mapper.
- [ ] **Null/undefined edge cases** — Verify mappers handle `null` and `undefined` inputs for ALL fields (currently tested for pipelineStatus but not exhaustive on all input fields)
- [ ] **Conflicting states: `ready`/`completed`/`delivered` + `human_assist:approved` without evidence** — Verify this specific brownfield scenario maps to `CONFLICT` not `APPROVED` (test exists, verify coverage)
- [ ] **`mapPipelineStatusToReportState` alias** — The epics AC mentions this by name; `mapBrownfieldReportState` is the actual implementation. Verify the name mismatch is intentional (architecture uses `mapBrownfieldReportState` as canonical name).
- [ ] **Brownfield mapping: missing artifact + human_assist:approved** — Verify maps to `CONFLICT` with both `missingArtifact` and `approvalEvidenceRequired` blocks (edge case)
- [ ] **Test for all FAILED_STATUSES paths** — `['failed', 'error']` mapped through every humanReviewState combination
- [ ] **Run full test suite** — `npx vitest run tests/staff-portal/mappers/` — verify all 40+ tests pass green

---

## Developer Context

### What Already Exists

The Staff Portal domain layer was built during the previous `1-1-governed-staff-portal-state-foundation` implementation. Key files:

| File | Contents |
|------|----------|
| `src/lib/server/staff-portal/domain/states.ts` | `ReportState`, `GateFindingState`, `HumanReviewState` unions + `REPORT_STATES`, `GATE_FINDING_STATES` const objects + `GovernedReportState`, `GovernedGateFindingState` interfaces + `BlockedReason`, `StaleReason`, `RiskSignal` |
| `src/lib/server/staff-portal/domain/follow-up-states.ts` | `FollowUpStatus` union |
| `src/lib/server/staff-portal/domain/meeting-brief-states.ts` | `MeetingBriefState` union |
| `src/lib/server/staff-portal/domain/commercial-next-step-states.ts` | `CommercialNextStepStatus` union |
| `src/lib/server/staff-portal/domain/actions.ts` | `StaffPortalActionId` union, `ACTION_AUDIT_REQUIREMENTS`, `ACTIONS_REQUIRING_REASON_CODE` |
| `src/lib/server/staff-portal/domain/roles.ts` | `StaffRole` type, permission helpers |
| `src/lib/server/staff-portal/mappers/brownfield-report-state.ts` | `mapBrownfieldReportState()` — comprehensive brownfield → governed mapper |
| `src/lib/server/staff-portal/mappers/gate-finding-state.ts` | `mapGateFindingState()` — gate verdict → governed mapper |
| `src/lib/staff-portal/dto.ts` | All client-safe DTOs with `StatePresentationMetadata`, blocker reasons, stale reasons |
| `tests/staff-portal/mappers/brownfield-report-state.test.ts` | 40+ Vitest cases covering pipeline statuses, human assist states, edge cases |
| `tests/staff-portal/mappers/gate-finding-state.test.ts` | Vitest coverage for gate finding mapping |
| `tests/staff-portal/dto/presentation-metadata.test.ts` | DTO validation tests |
| `src/lib/server/staff-portal/testing/builders.ts` | `reportFacts()` builder for test fixtures |

### Brownfield States Handled

`mapBrownfieldReportState` covers these raw `pipelineStatus` values:
- **Running:** `running_llm`, `running_tools`, `running_deck`, `generating` → GOVERNED `GENERATING`
- **Queued:** `pending`, `pending_payment`, `queued` → GOVERNED `QUEUED`
- **Delayed:** `delayed` → GOVERNED `DELAYED`
- **Failed:** `failed`, `error` → GOVERNED `UNAVAILABLE` (unless approved HR → CONFLICT)
- **Terminal generated:** `ready`, `completed`, `delivered` → GOVERNED `GENERATED` (never AUTO-APPROVED — approval evidence gate enforced)
- **Human assist:** `human_assist` → GOVERNED `ESCALATED`
- **Null/empty/unknown** → GOVERNED `UNAVAILABLE`

`mapGateFindingState` covers:
- **Gate verdicts:** `approve`, `block`, `retry`, `escalate`, `human_assist`, `warn` → governed states
- **Human review states:** `pending`, `in_review`, `approved`, `rejected`, `edited`
- **Conflict detection:** approved HR without evidence → CONFLICT
- **Override detection:** edited HR or explicit overrideReason → OVERRIDDEN_WITH_REASON

### Architecture Rules (Mandatory)

1. **State unions use string literal types** — `as const satisfies Record<string, T>` pattern for exhaustiveness
2. **No UI imports in domain layer** — `states.ts` imports only from `$lib/staff-portal/dto` (client-safe, no server deps)
3. **Mappers produce `GovernedXState`** — never return raw pipeline/gate statuses
4. **Brownfield → governed is one-way** — mappers read raw data, never mutate it
5. **Conflict resolution is explicit** — `CONFLICT` state + `conflictingRecords` blocked reason, never silent mapping
6. **Approved requires evidence** — `ready`/`completed`/`delivered` NEVER auto-map to `APPROVED` without approval evidence
7. **Test fixture CSV** — single source of truth for all mapping combinations per Architecture

### Files to NOT touch

- `src/lib/server/staff-portal/domain/states.ts` — stable, no changes needed
- `src/lib/server/staff-portal/mappers/brownfield-report-state.ts` — stable, verify tests only
- `src/lib/server/staff-portal/mappers/gate-finding-state.ts` — stable, verify tests only
- `src/lib/staff-portal/dto.ts` — stable, used by downstream stories

### Key Constraints

- **No server imports in `dto.ts`** — it's shared between server and client
- **`as const satisfies` pattern** — used throughout for compile-time exhaustiveness checking
- **`RISK_SIGNALS.BLOCKED`** — set whenever `blockedReasons.length > 0`
- **`canDeliver`** — derived: `approved && artifactPresent` only
- **`humanReviewState`** — tracked separately from `state` for review workflow progression

### Previous Story Context

This is the first Staff Portal story. The pipeline/assessment phase (old Epics 1-10) is complete. Relevant patterns from that phase:
- D1 migration numbering convention: reserved ranges per epic
- Server-only code under `src/lib/server/**`
- Vitest for unit/integration, Playwright for E2E
- `npm run check` for TypeScript validation
- Cloudflare Workers with `event.platform.env` bindings

---

## Implementation Plan

### Step 1: Verify existing tests pass

```bash
npx vitest run tests/staff-portal/mappers/
```

Expected: all green. If any failures, document and fix.

### Step 2: Create brownfield mapping fixture CSV

Create `src/lib/server/staff-portal/testing/fixtures/brownfield-mapping.csv`:

```csv
pipelineStatus,humanAssistStatus,artifactPresent,approvalEvidence,unresolvedBlockingFindings,conflict,expectedState,expectedApproved,expectedRisk
pending,,false,false,0,false,queued,false,none
running_llm,,false,false,0,false,generating,false,none
delayed,,false,false,0,false,delayed,false,none
ready,,true,false,0,false,generated,false,blocked
completed,,true,false,0,false,generated,false,blocked
delivered,,true,false,0,false,generated,false,blocked
,approved,true,true,0,false,approved,true,none
,approved,true,false,0,false,conflict,false,blocked
,approved,true,true,1,false,conflict,false,blocked
human_assist,,false,false,0,false,escalated,false,medium
failed,,false,false,0,false,unavailable,false,none
failed,approved,false,false,0,false,conflict,false,blocked
error,,false,false,0,false,unavailable,false,none
,in_review,false,false,0,false,inReview,false,medium
,pending,false,false,0,false,escalated,false,medium
,rejected,false,false,0,false,rejected,false,none
,edited,false,false,0,false,regenerationRequired,false,none
,,false,false,0,true,conflict,false,blocked
,(empty),false,false,0,false,unavailable,false,none
null,null,false,false,0,false,unavailable,false,none
```

### Step 3: Verify null/undefined handling

Add test cases for all-null, all-undefined, and mixed null inputs to both mapper test files. Verify no runtime errors.

### Step 4: Run full staff-portal test suite

```bash
npx vitest run tests/staff-portal/
```

Verify all tests pass. Document any pre-existing failures.

### Step 5: TypeScript check

```bash
npx tsc --noEmit
npm run check
```

Verify no type errors in staff-portal modules.

---

## Definition of Done

- [ ] All 7 "Remaining Work" items completed
- [ ] `tests/staff-portal/mappers/brownfield-report-state.test.ts` passes — all 40+ cases green
- [ ] `tests/staff-portal/mappers/gate-finding-state.test.ts` passes
- [ ] Fixture CSV created at `src/lib/server/staff-portal/testing/fixtures/brownfield-mapping.csv`
- [ ] Null/undefined edge case tests added and passing
- [ ] `npm run check` passes with no new errors
- [ ] All state unions use discriminated union pattern (string literal `as const satisfies`)
- [ ] No raw pipeline/gate statuses leak into DTO exports
- [ ] No server imports in `$lib/staff-portal/dto.ts`

---

## Technical Notes

- The canonical name for the brownfield mapper is `mapBrownfieldReportState` (as implemented), not `mapPipelineStatusToReportState` (as referenced in epics AC). The architecture doc uses `mapBrownfieldReportState` — use this name.
- The architecture explicitly forbids running `npx sv create` or any starter initialization — this is a brownfield extension.
- No UI changes in this story — domain layer + mappers + tests only.
- The `GovernedReportState` and `GovernedGateFindingState` interfaces are the boundary between mappers and eligibility/transition services (Story 1.3).
