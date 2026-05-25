# Story 1.3: Report Review Queue and Workspace Read Model

Status: ready-for-dev

## Story

As an operator,
I want to open a queue and workspace for reports requiring human review,
so that I can inspect report context, artifacts, and blocking findings before deciding.

## Requirements Covered

FR16, FR17, FR63, FR64, FR65, FR66, FR67; NFR4, NFR7; UX-DR6, UX-DR17, UX-DR32, UX-DR33.

## Acceptance Criteria

1. **Given** reports require human review, **when** an operator opens the review queue, **then** the queue lists permitted reports with client, report state, human review state, blocker summary, owner, age, and next safe action; and admin users can see all operational work while operators see only permitted assigned or shared-queue work.
2. **Given** an operator opens a report review workspace, **when** the workspace loads, **then** it shows full report navigation, report context, linked Gate Findings, current Report State, and available report artifact/version history; and original, edited, regenerated, or historical versions appear only when those artifacts exist.
3. **Given** review workspace data is loading, empty, stale, permission denied, degraded, or failed, **when** the page renders, **then** the state is visible and accessible, and no state-changing action is available without a visible reason.

## Tasks / Subtasks

- [ ] Build the report review queue read model (AC: 1)
  - [ ] Create `src/lib/server/staff-portal/read-models/list-report-review-queue.ts` — a bounded, indexed D1 query that returns governed queue items for the permitted queue scope, ordered by priority (due/age, risk, blocking findings).
  - [ ] Each queue item must include: `assessmentId`, `clientName`, `reportState` (governed), `humanReviewState`, `blockerSummary`, `owner`, `age/dueDate`, `nextSafeAction`, `priorityReason`, and `consequenceOfInaction`.
  - [ ] Apply role-based filtering: admin sees all operational work; operator sees only permitted assigned or shared-queue work (via existing operator-auth helpers).
  - [ ] Use bounded D1 queries with limits/pagination; avoid N+1 aggregation across reports, gates, and reviews.
  - [ ] Wrap results in governed DTO types from `src/lib/staff-portal/dto.ts`.

- [ ] Build the report review workspace read model (AC: 2)
  - [ ] Create `src/lib/server/staff-portal/read-models/get-assessment-review.ts` — loads the full review workspace view model for a single assessment.
  - [ ] Must include: full report navigation context (report metadata, section headers/structure when available), report context (client info, journey stage, risk/value flags), linked Gate Findings (with type, verdict, confidence, severity, reasoning, details, flagged section, intake evidence, inspection steps — derived from existing gate/review data via Story 1.1 mappers), current Report State (governed), and report artifact/version history (original, edited, regenerated, or historical versions — only when those artifacts exist in R2 or `reports` table).
  - [ ] Use bounded indexed D1 queries; do not N+1 across gates, reports, artifacts, or reviews.
  - [ ] Return a `StaffAssessmentReviewDto` DTO that is camelCase, serializable, and governed.

- [ ] Add the thin review queue page route (AC: 1)
  - [ ] Add or update `src/routes/operator/assessments/+page.server.ts` (or equivalent route location matching existing patterns) to load the queue via `list-report-review-queue()`.
  - [ ] Route responsibilities: authenticate via Clerk/operator-auth, call the read model, return governed DTOs.
  - [ ] Forbidden: direct D1 lifecycle writes, raw pipeline/gate status interpretation, transition matrix checks, or audit record construction.

- [ ] Add the thin review workspace page route (AC: 2)
  - [ ] Add or update `src/routes/operator/assessments/[assessmentId]/+page.server.ts` to load the workspace via `get-assessment-review()`.
  - [ ] Route responsibilities: authenticate, authorize operator/admin for this assessment/queue, call the read model, return governed DTO.
  - [ ] Permission-denied responses must be non-leaking: do not expose restricted object names, counts, or metadata.
  - [ ] Forbidden: direct D1 lifecycle writes, raw status interpretation, transition matrix checks, or audit record construction.

- [ ] Add review queue page UI (AC: 1)
  - [ ] Add or update `src/routes/operator/assessments/+page.svelte` — renders the review queue.
  - [ ] Each row shows: client, report state (`StateBadge`), human review state, blocker summary, owner, age/due date, next safe action (`PriorityWorkItemRow`-style from Story 1.1 presentation metadata).
  - [ ] Admin sees all work; operator sees only permitted work.
  - [ ] Handle loading, empty, stale, error, permission-denied states per UX-DR32 and UX-DR33.
  - [ ] No state-changing action without visible reason.

