# Reconciliation Extract: Original Staff Portal Brief → Current PRD Workspace

Inputs read in full:

Source brief workspace:

- `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23/brief.md`
- `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23/addendum.md`
- `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23/decision-log.md`

Current PRD workspace:

- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/prd.md`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/addendum.md`
- `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/decision-log.md`

Purpose: identify source-backed gaps, conflicts, omissions, or qualitative intent that may have been dropped from the current PRD/addendum. This file is extraction only; no PRD changes were made.

## Executive Assessment

The current PRD preserves the main product spine from the original brief: state-model-first operations, Human Review priority, four lifecycle models, actionable Command Center, Client Profile, Follow-ups, Meeting Brief notes, auditability, and MVP scope restraint. It also intentionally narrows several brief/addendum ideas after later PRD decisions: only `admin`/`operator` roles, manual Meeting Brief notes rather than AI-generated briefs, staff-entered Commercial Next Step rather than AI-assisted Offer Fit, and no full Opportunity/Admin/Notification Center depth in MVP.

The main reconciliation issues are not wholesale omissions; they are traceability mismatches and several source-backed details that were softened or moved too far out of view:

1. The PRD source/provenance points to a different `brief-agentic-ai-staff-portal-2026-05-23-workflow` workspace, while this reconciliation source is the original `brief-agentic-ai-staff-portal-2026-05-23` workspace.
2. Human Review lost explicit source intent for full report navigation and original/edited/regenerated version context.
3. Meeting Brief readiness is weaker than one addendum failure mode: current PRD blocks readiness while review is unresolved, but the source also warns against meeting prep looking ready when the report is not approved.
4. The source success criterion that every high-risk decision has a reason code, reviewer note, and audit event is only partially enforced across all decision types.
5. The 4-week build sequence, navigation/mental-model trees, reverse-brainstorming risk ranking, and richer future IA/governance taxonomy are not fully preserved in the PRD addendum.

## A. Already Covered in Current PRD / Addendum

| Source-backed item | Current coverage | Notes |
| --- | --- | --- |
| State-model-first product principle; avoid dashboard-first/passive metrics | `prd.md` §1, §4.1, §6 NFR-1/NFR-4 | Covered strongly. |
| Operating loop: see state → understand blocker → take valid action → record decision → move to next state | `prd.md` §1 and functional requirements across §4 | Covered. |
| Primary MVP priority: Human Review reliability before growth workflows | `prd.md` §1, §4.3, §8 | Covered. |
| Four lifecycle models: Report, Gate Finding, Follow-up, Meeting Brief | `prd.md` §5.1-§5.4 | Covered, with added Human Review State and Commercial Next Step Status. |
| Report cannot be approved with unresolved blocking Gate Findings | `prd.md` FR-24, FR-25, §5.1-§5.2 | Covered and strengthened with blocking verdict table. |
| Findings reviewed individually; report approved as a whole | `prd.md` §4.3, FR-24; glossary | Covered. |
| Command Center as actionable work queue | `prd.md` §4.1 | Covered, with priority order. |
| Client Profile Overview / “What Matters Now” intent | `prd.md` §4.2 | Covered, though source card taxonomy is not fully preserved. |
| Human Review queue/workspace, Gate Findings, reviewer notes, reason codes, report decisions | `prd.md` §4.3, §5.7 | Mostly covered. See gaps for version context and high-risk note consistency. |
| Review actions: approve, reject, regenerate, clarification, override with reason, escalate further | `prd.md` FR-20-FR-29 | Covered, with regeneration and clarification narrowed to MVP-safe meanings. |
| Follow-ups as commitments with owner, due date, source, linked context, status | `prd.md` §4.4, §5.3, success metrics | Covered. |
| Meeting notes, prep checklist, follow-up creation from meeting context | `prd.md` §4.5 | Covered as manual Meeting Brief notes. |
| Audit trail for decisions and state changes | `prd.md` §4.7, §5.8, NFR-2 | Covered and strengthened with retention/export floor. |
| Out-of-scope: advanced objection handling, AI sales talk tracks, scoring, revenue probability, full CRM pipeline, advanced admin governance, heavy notification inbox | `prd.md` §7-§8.2; `addendum.md` §3 | Covered/deferred. |
| Notification distinction: Command Center vs Notification Center vs Audit vs Activity | `prd.md` glossary and §7; `addendum.md` §3 | Mostly covered, though original principle could be preserved more explicitly. |
| Source open questions about entities/gates/delivery gating/calendar data | `prd.md` §10; `addendum.md` §1 | Superseded by reconnaissance and non-blocking architecture follow-ups. |

