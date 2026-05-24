---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23/brief.md
  - _bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/brief.md
  - _bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/reconcile-brief-original.md
  - _bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/reconcile-brief-workflow.md
  - _bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/review-brief-reconciliation-update-final.md
  - _bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/review-brief-reconciliation-update.md
  - _bmad-output/planning-artifacts/research/market-australian-smb-market-for-ai-business-assessment-and-automation-consulting-research-2026-05-23.md
  - _bmad-output/project-context.md
  - docs/RETELL-DEPLOYMENT-GUIDE.md
  - docs/client-portal.md
  - docs/retell-annie-voice-agent-workflow.md
  - docs/retell-report-agent-handoff.md
  - docs/stripe-setup.md
  - docs/twilio-retell-setup.md
  - docs/voice-agent-disclaimer.md
  - docs/voice-agent-script.md
workflowType: 'architecture'
project_name: 'agenticai-net-au'
user_name: 'Lorin'
date: '2026-05-24'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._


## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The Staff Portal PRD defines 67 functional requirements across eight product areas:

- Command Center (FR-1–FR-6): actionable staff work queue, priority ordering, owner visibility, consequence of inaction, and navigation to the correct work object.
- Client Profile (FR-7–FR-15): client-centered operational memory, “What Matters Now,” report/review/follow-up/meeting/commercial context, and recent activity/audit.
- Human Review (FR-16–FR-31): safety-critical report review, Gate Finding decisions, whole-report approval checklist, version/artifact context, and approval blocking while blocking findings remain unresolved.
- Follow-ups (FR-32–FR-42): internal commitments with owner, due date, source, linked context, state, due/overdue visibility, and audit/activity accountability.
- Meeting Brief Notes (FR-43–FR-50): manual meeting prep with Calendly link access, readiness/stale states, approved-report guardrails, and follow-up creation.
- Commercial Next Step (FR-51–FR-56): staff-entered commercial handoff without AI scoring or CRM pipeline expansion.
- Audit Trail (FR-57–FR-62): durable audit events for lifecycle decisions, ownership changes, overrides, approvals, and high-risk actions.
- Roles and Access (FR-63–FR-67): authenticated `admin` and `operator` access only, consistent screen/API enforcement, permitted queue visibility, and no extra MVP roles.

Architecturally, this is not a generic admin dashboard. It is a governed decision system for safe report delivery where lifecycle state, valid actions, permissions, and audit events must be canonical and server-enforced.

The core MVP spine is:

```text
Escalated Report → Gate Finding decisions → Whole Report decision → Audit receipt → Command Center updates
```

Client Profile, Follow-ups, Meeting Briefs, and Commercial Next Step support this spine, but Human Review safety is the architectural center of gravity.

Architecture should separate:

- canonical states and transitions that must be enforced server-side
- derived queue/readiness summaries that can be computed
- UI panels that can start thin and grow later

The existing `epics.md` is brownfield context for earlier public intake/client portal work, not the Staff Portal backlog. Staff Portal epics and stories need to be regenerated from the Staff Portal PRD and this architecture.

**Non-Functional Requirements:**

The PRD defines seven cross-cutting NFRs:

- Safety: enforce valid transitions and blocking rules for all lifecycle objects.
- Auditability: durable audit events for high-risk actions and 24-month retention/export floor.
- Consistency: lifecycle terms must mean the same thing across all portal surfaces.
- Usability: next valid action must be reachable from Command Center or Client Profile without hunting.
- Accessibility: core workflows target WCAG 2.1 AA; UX later strengthens state-changing flows toward WCAG 2.2 AA expectations.
- Reliability: stale readiness states must be warned/prevented when trigger events occur.
- Security: data and APIs restricted to authenticated `admin` / `operator` users with queue visibility enforced.

These NFRs push architecture toward centralized domain state rules, server-side transition validation, typed action descriptors, and audit-first persistence rather than screen-local conditionals.

**UX Design Requirements:**

The UX specification defines a desktop-first internal governance console built around the safe handoff loop:

```text
open queue → understand why this item matters → inspect evidence → decide or pause → leave proof → move on
```

The UX is not only state-model-first; it is operator-confidence-first. State is the mechanism. Confidence and safe handoff continuity are the outcome.

Architecture must support interaction patterns represented by:

- Command Console / prioritized queue
- Priority work item rows
- Decision workspace
- State/risk/blocker presentation
- Guarded action panel
- Decision receipt
- Audit timeline
- Follow-up, Meeting Brief, and Commercial Next Step panels

These names are UX patterns, not mandatory component class names. Architecturally, the requirement is to support typed view models and server action contracts for the patterns.

Architectural implications:

- UI components must render typed view models rather than infer workflow legality locally.
- Summary/read models, decision/detail models, and receipt/audit models should be distinct.
- State-changing actions must preserve prior visible state until server persistence succeeds.
- Receipts and audit timeline entries must render from persisted audit records, not optimistic client state.
- High-impact actions need stale-state protection, duplicate-submit protection, permission checks, reason-code validation, audit preview, and persisted receipts.
- Disabled/blocked actions are product content, not only logic: they must explain what is blocked, why, what risk is prevented, and what can safely happen next.
- “Cannot proceed,” escalation, clarification required, regeneration required, blocked, and exception-with-reason are valid workflow outcomes, not errors.
- Stale-state recovery must explain what changed, preserve safe drafts when possible, show the current true state, and prevent unsafe overwrite.
- Responsive order must preserve: State → risk/blocker → context → valid action → receipt/audit proof.
- Critical flows need stable accessible names/test hooks and keyboard/screen-reader coverage.

### Scale & Complexity

