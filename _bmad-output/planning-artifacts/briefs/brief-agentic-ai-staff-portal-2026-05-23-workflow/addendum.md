---
title: "Staff Portal MVP Brief Addendum"
status: draft
created: 2026-05-23
updated: 2026-05-23
source: "_bmad-output/brainstorming/brainstorming-session-2026-05-23-120000.md"
---

# Addendum: Staff Portal MVP Details

This addendum preserves detail from the brainstorming session that is useful for PRD, architecture, or implementation planning but too detailed for the product brief.

## Navigation Architecture

```text
Staff Portal
├── Command Center
├── Clients
├── Human Review
├── Meetings
├── Opportunities
├── Admin
├── Audit
└── Notification Center
```

## Product Mental Model

```text
Report Quality Engine
├── Human Review
├── Gate Findings
├── Report Approval
└── Audit

Client Growth Engine
├── Meetings
├── Opportunities
├── Offer Fit
├── Follow-ups
└── Client Success Notes
```

Meetings and Opportunities remain separate top-level navigation areas because staff will enter with different intents. Conceptually, they sit under the Client Growth Engine.

## Command Center

The Command Center should be an action dashboard, not a passive reporting dashboard. Every item should answer:

- What is this?
- Why does it matter?
- Who owns it?
- What happens if ignored?
- What is the next action?

Recommended structure:

```text
Command Center
├── Today’s Priority Work
├── Quality Queue
└── Growth Queue
```

## Client Profile Overview

The Client Profile is the connective tissue across quality, meeting, opportunity, follow-up, and audit workflows.

```text
Client Profile
├── Journey Status
├── Intake / Report
├── Human Review
├── Meeting Brief
├── Opportunity
├── Follow-ups
└── Activity / Audit
```

The Overview should act as an action-oriented briefing page, not a neutral summary.

```text
Overview
├── Top: Client Snapshot
│   ├── Business name
│   ├── Journey stage
│   ├── Owner
│   ├── Report status
│   ├── Meeting status
│   ├── Opportunity status
│   └── Risk / value flags
├── Primary Card: What Matters Now
│   ├── Main blocker
│   ├── Next action
│   ├── Owner
│   ├── Due date
│   └── Consequence if ignored
├── Quality Card
├── Growth Card
├── Follow-up Card
└── Recent Activity
```

Principle: The Overview should orient staff toward the next responsible action.

## Human Review Cockpit

Core job: help a reviewer make a safe, auditable decision about an escalated report.

```text
Human Review Cockpit
├── Gate Findings Queue
│   ├── Finding 1
│   ├── Finding 2
│   ├── Finding 3
│   └── Resolved / unresolved status
├── Finding Workspace
│   ├── Flagged report section
│   ├── Related intake evidence
│   ├── Gate explanation
│   ├── Confidence / severity
│   ├── Suggested inspection steps
│   ├── Reviewer notes
│   └── Finding-level decision
└── Whole Report Context
    ├── Full report navigation
    ├── Original / edited / regenerated versions
    ├── Overall approval checklist
    └── Final report-level decision
```

Important distinction: findings are reviewed individually; the report is approved as a whole.

Review flow:

```text
1. Open escalated report
2. See all gate findings
3. Resolve each finding
4. Complete overall checklist
5. Make final report decision
6. Audit decision + notify next owner
```

Gate Finding lifecycle:

```text
Gate Finding
├── Open
├── In review
├── Resolved — no change needed
├── Resolved — edited report
├── Resolved — regenerated section/report
├── Resolved — client clarification requested
├── Escalated further
└── Dismissed with override reason
```

Principle: A reviewer should never have to hunt through the report to discover why they are reviewing it.

## Follow-ups

Follow-ups are a cross-cutting work type, not a note type and not owned by Meetings or Opportunities.

```text
Follow-up source
├── Meeting promise
├── Sales/opportunity next action
├── Report review clarification
├── Client support issue
├── Admin/internal task
└── Delayed/stuck journey state
```

Placement model:

```text
Follow-ups
├── Surfaced in Command Center as due work
├── Shown in Client Profile as client-specific commitments
├── Linked from Meetings when created during/after a meeting
├── Linked from Opportunities when tied to sales pipeline
├── Linked to Human Review when clarification is needed
└── Captured in Activity/Audit when completed, missed, reassigned, or changed
```

Required fields:

- Owner
- Due date
- Source
- Client-visible promise flag
- Status
- Linked client/report/meeting/opportunity context
- Activity/audit trail

## Meeting Brief Model

Core job: help staff walk into the client meeting prepared, specific, commercially useful, and trustworthy.

The Meeting Brief should be automatically generated and staff-approved.

```text
Meeting Brief
├── AI-generated draft
├── Staff review / edit
├── Prep checklist
├── Mark prep complete
└── Locked meeting-ready version
```

AI-generated sections:

```text
AI-generated sections
├── Client situation snapshot
├── What matters now
├── Report talking points
├── Likely questions / objections
├── Suggested agenda
├── Offer fit suggestion
└── Prep checklist draft
```