## B. Missing or Weakened — Should Update PRD

These are source-backed items that appear product-requirement-level rather than only background context.

### B1. Source provenance mismatch

- Source input: original brief workspace paths are under `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23/`.
- Current PRD issue: `prd.md` §0 and PRD `decision-log.md` identify source inputs under `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/`, plus `.decision-log.md` naming.
- Why it matters: downstream readers may not know that the original brief set reconciled here is distinct from the PRD-listed source set. This weakens auditability of product decisions.
- Recommended PRD update: add the original brief workspace as an explicit source input or add a provenance note explaining whether the `-workflow` workspace superseded/cloned the original. Also reconcile the decision-log naming/path discrepancy.
- Category: missing/traceability conflict; should update PRD or PRD decision log.

### B2. Human Review version context is under-specified

- Source input: brief addendum Human Review Cockpit requires Whole Report Context with “Full report navigation,” “Original / edited / regenerated versions,” “Overall approval checklist,” and “Final report-level decision.”
- Current PRD coverage: FR-17/FR-18 require Report context, linked Gate Findings, flagged section/evidence/context; FR-24 defines approval checklist. It does not explicitly require full report navigation or original/edited/regenerated version context.
- Why it matters: report safety depends on comparing the reviewed output to prior/edited/regenerated variants where they exist. Without this, a reviewer may approve the wrong version or lose context for `regeneration required` / `edited` states.
- Recommended PRD update: in Human Review FRs, require access to full report navigation and, when available, original/edited/regenerated versions or version history relevant to the decision.
- Category: missing; should update PRD.

### B3. Meeting Brief readiness may need a stronger “report approved” guardrail

- Source input: brief addendum failure mode: “Meeting prep looks ready even though the report is not approved.” Brief success criteria also says Meeting prep cannot be marked ready if report review is unresolved or the brief is stale.
- Current PRD coverage: FR-48 blocks marking Meeting Brief ready while linked Report review is unresolved; §5.4 warns on stale context. It does not clearly block readiness when the linked Report review is resolved into a non-approved state, such as Rejected, Regeneration required, or Clarification required.
- Why it matters: the addendum frames unapproved report context as a meeting-prep safety risk, not only unresolved review.
- Recommended PRD update: clarify Meeting Brief readiness rules. Candidate wording: a Meeting Brief linked to a Report can be marked `Ready` only when the linked Report State is `Approved`, or when staff explicitly records that the meeting is proceeding without a deliverable approved report and that exception creates an Audit Event. If no such exception is desired, make `Approved` a hard prerequisite.
- Category: potential conflict/weakening; should update PRD.

### B4. High-risk decision completeness is only partially generalized

- Source input: brief success criterion: “Every high-risk decision has a reason code, a reviewer note, and an audit event.”
- Current PRD coverage: FR-30 requires actor, timestamp, Reason Code, review note, and resulting Report State for high-risk Report decisions. Gate Finding override requires reason (FR-21), notes are allowed (FR-23), and Audit Events are required (FR-31). Follow-up deferral/reassignment and other high-risk lifecycle changes have reason/audit requirements in places, but not a single generalized completeness rule.
- Why it matters: the source intent is broader than report-level decisions only. Overrides, escalations, deferrals, reassignments, regeneration-required, and clarification-required decisions can all be high-risk operational decisions.
- Recommended PRD update: add or strengthen a cross-cutting requirement: all high-risk lifecycle decisions require structured Reason Code where applicable, staff note/reviewer note, actor, timestamp, and Audit Event. Define the MVP high-risk decision set explicitly.
- Category: missing/softened; should update PRD.

### B5. “Stuck clients” are not explicitly modeled in Command Center priority rules