- Primary domain: full-stack SvelteKit / Cloudflare Pages internal operations portal.
- Complexity level: high for workflow correctness and auditability; medium for raw UI/data volume.
- Estimated architectural components:
  1. Staff auth and role/queue visibility
  2. Canonical lifecycle/state model
  3. Brownfield mapping/backfill layer
  4. Command Center priority derivation
  5. Client Profile aggregation
  6. Human Review workspace
  7. Gate Finding decision model
  8. Report decision/approval guardrails
  9. Follow-up model
  10. Meeting Brief model
  11. Commercial Next Step model
  12. Audit Event store and receipt model
  13. Server-side action/transition services
  14. View-model layer for Svelte components
  15. D1 migrations/backfill from existing pipeline/gate/review data
  16. Test and observability coverage for transition safety

This is not enterprise-scale multi-tenant complexity, but it is safety-critical workflow complexity. The main risk is inconsistent state logic across routes, APIs, UI components, and brownfield status mappings.

### Technical Constraints & Dependencies

- Existing stack is SvelteKit 2 / Svelte 5 / TypeScript / Cloudflare Pages.
- Production persistence uses Cloudflare D1, R2, and Queue bindings accessed through `event.platform.env`.
- Local development uses SQLite fallback via the existing async DB facade.
- Clerk is already used for portal auth; Staff Portal should reuse/extend existing auth patterns rather than introduce a new auth system.
- Existing operational surfaces already exist under `src/routes/operator/**` and `src/routes/api/operator/**`; architecture must decide whether Staff Portal extends this namespace or creates a clearer new boundary.
- Queue worker and report pipeline already create gate and pipeline artifacts; Staff Portal should govern those outputs rather than move long-running work into Pages handlers.
- Existing status values such as `pipeline_status.status` and `human_assist_reviews.status` must be mapped into governed Staff Portal states.
- Raw pipeline statuses must not be read by UI routes as business truth. In particular, existing `ready`, `completed`, or `delivered` values must not imply Staff Portal `Approved` unless approval guardrails and audit evidence exist.
- Staff Portal regeneration execution, AI commercial recommendation, Calendly sync, CRM pipeline, heavy notification inbox, and advanced admin rule governance are out of MVP.
- CSP must remain explicit when adding any new third-party origins.
- Server-only logic must stay under `src/lib/server/**`, API routes, or `.server.ts` modules.

### Cross-Cutting Concerns Identified

- Canonical lifecycle vocabulary across Report, Gate Finding, Follow-up, Meeting Brief, Human Review, Commercial Next Step, Activity, and Audit.
- Server-authoritative state transitions and permission checks.
- Centralized action eligibility and commit services, such as `getAvailableActions(...)` and `commitStaffAction(...)`, rather than route-local decision logic.
- Audit Event creation as part of the same logical transition as the state change.
- State changes and Audit Events must be atomic from the user/business perspective; if a flow cannot be handled transactionally, architecture must define idempotency or compensation.
- Idempotency and duplicate-submit protection for high-impact actions.
- Stale-state/version checks before committing decisions; mutable records need a concrete precondition such as `version`, `updated_at`, or equivalent.
- Role-based access and queue visibility for `admin` and `operator`, including ownership rules and non-leaking permission denials.
- D1 schema/migration/backfill strategy for brownfield pipeline and gate data.
- Brownfield state derivation confidence: canonical, inferred, missing, or conflicting. Conflicting records should surface as review-required rather than silently mapping to Approved/Ready.
- Activity and Audit Event separation at the storage/domain level, not just in UI copy.
- View-model consistency so UI components do not reimplement business rules.
- Accessibility and testability as release constraints for state-changing workflows.
- Observability for transition attempts, rejects by reason, stale rejections, permission denials, audit-write failures, Command Center derivation errors, and backfill conflicts.
- Bounded Command Center queries using indexed D1 access and no N+1 aggregation over reports/gates/follow-ups/audit.
- Clear separation between operational Activity, formal Audit Events, and future notification concepts.
- Avoiding scope creep into CRM, analytics dashboards, workflow engines, generic command registries, notification centers, or advanced admin governance.

### Quality and Testability Implications

Architecture must make business rules testable outside the UI. Lifecycle transitions, action eligibility, priority derivation, role visibility, stale-state handling, and audit-event generation should live in server-side domain services with exhaustive unit and integration tests. UI components render precomputed view models and submit explicit intents; they do not determine safety.

Risk-based acceptance examples to preserve for downstream epics and QA:

- Given a blocking Gate Finding is open, when an operator tries to approve the Report, then approval is rejected and no approval Audit Event is created.
- Given a Report state changed in another tab, when an operator submits a decision from stale context, then the action is rejected, prior state remains visible, and current true state is shown.
- Given an operator lacks ownership or permission, when they submit a state change, then permission is denied and no state or audit mutation occurs.
- Given a Meeting Brief is linked to a non-Approved Report, when staff tries to mark it ready, then the action is blocked unless an explicit exception reason and Audit Event path is used.
- Given a Commercial Next Step is `discuss offer` or `send follow-up`, then it requires an owner plus either a linked Follow-up or a recorded reason that no Follow-up is needed.

E2E coverage should prioritize the safety spine first rather than broad portal automation.


## Starter Template Evaluation

### Primary Technology Domain

Brownfield full-stack web application on SvelteKit 2 / Svelte 5 with Cloudflare Pages, D1, R2, Queue, Clerk, and TypeScript.

This is not a greenfield project. The Staff Portal should be added to the existing application architecture rather than initialized from a new starter template.

### Starter Options Considered

**Option 1: Official SvelteKit starter via `npx sv create`**

