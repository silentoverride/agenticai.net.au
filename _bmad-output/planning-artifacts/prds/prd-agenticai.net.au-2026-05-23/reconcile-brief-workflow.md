# Reconciliation Extract: Brief Workflow → Current PRD Workspace

Created: 2026-05-25

## Inputs Read Fully

Source brief workflow inputs:

- `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/brief.md`
- `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/addendum.md`
- `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/.decision-log.md`

Current PRD workspace compared:

- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/addendum.md`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/decision-log.md`

## Classification Legend

- **A — Already covered:** Source intent is materially represented in the current PRD/addendum.
- **B — Missing; should update PRD:** Source-backed requirement or acceptance-level product intent appears absent or too weak in `prd.md`.
- **C — Missing; belongs in PRD addendum:** Source-backed detail is useful for UX, architecture, epics, or future planning, but should not become an MVP product requirement.
- **D — Intentionally superseded / conflicting with current PRD decisions:** Source detail conflicts with later explicit PRD decisions or MVP constraints.

## Executive Reconciliation Summary

The current PRD strongly preserves the brief's core safety thesis: state-model-first operations, Human Review reliability, actionable Command Center, whole-report approval gated by individual Gate Findings, auditable decisions, Follow-up commitments, and stale Meeting Brief protection.

The main source-backed drops are not in the core safety model. They are mostly: implementation sequencing, UX/navigation mental models, some Human Review cockpit detail, richer Follow-up/Activity semantics, and future-direction qualitative intent for Offer Fit, Admin/Governance, and Notifications.

Recommended update pattern:

1. Make a small `prd.md` update for omitted MVP-level operational requirements.
2. Add a richer preservation section to `addendum.md` for source workflow architecture, future product direction, and sequencing.
3. Do not reintroduce superseded scope such as AI-generated meeting briefs, Calendly sync, AI Offer Fit, full opportunity pipeline, or separate reviewer roles into MVP requirements.

## A — Already Covered

### A1. State-model-first product intent

**Source evidence:**

- Brief: Staff need to see lifecycle state, blockers, valid next actions, decisions, and next state.
- Brief: Operating loop is `See state → understand blocker → take valid action → record decision → move to next state`.
- Brief decision log: Staff Portal MVP should be state-model-first, not screen-first.

**Current coverage:**

- `prd.md` §1 Vision preserves state-model-first and the same operating loop.
- `prd.md` §5 defines state models and guardrails for Report, Gate Finding, Follow-up, Meeting Brief, Human Review, and Commercial Next Step.
- `prd.md` NFR-1 requires state transitions to enforce valid actions and blocking rules.

**Classification:** A — Already covered.

### A2. Human Review as primary MVP safety priority

**Source evidence:**

- Brief: 4-week MVP should prioritise Human Review reliability over growth automation.
- Brief: First make report delivery safe, then meetings useful, then upsell systematic.
- Brief decision log: Human Review reliability is the top 4-week MVP priority.

**Current coverage:**

- `prd.md` §1 names reliable Human Review as the first value target.
- `prd.md` §4.3 has the most detailed feature requirements and gating rules.
- `prd.md` §9 primary metrics focus on escalated report visibility, approval safety, decision provenance, and follow-up completeness.

**Classification:** A — Already covered.

### A3. Whole-report approval gated by individual Gate Findings

**Source evidence:**

- Brief/addendum: Findings are reviewed individually; the report is approved as a whole.
- Brief success criteria: Reviewers cannot approve reports while unresolved findings remain.
- Addendum Human Review flow: open escalated report, see all gate findings, resolve each finding, complete checklist, make final report decision.

**Current coverage:**

- `prd.md` §4.3 FR-16 through FR-31 define Human Review queue/workspace, finding decisions, checklist, final whole-report decision, and Audit Events.
- `prd.md` FR-24 and FR-25 block approval while unresolved Blocking Gate Findings remain.
- `prd.md` glossary defines Blocking Gate Finding.

**Classification:** A — Already covered.

### A4. Command Center as action dashboard, not passive reporting

