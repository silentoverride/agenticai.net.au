---
title: "Staff Portal MVP PRD"
created: 2026-05-23
updated: 2026-05-24
status: ready-for-downstream-planning
---

# PRD: Staff Portal MVP

## 0. Document Purpose

This PRD defines the Staff Portal MVP for the Agentic AI assessment platform. It is for product, design, architecture, and implementation planning. It converts the Staff Portal product brief into product requirements while preserving downstream room for UX, architecture, epics, and stories. Vocabulary is anchored in the Glossary, features group globally numbered functional requirements, and assumptions are tagged inline and indexed in §11.

Source inputs:

- Product brief: `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/brief.md`
- Brief addendum: `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/addendum.md`
- Brief decision log: `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/.decision-log.md`
- Original brief workspace reconciled during update: `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23/`
- Original brainstorming session: `_bmad-output/brainstorming/brainstorming-session-2026-05-23-120000.md`

## 1. Vision

The Staff Portal MVP makes Agentic AI report delivery safe before it makes operations sophisticated. Staff need one internal surface where they can see work that needs attention, understand why a report or client journey is blocked, take only valid lifecycle actions, and leave an auditable decision trail.

The MVP is state-model-first, not dashboard-first. Its core operating loop is: see state, understand blocker, take valid action, record decision, move to next state. The dangerous failure mode is a polished portal that implies operational control while report approval, gate findings, follow-ups, and meeting prep can still drift or be bypassed.

The first value target is reliable Human Review for escalated reports. Meeting prep and Commercial Next Steps are included only to the extent they support safe client follow-through after a report is governed.

## 2. Target Users

### 2.1 Primary Users

- **Operator** — Internal staff member responsible for reviewing escalated reports, resolving follow-ups, preparing for client meetings, and keeping client work moving.
- **Admin** — Internal staff member with the same operational needs as an Operator plus responsibility for operational visibility and configuration decisions. MVP roles are limited to `admin` and `operator`; there is no separate Reviewer role.

### 2.2 Indirect Users

- **Client** — Receives safer reports, clearer follow-up, and better-prepared meetings, but does not use the Staff Portal in MVP.
- **Business Owner** — Needs confidence that client-facing outputs are governed and that staff work is not hidden in ad hoc notes or memory.

### 2.3 Jobs To Be Done

- When reports are escalated, staff need to understand exactly what blocked delivery so they can make a safe decision.
- When a report is approved, staff need confidence that unresolved findings cannot be silently ignored.
- When a client needs a next step, staff need a visible follow-up with owner, due date, source, and status.
- Before a client meeting, staff need a concise briefing and notes area so the meeting is specific, current, and commercially useful.
- When leadership asks what happened, staff need a reliable audit trail of states, actions, reasons, and owners.

### 2.4 Key User Journeys

- **UJ-1 — Review escalated report:** Operator opens an escalated report, reviews its Gate Findings, records decisions, and approves or blocks client delivery.
- **UJ-2 — Manage today's work:** Operator opens the Command Center, sees priority work, and navigates directly to the blocked Report, Follow-up, Meeting Brief, or Client Profile.
- **UJ-3 — Understand a client:** Operator opens a Client Profile to understand current report state, follow-ups, meeting notes, Commercial Next Step, and recent audit activity.
- **UJ-4 — Create and complete follow-up:** Operator creates or updates an internal Follow-up with owner, due date, source, linked context, and completion state.
- **UJ-5 — Prepare meeting notes:** Operator uses a Calendly link and manual meeting notes to prepare for and record a client conversation.
- **UJ-6 — Capture Commercial Next Step:** Operator records a simple staff-entered Commercial Next Step for a client.

## 3. Glossary