- [ ] Add review workspace page UI (AC: 2, 3)
  - [ ] Add or update `src/routes/operator/assessments/[assessmentId]/+page.svelte` — renders the review workspace (`DecisionWorkspace` composition pattern from UX-DR17).
  - [ ] Preserve State → Risk → Evidence → Valid Actions → Receipt order (UX-DR3).
  - [ ] Show: current report state, report navigation context, linked Gate Findings (with type/verdict/confidence/severity/reasoning/details/section/evidence/inspection steps), report artifact/version history (original/edited/regenerated/historical when they exist), and the `ValidActionsPanel` with server-provided action descriptors.
  - [ ] Handle loading, empty, stale, permission-denied, degraded, error states — each visible, accessible, non-leaking (UX-DR32, UX-DR33).
  - [ ] Use Story 1.1 presentation metadata for state badges, risk signals, blocked reasons.
  - [ ] Use stable semantic locators / `data-testid` hooks for state badges, actions, rows, and validation errors.

- [ ] Add targeted tests (AC: 1, 2, 3)
  - [ ] Read model tests: queue derivation produces correct items for admin vs. operator; bounded queries apply limits; stale/missing/empty/conflicting data produces degraded or empty states.
  - [ ] Workspace read model tests: full review workspace loads with linked gate findings, report context, artifact history when present; gracefully degrades when artifacts/sections/evidence are missing.
  - [ ] Route tests: route delegates to read models, returns governed DTOs, applies auth guards, returns non-leaking permission denials, does not write lifecycle state.
  - [ ] UI state tests: rendering for each data state (loading, empty, permission-denied, stale, error, degraded, populated).
  - [ ] Run `npx vitest run tests/staff-portal` and `npm run check`.

## Dev Notes

### Scope Boundary

This story builds the report review queue list page and review workspace detail page — **read surfaces only**. It should not build:
- `commitStaffAction(...)` integration for Gate Finding decisions (Story 1.4)
- Whole-report guarded decision UI (Story 1.5)
- Decision receipts or audit timeline UI (Story 1.6)
- Accessibility polish beyond what is required for basic operation (Story 1.7)

The read models and routes produce governed view models. Mutations flow through the existing `src/routes/api/operator/assessments/[assessmentId]/actions/+server.ts` endpoint built in Story 1.2.

### Architecture Guardrails

- Extend the existing SvelteKit 2 / Svelte 5 / Cloudflare Pages app; do not initialize a starter, monorepo, dashboard framework, Tailwind, Prisma, Hono, or workflow engine. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Routes are thin delivery adapters; read models live in `src/lib/server/staff-portal/read-models/**`. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]
- No raw pipeline/gate status in browser DTOs. All state is governed through Story 1.1 mappers. [Source: `_bmad-output/planning-artifacts/architecture.md#Pattern Examples`]
- UI components render server-provided view models; they must not infer action legality from raw status strings. [Source: `_bmad-output/planning-artifacts/architecture.md#UI Consistency Patterns`]
- The decision order must always be: **State → Risk → Evidence → Valid Actions → Receipt**. [Source: `_bmad-output/planning-artifacts/architecture.md#UI Consistency Patterns`]
- Permission-denied responses must not leak restricted object details. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Use bounded indexed D1 queries; avoid N+1 aggregation for queue and workspace derivation. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- Use existing local SQLite/D1 fallback via `src/lib/server/db.ts`. [Source: `_bmad-output/project-context.md#Technology Stack & Versions`]
- Use existing operator auth helpers from `src/lib/server/operator-auth.ts`. [Source: `_bmad-output/project-context.md#Critical Implementation Rules`]
- Do not add `/staff` or `/admin` route families; extend `/operator/assessments/**`. [Source: `_bmad-output/planning-artifacts/architecture.md#Route Boundaries`]

### Existing Code Context to Preserve

