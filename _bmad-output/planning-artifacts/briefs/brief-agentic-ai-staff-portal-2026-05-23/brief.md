---
title: "Staff Portal MVP — State-Model-First Operations Control Surface"
status: draft
created: 2026-05-23
updated: 2026-05-23
source: "_bmad-output/brainstorming/brainstorming-session-2026-05-23-120000.md"
---

# Product Brief: Staff Portal MVP

## Executive Summary

Agentic AI needs a Staff Portal that gives internal staff reliable operational control over client assessments, report review, meeting preparation, and follow-up commitments. The first useful version should not become a full CRM, sales cockpit, or governance suite. Its job is narrower and more important: make report delivery safe, visible, and accountable.

The MVP should be built state-model-first. Staff need to see where a report, gate finding, follow-up, or meeting brief sits in its lifecycle; understand what is blocking progress; take only valid next actions; and leave an audit trail. The 4-week MVP should prioritize Human Review reliability over growth workflows. First make report delivery safe. Then make meetings useful. Then make upsell systematic.

## Problem and Response

Today, staff need to manage multiple risk-prone operational tasks around assessment delivery: finding client records and reports, understanding escalations, deciding whether reports are safe to send, preparing for meetings, and ensuring follow-ups are not lost. If these activities are spread across disconnected screens or represented only as passive dashboard data, staff can miss blockers, approve unsafe reports, or assume a client is ready for a meeting when review is unresolved.

The biggest product risk is scope creep. Building too much too early could create the appearance of operational control without the lifecycle model that actually makes the system safe. That failure would quietly cause other failures: unsafe approvals, stale meeting prep, unreliable follow-ups, and untrustworthy offer guidance.

The portal should expose one operational loop:

```text
See state → understand blocker → take valid action → record decision → move to next state
```

## Core State Models

The MVP should protect four non-negotiable lifecycle models:

```text
Report: Generated → Escalated → In review → Approved / Rejected / Regeneration required / Clarification required
Gate Finding: Open → In review → Resolved / Overridden with reason / Escalated further
Follow-up: Open → Due / Overdue → Completed / Deferred with reason / Reassigned
Meeting Brief: Draft generated → Needs staff review → Ready for meeting → Stale / refresh needed → Completed
```

These states should not be cosmetic labels. They should determine which actions are available and which actions are blocked. For example, a report cannot be approved while unresolved gate findings exist, and a meeting brief cannot be marked ready while report review is unresolved.

## Users Served

- **Internal staff/operator:** needs to know what requires attention today, which clients are blocked, what decisions are required, and what commitments are due.
- **Reviewer/admin:** needs to see what was flagged, inspect the evidence, resolve findings, make a report-level decision, and leave an audit trail.
- **Business owner/admin:** needs confidence that client-facing reports and meeting preparation are not handled through ad hoc judgment or invisible process gaps.
- **Client, indirectly:** receives safer reports, better-prepared meetings, and follow-ups treated as commitments rather than loose notes.

## MVP Scope

### Must Have

- **Command Center:** escalated reports, upcoming meetings, overdue follow-ups, stuck clients.
- **Client Profile Overview:** current state, owner, blocker, next action, recent activity.
- **Human Review:** queue, Gate Findings workspace, reviewer notes, reason codes, and report decisions.
- **Review actions:** approve, reject, regenerate, request clarification, override with reason, escalate further.
- **Audit trail:** review decisions and state changes.
- **Follow-ups:** owner, due date, source, linked client/report/meeting, status.

### Should Have

- Simple Meeting Brief draft.
- Prep checklist.
- Meeting notes.
- Follow-up creation from meeting context.

### Could Have

- Basic offer-fit recommendation: a lightweight, evidence-linked suggestion for staff review, not scoring or automation.
- Opportunity status.
- Sales next action.
- Suggested talk track.

### Explicitly Out of Scope for 4-Week MVP

- Advanced objection handling.
- AI-generated sales talk tracks.
- Offer-fit scoring.
- Revenue probability.
- Full CRM-style pipeline.
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
- A report cannot be delivered unless review reaches a valid approval state.
- Reviewers cannot approve reports while unresolved findings remain.
- Every high-risk decision has a reason code, a reviewer note, and an audit event.
- Every follow-up has an owner, due date, source, linked client context, and visible status.
- Command Center shows the work that needs attention today, not just passive metrics.
- Meeting prep cannot be marked ready if report review is unresolved or the brief is stale.

## MVP-Blocking Open Questions

- Which existing database entities already represent report, gate finding, follow-up, and meeting brief states?
- What exact gate data is available today for escalated reports?
- Where should client-delivery approval gating be enforced?
- How much meeting data is already available from booking/calendar systems?