**Source evidence:**

- Brief/addendum: Command Center should show escalated reports, upcoming meetings, overdue follow-ups, and stuck clients.
- Addendum: Every item should answer what it is, why it matters, who owns it, consequence if ignored, and next action.
- Addendum principle: Command Center = work queue, not passive reporting dashboard.

**Current coverage:**

- `prd.md` §4.1 Description and FR-1 through FR-6 preserve action orientation.
- `prd.md` FR-3 explicitly includes Client, state, owner, due date, why it matters, and consequence of inaction.
- `prd.md` §4.1 priority order operationalizes quality, follow-up, meeting, and commercial work.

**Classification:** A — Already covered.

### A5. Client Profile as action-oriented connective tissue

**Source evidence:**

- Addendum: Client Profile is connective tissue across quality, meeting, opportunity, follow-up, and audit workflows.
- Addendum: Overview should orient staff toward the next responsible action.

**Current coverage:**

- `prd.md` §4.2 defines Client Profile as operational memory and an action-oriented view.
- FR-7 through FR-15 cover snapshot, What Matters Now, Reports, Gate Findings, Follow-ups, Meeting Brief notes, Commercial Next Step, activity, and Audit Events.

**Classification:** A — Already covered.

### A6. Follow-ups as commitments, not notes

**Source evidence:**

- Brief/addendum: A follow-up is not a note; it is a commitment with owner, due date, source, status, and consequence.
- Addendum required fields include owner, due date, source, client-visible promise flag, status, linked context, and activity/audit trail.

**Current coverage:**

- `prd.md` §4.4 Description states Follow-ups are internal staff commitments, not loose notes.
- FR-35 through FR-42 cover owner, due date, source, consequence, client-visible promise flag, linked context, status, due/overdue surfacing, and Audit Events.

**Classification:** A — Already covered, with one related gap in B2.

### A7. Meeting Brief readiness cannot ignore unresolved report review or stale context

**Source evidence:**

- Brief success criteria: Meeting prep cannot be marked ready if report review is unresolved or the brief is stale.
- Addendum freshness states include source changes and Human Review unresolved.

**Current coverage:**

- `prd.md` §4.5 FR-47 warns on stale trigger events.
- FR-48 blocks marking Meeting Brief ready while linked Report review is unresolved.
- `prd.md` §5.4 lists exhaustive MVP stale-trigger events.

**Classification:** A — Already covered, within the current manual-notes MVP constraint.

### A8. Audit trail, reason codes, ownership changes, and decision provenance

**Source evidence:**

- Brief must-haves include audit trail for review decisions, state changes, reason codes, and ownership changes.
- Brief success criteria require reason code, reviewer note, and audit event for high-risk decisions.
- Addendum distinguishes Activity, Audit, and Notification Center.

**Current coverage:**

- `prd.md` §4.7 FR-57 through FR-62 define Audit Events and required fields.
- `prd.md` §5.7 defines MVP Reason Codes.
- `prd.md` §5.8 adds retention/export floor.
- `prd.md` glossary distinguishes Activity from Audit Events.

**Classification:** A — Already covered, with one related follow-up gap in B2.

### A9. Scope boundaries and major non-goals

**Source evidence:**

- Brief explicitly excludes advanced objection handling, AI sales talk tracks as core workflow, Offer Fit scoring, revenue probability, full CRM pipeline management, advanced admin governance, and heavy unified notification inbox.

**Current coverage:**

- `prd.md` §7 and §8.2 preserve these non-goals, including CRM pipeline, AI Offer Fit, scoring, revenue probability, Calendly sync, advanced admin governance, and heavy notification inbox.

**Classification:** A — Already covered.

## B — Missing; Should Update PRD

### B1. Human Review workspace should expose available report versions/history

**Source evidence:**

- Brief addendum → Human Review Cockpit → Whole Report Context includes: `Original / edited / regenerated versions`.
- Brief addendum principle: A reviewer should never have to hunt through the report to discover why they are reviewing it.

**Current PRD state:**

