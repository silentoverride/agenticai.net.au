# Decision Log: Staff Portal MVP Product Brief

Source brainstorming artifact: `_bmad-output/brainstorming/brainstorming-session-2026-05-23-120000.md`

## 2026-05-23

### Workflow / Setup

- User requested creation of a BMad-style product/project brief from the completed brainstorming session.
- The local project reports `BMAD is not installed in this project` via `bmad_orchestrator`.
- Required bmad-product-brief activation resolver was not present at `_bmad/scripts/resolve_customization.py`; the brief was therefore created using the provided bmad-product-brief instructions and default template manually, with local artifacts under `_bmad-output/planning-artifacts/briefs/`.

### Product Decisions Captured

- The Staff Portal MVP should be state-model-first, not screen-first.
- Human Review reliability is the top 4-week MVP priority.
- Meeting and opportunity/growth workflows should not be deferred entirely, but should remain simpler than Human Review in MVP.
- The dangerous failure mode is building the appearance of operational control without lifecycle enforcement.
- The MVP should protect four state models: Report, Gate Finding, Follow-up, and Meeting Brief.
- The 4-week build sequence is:
  1. Client Profile + Command Center skeleton
  2. Human Review queue/cockpit + decisions
  3. Follow-ups + audit trail
  4. Simple Meeting Brief + polish/test

### Decisions Included in brief.md

- Executive framing: first make report delivery safe; then make meetings useful; then make upsell systematic.
- Core surfaces: Command Center, Client Profile, Human Review, Follow-ups, Simple Meeting Brief.
- MVP scope boundaries: must-have, should-have, could-have, and out-of-scope items.
- State models and transition enforcement principle.
- Success criteria and 4-week build sequence.

### Details Moved to addendum.md

- Full navigation architecture.
- Report Quality Engine / Client Growth Engine mental model.
- Client Profile Overview structure.
- Human Review Cockpit structure.
- Meeting Brief model.
- Offer Fit model.
- Admin/Governance future direction.
- Notification model.
- Reverse Brainstorming risk list.

### Polish Pass

- Applied structural review recommendations: condensed the brief, moved Core State Models before MVP Scope, merged problem/solution framing, shortened users served, clarified Could Have versus Out of Scope, and removed repeated vision language.
- Applied prose review recommendations: clarified operational risk wording, made terminology consistent around offer-fit, improved parallelism, and corrected “staff own the recommendation.”
