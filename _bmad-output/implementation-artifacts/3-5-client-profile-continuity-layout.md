# Story 3.5: Client Profile Continuity Layout

Status: done

## Story

As an operator,
I want the Client Profile layout to preserve context beside action,
So that I can safely move from client state to the right domain panel.

## Requirements Covered

FR11, FR12, FR13, FR14; NFR4, NFR5; UX-DR3, UX-DR34, UX-DR35, UX-DR37

## Acceptance Criteria

1. **Given** the Client Profile is displayed on desktop widths, **when** sections render, **then** "What Matters Now," blockers, follow-ups, Meeting Brief readiness, Commercial Next Step, and recent audit context use a desktop-first two-column or three-region layout where useful; and tablet and mobile layouts preserve State → risk/blocker → context → valid action → receipt/audit proof order.

2. **Given** follow-up, meeting brief, or commercial functionality is not yet implemented or unavailable, **when** the profile renders its continuity sections, **then** it shows a clear empty or unavailable state with safe navigation where applicable; and it does not imply completion or success unless that is true.

## Pre-conditions / Prerequisites

- Story 3.1 provides `getClientProfileSnapshot` read model and DTOs
- Story 3.2 provides `deriveWhatMattersNow` read model and DTOs
- Story 3.3 provides `getLinkedReportContext` and `getLinkedGateFindings` read models and DTOs
- Story 3.4 provides `getClientAuditHistory` and `getClientActivityHistory` read models and DTOs
- Epic 1 provides presentation maps, `StateBadge`, `RiskSignal`, `BlockerPanel` DTO presentation concepts
- Epic 2 provides `CommandConsole` pattern and `PriorityWorkItemRow` component patterns
- Existing Svelte 5 component patterns in `src/lib/components/staff-portal/**`
- Existing repo-owned CSS custom properties and design tokens

## Tasks / Subtasks

- [ ] Create Client Profile page route (AC: 1)
  - [ ] Create `src/routes/operator/assessments/[assessmentId]/+page.server.ts` (if not existing) or extend existing
  - [ ] Compose all read models: snapshot, What Matters Now, linked reports, linked findings, audit history, activity history
  - [ ] Apply auth/role checks using existing operator-auth helpers
  - [ ] Return composed page view model as governed DTO
  - [ ] Handle all error states: loading, missing, stale, degraded, permission-denied

- [ ] Create ClientProfile layout component (AC: 1)
  - [ ] Create `src/lib/components/staff-portal/ClientProfile.svelte`
  - [ ] Implement desktop-first layout with sections for:
    - Client info header (business name, owner, journey stage, risk/value flags)
    - "What Matters Now" panel (priority treatment, blocker, next action)
    - Linked Reports section
    - Linked Gate Findings section
    - Recent Activity / Audit History section
    - Placeholder sections for follow-up, Meeting Brief, Commercial Next Step
  - [ ] Use repo-owned CSS custom properties for spacing, typography, colour tokens
  - [ ] Responsive: two-column/three-region on desktop; stack on tablet; warn on mobile for complex views

- [ ] Create placeholder/empty states for unimplemented domains (AC: 2)
  - [ ] Follow-up section: show "Follow-up tracking coming in Epic 4" or similar clear empty state
  - [ ] Meeting Brief section: show "Meeting Briefs coming in Epic 5"
  - [ ] Commercial Next Step section: show "Commercial tracking coming in Epic 5"
  - [ ] Ensure empty states do not imply completion or success

- [ ] Implement responsive layout and navigation (AC: 1, UX-DR34, UX-DR35, UX-DR37)
  - [ ] Breadcrumbs: Client → Assessment → [profile section]
  - [ ] Explicit return links to Command Console
  - [ ] Stable page headings that preserve context
  - [ ] Navigation: Command Console → Client Profile → linked context → action → return
  - [ ] Desktop: two-column where context sits beside action
  - [ ] Tablet: single column stack preserving UX order
  - [ ] Mobile: warn when screen size not suitable for complex review flows