- `prd.md` FR-17 requires Report context, all linked Gate Findings, and current Report State.
- `prd.md` FR-18 requires flagged section, intake evidence, gate explanation, confidence/severity, suggested inspection steps, and linked Report context.
- `prd.md` FR-28 correctly keeps Staff Portal-triggered regeneration execution out of MVP.
- No explicit Human Review requirement says staff can view available Report versions/history inside the review workspace.

**Why this matters:**

Version visibility is distinct from executing regeneration. The MVP can keep regeneration execution out of scope while still letting reviewers compare existing original/edited/regenerated artifacts when present. Without this, the cockpit may force reviewers to infer what changed outside the review workflow.

**Recommended action:**

Update `prd.md` §4.3 Human Review with a small requirement: the review workspace exposes available Report artifact/version history relevant to the current review, including original, edited, regenerated, or historical versions when such artifacts exist. Keep regeneration execution explicitly out of MVP.

**Classification:** B — Missing; should update PRD.

### B2. Follow-up “missed” / first-overdue event is not explicitly captured in Activity/Audit

**Source evidence:**

- Brief addendum → Follow-ups → Placement model says Follow-ups are captured in Activity/Audit when completed, missed, reassigned, or changed.
- Brief/addendum risk list identifies missed Follow-ups as a top risk.

**Current PRD state:**

- `prd.md` FR-40 identifies due/overdue Follow-ups.
- FR-41 surfaces due and overdue Follow-ups.
- FR-42 creates Audit Events for creation, completion, deferral, reassignment, and due date changes.
- No explicit requirement creates an Activity or Audit record when a Follow-up becomes overdue / is missed.

**Why this matters:**

The source treats a missed Follow-up as an accountable operational event, not merely a derived display state. The current PRD may still surface overdue work, but it may not preserve accountability for when a client-visible promise was missed.

**Recommended action:**

Update `prd.md` §4.4 or §4.7 to require at least an Activity record, and possibly an Audit Event for client-visible promises, when a Follow-up first becomes overdue or is explicitly marked missed. If implementation prefers derived overdue state only, record that as a deliberate product decision.

**Classification:** B — Missing; should update PRD.

### B3. Meeting Brief staff-approved “final agenda” was dropped from MVP notes fields

**Source evidence:**

- Brief addendum → Meeting Brief Model → Staff-approved sections include `Final agenda` and `Prep complete`.
- Source Should Have scope includes simple Meeting Brief draft, prep checklist, meeting notes, and Follow-up creation from meeting context.

**Current PRD state:**

- `prd.md` FR-46 lets staff record meeting objective, talking points, sensitive issues, offer or next step to discuss, follow-up intention, and a manual prep checklist.
- No explicit `final agenda` field/section is listed.

**Why this matters:**

Final agenda is a simple staff-entered meeting-prep artifact and does not require AI generation, Calendly sync, or broader scope. It supports the source intent that the meeting be prepared, specific, and trustworthy.

**Recommended action:**

Update `prd.md` FR-46 to include a staff-entered final agenda or agenda notes field.

**Classification:** B — Missing; should update PRD.

### B4. Next-owner routing after review decisions is only implicit

**Source evidence:**

- Brief addendum → Human Review review flow step 6: `Audit decision + notify next owner`.
- Activity, Audit, and Notifications section: use contextual alerts first; notifications move staff to the right work.

**Current PRD state:**

- `prd.md` creates Audit Events for review decisions.
- Command Center and queue visibility show assigned/unassigned work.
- Heavy notification inbox is out of MVP.
- No requirement explicitly says a decision that creates/assigns follow-on work makes that work visible to the next owner.

**Why this matters:**

The source does not require a heavy Notification Center for MVP, but it does require that attention move to the next responsible owner. If this remains implicit, handoff reliability may depend on UI interpretation rather than product acceptance.

**Recommended action:**

Add a lightweight PRD clarification: when a review decision creates, assigns, or reassigns follow-on work, the resulting work item must be visible in the responsible owner's permitted Command Center/shared queue. Do not add a full notification inbox to MVP.

