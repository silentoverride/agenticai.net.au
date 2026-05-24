---
title: "Staff Portal MVP — State-Model-First Operations Control Surface"
status: draft
created: 2026-05-23
updated: 2026-05-23
source: "_bmad-output/brainstorming/brainstorming-session-2026-05-23-120000.md"
prior_context:
  - "_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23/brief.md"
  - "_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23/addendum.md"
  - "_bmad-output/planning-artifacts/briefs/brief-agentic-ai-staff-portal-2026-05-23/decision-log.md"
---

# Product Brief: Staff Portal MVP

## Executive Summary

Agentic AI needs a Staff Portal that gives internal staff reliable operational control over client assessments, report review, meeting preparation, and follow-up commitments. The first useful version should not try to become a CRM, sales cockpit, or full governance suite. Its job is narrower and more important: make report delivery safe, visible, and accountable.

The MVP should be built state-model-first. Staff need to see where each report, gate finding, follow-up, and meeting brief sits in its lifecycle; understand what is blocking progress; take only valid next actions; and leave an audit trail. The 4-week MVP should prioritise Human Review reliability over growth automation. First make report delivery safe. Then make meetings useful. Then make upsell systematic.

## Problem

The current operating need spans several risk-prone moments: finding the right client record, understanding whether a report is blocked or escalated, deciding whether it is safe to send, preparing for the client meeting, and ensuring follow-ups are not lost. If those moments are spread across disconnected screens or represented only as passive dashboard data, staff can miss blockers, approve unsafe reports, or treat meeting prep as ready when the underlying report is unresolved.

The largest product risk is scope creep. Building too much too early could create the appearance of operational control without the lifecycle enforcement that actually makes the system safe. That failure would quietly cause the other failures: unsafe approvals, stale meeting prep, unreliable follow-ups, and untrustworthy offer guidance.

## Product Intent

The Staff Portal should expose one operating loop:

```text
See state → understand blocker → take valid action → record decision → move to next state
```

That loop should apply across the first four lifecycle objects:

```text
Report: Generated → Escalated → In review → Approved / Rejected / Regeneration required / Clarification required
Gate Finding: Open → In review → Resolved / Overridden with reason / Escalated further
Follow-up: Open → Due / Overdue → Completed / Deferred with reason / Reassigned
Meeting Brief: Draft generated → Needs staff review → Ready for meeting → Stale / refresh needed → Completed
```

These states must control available actions, not merely label records. For example, a report cannot be approved while unresolved gate findings remain, and a meeting brief cannot be marked ready while report review is unresolved or source data has changed.

## Who This Serves

- **Internal staff/operator:** needs to know what requires attention today, which clients are blocked, and what action is responsible next.
- **Reviewer/admin:** needs to inspect flagged findings, resolve them safely, make a report-level decision, and leave an audit trail.
- **Business owner/admin:** needs confidence that client-facing reports and meeting preparation are not governed by invisible process gaps.
- **Client, indirectly:** receives safer reports, better-prepared meetings, and follow-ups treated as commitments rather than loose notes.

## MVP Scope

### Must Have

- **Command Center:** escalated reports, upcoming meetings, overdue follow-ups, and stuck clients.
- **Client Profile Overview:** current state, owner, blocker, next action, and recent activity.
- **Human Review:** review queue, Gate Findings workspace, reviewer notes, reason codes, and final report decisions.
- **Review actions:** approve, reject, regenerate, request clarification, override with reason, or escalate further.
- **Audit trail:** review decisions, state changes, reason codes, and ownership changes.
- **Follow-ups:** owner, due date, source, linked client/report/meeting context, status, and consequence.

### Should Have

- Simple Meeting Brief draft.
- Prep checklist.
- Meeting notes.
- Follow-up creation from meeting context.

### Could Have

- Basic evidence-linked offer-fit suggestion for staff review.
- Opportunity status.
- Sales next action.
- Suggested talk track.

### Explicitly Out of Scope for the 4-Week MVP

- Advanced objection handling.
- AI-generated sales talk tracks as a core workflow.
- Offer-fit scoring.
- Revenue probability.
- Full CRM-style pipeline management.
- Rule simulation, rollback, and advanced admin governance.
- Heavy unified notification inbox.

## 4-Week Build Sequence

```text
Week 1: Client Profile + Command Center skeleton
Week 2: Human Review queue/cockpit + decisions
Week 3: Follow-ups + audit trail
Week 4: Simple Meeting Brief + polish/test
```

## Operating Principles

- Findings are reviewed individually; the report is approved as a whole.
- A follow-up is not a note; it is a commitment with owner, due date, source, status, and consequence.
- Meeting prep should be AI-assisted, but client-facing judgment remains human-owned.
- Rules create commercial guardrails; AI explains client fit; staff own the recommendation.
- Do not ship a beautiful dashboard over ambiguous states.

## Success Criteria

The MVP is working if:

- Staff can find every escalated report and see why it was escalated.
- A report cannot be delivered unless review reaches a valid approved state.
- Reviewers cannot approve reports while unresolved findings remain.
- Every high-risk decision has a reason code, reviewer note, and audit event.
- Every follow-up has an owner, due date, source, linked client context, and visible status.
- Command Center shows the work that needs attention today, not passive metrics.
- Meeting prep cannot be marked ready if report review is unresolved or the brief is stale.

## MVP-Blocking Open Questions

- Which existing database entities already represent report, gate finding, follow-up, and meeting brief states?
- What exact gate data is available today for escalated reports?
- Where should client-delivery approval gating be enforced?
- How much meeting data is already available from booking or calendar systems?