- **Staff Portal** — Internal operational surface for Agentic AI staff to manage report review, client follow-up, meeting preparation, Commercial Next Steps, and audit visibility.
- **Operator** — Internal user with permission to use Staff Portal operational workflows.
- **Admin** — Internal user with Operator capabilities plus administrative responsibility. MVP does not add a separate Reviewer role.
- **Client** — Business assessment customer represented in the Staff Portal.
- **Client Profile** — Client-centered view that aggregates report state, review state, meeting notes, follow-ups, Commercial Next Step, and recent activity.
- **Activity** — Operational-memory feed of recent Client-relevant work and updates; distinct from Audit Events, which are formal accountability records.
- **Command Center** — Action-oriented staff home view showing work needing attention today.
- **Report** — Assessment output intended for client delivery.
- **Report State** — Lifecycle status governing whether a Report is generated, escalated, in review, approved for client delivery, rejected, marked regeneration required, or clarification required.
- **Approved** — Report State meaning the Report is safe for client delivery.
- **Gate Finding** — Individual quality, risk, or policy finding raised during assessment/report generation.
- **Gate Finding State** — Lifecycle status governing whether a Gate Finding is open, in review, resolved, overridden with reason, or escalated further.
- **Blocking Gate Finding** — Gate Finding whose current verdict or state prevents Report approval until it is resolved or overridden with reason; escalating the finding further does not make the Report approvable.
- **Reason Code** — Structured reason selected by staff to explain a high-risk decision such as approval, rejection, override, deferral, reassignment, regeneration required, or clarification required.
- **Human Review** — Staff workflow for resolving Gate Findings and making a whole-Report decision.
- **Human Review State** — Derived workflow state for a Report's review progress: not required, required, in review, decision recorded, or escalated further.
- **Follow-up** — Internal staff commitment with owner, due date, source, linked context, and status.
- **Follow-up State** — Lifecycle status governing whether a Follow-up is open, due, overdue, completed, deferred with reason, or reassigned.
- **Meeting Brief** — Staff-owned preparation record for a client meeting. MVP uses Calendly link access plus manual notes; it does not sync booking data.
- **Upcoming Meeting** — Staff-entered upcoming client meeting date/time represented through a Meeting Brief; MVP does not import upcoming meetings from Calendly.
- **Meeting Brief State** — Lifecycle status governing whether meeting prep is draft, needs staff review, ready, stale/refresh needed, or completed.
- **Offer Fit** — Product area for identifying the right next commercial action for a Client. In MVP, this is represented by a staff-entered Commercial Next Step rather than AI-assisted recommendation.
- **Commercial Next Step** — Staff-entered next commercial action or offer direction for a Client. This is the implementation noun used across MVP surfaces.
- **Commercial Next Step Status** — Lifecycle label for a Commercial Next Step: no action, nurture, discuss offer, send follow-up, or create future opportunity.
- **Audit Event** — Immutable record of a meaningful state change, decision, owner change, reason, note, or high-risk action.
- **Source** — The origin of a Follow-up, Audit Event, or decision, such as a Report, Gate Finding, Meeting Brief, Client Profile, or staff action.

## 4. Features

### 4.1 Command Center

**Description:** The Command Center is the staff home view for work that needs action, not a passive analytics dashboard. It prioritizes escalated Reports, unresolved Gate Findings, overdue or due Follow-ups, manually recorded Upcoming Meetings, stale Meeting Briefs, and clients with blocked next steps. It realizes UJ-2.

**Functional Requirements:**

- **FR-1** — [UJ-2] Operator can view a prioritized list of work requiring attention today using the MVP priority order below.
- **FR-2** — [UJ-2] Operator can distinguish Report review work, Follow-up work, Upcoming Meeting / Meeting Brief work, and Commercial Next Step work.
- **FR-3** — [UJ-2] Operator can see each work item's Client, current state, owner, due date when applicable, why it matters, and consequence of inaction.
- **FR-4** — [UJ-2] Operator can navigate from each Command Center item to the relevant Client Profile, Report, Human Review workspace, Follow-up, or Meeting Brief.
- **FR-5** — [UJ-2] Admin can view all Command Center work across staff ownership; Operator can view work assigned to them and unassigned shared-queue work they are permitted to claim.
- **FR-6** — [UJ-2] Staff Portal must not count a passive metric as priority work unless there is a valid next action available.

MVP priority order for Command Center work:

| Priority | Work item rule | Why it matters / consequence |
| --- | --- | --- |
| P0 | Report has unresolved Blocking Gate Findings or an incomplete approval checklist. | Client delivery is unsafe until review is completed. |
| P1 | Report is escalated or Human Review is required/in review. | Staff decision is required before the Report can progress. |
| P2 | Client-visible Follow-up is overdue. | Staff may be missing a client commitment. |
| P3 | Follow-up is due today or tomorrow. | Staff can prevent an overdue commitment. |
| P4 | Upcoming Meeting is within 7 days and its Meeting Brief is draft, needs staff review, stale/refresh needed, or blocked because a linked Report is not Approved. | Staff may enter a client meeting unprepared or with unsafe report context. |
| P5 | Commercial Next Step is `discuss offer` or `send follow-up` and lacks an owner or linked Follow-up/recorded reason. | Commercial follow-through can be lost without accountable next action. |
| P6 | Client journey or pipeline status is delayed/stuck and there is no active owner, Follow-up, or recorded reason. | A Client can stall outside the normal review, meeting, follow-up, or commercial workflow. |

Tie-breaks within the same priority are due date/time first, then oldest created/updated work item, then Client name.

When a Human Review, Follow-up, Meeting Brief, or Commercial Next Step decision creates, assigns, or reassigns follow-on work, the resulting work item must appear in the responsible owner's permitted Command Center or shared queue. This routes work to the next owner without adding a heavy Notification Center to MVP.

### 4.2 Client Profile

**Description:** The Client Profile is the staff's operational memory for a Client. It combines the current Report, review state, Follow-ups, Meeting Brief notes, Commercial Next Step, and recent Audit Events into one action-oriented view. It realizes UJ-3.

**Functional Requirements:**

- **FR-7** — [UJ-3] Operator can view a Client snapshot including business name, owner, journey stage, risk/value flags, current Report State, Human Review State, Meeting Brief State, Follow-up State, and Commercial Next Step Status.
- **FR-8** — [UJ-3] Operator can see a “What Matters Now” summary that names the current blocker, next valid action, owner, due date if applicable, and consequence of ignoring it.
- **FR-9** — [UJ-3] Operator can access current and historical Reports linked to the Client.
- **FR-10** — [UJ-3] Operator can access unresolved and recently resolved Gate Findings linked to the Client's Reports.
- **FR-11** — [UJ-3] Operator can view, create, and update Follow-ups linked to the Client.
- **FR-12** — [UJ-3] Operator can view and update Meeting Brief notes linked to the Client.
- **FR-13** — [UJ-3] Operator can view and update the Client's Commercial Next Step.
- **FR-14** — [UJ-3] Operator can view recent Client activity as operational memory and recent Audit Events as formal accountability records.
- **FR-15** — [UJ-3] Staff Portal must avoid introducing conflicting names for the same lifecycle object across Client Profile, Command Center, and Human Review.

The “What Matters Now” summary uses the same priority order as the Command Center. It shows the highest-priority active blocker for the Client, the next valid action, owner, due date if applicable, and consequence of inaction. If multiple blockers share a priority, the same tie-breaks apply: due date/time, oldest created/updated work item, then Client name.

### 4.3 Human Review

**Description:** Human Review is the safety-critical workflow for escalated Reports. Staff review individual Gate Findings, resolve or escalate them, then make one whole-Report decision. Reports cannot be approved for client delivery while unresolved blocking Gate Findings remain. It realizes UJ-1.

**Functional Requirements:**

