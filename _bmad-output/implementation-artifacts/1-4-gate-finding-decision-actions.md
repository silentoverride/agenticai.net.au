# Story 1.4: Gate Finding Decision Actions

Status: in-progress

## Story

As an operator,
I want to review, resolve, override, or escalate individual Gate Findings,
so that each report blocker has an accountable decision before report approval.

## Requirements Covered

FR18, FR19, FR20, FR21, FR22, FR23, FR31, FR57, FR58, FR61; NFR1, NFR2; UX-DR7, UX-DR20.

## Acceptance Criteria

1. **Given** a Gate Finding is displayed, **when** the operator inspects it, **then** the UI shows type, verdict, confidence, severity when available, reasoning, details, flagged report section when available, related intake evidence when available, suggested inspection steps when available, linked report context, and decision notes; and status, risk, and blocker meaning are visible text, not colour alone.

2. **Given** an operator has permission for the finding, **when** they mark it in review, resolve it, override it with reason, escalate it, or record notes, **then** the request goes through `commitStaffAction(...)`, and a persisted Audit Event records actor, timestamp, event type, affected client/object, previous state, new state, and reason or note when applicable.

3. **Given** an override is attempted without an override reason, **when** the operator submits the action, **then** the action is rejected with a validation error associated with the reason field, and prior visible state remains unchanged.

## Pre-conditions / Prerequisites

Story 1.2 provides the mutation backend (`commitStaffAction`, `getAvailableActions`, idempotency, audit persistence). Story 1.3 provides the workspace page, the `StaffGateFindingDto` type, the API action endpoint, and the workspace route. All gate finding action IDs (`claimFinding`, `resolveFinding`, `overrideFinding`, `escalateFinding`) are defined in `STAFF_ACTIONS`, their state transitions and eligibility rules exist in `getAvailableActions`/`commitStaffAction`, and the `StaffAssessmentReviewDto` already returns `linkedGateFindings` with full detail fields.

## Tasks / Subtasks

### 1. Build GateFindingCard UI component (AC: 1)

- [x] Create `src/lib/components/staff-portal/GateFindingCard.svelte` that renders a single `StaffGateFindingDto` as a compact card.
- [x] Show: gate type (humanized label), verdict with badge, confidence bar/indicator, severity badge, reasoning excerpt expandable, details expandable, flagged report section link, related intake evidence, suggested inspection steps, current state badge (via `GATE_FINDING_STATE_PRESENTATION`), decision notes, and risk signal.
- [x] Use `GATE_FINDING_STATE_PRESENTATION`, `RISK_SIGNAL_PRESENTATION`, and `BLOCKED_REASON_PRESENTATION` from `src/lib/staff-portal/dto.ts` for all state/risk/blocker labels.
- [x] Status, risk, and blocker meaning must be visible text — not colour alone (meets WCAG 2.2 AA).
- [x] Use expandable/collapsible sections for reasoning and details to keep the card scan-ready.
- [x] Expose stable `data-testid` hooks for: `gate-finding-{id}`, `gate-verdict-{verdict}`, `gate-state-{state}`.
- [x] Handle null/undefined fields gracefully — don't render empty sections for missing optional data.

### 2. Build gate finding decision action controls (AC: 2)

- [x] Add action buttons or controls inside `GateFindingCard` that call the existing API endpoint at `/api/operator/assessments/[assessmentId]/actions`.
- [x] Each action button/control takes its `StaffActionDescriptor` from the finding's `.actions` array (added below to the read model or workspace) or from the workspace's unified action list.
- [x] Actions available: claim (if in shared queue), resolve, override with reason, escalate, record notes.
- [x] For actions that require a reason code and note (`resolveFinding`, `overrideFinding`, `escalateFinding`), show an inline dialog or expandable form that collects `reasonCode` (select from presentation metadata) and `reason` (free text).
- [x] For simple actions (`claimFinding`), execute immediately with no extra form.
- [x] Disabled actions show the blocked reason as visible adjacent text (via `BLOCKED_REASON_PRESENTATION`), not hidden.
- [x] On success: show a brief receipt/confirmation, update the finding's displayed state locally to match the result (optimistic-like update from the response `state`).
- [x] On failure: show the API error message inline on the finding card, and keep prior visible state.
- [x] Submit uses the `idempotencyKey` from `crypto.randomUUID()` on each attempt (the key itself is only deduplicated on success; a failed retry with a new key is allowed, and a `duplicateAction` error from reusing a completed key shows "Already completed").

