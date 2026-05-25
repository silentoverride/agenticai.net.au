# Story 1.2: Audit and Idempotent Action Persistence

Status: done

## Story

As an admin,
I want lifecycle actions to be persisted with audit and idempotency guarantees,
so that high-risk review decisions are accountable and retry-safe.

## Requirements Covered

FR57, FR58, FR61, FR62; NFR1, NFR2, NFR7.

## Acceptance Criteria

1. Given Staff Portal action/audit migrations are applied, when local SQLite initialization and D1 migrations are compared, then both support action/audit event persistence with `id`, `assessment_id`, `actor_id`, `action`, `from_state`, `to_state`, `reason_code`, `reason`, `request_hash`, `idempotency_key`, and `created_at`, and idempotency is unique within actor, assessment, and idempotency key scope.
2. Given a staff action request is submitted, when `commitStaffAction(...)` executes, then it re-checks authentication, authorization, current state, stale/version preconditions, idempotency, action eligibility, audit creation, and receipt generation, and no route writes lifecycle state directly.
3. Given an audit write fails, when a lifecycle transition is attempted, then the state transition is not reported as successful, and the API returns a structured `auditWriteFailed` error.

## Tasks / Subtasks

- [x] Add Staff Portal action/audit persistence schema (AC: 1)
  - [x] Add the next sequential migration, expected `migrations/0017_staff_portal_action_audit_events.sql`, for a durable Staff Portal action/audit event table.
  - [x] Include at minimum: `id`, `assessment_id`, `actor_id`, `action`, `from_state`, `to_state`, `reason_code`, `reason`, `request_hash`, `idempotency_key`, `created_at`.
  - [x] Also include `target_type`, `target_id`, and optional `metadata_json` unless a simpler equivalent preserves FR58 affected-object provenance; keep DB names `snake_case`.
  - [x] Add `UNIQUE(actor_id, assessment_id, idempotency_key)` exactly for retry protection; do not include timestamp or random value in that uniqueness scope.
  - [x] Add bounded lookup indexes for `assessment_id`, `actor_id`, `action`, and `created_at` suitable for later Client Profile/Audit Timeline reads.
  - [x] Update `src/lib/server/db.ts` local `initSchema(...)` with the same table, unique constraint, and indexes so local SQLite and D1 stay in parity.
- [x] Add repository and DTO contracts for persisted actions, receipts, and errors (AC: 1, 2, 3)
  - [x] Add server-only repositories under `src/lib/server/staff-portal/repositories/**` for inserting/finding action audit events and looking up idempotency records.
  - [x] Keep raw DB rows and `snake_case` inside repositories; export camelCase domain/DTO objects only.
  - [x] Extend `src/lib/staff-portal/dto.ts` with client-safe receipt and mutation result/error DTOs, including error codes `staleState`, `permissionDenied`, `blockedAction`, `duplicateAction`, `validationFailed`, and `auditWriteFailed`.
  - [x] Receipt DTOs must render from the persisted event, not from optimistic local state: event/receipt ID, assessment ID, target, action, actor, previous state, resulting state, reason code/reason, audit reference, and created timestamp.
- [x] Implement `commitStaffAction(...)` as the only lifecycle mutation boundary (AC: 2, 3)
  - [x] Add `src/lib/server/staff-portal/services/commit-staff-action.ts`.
  - [x] Input must include `assessmentId`, `action`, `targetType`, optional `targetId`, `idempotencyKey`, `expectedState`, optional `expectedVersion`, optional `reasonCode`, optional `reason`/note, and audit metadata required by `ACTION_AUDIT_REQUIREMENTS`.
  - [x] Re-check actor identity/role/assignment in the service; do not trust client-visible `availableActions`.
  - [x] Load current governed state from existing brownfield facts and Story 1.1 mappers before committing; raw `pipeline_status`, `human_assist_reviews`, or `assessment_gates` values must not become mutation truth directly.
  - [x] Re-run `getAvailableActions(...)` inside `commitStaffAction(...)` and reject disabled actions with structured `blockedAction` or `permissionDenied` responses.
  - [x] Enforce stale preconditions by comparing `expectedState` and `expectedVersion`/current version where available; return `staleState` with current state when mismatched.
  - [x] Compute a stable `request_hash` from canonicalized action input excluding transport noise; retries with the same idempotency key and same hash return the previously persisted receipt without creating a duplicate event.
  - [x] Retries with the same idempotency key and a different request hash must return a safe structured duplicate/idempotency conflict response and must not mutate state.
  - [x] Audit event creation must happen in the same logical commit path as any lifecycle state change. If audit insertion fails, report `auditWriteFailed` and do not report the lifecycle transition as successful.
  - [x] Do not update lifecycle state from route handlers. If this story needs action-specific state writes, encapsulate them behind `commitStaffAction(...)`; otherwise leave action-specific transition adapters minimal and tested for later stories.