- Source input: brief Must Have: Command Center includes escalated reports, upcoming meetings, overdue follow-ups, and “stuck clients.”
- Current PRD coverage: Command Center description includes “clients with blocked next steps”; priority table covers report blockers, follow-ups, meetings, and Commercial Next Step issues. Brownfield mapping says delayed pipeline states “can create Command Center visibility when delayed,” but no FR/priority rule explicitly defines stuck client/journey surfacing.
- Why it matters: if a client is stalled outside report review/follow-up/meeting/commercial-next-step objects, the source expects Command Center visibility.
- Recommended PRD update: either define “stuck client” as a concrete MVP rule in Command Center priority derivation, or explicitly state that stuck-client visibility is limited to the modeled lifecycle objects in MVP. If included, add a low-priority rule for delayed client journey/pipeline states with no active owner or next action.
- Category: missing/ambiguous; should update PRD.

### B6. Staff-approved Meeting Brief fields omit “final agenda” explicitly

- Source input: brief addendum Staff-approved sections include Meeting objective, Top 3 talking points, Sensitive issues / avoid-saying guidance, Offer to discuss, Follow-up intention, Final agenda, and Prep complete.
- Current PRD coverage: FR-46 includes meeting objective, talking points, sensitive issues, offer or next step to discuss, follow-up intention, and manual prep checklist. It does not explicitly mention final agenda or a “prep complete” action, though readiness/completed states partly cover it.
- Why it matters: final agenda is a concrete staff-owned meeting artifact, not an AI-generated section.
- Recommended PRD update: add “final agenda” to FR-46 and clarify whether marking `Ready` is the MVP equivalent of “prep complete.”
- Category: minor omission; should update PRD if meeting prep remains in MVP scope.

## C. Missing but Better Suited to PRD Addendum

These items are source-backed but are better preserved as downstream UX/architecture/product-context notes rather than MVP requirements.

### C1. 4-week build sequence

- Source input: brief and brief decision log define sequence: Week 1 Client Profile + Command Center skeleton; Week 2 Human Review queue/cockpit + decisions; Week 3 Follow-ups + audit trail; Week 4 Simple Meeting Brief + polish/test.
- Current PRD coverage: not preserved in `prd.md` or `addendum.md`.
- Recommended addendum update: add “Source build-sequence intent” for downstream epic/story sequencing. Avoid making it a hard delivery commitment unless planning confirms capacity.
- Category: missing; belongs in PRD addendum.

### C2. Navigation architecture tree

- Source input: Staff Portal navigation tree: Command Center, Clients, Human Review, Meetings, Opportunities, Admin, Audit, Notification Center.
- Current PRD coverage: MVP surfaces and deferred areas are mentioned, but the original navigation architecture is not preserved as an IA reference.
- Recommended addendum update: preserve this as “Original IA / future navigation reference,” noting that MVP may collapse or hide deferred areas.
- Category: missing qualitative/UX context; belongs in PRD addendum.

### C3. Report Quality Engine / Client Growth Engine mental model

- Source input: addendum splits the portal mental model into Report Quality Engine and Client Growth Engine, with Client Success Notes included under growth.
- Current PRD coverage: product areas exist, but the explicit two-engine mental model and Client Success Notes language are not preserved.
- Recommended addendum update: add the mental model as product context for UX and future IA. Make clear MVP implements only a small subset of Client Growth Engine via Follow-ups, Meeting Brief notes, and Commercial Next Step.
- Category: missing qualitative intent; belongs in PRD addendum.

### C4. Reverse-brainstorming risk ranking and failure modes

- Source input: risk ranking: scope creep killing MVP; unsafe report approval; missed follow-ups; stale meeting prep. Additional failure modes include polished screens implying safety, inconsistent “Approved,” workflow bypass, follow-ups without source, meeting prep ready while report not approved.
- Current PRD coverage: most risks are addressed as requirements, but the ranked risk list is not preserved as a design/review heuristic.
- Recommended addendum update: add the risk ranking and failure modes as “review heuristics” for UX, architecture, epics, and QA.
- Category: missing qualitative intent; belongs in PRD addendum.

### C5. Admin/Governance future taxonomy is compressed