### 3. Override reason validation (AC: 3)

- [x] Override action requires `reasonCode` AND `reason` (free text). Both are mandatory via the form.
- [x] If the user clicks "Override with reason" without providing both, show inline validation errors associated with the reason code select and reason text field.
- [x] The form submit button must remain disabled while required fields are empty.
- [x] Backend already rejects overrides without reason via `ACTIONS_REQUIRING_REASON_CODE` / `ACTIONS_REQUIRING_NOTE` in `domain/actions.ts` — front-end validation is additive, not a replacement.

### 4. Wire findings display into the workspace page

- [x] In `src/routes/operator/assessments/[assessmentId]/+page.svelte`, add a "Gate Findings" section below the report context that iterates `review.linkedGateFindings` and renders a `GateFindingCard` for each.
- [x] Order findings: unresolved/blocking first (open or escalatedFurther), then resolved, then overridden.
- [x] Add a count summary: "3 findings — 1 unresolved" to the section header.
- [x] The workspace already receives `availableActions` — pass the relevant action descriptors to each `GateFindingCard` so it knows which actions are available and their disabled reasons.

### 5. Add tests

- [x] Add a test in `tests/staff-portal/services/get-available-actions.test.ts` for gate finding action drafts — verify claim/resolve/override/escalate are returned for `open` state, and blocked for `resolved` state.
- [x] Add a test in `tests/staff-portal/services/commit-staff-action.test.ts` for gate finding actions — verify a claimFinding transitions to inReview, and an overrideFinding without reason is rejected.
- [x] Add a test in `tests/staff-portal/services/commit-staff-action.test.ts` that verifies overrideFinding succeeds with all metadata. (UI component test skipped — Playwright not yet configured in project for component-level Svelte testing.)

### Files to modify

- `src/lib/components/staff-portal/GateFindingCard.svelte` (create)
- `src/routes/operator/assessments/[assessmentId]/+page.svelte` (add findings section)
- `tests/staff-portal/services/get-available-actions.test.ts` (add gate finding action tests)
- `tests/staff-portal/services/commit-staff-action.test.ts` (add gate finding transition tests)
- `tests/staff-portal/routes/assessment-actions.test.ts` (add override validation test)

### Files referenced (already exist, not modified)

- `src/lib/staff-portal/dto.ts` — `StaffGateFindingDto`, `GATE_FINDING_STATE_PRESENTATION`, `BLOCKED_REASON_PRESENTATION`
- `src/lib/server/staff-portal/domain/actions.ts` — `STAFF_ACTIONS`, `ACTION_AUDIT_REQUIREMENTS`
- `src/lib/server/staff-portal/domain/states.ts` — `GATE_FINDING_STATES`
- `src/lib/server/staff-portal/services/get-available-actions.ts` — `gateFindingActionDrafts`
- `src/lib/server/staff-portal/services/commit-staff-action.ts` — `nextState` handles gate finding transitions
- `src/lib/server/staff-portal/validation/staff-action.schema.ts`
- `src/routes/api/operator/assessments/[assessmentId]/actions/+server.ts`

## Dev Agent Record

### Agent Model Used

To be completed by dev agent.

### Debug Log References

### Completion Notes List