The current official SvelteKit path for new projects is:

```bash
npx sv create my-app
```

This is appropriate for greenfield SvelteKit projects, but not selected here because the repository already has SvelteKit, Cloudflare adapter configuration, TypeScript, Vite, Clerk, D1/R2/Queue bindings, existing routes, and deployment scripts.

**Option 2: Cloudflare SvelteKit starter / create-cloudflare path**

Cloudflare’s current SvelteKit deployment guidance supports SvelteKit with Cloudflare Pages/Workers and `@sveltejs/adapter-cloudflare`.

This is directionally aligned with the existing deployment target, but not selected as a starter because the repo already uses Cloudflare Pages, `wrangler.toml`, D1, R2, Queue producer bindings, and a separate queue consumer worker.

**Option 3: Third-party production SvelteKit starters**

Third-party starters commonly bundle Tailwind, shadcn-style libraries, Prisma/Postgres, Hono APIs, Lucia auth, preconfigured dashboards, or broader monorepo structures.

These are not selected because they would conflict with the project’s brownfield constraints:

- existing Clerk auth
- existing D1/R2/Queue model
- existing Cloudflare Pages deployment
- repo-owned CSS token direction
- local Svelte component preference
- Staff Portal need for explicit workflow/state services rather than generic dashboard infrastructure

Generic admin/dashboard starters are also a product risk: they encourage screen-first implementation and can pull the Staff Portal away from its real workflow contract:

```text
state → risk → evidence → valid action → receipt
```

### Selected Starter: Existing Repository Foundation

**Rationale for Selection:**

Use the current `agenticai-net-au` codebase as the starter foundation.

The existing repository is selected because it preserves the current business flow, avoids re-platforming risk, and lets the Staff Portal grow from governed workflow contracts rather than a starter template’s assumptions.

The project already contains the key architectural foundation needed for the Staff Portal:

- SvelteKit 2 / Svelte 5 application shell
- Cloudflare Pages adapter and Wrangler configuration
- D1/R2/Queue bindings
- queue consumer worker for async assessment processing
- Clerk authentication patterns
- local SQLite/D1-compatible data access patterns
- existing operator route namespace
- existing assessment pipeline, gate, report, receipt, and portal concepts
- Vitest/Svelte Check validation scripts
- repo-owned CSS/design-token direction

The Staff Portal should extend this foundation with a dedicated governed workflow domain layer, not replace it with a new starter.

**Initialization Command:**

No new project initialization command should be run.

Implementation should begin by adding Staff Portal architecture inside the existing repository.

```bash
# No starter initialization.
# Continue within the existing SvelteKit/Cloudflare project.
npm run check
```

### Architectural Decisions Provided by Existing Foundation

**Language & Runtime:**

- TypeScript ESM
- SvelteKit 2 / Svelte 5
- Cloudflare-compatible runtime
- Server-only code under `src/lib/server/**`, route handlers, or `.server.ts` modules

**Styling Solution:**

- Existing repo-owned CSS custom properties and design tokens
- CSS custom properties remain the token authority
- Local Svelte components first
- Semantic state/risk/readiness tokens
- Accessible native controls first
- No colour-only status meaning
- No Tailwind, shadcn package, generic admin UI kit, or dashboard framework for MVP unless explicitly approved later

**Build Tooling:**

- Vite
- `@sveltejs/adapter-cloudflare`
- Wrangler Pages deployment
- Separate Cloudflare Worker for queue consumption

**Testing Framework:**

- Vitest for unit/integration tests
- `npm run check` for Svelte/TypeScript validation
- Playwright available for high-risk E2E flows
- Staff Portal must add transition, permission, stale-state, audit, brownfield mapping, and accessibility-focused tests

**Code Organization:**

Recommended new domain boundary:

- `src/lib/server/staff-portal/**` for server-side Staff Portal domain logic
- `src/routes/operator/**` and `src/routes/api/operator/**` only if the architecture intentionally extends the existing operator namespace
- route handlers remain thin and delegate to Staff Portal services
- UI components render governed view models and submit explicit intents

Existing `/operator` screens are a location option, not a product model. PRD state rules define Staff Portal behavior.

**Development Experience:**

The existing foundation preserves developer productivity by avoiding a second app shell, auth stack, or starter migration.

### Dependency Drift Guardrail

Do not introduce starter-driven dependency drift. The architecture rejects adding the following as part of the Staff Portal foundation unless a later explicit architecture decision reverses it:

- Tailwind migration
- shadcn package adoption
- Prisma/Postgres replacement
- Hono API layer
- Lucia auth replacement
- generic workflow engine
- command registry
- dashboard framework
- CRM shell
- generic notification center
- new monorepo structure

### First Implementation Increment

The first implementation story should not be “initialize starter.” It should establish a tested Staff Portal safety spine:

- canonical Staff Portal state unions:
  - Report State
  - Gate Finding State
  - Human Review State
  - Follow-up State
  - Meeting Brief State
  - Commercial Next Step Status
- brownfield raw status → governed state mapper
- action eligibility service, e.g. `getAvailableActions(...)`
- transition commit service, e.g. `commitStaffAction(...)`
- Audit Event contract
- stale/version precondition contract
- idempotency contract for high-impact actions
- Command Center priority derivation contract
- disabled-action explanation contract
- persisted Decision Receipt contract

Foundation “done” means downstream agents can write stories against canonical states, allowed actions, blocked reasons, audit requirements, and brownfield mappings without guessing.

### UI Foundation Rules

The first UI foundation work should establish state/risk/readiness presentation, disabled-action explanations, guarded action confirmation, and persisted decision receipt patterns before broad dashboard components.

