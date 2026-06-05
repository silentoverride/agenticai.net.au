---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# agenticai-net-au - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for agenticai-net-au, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: [UJ-2] Operator can view a prioritized list of work requiring attention today using the MVP priority order.
FR2: [UJ-2] Operator can distinguish Report review work, Follow-up work, Upcoming Meeting / Meeting Brief work, and Commercial Next Step work.
FR3: [UJ-2] Operator can see each work item's Client, current state, owner, due date when applicable, why it matters, and consequence of inaction.
FR4: [UJ-2] Operator can navigate from each Command Center item to the relevant Client Profile, Report, Human Review workspace, Follow-up, or Meeting Brief.
FR5: [UJ-2] Admin can view all Command Center work across staff ownership; Operator can view work assigned to them and unassigned shared-queue work they are permitted to claim.
FR6: [UJ-2] Staff Portal must not count a passive metric as priority work unless there is a valid next action available.
FR7: [UJ-3] Operator can view a Client snapshot including business name, owner, journey stage, risk/value flags, current Report State, Human Review State, Meeting Brief State, Follow-up State, and Commercial Next Step Status.
FR8: [UJ-3] Operator can see a “What Matters Now” summary that names the current blocker, next valid action, owner, due date if applicable, and consequence of ignoring it.
FR9: [UJ-3] Operator can access current and historical Reports linked to the Client.
FR10: [UJ-3] Operator can access unresolved and recently resolved Gate Findings linked to the Client's Reports.
FR11: [UJ-3] Operator can view, create, and update Follow-ups linked to the Client.
FR12: [UJ-3] Operator can view and update Meeting Brief notes linked to the Client.
FR13: [UJ-3] Operator can view and update the Client's Commercial Next Step.
FR14: [UJ-3] Operator can view recent Client activity as operational memory and recent Audit Events as formal accountability records.
FR15: [UJ-3] Staff Portal must avoid introducing conflicting names for the same lifecycle object across Client Profile, Command Center, and Human Review.
FR16: [UJ-1] Operator can view a queue of Reports requiring Human Review.
FR17: [UJ-1] Operator can open a Report review workspace showing full Report navigation, Report context, all linked Gate Findings, current Report State, and available Report artifact/version history relevant to the review, including original, edited, regenerated, or historical versions when those artifacts exist.
FR18: [UJ-1] Operator can view each Gate Finding's type, verdict, confidence, severity when available, reasoning, details, flagged Report section when available, related intake evidence when available, suggested inspection steps when available, and linked Report context.
FR19: [UJ-1] Operator can mark a Gate Finding as in review.
FR20: [UJ-1] Operator can resolve a Gate Finding.
FR21: [UJ-1] Operator can override a Gate Finding only by providing an override reason.
FR22: [UJ-1] Operator can escalate a Gate Finding further when they cannot safely resolve it.
FR23: [UJ-1] Operator can record notes on a Gate Finding decision.
FR24: [UJ-1] Operator can make a whole-Report decision after completing the Report approval checklist: all Blocking Gate Findings are resolved or overridden with reason, required review note is present, Reason Code is selected, delivery impact is reviewed, and required Audit Event details are captured.
FR25: [UJ-1] Staff Portal must prevent Report approval when unresolved blocking Gate Findings remain.
FR26: [UJ-1] Operator can mark a Report as approved, rejected, regeneration required, or clarification required.
FR27: [UJ-1] `Approved` must mean the Report is safe for client delivery, and Staff Portal must make client delivery unavailable unless current Report State is Approved.
FR28: [UJ-1] `Regeneration required` in MVP records that regeneration is needed; Staff Portal does not perform whole-report or section-level regeneration.
FR29: [UJ-1] `Clarification required` in MVP creates or links an internal Follow-up; Staff Portal does not send a client-facing clarification request.
FR30: [UJ-1] High-risk Report decisions must capture decision actor, timestamp, Reason Code, review note, resulting Report State, and any follow-on owner/work item created by the decision.
FR31: [UJ-1] Staff Portal must create Audit Events for Gate Finding decisions and whole-Report decisions.
FR32: [UJ-4] Operator can create a Follow-up from a Client Profile.
FR33: [UJ-4] Operator can create or link a Follow-up from a Human Review decision when clarification or further action is needed.
FR34: [UJ-4] Operator can create a Follow-up from Meeting Brief notes.
FR35: [UJ-4] Operator can assign each Follow-up an owner.
FR36: [UJ-4] Operator can assign each Follow-up a due date.
FR37: [UJ-4] Operator can set each Follow-up source and consequence of inaction.
FR38: [UJ-4] Operator can link each Follow-up to a Client, mark whether it represents a client-visible promise, and optionally link it to a Report, Gate Finding, Meeting Brief, Commercial Next Step, support issue, admin/internal task, or delayed journey state.
FR39: [UJ-4] Operator can mark a Follow-up open, completed, deferred with reason, or reassigned.
FR40: [UJ-4] Staff Portal must identify Follow-ups that are due or overdue.
FR41: [UJ-4] Staff Portal must surface due and overdue Follow-ups in the Command Center and relevant Client Profile.
FR42: [UJ-4] Staff Portal must create Audit Events for Follow-up creation, completion, deferral, reassignment, due date changes, and first-overdue/missed events for client-visible promises; non-client-visible Follow-ups first becoming overdue must at least create Activity visibility.
FR43: [UJ-5] Operator can access the configured Calendly link from relevant Client meeting surfaces.
FR44: [UJ-5] Operator can create or update manual Meeting Brief notes for a Client, including staff-entered meeting date/time when known.
FR45: [UJ-5] Operator can set Meeting Brief State to draft, needs staff review, ready, stale/refresh needed, or completed.
FR46: [UJ-5] Operator can record meeting objective, talking points, sensitive issues, offer or next step to discuss, follow-up intention, final agenda or agenda notes, and a manual prep checklist.
FR47: [UJ-5] Staff Portal must warn when a Meeting Brief marked ready may be stale because one of the MVP stale-trigger events occurred.
FR48: [UJ-5] Staff Portal must prevent marking a Meeting Brief ready when a linked Report is not Approved; explicit no-approved-deliverable exceptions require a reason and Audit Event.
FR49: [UJ-5] Operator can create Follow-ups from Meeting Brief notes.
FR50: [UJ-5] Staff Portal must create Audit Events for Meeting Brief state changes and follow-up creation from meeting notes.
FR51: [UJ-6] Operator can record a Client's staff-entered Commercial Next Step.
FR52: [UJ-6] Operator can set Commercial Next Step Status to no action, nurture, discuss offer, send follow-up, or create future opportunity.
FR53: [UJ-6] Operator can add notes and an owner to the Commercial Next Step.
FR54: [UJ-6] Operator can create or link a Follow-up from the Commercial Next Step; statuses `discuss offer` and `send follow-up` require either a linked Follow-up or a note explaining why no Follow-up is needed.
FR55: [UJ-6] Staff Portal must not present Commercial Next Step as AI-generated or automatically scored in MVP.
FR56: [UJ-6] Staff Portal must create Audit Events when Commercial Next Step Status or owner changes.
FR57: [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must create Audit Events for Report State changes, Gate Finding State changes, Follow-up changes, Meeting Brief State changes, Commercial Next Step changes, and ownership changes on operational work.
FR58: [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Each Audit Event must include actor, timestamp, event type, affected Client when applicable, affected object, previous state when applicable, new state when applicable, and reason/note when applicable; high-risk lifecycle decisions must include a structured Reason Code where applicable plus a staff or reviewer note.
FR59: [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Operator can view recent Audit Events in the Client Profile.
FR60: [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Admin can view a broader Audit Trail across Clients and staff actions.
FR61: [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must preserve decision provenance for overrides and approvals.
FR62: [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must not allow high-risk state changes to occur without an Audit Event.
FR63: [UJ-1/UJ-2/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must restrict access to authenticated users with `admin` or `operator` role.
FR64: [UJ-1/UJ-2/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must apply role checks consistently to Staff Portal screens and data access.
FR65: [UJ-1/UJ-2/UJ-3/UJ-4/UJ-5/UJ-6] Admin can view all operational work and audit activity.
FR66: [UJ-1/UJ-2/UJ-3/UJ-4/UJ-5/UJ-6] Operator can perform operational review, follow-up, meeting-note, and Commercial Next Step actions within permitted queues.
FR67: [UJ-1/UJ-2/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must not introduce separate `reviewer`, `sales`, or `manager` roles in MVP.

### NonFunctional Requirements

NFR1: Safety — State transitions must enforce valid actions and blocking rules for Reports, Gate Findings, Follow-ups, Meeting Briefs, and Commercial Next Steps.
NFR2: Auditability — High-risk actions must leave durable Audit Events satisfying the Audit Trail requirements and 24-month retention/export floor.
NFR3: Consistency — Lifecycle terms must mean the same thing across all Staff Portal surfaces, and Commercial Next Step must remain the MVP implementation noun.
NFR4: Usability — Staff must be able to reach the next valid action from the Command Center or Client Profile without hunting through disconnected screens.
NFR5: Accessibility — Staff Portal UI should target WCAG 2.1 AA for core workflows, with architecture/UX later strengthening state-changing flows toward WCAG 2.2 AA expectations.
NFR6: Reliability — Staff Portal must not show stale readiness states without warning when an MVP stale-trigger event occurs.
NFR7: Security — Staff Portal data and APIs must be available only to authenticated `admin` and `operator` users, with queue visibility enforced.

### Additional Requirements

- Use the existing SvelteKit 2 / Svelte 5 / Cloudflare Pages repository as the starter foundation; do not initialize a new starter, monorepo, or parallel app shell.
- Deploy within the existing Cloudflare Pages + separate queue consumer worker architecture; long-running report generation/regeneration stays in Queue/Worker pipeline, not Pages handlers.
- Use Cloudflare D1 as production system of record with the existing async local SQLite fallback through `src/lib/server/db.ts`.
- Access production Cloudflare bindings through `event.platform.env` in SvelteKit routes and Worker `env` in workers; do not rely on production `process.env` bindings.
- Reuse Clerk authentication and existing `admin` / `operator` role model; production must ignore or reject `dev_user_id`.
- Staff Portal MVP extends the existing `/operator` route family; do not introduce `/staff`, `/admin`, a separate app shell, or starter-derived dashboard structure unless a later architecture decision reverses this.
- Add Staff Portal pages under `src/routes/operator/assessments/**` and mutation endpoint under `src/routes/api/operator/assessments/[assessmentId]/actions/+server.ts`.
- Keep routes thin: routes may authenticate, parse/validate inputs, call Staff Portal services/read models, and return governed DTOs; routes must not compute lifecycle legality, interpret raw statuses, construct audit records, or write lifecycle state directly.
- Put Staff Portal server-only business logic under `src/lib/server/staff-portal/**`, organized around domain, mappers, read-models, services, repositories, validation, and testing helpers.
- Put client-safe Staff Portal DTO types in `src/lib/staff-portal/dto.ts`; DTOs must be camelCase, governed, serializable, and free of server imports, DB rows, raw pipeline statuses, and transition logic.
- Put Staff Portal UI components under `src/lib/components/staff-portal/**`; UI components render server-provided view models and never infer action legality from raw status strings.
- Centralize canonical state/action/role unions, lifecycle vocabulary, transition matrix, reason codes, labels, blocked reasons, and UI state presentation metadata.
- Map brownfield `pipeline_status`, `assessment_gates`, `human_assist_reviews`, report artifacts, receipts, and existing review records into governed Staff Portal states before building API DTOs or UI view models.
- Raw pipeline statuses such as `ready`, `completed`, or `delivered` must not imply Staff Portal `Approved` without approval guardrails and Audit Event evidence.
- Implement brownfield mapping fixture tests for pending/running/delayed, ready/completed/delivered without approval, human_assist/pending review, in_review, approved, rejected, edited, failed/error, missing artifact, and conflicting records.
- Implement `getAvailableActions(...)` as the only action eligibility entrypoint producing action descriptors and blocked/disabled reason codes.
- Implement `commitStaffAction(...)` as the only lifecycle mutation boundary; it must re-check authentication, authorization, current state, stale/version preconditions, idempotency, action eligibility, audit creation, and receipt generation.
- Persist Audit Events as part of the same logical transition as state changes; audit write failure prevents lifecycle transition from being reported as successful.
- Add Staff Portal migrations under `migrations/`, including action/audit event persistence and idempotency support; keep local SQLite schema initialization synchronized.
- Minimum action/audit event persistence includes id, assessment_id, actor_id, action, from_state, to_state, reason_code, reason, request_hash, idempotency_key, and created_at.
- Enforce idempotency uniqueness within actor/assessment/action scope, such as `UNIQUE(actor_id, assessment_id, idempotency_key)`.
- Keep DB rows and `snake_case` fields inside repositories/mappers; API/view models are camelCase governed DTOs.
- Use Zod or equivalent runtime validation for non-trivial mutation request bodies parsed as `unknown`.
- Implement structured API error codes distinguishing staleState, permissionDenied, blockedAction, duplicateAction, validationFailed, and auditWriteFailed.
- Use bounded, indexed D1 queries for Command Center and Client Profile derivation; avoid N+1 aggregation and add limits/pagination where lists can grow.
- Separate formal Audit Events from operational Activity; Activity may summarize history but cannot substitute for formal Audit Events.
- Add structured logs/metrics for transition attempts, rejected transitions by reason, stale submissions, permission denials, audit-write failures, Command Center derivation errors, and brownfield mapping conflicts.
- Use repo-owned CSS custom properties and local Svelte components; do not add Tailwind, shadcn package adoption, Prisma/Postgres, Hono API layer, Lucia auth, generic workflow engine, command registry, dashboard framework, CRM shell, notification center, or new monorepo structure.
- Use Vitest for domain/service/repository/route tests and add risk-based Playwright only after UI exists for the highest-risk flows.
- Required blocking test coverage includes state mapping, action eligibility matrix, permission/ownership denial, invalid transitions, stale expected-state/version rejection, duplicate submit/idempotency, audit event creation, no duplicate audit event on retry, and route delegation to `commitStaffAction(...)`.

### UX Design Requirements

UX-DR1: Implement a desktop-first Command Console operating surface that prioritizes state, blocker, owner, due/age, consequence, and next valid action over passive dashboard metrics.
UX-DR2: Preserve the safe handoff loop across core flows: Prioritise/See state → Understand risk/blocker → Decide/take valid action → Record/audit → Advance or commit next action.
UX-DR3: Every decision surface must preserve the responsive order State → risk/blocker → context/evidence → valid action → receipt/audit proof.
UX-DR4: Work item rows must expose lifecycle state, owner, priority reason, risk level or risk reason, blocker status, readiness status, last meaningful event, next safe action, and consequence if ignored where relevant.
UX-DR5: Client Profile must include a “What Matters Now” panel showing current blocker, next valid action, owner, due date if applicable, and consequence of inaction.
UX-DR6: Human Review workspace must show report state, blocking Gate Findings, linked evidence, report context/artifact versions, approval checklist, guarded whole-report decision controls, and receipt/audit proof.
UX-DR7: Gate Finding detail UI must show type, verdict, confidence, severity when available, reasoning, details, flagged report section when available, related intake evidence when available, suggested inspection steps when available, linked report context, and decision notes.
UX-DR8: Follow-up UI must treat follow-ups as commitments with owner, due date, source, linked client context, status, consequence of inaction, and completion/deferral/reassignment record.
UX-DR9: Meeting Brief UI must show manual meeting date/time, objective, talking points, sensitive issues, offer/next step, follow-up intention, final agenda/notes, prep checklist, freshness, stale triggers, and linked report readiness warnings.
UX-DR10: Commercial Next Step UI must make the next step staff-entered and operational, with status, owner, notes, follow-up link or no-follow-up reason for `discuss offer` / `send follow-up`, and no AI scoring or CRM pipeline framing.
UX-DR11: Implement repo-owned CSS custom-property tokens for background, surface, border, text, focus, status, risk, warning, danger, success, audit semantics, spacing, typography, radius, disabled state, validation, and dark-mode capability.
UX-DR12: Extend existing slate/blue brand palette with semantic amber, green, and red usage: amber for attention/stale/risk, green only for proof-backed outcomes, red sparingly for blocked/unsafe/destructive/failed/irreversible actions.
UX-DR13: Keep typography compact, precise, and operational using Inter with a small hierarchy for page title, section title, body/control text, small/meta text, and receipt/audit metadata.
UX-DR14: Use consistent 8px/12px/16px/24px spacing relationships and desktop-first scan layouts without dense enterprise-admin clutter.
UX-DR15: Implement `CommandConsole` as a route-level composition for prioritized report review, follow-up, meeting brief, blocker, and commercial next-step work; it must not become a generic command framework.
UX-DR16: Implement `PriorityWorkItemRow` for scan-ready work summaries with client/work label, lifecycle state, blocker indicator, risk/confidence signal, owner, age/due date, priority reason, consequence, and next action link/control.
UX-DR17: Implement `DecisionWorkspace` as a composition shell for report review, follow-up, meeting brief, and client context decisions; it receives typed detail view models and must not own transition rules, action availability, or audit interpretation.
UX-DR18: Implement `StateBadge` for canonical lifecycle/readiness/follow-up/blocker/meeting/commercial/audit-related states using centralized presentation maps, visible text, non-colour cues, and accessible labels.
UX-DR19: Implement `RiskSignal` to show confidence, uncertainty, severity, escalation reason, stale context, or safety classification with explanation, source/trigger, severity/tone, and optional remediation link.
UX-DR20: Implement `BlockerPanel` to show blocker type, reason, owner, metadata, age, required next action, linked evidence/context, and permitted resolution controls.
UX-DR21: Implement `GuardedActionPanel` for approve/reject/rework/escalate/deliver/meeting-ready/commercial-commit actions with current state, proposed action, required preconditions, disabled reason, consequence preview, confirmation, rationale/reason fields, submit/cancel, failure recovery, stale rejection, and duplicate-submit protection.
UX-DR22: Implement `DecisionReceipt` rendered only after persistence succeeds, showing receipt/event ID, affected item, previous state, resulting state, actor, timestamp, rationale/reason, next owner/action, and audit reference.
UX-DR23: Implement `AuditTimeline` for persisted events only, showing event ID, actor, action, timestamp, affected entity, previous state, next state, rationale/summary, and linked receipt/context.
UX-DR24: Implement `FollowUpEditor` for owner/due/source/status commitments with draft/open/due/overdue/deferred/reassigned/completed/validation states and keyboard-accessible edit/save/cancel/complete/defer/reassign controls.
UX-DR25: Implement `MeetingBriefPanel` with draft/needs-review/ready/stale/blocked-by-report/incomplete/failed-refresh states, freshness text, unresolved blocker visibility, linked report/review state, and mark-ready controls.
UX-DR26: Implement `CommercialNextStepPanel` with missing/draft/active/needs-follow-up/completed/deferred/cancelled/stale/validation states and linked follow-up creation where required.
UX-DR27: High-impact actions must use readiness evidence, rationale capture, risk-proportionate confirmation, audit preview, guarded commit, recovery/error path, and post-action decision receipt.
UX-DR28: Confirmation intensity must be tiered: low-risk actions use inline confirmation or undo, medium-risk actions use confirmation dialog with consequence copy, and high-risk actions use target confirmation, audit preview, guarded commit, receipt, and recovery path.
UX-DR29: Disabled or unavailable actions that staff need to understand must show adjacent visible and accessible reasons covering blocked state, missing data, insufficient permission, stale context, validation failure, or unsupported state.
UX-DR30: Draft UI must remain visually distinct from persisted governance state; drafts must not update console state, receipts, or audit timeline until explicitly saved or submitted.
UX-DR31: Stale-state failures must preserve prior visible state, explain what changed, show current true state, and offer refresh or safe recovery without unsafe overwrite.
UX-DR32: Empty, loading, error, stale, permission-denied, validation-error, degraded-data, and action-failed states must be implemented for every data-driven screen where those states can occur.
UX-DR33: Permission-denied states must be non-leaking and must not expose restricted object names, counts, metadata, validation details, or search results unless the API permits disclosure.
UX-DR34: Navigation must support Command Console → affected work item → Decision Workspace → receipt/audit proof → return to Command Console, and Client Profile → linked context → action → inline receipt → return.
UX-DR35: Breadcrumbs, explicit return links, and stable page headings must preserve Command Console context without relying on browser history assumptions.
UX-DR36: Search/filter UI may only implement filters required by staff workflows, must distinguish local filtering from server search, show applied filters, handle empty/permission/stale states, and prevent late responses overwriting newer results.
UX-DR37: Desktop layouts at 1024px+ should use two-column or three-region review layouts where context beside action improves safety; tablet stacks supporting panels; mobile supports safe triage/lightweight review only.
UX-DR38: Mobile or small-screen use for complex approvals/escalations/delivery/audit-sensitive decisions must warn when screen size is not suitable unless the specific flow is tested for mobile.
UX-DR39: Core flows must meet WCAG 2.2 AA in UX implementation: semantic HTML, accessible names, keyboard-only operation, visible focus, dialog trap/return focus, associated validation errors, announced/discoverable status messages, no colour-only meaning, contrast compliance, and touch targets where relevant.
UX-DR40: Stateful components must expose stable semantic locators or approved `data-testid` hooks for repeated rows, guarded actions, state badges, receipts, validation errors, audit events, and dynamic workflow objects.
UX-DR41: Automated tests must cover success, validation failure, permission denial, stale state, duplicate submission prevention, audit receipt display, keyboard-only completion, and screen-reader discoverability for critical state-changing flows.
UX-DR42: Component boundaries must remain state-model-first: components render typed governance state supplied by application models and must not independently derive workflow meaning, transition legality, action availability, audit interpretation, or data fetching policy.
UX-DR43: Do not introduce Tailwind, generic third-party UI kits, command registries, workflow engines, plugin systems, theme generators, configurable dashboard frameworks, global action buses, autosave/draft infrastructure, rich text, recurrence, reminder workflows, notification scheduling, timeline virtualization, advanced audit search/export, CRM pipeline, sales analytics, productivity tracking, or broad dashboard variants for MVP.

### FR Coverage Map

### FR Coverage Map

FR1: Epic 2 - Command Center Prioritisation
FR2: Epic 2 - Command Center Prioritisation
FR3: Epic 2 - Command Center Prioritisation
FR4: Epic 2 - Command Center Prioritisation
FR5: Epic 2 - Command Center Prioritisation
FR6: Epic 2 - Command Center Prioritisation
FR7: Epic 3 - Client Profile Operational Memory
FR8: Epic 3 - Client Profile Operational Memory
FR9: Epic 3 - Client Profile Operational Memory
FR10: Epic 3 - Client Profile Operational Memory
FR11: Epic 3 - Client Profile Operational Memory
FR12: Epic 3 - Client Profile Operational Memory
FR13: Epic 3 - Client Profile Operational Memory
FR14: Epic 3 - Client Profile Operational Memory
FR15: Epic 3 - Client Profile Operational Memory
FR16: Epic 1 - Safe Report Review & Audited Decisioning
FR17: Epic 1 - Safe Report Review & Audited Decisioning
FR18: Epic 1 - Safe Report Review & Audited Decisioning
FR19: Epic 1 - Safe Report Review & Audited Decisioning
FR20: Epic 1 - Safe Report Review & Audited Decisioning
FR21: Epic 1 - Safe Report Review & Audited Decisioning
FR22: Epic 1 - Safe Report Review & Audited Decisioning
FR23: Epic 1 - Safe Report Review & Audited Decisioning
FR24: Epic 1 - Safe Report Review & Audited Decisioning
FR25: Epic 1 - Safe Report Review & Audited Decisioning
FR26: Epic 1 - Safe Report Review & Audited Decisioning
FR27: Epic 1 - Safe Report Review & Audited Decisioning
FR28: Epic 1 - Safe Report Review & Audited Decisioning
FR29: Epic 1 - Safe Report Review & Audited Decisioning
FR30: Epic 1 - Safe Report Review & Audited Decisioning
FR31: Epic 1 - Safe Report Review & Audited Decisioning
FR32: Epic 4 - Follow-up Commitments
FR33: Epic 4 - Follow-up Commitments
FR34: Epic 4 - Follow-up Commitments
FR35: Epic 4 - Follow-up Commitments
FR36: Epic 4 - Follow-up Commitments
FR37: Epic 4 - Follow-up Commitments
FR38: Epic 4 - Follow-up Commitments
FR39: Epic 4 - Follow-up Commitments
FR40: Epic 4 - Follow-up Commitments
FR41: Epic 4 - Follow-up Commitments
FR42: Epic 4 - Follow-up Commitments
FR43: Epic 5 - Meeting Brief & Commercial Continuity
FR44: Epic 5 - Meeting Brief & Commercial Continuity
FR45: Epic 5 - Meeting Brief & Commercial Continuity
FR46: Epic 5 - Meeting Brief & Commercial Continuity
FR47: Epic 5 - Meeting Brief & Commercial Continuity
FR48: Epic 5 - Meeting Brief & Commercial Continuity
FR49: Epic 5 - Meeting Brief & Commercial Continuity
FR50: Epic 5 - Meeting Brief & Commercial Continuity
FR51: Epic 5 - Meeting Brief & Commercial Continuity
FR52: Epic 5 - Meeting Brief & Commercial Continuity
FR53: Epic 5 - Meeting Brief & Commercial Continuity
FR54: Epic 5 - Meeting Brief & Commercial Continuity
FR55: Epic 5 - Meeting Brief & Commercial Continuity
FR56: Epic 5 - Meeting Brief & Commercial Continuity
FR57: Epic 1 - Safe Report Review & Audited Decisioning
FR58: Epic 1 - Safe Report Review & Audited Decisioning
FR59: Epic 3 - Client Profile Operational Memory
FR60: Epic 3 - Client Profile Operational Memory
FR61: Epic 1 - Safe Report Review & Audited Decisioning
FR62: Epic 1 - Safe Report Review & Audited Decisioning
FR63: Epic 1 - Safe Report Review & Audited Decisioning
FR64: Epic 1 - Safe Report Review & Audited Decisioning
FR65: Epic 1 - Safe Report Review & Audited Decisioning
FR66: Epic 1 - Safe Report Review & Audited Decisioning
FR67: Epic 1 - Safe Report Review & Audited Decisioning

## Epic List

### Epic 1: Safe Report Review & Audited Decisioning
Staff can review AI assessment reports, inspect Gate Findings, make safe report decisions, and produce audit-backed receipts before anything becomes client-deliverable.

**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR57, FR58, FR61, FR62, FR63, FR64, FR65, FR66, FR67

### Epic 2: Command Center Prioritisation
Operators and admins can see today's priority operational work, understand why each item matters, and navigate to the correct action surface.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 3: Client Profile Operational Memory
Staff can open a Client Profile and understand current state, blockers, recent activity, audit history, reports, findings, and “What Matters Now.”

**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR59, FR60

### Epic 4: Follow-up Commitments
Staff can create, assign, defer, reassign, complete, and audit follow-ups tied to clients, reports, findings, meetings, and operational promises.

**FRs covered:** FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR42

### Epic 5: Meeting Brief & Commercial Continuity
Staff can prepare meeting briefs, manage readiness/staleness, access Calendly context, and record lightweight staff-entered commercial next steps without creating a CRM.

**FRs covered:** FR43, FR44, FR45, FR46, FR47, FR48, FR49, FR50, FR51, FR52, FR53, FR54, FR55, FR56

### Epic 6: Pipeline Intake Quality [AICC Workflow Family]
Audit and redesign Annie's intake question sequence against the AI Communication Clarity (AICC) six-field framework, ensuring each intake captures goal, context, sources, constraints, quality bar, and definition of done before the downstream pipeline triggers.

**Requirements sourced from:** `docs/assessment-pipeline-workflow-integration-report.md` §2 — AI Communication Clarity (AICC-001 through AICC-003)

### Epic 7: Pipeline Gate Hardening [JLA Workflow Family]
Systematically evaluate and harden the 3 existing pipeline gates using the Judge Layer Architecture (JLA) methodology: audit the pipeline action surface, validate gate architecture, produce testable judge prompts, and generate evaluation suites.

**Requirements sourced from:** `docs/assessment-pipeline-workflow-integration-report.md` §1 — Judge Layer Architecture (JLA-001 through JLA-005)

**Cross-reference:** Staff Portal Epic 1 (Safe Report Review) depends on this epic's gates being hardened before staff review UX is built.

### Epic 8: Pipeline Retrieval Contracts [RRC Workflow Family]
Apply the RAG Retrieval Contracts (RRC) methodology to the tool research phase: produce formal retrieval contracts for Perplexity/Futurepedia/TAAFT queries, diagnose specific failures, and document architectural decisions.

**Requirements sourced from:** `docs/assessment-pipeline-workflow-integration-report.md` §3 — RAG Retrieval Contracts (RRC-001 through RRC-003)

### Epic 9: Pipeline Report Structure [HCMW + OFEWG Workflow Families]
Improve LLM analysis and report generation quality: apply structure-first drafting, extend to multi-artifact output, add pretty-but-wrong detection, and implement evidence traceability.

**Requirements sourced from:** `docs/assessment-pipeline-workflow-integration-report.md` §4 + §7 — High-Capability Model Workflows (HCMW-002, HCMW-004) + Office Files Evidence Workflow Guide (OFEWG-009, OFEWG-012)

### Epic 10: Pipeline Auto-Optimization Readiness [AIAS Workflow Family]
Run prerequisite diagnostics before investing in pipeline auto-optimization: Karpathy Triplet Diagnostic, metric gaming pre-mortem, and trace infrastructure audit.

**Requirements sourced from:** `docs/assessment-pipeline-workflow-integration-report.md` §5 — Auto-Improving Agent Safety (AIAS-001 through AIAS-003)

## Epic 1: Safe Report Review & Audited Decisioning

Staff can review AI assessment reports, inspect Gate Findings, make safe report decisions, and produce audit-backed receipts before anything becomes client-deliverable.

**Pipeline Dependencies (added 2026-05-28):** The 3-gate architecture (quick-wins-verification, major-project-verification, report-review) that feeds this epic's Human Review workspace has never been systematically evaluated for reliability. Per the [assessment-pipeline-workflow-integration-report](../../docs/assessment-pipeline-workflow-integration-report.md), the **Judge Layer Architecture (JLA)** workflow family provides prerequisite pipeline hardening:

- **JLA-001 (Action Surface Audit)** — maps every pipeline action by risk tier. Completing this before Story 1.3 (Report Review Queue) ensures the Staff Portal UI renders the right gate finding types and risk classifications.
- **JLA-005 (Gate Architecture Review)** — validates whether 3 gates are the right number and at the right boundaries. Completing this before Story 1.4 (Gate Finding Decisions) ensures staff review individual findings that correspond to a validated gate design.
- **JLA-002 + JLA-003 (Judge Prompts)** — produce testable gate prompts with ALLOW/BLOCK/REVISE/ESCALATE outcomes. These inform Story 1.5 (Whole Report Guarded Decisions) approval checklist design.

These pipeline prerequisites are tracked in **Epic 7 (Pipeline Gate Hardening)** below. Epic 1 stories 1.1-1.7 remain structurally correct — the JLA integration improves the pipeline-side gates before staff review UX is built.

### Story 1.1: Governed Staff Portal State Foundation

As an operator,
I want Staff Portal report and finding states to be governed consistently,
So that every review surface uses the same lifecycle language and action rules.

**Requirements Covered:** FR57, FR58, FR61, FR62, FR63, FR64, FR65, FR66, FR67; NFR1, NFR3, NFR7; UX-DR18, UX-DR19, UX-DR21, UX-DR42

**Acceptance Criteria:**

**Given** existing brownfield assessment, pipeline, artifact, gate, and human-assist records
**When** the Staff Portal read model maps them into report and gate-finding view models
**Then** raw statuses such as `ready`, `completed`, or `delivered` are never treated as Staff Portal `Approved` without approval evidence
**And** mapping fixture tests cover pending/running/delayed, ready/completed/delivered without approval, human_assist/pending review, in_review, approved, rejected, edited, failed/error, missing artifact, and conflicting records.

**Given** an authenticated staff user
**When** Staff Portal code checks available actions for a report or gate finding
**Then** `getAvailableActions(...)` is the only eligibility entrypoint
**And** it returns action descriptors with explicit allowed state, role, blocked reason, stale reason, and required audit metadata.

**Given** UI components render report, finding, blocker, risk, readiness, or action state
**When** they receive a Staff Portal DTO
**Then** they render centralized labels, tones, disabled reasons, remediation hints, and test hooks from typed presentation metadata
**And** they do not infer workflow legality from raw database status strings.

### Story 1.2: Audit and Idempotent Action Persistence

As an admin,
I want lifecycle actions to be persisted with audit and idempotency guarantees,
So that high-risk review decisions are accountable and retry-safe.

**Requirements Covered:** FR57, FR58, FR61, FR62; NFR1, NFR2, NFR7

**Acceptance Criteria:**

**Given** Staff Portal action/audit migrations are applied
**When** local SQLite initialization and D1 migrations are compared
**Then** both support action/audit event persistence with id, assessment_id, actor_id, action, from_state, to_state, reason_code, reason, request_hash, idempotency_key, and created_at
**And** idempotency is unique within actor, assessment, and idempotency key scope.

**Given** a staff action request is submitted
**When** `commitStaffAction(...)` executes
**Then** it re-checks authentication, authorization, current state, stale/version preconditions, idempotency, action eligibility, audit creation, and receipt generation
**And** no route writes lifecycle state directly.

**Given** an audit write fails
**When** a lifecycle transition is attempted
**Then** the state transition is not reported as successful
**And** the API returns a structured `auditWriteFailed` error.

### Story 1.3: Report Review Queue and Workspace Read Model

As an operator,
I want to open a queue and workspace for reports requiring human review,
So that I can inspect report context, artifacts, and blocking findings before deciding.

**Requirements Covered:** FR16, FR17, FR63, FR64, FR65, FR66, FR67; NFR4, NFR7; UX-DR6, UX-DR17, UX-DR32, UX-DR33

**Acceptance Criteria:**

**Given** reports require human review
**When** an operator opens the review queue
**Then** the queue lists permitted reports with client, report state, human review state, blocker summary, owner, age, and next safe action
**And** admin users can see all operational work while operators see only permitted assigned or shared-queue work.

**Given** an operator opens a report review workspace
**When** the workspace loads
**Then** it shows full report navigation, report context, linked Gate Findings, current Report State, and available report artifact/version history
**And** original, edited, regenerated, or historical versions appear only when those artifacts exist.

**Given** review workspace data is loading, empty, stale, permission denied, degraded, or failed
**When** the page renders
**Then** the state is visible and accessible
**And** no state-changing action is available without a visible reason.

### Story 1.4: Gate Finding Decision Actions

As an operator,
I want to review, resolve, override, or escalate individual Gate Findings,
So that each report blocker has an accountable decision before report approval.

**Requirements Covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR31, FR57, FR58, FR61; NFR1, NFR2; UX-DR7, UX-DR20

**Acceptance Criteria:**

**Given** a Gate Finding is displayed
**When** the operator inspects it
**Then** the UI shows type, verdict, confidence, severity when available, reasoning, details, flagged report section when available, related intake evidence when available, suggested inspection steps when available, linked report context, and decision notes
**And** status, risk, and blocker meaning are visible text, not colour alone.

**Given** an operator has permission for the finding
**When** they mark it in review, resolve it, override it with reason, escalate it, or record notes
**Then** the request goes through `commitStaffAction(...)`
**And** a persisted Audit Event records actor, timestamp, event type, affected client/object, previous state, new state, and reason or note when applicable.

**Given** an override is attempted without an override reason
**When** the operator submits the action
**Then** the action is rejected with a validation error associated with the reason field
**And** prior visible state remains unchanged.

### Story 1.5: Whole Report Guarded Decisions

As an operator,
I want report-level decisions to be guarded by checklist and blocker rules,
So that only safe reports can become client-deliverable.

**Requirements Covered:** FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR57, FR58, FR61, FR62; NFR1, NFR2; UX-DR21, UX-DR27, UX-DR28, UX-DR31

**Acceptance Criteria:**

**Given** unresolved blocking Gate Findings remain
**When** an operator attempts to approve a report
**Then** approval is blocked
**And** the UI explains the unresolved blockers and exposes the recovery path.

**Given** all blocking findings are resolved or overridden with reason
**When** the operator submits approved, rejected, regeneration required, or clarification required
**Then** the action requires the report approval checklist, required review note, Reason Code, delivery impact review, and required Audit Event details
**And** high-risk decisions capture actor, timestamp, reason code, note, resulting Report State, and follow-on owner or work item where created.

**Given** a report is not currently `Approved`
**When** client delivery is requested or shown as an option
**Then** delivery is unavailable
**And** `Regeneration required` only records that regeneration is needed while `Clarification required` creates or links an internal Follow-up without sending a client-facing request.

### Story 1.6: Decision Receipt and Audit Timeline Surfaces

As an operator,
I want successful decisions to produce visible receipts and audit history,
So that I can prove what changed and recover context later.

**Requirements Covered:** FR31, FR57, FR58, FR59, FR60, FR61, FR62; NFR2; UX-DR22, UX-DR23, UX-DR30, UX-DR40

**Acceptance Criteria:**

**Given** a state-changing review action succeeds
**When** persistence confirms success
**Then** a `DecisionReceipt` renders from the persisted event record with receipt/event ID, affected item, previous state, resulting state, actor, timestamp, rationale/reason, next owner/action, and audit reference
**And** no completed/success state is shown before persistence confirms success.

**Given** persisted audit events exist for a client, report, or finding
**When** `AuditTimeline` renders
**Then** it shows event ID, actor, action, timestamp, affected entity, previous state, next state, rationale/summary, and linked receipt/context
**And** it never renders audit entries from local optimistic state.

**Given** an action is pending, duplicated, stale, permission-denied, validation-failed, or blocked
**When** the UI responds
**Then** duplicate submission is prevented, prior state remains visible, and structured API errors distinguish staleState, permissionDenied, blockedAction, duplicateAction, validationFailed, and auditWriteFailed.

### Story 1.7: Safe Review UI Accessibility and Responsive Behaviour

As a keyboard or assistive-technology user,
I want review decisions to be fully operable and understandable,
So that safety-critical work is not blocked by accessibility gaps.

**Requirements Covered:** FR57, FR58, FR63, FR64, FR65, FR66, FR67; NFR5, NFR7; UX-DR3, UX-DR11, UX-DR12, UX-DR13, UX-DR14, UX-DR29, UX-DR32, UX-DR39, UX-DR41

**Acceptance Criteria:**

**Given** the review queue, workspace, state badges, risk signals, blocker panel, guarded action panel, receipts, and audit timeline are rendered
**When** a keyboard-only user reviews, decides, blocks, unblocks, escalates, inspects audit history, or recovers from validation errors
**Then** the workflow is completable without pointer input
**And** visible focus order follows State → risk/blocker → context/evidence → valid action → receipt/audit proof.

**Given** a screen reader user interacts with review flows
**When** state, blocker status, validation errors, loading states, stale-state warnings, or action results change
**Then** the information is announced or discoverable through semantic markup and live regions where appropriate
**And** colour is never the only signal for success, warning, error, stale, permission, or blocked state.

**Given** viewport width changes from desktop to tablet or mobile
**When** complex report approval, escalation, delivery, or audit-sensitive decisions are displayed below the tested safe-review size
**Then** the layout preserves state-first order and warns when the screen size is not suitable for safe review unless that flow has mobile test coverage.

## Epic 2: Command Center Prioritisation

Operators and admins can see today's priority operational work, understand why each item matters, and navigate to the correct action surface.

### Story 2.1: Command Center Priority Read Model

As an operator,
I want the Command Center to show only work with a valid next action,
So that I can focus on the most important operational decisions today.

**Requirements Covered:** FR1, FR2, FR3, FR5, FR6; NFR4; UX-DR1, UX-DR2, UX-DR15

**Acceptance Criteria:**

**Given** operational work exists across report review, follow-up, meeting brief, blocker, and commercial next-step domains
**When** the Command Center read model is derived
**Then** items are ordered using the MVP priority order and passive metrics are excluded unless a valid next action exists
**And** bounded indexed queries avoid N+1 aggregation and apply list limits or pagination where needed.

**Given** a work item is eligible for the Command Center
**When** it is returned to the UI
**Then** it includes client, current state, owner, due date or age when applicable, why it matters, consequence of inaction, priority reason, and next safe action
**And** all DTO fields are camelCase, serializable, and free of raw DB rows or server imports.

### Story 2.2: Command Console and Priority Work Item Rows

As an operator,
I want a scan-ready Command Console,
So that I can understand state, risk, and next action without hunting through disconnected screens.

**Requirements Covered:** FR1, FR2, FR3, FR4, FR6; NFR4, NFR5; UX-DR4, UX-DR15, UX-DR16, UX-DR18, UX-DR19, UX-DR40

**Acceptance Criteria:**

**Given** Command Center items are loaded
**When** the operator opens `/operator/assessments`
**Then** `CommandConsole` renders a hard-coded local action list for MVP with prioritized report review, follow-up, meeting brief, blocker, and commercial next-step work
**And** no command registry, plugin system, global event bus, workflow engine, or generic dashboard framework is introduced.

**Given** a priority row is displayed
**When** staff scan it
**Then** `PriorityWorkItemRow` exposes client/work label, lifecycle state, blocker indicator, risk/confidence signal, owner, age/due date, priority reason, consequence, and next action link/control
**And** repeated rows, state badges, and actions expose stable semantic locators or approved `data-testid` hooks.

**Given** a row has blocked, stale, permission-denied, empty, loading, or failed state
**When** it renders
**Then** the reason is visible and accessible
**And** unavailable actions are disabled with adjacent explanation rather than silently hidden unless restricted by permission.

### Story 2.3: Role-Based Queue Visibility

As an admin or operator,
I want Command Center visibility to respect my role and queue permissions,
So that staff see appropriate work without leaking restricted data.

**Requirements Covered:** FR5, FR63, FR64, FR65, FR66, FR67; NFR7; UX-DR33

**Acceptance Criteria:**

**Given** an admin opens the Command Center
**When** work is loaded
**Then** all operational work across staff ownership is visible
**And** audit-sensitive context is shown according to admin permissions.

**Given** an operator opens the Command Center
**When** work is loaded
**Then** only work assigned to them and unassigned shared-queue work they may claim is visible
**And** no `reviewer`, `sales`, or `manager` role is introduced.

**Given** an unauthorized or unauthenticated user requests Command Center data
**When** the route or API handles the request
**Then** access is denied through existing Clerk/operator auth helpers
**And** permission-denied responses do not leak restricted object names, counts, or metadata.

### Story 2.4: Command Center Navigation and Recovery

As an operator,
I want each priority item to take me to the correct work surface and back,
So that I can complete decisions while preserving context.

**Requirements Covered:** FR4, FR6; NFR4, NFR6; UX-DR34, UX-DR35, UX-DR36

**Acceptance Criteria:**

**Given** a Command Center item has a next safe action
**When** the operator activates it
**Then** they navigate to the relevant Client Profile, Report, Human Review workspace, Follow-up, or Meeting Brief
**And** breadcrumbs, explicit return links, and stable page headings preserve Command Console context without relying on browser history.

**Given** filters or local list refinement are implemented
**When** staff filter Command Center work
**Then** the UI distinguishes local `Filter this list` behaviour from server `Search records`
**And** empty results distinguish no records, no matching results, failed load, and permission-limited outcomes.

**Given** late or stale responses occur during refresh
**When** the list updates
**Then** late older responses do not overwrite newer results
**And** stale-state warnings prevent unsafe state-changing action until refresh or explicit allowed override.

## Epic 3: Client Profile Operational Memory

Staff can open a Client Profile and understand current state, blockers, recent activity, audit history, reports, findings, and “What Matters Now.”

### Story 3.1: Client Profile Snapshot Read Model

As an operator,
I want a governed Client Profile snapshot,
So that I can understand a client's operational state quickly.

**Requirements Covered:** FR7, FR15, FR63, FR64; NFR3, NFR7; UX-DR5, UX-DR32, UX-DR33

**Acceptance Criteria:**

**Given** a permitted client or assessment is opened
**When** the Client Profile read model loads
**Then** it includes business name, owner, journey stage, risk/value flags, current Report State, Human Review State, Meeting Brief State, Follow-up State, and Commercial Next Step Status
**And** the profile avoids conflicting lifecycle names across Client Profile, Command Center, and Human Review.

**Given** profile data is missing, stale, degraded, loading, error, or permission-denied
**When** the page renders
**Then** the state is visible, accessible, and non-leaking
**And** state-changing actions are blocked or warned according to the server-provided action descriptors.

### Story 3.2: What Matters Now Panel

As an operator,
I want the Client Profile to show what matters now,
So that I can identify the current blocker and next valid action immediately.

**Requirements Covered:** FR8; NFR3, NFR4; UX-DR5, UX-DR18, UX-DR20

**Acceptance Criteria:**

**Given** a client has operational work or blockers
**When** the Client Profile renders
**Then** the “What Matters Now” panel names the current blocker, next valid action, owner, due date if applicable, and consequence of ignoring it
**And** state precedence follows Blocked → Requires Decision → At Risk → Draft/Stale → Ready → Completed.

**Given** multiple states apply to the same client
**When** the panel decides the primary treatment
**Then** the highest-precedence state controls primary messaging and available action display
**And** the source domain remains clear to staff.

### Story 3.3: Linked Reports and Gate Findings Context

As an operator,
I want Client Profile access to reports and findings,
So that I can recover context without leaving the client record unclear.

**Requirements Covered:** FR9, FR10; NFR3, NFR6; UX-DR6, UX-DR19, UX-DR20

**Acceptance Criteria:**

**Given** current or historical reports exist for a client
**When** the operator opens the Client Profile
**Then** current and historical reports are linked with state, artifact/version context, and safe navigation to the review workspace
**And** missing artifacts or conflicting records are displayed as degraded context, not silently ignored.

**Given** unresolved or recently resolved Gate Findings exist
**When** the profile renders the findings section
**Then** it shows unresolved and recently resolved findings linked to the client's reports
**And** blocker, severity, confidence, and decision state are communicated with visible text and accessible names.

### Story 3.4: Activity Memory and Audit History

As an admin or operator,
I want operational activity and formal audit history on the Client Profile,
So that I can distinguish context memory from accountability records.

**Requirements Covered:** FR14, FR59, FR60; NFR2; UX-DR23

**Acceptance Criteria:**

**Given** operational activity and Audit Events exist for a client
**When** the Client Profile renders history
**Then** recent Client activity appears as operational memory and recent Audit Events appear as formal accountability records
**And** Activity never substitutes for required Audit Events.

**Given** an operator views a client profile
**When** recent audit history is displayed
**Then** the audit events show actor, timestamp, event type, affected object, previous state, new state, and reason/note when applicable
**And** entries link to receipts or source contexts when available.

**Given** an admin opens the broader Audit Trail
**When** audit records are loaded
**Then** broader audit activity across clients and staff actions is visible within MVP scope
**And** no advanced audit search, export, or timeline virtualization is introduced for MVP.

### Story 3.5: Client Profile Continuity Layout

As an operator,
I want the Client Profile layout to preserve context beside action,
So that I can safely move from client state to the right domain panel.

**Requirements Covered:** FR11, FR12, FR13, FR14; NFR4, NFR5; UX-DR3, UX-DR34, UX-DR35, UX-DR37

**Acceptance Criteria:**

**Given** the Client Profile is displayed on desktop widths
**When** sections render
**Then** “What Matters Now,” blockers, follow-ups, Meeting Brief readiness, Commercial Next Step, and recent audit context use a desktop-first two-column or three-region layout where useful
**And** tablet and mobile layouts preserve State → risk/blocker → context → valid action → receipt/audit proof order.

**Given** follow-up, meeting brief, or commercial functionality is not yet implemented or unavailable
**When** the profile renders its continuity sections
**Then** it shows a clear empty or unavailable state with safe navigation where applicable
**And** it does not imply completion or success unless that is true.

## Epic 4: Follow-up Commitments

Staff can create, assign, defer, reassign, complete, and audit follow-ups tied to clients, reports, findings, meetings, and operational promises.

### Story 4.1: Follow-up Commitment Model and Actions

As an operator,
I want follow-ups to be explicit commitments with owner, due date, source, and status,
So that operational promises are trackable and auditable.

**Requirements Covered:** FR32, FR35, FR36, FR37, FR38, FR39; NFR1, NFR2; UX-DR8, UX-DR24

**Acceptance Criteria:**

**Given** a follow-up is created
**When** staff submit it from a supported source
**Then** it records client link, owner, due date, source, consequence of inaction, client-visible promise flag, status, and optional links to report, gate finding, meeting brief, commercial next step, support issue, admin/internal task, or delayed journey state
**And** validation errors are visible and associated with relevant fields.

**Given** a follow-up exists
**When** staff mark it open, completed, deferred with reason, or reassigned
**Then** the transition is server-validated through the Staff Portal action boundary
**And** the previous visible state remains until persistence confirms success.

### Story 4.2: FollowUpEditor on Client Profile

As an operator,
I want to create and update follow-ups from the Client Profile,
So that client commitments can be managed in context.

**Requirements Covered:** FR11, FR32, FR35, FR36, FR37, FR38, FR39; NFR5; UX-DR24, UX-DR30, UX-DR39

**Acceptance Criteria:**

**Given** a permitted operator opens a Client Profile
**When** they create or edit a follow-up
**Then** `FollowUpEditor` supports owner, due date, source, status, consequence, client-visible flag, notes, save, cancel, complete, defer, and reassign controls
**And** draft edits are visually distinct from persisted governance state.

**Given** the user navigates away with meaningful unsaved follow-up edits
**When** destructive navigation is attempted
**Then** the UI warns before losing edits
**And** no audit, receipt, or Command Center state changes occur until the follow-up is saved.

**Given** a keyboard-only user operates the editor
**When** they edit, save, cancel, complete, defer, reassign, or recover from validation errors
**Then** all actions are keyboard accessible with visible focus and deterministic tab order.

### Story 4.3: Follow-ups from Review and Other Source Contexts

As an operator,
I want to create or link follow-ups from operational decisions,
So that clarification and further action are not lost after review or meeting work.

**Requirements Covered:** FR33, FR34, FR38, FR49, FR54; NFR1, NFR2; UX-DR8, UX-DR24

**Acceptance Criteria:**

**Given** a Human Review decision requires clarification or further action
**When** the operator records `Clarification required` or a follow-on action
**Then** Staff Portal creates or links an internal Follow-up to the client and relevant report/finding
**And** no client-facing clarification request is sent in MVP.

**Given** another supported context requests follow-up creation
**When** the follow-up source is Client Profile, Human Review decision, Meeting Brief notes, or Commercial Next Step
**Then** the same Follow-up service validates source, owner, due date, source object link, and consequence
**And** unsupported source types return structured validation errors.

### Story 4.4: Due and Overdue Follow-up Surfacing

As an operator,
I want due and overdue follow-ups to surface where I work,
So that client-visible promises and operational commitments are not missed.

**Requirements Covered:** FR40, FR41, FR42; NFR4, NFR6; UX-DR4, UX-DR8, UX-DR16

**Acceptance Criteria:**

**Given** follow-ups are due or overdue
**When** the Command Center and Client Profile read models are derived
**Then** due and overdue follow-ups appear with owner, due date, status, source, consequence of inaction, and client-visible promise indicator
**And** priority treatment reflects due/overdue state without counting completed or passive items as active work.

**Given** a follow-up first becomes overdue
**When** overdue detection runs or the relevant read model is derived
**Then** client-visible promises create a first-overdue/missed Audit Event
**And** non-client-visible follow-ups at least create Activity visibility.

### Story 4.5: Follow-up Audit Receipts and Failure States

As an admin,
I want follow-up changes to produce audit evidence and clear failure states,
So that commitment history remains trustworthy.

**Requirements Covered:** FR42, FR57, FR58, FR61, FR62; NFR2, NFR5; UX-DR22, UX-DR23, UX-DR31, UX-DR41

**Acceptance Criteria:**

**Given** a follow-up is created, completed, deferred, reassigned, or has its due date changed
**When** persistence succeeds
**Then** Staff Portal creates an Audit Event where required and displays a receipt or visible success state from the persisted record
**And** duplicate submissions do not create duplicate audit events.

**Given** a follow-up action fails because of permission, stale state, validation, duplicate submission, or audit write failure
**When** the UI receives the error
**Then** the prior state remains visible, recovery guidance is shown, and the error is announced or discoverable for assistive technology.

## Epic 5: Meeting Brief & Commercial Continuity

Staff can prepare meeting briefs, manage readiness/staleness, access Calendly context, and record lightweight staff-entered commercial next steps without creating a CRM.

### Story 5.1: Calendly Access and Meeting Brief Notes

As an operator,
I want to access scheduling context and maintain manual meeting brief notes,
So that meetings can be prepared without relying on an automated meeting system.

**Requirements Covered:** FR43, FR44, FR46; NFR4; UX-DR9, UX-DR25, UX-DR30

**Acceptance Criteria:**

**Given** a relevant client meeting surface is displayed
**When** Calendly access is available
**Then** the configured Calendly link is accessible from the surface
**And** the link is presented as scheduling context, not as an automated booking workflow inside Staff Portal.

**Given** an operator creates or updates Meeting Brief notes
**When** they save meeting date/time, objective, talking points, sensitive issues, offer or next step to discuss, follow-up intention, final agenda or agenda notes, or manual prep checklist
**Then** the notes are linked to the client and persisted as staff-entered meeting context
**And** draft notes remain visually distinct from committed state until saved.

### Story 5.2: Meeting Brief Readiness and Stale-State Guardrails

As an operator,
I want Meeting Brief readiness to reflect report safety and freshness,
So that staff do not use stale or unsafe preparation context.

**Requirements Covered:** FR45, FR47, FR48, FR50; NFR1, NFR2, NFR6; UX-DR25, UX-DR27, UX-DR31

**Acceptance Criteria:**

**Given** a Meeting Brief exists
**When** staff set its state
**Then** supported states are draft, needs staff review, ready, stale/refresh needed, and completed
**And** Meeting Brief state changes create Audit Events.

**Given** a linked report is not Approved
**When** staff attempt to mark the Meeting Brief ready
**Then** readiness is blocked unless an explicit no-approved-deliverable exception reason is provided
**And** exception use creates an Audit Event.

**Given** an MVP stale-trigger event occurs after a Meeting Brief is marked ready
**When** the brief is displayed
**Then** Staff Portal warns that it may be stale
**And** stale or incomplete data visibly blocks or warns before use.

### Story 5.3: MeetingBriefPanel and Meeting Follow-ups

As an operator,
I want Meeting Brief preparation and follow-up creation in one safe panel,
So that meeting context can lead to accountable next steps.

**Requirements Covered:** FR46, FR49, FR50; NFR4, NFR5; UX-DR25

**Acceptance Criteria:**

**Given** Meeting Brief data is available on Client Profile or meeting preparation surfaces
**When** `MeetingBriefPanel` renders
**Then** it shows meeting objective, talking points, sensitive issues, offer/next step, generated or updated timestamp, freshness, unresolved blockers, linked report/review state, readiness checklist, and mark-ready controls
**And** freshness, readiness, and blocked state are visible text and announced or discoverable when changed.

**Given** staff create a follow-up from Meeting Brief notes
**When** the follow-up is saved
**Then** it is linked to the client and meeting brief source context
**And** an Audit Event records follow-up creation from meeting notes.

### Story 5.4: Commercial Next Step Model and Panel

As an operator,
I want to record a staff-entered commercial next step,
So that commercial continuity is visible without becoming a CRM or AI score.

**Requirements Covered:** FR51, FR52, FR53, FR55; NFR3; UX-DR10, UX-DR26, UX-DR43

**Acceptance Criteria:**

**Given** a Client Profile or consultation handoff surface is displayed
**When** the operator records a Commercial Next Step
**Then** Staff Portal supports status values no action, nurture, discuss offer, send follow-up, and create future opportunity, plus owner and notes
**And** the UI makes clear that the next step is staff-entered and operational.

**Given** `CommercialNextStepPanel` renders
**When** staff view or edit it
**Then** it supports missing, draft, active, needs follow-up, completed, deferred, cancelled, stale, and validation states
**And** it avoids AI scoring, probability, pipeline stage management, sales analytics, productivity tracking, and CRM framing.

### Story 5.5: Commercial Follow-up Requirement and Audit

As an operator,
I want high-intent commercial statuses to require follow-up continuity,
So that commercial commitments do not become ambiguous.

**Requirements Covered:** FR54, FR56, FR57, FR58; NFR1, NFR2; UX-DR21, UX-DR26, UX-DR27

**Acceptance Criteria:**

**Given** Commercial Next Step status is `discuss offer` or `send follow-up`
**When** staff save the next step
**Then** the save requires either a linked Follow-up or a note explaining why no Follow-up is needed
**And** validation failures are visible, accessible, and do not change persisted state.

**Given** Commercial Next Step status or owner changes
**When** persistence succeeds
**Then** Staff Portal creates an Audit Event and shows persisted success feedback
**And** risky or high-impact commercial actions require proportionate confirmation.

### Story 5.6: Meeting and Commercial Responsive Accessibility

As a staff user on different devices or assistive technology,
I want meeting and commercial continuity flows to stay safe and understandable,
So that lightweight updates do not hide blockers or audit consequences.

**Requirements Covered:** FR50, FR56, FR57, FR58; NFR5; UX-DR3, UX-DR37, UX-DR38, UX-DR39, UX-DR41

**Acceptance Criteria:**

**Given** Meeting Brief or Commercial Next Step surfaces render at desktop, tablet, or mobile widths
**When** layout adapts
**Then** state, blocker/freshness, context, valid action, and receipt/audit proof remain in order
**And** safety-critical information is not hidden behind hover-only or icon-only affordances.

**Given** staff submit meeting-ready, commercial-commit, complete, defer, cancel, or linked follow-up actions
**When** pending, success, recoverable failure, or stale/blocked states occur
**Then** each response is observable, accessible, duplicate-submit safe, and backed by persisted events where required
**And** automated tests cover success, validation failure, permission denial, stale state, duplicate submission prevention, receipt display, keyboard-only completion, and screen-reader discoverability.

## Epic 6: Pipeline Intake Quality [AICC Workflow Family]

Audit and redesign Annie's intake question sequence against the AI Communication Clarity (AICC) six-field framework (goal, context, sources, constraints, quality bar, definition of done), ensuring intake quality before the downstream pipeline triggers.

**Sourced from:** `docs/assessment-pipeline-workflow-integration-report.md` §2 — AI Communication Clarity (AICC-001 through AICC-003)

**Pipeline context:** Annie (Retell voice + chat) currently asks 10 intake questions. The quality of all downstream pipeline stages depends on how well intake extracts actionable information. This epic audits and redesigns intake without changing the downstream pipeline code.

### Story 6.1: Intake Quality Audit (AICC-002)

As a pipeline developer,
I want to audit Annie's 10 intake questions against the AICC six-field framework,
So that gaps and ambiguities in intake are identified before they degrade report quality.

**Requirements sourced from:** AICC-002 Vague Ask Auditor

**Acceptance Criteria:**

**Given** the current 10-question intake sequence and sample intake transcripts
**When** AICC-002 is applied (the `docs/agentic-workflows/ai-communication-clarity/aicc-002-v1-vague-ask-auditor.md` prompt)
**Then** each question is assessed against the six fields (goal, context, sources, constraints, quality bar, definition of done)
**And** the audit produces a gap report identifying missing fields, ambiguous wording, and questions that don't map to downstream pipeline needs.

**Given** the audit identifies a field that intake never captures (e.g., constraints)
**When** the gap is documented
**Then** it includes which downstream stage needs that field, what the risk of missing it is, and what intake change would capture it.

### Story 6.2: Intake Question Redesign (AICC-001)

As a pipeline developer,
I want to redesign Annie's intake questions based on audit findings,
So that each question maps to a specific downstream pipeline need.

**Requirements sourced from:** AICC-001 Useful Question Builder

**Acceptance Criteria:**

**Given** the AICC-002 audit findings from Story 6.1
**When** AICC-001 is applied (natural conversation to extract the six fields)
**Then** a redesigned question sequence is produced where each question maps to a downstream stage (tool research, LLM analysis, report generation)
**And** questions are ordered from broad context-gathering to specific constraint-elicitation.

**Given** the redesigned intake is assessed against AICC's conversational design principles
**When** questions are reviewed for natural flow
**Then** the sequence does not feel robotic or interrogative despite covering all six fields
**And** voice-adapted phrasing (for Retell) is provided alongside text-adapted phrasing (for chat).

**Given** the pipeline prompts reference intake data
**When** the question redesign is finalized
**Then** a field mapping documents intake question → pipeline prompt variable → downstream stage.

### Story 6.3: Intake Completion Criteria (AICC-003)

As a pipeline developer,
I want a clear definition of what "intake is complete" means,
So that the pipeline does not trigger prematurely on incomplete intake data.

**Requirements sourced from:** AICC-003 Definition-of-Done Generator

**Acceptance Criteria:**

**Given** the redesigned intake from Story 6.2
**When** AICC-003 is applied to define completion
**Then** compact and expanded definitions of done are produced, covering which fields must be present and at what confidence level before pipeline triggering.

**Given** an intake session returns incomplete data
**When** the pipeline trigger check runs
**Then** the pipeline does not launch with missing required fields
**And** Annie is instructed to re-prompt for missing fields rather than the pipeline filling gaps with assumptions.

**Given** the intake completion criteria are implemented
**When** a sample set of intake transcripts is checked
**Then** completion is reliably detected and premature triggering is prevented.

---

## Epic 7: Pipeline Gate Hardening [JLA Workflow Family]

Systematically evaluate and harden the 3 existing pipeline gates using the Judge Layer Architecture (JLA) methodology: audit the action surface, validate gate architecture, produce testable judge prompts, and generate evaluation suites.

**Sourced from:** `docs/assessment-pipeline-workflow-integration-report.md` §1 — Judge Layer Architecture (JLA-001 through JLA-005)

**Cross-reference:** Staff Portal Epic 1 (Safe Report Review) consumes gate findings from this epic. JLA-001 and JLA-005 should complete before Epic 1 Stories 1.3-1.5.

**Pipeline context:** The pipeline has 3 gates: `quick-wins-verification`, `major-project-verification`, and `report-review`. They were architected as structural checkpoints but never systematically evaluated for reliability.

### Story 7.1: Pipeline Action Surface Audit (JLA-001)

As a pipeline safety reviewer,
I want a complete map of every action the pipeline can take classified by risk tier,
So that judge placement and criteria are based on a full risk picture, not assumptions.

**Requirements sourced from:** JLA-001 Action Surface Audit

**Acceptance Criteria:**

**Given** the full pipeline codebase (Annie intake, Perplexity tool research calls, LLM analysis generation, D1/R2 writes, SendGrid emails, gate evaluation)
**When** JLA-001 is applied (the `docs/agentic-workflows/judge-layer-architecture/jla-001-v1-action-surface-audit.md` prompt)
**Then** every action the pipeline can take is catalogued and classified into risk tiers: read-only, reversible writes, external side effects, and high-risk actions
**And** the audit identifies which actions currently bypass any gate evaluation entirely.

**Given** the action surface map exists
**When** gate placement is subsequently reviewed (Story 7.2)
**Then** each gate's scope is informed by the risk-tier map
**And** any high-risk actions not covered by a gate are flagged for judge placement.

### Story 7.2: Gate Architecture Review (JLA-005)

As a pipeline architect,
I want an architecture review of the 3-gate design,
So that we confirm the gates are the right number, at the right boundaries, and using the right judge types before investing in prompt writing.

**Requirements sourced from:** JLA-005 Judge Architecture Reviewer

**Acceptance Criteria:**

**Given** the action surface audit from Story 7.1 and current gate implementation details
**When** JLA-005 is applied
**Then** the review evaluates: (a) whether 3 gates are the right number, (b) whether they are placed at optimal pipeline boundaries, (c) whether specialist judges should replace the current monolithic approach, (d) failure modes if any gate is bypassed, and (e) whether memory provenance is adequate for gate decision context.

**Given** the architecture review recommends changes
**When** findings are documented
**Then** each recommendation includes: what should change, why, expected risk reduction, and whether it's a prerequisite or an optimization
**And** the review confirms or rejects the current 3-gate design before story 7.3 proceeds.

**Given** the review identifies the optimal gate boundaries
**When** the Staff Portal Epic 1 Human Review workspace is built
**Then** gate finding types and review flow align with the validated gate architecture.

### Story 7.3: Gate Judge Prompt Design (JLA-002 + JLA-003)

As a pipeline developer,
I want production-ready judge prompts for each validated gate,
So that gate decisions use structured criteria rather than implicit quality judgments.

**Requirements sourced from:** JLA-002 Judge Criteria & Action Proposal Designer + JLA-003 Judge Prompt Writer

**Acceptance Criteria:**

**Given** the validated gate architecture from Story 7.2
**When** JLA-002 is applied to design judge criteria for each gate
**Then** each gate has explicit criteria across authorization, evidence, exposure/risk, and policy dimensions
**And** criteria include what the gate must evaluate, what it can ignore, and anti-gaming protections.

**Given** the gate criteria are defined
**When** JLA-003 is applied to produce judge prompts
**Then** each prompt uses structured outcomes: ALLOW, BLOCK, REVISE, ESCALATE
**And** prompts include: role, context window, decision criteria, structured output format, anti-gaming safeguards, and examples of each outcome type.

**Given** a judge prompt is tested against known failure cases
**When** the prompt is evaluated
**Then** it correctly BLOCKs reports that should be blocked and ALLOWs reports that should pass
**And** false-allow and false-block rates are measurable through the evaluation suite in Story 7.4.

### Story 7.4: Gate Evaluation Suites (JLA-004)

As a pipeline quality engineer,
I want evaluation suites that verify each gate catches its target failure modes,
So that gate reliability is measurable and improvable over time.

**Requirements sourced from:** JLA-004 Judge Evaluation Suite Generator

**Acceptance Criteria:**

**Given** the judge prompts from Story 7.3
**When** JLA-004 is applied
**Then** at least 20 test cases are generated per gate covering all outcome categories: true ALLOW, true BLOCK, false ALLOW (missed problem), false BLOCK (overly strict), ambiguous/boundary, gaming attempt, and ESCALATE-triggering cases.

**Given** the evaluation suite exists
**When** a gate prompt is modified
**Then** the suite can be re-run to detect regressions before the prompt change is deployed to production
**And** results include per-category pass rates and specific case-by-case reasoning.

**Given** an evaluation run produces failing cases
**When** results are reviewed
**Then** failing cases include: expected outcome, actual outcome, gate reasoning trace, and suggested prompt modification to address the failure.

---

## Epic 8: Pipeline Retrieval Contracts [RRC Workflow Family]

Apply the RAG Retrieval Contracts (RRC) methodology to the tool research phase: produce formal retrieval contracts for Perplexity/Futurepedia/TAAFT queries, diagnose specific failures, and document architectural decisions.

**Sourced from:** `docs/assessment-pipeline-workflow-integration-report.md` §3 — RAG Retrieval Contracts (RRC-001 through RRC-003)

**Pipeline context:** The tool research phase uses Perplexity to query Futurepedia and TAAFT for relevant AI tools. This is a retrieval problem with known failure modes (stale data, wrong retrieval unit, missing provenance).

### Story 8.1: Tool Research Retrieval Contract (RRC-001)

As a pipeline developer,
I want a formal retrieval contract for the tool research phase,
So that tool data sources, staleness tolerances, and expected output are explicit and auditable.

**Requirements sourced from:** RRC-001 Retrieval Contract Spec

**Acceptance Criteria:**

**Given** the current tool research implementation (Perplexity → Futurepedia/TAAFT)
**When** RRC-001 is applied (the `docs/agentic-workflows/rag-retrieval-contracts/rrc-001-v1-retrieval-contract-spec.md` prompt)
**Then** a formal contract is produced specifying: (a) work object (what is being retrieved), (b) retrieval units (web search results vs. structured catalog entries), (c) authoritative sources with hierarchy (Futurepedia vs. TAAFT), (d) permissions, (e) provenance requirements (which source, when queried), (f) compiled context format, and (g) write-back expectations.

**Given** the retrieval contract is defined
**When** a Perplexity query returns results
**Then** results are validated against the contract's source hierarchy and staleness tolerances
**And** results from non-authoritative sources or stale data are flagged rather than silently accepted.

### Story 8.2: Retrieval Failure Diagnostics (RRC-002)

As a pipeline developer,
I want to diagnose specific retrieval failures against seven failure modes,
So that production issues produce minimum viable fixes rather than ad-hoc patches.

**Requirements sourced from:** RRC-002 Retrieval Failure Triage

**Acceptance Criteria:**

**Given** documented tool research failures from production (e.g., Perplexity returning 2023 articles for 2025 tools, conflicting Futurepedia vs. TAAFT results, missing tool recommendations)
**When** RRC-002 is applied
**Then** each failure is triaged against the seven failure modes: stale data, non-authoritative source, wrong retrieval unit, missing source, permission gap, provenance gap, and compilation error
**And** each triaged failure receives a minimum viable fix recommendation.

**Given** a fix is recommended but not implementable within current constraints
**When** the failure is documented
**Then** it includes: what the fix would require, what the interim mitigation is, and what triggers the fix becoming implementable.

### Story 8.3: Retrieval Architecture Decision Record (RRC-003)

As a pipeline architect,
I want an ADR documenting the retrieval system's architectural decisions,
So that future maintainers understand why the retrieval works as it does.

**Requirements sourced from:** RRC-003 Retrieval Stack ADR

**Acceptance Criteria:**

**Given** the retrieval contract (Story 8.1) and failure diagnostics (Story 8.2)
**When** RRC-003 is applied
**Then** an ADR is produced documenting: (a) why Perplexity is the retrieval mechanism, (b) why Futurepedia and TAAFT are the chosen sources, (c) the source hierarchy and staleness policies, (d) alternatives considered and rejected, and (e) known limitations and monitoring expectations.

**Given** the ADR exists
**When** a new team member or agent needs to understand the retrieval design
**Then** the ADR provides sufficient context to evaluate changes without tribal knowledge.

---

## Epic 9: Pipeline Report Structure [HCMW + OFEWG Workflow Families]

Improve LLM analysis and report generation quality: apply structure-first drafting (argument before writing), extend to multi-artifact output, add pretty-but-wrong detection, and implement claim-to-source evidence traceability.

**Sourced from:** `docs/assessment-pipeline-workflow-integration-report.md` §4 + §7 — High-Capability Model Workflows (HCMW-002, HCMW-004) + Office Files Evidence Workflow Guide (OFEWG-009, OFEWG-012)

**Pipeline context:** The LLM analysis phase currently generates a single assessment report from intake + tool research data. Reports are comprehensive lists rather than argued assessments with evidence. This epic restructures report generation for quality and verifiability.

**Dependencies:** Builds on Epic 7 (Gate Hardening) — better gates catch better-structured reports. Can proceed in parallel after Epic 7 Story 7.2 completes.

### Story 9.1: Structure-First Drafting (HCMW-004)

As a pipeline developer,
I want the LLM analysis to produce a structural plan before writing the report,
So that assessment reports are argument-driven rather than list-driven.

**Requirements sourced from:** HCMW-004 Structure-First Draft

**Acceptance Criteria:**

**Given** intake data and tool research results are available for an assessment
**When** HCMW-004 is applied to the LLM analysis prompt (the `docs/agentic-workflows/high-capability-model-workflows/hcmw-004-v1-structure-first-draft.md` prompt)
**Then** the LLM first produces a structural plan (thesis/central argument, supporting arguments with evidence placement, counterargument handling, conclusion direction) before writing prose.

**Given** the structural plan is produced
**When** it is reviewed before the full report is generated
**Then** the plan can be accepted, revised, or rejected without wasting a full generation
**And** rejected plans include structured feedback that guides the next attempt.

**Given** the structure-first approach is active
**When** reports are compared to the previous list-driven approach (A/B evaluation)
**Then** structured reports show clear argument progression, evidence-anchored claims, and logical conclusions rather than comprehensive-but-incoherent lists.

### Story 9.2: Multi-Artifact Report Output (HCMW-002)

As a pipeline developer,
I want the report generation phase to produce a complete artifact set,
So that assessment deliverables are consistent across executive summary, detailed findings, tool matrix, and roadmap.

**Requirements sourced from:** HCMW-002 Multi-Artifact Work Package

**Acceptance Criteria:**

**Given** the structure-first approach from Story 9.1 is in place
**When** HCMW-002 is applied to report generation (the `docs/agentic-workflows/high-capability-model-workflows/hcmw-002-v1-multi-artifact-work-package.md` prompt)
**Then** the pipeline produces: executive summary, detailed findings section, tool recommendation matrix, and phased implementation roadmap as distinct artifacts with cross-artifact consistency checks.

**Given** multi-artifact output is generated
**When** cross-artifact consistency is checked
**Then** contradictions between artifacts are detected (e.g., tool recommended in matrix but not mentioned in roadmap, timeline in summary different from detailed roadmap)
**And** detected contradictions are flagged for human review rather than silently delivered.

**Given** the multi-artifact approach is active
**When** compared to single-report output
**Then** each artifact is independently usable (executive summary is self-contained for quick reads, detailed findings support deep dives, tool matrix supports procurement decisions).

### Story 9.3: Pretty-But-Wrong Detection (OFEWG-012)

As a pipeline quality engineer,
I want the report-review gate to catch unsupported claims and untraceable assertions,
So that confident-sounding but evidence-free prose does not reach clients.

**Requirements sourced from:** OFEWG-012 Pretty-But-Wrong Detector

**Acceptance Criteria:**

**Given** a generated assessment report
**When** the report-review gate applies OFEWG-012 methodology (adapted from the `docs/agentic-workflows/office-files-evidence-workflow-guide/ofewg-012-v1-pretty-but-wrong-detector.md` prompt)
**Then** the gate identifies: claims without source attribution, numbers without calculation traceability, charts/graphs described but not backed by data, assumptions presented as facts, and persuasive prose masking insufficient evidence.

**Given** the gate flags unsupported claims
**When** results are reported
**Then** each flag includes: the claim, why it's unsupported, what evidence would be needed to support it, and whether the claim is likely correct but unproven or likely incorrect.

**Given** a report with flagged claims reaches the Staff Portal Human Review workspace (Epic 1)
**When** staff review the report
**Then** flagged claims are surfaced as Gate Findings with confidence and severity indicators.

### Story 9.4: Evidence Traceability (OFEWG-009)

As a pipeline developer,
I want every claim in the final report to have a traceable source,
So that client questions about "why this recommendation" have auditable answers.

**Requirements sourced from:** OFEWG-009 Evidence Map Builder

**Acceptance Criteria:**

**Given** the report generation pipeline produces assessment reports
**When** OFEWG-009 methodology is applied (adapted from the `docs/agentic-workflows/office-files-evidence-workflow-guide/ofewg-009-v1-evidence-map-builder.md` prompt)
**Then** a traceability matrix maps: every report claim → source (intake answer #N, Futurepedia result #M, TAAFT entry ID, LLM inference from specific data) → timestamp → confidence level.

**Given** the traceability matrix exists
**When** a client or staff member asks why a specific tool was recommended
**Then** the source chain is retrievable: which intake need → which tool research query → which catalog entry → which capability claim.

**Given** a claim has no traceable source
**When** the evidence map is built
**Then** it is flagged as "LLM inference only" with a confidence marker
**And** report-review gate treats unsourced claims as review-required findings.

---

## Epic 10: Pipeline Auto-Optimization Readiness [AIAS Workflow Family]

Run prerequisite diagnostics before investing in automated pipeline optimization: determine whether the pipeline has a modifiable surface, measurable metric, and reasonable experiment cycle time; pre-mortem metric gaming vectors; and audit trace infrastructure for attribution.

**Sourced from:** `docs/assessment-pipeline-workflow-integration-report.md` §5 — Auto-Improving Agent Safety (AIAS-001 through AIAS-003)

**Pipeline context:** Scripts like `bench-pipeline.mjs` and `test-model-variations.mjs` suggest pipeline optimization is being explored. This epic runs diagnostics before investing in autoresearch/auto-optimization loops. AIAS-001 may produce a Blocker Report (most valuable output) if the pipeline is not ready.

### Story 10.1: Karpathy Triplet Diagnostic (AIAS-001)

As a pipeline developer,
I want to know whether the pipeline is ready for automated optimization,
So that optimization investment is not wasted on a system that can't actually be improved.

**Requirements sourced from:** AIAS-001 Karpathy Triplet Diagnostic

**Acceptance Criteria:**

**Given** the current pipeline codebase and operational setup
**When** AIAS-001 is applied (the `docs/agentic-workflows/auto-improving-agent-safety/aias-001-v1-karpathy-triplet-diagnostic.md` prompt)
**Then** the diagnostic evaluates three questions: (a) What would be modified? (prompts? model selection? gate criteria? tool research queries?), (b) What metric would be optimized? (report quality? generation time? cost per assessment?), (c) What is the experiment cycle time? (time from change to metric reading).

**Given** the diagnostic produces a program.md (system is ready)
**When** the program is reviewed
**Then** it specifies the editable surface, optimization metric, experiment budget, safety constraints, and expected cycle time per experiment iteration.

**Given** the diagnostic produces a Blocker Report (system is not ready)
**When** blockers are documented
**Then** each blocker includes: what is missing, why it prevents optimization, and what must be built or defined before re-running the diagnostic.

### Story 10.2: Metric Gaming Pre-Mortem (AIAS-002)

As a pipeline quality engineer,
I want to identify how optimization could game the chosen metric without delivering business value,
So that the optimization target is hardened against Goodhart's Law before experiments begin.

**Requirements sourced from:** AIAS-002 Metric-Gaming Pre-Mortem

**Acceptance Criteria:**

**Given** the optimization metric from AIAS-001 (or candidate metrics if the system isn't ready)
**When** AIAS-002 is applied (the `docs/agentic-workflows/auto-improving-agent-safety/aias-002-v1-metric-gaming-pre-mortem.md` prompt)
**Then** gaming vectors are identified: how could an optimization agent inflate the metric without delivering business value?
**And** secondary metrics are proposed that would catch gaming behavior.

**Given** gaming vectors are identified for a metric like "report generation speed"
**When** the pre-mortem completes
**Then** it includes: gaming scenario (e.g., generating shorter reports, skipping evidence), detection strategy (secondary metrics: report length, claim count, evidence density), and holdout scenarios that would reveal gaming.

**Given** secondary metrics are defined
**When** the optimization loop runs
**Then** both primary and secondary metrics are tracked
**And** primary improvement at the cost of secondary degradation triggers human review.

### Story 10.3: Trace Infrastructure Audit (AIAS-003)

As a pipeline developer,
I want to audit whether the pipeline's observability supports attribution of improvements to specific changes,
So that optimization results are trustworthy rather than coincidental.

**Requirements sourced from:** AIAS-003 Trace Infrastructure Audit

**Acceptance Criteria:**

**Given** the pipeline's current logging, metrics, and monitoring setup
**When** AIAS-003 is applied (the `docs/agentic-workflows/auto-improving-agent-safety/aias-003-v1-trace-infrastructure-audit.md` prompt)
**Then** the audit evaluates 10 trace requirements: reasoning traces, tool call granularity, session reproducibility, metric attribution, change-to-result linking, failure attribution, A/B comparison support, cost per experiment, regression detection speed, and trend confidence over noise.

**Given** trace gaps are identified
**When** the audit produces recommendations
**Then** each gap includes: which requirement is unmet, how it affects trust in optimization results, and minimum infrastructure needed to close the gap.

**Given** trace infrastructure is insufficient for automated optimization
**When** the audit report is reviewed
**Then** optimization experiments are gated until trace requirements are met
**And** a phased trace improvement plan is included with the audit.

---

## Epic 11: Clients CRM

**Triggered by:** Sprint Change Proposal 2026-06-05-clients-crm-page
**Phase:** Post-MVP Track
**Goal:** Extend the Staff Portal with a full Clients CRM surface. Provide a Clients List and per-client record with four editable sections (Company/Demographic, Files, Interaction Log, Tasks/Appointments). Integrate with the existing ClientProfile and Command Center.

### Story 11.1: Clients Data Model and Migration

As a staff platform engineer,
I want a normalized `clients` table with full demographic fields and proper indexes,
So that the Staff Portal can store and query client records efficiently.

**Acceptance Criteria:**

**Given** the existing D1 schema has only `users` (clerk_id, email, name, phone, created_at) and `user_reports`
**When** the migration 0025_clients_crm.sql runs
**Then** a new `clients` table is created with: id (TEXT PK), clerk_user_id (nullable FK to users.clerk_id), company_name, trading_name, primary_contact_name, job_title, email, phone, secondary_phone, website, billing_address, shipping_address, tax_id, industry, company_size, lead_source, assigned_staff_id, status, tags (JSON array), custom_fields (JSON), created_at, updated_at
**And** indexes on: company_name, email, status, assigned_staff_id, clerk_user_id
**And** 4 supporting tables are created: `client_files`, `client_interactions`, `client_tasks`, `client_tags` (or inlined into clients.tags JSON)
**And** the migration is idempotent and runs cleanly on local D1 + production

**Given** a client is later associated with a Clerk user via clerk_user_id
**When** the user creates an assessment
**Then** the assessment's client_id can resolve back to the clients record for the Client Profile aggregation

### Story 11.2: Clients Repository and Service Layer

As a staff backend engineer,
I want a repository + service pair for clients with audit logging and RBAC,
So that the API layer has a clean, testable surface for CRUD.

**Acceptance Criteria:**

**Given** the `clients` table exists
**When** a service call is made (create, update, list, get, delete)
**Then** the operation is logged in `staff_audit_events` with action type, actor, target, and metadata
**And** list operations support filters: status, assigned_staff_id, search across company_name/contact/email/phone/tags
**And** pagination is server-side with limit/offset and total count returned
**And** unit tests cover happy path, validation errors, and RBAC denials

### Story 11.3: Client Files Subsystem (R2-Backed)

As a staff operator,
I want to upload, list, view, and delete files associated with a client,
So that I have a single place for transaction recordings, contracts, invoices, and notes.

**Acceptance Criteria:**

**Given** a client exists
**When** I POST a multipart upload to `/api/staff/clients/:clientId/files` with file, category, optional description
**Then** the file is stored in R2 with a per-client key prefix (e.g. `clients/{clientId}/{fileId}-{filename}`)
**And** a `client_files` row is created with file_name, file_type, category, size, uploaded_by, uploaded_at, r2_key, description
**And** mime type and size (max 10MB MVP) are validated server-side

**Given** a client has files
**When** I GET `/api/staff/clients/:clientId/files`
**Then** the response lists all files with the metadata above

**Given** I have files selected
**When** I POST `/api/staff/clients/:clientId/files/delete` with a list of file IDs
**Then** confirmation is required and the files are removed from R2 and the `client_files` table

### Story 11.4: Interaction Log

As a staff operator,
I want to log every interaction with a client (phone, email, meeting, work, notes, status updates) and view/edit/delete past entries,
So that I have a complete chronological record of client engagement.

**Acceptance Criteria:**

**Given** a client exists
**When** I POST `/api/staff/clients/:clientId/interactions` with type, summary, occurred_at, optional linked file/task IDs
**Then** a `client_interactions` row is created and the response includes the new entry

**Given** interactions exist
**When** I GET the same endpoint with filters (type, staff, date range)
**Then** only matching interactions are returned in reverse-chronological order

**Given** an interaction exists
**When** I PATCH or DELETE it
**Then** the change is reflected and audit-logged

### Story 11.5: Tasks and Appointments

As a staff operator,
I want to create, edit, complete, reschedule, and delete tasks and appointments for a client,
So that scheduled work is visible and trackable.

**Acceptance Criteria:**

**Given** a client exists
**When** I POST `/api/staff/clients/:clientId/tasks` with type (task/appointment), title, due_at, assigned_staff_id, status, priority, description
**Then** a `client_tasks` row is created and returned

**Given** a task exists
**When** I PATCH it (title, due_at for reschedule, status, priority, description)
**Then** the change is reflected and audit-logged

**Given** a task is completed
**When** I PATCH status=completed
**Then** completed_at is set and the UI renders it in muted/disabled style

**Given** no tasks exist for a client
**Then** the empty state shows "No scheduled work for this client."

### Story 11.6: Clients List View

As a staff operator,
I want a paginated, searchable, sortable table of all clients,
So that I can find a specific client and create new ones.

**Acceptance Criteria:**

**Given** I navigate to `/staff/clients`
**Then** I see a table with columns: Company, Primary Contact, Email, Phone, Status, Tags, Last Interaction, Created
**And** a search field at the top filters across company_name, primary_contact_name, email, phone, client_id, tags, status
**And** columns are sortable (click header)
**And** pagination is server-side (25 rows per page)
**And** a "New Client" button is visible at the top right
**And** each row can be clicked to open the record, OR has an explicit "Open" action
**And** the empty state shows "No clients yet. Add your first."

**When** I click "New Client"
**Then** a blank record form opens

### Story 11.7: Client Record View — Shell and Navigation

As a staff operator,
I want a single page for a client's full record with smooth navigation between the four sections,
So that I can see all context in one place.

**Acceptance Criteria:**

**Given** I navigate to `/staff/clients/[clientId]`
**Then** I see a header (Company Name, Status badge, breadcrumb Staff › Clients › {Name})
**And** a sub-nav with 4 tabs/sections: Company & Demographics, Files, Interactions, Tasks
**And** clicking a tab scrolls to (or activates) the corresponding section
**And** browser back/forward respects the section state

### Story 11.8: Section 1 — Company and Demographic Editor

As a staff operator,
I want to create, edit, and save a client's full company and demographic record,
So that I have a complete CRM view of who the client is.

**Acceptance Criteria:**

**Given** I open the Company & Demographics section
**Then** I see a form with fields: company_name, trading_name, primary_contact_name, job_title, email, phone, secondary_phone, website, billing_address, shipping_address, tax_id, industry, company_size, lead_source, assigned_staff_member, client_status, tags
**And** form validation prevents save with required-field violations
**And** clear Save and Cancel actions exist
**And** Cancel discards changes and reverts to the persisted record

**When** I click "New Client" from the list and submit the form
**Then** the client is created and I land on the new record's view

### Story 11.9: Section 2 — Files

As a staff operator,
I want to manage files for a client (upload, list, view/download, multi-select delete with confirmation),
So that I can keep all client-related documents in one place.

**Acceptance Criteria:**

**Given** I open the Files section
**Then** I see a table of files (file name, type, category, size, uploaded by, uploaded at)
**And** a "Upload file" button opens a dialog with category dropdown and description field
**And** rows have a checkbox for multi-select
**And** a "Delete selected" button is enabled when ≥1 is selected and shows a confirmation dialog
**And** each file has a "View" link that opens/downloads it
**And** the empty state shows "No files for this client. Upload your first."

### Story 11.10: Section 3 — Interaction Log

As a staff operator,
I want to add, view, edit, and delete interaction entries and filter them,
So that I have a complete chronological log of client engagement.

**Acceptance Criteria:**

**Given** I open the Interactions section
**Then** I see entries in reverse-chronological order, each showing date/time, type, staff, summary, linked files/tasks
**And** a "Log interaction" button opens an inline form (type dropdown, summary, date/time)
**And** filters at the top support type, staff member, and date range
**And** each entry has View / Edit / Delete actions
**And** the empty state shows "No interactions logged yet."

### Story 11.11: Section 4 — Tasks and Appointments

As a staff operator,
I want to create, edit, complete, reschedule, and delete tasks and appointments for a client,
So that scheduled work is visible and trackable.

**Acceptance Criteria:**

**Given** I open the Tasks section
**Then** I see a list of items with title, type (task/appointment), due date/time, assigned staff, status, priority, short description
**And** completed items are visually distinct (muted, struck through, or similar)
**And** each item has Edit, Complete (toggle), Reschedule, Delete actions
**And** a "New task" / "New appointment" button opens an inline form
**And** the empty state shows "No scheduled work for this client."

### Story 11.12: Integration — Command Center and Existing ClientProfile

As a staff operator,
I want the new Clients CRM to integrate with the existing Command Center and ClientProfile,
So that the navigation feels coherent and existing surfaces stay useful.

**Acceptance Criteria:**

**Given** the staff nav is shown
**When** I view the staff nav
**Then** a "Clients" entry is added (visible to admin + staff)

**Given** the existing ClientProfile (Epic 3) shows follow-ups, meeting brief, commercial step
**When** a client has CRM data (files, interactions, tasks)
**Then** the ClientProfile shows a "View full client record" link that opens `/staff/clients/[clientId]`

**Given** the Command Center (Epic 2) shows priority work
**When** a client has overdue tasks or recent interactions
**Then** those may be surfaced in the Command Center (out of scope for v1, noted as future work)
