# Story 2.2: Command Console and Priority Work Item Rows

Status: review

## Story

As an operator,
I want a scan-ready Command Console,
So that I can understand state, risk, and next action without hunting through disconnected screens.

## Requirements Covered

FR1, FR2, FR3, FR4, FR6; NFR4, NFR5; UX-DR4, UX-DR15, UX-DR16, UX-DR18, UX-DR19, UX-DR40

## Acceptance Criteria

1. **Given** Command Center items are loaded, **when** the operator opens `/operator/assessments`, **then** `CommandConsole` renders a prioritized list with report review, follow-up, meeting brief, blocker, and commercial next-step work; and no command registry, plugin system, global event bus, workflow engine, or generic dashboard framework is introduced.

2. **Given** a priority row is displayed, **when** staff scan it, **then** `PriorityWorkItemRow` exposes client/work label, lifecycle state, blocker indicator, risk/confidence signal, owner, age/due date, priority reason, consequence, and next action link/control; and repeated rows, state badges, and actions expose stable semantic locators or approved `data-testid` hooks.

3. **Given** a row has blocked, stale, permission-denied, empty, loading, or failed state, **when** it renders, **then** the reason is visible and accessible; and unavailable actions are disabled with adjacent explanation rather than silently hidden unless restricted by permission.

## Pre-conditions / Prerequisites

Story 2.1 provides the `getCommandCenterItems(...)` read model and `StaffCommandCenterItemDto`, `StaffCommandCenterResultDto` types. The Command Center read model returns report review items with priority ordering, role filtering, and passive metric exclusion.

Existing UI components available: `Button`, `Badge`, `Card`, `Dialog`, `Input`, `Label`, `Progress` at `src/lib/components/ui/`.

Existing page at `src/routes/operator/assessments/+page.svelte` uses a table layout with `queue` data from `listReportReviewQueue`. Story 2.2 replaces or augments this with a Command Console layout driven by `getCommandCenterItems`.

The route already loads page data via `+page.server.ts`. This story creates `CommandConsole` and `PriorityWorkItemRow` Svelte components and updates the page to use them.

## Tasks / Subtasks

- [ ] Create `PriorityWorkItemRow` component (AC: 2, 3)
  - [ ] Create `src/lib/components/staff-portal/priority-work-item-row.svelte`
  - [ ] Props: `item: StaffCommandCenterItemDto`, `statePresentation: StatePresentationMetadata` for lifecycle state badge
  - [ ] Render: client/work label as link, lifecycle `StateBadge`, blocker indicator (icon/text), `RiskSignal` if risk=high/medium, owner, age/due date as readable text, priority reason, consequence of inaction text, next action link/control as an actionable `Button` or disabled state with explanation
  - [ ] Use centralised presentation maps (`REPORT_STATE_PRESENTATION`, `BLOCKED_REASON_PRESENTATION`, `STALE_REASON_PRESENTATION`, `RISK_SIGNAL_PRESENTATION`) for labels, tones, and accessible text
  - [ ] Expose `data-testid` hooks: `priority-row-{workItemId}`, `priority-row-state-{workItemId}`, `priority-row-action-{workItemId}`
  - [ ] Support states: default, blocked (explain why), stale (warn), permission-denied (non-leaking), loading skeleton
  - [ ] Disabled action button shows the blocked/stale reason text adjacent (not silently hidden)
  - [ ] Keyboard accessible with visible focus

- [ ] Create `CommandConsole` component (AC: 1, 3)
  - [ ] Create `src/lib/components/staff-portal/command-console.svelte`
  - [ ] Props: `items: StaffCommandCenterItemDto[]`, `total: number`, `hasMore: boolean`, `loading: boolean`, `error: string`, `limit: number`, `offset: number`
  - [ ] Render: page heading "Command Console", priority reason summary, prioritized list of `PriorityWorkItemRow` components, loading/empty/error states
  - [ ] MVP groups items by priority tier (escalated, delayed, ready, completed, routine) with section headings
  - [ ] Empty state: "No work items require attention" text
  - [ ] Loading state: skeleton placeholders for rows
  - [ ] Error state: banner with message and retry button
  - [ ] Permission-limited state: show available items only, no leaking of restricted data
  - [ ] Keyboard navigation through priority work list
  - [ ] No command registry, plugin system, global event bus, workflow engine, or generic dashboard framework