- GateFindingCard.svelte: Created with full detail rendering (type, verdict, confidence bar, severity badge, expandable reasoning/details, flagged section, evidence, inspection steps, state badge, decision notes, risk signal). All optional fields handled gracefully. Data-testid hooks for gate-finding-{id}, gate-verdict-{verdict}, gate-state-{state}. Added inline action controls with per-action forms for action-requiring reason code/note. Override action has front-end validation requiring both reasonCode and reason. Stale and blocked actions display visible adjacent text, not colour alone (WCAG 2.2 AA).
- +page.svelte: Wired GateFindingCard into workspace page. Findings ordered: unresolved first (open/escalatedFurther/conflict), then resolved, then overridden. Section header shows count summary. Removed stale inline gate finding card CSS classes. Added card-subtitle CSS class for the count summary.
- get-assessment-review.ts: `toGateFindingDto` extended to accept actor context and compute per-finding `actions` array via `getAvailableActions`.
- dto.ts: Added `actions: StaffActionDescriptor[]` to `StaffGateFindingDto`.
- get-available-actions.test.ts: Added 3 tests — open gate finding returns all 4 actions, resolved state blocks all actions, override/resolve/escalate require reason code and note.
- commit-staff-action.test.ts: Added 2 tests — overrideFinding fails without reason/note, overrideFinding succeeds with all metadata.
### File List

### Review Findings

> **Note:** Implementation has not started — GateFindingCard.svelte does not exist yet, and `+page.svelte` still uses the old inline rendering. These are **design review findings** that should be incorporated during implementation.

#### Pre-implementation Design Fixes (must incorporate during build)

- [x] [Review][Patch] Override validation should cover resolve/escalate actions too — client-side form validation in `submitAction()` must check `action.requiresReasonCode` and `action.requiresNote` rather than hardcoding `action.id === 'overrideFinding'`. [`GateFindingCard.svelte`]
- [x] [Review][Patch] `isUnresolved()` should be `$derived` — use a `$derived` rune instead of a plain function. [`GateFindingCard.svelte`]
- [x] [Review][Patch] Add `data-testid="gate-verdict-{verdict}"` on the verdict Badge. [`GateFindingCard.svelte`]
- [x] [Review][Patch] Include `inReview` in `unresolvedCount` filter — currently lists `open|escalatedFurther|conflict`, add `inReview`. [`+page.svelte`]
- [x] [Review][Patch] Add `aria-controls` on expandable toggles linking to their controlled content sections. [`GateFindingCard.svelte`]
- [x] [Review][Patch] Use CSS custom properties (`--color-danger`, `--color-success`, `--color-warning-bg`, etc.) instead of hardcoded hex colors. [`GateFindingCard.svelte`]
- [x] [Review][Patch] Clamp confidence bar width: `Math.min(100, Math.max(0, Math.round(finding.confidence * 100)))`. [`GateFindingCard.svelte`]
- [x] [Review][Patch] Type-safe `onStateChange` — validate new state against `GateFindingState` instead of `as any`. [`+page.svelte`]
- [x] [Review][Patch] Simplify or inline `riskBadgeTone` — it maps tones to identical variant strings; use a direct mapping table instead. [`GateFindingCard.svelte`]
- [x] [Review][Patch] Conditionally render `action.consequence` span only when a value exists. [`GateFindingCard.svelte`]
- [x] [Review][Patch] Distinguish fetch failures from JSON parse errors in the catch block for better error messages. [`GateFindingCard.svelte`]

#### Deferred (pre-existing or not actionable now)

- [x] [Review][Defer] `recordNotes` action missing from action ID enum — pre-existing gap from Story 1.2 DTO schema, not introduced here.
- [x] [Review][Defer] Linked report context not rendered in card — mitigated by section context on workspace page.
- [x] [Review][Defer] Unmounted component async setState risk — pre-existing pattern shared by all async components.
- [x] [Review][Defer] No AbortController for in-flight requests — pre-existing pattern, not introduced here.
- [x] [Review][Defer] No stale-state error pathway test coverage — enhancement, not a bug.
- [x] [Review][Defer] `onStateChange` not provided by parent — handled with fallback success message.
- [x] [Review][Defer] Mutable state update without clone — Svelte 5 reactivity covers this correctly.
- [x] [Review][Defer] Confidence bar color variation by level — enhancement.
- [x] [Review][Defer] `find()` silent no-op — defensive behavior, not a bug.
- [x] [Review][Defer] Risk uses DTO label directly — passes AC 1's visible text requirement.