- [x] Add the thin Staff Portal mutation endpoint (AC: 2, 3)
  - [x] Add `src/routes/api/operator/assessments/[assessmentId]/actions/+server.ts` only as a delivery adapter.
  - [x] Use existing Clerk/operator auth patterns and reject unauthenticated/non-operator/non-admin access before calling the service; production must not trust `dev_user_id`.
  - [x] Parse request JSON as `unknown` and validate with existing `zod` dependency; do not type-cast raw JSON into trusted input.
  - [x] The route may authenticate, validate, call `commitStaffAction(...)`, and map service errors to structured JSON. It must not inspect raw lifecycle statuses, construct audit rows, write D1/SQLite lifecycle state, or generate receipts itself.
  - [x] Response shape must be `{ success: true, receipt, state }` or `{ success: false, error: { code, message, currentState? } }` with correct status codes.
- [x] Preserve and integrate Story 1.1 contracts (AC: 2)
  - [x] Reuse `src/lib/server/staff-portal/domain/actions.ts`, `roles.ts`, `states.ts`, mappers, and `getAvailableActions(...)`; do not create parallel action IDs, roles, state names, or eligibility logic.
  - [x] Keep `admin` and `operator` as the only Staff Portal roles.
  - [x] Keep browser imports client-safe: UI/API response types from `$lib/staff-portal/dto.ts`; server persistence/auth/DB code stays under `$lib/server/staff-portal/**` or route server files.
- [x] Add targeted tests (AC: 1, 2, 3)
  - [x] Add migration/local-schema parity tests or repository tests proving the required columns and unique idempotency constraint exist for local SQLite and migration SQL.
  - [x] Add repository tests for insert, receipt mapping, lookup by idempotency scope, duplicate same-hash retry, and duplicate different-hash rejection.
  - [x] Add `commitStaffAction(...)` tests for authentication/actor rejection, role/assignment denial, current-state recheck, stale expected-state rejection, disabled action rejection, audit metadata validation, successful audit event creation, same-key retry returning the same receipt, and audit-write failure returning `auditWriteFailed` without reported transition success.
  - [x] Add route tests proving the API delegates to `commitStaffAction(...)` and does not mutate DB/lifecycle state directly.
  - [x] Run `npx vitest run tests/staff-portal` and `npm run check`.

## Dev Notes

### Scope Boundary

This story establishes durable action/audit persistence, idempotency, the `commitStaffAction(...)` service boundary, and a thin mutation endpoint. It should not build the review queue UI, report review workspace UI, Gate Finding decision UI, whole-report guarded decision UI, Client Profile, Command Center, Follow-ups, Meeting Briefs, or Commercial Next Step surfaces. Later stories use this persistence boundary for visible decisions.

Do not retrofit the legacy `/operator/human-assist` UI into the full Staff Portal workflow in this story. Existing human-assist endpoints currently update `human_assist_reviews` and `pipeline_status` directly; treat them as brownfield context/anti-patterns, not the new Staff Portal mutation model.

### Current Code Context to Preserve