Shared components should be extracted only when a pattern appears in at least two Staff Portal surfaces or is safety-critical, such as guarded actions, receipts, blockers, audit timelines, state badges, and disabled-action explanations.

Suggested component layering:

- primitives: Button, Field, Panel, Badge, Dialog
- workflow components: Command Console, Decision Workspace, Guarded Action Panel, Decision Receipt
- domain panels: Follow-up Editor, Meeting Brief Panel, Commercial Next Step Panel

### Starter Decision Quality Gates

The existing repository is the starter, but the first foundation increment must be tested.

Required early verification:

- `npm run check`
- canonical state mapping tests
- action eligibility tests
- transition commit tests
- audit event creation tests
- stale/idempotency rejection tests
- permission tests
- Command Center priority order tests
- bounded-query tests or review for Command Center derivation

Brownfield mapping should be represented as a fixture matrix, including:

- `ready`, `completed`, or `delivered` without approval audit → governed `Generated`, not `Approved`
- `human_assist` or pending review → governed `Escalated`
- conflicting gate/review states → review-required/conflict handling
- missing report artifact → no governed Report state yet

First Playwright coverage should be risk-based once UI exists:

- operator cannot approve with blocking findings
- stale tab decision is rejected
- non-owner/operator action is denied
- audit receipt appears only after persisted event
- Meeting Brief is blocked when linked Report is not Approved unless the explicit exception path is used


## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

1. Use the existing SvelteKit/Cloudflare repository as the runtime foundation.
2. Use Cloudflare D1 as production system of record, with the existing async local SQLite fallback for development.
3. Add a Staff Portal domain boundary under `src/lib/server/staff-portal/**`.
4. Centralize lifecycle state, action eligibility, transition commits, stale checks, idempotency, and audit creation in server-side domain services.
5. UI and API routes must consume governed Staff Portal view models, not raw pipeline/gate statuses.
6. Reuse Clerk authentication and existing `admin` / `operator` role model.
7. Persist state-changing actions and Audit Events atomically from the user/business perspective.
8. Derive Command Center priority through tested server-side functions over governed state.

**Important Decisions (Shape Architecture):**

1. Extend the existing operator route family only if route handlers remain thin and delegate to Staff Portal services.
2. Use REST-style SvelteKit endpoints and server loads; no GraphQL or separate API framework.
3. Use explicit TypeScript union types and Zod/runtime validation for non-trivial request bodies.
4. Use repo-owned CSS tokens and local Svelte components; no Tailwind/shadcn migration.
5. Use risk-based Vitest and Playwright coverage focused on the safety spine.
6. Use structured logs/metrics for transition attempts, rejects, stale submissions, permission denials, audit failures, and mapping conflicts.

**Deferred Decisions (Post-MVP):**

- AI-assisted Commercial Next Step / Offer Fit recommendation.
- Calendly booking sync.
- CRM opportunity pipeline.
- Heavy Notification Center.
- Advanced admin rule authoring, impact preview, rollback, or governance workflows.
- Generic workflow engine or command registry.
- External observability platform beyond structured logs unless production evidence requires it.

### Data Architecture

**Decision:** Use existing D1 / local SQLite async database facade as the persistence foundation.

**Rationale:**

The project already uses D1 in production and local SQLite fallback via `src/lib/server/db.ts`. Introducing PostgreSQL, Prisma, or a second ORM layer would create unnecessary brownfield risk.

**Data Modeling Approach:**

Add Staff Portal tables/migrations for governed operational state rather than overloading raw pipeline tables directly.

Key domain records:

- governed Report state
- Gate Finding state and decisions
- Human Review state/assignment
- Follow-up
- Meeting Brief
- Commercial Next Step
- Activity
- Audit Event
- idempotency / transition receipt records where needed

Existing brownfield records such as `pipeline_status`, `assessment_gates`, `human_assist_reviews`, `reports`, and receipts should be mapped into governed view models through server-side mappers.

Raw statuses like `ready`, `completed`, or `delivered` must not imply `Approved` unless approval guardrails and Audit Events exist.

**Validation Strategy:**

- TypeScript string unions for canonical lifecycle states.
- Zod schemas for non-trivial API request bodies.
- Server-side validation is authoritative.
- Client-side validation is guidance only.

**Migration Strategy:**

- Use existing SQL migration flow under `migrations/`.
- Keep local SQLite initialization in `src/lib/server/db.ts` synchronized with migrations.
- Brownfield mapping should use fixture tests before broad UI buildout.
- Conflicting or missing historical records should map to review-required / conflict handling, not silently to Approved or Ready.

**Caching Strategy:**

- No new caching layer for MVP.
- Use bounded, indexed D1 queries.
- Command Center aggregation must avoid N+1 queries.
- Add limits/pagination where lists can grow.

### Authentication & Security

**Decision:** Reuse Clerk and existing `users.role` model with only `admin` and `operator` for MVP.

**Rationale:**

The PRD explicitly rejects extra MVP roles. Clerk is already integrated, and existing operator auth helpers exist.

**Authorization Pattern:**

- Centralize operator/admin checks through server helpers.
- Enforce permissions in API routes and server loads.
- Enforce ownership/queue visibility inside Staff Portal domain services, not UI components.
- Operators can act on assigned work or permitted shared queue work only.
- Admins can view/reassign/act across operational work.

**Security Rules:**

- Production must ignore/reject `dev_user_id`.
- Permission-denied responses must not leak restricted object details.
- Direct URL/API access must be tested.
- Audit export is admin-only.
- High-risk transitions require role, ownership, current-state, reason-code, stale-state, and idempotency checks.

### API & Communication Patterns