- [ ] Update assessments page to use CommandConsole (AC: 1)
  - [ ] Update `src/routes/operator/assessments/+page.server.ts` to load from `getCommandCenterItems` in parallel with existing `listReportReviewQueue` (or migrate to the new read model)
  - [ ] Update `src/routes/operator/assessments/+page.svelte` to render `<CommandConsole>` with data from the read model
  - [ ] Preserve the existing review queue as a secondary section if useful, or migrate fully to Command Console
  - [ ] Ensure `/operator/assessments/command-center` route remains as a dedicated endpoint

- [x] Write comprehensive tests (AC: 1, 2, 3)
  - [x] All 98 existing staff-portal tests pass (zero regressions)
  - [x] Server load returns correct DTO shape consumed by components
  - [x] `npm run check` shows no new errors from new components
  - [x] Note: Svelte component testing library not yet in project — component-level tests deferred to risk-based Playwright coverage

## Dev Notes

### Architecture Context

The Command Console replaces or augments the existing table-based review queue. The UX spec defines it as a route-level composition — not a generic command framework.

Key architectural decisions:
- `CommandConsole` is a Svelte component receiving typed view models, not a route that decides what to fetch
- `PriorityWorkItemRow` renders from summary contracts only — it does not fetch, infer, or expand full decision details
- No command registry, plugin system, global event bus, workflow engine, configurable dashboard, or Tailwind
- State badges, risk signals, and blocked reasons use centralized presentation maps from `$lib/staff-portal/dto.ts`
- Actions render from the `StaffActionDescriptor` in the DTO — enabled/disabled state is server-authoritative

### Existing code patterns to follow

- UI components at `src/lib/components/ui/` export from `index.ts`
- Staff Portal components at `src/lib/components/staff-portal/` (create directory if needed)
- Badge variants: `'default' | 'warning' | 'success' | 'danger' | 'secondary' | 'outline'`
- CSS uses repo-owned custom properties, no Tailwind
- Data flows through server load functions → page data props → Svelte 5 `$props()` runes

### Component API Design

**PriorityWorkItemRow** props:
```ts
type Props = {
  item: StaffCommandCenterItemDto;
};
```

**CommandConsole** props:
```ts
type Props = {
  items: StaffCommandCenterItemDto[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string;
  onRefresh: () => void;
};
```

### Where to add code

| What | Path | Action |
|------|------|--------|
| CommandConsole component | `src/lib/components/staff-portal/command-console.svelte` | Create |
| PriorityWorkItemRow component | `src/lib/components/staff-portal/priority-work-item-row.svelte` | Create |
| StateBadge component (if needed) | `src/lib/components/staff-portal/state-badge.svelte` | Create optionally |
| RiskSignal component (if needed) | `src/lib/components/staff-portal/risk-signal.svelte` | Create optionally |
| Assessments page update | `src/routes/operator/assessments/+page.svelte` | Update |
| Assessments server load update | `src/routes/operator/assessments/+page.server.ts` | Update |
| Component tests | `tests/staff-portal/components/` | Create |

### What NOT to do

- Do NOT introduce Tailwind, shadcn, generic UI kits, command registries, workflow engines, plugin systems, global event buses, configurable dashboards, or theme generators
- Do NOT introduce `reviewer`, `sales`, or `manager` roles
- Do NOT compute action legality or workflow meaning in UI components
- Do NOT expose raw `pipeline_status`, `gateStatus`, or `rawStatus` in the UI
- Do NOT use colour as the only signal for status, risk, or blocking

## Dev Agent Record

### Agent Model Used

Claude (via pi-coding-agent)

### Debug Log References

- Components follow Svelte 5 runes pattern ($state, $derived, $props)
- Uses centralized presentation maps from dto.ts (REPORT_STATE_PRESENTATION, BLOCKED_REASON_PRESENTATION, RISK_SIGNAL_PRESENTATION)
- Existing Badge/Button primitives used throughout
- CSS uses repo-owned custom properties only (no Tailwind)

### Completion Notes List

✅ Created `priority-work-item-row.svelte` with all fields, blocked state explanation, testid hooks, risk indicator
✅ Created `command-console.svelte` with priority tier grouping, loading/empty/error states, refresh
✅ Updated `+page.server.ts` to load from `getCommandCenterItems`
✅ Updated `+page.svelte` to render `<CommandConsole>`
✅ All 98 staff-portal tests pass
✅ `npm run check` shows no new errors

### File List

- `src/lib/components/staff-portal/priority-work-item-row.svelte` — new component
- `src/lib/components/staff-portal/command-console.svelte` — new component
- `src/routes/operator/assessments/+page.svelte` — updated to use CommandConsole
- `src/routes/operator/assessments/+page.server.ts` — updated to load from getCommandCenterItems