- Story 1.1 established: `src/lib/staff-portal/dto.ts`, `src/lib/server/staff-portal/domain/*`, mappers, `get-available-actions`, builders, fixtures, and presentation metadata. Reuse these for DTOs, state enums, and eligibility display. [Source: `_bmad-output/implementation-artifacts/1-1-governed-staff-portal-state-foundation.md#File List`]
- Story 1.2 established: `staff_action_audit_events` migration, repositories, `commit-staff-action` service, validation schemas, and the mutation API endpoint at `src/routes/api/operator/assessments/[assessmentId]/actions/+server.ts`. No DB/migration changes are needed for this read-model story. [Source: `_bmad-output/implementation-artifacts/1-2-audit-and-idempotent-action-persistence.md#File List`]
- `src/lib/server/staff-portal/services/get-available-actions.ts` provides action descriptors for display in the workspace; the workspace UI renders them through `ValidActionsPanel`. [Source: `src/lib/server/staff-portal/services/get-available-actions.ts`]
- Existing raw sources (`pipeline_status`, `assessment_gates`, `human_assist_reviews`, `reports`) remain source facts only. Mappers from Story 1.1 produce governed state before it enters any view model. [Source: `migrations/0013_add_gate_metadata.sql`, `migrations/0014_add_human_assist_reviews.sql`]
- `src/lib/server/db.ts` owns the async DB facade. Read models should depend on the `AsyncDb` interface; do not import `better-sqlite3` directly. [Source: `src/lib/server/db.ts`]
- R2 artifact keys exist in existing store modules; do not ad hoc construct artifact paths in workspace read models. [Source: `src/lib/server/assessment/**`]
- Existing `src/routes/operator/human-assist/[id]/+page.svelte` is brownfield context — this story should not refactor it. Build the new governed review workspace under `/operator/assessments/[assessmentId]/`. [Source: `_bmad-output/implementation-artifacts/1-2-audit-and-idempotent-action-persistence.md#Current Code Context to Preserve`]

### Suggested File Structure

```text
src/lib/staff-portal/
  dto.ts                                    # UPDATE: add queue item & review workspace DTOs

src/lib/server/staff-portal/
  read-models/
    list-report-review-queue.ts             # NEW
    get-assessment-review.ts                # NEW

src/routes/operator/assessments/
  +page.server.ts                           # NEW or UPDATE
  +page.svelte                              # NEW or UPDATE
  [assessmentId]/
    +page.server.ts                         # NEW or UPDATE
    +page.svelte                            # NEW or UPDATE

tests/staff-portal/
  read-models/list-report-review-queue.test.ts
  read-models/get-assessment-review.test.ts
  routes/assessments-queue.test.ts
  routes/assessments-workspace.test.ts
```

### Read Model Contracts

**Queue Item DTO** (add to `src/lib/staff-portal/dto.ts`):

```ts
interface StaffReportReviewQueueItemDto {
  assessmentId: string;
  clientName: string;
  reportState: ReportState;
  humanReviewState: HumanReviewState;
  blockerSummary: string | null;
  owner: string | null;
  ageDays: number;
  dueDate: string | null;
  nextSafeAction: StaffActionDescriptorDto;
  priorityReason: string;
  consequenceOfInaction: string | null;
}
```

**Review Workspace DTO** (add to `src/lib/staff-portal/dto.ts`):

```ts
interface StaffAssessmentReviewDto {
  assessmentId: string;
  clientName: string;
  reportState: ReportState;
  humanReviewState: HumanReviewState;
  reportContext: {
    businessName: string;
    owner: string | null;
    journeyStage: string | null;
    riskFlags: string[];
    valueFlags: string[];
  };
  linkedGateFindings: StaffGateFindingDto[];
  artifactHistory: StaffArtifactVersionDto[];
  availableActions: StaffActionDescriptorDto[];
  // state metadata for UI rendering
  statePresentation: StatePresentationMetadata;
  blockedReasons: StaffBlockedReasonDto[];
}

interface StaffGateFindingDto {
  id: string;
  type: string;
  verdict: string;
  confidence: number | null;
  severity: string | null;
  reasoning: string | null;
  details: string | null;
  flaggedReportSection: string | null;
  relatedIntakeEvidence: string | null;
  suggestedInspectionSteps: string | null;
  state: GateFindingState;
  decisionNotes: string | null;
  // presentation metadata
  riskSignal: RiskSignalPresentationDto;
}

interface StaffArtifactVersionDto {
  versionId: string;
  type: 'original' | 'edited' | 'regenerated' | 'historical';
  createdAt: string;
  label: string;
  available: boolean;
  url?: string; // only when available
}
```

### Read Model Query Strategy

