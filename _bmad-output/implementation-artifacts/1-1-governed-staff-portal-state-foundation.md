# Story 1.1: Governed Staff Portal State Foundation

Status: done

## Story

As an operator,
I want Staff Portal report and finding states to be governed consistently,
so that every review surface uses the same lifecycle language and action rules.

## Requirements Covered

FR57, FR58, FR61, FR62, FR63, FR64, FR65, FR66, FR67; NFR1, NFR3, NFR7; UX-DR18, UX-DR19, UX-DR21, UX-DR42.

## Acceptance Criteria

1. Given existing brownfield assessment, pipeline, artifact, gate, and human-assist records, when the Staff Portal read model maps them into report and gate-finding view models, then raw statuses such as `ready`, `completed`, or `delivered` are never treated as Staff Portal `Approved` without approval evidence, and mapping fixture tests cover pending/running/delayed, ready/completed/delivered without approval, human_assist/pending review, in_review, approved, rejected, edited, failed/error, missing artifact, and conflicting records.
2. Given an authenticated staff user, when Staff Portal code checks available actions for a report or gate finding, then `getAvailableActions(...)` is the only eligibility entrypoint, and it returns action descriptors with explicit allowed state, role, blocked reason, stale reason, and required audit metadata.
3. Given UI components render report, finding, blocker, risk, readiness, or action state, when they receive a Staff Portal DTO, then they render centralized labels, tones, disabled reasons, remediation hints, and test hooks from typed presentation metadata, and they do not infer workflow legality from raw database status strings.

## Tasks / Subtasks

- [x] Establish client-safe Staff Portal DTO and presentation contracts (AC: 2, 3)
  - [x] Create `src/lib/staff-portal/dto.ts` with camelCase serializable DTO/union types for report state, gate finding state, human review state, staff role, action descriptor, blocked reason, stale reason, required audit metadata, risk signal, and state presentation metadata.
  - [x] Keep DTOs free of `$lib/server/**` imports, DB row shapes, raw `pipeline_status`, raw gate status, and mutation logic.
  - [x] Include centralized presentation maps for state labels, tones, accessible labels, disabled reason copy, remediation hints, and stable `data-testid`/semantic hook values needed by later UI components.
- [x] Build server-only canonical domain vocabulary (AC: 1, 2, 3)
  - [x] Create `src/lib/server/staff-portal/domain/states.ts` for canonical report, gate finding, human review, readiness/blocker/risk state unions and transition-safe vocabulary.
  - [x] Create `src/lib/server/staff-portal/domain/roles.ts` with only `admin` and `operator`; do not introduce `reviewer`, `sales`, or `manager`.
  - [x] Create `src/lib/server/staff-portal/domain/actions.ts` for Staff Portal action IDs, blocked/stale reason codes, reason-code requirements, and audit metadata requirements.
  - [x] Export only server-safe domain logic from `src/lib/server/staff-portal/**`; browser code imports client-safe DTOs only from `src/lib/staff-portal/dto.ts`.
- [x] Implement brownfield status mappers for governed report and gate-finding state (AC: 1)
  - [x] Create mapper modules under `src/lib/server/staff-portal/mappers/**` that accept raw pipeline/report/artifact/gate/human-assist facts and return governed Staff Portal state objects.
  - [x] Treat raw `ready`, `completed`, and `delivered` as not-approved unless explicit approval evidence is present and no unresolved blocking finding remains.
  - [x] Map `human_assist` / pending review to review-required/escalated semantics; map `in_review`, `approved`, `rejected`, and `edited` through the governed vocabulary; represent failed/error and missing artifact as non-approved degraded/review-needed states, not client-deliverable states.
  - [x] Surface conflicting records as a conflict/review-required result with a blocked reason; never silently choose `Approved`.
- [x] Implement `getAvailableActions(...)` as the only action eligibility entrypoint (AC: 2)
  - [x] Create `src/lib/server/staff-portal/services/get-available-actions.ts` as a pure/server-side function over governed state plus actor role/ownership context.
  - [x] Return descriptors that include action ID, allowed/disabled state, required role, blocked reason, stale reason, required audit metadata, required reason code where applicable, and safe UI copy.
  - [x] Ensure `getAvailableActions(...)` is advisory for display only; later mutation code must still re-check in `commitStaffAction(...)`.