**Classification:** B — Missing; should update PRD.

## C — Missing; Belongs in PRD Addendum

### C1. 4-week build sequence is absent from PRD workspace

**Source evidence:**

- Brief includes explicit 4-week sequence:
  1. Week 1: Client Profile + Command Center skeleton
  2. Week 2: Human Review queue/cockpit + decisions
  3. Week 3: Follow-ups + audit trail
  4. Week 4: Simple Meeting Brief + polish/test
- Brief decision log repeats the same sequence.

**Current PRD state:**

- `prd.md` and PRD addendum do not preserve this sequencing.

**Why this belongs in addendum:**

The sequence is useful for downstream epics/stories and implementation planning, but it is not a product requirement. It should not constrain architecture if downstream planning finds a better technical order, but it captures source intent about priority and dependency.

**Recommended action:**

Add a section to `addendum.md` preserving the source 4-week sequence as recommended delivery sequencing / planning context.

**Classification:** C — Missing; belongs in PRD addendum.

### C2. Navigation architecture and product mental model were compressed away

**Source evidence:**

- Brief addendum navigation tree:
  - Command Center
  - Clients
  - Human Review
  - Meetings
  - Opportunities
  - Admin
  - Audit
  - Notification Center
- Brief addendum product mental model:
  - Report Quality Engine → Human Review, Gate Findings, Report Approval, Audit
  - Client Growth Engine → Meetings, Opportunities, Offer Fit, Follow-ups, Client Success Notes
- Addendum states Meetings and Opportunities remain separate top-level navigation areas because staff enter with different intents.

**Current PRD state:**

- `prd.md` defines functional areas but does not preserve the source navigation tree or two-engine mental model.
- PRD addendum does not preserve this UX/navigation context.

**Why this belongs in addendum:**

The source navigation includes future/non-MVP areas, so it should not become MVP navigation requirements. But the mental model is useful for UX/IA decisions and preventing later conflation of quality review with growth workflows.

**Recommended action:**

Add a PRD addendum section preserving the source navigation architecture and Report Quality Engine / Client Growth Engine mental model as UX information architecture context, clearly noting MVP scope remains constrained by `prd.md`.

**Classification:** C — Missing; belongs in PRD addendum.

### C3. Command Center queue grouping was not preserved

**Source evidence:**

- Brief addendum recommends Command Center structure:
  - Today’s Priority Work
  - Quality Queue
  - Growth Queue

**Current PRD state:**

- `prd.md` has a strong priority order but no mention of these UX grouping concepts.

**Why this belongs in addendum:**

The grouping is UX structure rather than an MVP acceptance requirement. It may help designers keep safety-critical work and growth follow-through separate without adding features.

**Recommended action:**

Preserve the suggested Command Center groupings in `addendum.md` as UX guidance.

**Classification:** C — Missing; belongs in PRD addendum.

### C4. Client Profile card-level overview structure was not preserved

**Source evidence:**

- Brief addendum Client Profile Overview structure includes:
  - Top: Client Snapshot
  - Primary Card: What Matters Now
  - Quality Card
  - Growth Card
  - Follow-up Card
  - Recent Activity

**Current PRD state:**

- `prd.md` covers the underlying data and What Matters Now behavior.
- PRD addendum does not preserve the source card-level UX structure.

**Why this belongs in addendum:**

This is useful UX/design context, not a hard product requirement.

**Recommended action:**

Add the Client Profile overview/card structure to `addendum.md` as source-preserved UX guidance.

**Classification:** C — Missing; belongs in PRD addendum.

### C5. Gate Finding resolution subtypes were collapsed

**Source evidence:**

- Brief addendum Gate Finding lifecycle includes detailed resolved states:
  - Resolved — no change needed
  - Resolved — edited report
  - Resolved — regenerated section/report
  - Resolved — client clarification requested
  - Escalated further
  - Dismissed with override reason

**Current PRD state:**