- Use bounded D1 queries via `env.DB` / `db.query()` with indexed lookups on `assessment_id`, status, and created_at columns.
- For the review queue: query governed state sources (existing pipeline/gate/review tables filtered through Story 1.1 mappers) with LIMIT/OFFSET. Apply role-based filtering client-side or in the query depending on D1 index efficiency.
- For the review workspace: load assessment base record, then bounded queries for linked gate findings, report artifacts (R2 listing or reports table), and review action history. Avoid loading all gate findings and then filtering — query with `assessment_id` bound.
- R2 artifact listing should use bounded list operations; avoid enumerating all objects.

### Artifact Version Handling

- Artifact versions (original, edited, regenerated, historical) should be listed only when the underlying artifact exists in R2 or the `reports` table.
- Do not create placeholder version entries for nonexistent artifacts.
- Use existing R2 key conventions from store modules; do not invent new key patterns.

### Gate Finding Display Requirements

Per FR18 and UX-DR7, each Gate Finding in the workspace must show:
- type (from existing gate type/enum)
- verdict (approve, retry, block, escalate, human_assist — mapped to governed state by Story 1.1 mappers)
- confidence (numeric when available)
- severity (when available, from existing gate metadata)
- reasoning
- details
- flagged report section (when applicable)
- related intake evidence (when applicable)
- suggested inspection steps (when available)
- linked report context
- decision notes

Use existing gate types/metadata from `assessment_gates` and `013_add_gate_metadata.sql` schema. Map through Story 1.1 `gate-finding-state.ts` mapper.

### Empty / Error / Degraded State Contracts (UX-DR32, UX-DR33)

Every read model and route must handle:

| State | Behavior |
|---|---|
| Loading | Skeleton/spinner; no partial data |
| Empty | Visible text: "No reports requiring review." Distinguish from permission-limited |
| Stale | Warning banner indicating data may be stale; recovery/refresh link |
| Permission denied | Non-leaking: "You do not have access to this assessment." No object names, counts, or metadata |
| Validation error | Visible error with guidance |
| Degraded data | Warning banner: "Some data is unavailable." Show available data, block unsafe actions |
| Error | "Could not load review data." Recovery/retry link |
| Action failed | "The action could not be completed." Prior state preserved, recovery path |

### Testing Guidance

Use Vitest with `$lib` alias imports. Prefer typed fakes over `as any`.

Required test matrix:
- Queue read model returns correct items for admin (all work) vs. operator (permitted work only).
- Queue read model applies limits/pagination and does not N+1.
- Queue read model handles empty/missing data gracefully.
- Workspace read model returns full review context with linked gate findings, report metadata, artifact history.
- Workspace read model gracefully degrades when artifacts/sections/evidence/intake are missing.
- Workspace read model handles permission-denied with non-leaking response.
- Route handlers delegate to read models and do not access raw DB/lifecycle state directly.
- Route auth guards reject unauthenticated + unauthorized + non-operator/non-admin users.
- UI renders correctly for loading, empty, stale, permission-denied, error, degraded, and populated states.
- UI does not render state-changing actions without visible reason.

### Verification Commands

```bash
npx vitest run tests/staff-portal
npm run check
```

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.3: Report Review Queue and Workspace Read Model`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#5.1 Report State`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#5.2 Gate Finding State`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md#4.8 Roles and Access`
- `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`
- `_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules`
- `_bmad-output/planning-artifacts/ux-design-specification.md#2.3 Success Criteria`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation`
- `_bmad-output/project-context.md#Critical Implementation Rules`
- `_bmad-output/implementation-artifacts/1-1-governed-staff-portal-state-foundation.md#Dev Notes`
- `_bmad-output/implementation-artifacts/1-2-audit-and-idempotent-action-persistence.md#Dev Notes`
- `src/lib/staff-portal/dto.ts`
- `src/lib/server/staff-portal/services/get-available-actions.ts`
- `src/lib/server/staff-portal/services/commit-staff-action.ts`
- `src/lib/server/operator-auth.ts`
- `src/lib/server/db.ts`
- `src/lib/server/assessment/human-assist/store.ts`
- `migrations/0013_add_gate_metadata.sql`
- `migrations/0014_add_human_assist_reviews.sql`
- `package.json`
- `vitest.config.ts`

## Dev Agent Record

### Agent Model Used

To be completed by dev agent.

### Debug Log References

### Completion Notes List

### File List