Staff-approved sections:

```text
Staff-approved sections
├── Meeting objective
├── Top 3 talking points
├── Sensitive issues / avoid-saying guidance
├── Offer to discuss
├── Follow-up intention
├── Final agenda
└── Prep complete
```

Meeting Brief lifecycle:

```text
Meeting Brief Status
├── Not generated
├── Draft generated
├── Needs staff review
├── Ready for meeting
├── Meeting completed
├── Notes captured
└── Follow-ups created
```

Freshness states:

```text
Brief freshness
├── Current
├── Report changed since brief generated
├── Intake updated since brief generated
├── Opportunity changed since brief generated
├── Human review unresolved
└── Regenerate / refresh needed
```

Principle: The AI can prepare the brief, but staff own the meeting.

## Offer Fit and Opportunity Model

Offer Fit should be rule-grounded, AI-assisted, and staff-approved.

```text
Offer Fit Engine
├── Admin-defined offer catalogue
├── Admin-defined fit rules / guardrails
├── AI-assisted interpretation of client evidence
├── Evidence-linked recommendation
├── Staff approval / adjustment
└── Audit trail for commercial decisions
```

Rules decide:

```text
Rules decide
├── Which offers exist
├── Which offers are allowed
├── Which offers are blocked
├── Which risk signals require no-sell / nurture
├── Which evidence is required before pitching
├── Which offers require senior approval
└── Which claims staff must not make
```

AI assists with:

```text
AI assists with
├── Matching client pain to offer types
├── Summarising fit evidence
├── Detecting readiness signals
├── Detecting slow-down signals
├── Drafting talk tracks
├── Suggesting next questions
└── Explaining “why this, why now”
```

Staff approves:

```text
Staff approves
├── Recommended offer
├── Whether to pitch now
├── Talk track wording
├── Pipeline stage
├── Estimated value
├── Next action
└── Follow-up commitment
```

Important split:

```text
Offer Fit answers:
What is the right next commercial action for this client?

Opportunity answers:
What are we actively trying to sell, to whom, by when, for how much?
```

Flow:

```text
Assessment/report → Offer Fit → Staff approval → Meeting discussion → Opportunity created/updated → Follow-up
```

## Admin / Governance Future Direction

Admin should be an operations control surface, not a passive settings area.

```text
Admin
├── Operational Rules
│   ├── Gate Rules
│   ├── Review Workflows
│   ├── Offer Fit Rules
│   ├── Follow-up Policies
│   └── Communication Templates
├── Business Configuration
│   ├── Offer Catalogue
│   ├── Meeting Brief Templates
│   ├── Roles & Permissions
│   └── Integrations
└── Governance
    ├── Pending changes
    ├── Approvals
    ├── Version history
    ├── Audit / retention
    ├── Rule impact preview
    └── Rollback
```

Every admin rule change should answer:

- What is changing?
- Why is it changing?
- Who approved it?
- What clients, reports, or workflows could be affected?
- Can we preview the impact before publishing?
- Can we roll it back?

Principle: Admin is not where rules are stored. Admin is where operational policy is safely changed.

## Activity, Audit, and Notifications

Activity records memory. Audit records accountability. Notifications route attention.

Use contextual alerts first, plus a lightweight unified notification center.

```text
Notifications
├── Contextual alerts
│   ├── Command Center priority items
│   ├── Client Profile banners / chips
│   ├── Human Review queue warnings
│   ├── Meeting prep warnings
│   ├── Opportunity next-action warnings
│   └── Admin approval warnings
└── Notification Center
    ├── My notifications
    ├── Mentions / assignments
    ├── Overdue items
    ├── System/integration issues
    └── Dismissed / resolved history
```

Key distinction:

```text
Command Center = work queue
Notification Center = attention history / personal catch-up
Audit = formal accountability record
Activity Timeline = client/module memory
```

Principle: Do not make staff manage notifications. Use notifications to move staff to the right work.

## Reverse Brainstorming Risks

Top risk ranking:

```text
1. Scope creep killing the MVP
2. Unsafe report approval
3. Follow-ups being missed
4. Stale meeting prep
```

Core risk: building the appearance of operational control without the underlying lifecycle/state model.

Failure modes to guard against:

- Staff see polished screens and assume the system is safer than it really is.
- “Approved” means different things in different places.
- Staff can bypass the intended workflow because the system does not enforce state transitions.
- Follow-ups are created but not tied to a source.
- Meeting prep looks ready even though the report is not approved.

## Deferred Detail for PRD / Architecture

- Exact status-transition definitions and invalid transition rules.
- Database entities and fields required for report, gate finding, follow-up, and meeting brief states.
- Audit event taxonomy and retention expectations.
- Permissions for approval, overrides, reassignment, and admin rule changes.
- Calendar/booking integration scope for meeting data.
- Offer catalogue, offer-fit rules, and no-sell/nurture guardrails.