- **FR-16** — [UJ-1] Operator can view a queue of Reports requiring Human Review.
- **FR-17** — [UJ-1] Operator can open a Report review workspace showing full Report navigation, Report context, all linked Gate Findings, current Report State, and available Report artifact/version history relevant to the review, including original, edited, regenerated, or historical versions when those artifacts exist.
- **FR-18** — [UJ-1] Operator can view each Gate Finding's type, verdict, confidence, severity when available, reasoning, details, flagged Report section when available, related intake evidence when available, suggested inspection steps when available, and linked Report context.
- **FR-19** — [UJ-1] Operator can mark a Gate Finding as in review.
- **FR-20** — [UJ-1] Operator can resolve a Gate Finding.
- **FR-21** — [UJ-1] Operator can override a Gate Finding only by providing an override reason.
- **FR-22** — [UJ-1] Operator can escalate a Gate Finding further when they cannot safely resolve it.
- **FR-23** — [UJ-1] Operator can record notes on a Gate Finding decision.
- **FR-24** — [UJ-1] Operator can make a whole-Report decision after completing the Report approval checklist: all Blocking Gate Findings are resolved or overridden with reason, required review note is present, Reason Code is selected, delivery impact is reviewed, and required Audit Event details are captured.
- **FR-25** — [UJ-1] Staff Portal must prevent Report approval when unresolved blocking Gate Findings remain.
- **FR-26** — [UJ-1] Operator can mark a Report as approved, rejected, regeneration required, or clarification required.
- **FR-27** — [UJ-1] `Approved` must mean the Report is safe for client delivery, and Staff Portal must make client delivery unavailable unless current Report State is Approved.
- **FR-28** — [UJ-1] `Regeneration required` in MVP records that regeneration is needed; Staff Portal does not perform whole-report or section-level regeneration. [NON-GOAL for MVP]
- **FR-29** — [UJ-1] `Clarification required` in MVP creates or links an internal Follow-up; Staff Portal does not send a client-facing clarification request. [NON-GOAL for MVP]
- **FR-30** — [UJ-1] High-risk Report decisions must capture decision actor, timestamp, Reason Code, review note, resulting Report State, and any follow-on owner/work item created by the decision.
- **FR-31** — [UJ-1] Staff Portal must create Audit Events for Gate Finding decisions and whole-Report decisions.

### 4.4 Follow-ups

**Description:** Follow-ups are internal staff commitments, not loose notes. They can originate from Report review, clarification needs, meetings, Commercial Next Steps, support issues, or delayed client journey states. Follow-ups appear wherever the linked work context appears. They realize UJ-4.

**Functional Requirements:**

- **FR-32** — [UJ-4] Operator can create a Follow-up from a Client Profile.
- **FR-33** — [UJ-4] Operator can create or link a Follow-up from a Human Review decision when clarification or further action is needed.
- **FR-34** — [UJ-4] Operator can create a Follow-up from Meeting Brief notes.
- **FR-35** — [UJ-4] Operator can assign each Follow-up an owner.
- **FR-36** — [UJ-4] Operator can assign each Follow-up a due date.
- **FR-37** — [UJ-4] Operator can set each Follow-up source and consequence of inaction.
- **FR-38** — [UJ-4] Operator can link each Follow-up to a Client, mark whether it represents a client-visible promise, and optionally link it to a Report, Gate Finding, Meeting Brief, Commercial Next Step, support issue, admin/internal task, or delayed journey state.
- **FR-39** — [UJ-4] Operator can mark a Follow-up open, completed, deferred with reason, or reassigned.
- **FR-40** — [UJ-4] Staff Portal must identify Follow-ups that are due or overdue.
- **FR-41** — [UJ-4] Staff Portal must surface due and overdue Follow-ups in the Command Center and relevant Client Profile.
- **FR-42** — [UJ-4] Staff Portal must create Audit Events for Follow-up creation, completion, deferral, reassignment, due date changes, and first-overdue/missed events for Follow-ups marked as client-visible promises. Non-client-visible Follow-ups that first become overdue must at least create Activity visibility.

### 4.5 Meeting Brief Notes

**Description:** Meeting support in MVP is intentionally light. Staff use the existing Calendly link for booking access and maintain manual meeting notes/prep status in the Staff Portal. There is no booking sync or Calendly import in MVP. This realizes UJ-5.

**Functional Requirements:**