- [x] Add focused tests and fixture builders (AC: 1, 2, 3)
  - [x] Add `tests/staff-portal/fixtures/**` or `src/lib/server/staff-portal/testing/**` builders for pipeline statuses, reports/artifacts, gate findings, human-assist reviews, approval evidence, roles, and ownership.
  - [x] Add mapper fixture tests covering the exact AC matrix: pending/running/delayed; ready/completed/delivered without approval; human_assist/pending review; in_review; approved with and without approval evidence; rejected; edited; failed/error; missing artifact; conflicting records.
  - [x] Add action eligibility tests for role, ownership, stale state, blocked approval, missing audit metadata, and disabled reason output.
  - [x] Add DTO/presentation metadata tests proving governed states have labels, tones, accessible labels, remediation hints, and stable hooks without raw-status inference.
- [x] Verify implementation (AC: 1, 2, 3)
  - [x] Run `vitest run tests/staff-portal`.
  - [x] Run `npm run check`.

## Dev Notes

### Scope Boundary

This story creates the Staff Portal safety foundation only. It should not build the review queue UI, mutation endpoint, audit persistence, idempotency tables, `commitStaffAction(...)`, Command Center, Client Profile, Follow-ups, Meeting Briefs, or Commercial Next Step surfaces. Those are later stories.

The implementation should make downstream work impossible to guess incorrectly: routes and components will consume governed DTOs/action descriptors rather than raw pipeline/gate statuses.

### Architecture Guardrails

- Extend the existing SvelteKit 2 / Svelte 5 / Cloudflare Pages app; do not initialize a starter, monorepo, dashboard framework, Tailwind, Prisma, Hono, Lucia, or workflow engine. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Staff Portal server-only business rules belong under `src/lib/server/staff-portal/**`; route handlers remain thin and must not own lifecycle legality. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]
- Client-safe DTOs belong in `src/lib/staff-portal/dto.ts`; they must be camelCase, serializable, and free of DB rows, server imports, raw statuses, and transition logic. [Source: `_bmad-output/planning-artifacts/architecture.md#Shared DTO Boundary`]
- Raw pipeline/gate/review status must be mapped into governed state before building API DTOs or UI view models. `pipeline_status.status === 'completed'` in UI must never imply `Approved`. [Source: `_bmad-output/planning-artifacts/architecture.md#Pattern Examples`]
- `getAvailableActions(...)` is the single eligibility entrypoint for display/action descriptors. It must not be treated as mutation authority; later `commitStaffAction(...)` re-checks everything server-side. [Source: `_bmad-output/planning-artifacts/architecture.md#Communication Patterns`]
- UI order and metadata must support State → Risk → Evidence → Valid Actions → Receipt. This story supplies the typed vocabulary/metadata; later UI stories render it. [Source: `_bmad-output/planning-artifacts/architecture.md#UI Consistency Patterns`]

### Existing Code Context to Preserve

- `src/lib/server/db.ts` owns the async D1/local SQLite facade. Do not import `better-sqlite3` directly in Staff Portal domain logic; no DB changes are required in this story. [Source: `src/lib/server/db.ts`]
- `src/lib/server/operator-auth.ts` already restricts operator surfaces to `operator` and `admin`. Reuse this role model; do not create a separate reviewer/sales/manager abstraction. [Source: `src/lib/server/operator-auth.ts`]
- Existing raw sources include `pipeline_status`, `assessment_gates`, `human_assist_reviews`, and `reports`. They currently expose pipeline/gate/review values that are not Staff Portal governance truth. [Source: `migrations/0013_add_gate_metadata.sql`; `migrations/0014_add_human_assist_reviews.sql`; `src/lib/server/assessment/human-assist/store.ts`]
- Current human-assist review actions directly update `human_assist_reviews` and `pipeline_status`. Do not reuse that pattern for Staff Portal lifecycle governance; this story should create the governed abstraction that later stories migrate toward. [Source: `src/lib/server/assessment/human-assist/store.ts`; `_bmad-output/planning-artifacts/architecture.md#Anti-Patterns`]

### Suggested File Structure

