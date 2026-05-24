# Staff Portal MVP PRD Addendum

## 1. Brownfield Code Reconnaissance Notes

These notes inform downstream architecture. They are not PRD requirements unless represented in `prd.md`.

### Existing Report / Portal Data

- Existing core data model includes users, receipts, transcripts, reports, pipeline status, and processed events.
- Reports are stored as metadata plus R2/local artifacts rather than fully normalized report sections.
- Report artifacts include analysis JSON, metadata JSON, transcript text, and local markdown fallback.
- Client portal APIs already expose user, report, assessment, and receipt data.

### Existing Gate / Human Assist Data

- Gate findings are persisted in `assessment_gates` with gate type, verdict, confidence, reasoning, details, model/prompt metadata, and timing.
- Gate policy can map verdicts to approve/retry/block/escalate, but current default behavior may run in shadow mode.
- `human_assist_reviews` exists for pending/in-review/approved/rejected/edited review states.
- Human assist store joins review records to pipeline status, gate metadata, and intake progress.

### Missing or Weak Product Areas

- No persistent follow-up/task table was found.
- No stored meeting/booking entity or Calendly webhook/import flow was found.
- No unified operator action / audit event table was found.
- `assessment_orders` migration exists as immutable order/audit-oriented data, but no runtime usage was found during reconnaissance.
- Operator/admin route protection appears inconsistent and should be reviewed before implementation.
- Pipeline status code and migration constraints may not align for newer values such as ready/failed/human_assist/generating/delayed/delivered.

## 2. Implementation-Sensitive Product Decisions

- MVP roles are only `admin` and `operator`.
- `Approved` means safe for client delivery.
- Staff Portal MVP records `regeneration required` but does not execute regeneration.
- Clarification required creates only an internal Follow-up; it does not create a client-facing clarification request.
- Meeting MVP is Calendly link plus manual staff notes only.
- Offer Fit MVP is simple staff-entered Commercial Next Step only.

## 3. Deferred Product Depth

The following details are deliberately deferred to architecture, UX, or later product work:

- Exact database schema for Report State, Gate Finding State, Follow-up State, Meeting Brief State, Offer Fit, and Audit Event.
- Extended reason-code taxonomy beyond the MVP minimum defined in `prd.md` §5.7.
- Permission and queue visibility rules beyond the MVP assigned/unassigned/admin model defined in `prd.md` §4.8.
- Calendar integration and booking synchronization.
- AI-generated meeting brief content, including client situation snapshot, what matters now, report talking points, likely questions/objections, suggested agenda, Offer Fit suggestion, and prep checklist draft.
- Locked meeting-ready versions and richer prep checklist workflow.
- AI-assisted Offer Fit recommendation and scoring.
- Commercial Next Step / Offer Fit guardrails beyond MVP, including allowed/blocked offers, no-sell/nurture signals, evidence requirements, senior approval requirements, prohibited claims, and evidence-linked recommendation.
- Full Opportunity model distinct from Offer Fit: active sale target, buyer, timing, value, and sales stage.
- Admin governance workflows, rule simulation, impact preview, and rollback.
- Admin as an operations control surface for safely changing operational policy, not passive settings.
- Lightweight Notification Center for personal catch-up / attention history, distinct from Command Center, Audit Trail, and Activity Timeline.

## 4. Source-Preserved Planning Context

These notes preserve source-brief intent for downstream UX, architecture, epics, and future product work. They are not MVP requirements unless represented in `prd.md`.

### Recommended MVP Build Sequence

The source brief proposed this 4-week delivery sequence as planning context, not a hard contractual commitment:

1. Week 1 — Client Profile and Command Center skeleton.
2. Week 2 — Human Review queue/workspace and review decisions.
3. Week 3 — Follow-ups and Audit Trail.
4. Week 4 — Simple Meeting Brief support, polish, and testing.

### Source Navigation and Product Mental Model

Original navigation concepts: Command Center, Clients, Human Review, Meetings, Opportunities, Admin, Audit, and Notification Center. MVP may collapse, hide, or defer areas not required by `prd.md`.

Source mental model:

- **Report Quality Engine** — Human Review, Gate Findings, Report Approval, and Audit.
- **Client Growth Engine** — Meetings, Opportunities, Offer Fit, Follow-ups, and Client Success Notes.

MVP implements the Report Quality Engine more fully than the Client Growth Engine. Client Growth Engine coverage is limited to Follow-ups, Meeting Brief notes, and staff-entered Commercial Next Step.

### UX Structure Guidance

Source Command Center groupings for UX exploration:

- Today's Priority Work.
- Quality Queue.
- Growth Queue.

Source Client Profile overview cards for UX exploration:

- Client Snapshot.
- What Matters Now.
- Quality Card.
- Growth Card.
- Follow-up Card.
- Recent Activity.

These are guidance for UX, not mandatory screen architecture.

### Gate Finding Resolution Taxonomy

The PRD keeps the MVP Gate Finding State model small. The source brief also named useful resolution subtypes for UX/audit labels:

- Resolved — no change needed.
- Resolved — edited report.
- Resolved — regenerated section/report.
- Resolved — client clarification requested.
- Escalated further.
- Dismissed with override reason.

### Future Meeting Brief Taxonomy

MVP Meeting Brief support remains manual notes plus Calendly link access. Future AI-assisted Meeting Brief work may revisit the source taxonomy.

AI-generated draft sections originally considered:

- Client situation snapshot.
- What matters now.
- Report talking points.
- Likely questions / objections.
- Suggested agenda.
- Offer Fit suggestion.
- Prep checklist draft.

Staff-approved sections originally considered:

- Meeting objective.
- Top 3 talking points.
- Sensitive issues / avoid-saying guidance.
- Offer to discuss.
- Follow-up intention.
- Final agenda.
- Prep complete.

Locked meeting-ready versions remain deferred.

### Future Offer Fit and Opportunity Direction

Future Offer Fit direction should preserve the source split:

- Rules create commercial guardrails: available offers, allowed/blocked offers, no-sell or nurture signals, evidence requirements, senior approval requirements, and prohibited claims.
- AI assists with interpretation: matching pain to offer types, summarising fit evidence, detecting readiness or slow-down signals, drafting talk tracks, suggesting next questions, and explaining why this/why now.
- Staff own the recommendation: approving the offer, pitch timing, wording, pipeline stage, estimated value, next action, and follow-up commitment.

Source distinction:

- Offer Fit answers the right next commercial action.
- Opportunity answers what is being actively sold, to whom, by when, for how much, and at what sales stage.

MVP still implements only staff-entered Commercial Next Step.

### Source Review Heuristics and Risk Ranking

The source brief ranked these MVP risks for downstream review:

1. Scope creep killing the MVP.
2. Unsafe Report approval.
3. Missed Follow-ups.
4. Stale Meeting prep.

Source failure modes to keep visible during UX, architecture, epics, and QA:

- Polished screens imply safety while approval rules remain bypassable.
- `Approved` means different things in different surfaces.
- Staff can bypass the Human Review workflow.
- Follow-ups exist without source, owner, due date, or consequence.
- Meeting prep looks ready while the linked Report is not approved.

### Future Admin / Governance Checklist

Advanced Admin/Governance is out of MVP. Source taxonomy for future work:

- Operational Rules — Gate Rules, Review Workflows, Offer Fit Rules, Follow-up Policies, and Communication Templates.
- Business Configuration — Offer Catalogue, Meeting Brief Templates, Roles & Permissions, and Integrations.
- Governance — Pending changes, approvals, version history, audit/retention, rule impact preview, and rollback.

If implemented later, each operational policy change should answer:

- What is changing?
- Why is it changing?
- Who approved it?
- What clients, reports, or workflows could be affected?
- Can staff preview impact before publishing?
- Can staff roll it back?

### Future Notification Principle

Source principle: do not make staff manage notifications as a separate workload; use notifications to move staff to the right work.

Future contextual alerts may include Command Center priority items, Client Profile banners/chips, Human Review queue warnings, Meeting prep warnings, Opportunity next-action warnings, and Admin approval warnings.

Keep the four concepts distinct:

- Command Center — work queue.
- Notification Center — attention history and personal catch-up.
- Audit Trail — formal accountability.
- Activity Timeline — operational memory.