**Decision:** Use SvelteKit server loads and REST-style `+server.ts` endpoints.

**Rationale:**

This matches the existing codebase and keeps Cloudflare deployment simple.

**API Pattern:**

- Page data via `+page.server.ts` where possible.
- Mutations through focused `+server.ts` endpoints or form/action patterns where appropriate.
- Route handlers stay thin.
- Domain services own business rules.

**Core Service Boundary:**

Recommended domain functions:

- `mapBrownfieldReportState(...)`
- `getCommandCenterItems(...)`
- `getClientOperationalProfile(...)`
- `getAvailableActions(...)`
- `commitStaffAction(...)`
- `createAuditEvent(...)`
- `buildDecisionReceipt(...)`

**Error Handling:**

- Auth/page failures may use SvelteKit `error(...)`.
- APIs return structured `{ success: false, error }` shapes where existing operator APIs use that pattern.
- Stale, blocked, validation, permission, and duplicate-submit errors should be distinguishable.

**Communication Between Services:**

- Staff Portal governs existing pipeline/gate/report outputs.
- Long-running work stays in Queue/Worker pipeline.
- Pages handlers do not run long report-generation work.

### Frontend Architecture

**Decision:** Build Staff Portal UI as SvelteKit route compositions over typed server view models.

**Rationale:**

The Staff Portal’s safety depends on server-authoritative workflow state. UI components should not compute action legality.

**State Management:**

- Prefer server-loaded view models.
- Use local component state for drafts, filters, and pending UI only.
- No global workflow store for MVP.
- Preserve previous visible state until persistence confirms success.

**Component Architecture:**

- Start with route-local/domain-local components.
- Extract shared components only after reuse or when safety-critical.
- Separate:
  - primitives: Button, Field, Panel, Badge, Dialog
  - workflow components: Command Console, Decision Workspace, Guarded Action Panel, Decision Receipt
  - domain panels: Follow-up Editor, Meeting Brief Panel, Commercial Next Step Panel

**Design System:**

- CSS custom properties remain token authority.
- Use semantic state/risk/readiness tokens.
- No colour-only status meaning.
- Disabled-action reasons and persisted receipts are foundational patterns, not polish.

### Infrastructure & Deployment

**Decision:** Continue with Cloudflare Pages for SvelteKit and separate Cloudflare Worker for queue consumption.

**Rationale:**

This is already deployed and aligned with the app’s async pipeline requirements.

**Environment Configuration:**

- Keep D1/R2/Queue bindings in Wrangler.
- Access production bindings through `event.platform.env`.
- Worker code uses Worker `env`.
- Do not introduce production `process.env` dependency for Cloudflare bindings.

**Monitoring / Observability:**

MVP observability should log/track:

- transition attempts
- rejected transitions by reason
- stale-state rejections
- permission denials
- audit-write failures
- Command Center derivation errors
- brownfield mapping conflicts

**CI / Verification:**

Required checks for Staff Portal implementation increments:

- `npm run check`
- targeted Vitest tests for domain services
- migration/schema checks
- high-risk Playwright flows once UI exists

### Decision Impact Analysis

**Implementation Sequence:**

1. Define Staff Portal canonical types and state vocabulary.
2. Add brownfield mapping fixtures/tests.
3. Add Staff Portal tables/migrations for governed state, audit, activity, and receipts.
4. Implement action eligibility and transition commit services.
5. Implement Command Center priority derivation.
6. Implement Human Review safety spine UI.
7. Add Client Profile / Follow-up / Meeting Brief / Commercial Next Step surfaces.
8. Add risk-based Playwright flows and accessibility checks.

**Cross-Component Dependencies:**

- Command Center depends on governed state mapping and priority derivation.
- Human Review depends on Gate Finding state, Report state, action eligibility, and audit.
- Decision Receipt depends on persisted Audit Event.
- Client Profile depends on report, review, follow-up, meeting, commercial, activity, and audit aggregation.
- Meeting Brief readiness depends on governed Report state.
- Commercial Next Step may create/link Follow-ups.


## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**

1. Raw pipeline/gate statuses can be mistaken for governed Staff Portal state.
2. DB `snake_case`, TypeScript unions, API JSON, and UI labels can drift.
3. Routes can become business-rule owners instead of thin delivery adapters.
4. Action eligibility can be treated as client authority instead of server advice.
5. Staff decisions can update state without atomic audit evidence.
6. Duplicate submits, retries, stale tabs, or queue replay can double-advance state.
7. Clerk identity and app roles can be inconsistently mapped into actor/audit fields.
8. UI surfaces can present dashboard-style data before risk, evidence, valid actions, and receipts.
9. Agents can introduce starter-driven dependencies or alternate architecture paths.
10. Tests can focus on happy-path screens while missing transition, permission, stale, and audit failures.

### Naming Patterns

**Database Naming Conventions:**

- Database tables and columns use `snake_case`.
- Governed Staff Portal tables must use domain names, not raw pipeline names, e.g. `staff_report_states`, `staff_gate_finding_decisions`, `staff_audit_events`, `staff_action_idempotency`.
- Raw/source tables such as `pipeline_status`, `assessment_gates`, and `human_assist_reviews` remain source-layer facts and must not be treated as Staff Portal decision state.
- Persisted timestamps use server-generated `created_at`, `updated_at`, `transitioned_at`, or equivalent names. Client-submitted lifecycle timestamps are not authoritative.

**API Naming Conventions:**

- API JSON uses `camelCase`.
- API responses expose governed domain fields such as `decisionState`, `availableActions`, `blockedReasons`, `requiredEvidence`, `lastGovernedTransitionAt`, and `receipt`.
- API responses must not expose raw status fields such as `pipelineStatus`, `gateStatus`, or `rawStatus` outside explicitly diagnostic/admin-only endpoints.
- Stable action and reason values use TypeScript string union literals and are serialized as camelCase strings.

