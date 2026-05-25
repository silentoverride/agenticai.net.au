# Story 2.4: Command Center Navigation and Recovery

Status: done

## Story

As an operator,
I want each priority item to take me to the correct work surface and back,
So that I can complete decisions while preserving context.

## Requirements Covered

FR4, FR6; NFR4, NFR6; UX-DR34, UX-DR35, UX-DR36

## Acceptance Criteria

1. **Given** a Command Center item has a next safe action, **when** the operator activates it, **then** they navigate to the relevant Report/Human Review workspace; and breadcrumbs, explicit return links, and stable page headings preserve Command Console context without relying on browser history.

2. **Given** filters or local list refinement are implemented, **when** staff filter Command Center work, **then** the UI distinguishes local `Filter this list` behaviour from server `Search records`; and empty results distinguish no records, no matching results, failed load, and permission-limited outcomes.

3. **Given** late or stale responses occur during refresh, **when** the list updates, **then** late older responses do not overwrite newer results; and stale-state warnings prevent unsafe state-changing action until refresh or explicit allowed override.

## Pre-conditions / Prerequisites

Story 2.1 provides the `getCommandCenterItems` read model. Story 2.2 provides the `CommandConsole` and `PriorityWorkItemRow` components. Story 2.3 provides role-based visibility.

Existing workspace routes: `/operator/assessments/[assessmentId]` opens the assessment review workspace with report state, gate findings, and action panels.

## Tasks / Subtasks

- [ ] Add breadcrumb navigation to Command Console page (AC: 1)
  - [ ] Update `src/routes/operator/assessments/+page.svelte` to include a breadcrumb trail: `Staff Portal > Command Console`
  - [ ] Ensure all assessment detail pages (`[assessmentId]/+page.svelte`) have an explicit "Back to Command Console" return link at the top, not relying on browser back
  - [ ] Ensure stable page heading "Command Console" is always present

- [ ] Add stale-state detection to Command Console (AC: 3)
  - [ ] Track last fetch timestamp in the Console
  - [ ] On refresh, compare response timestamps — discard older responses
  - [ ] Show a stale-state warning banner when data may be stale (e.g., last fetched more than 5 minutes ago)
  - [ ] Warning includes "Refresh now" action and explanation: "The work list may have changed since last loaded"

- [ ] Improve empty state handling (AC: 2)
  - [ ] Update CommandConsole empty state to distinguish: "No work items" (server returned empty) vs "No matching items" (filter active, items exist) vs "Failed to load" (error) vs "Permission-limited" (some items hidden)
  - [ ] Add basic local text filter to Command Console: staff can type to filter items by client name
  - [ ] Label local filter as "Filter this list" to distinguish from server search
  - [ ] When local filter is active and no items match, show "No items match your filter" distinct from the server-empty state

- [ ] Write comprehensive tests (AC: 1, 2, 3)
  - [ ] Test breadcrumb rendering in page
  - [ ] Test stale-state warning appears after threshold
  - [ ] Test local filter filters correctly
  - [ ] Test distinct empty states

## Dev Notes

### Navigation pattern

The assessments page already links to `/operator/assessments/[assessmentId]`. The existing workspace pages should show a "Back to Command Console" link. The `PriorityWorkItemRow` already uses `<a href="/operator/assessments/{item.workItemId}">` for the client link.

Breadcrumbs should follow the pattern:
```
Staff Portal > Command Console
```

When viewing a specific assessment:
```
Staff Portal > Command Console > Assessment Review
```

### Stale-state detection

Simple timestamp-based stale detection:
1. Store `lastFetchedAt` as a timestamp
2. Compare against current time on each render (or periodic check)
3. If `Date.now() - lastFetchedAt > 300_000` (5 minutes), show warning
4. On refresh, reset timer

### Local filter vs server search

Add a text input at the top of the Command Console labeled "Filter this list". It filters the client name by substring match client-side. This is explicitly local filtering, not server search.

### What NOT to do

- No browser history-dependent navigation — use explicit links
- No command registry, plugin system, global event bus
- No Tailwind, shadcn, or third-party UI kits
- No stale-state warnings for local draft state (just data freshness)

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

### Completion Notes List

### File List

- `src/lib/components/staff-portal/command-console.svelte` — updated with breadcrumbs, stale warning, local filter, empty states
- `src/routes/operator/assessments/[assessmentId]/+page.svelte` — updated with "Back to Command Console" link
- `tests/staff-portal/components/command-console.test.ts` — new component tests