- **FR-43** — [UJ-5] Operator can access the configured Calendly link from relevant Client meeting surfaces.
- **FR-44** — [UJ-5] Operator can create or update manual Meeting Brief notes for a Client, including staff-entered meeting date/time when known.
- **FR-45** — [UJ-5] Operator can set Meeting Brief State to draft, needs staff review, ready, stale/refresh needed, or completed.
- **FR-46** — [UJ-5] Operator can record meeting objective, talking points, sensitive issues, offer or next step to discuss, follow-up intention, final agenda or agenda notes, and a manual prep checklist.
- **FR-47** — [UJ-5] Staff Portal must warn when a Meeting Brief marked ready may be stale because one of the MVP stale-trigger events in §5.4 occurred.
- **FR-48** — [UJ-5] Staff Portal must prevent marking a Meeting Brief ready when a linked Report is not Approved. If staff intentionally proceed with a meeting that has no approved deliverable Report, they must record an exception reason and Staff Portal must create an Audit Event.
- **FR-49** — [UJ-5] Operator can create Follow-ups from Meeting Brief notes.
- **FR-50** — [UJ-5] Staff Portal must create Audit Events for Meeting Brief state changes and follow-up creation from meeting notes.

### 4.6 Commercial Next Step (Offer Fit product area)

**Description:** Offer Fit in MVP is represented only by a simple staff-entered Commercial Next Step, not an AI-assisted recommendation or full CRM opportunity pipeline. MVP surfaces use “Commercial Next Step” as the implementation noun. It keeps sales follow-through visible without expanding the MVP into pipeline management. It realizes UJ-6.

**Functional Requirements:**

- **FR-51** — [UJ-6] Operator can record a Client's staff-entered Commercial Next Step.
- **FR-52** — [UJ-6] Operator can set Commercial Next Step Status to no action, nurture, discuss offer, send follow-up, or create future opportunity.
- **FR-53** — [UJ-6] Operator can add notes and an owner to the Commercial Next Step.
- **FR-54** — [UJ-6] Operator can create or link a Follow-up from the Commercial Next Step; statuses `discuss offer` and `send follow-up` require either a linked Follow-up or a note explaining why no Follow-up is needed.
- **FR-55** — [UJ-6] Staff Portal must not present Commercial Next Step as AI-generated or automatically scored in MVP. [NON-GOAL for MVP]
- **FR-56** — [UJ-6] Staff Portal must create Audit Events when Commercial Next Step Status or owner changes.

### 4.7 Audit Trail

**Description:** The Audit Trail gives staff and leadership accountability across state changes, high-risk decisions, owners, reasons, and notes. It is visible in context, not just as a back-office log.

**Functional Requirements:**