- `prd.md` simplifies Gate Finding State to Open, In review, Resolved, Overridden with reason, Escalated further.
- `prd.md` has Reason Codes but does not preserve these resolution subtypes as planning context.

**Why this belongs in addendum:**

The simplified MVP state model is appropriate and matches the brief's top-level lifecycle, but the subtypes are useful for downstream UX/audit taxonomy and may influence notes/reason-code labels.

**Recommended action:**

Add the source resolution subtypes to `addendum.md` as optional UX/audit taxonomy context, while keeping `prd.md`'s simpler MVP state model unless product chooses to promote them.

**Classification:** C — Missing; belongs in PRD addendum.

### C6. Future Meeting Brief model is only partially preserved

**Source evidence:**

- Brief addendum describes AI-generated sections:
  - Client situation snapshot
  - What matters now
  - Report talking points
  - Likely questions / objections
  - Suggested agenda
  - Offer fit suggestion
  - Prep checklist draft
- Staff-approved sections:
  - Meeting objective
  - Top 3 talking points
  - Sensitive issues / avoid-saying guidance
  - Offer to discuss
  - Follow-up intention
  - Final agenda
  - Prep complete
- Meeting Brief model includes locked meeting-ready version.

**Current PRD state:**

- `prd.md` intentionally makes MVP manual notes plus Calendly link only.
- PRD addendum defers AI-generated meeting brief content and locked meeting-ready versions, but does not preserve the full source section taxonomy.

**Why this belongs in addendum:**

The AI-generated and locked-version parts conflict with the MVP decision, but they are useful future product direction. Staff-approved fields that remain in MVP should be in PRD where simple enough; the full taxonomy can live in addendum.

**Recommended action:**

Add the full source Meeting Brief section taxonomy to `addendum.md` as deferred/future Meeting Brief detail. Separately apply B3 to `prd.md` for final agenda.

**Classification:** C — Missing; belongs in PRD addendum.

### C7. Offer Fit / Opportunity qualitative future intent was compressed

**Source evidence:**

- Brief addendum says Offer Fit should be rule-grounded, AI-assisted, and staff-approved.
- Source details:
  - Rules decide which offers exist, allowed/blocked offers, no-sell/nurture risk signals, required evidence, senior approval, and prohibited claims.
  - AI assists with matching pain to offer types, summarising fit evidence, detecting readiness/slow-down signals, drafting talk tracks, suggesting next questions, and explaining why this/why now.
  - Staff approves recommended offer, pitch timing, wording, pipeline stage, estimated value, next action, and follow-up commitment.
- Source distinction: Offer Fit answers the right next commercial action; Opportunity answers what is being actively sold, to whom, by when, for how much.

**Current PRD state:**

- `prd.md` intentionally replaces Offer Fit MVP with staff-entered Commercial Next Step.
- `addendum.md` defers AI-assisted Offer Fit, guardrails, evidence-linked recommendation, and full Opportunity model, but at a higher level.

**Why this belongs in addendum:**

This is not MVP scope, but the qualitative rule/AI/staff split is important future product intent and helps avoid later implementing a black-box sales recommender.

**Recommended action:**

Expand `addendum.md` deferred Offer Fit / Opportunity section to preserve the source's rule-grounded, AI-assisted, staff-approved split and the Offer Fit versus Opportunity distinction.

**Classification:** C — Missing; belongs in PRD addendum.

### C8. Admin/Governance policy-change questions were compressed

**Source evidence:**

- Brief addendum frames Admin as an operations control surface, not a passive settings area.
- Every admin rule change should answer:
  - What is changing?
  - Why is it changing?
  - Who approved it?
  - What clients/reports/workflows could be affected?
  - Can we preview impact before publishing?
  - Can we roll it back?

**Current PRD state:**

- `addendum.md` defers admin governance workflows, rule simulation, impact preview, rollback, and states Admin should be an operations control surface.
- The specific policy-change checklist is not preserved.

**Why this belongs in addendum:**

Advanced admin governance is out of MVP, but the checklist is useful future governance intent.

**Recommended action:**