- Story 1.1 is complete and added the Staff Portal state foundation: `src/lib/staff-portal/dto.ts`, `src/lib/server/staff-portal/domain/{actions,roles,states}.ts`, mappers, `getAvailableActions(...)`, builders, and tests. Build on these files instead of duplicating types or rules. [Source: `_bmad-output/implementation-artifacts/1-1-governed-staff-portal-state-foundation.md#File List`]
- `src/lib/server/db.ts` owns the async DB facade and local SQLite initialization. It imports `better-sqlite3` only for local fallback; Staff Portal repositories should depend on the `AsyncDb` interface and must not import or instantiate `better-sqlite3` directly. [Source: `src/lib/server/db.ts`]
- `src/lib/server/operator-auth.ts` already restricts operator routes to `admin` and `operator`; reuse this role model. If actor role is needed by `commitStaffAction(...)`, fetch/map it in a server-only helper and keep denied responses non-leaking. [Source: `src/lib/server/operator-auth.ts`; Source: `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#4.8 Roles and Access`]
- `src/lib/server/staff-portal/services/get-available-actions.ts` currently marks actions disabled when required audit metadata is missing. `commitStaffAction(...)` must provide/validate the same metadata rather than bypassing that guard. [Source: `src/lib/server/staff-portal/services/get-available-actions.ts`]
- Existing raw sources are `pipeline_status`, `reports`, `assessment_gates`, and `human_assist_reviews`. They are source facts only; governed state comes from Story 1.1 mappers before action eligibility or persistence decisions. [Source: `migrations/0013_add_gate_metadata.sql`; Source: `migrations/0014_add_human_assist_reviews.sql`]

### Architecture Guardrails