- **FR-57** — [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must create Audit Events for Report State changes, Gate Finding State changes, Follow-up changes, Meeting Brief State changes, Commercial Next Step changes, and ownership changes on operational work.
- **FR-58** — [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Each Audit Event must include actor, timestamp, event type, affected Client when applicable, affected object, previous state when applicable, new state when applicable, and reason/note when applicable. High-risk lifecycle decisions must include a structured Reason Code where applicable plus a staff or reviewer note.
- **FR-59** — [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Operator can view recent Audit Events in the Client Profile.
- **FR-60** — [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Admin can view a broader Audit Trail across Clients and staff actions.
- **FR-61** — [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must preserve decision provenance for overrides and approvals.
- **FR-62** — [UJ-1/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must not allow high-risk state changes to occur without an Audit Event.

### 4.8 Roles and Access

**Description:** MVP access is intentionally simple: `admin` and `operator` only. Role behavior should be consistent across Staff Portal pages and APIs.

**Functional Requirements:**

- **FR-63** — [UJ-1/UJ-2/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must restrict access to authenticated users with `admin` or `operator` role.
- **FR-64** — [UJ-1/UJ-2/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must apply role checks consistently to Staff Portal screens and data access.
- **FR-65** — [UJ-1/UJ-2/UJ-3/UJ-4/UJ-5/UJ-6] Admin can view all operational work and audit activity.
- **FR-66** — [UJ-1/UJ-2/UJ-3/UJ-4/UJ-5/UJ-6] Operator can perform operational review, follow-up, meeting-note, and Commercial Next Step actions within permitted queues.
- **FR-67** — [UJ-1/UJ-2/UJ-3/UJ-4/UJ-5/UJ-6] Staff Portal must not introduce separate `reviewer`, `sales`, or `manager` roles in MVP. [NON-GOAL for MVP]

MVP queue visibility and action rules:

| User | Visibility | Allowed queue actions |
| --- | --- | --- |
| Admin | All assigned, unassigned, completed, and audit work across staff. | View, claim, reassign, and perform valid lifecycle actions. |
| Operator | Work assigned to them, plus unassigned shared-queue work. | View own/shared work, claim unassigned shared work, perform valid lifecycle actions after claim/assignment, and reassign only to self unless Admin approves. |

Operators must not perform state-changing actions on another operator's assigned work unless they first claim/reassign it through a permitted action that creates an Audit Event.

## 5. State Models and Guardrails

### 5.1 Report State

Allowed MVP states:

- Generated
- Escalated
- In review
- Approved
- Rejected
- Regeneration required
- Clarification required

Guardrails:

- `Approved` means safe for client delivery.
- Approval is blocked if unresolved Blocking Gate Findings remain.
- Regeneration required records intent only; execution of regeneration is out of MVP.
- Clarification required creates or links an internal Follow-up; client-facing clarification workflow is out of MVP.
- Existing raw pipeline statuses must not be treated as `Approved` unless the MVP approval rule below is satisfied.

MVP brownfield mapping floor:

| Existing persisted status/source | MVP Report State | Notes |
| --- | --- | --- |
| `pipeline_status.status` in `pending`, `pending_payment`, `queued`, `running_llm`, `running_tools`, `running_deck`, `generating`, `delayed`, or `retry` | Generated only after a Report artifact exists; otherwise no governed Report State yet. | These states can create Command Center visibility when delayed, but they are not approval states. |
| `pipeline_status.status` in `ready`, `completed`, or `delivered` | Generated unless a matching approval Audit Event or `human_assist_reviews.status = approved` exists. | Existing client-visible states are not enough by themselves to satisfy Staff Portal approval safety. |
| `pipeline_status.status = human_assist` or a `human_assist_reviews.status = pending` row exists | Escalated | Human Review is required before approval. |
| `human_assist_reviews.status = in_review` | In review | Assigned/claimed review is underway. |
| `human_assist_reviews.status = approved` | Approved only if no unresolved Blocking Gate Findings remain and the approval checklist/Audit Event are complete. | Approval is a governed state, not just a raw queue status. |
| `human_assist_reviews.status = rejected` | Rejected | Client delivery remains unavailable. |
| `human_assist_reviews.status = edited` | Regeneration required | MVP records the need; regeneration execution is out of scope. |
| `pipeline_status.status` in `failed` or `error` | Rejected only when failure came from a Human Review rejection; otherwise no approved client-deliverable Report exists. | Implementation may show operational failure separately from governed Report rejection. |

### 5.2 Gate Finding State

Allowed MVP states:

- Open
- In review
- Resolved
- Overridden with reason
- Escalated further

Guardrails:

- Override requires reason.
- Whole-Report approval depends on Blocking Gate Findings being resolved or overridden with reason.
- Each Gate Finding decision creates an Audit Event.
- A Gate Finding with verdict `retry`, `block`, `escalate`, or `human_assist` is a Blocking Gate Finding while its Gate Finding State is Open, In review, or Escalated further.
- A Gate Finding with verdict `approve` is non-blocking unless later state/action evidence marks it as escalated.
- Shadow-mode gate runs still count for Staff Portal safety: a persisted `retry`, `block`, `escalate`, or `human_assist` verdict must be resolved or overridden with reason before Report approval.

MVP blocking verdict table:

| Persisted verdict | Blocking for approval? | Required resolution before Report approval |
| --- | --- | --- |
| `approve` | No | None, unless staff manually escalates the finding. |
| `retry` | Yes | Resolve after acceptable regenerated/rechecked evidence, or override with reason. |
| `block` | Yes | Resolve after evidence confirms the issue is fixed/not applicable, or override with reason. |
| `escalate` | Yes | Resolve or override with reason; escalation alone does not make the Report approvable. |
| `human_assist` | Yes | Complete Human Review, then resolve or override with reason. |

### 5.3 Follow-up State

Allowed MVP states:

- Open
- Due
- Overdue
- Completed
- Deferred with reason
- Reassigned

Guardrails:

- Every Follow-up requires owner, due date, source, linked Client context, and status.
- Deferral requires reason.
- Reassignment captures previous owner and new owner.

### 5.4 Meeting Brief State

Allowed MVP states:

- Draft
- Needs staff review
- Ready
- Stale / refresh needed
- Completed

Guardrails:

- Meeting Brief support is manual notes plus Calendly link only in MVP.
- Staff Portal must block marking a Meeting Brief ready when a linked Report is not Approved and warn when source context is stale.
- MVP stale-trigger events for a ready Meeting Brief are exhaustive: linked Report State changes; Human Review State changes; any linked Gate Finding State changes; Commercial Next Step Status or owner changes; linked Follow-up is created, completed, deferred, reassigned, or becomes overdue; staff-entered meeting date/time changes; or intake/business context attached to the Client after the Meeting Brief was marked ready.

### 5.5 Human Review State

Allowed MVP states:

- Not required
- Required
- In review
- Decision recorded
- Escalated further

Guardrails:

- Human Review State is derived from Report State and Gate Finding State where possible; it must not contradict either lifecycle.
- Decision recorded requires a whole-Report decision and required Audit Events.

### 5.6 Commercial Next Step Status

Allowed MVP statuses:

- No action
- Nurture
- Discuss offer
- Send follow-up
- Create future opportunity

Guardrails:

- Commercial Next Step Status is staff-entered in MVP.
- Commercial Next Step Status must not be presented as AI-generated, scored, or rule-approved in MVP.
- Statuses `discuss offer` and `send follow-up` require an owner plus either a linked Follow-up or a note explaining why no Follow-up is needed.

### 5.7 MVP Reason Codes

Reason Codes are intentionally small in MVP. Staff may add free-text notes, but high-risk decisions must select one of these structured codes:

| Decision type | MVP Reason Codes |
| --- | --- |
| Approval | `quality-verified`, `approved-after-override`, `non-blocking-findings-only` |
| Rejection | `unsupported-content`, `safety-risk`, `incomplete-evidence`, `client-delivery-not-safe` |
| Gate Finding override | `false-positive`, `evidence-confirmed`, `acceptable-risk`, `policy-exception-approved` |
| Deferral | `waiting-for-client-context`, `waiting-for-internal-review`, `capacity-or-scheduling` |
| Reassignment | `capacity`, `expertise`, `continuity` |
| Regeneration required | `unsupported-claim`, `missing-section`, `stale-inputs`, `quality-failure` |
| Clarification required | `missing-client-context`, `conflicting-intake-context`, `needs-human-confirmation` |

### 5.8 Audit Retention and Export Floor

MVP Audit Events must be retained for at least 24 months. Admins must be able to export Audit Events by date range and, when available, by Client and event type. Export may be CSV in MVP. Exact storage/index implementation is an architecture decision, but the product floor is durable retention plus basic internal governance export.

## 6. Cross-Cutting Non-Functional Requirements

- **NFR-1 — Safety:** State transitions must enforce the valid actions and blocking rules in §5.1–§5.7 for Reports, Gate Findings, Follow-ups, Meeting Briefs, and Commercial Next Steps.
- **NFR-2 — Auditability:** High-risk actions must leave durable Audit Events that satisfy §4.7 and the retention/export floor in §5.8.
- **NFR-3 — Consistency:** The same lifecycle terms must mean the same thing across all Staff Portal surfaces, and Commercial Next Step must remain the MVP implementation noun.
- **NFR-4 — Usability:** Staff must be able to reach the next valid action from the Command Center or Client Profile without hunting through disconnected screens, using the priority and What Matters Now rules in §4.1–§4.2.
- **NFR-5 — Accessibility:** Staff Portal UI should target WCAG 2.1 AA for core workflows. [ASSUMPTION: WCAG 2.1 AA is the accessibility baseline for internal staff surfaces.]
- **NFR-6 — Reliability:** Staff Portal must not show stale readiness states without warning when one of the MVP stale-trigger events in §5.4 occurs.
- **NFR-7 — Security:** Staff Portal data and APIs must be available only to authenticated `admin` and `operator` users, with queue visibility enforced as defined in §4.8.

## 7. Non-Goals

- Full CRM pipeline management is out of MVP.
- AI-assisted Commercial Next Step / Offer Fit recommendation is out of MVP.
- Offer scoring, revenue probability, objection handling, and advanced sales talk tracks are out of MVP.
- Whole-report or section-level regeneration execution from Staff Portal is out of MVP.
- Client-facing clarification request workflows are out of MVP.
- Calendly booking sync, calendar import, and stored appointment lifecycle are out of MVP.
- Advanced admin rule simulation, impact preview, rollback, and governance workflows are out of MVP.
- Heavy notification inbox is out of MVP; contextual surfacing of work is preferred.
- Additional staff roles beyond `admin` and `operator` are out of MVP.

## 8. MVP Scope

### 8.1 In Scope

- Command Center focused on actionable work.
- Client Profile with state, follow-up, meeting-note, Commercial Next Step, and recent audit context.
- Human Review queue and review workspace.
- Gate Finding state decisions and whole-Report approval decision.
- Follow-up model with owner, due date, source, linked context, and status.
- Manual Meeting Brief notes with Calendly link access.
- Simple staff-entered Commercial Next Step.
- Contextual Audit Events for lifecycle and decision changes.
- `admin` and `operator` access model.

### 8.2 Out of Scope for MVP

- Automated meeting/booking sync.
- AI-generated meeting brief content. [v2 — out of MVP]
- AI-assisted commercial recommendations. [v2 — out of MVP]
- Full opportunity pipeline. [v2 — out of MVP]
- Staff Portal-triggered report regeneration execution. [v2 — out of MVP]
- Client-facing clarification forms or messages. [v2 — out of MVP]
- Advanced notification center. [v2 — out of MVP]
- Admin rule authoring and governance control surface. [v2 — out of MVP]

## 9. Success Metrics

**Primary**

- **Escalated report visibility:** 100% of escalated Reports appear in Human Review or Command Center.
- **Approval safety:** 0 Reports can be approved while unresolved blocking Gate Findings remain.
- **Decision provenance:** 100% of approvals, rejections, overrides, and regeneration-required decisions create Audit Events with actor and timestamp.
- **Follow-up completeness:** 100% of Follow-ups have owner, due date, source, linked Client, and status.

**Secondary**

- **Client blocker clarity:** In PRD acceptance review, staff can identify the current blocker and next valid action for 5 representative Clients from the Client Profile without leaving the page.
- **Follow-up surfacing:** 100% of due and overdue Follow-ups appear in the Command Center and linked Client Profile.
- **Meeting notes readiness:** Staff can create Meeting Brief notes and mark them ready/completed without calendar sync, and 0 Meeting Briefs linked to a Report can be marked ready while that Report is not Approved unless an explicit no-approved-deliverable exception reason and Audit Event are recorded.
- **Commercial next step quality:** Staff can record Commercial Next Step Status for a Client without creating a CRM pipeline object, and 100% of `discuss offer` / `send follow-up` Commercial Next Steps have an owner plus either a linked Follow-up or a recorded reason that no Follow-up is needed.

**Counter-metrics — do not optimize**

- Do not optimize for number of dashboard widgets; optimize for valid next actions.
- Do not optimize for faster approval if it increases overrides without reasons.
- Do not optimize for more commercial suggestions if staff confidence and evidence quality drop.
- Do not optimize for automation in meeting prep before report safety is reliable.

## 10. Open Questions

No phase-blocking product questions remain for downstream UX, architecture, epics, and stories after the 2026-05-24 validation update.

Non-blocking follow-ups for architecture and implementation:

1. Choose the exact database schema and migration/backfill approach for the state mappings in §5.1–§5.2.
2. Confirm whether historical `ready`, `completed`, or `delivered` Reports need a one-time approval Audit Event backfill or should remain `Generated` until reviewed.
3. Define exact UI copy for Reason Codes, stale-warning messages, and priority explanations without changing the product semantics above.

## 11. Assumptions Index

- §6 NFR-5 — WCAG 2.1 AA is the accessibility baseline for internal staff surfaces.