Add the policy-change checklist to `addendum.md` as deferred Admin/Governance product direction.

**Classification:** C — Missing; belongs in PRD addendum.

### C9. Notification Center and contextual alert principles were compressed

**Source evidence:**

- Brief addendum: use contextual alerts first, plus lightweight unified Notification Center.
- Contextual alerts include Command Center priority items, Client Profile banners/chips, Human Review queue warnings, Meeting prep warnings, Opportunity next-action warnings, and Admin approval warnings.
- Key distinction: Command Center = work queue; Notification Center = attention history/personal catch-up; Audit = accountability; Activity Timeline = memory.
- Principle: Do not make staff manage notifications. Use notifications to move staff to the right work.

**Current PRD state:**

- `prd.md` excludes heavy notification inbox and favors contextual surfacing.
- `addendum.md` defers lightweight Notification Center, but does not preserve the full distinctions/principles.

**Why this belongs in addendum:**

The source does not require a heavy MVP notification system. The distinctions are useful future UX/architecture guardrails.

**Recommended action:**

Add the contextual-alert and four-way distinction principles to `addendum.md` as future UX/notification guidance.

**Classification:** C — Missing; belongs in PRD addendum.

## D — Intentionally Superseded / Conflicting with Current PRD Decisions

### D1. Separate Reviewer role was superseded by admin/operator-only MVP

**Source evidence:**

- Brief target users include internal staff/operator and reviewer/admin.

**Current PRD decision:**

- `prd.md` §2.1 and §4.8 define only `admin` and `operator` roles.
- PRD decision log Express Gap Decisions explicitly state no separate `reviewer` role in MVP.

**Recommended action:**

No PRD update. Keep source reviewer/admin wording treated as conceptual role context, not an MVP access role.

**Classification:** D — Intentionally superseded.

### D2. AI-generated Meeting Brief draft was superseded by manual notes + Calendly link MVP

**Source evidence:**

- Brief addendum Meeting Brief model starts with AI-generated draft and AI-generated sections.
- Brief operating principle: Meeting prep should be AI-assisted, but client-facing judgment remains human-owned.

**Current PRD decision:**

- PRD decision log Express Gap Decisions: Meeting MVP uses Calendly link only plus manual staff notes; no Calendly sync/import.
- `prd.md` §4.5 and §8.2 make AI-generated meeting brief content out of MVP.
- `addendum.md` defers AI-generated meeting brief content.

**Recommended action:**

No MVP PRD update beyond B3 for final agenda. Preserve richer AI meeting brief detail in addendum only, per C6.

**Classification:** D — Intentionally superseded for MVP.

### D3. Calendly/booking integration open question was superseded by manual meeting MVP

**Source evidence:**

- Brief MVP-blocking open question asks how much meeting data is already available from booking/calendar systems.
- Brief addendum deferred detail includes calendar/booking integration scope.

**Current PRD decision:**

- PRD decision log Express Gap Decisions: Meeting MVP uses Calendly link only plus manual staff notes; no Calendly sync/import.
- `prd.md` glossary defines Upcoming Meeting as staff-entered date/time; MVP does not import upcoming meetings from Calendly.
- `prd.md` §7 and §8.2 exclude Calendly booking sync, calendar import, and stored appointment lifecycle.

**Recommended action:**

No PRD update.

**Classification:** D — Intentionally superseded.

### D4. AI-assisted Offer Fit and evidence-linked recommendations were superseded by Commercial Next Step MVP

**Source evidence:**

- Brief Could Have includes evidence-linked offer-fit suggestion.
- Brief addendum describes Offer Fit Engine, AI-assisted interpretation, evidence-linked recommendation, and staff approval.

**Current PRD decision:**

- PRD decision log Express Gap Decisions: Offer Fit MVP is simple staff-entered Commercial Next Step, not AI-assisted recommendation.
- `prd.md` §4.6 defines Commercial Next Step and FR-55 says it must not be presented as AI-generated or automatically scored in MVP.
- `addendum.md` defers AI-assisted Offer Fit recommendation and scoring.

**Recommended action:**