- Extend the existing SvelteKit 2 / Svelte 5 / Cloudflare Pages app; do not initialize a starter, monorepo, dashboard framework, Tailwind, Prisma/Postgres replacement, Hono, Lucia, or workflow engine. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Staff Portal server-only business logic belongs under `src/lib/server/staff-portal/**`; routes are thin delivery adapters. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]
- `commitStaffAction(...)` is the only lifecycle mutation boundary and must re-check authentication, authorization, current state, stale/version preconditions, idempotency, action eligibility, audit creation, and receipt generation. [Source: `_bmad-output/planning-artifacts/architecture.md#Communication Patterns`]
- Persist Audit Events as part of the same logical transition as state changes; audit write failure prevents lifecycle success. [Source: `_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules`]
- API/view models are camelCase governed DTOs; DB rows remain `snake_case` inside repositories/mappers. [Source: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`]
- Structured API error codes must distinguish stale, permission, blocked, duplicate, validation, and audit-write failures. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]

### Suggested File Structure

```text
migrations/
  0017_staff_portal_action_audit_events.sql

src/lib/staff-portal/
  dto.ts                         # UPDATE: receipt/result/error DTOs only

src/lib/server/staff-portal/
  repositories/
    staff-audit.repository.ts
    staff-idempotency.repository.ts
  services/
    commit-staff-action.ts
  validation/
    staff-action.schema.ts

src/routes/api/operator/assessments/[assessmentId]/actions/
  +server.ts

tests/staff-portal/
  repositories/staff-audit.repository.test.ts
  services/commit-staff-action.test.ts
  routes/assessment-actions.test.ts
  migrations/staff-action-audit-schema.test.ts
```

File names may vary slightly if the implementation is simpler, but dependency direction is mandatory: route → validation/service → repositories/domain/mappers → DB facade. Browser/client-safe modules must not import `$lib/server/**`.

### Persistence Contract

Recommended table name: `staff_action_audit_events` (or a clearly equivalent Staff Portal audit/action event name). It may be the authoritative source for decision receipts in MVP.

Required schema semantics:

- `id`: stable receipt/audit event ID, generated server-side.
- `assessment_id`: assessment/pipeline session being governed.
- `target_type` and `target_id`: affected object when applicable (`report`, `gateFinding`, future follow-up/meeting/commercial types).
- `actor_id`: Clerk/app user ID that performed the action.
- `action`: one of Story 1.1 `StaffPortalActionId` values; do not create parallel action strings.
- `from_state` / `to_state`: governed Staff Portal state names, not raw pipeline statuses.
- `reason_code` / `reason`: nullable where action metadata does not require them; required for actions defined by `ACTION_AUDIT_REQUIREMENTS` / `ACTIONS_REQUIRING_*`.
- `request_hash`: deterministic hash of canonical action input used to detect replay conflicts.
- `idempotency_key`: client-provided retry key; required for every mutation.
- `metadata_json`: optional serialized required audit metadata/checklist/artifact evidence.
- `created_at`: server-generated timestamp.

### Idempotency Rules

- Scope uniqueness as `UNIQUE(actor_id, assessment_id, idempotency_key)` per AC; this prevents duplicate submit/retry by the same actor on the same assessment.
- Same actor + assessment + idempotency key + same request hash: return the existing persisted receipt/result and do not create a new audit event.
- Same actor + assessment + idempotency key + different request hash: reject with a structured duplicate/idempotency conflict (`duplicateAction` is the existing required error code) and do not mutate.
- Different actors may use the same idempotency key without colliding, but authorization/ownership still applies.
- Idempotency checks must happen before attempting a new lifecycle transition.

### Atomicity / Transaction Guidance

- For D1, prefer the Workers Binding API with prepared statements; where multiple SQL statements are required for one logical commit, use `batch(...)` or another existing project-approved D1-compatible transactional pattern. Cloudflare documents `batch()` as executing statements sequentially as a transaction and rolling back/aborting when a statement fails. [Source: Cloudflare D1 Workers Binding API / D1 Database docs, 2026 web research]
- Local SQLite should use the existing `AsyncDb` facade; if true multi-statement transaction support is needed, extend the facade narrowly and keep D1/local parity explicit.
- If implementation cannot guarantee a physical transaction for both audit insert and lifecycle write, it must still guarantee the user/business outcome required by AC3: no success response and no visible receipt/state advancement when the audit write fails.

### API Contract

Request body should be validated with Zod from `unknown` input:

```ts
{
  action: StaffPortalActionId;
  targetType: 'report' | 'gateFinding';
  targetId?: string;
  idempotencyKey: string;
  expectedState: ReportState | GateFindingState;
  expectedVersion?: string | number;
  reasonCode?: string;
  reason?: string;
  auditMetadata?: Record<string, unknown>;
}
```

Successful response:

```ts
{
  success: true;
  state: ReportState | GateFindingState;
  receipt: StaffActionReceiptDto;
}
```

Error response:

```ts
{
  success: false;
  error: {
    code: 'staleState' | 'permissionDenied' | 'blockedAction' | 'duplicateAction' | 'validationFailed' | 'auditWriteFailed';
    message: string;
    currentState?: ReportState | GateFindingState;
  };
}
```

Do not return raw DB rows, raw pipeline status, stack traces, restricted object names, or permission-sensitive counts in error bodies.

### Previous Story Intelligence

- Story 1.1 deliberately created a new Staff Portal governed abstraction instead of modifying current `/operator/human-assist` behavior. Preserve that isolation until later UI/action stories intentionally migrate flows.
- Story 1.1 tests are under `tests/staff-portal/**`; continue this structure and keep tests targeted with `npx vitest run tests/staff-portal`.
- Story 1.1 completion noted a previous regression around failed/error pipeline statuses conflicting with raw approved review data. Keep persistence tests from assuming any raw approval/review row is sufficient for governed approval evidence.
- `npm run check` passed in Story 1.1 with existing warnings. Do not introduce new Svelte/TypeScript errors; if baseline warnings appear unrelated, document them rather than changing unrelated UI files.

### Testing Guidance

Use Vitest and `$lib` alias imports. Prefer pure service/repository tests with narrow typed DB fakes over broad `as any`.

Minimum test matrix:

- schema contains all required fields and uniqueness scope in both migration SQL and `db.ts` local init.
- inserting an action event returns a receipt DTO with governed camelCase fields.
- duplicate same-hash retry returns the same receipt and leaves only one persisted audit event.
- duplicate different-hash retry returns `duplicateAction` and leaves existing event unchanged.
- stale `expectedState` / version returns `staleState` and no audit event.
- disabled `getAvailableActions(...)` descriptor returns `blockedAction` / `permissionDenied` and no audit event.
- missing required reason/note/audit metadata returns `validationFailed` or `blockedAction` before persistence.
- repository/audit insert failure returns `auditWriteFailed` and no success state/receipt is reported.
- route validates malformed JSON, missing fields, wrong primitive types, and `null` bodies.
- route delegates to `commitStaffAction(...)`; direct route DB lifecycle writes are absent.

### Verification Commands

```bash
npx vitest run tests/staff-portal
npm run check
```

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.2: Audit and Idempotent Action Persistence`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#4.7 Audit Trail`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#4.8 Roles and Access`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#5.7 MVP Reason Codes`
- `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`
- `_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules`
- `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`
- `_bmad-output/project-context.md#Critical Implementation Rules`
- `_bmad-output/implementation-artifacts/1-1-governed-staff-portal-state-foundation.md#Dev Agent Record`
- `src/lib/server/db.ts`
- `src/lib/server/operator-auth.ts`
- `src/lib/server/staff-portal/domain/actions.ts`
- `src/lib/server/staff-portal/services/get-available-actions.ts`
- `src/lib/server/assessment/human-assist/store.ts`
- `migrations/0013_add_gate_metadata.sql`
- `migrations/0014_add_human_assist_reviews.sql`
- `package.json`
- `vitest.config.ts`
- Cloudflare D1 Workers Binding API / D1 Database docs for `batch()` transactional behavior (web research 2026-05-25)
- SQLite `UNIQUE` / `ON CONFLICT` semantics for idempotency constraints (web research 2026-05-25)

## Dev Agent Record

### Agent Model Used

Pi API coding agent (model unspecified)

### Debug Log References

- `npx svelte-kit sync && npx vitest run tests/staff-portal` — initial targeted validation after implementation: 57 tests passed.
- BMAD review found a missing gate-finding target blocker; fixed `commitStaffAction(...)` to reject missing gate targets and added regression coverage.
- `npx vitest run tests/staff-portal` — final targeted Staff Portal suite: 58 tests passed.
- `npm run check` — final Svelte/TypeScript validation: passed with 0 errors and 26 pre-existing warnings after creating a local ignored `.env` from `.env.example` for public env type generation.
- BMAD review and lightweight gate — passed with no remaining AC blockers.

### Completion Notes List

- Added `staff_action_audit_events` D1 migration and local SQLite schema parity with required receipt/audit fields, provenance fields, actor/assessment/idempotency uniqueness, and bounded lookup indexes.
- Added server-only audit/idempotency repositories and client-safe mutation receipt/result/error DTO contracts.
- Implemented `commitStaffAction(...)` as the lifecycle mutation boundary: actor/role/assignment re-checks, governed state loading through Story 1.1 mappers, stale preconditions, idempotency hashing/replay handling, eligibility validation, persisted receipt generation, and `auditWriteFailed` failure handling.
- Added thin SvelteKit API delivery adapter with Clerk/operator auth reuse, Zod validation from `unknown` JSON, structured response mapping, and no direct lifecycle/audit row construction in the route.
- Added targeted migration, repository, service, and route tests covering schema parity, idempotency, stale/permission/blocked/validation/audit-failure paths, route delegation, and missing gate-finding target rejection.

### File List

- `_bmad-output/implementation-artifacts/1-2-audit-and-idempotent-action-persistence.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `migrations/0017_staff_portal_action_audit_events.sql`
- `src/lib/server/db.ts`
- `src/lib/staff-portal/dto.ts`
- `src/lib/server/staff-portal/repositories/staff-audit.repository.ts`
- `src/lib/server/staff-portal/repositories/staff-idempotency.repository.ts`
- `src/lib/server/staff-portal/services/commit-staff-action.ts`
- `src/lib/server/staff-portal/validation/staff-action.schema.ts`
- `src/routes/api/operator/assessments/[assessmentId]/actions/+server.ts`
- `tests/staff-portal/migrations/staff-action-audit-schema.test.ts`
- `tests/staff-portal/repositories/staff-audit.repository.test.ts`
- `tests/staff-portal/routes/assessment-actions.test.ts`
- `tests/staff-portal/services/commit-staff-action.test.ts`
- `tests/staff-portal/test-db.ts`

### Change Log

- 2026-05-25: Implemented Staff Portal action/audit persistence, idempotent commit boundary, thin mutation API, and targeted Staff Portal tests.