```text
src/lib/staff-portal/
  dto.ts

src/lib/server/staff-portal/
  domain/
    actions.ts
    roles.ts
    states.ts
  mappers/
    brownfield-report-state.ts
    gate-finding-state.ts
  services/
    get-available-actions.ts
  testing/
    builders.ts
    fixtures.ts

tests/staff-portal/
  mappers/brownfield-report-state.test.ts
  mappers/gate-finding-state.test.ts
  services/get-available-actions.test.ts
  dto/presentation-metadata.test.ts
```

File names may vary slightly if the implementation finds a simpler local convention, but keep the dependency direction: server domain → client-safe DTO types, never client → server.

### Brownfield Mapping Rules

Use permissive raw input types for mappers because persisted history and PRD states include values beyond current TypeScript `PipelineStatus` narrowing. The mapper must handle at least:

- pipeline raw: `pending`, `pending_payment`, `queued`, `running_llm`, `running_tools`, `running_deck`, `generating`, `delayed`, `retry`, `ready`, `completed`, `delivered`, `human_assist`, `failed`, `error`
- human-assist raw: `pending`, `in_review`, `approved`, `rejected`, `edited`
- gate verdict raw: `approve`, `retry`, `block`, `escalate`, `human_assist`
- artifact presence: present/missing and version metadata when available
- approval evidence: explicit boolean/object placeholder for audit/checklist evidence; default must be false until Story 1.2 persists it

Minimum expected mapping behavior:

| Raw condition | Governed outcome |
| --- | --- |
| pending/running/delayed without artifact | no governed client-deliverable report state; not approved |
| generated artifact exists but no approval evidence | `generated` / review-needed, not `approved` |
| `ready` / `completed` / `delivered` without approval evidence | `generated`, not `approved` |
| `human_assist` or `human_assist_reviews.status = pending` | review required / escalated |
| `human_assist_reviews.status = in_review` | in review |
| approved raw review + approval evidence + no unresolved blocking finding | approved |
| approved raw review without evidence or with unresolved blocking finding | conflict/blocked, not approved |
| rejected | rejected |
| edited | regeneration required |
| failed/error | operational failure/review-needed, not approved unless explicit governed rejection evidence exists |
| missing report artifact | degraded/no report artifact, not approved |
| conflicting pipeline/review/gate records | conflict/review-required with blocked reason |

### Action Eligibility Requirements

`getAvailableActions(...)` should return stable action descriptors, not just action strings. At minimum each descriptor should include:

- `id`
- visible `label`
- `targetType` (`report` or `gateFinding` for this story)
- `enabled`
- `requiredRole`
- `blockedReason` when disabled by lifecycle/risk/precondition
- `staleReason` when disabled by version/stale context
- `requiresReasonCode`
- `requiresNote`
- `requiredAuditMetadata`
- `testId` or stable semantic hook
- concise consequence/remediation copy for UI display

Role and ownership must be represented in the input context even if ownership rules are simple in this story. Admin can see/act broadly; operator can act only within permitted/assigned/shared queue context. [Source: `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#4.8 Roles and Access`]

### Presentation Metadata Requirements

Presentation maps should provide typed metadata for later UI components such as `StateBadge`, `RiskSignal`, and `GuardedActionPanel` without importing server modules. Include visible text and non-colour cues. Do not encode transition legality in component-facing presentation maps.

Required metadata examples:

- report states: generated, escalated, inReview, approved, rejected, regenerationRequired, clarificationRequired, conflict, unavailable
- gate finding states: open, inReview, resolved, overriddenWithReason, escalatedFurther
- tones: neutral, attention, warning, danger, success, audit, disabled
- accessibility labels and descriptions
- remediation hints for blocked/stale/permission/conflict/missing artifact states
- stable hooks for automated tests

### Testing Guidance

Use Vitest and project alias imports. Keep tests under `tests/**/*.test.ts`; targeted command should be `vitest run tests/staff-portal`. [Source: `vitest.config.ts`]

Required tests must prove:

- no raw status alone maps to `approved`
- approval requires explicit approval evidence and absence of unresolved blocking findings
- conflicts and missing artifacts are visible governed states, not silently ignored
- every governed report/gate-finding state has presentation metadata
- every disabled action includes a safe blocked/stale/permission reason for UI display
- only `admin` and `operator` roles are accepted by Staff Portal role types
- DTO modules do not import server-only modules

### Project Structure Notes