- [ ] Write comprehensive tests (AC: 1, 2)
  - [ ] Create `tests/staff-portal/routes/client-profile.test.ts` for route/page composition
  - [ ] Create `tests/staff-portal/components/ClientProfile.test.ts` for layout rendering
  - [ ] Test: desktop layout renders all sections in correct order
  - [ ] Test: tablet/mobile layout preserves state-first order
  - [ ] Test: empty/placeholder states for unimplemented domains
  - [ ] Test: breadcrumbs and navigation links
  - [ ] Test: permission-denied state (operator vs admin)
  - [ ] Test: degraded data rendering
  - [ ] Test: stale-state warnings where applicable
  - [ ] Test: DTO shape and lifecycle vocabulary consistency

## Dev Notes

### Architecture Context

The Client Profile page is the composition boundary for Epic 3. It gathers all read models from stories 3.1-3.4 and renders them in a coherent layout.

```
Client Profile Page
├── Client Info Header (name, owner, stage, flags)
├── "What Matters Now" Panel
│   ├── Priority treatment indicator
│   ├── Blocker info (name, type, consequence)
│   ├── Next valid action button
│   └── Owner + due date
├── [Desktop: Two-column or Three-region layout]
│   ├── Column/Region 1: Linked Reports
│   │   ├── Current report(s) with state badges
│   │   ├── Historical report(s)
│   │   └── Navigation to review workspace
│   ├── Column/Region 2: Linked Gate Findings
│   │   ├── Unresolved findings
│   │   ├── Recently resolved findings
│   │   └── Risk/blocker signals
│   └── Column/Region 3: Activity & Audit
│       ├── Recent activity (operational memory)
│       └── Recent audit events (accountability)
├── Placeholder Sections
│   ├── Follow-ups → "Coming in Epic 4"
│   ├── Meeting Briefs → "Coming in Epic 5"
│   └── Commercial Next Step → "Coming in Epic 5"
└── Footer/Breadcrumbs
    ├── Return to Command Console link
    └── Page heading with client name
```

### Section Rendering Rules

- Each section renders from typed DTOs provided by the page server load function
- Sections do not compute workflow legality, action availability, or audit interpretation
- Each section shows a state badge using centralized presentation maps from Epic 1
- Empty/unimplemented sections show clear placeholder state — not "completed" or success
- Loading, error, stale, degraded, and permission-denied states are implemented per section

### Scope Boundary

This story creates the Client Profile page layout composition and route. It does not build follow-up, Meeting Brief, or Commercial Next Step functionality (those are Epics 4 and 5). It does not build the Human Review workspace (Epic 1). It does not build the Command Console (Epic 2).

### Architecture Guardrails

- Components render typed DTOs from server load functions; they do not compute business logic
- UI order preserves: State → risk/blocker → context → valid action → receipt/audit proof [Source: UX-DR3]
- Desktop-first layout; tablet stacks; mobile warns [Source: UX-DR37, UX-DR38]
- Breadcrumbs and explicit return links; no browser history reliance [Source: UX-DR35]
- Navigation preserves: Command Console → Client Profile → linked context → action → return [Source: UX-DR34]
- Repo-owned CSS custom properties; no Tailwind, shadcn, or admin UI kits [Source: architecture.md]
- Empty/unimplemented domains show clear states; do not imply completion [Source: AC 2]
- Non-leaking permission-denied states throughout [Source: UX-DR33]
- Accessible names, keyboard navigation, visible focus, semantic HTML [Source: UX-DR39]

### Implementation Sequence

1. Create `src/routes/operator/assessments/[assessmentId]/+page.server.ts` (composed load function)
2. Create `src/lib/components/staff-portal/ClientProfile.svelte` (main layout)
3. Create section sub-components as needed (WhatMattersNow, LinkedReports, LinkedFindings, ActivityAuditSection, PlaceholderSection)
4. Create placeholder section components for unimplemented domains
5. Implement responsive layout with CSS custom properties
6. Add breadcrumbs and navigation
7. Write tests
8. Run `vitest run tests/staff-portal`
9. Run `npm run check`