**Code Naming Conventions:**

- Domain verbs describe governed actions: `approveReport`, `rejectReport`, `requestMoreInformation`, `resolveGateFinding`, `escalateReview`, `createFollowUp`, `markMeetingBriefReady`.
- Avoid generic mutation names for lifecycle decisions: no `updateStatus`, `setState`, `patchReview`, or route-local status changes.
- Server-only Staff Portal modules live under `src/lib/server/staff-portal/**`.
- Route-local UI components may use Staff Portal pattern names, but business rules remain in server domain modules.

### Structure Patterns

**Project Organization:**

- Staff Portal server domain logic lives in `src/lib/server/staff-portal/**`.
- Existing `/operator` routes may host MVP Staff Portal screens, but `/operator` is a route namespace, not the domain model.
- Routes and endpoints may authenticate, parse/validate input, call Staff Portal services, and return governed view models or redirects. They must not compute workflow legality.
- Long-running assessment/report work remains in Queue/Worker pipeline code. Pages handlers must not run report-generation or regeneration jobs inline for Staff Portal actions.

**File Structure Patterns:**

- Canonical state/action/role unions: `src/lib/server/staff-portal/state.ts` or equivalent.
- Brownfield raw-status mappers: `src/lib/server/staff-portal/mappers/**`.
- Action eligibility matrix: `src/lib/server/staff-portal/actions/**`.
- Transition commits and idempotency: `src/lib/server/staff-portal/transitions/**`.
- Audit and receipt builders: `src/lib/server/staff-portal/audit/**` and `src/lib/server/staff-portal/receipts/**`.
- Command Center and Client Profile read models: `src/lib/server/staff-portal/read-models/**`.
- Tests mirror these boundaries under `tests/staff-portal/**`.

### Format Patterns

**API Response Formats:**

Read responses return governed DTOs, not database rows:

```ts
{
  assessmentId: string;
  decisionState: StaffDecisionState;
  risk: StaffRiskLevel;
  evidenceSummary: EvidenceSummary;
  availableActions: StaffActionDescriptor[];
  blockedReasons: StaffBlockedReason[];
  receipt?: DecisionReceipt;
}
```

Mutation responses must distinguish validation, permission, blocked, stale, duplicate, and audit failures:

```ts
{
  success: false;
  error: {
    code: 'staleState' | 'permissionDenied' | 'blockedAction' | 'duplicateAction' | 'validationFailed' | 'auditWriteFailed';
    message: string;
    reasonCode?: StaffReasonCode;
    currentState?: StaffDecisionState;
  };
}
```

Successful mutations return the persisted governed state and receipt:

```ts
{
  success: true;
  state: StaffDecisionState;
  receipt: DecisionReceipt;
}
```

**Data Exchange Formats:**

- DB rows stay `snake_case` inside repositories/mappers.
- API/view models are camelCase.
- UI labels are generated from canonical state/action/reason definitions, not handwritten per screen.
- Receipts and audit timeline entries render from persisted audit records, not optimistic client state.

### Communication Patterns

**Event System Patterns:**

Audit Events are mandatory for staff-visible lifecycle transitions and high-risk actions. Each event must include:

- `actorId`
- `actorType`
- `action`
- `targetType`
- `targetId`
- `before`
- `after`
- `reasonCode` or decision reason where relevant
- `metadata`
- `correlationId` / idempotency key where relevant
- server-generated `createdAt`

Activity records may summarize operational history, but they are not a substitute for formal Audit Events.

**State Management Patterns:**

- Raw pipeline and gate statuses are source-layer facts. Staff UI, API responses, transitions, and audit records must operate only on governed decision state derived by server-side domain services.
- `getAvailableActions(...)` returns advisory action descriptors and blocked/disabled reason codes.
- `commitStaffAction(...)` is the only lifecycle mutation boundary. It must re-check authentication, authorization, current state, stale/version preconditions, idempotency, action eligibility, and audit creation.
- UI pending state is visual only. It must never advance lifecycle state before server persistence succeeds.
- Components preserve previous visible state until the server returns a persisted state and receipt.

### Process Patterns

**Error Handling Patterns:**

- Permission-denied responses must not leak restricted object details.
- Blocked actions return structured reason codes that UI can display accessibly.
- Stale-state failures return the current true state and avoid overwriting safe drafts where possible.
- Audit write failure prevents the lifecycle transition from being reported as successful.
- Duplicate/replayed idempotency keys return deterministic results and must not create duplicate audit events.

**Loading State Patterns:**

- Long-running or queued work must show current step, safe leave/refresh behavior, and whether a user action is still pending.
- State-changing buttons enter pending state only after submit; they remain tied to the server result.
- Empty, error, and recovery states still follow: State → risk/blocker → evidence/context → valid next action → receipt/audit proof when applicable.

### UI Consistency Patterns

Every Staff Portal decision surface must present information in this order:

```text
State → Risk → Evidence → Valid Actions → Receipt
```

Required UI contracts:

- Use one shared local status/risk presentation pattern for governed states.
- Status cannot rely on colour alone; include icon/text/label/explanation.
- Disabled actions must show accessible reasons inline or through helper text.
- Evidence is summarized before deep links or raw dumps.
- Risk labels are standardized as `Low`, `Medium`, `High`, `Blocked`, or `Unknown` with plain-language explanation.
- High-risk/destructive actions require confirmation and expected outcome copy.
- Completed actions produce visible receipts containing what changed, who initiated it, time, affected record, next state, and audit/reference ID.
- Focus management, keyboard flow, and screen-reader-safe live updates are required for state, risk, disabled, receipt, and evidence changes.
- Use repo-owned CSS tokens and local Svelte primitives/components only. No ad hoc colours, spacing, buttons, badges, modals, or alerts.