- This story intentionally adds a new `staff-portal` domain boundary instead of changing existing `/operator/human-assist` behavior directly. That avoids breaking current operator flows while establishing the governed model for future migration.
- No migration is expected in this story. If implementation discovers a persistence need, stop and keep it for Story 1.2 unless it is strictly required for compile/test scaffolding.
- Do not update `src/lib/server/db.ts` unless a test-only local schema issue blocks compilation; persistence starts in Story 1.2.

### Verification Commands

```bash
vitest run tests/staff-portal
npm run check
```

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.1: Governed Staff Portal State Foundation`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#5.1 Report State`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#5.2 Gate Finding State`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#4.8 Roles and Access`
- `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`
- `_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation`
- `_bmad-output/project-context.md#Critical Implementation Rules`
- `src/lib/server/db.ts`
- `src/lib/server/operator-auth.ts`
- `src/lib/server/assessment/human-assist/store.ts`
- `src/lib/server/assessment/gate/types.ts`
- `package.json`
- `vitest.config.ts`

## Dev Agent Record

### Agent Model Used

Pi coding agent (GPT-5.1).

### Debug Log References

- `npx svelte-kit sync && npx vitest run tests/staff-portal` — initially failed because DTO source comment contained `$lib/server`; fixed comment and reran.
- `npx vitest run tests/staff-portal` — passed: 4 files, 35 tests.
- `npm run check` — passed with 0 errors and 26 existing warnings after baseline type/env support fixes were applied in the story worktree.
- BMAD review — passed after fixing failed/error + approved-review conflict handling in `brownfield-report-state.ts`.
- BMAD lightweight gate — passed based on AC coverage, review pass, Staff Portal tests, and full check.

### Completion Notes List

- Added client-safe Staff Portal DTO and centralized presentation metadata.
- Added server-only Staff Portal domain vocabulary for states, roles, and actions.
- Added brownfield report and gate-finding mappers that never promote raw `ready`/`completed`/`delivered` to approved without approval evidence.
- Added `getAvailableActions(...)` descriptors with role, assignment, stale, blocked, and audit metadata guards.
- Added Vitest coverage for mapper matrix, action eligibility, role limits, and DTO metadata boundaries.
- Added regression coverage ensuring failed/error pipeline statuses cannot become approved even when raw review data says approved with evidence.
- Cleared the full-project `npm run check` error baseline in the story worktree so the story can pass gate verification.

### File List

- `src/lib/staff-portal/dto.ts`
- `src/lib/server/staff-portal/domain/actions.ts`
- `src/lib/server/staff-portal/domain/roles.ts`
- `src/lib/server/staff-portal/domain/states.ts`
- `src/lib/server/staff-portal/mappers/brownfield-report-state.ts`
- `src/lib/server/staff-portal/mappers/gate-finding-state.ts`
- `src/lib/server/staff-portal/services/get-available-actions.ts`
- `src/lib/server/staff-portal/testing/builders.ts`
- `tests/staff-portal/dto/presentation-metadata.test.ts`
- `tests/staff-portal/mappers/brownfield-report-state.test.ts`
- `tests/staff-portal/mappers/gate-finding-state.test.ts`
- `tests/staff-portal/services/get-available-actions.test.ts`
- `src/lib/assessment/intake-script.ts`
- `src/lib/components/CalendlyButton.svelte`
- `src/lib/components/SummaryReview.svelte`
- `src/lib/components/briefing/RecommendationCards.svelte`
- `src/lib/components/briefing/VersionInfo.svelte`
- `src/lib/components/ui/button/Button.svelte`
- `src/lib/components/ui/input/Input.svelte`
- `src/lib/components/ui/progress/Progress.svelte`
- `src/lib/types.ts`
- `src/routes/+page.svelte`
- `src/routes/api/assessment/[report_id]/regenerate/+server.ts`
- `src/routes/api/portal/access/+server.ts`
- `src/routes/assessment/status/[session_id]/+page.svelte`
- `src/routes/assessment/success/+page.svelte`
- `src/routes/operator/calibration/+page.svelte`
- `src/routes/operator/cost-dashboard/+page.svelte`
- `src/routes/operator/dashboard/+page.svelte`
- `src/routes/operator/human-assist/+page.svelte`
- `src/routes/operator/human-assist/[id]/+page.svelte`
- `src/routes/portal/[user_id]/+page.svelte`