No MVP PRD update. Expand addendum only to preserve future qualitative intent, per C7.

**Classification:** D — Intentionally superseded for MVP.

### D5. Full Opportunity model was superseded by Commercial Next Step MVP

**Source evidence:**

- Brief Could Have includes opportunity status, sales next action, and suggested talk track.
- Brief addendum distinguishes Opportunity from Offer Fit and describes active sale target, buyer, timing, value, and sales stage.

**Current PRD decision:**

- `prd.md` §4.6 defines only Commercial Next Step.
- `prd.md` §7 excludes full CRM pipeline management and advanced sales talk tracks.
- `addendum.md` defers full Opportunity model distinct from Offer Fit.

**Recommended action:**

No MVP PRD update. Preserve source distinction in addendum as future direction, per C7.

**Classification:** D — Intentionally superseded for MVP.

### D6. Advanced Admin governance is intentionally out of MVP

**Source evidence:**

- Brief addendum includes Admin/Governance future direction with rule simulation, preview, approvals, rollback, version history, and audit/retention.

**Current PRD decision:**

- `prd.md` §7 and §8.2 exclude advanced admin rule simulation, impact preview, rollback, and governance workflows.
- `addendum.md` defers Admin governance workflows.

**Recommended action:**

No MVP PRD update. Add policy-change checklist to addendum only, per C8.

**Classification:** D — Intentionally superseded for MVP.

### D7. Heavy unified Notification Center remains out of MVP

**Source evidence:**

- Brief explicitly excludes heavy unified notification inbox.
- Addendum supports contextual alerts first plus lightweight Notification Center.

**Current PRD decision:**

- `prd.md` §7 excludes heavy notification inbox and prefers contextual surfacing.
- `addendum.md` defers lightweight Notification Center.

**Recommended action:**

No MVP PRD update except B4 lightweight next-owner routing via Command Center/shared queue. Preserve future notification distinctions in addendum, per C9.

**Classification:** D — Intentionally superseded for MVP.

### D8. Source MVP-blocking open questions are mostly answered or converted to non-blocking implementation follow-ups

**Source evidence:**

- Brief MVP-blocking open questions ask about existing entities, exact gate data, approval gating enforcement, and meeting data availability.

**Current PRD state:**

- `addendum.md` Brownfield Code Reconnaissance answers known existing entities and gaps.
- `prd.md` §5.1–§5.2 defines brownfield status/gate mappings.
- `prd.md` §4.3 and §5.1 define approval gating.
- `prd.md` §4.5/§7 answer meeting data by constraining MVP to Calendly link + manual notes.
- `prd.md` §10 says no phase-blocking product questions remain and lists non-blocking architecture/implementation follow-ups.

**Recommended action:**

No product update unless architecture later invalidates these assumptions.

**Classification:** D — Superseded/resolved by current PRD decisions.

## Recommended Update Targets

### Update `prd.md`

1. Human Review workspace exposes available Report version/artifact history during review.
2. Follow-up first-overdue/missed handling creates Activity/Audit accountability, especially for client-visible promises.
3. Meeting Brief notes/prep fields include final agenda or agenda notes.
4. Review decisions that create/assign/reassign follow-on work must surface that work to the next owner via permitted Command Center/shared queue visibility, without adding a heavy Notification Center.

### Update `addendum.md`

1. Preserve 4-week recommended build sequence.
2. Preserve navigation architecture and Report Quality Engine / Client Growth Engine mental model.
3. Preserve Command Center queue grouping and Client Profile card-level overview structure as UX guidance.
4. Preserve Gate Finding resolution subtypes as optional audit/UX taxonomy context.
5. Preserve full future Meeting Brief section taxonomy while keeping AI generation out of MVP.
6. Preserve Offer Fit rule/AI/staff split and Offer Fit vs Opportunity distinction as future product direction.
7. Preserve Admin/Governance policy-change checklist.
8. Preserve Notification Center/contextual alert distinctions and principle: notifications move staff to the right work; staff should not manage notifications as a separate workload.
