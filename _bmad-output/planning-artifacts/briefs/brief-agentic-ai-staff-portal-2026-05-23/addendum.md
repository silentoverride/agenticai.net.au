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

## Mental Model

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

## Client Profile Overview

The Client Profile should act as the client-specific equivalent of Command Center.

```text
Overview
├── Top: Client Snapshot
├── Primary Card: What Matters Now
├── Quality Card
├── Growth Card
├── Follow-up Card
└── Recent Activity
```

Principle: The Overview should not merely describe the client. It should orient staff toward the next responsible action.

## Human Review Cockpit

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

## Meeting Brief Model

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

Principle: The AI can prepare the brief, but staff own the meeting.

## Offer Fit Model

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

Important split:

```text
Offer Fit answers:
What is the right next commercial action for this client?

Opportunity answers:
What are we actively trying to sell, to whom, by when, for how much?
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

Principle: Admin is not where rules are stored. Admin is where operational policy is safely changed.

## Notification Model

Use contextual alerts first, plus a lightweight unified notification center.

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

Additional failure modes:

- Staff see polished screens and assume the system is safer than it really is.
- “Approved” means different things in different places.
- Staff can bypass the intended workflow because the system does not enforce state transitions.
- Follow-ups are created but not tied to a source.
- Meeting prep looks ready even though the report is not approved.