### Testability and Enforcement Patterns

- Maintain one typed state/action/role transition matrix for canonical Staff Portal decisions.
- Vitest coverage must exercise the matrix for allowed actions, denied reason codes, role/ownership permissions, stale/version checks, idempotency/replay, duplicate submit, and audit failure rollback.
- Every denied action must have a stable, user-safe reason code consumed by both API and UI.
- Negative fixtures must cover invalid state, missing reviewer, stale version, forbidden actor, duplicate idempotency key, conflicting brownfield state, missing artifact, and malformed AI recommendation.
- Playwright should cover only highest-risk user journeys: approval blocked by open findings, stale tab submit, permission-denied UI, persisted audit receipt visibility, and Meeting Brief approved-report guardrail.
- Safety tests must not be skipped or marked flaky as a merge workaround.

### Enforcement Guidelines

**All AI Agents MUST:**

- Extend the existing SvelteKit/Cloudflare repository; do not create a new starter, monorepo, auth layer, dashboard framework, or API framework.
- Keep Staff Portal business rules in `src/lib/server/staff-portal/**` server modules and route handlers thin.
- Map raw pipeline/gate/review status to governed state before building API DTOs or UI view models.
- Use `getAvailableActions(...)` for action descriptors and `commitStaffAction(...)` for every lifecycle mutation.
- Persist Audit Events as part of the same logical transition as state changes.
- Return camelCase governed DTOs and keep DB-shaped `snake_case` rows inside server data access/mappers.
- Use repo-owned CSS tokens/local Svelte components and preserve accessibility requirements.
- Add or update targeted tests for any new state, action, role, reason code, mapper, or transition.

**Pattern Enforcement:**

- `npm run check` remains required for implementation increments.
- Targeted Vitest tests are required for state matrix, mappers, action eligibility, transition commit, audit contract, stale/idempotency, and permission behavior.
- Review diffs should reject route-local lifecycle conditionals, direct status writes, DB rows returned as API JSON, optional audit writes, or new starter-driven dependencies.
- Pattern violations should be documented in the story review/gate notes and resolved before completion.
- Pattern updates belong in this architecture document before agents implement divergent behavior.

### Pattern Examples

**Good Examples:**

```ts
const actions = getAvailableActions(governedReview, actor);
const result = await commitStaffAction({
  action: 'approveReport',
  targetId: reportId,
  expectedVersion,
  idempotencyKey,
  reasonCode
}, actor, env);
```

```ts
return json({
  success: true,
  state: result.state,
  receipt: result.receipt
});
```

```text
State: Escalated
Risk: High — blocking finding unresolved
Evidence: Gate Finding GF-12, report artifact v3, reviewer note
Valid Action: Request More Information
Receipt: created only after persisted audit event
```

**Anti-Patterns:**

- Reading `pipeline_status.status === 'completed'` in a Svelte component and showing `Approved`.
- Updating `human_assist_reviews.status` directly from a `+server.ts` handler.
- Returning `{ pipeline_status: 'ready' }` to browser code as business truth.
- Trusting client-visible `availableActions` during mutation without server revalidation.
- Creating optimistic state transitions that bypass the audit/receipt contract.
- Adding Tailwind, shadcn, Prisma, Hono, Lucia, a generic dashboard starter, or a workflow engine for MVP.
- Writing one-off badges, disabled buttons, modals, or receipts instead of shared local patterns.
- Treating audit logging as best-effort after the response is returned.


## Project Structure & Boundaries

### Accepted Boundary Decision

The Staff Portal MVP extends the existing `/operator` route family rather than introducing a new `/staff`, `/admin`, separate app shell, or starter-derived dashboard structure.

This decision preserves the brownfield app’s existing auth/navigation/deployment shape while adding a stricter Staff Portal domain boundary under server-only modules.

### Physical Structure

Accepted MVP structure:

```text
src/
  routes/
    operator/
      assessments/
        +page.server.ts
        +page.svelte
        [assessmentId]/
          +page.server.ts
          +page.svelte
    api/
      operator/
        assessments/
          [assessmentId]/
            actions/
              +server.ts

  lib/
    server/
      staff-portal/
        domain/
          actions.ts
          roles.ts
          states.ts
          transitions.ts
          permissions.ts
          receipts.ts
          audit.ts
          errors.ts
        mappers/
          assessment-pipeline.mapper.ts
          assessment-review.mapper.ts
          receipt.mapper.ts
        read-models/
          get-assessment-review.ts
          list-assessment-queue.ts
        services/
          get-available-actions.ts
          commit-staff-action.ts
        repositories/
          staff-action.repository.ts
          staff-audit.repository.ts
          staff-idempotency.repository.ts
        validation/
          staff-action.schema.ts
        testing/
          builders.ts
          fixtures.ts

    staff-portal/
      dto.ts

    components/
      staff-portal/
        DecisionFrame.svelte
        StatePanel.svelte
        RiskPanel.svelte
        EvidencePanel.svelte
        ValidActionsPanel.svelte
        ReceiptPanel.svelte

migrations/
  00xx_staff_portal_actions.sql

tests/
  staff-portal/
    domain/
    services/
    repositories/
    routes/
    fixtures/
    builders/
    e2e/
```

File names may vary slightly to match repo conventions, but the dependency direction and ownership boundaries are mandatory.

### Route Boundaries

