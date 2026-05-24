# Decision Log: Staff Portal MVP PRD

## 2026-05-23

### Activation

- Activated `bmad-prd` in create mode for the Agentic AI Staff Portal MVP.
- Resolved workflow customization via `_bmad/scripts/resolve_customization.py`.
- Loaded `_bmad/bmm/config.yaml`.
- No `project-context.md` file was found from the configured persistent fact glob.
- PRD workspace created at `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/`.

### Source Inputs Identified

- Product brief: `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/brief.md`
- Brief addendum: `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/addendum.md`
- Brief decision log: `_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23-workflow/.decision-log.md`
- Original brainstorming session: `_bmad-output/brainstorming/brainstorming-session-2026-05-23-120000.md`

### Initial Read

- This is a brownfield planning effort for an existing Agentic AI assessment platform.
- The PRD should feed downstream UX, architecture, epics, and stories rather than serve as a tiny all-inclusive implementation spec.
- Human Review reliability and state-model enforcement are the primary MVP risks to preserve in PRD form.

### Source Extraction Summary

- Product brief establishes the operating loop: see state, understand blocker, take valid action, record decision, move to next state.
- Required MVP lifecycle objects: Report, Gate Finding, Follow-up, and Meeting Brief.
- Must-have scope: Command Center, Client Profile Overview, Human Review queue/workspace, review actions, audit trail, and follow-ups.
- Should-have scope: simple Meeting Brief draft, prep checklist, meeting notes, and follow-up creation from meeting context.
- Code reconnaissance found existing report metadata, R2/local report artifacts, persisted `assessment_gates`, and partial `human_assist_reviews` support.
- Code reconnaissance found no persistent follow-up/task model, no stored booking/meeting model, and no unified audit/operator action log.
- Code reconnaissance found a risk that human-assist status values may not align with the current `pipeline_status` schema constraints.

### Working Mode

- Lorin selected Express mode: resolve remaining critical gaps in a short batch, then draft the full PRD.

### Express Gap Decisions

- MVP staff roles are `admin` and `operator` only; no separate `reviewer` role in MVP.
- `Approved` means the report is safe for client delivery.
- MVP regeneration action is `regeneration required` only; no whole-report or section-level regeneration execution inside the Staff Portal MVP.
- Client clarification in MVP creates an internal follow-up only; no client-facing clarification request workflow in MVP.
- Meeting MVP uses Calendly link only plus manual staff notes; no Calendly sync/import in MVP.
- Offer Fit MVP is a simple staff-entered commercial next step, not AI-assisted recommendation in MVP.

### Draft Created

- Drafted `prd.md` with sections for Vision, Target Users, Glossary, Features, State Models and Guardrails, NFRs, Non-Goals, MVP Scope, Success Metrics, Open Questions, and Assumptions Index.
- Created `addendum.md` for brownfield code reconnaissance notes, implementation-sensitive product decisions, and deferred technical/product depth.
- PRD includes 67 globally numbered functional requirements.

### Reconciliation and Discipline Pass Fixes

- Ran source reconciliation against the brief, addendum, PRD, and addendum.
- Strengthened delivery gating so client delivery is unavailable unless current Report State is Approved.
- Restored Follow-up consequence and client-visible promise flag requirements.
- Restored required reviewer note for high-risk Report decisions.
- Strengthened Meeting Brief readiness from prevent-or-warn to a hard block while linked Report review is unresolved.
- Added richer Human Review context requirements: severity, flagged Report section, related intake evidence, suggested inspection steps, and approval checklist.
- Preserved future Meeting Brief, Offer Fit, Opportunity, Admin, and Notification Center concepts in `addendum.md` while keeping them out of MVP scope.
- Added FR-level user journey traceability tags.
- Removed implementation-leaning stale-detection assumption from the PRD.
- Retried reviewer validation after a transient subagent attention notification.
- Fixed remaining reviewer warnings by adding manual prep checklist support, defining Blocking Gate Finding and Reason Code, and resolving Operator visibility as assigned/shared queues while Admin sees all operational work.
- Fixed final terminology/measurement warnings by defining Human Review State and Commercial Next Step Status models, making secondary success metrics measurable, removing the obsolete Commercial Next Step label assumption, and aligning FR terminology with defined state names.
- Clarified Blocking Gate Finding semantics: escalation does not make a Report approvable; approval requires resolution or override with reason.
- Made the Report approval checklist measurable in FR-24.
- Restored upcoming-meeting surfacing within MVP constraints by defining Upcoming Meeting as staff-entered date/time on Meeting Briefs, not Calendly sync.
- Defined Activity as operational memory distinct from formal Audit Events.

### Polish

- Ran configured structure and prose polish reviews.
- Applied prose polish for review-note terminology, Reason Code capitalization, Meeting Brief readiness wording, Commercial Next Step term consistency, and clarification wording in the addendum.
- Structural review suggested larger reordering/deduplication, but no required structural edit was applied because validation passed and the current PRD structure is more convenient for downstream BMAD extraction.

### Finalization

- Final validation smoke-check reported no new fail/warn findings.
- PRD status finalized as ready for downstream UX and architecture planning.

## 2026-05-24

### Validation Update

- Activated deprecated `bmad-edit-prd` shim, which forwards to `bmad-prd` update intent.
- Applied the PRD validation findings from `review-rubric.md` and `validation-report.md`.
- Closed the high-severity implementation-readiness gaps by adding MVP brownfield status mapping, blocking verdict rules, and Command Center / What Matters Now priority derivation.
- Closed medium findings by adding audit retention/export floor, Commercial Next Step quality rule, exhaustive Meeting Brief stale-trigger list, and explicit MVP queue visibility/action rules.
- Reduced terminology drift by making `Commercial Next Step` the MVP implementation noun while preserving Offer Fit as the product-area label.
- Replaced phase-blocking Open Questions with non-blocking architecture/implementation follow-ups.

### Brief Reconciliation Update

- User requested update intent against `_bmad-output/planning-artifacts/briefs/*`.
- Reconciled both source brief workspaces against the current PRD and wrote extraction files:
  - `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/reconcile-brief-original.md`
  - `_bmad-output/planning-artifacts/prds/prd-agenticai.net.au-2026-05-23/reconcile-brief-workflow.md`
- Preserved current MVP decisions that supersede source-brief future scope: no separate `reviewer` role, no AI-generated Meeting Briefs, no Calendly sync, no AI Offer Fit/scoring, no full Opportunity pipeline, no advanced Admin governance, and no heavy Notification Center in MVP.
- Updated `prd.md` with source-backed MVP-level details: original brief workspace provenance, Human Review full Report/version-history context, Meeting Brief readiness tied to Approved linked Reports, final agenda/agenda notes, first-overdue/missed Follow-up accountability, high-risk Reason Code/note completeness, and next-owner routing through Command Center/shared queues.
- Updated `addendum.md` with source-preserved downstream context: recommended 4-week build sequence, original navigation and two-engine mental model, UX grouping/card guidance, Gate Finding resolution subtypes, future Meeting Brief taxonomy, future Offer Fit/Opportunity direction, Admin/Governance checklist, and Notification principles.
- Review of the reconciliation update passed with no critical/high issues. Applied the non-blocking follow-ups by adding explicit P6 stuck/delayed Client handling, aligning the Meeting Brief readiness success metric with the Approved-Report guardrail, and preserving source risk-ranking plus future Admin/Governance taxonomy in the addendum.