- Source input: addendum lists Admin → Operational Rules (Gate Rules, Review Workflows, Offer Fit Rules, Follow-up Policies, Communication Templates), Business Configuration (Offer Catalogue, Meeting Brief Templates, Roles & Permissions, Integrations), Governance (Pending changes, Approvals, Version history, Audit/retention, Rule impact preview, Rollback).
- Current PRD coverage: `addendum.md` defers admin governance and preserves the principle, but not the taxonomy.
- Recommended addendum update: include the taxonomy as future-state context, explicitly non-MVP.
- Category: missing future-state detail; belongs in PRD addendum.

### C6. Offer Fit qualitative principle and Opportunity/Talk Track future hints

- Source input: Operating Principles: “Rules create commercial guardrails; AI explains client fit; staff own the recommendation.” Could Have: lightweight evidence-linked offer-fit recommendation, opportunity status, sales next action, suggested talk track. Offer Fit/Opportunity split is detailed in addendum.
- Current PRD coverage: Commercial Next Step is MVP noun; AI-assisted Offer Fit and full Opportunity model are deferred. Evidence-linked recommendations are mentioned in addendum, but opportunity status/sales next action/suggested talk track are not fully preserved as future hints.
- Recommended addendum update: preserve these as non-MVP future-context notes while retaining current MVP non-goals.
- Category: missing future-state qualitative detail; belongs in PRD addendum.

### C7. Notification principle could be preserved more explicitly

- Source input: “Do not make staff manage notifications. Use notifications to move staff to the right work.”
- Current PRD coverage: heavy/advanced notification inbox is out of scope; lightweight Notification Center is deferred; Command Center/Audit/Activity distinction is mostly covered.
- Recommended addendum update: add the source principle verbatim or near-verbatim as a future notification UX guardrail.
- Category: minor qualitative omission; belongs in PRD addendum.

## D. Intentionally Superseded or Conflicting with Current PRD Decisions

These source items conflict with later current PRD decisions or were intentionally narrowed for MVP.

| Source item | Current PRD decision | Reconciliation stance |
| --- | --- | --- |
| Reviewer/admin as separate user language | MVP roles are only `admin` and `operator`; no separate Reviewer role | Intentionally superseded. Do not restore a separate role unless access model changes. |
| Meeting Brief starts as AI-generated draft with AI sections | MVP is Calendly link plus manual staff notes only; AI-generated meeting content is v2/out of MVP | Intentionally superseded for MVP; already deferred in addendum. |
| Locked meeting-ready Meeting Brief version | Deferred product depth | Superseded for MVP; addendum already mentions richer workflow/locked versions as deferred. |
| Lightweight AI/evidence-linked Offer Fit recommendation as Could Have | MVP is staff-entered Commercial Next Step; AI-assisted recommendations/scoring out of MVP | Intentionally superseded for MVP; preserve future context only. |
| Opportunity status / active sale model | Full opportunity pipeline out of MVP | Intentionally superseded for MVP; preserve future split only. |
| Advanced Admin/Governance control surface | Out of MVP; future direction | Intentionally deferred, not a PRD gap except taxonomy preservation. |
| Notification Center in navigation | Heavy/advanced notification inbox out of MVP; lightweight future center deferred | Intentionally deferred. |
| Source open question: where client-delivery approval gating is enforced | PRD establishes `Approved` as required for client delivery and adds guardrails | Superseded by PRD decision. |
| Source open question: existing entities for states/gates/follow-ups/meetings | PRD addendum reconnaissance identifies existing/missing areas and PRD §10 moves to non-blocking implementation follow-ups | Superseded by reconnaissance. |
| Source decision-log setup says BMAD was not installed and brief was manually created | PRD decision-log says `bmad-prd` activated and customization resolved | Process/provenance conflict. Do not treat as product requirement, but document traceability should explain if these refer to different runs/workspaces. |

## Recommended Action

1. Update PRD source/provenance references to include or explain the original brief workspace reconciled here.
2. Add narrow PRD requirements for Human Review full report/version context, Meeting Brief readiness against approved report state, generalized high-risk decision completeness, explicit stuck-client handling, and final agenda/prep-complete wording.
3. Add a PRD addendum section preserving original build sequence, navigation tree, two-engine mental model, risk ranking/failure modes, admin future taxonomy, Offer Fit/Opportunity future hints, and notification principle.
4. Do not re-expand MVP to include AI-generated meeting briefs, AI Offer Fit, full opportunities, advanced admin governance, notification center, or extra staff roles unless product leadership reverses the current PRD decisions.