`src/routes/operator/**` owns Staff Portal pages and server loads.

Allowed route responsibilities:

- authenticate and authorize the actor using existing Clerk/operator helpers
- parse route params and request bodies
- call Staff Portal read models or services
- return governed DTOs or SvelteKit responses
- map known service errors to user-safe HTTP/API responses

Forbidden route responsibilities:

- direct D1/SQLite lifecycle writes
- raw pipeline/gate status interpretation
- transition matrix checks
- role/action eligibility logic
- audit record construction
- receipt generation

`src/routes/api/operator/assessments/[assessmentId]/actions/+server.ts` is the focused mutation endpoint for Staff Portal assessment decisions. It must delegate to `commitStaffAction(...)` and must not mutate assessment lifecycle state directly.

Recommended request shape:

```ts
{
  action: StaffAction;
  idempotencyKey: string;
  expectedState: StaffDecisionState;
  expectedVersion?: number | string;
  reasonCode?: StaffReasonCode;
  reason?: string;
}
```

Recommended success response shape:

```ts
{
  success: true;
  assessment: StaffAssessmentReviewDto;
  receipt: StaffActionReceiptDto;
}
```

### Server Domain Boundary

`src/lib/server/staff-portal/**` is the Staff Portal business-rule boundary.

Rules:

- `domain/**` contains pure state, action, role, permission, transition, audit, and receipt rules.
- `read-models/**` returns governed queue/detail DTOs for pages.
- `mappers/**` converts brownfield assessment, pipeline, gate, review, DB, and audit records into governed domain/view models.
- `services/get-available-actions.ts` is the only action eligibility entrypoint.
- `services/commit-staff-action.ts` is the only lifecycle mutation entrypoint.
- `repositories/**` owns persistence details but not business rules.
- `validation/**` validates non-trivial mutation payloads before service execution.
- `testing/**` contains reusable builders/fixtures for unit and integration tests only.

The Staff Portal may depend on existing assessment pipeline modules through adapter/mapper functions. Existing assessment pipeline code must not import Staff Portal UI or route modules.

### Shared DTO Boundary

Client-safe Staff Portal DTO types live in:

```text
src/lib/staff-portal/dto.ts
```

Rules:

- camelCase only
- governed state/action/risk/evidence/receipt concepts only
- no DB row types
- no raw pipeline/gate statuses
- no server imports
- no mutation or transition logic

Server services produce these DTOs. Svelte components consume them.

### UI Component Boundary

Staff Portal UI components live under:

```text
src/lib/components/staff-portal/**
```

The primary decision page must preserve this order:

```text
State → Risk → Evidence → Valid Actions → Receipt
```

Accepted component responsibilities:

- `DecisionFrame.svelte`: page composition enforcing the canonical decision order
- `StatePanel.svelte`: current governed state, owner, lifecycle status, and dependencies
- `RiskPanel.svelte`: risk, blockers, confidence, severity, and escalation indicators
- `EvidencePanel.svelte`: source-backed evidence with provenance, timestamp, origin, and confidence/status
- `ValidActionsPanel.svelte`: server-provided valid actions and blocked reasons
- `ReceiptPanel.svelte`: persisted result, actor, timestamp, state change, reason, and audit/reference ID

UI components render server-provided view models. They must not infer action legality from raw status strings or duplicate transition rules.

Do not introduce generic dashboard primitives such as `DashboardCard`, `AdminTable`, or `WidgetGrid` for the MVP unless a concrete repeated need emerges. Prefer decision-domain component names.

### Data and Migration Boundary

Use the existing SQL migration flow under `migrations/` and keep local SQLite/D1 initialization synchronized through the existing database facade.

Initial Staff Portal action persistence should include an audit/action event table and idempotency support. A separate receipt table is optional only if receipts need independent long-term lookup; otherwise receipts can be derived from persisted audit/action records.

Minimum action/audit event fields:

```text
id
assessment_id
actor_id
action
from_state
to_state
reason_code
reason
request_hash
idempotency_key
created_at
```

Idempotency should be unique within the actor/assessment/action scope, for example:

```text
UNIQUE(actor_id, assessment_id, idempotency_key)
```

### Test Structure and Gates

Staff Portal tests should mirror the architecture boundary:

```text
tests/staff-portal/domain/**
tests/staff-portal/services/**
tests/staff-portal/repositories/**
tests/staff-portal/routes/**
tests/staff-portal/fixtures/**
tests/staff-portal/builders/**
tests/staff-portal/e2e/**
```

Required blocking Vitest coverage for implementation stories:

- raw pipeline/gate/review status → governed state mapping
- action eligibility matrix
- permission and ownership denial
- invalid state transition rejection
- stale expected-state/version rejection
- idempotent duplicate submit returning the same receipt/result
- audit event creation for every committed transition
- no duplicate audit event on retry
- route handler delegates to `commitStaffAction(...)` and does not mutate directly

Risk-based Playwright coverage should be added after UI exists for:

- approval blocked by open findings
- stale tab decision rejected
- unauthorized/forbidden actor blocked server-side
- persisted audit receipt visible after commit
- duplicate submit does not double-commit

### Boundary Enforcement Checklist

Agents implementing Staff Portal stories must verify:

- no `/staff` route family unless a later architecture decision reverses this
- no raw pipeline/gate status in browser DTOs
- no route-local lifecycle conditionals
- no direct lifecycle SQL writes from routes
- no UI action eligibility logic beyond rendering server-provided actions
- no audit-optional staff transition
- no starter-driven dependency drift
- no generic dashboard abstraction before repeated need
- `npm run check` plus targeted Staff Portal tests pass for changed boundaries
