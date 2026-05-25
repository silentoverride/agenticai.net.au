# Deferred Work Items

## Deferred from: code review of story 1-4-gate-finding-decision-actions (2026-05-24)

- `recordNotes` action missing from action ID enum — pre-existing gap from Story 1.2 DTO schema
- Linked report context not rendered in card — mitigated by section context on workspace page
- Unmounted component async setState risk — pre-existing pattern shared by all async components
- No AbortController for in-flight requests — pre-existing pattern, not introduced here
- No stale-state error pathway test coverage — enhancement
- `onStateChange` not provided by parent — handled with fallback success message
- Mutable state update without clone — Svelte 5 reactivity covers this correctly
- Confidence bar color variation by level — enhancement
- `find()` silent no-op — defensive behavior, not a bug
- Risk uses DTO label directly — passes AC 1's visible text requirement
