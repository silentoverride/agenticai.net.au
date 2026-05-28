# Run The Whole System

Source blog URL: `https://promptkit.natebjones.com/20260428-3x9-guide-main`
Original H2 heading: Prompt 10: Run The Whole System
Document ID: `calendar-hygiene-system-010-v1`
Version: `v1`

Run a full calendar hygiene audit and prevention pass.

Use MCP/connectors first:

- Calendar
- Email
- Slack/messages
- Drive/docs
- Tasks/projects

Use computer use only for connector gaps and UI-only state.

Steps:

1. Restate the philosophy in a way that fits me personally.
2. Establish or infer my operating rules.
3. Audit the last 2 weeks and next 4 weeks.
4. Sweep email/messages/docs/tasks for hidden commitments.
5. Investigate 8-12 weeks of history for recurring failure patterns.
6. Score my calendar hygiene.
7. Tell me where I got myself into trouble.
8. Tell me what we can fix now.
9. Draft exact calendar edits and messages.
10. Build preventative guardrails.
11. Create my stay-honest review loop.
12. Ask for approval before applying anything.

Output:

- Executive summary
- Scorecard
- Evidence table
- Current cleanup plan
- Historical failure pattern read
- Draft changes
- Preventative guardrails
- Review loop
- Approval checklist

Be candid and useful. Do not moralize. Do not bury the lead.
```

## What Good Output Looks Like

```text
Calendar Hygiene Audit

Bottom line:
Your calendar is not overloaded overall. It is fragmented. The biggest issue is that priority work appears in your messages and docs but not in protected calendar blocks.

Scorecard:
- Commitment capture: 2/3
- Focus protection: 1/3
- Context coherence: 1/3
- Meeting quality: 2/3
- Buffer/recovery: 1/3
- Communication alignment: 1/3
- Priority alignment: 2/3

Top problems:
1. No protected drafting block for the guide due Friday.
2. Three related client calls are spread across three days.
3. Wednesday has 4.5 hours of meetings with no break longer than 10 minutes.
4. Two Slack commitments are not on the calendar or task list.

Historical pattern read:
- Optimistic estimator: similar writing projects usually took 2-3 sessions, but the calendar only had one block.
- Prep debtor: external calls repeatedly lacked prep blocks.
- Inbox reactor: email bursts often appeared inside maker blocks and pushed work later.

Recommended fixes:
- Add Wed 9:00-10:30 focus block: Draft guide v1.
- Add Thu 4:30-5:00 follow-up block after client calls.
- Draft reschedule request to move Friday client call into Thursday call block.
- Draft async update for recurring sync with no agenda.
- Create Mon/Wed/Fri 9:00-11:00 protected maker blocks.
- Create email/message triage windows at 11:30, 3:30, and 5:00.

Prevention:
- When a deadline appears, propose workback blocks using past completion patterns.
- When accepting external meetings, propose prep and follow-up blocks.
- When a meeting lands inside maker time, suggest alternate slots before accepting.
- Run a Friday 20-minute review: what slipped, what caused it, and which guardrail needs adjustment.

Awaiting approval:
I have not changed anything.
```

## Opinionated Rules

1. Every priority needs a block, not just a hope.
2. Every meeting that matters needs prep or follow-up time.
3. Every meeting that does not matter needs a reason to survive.
4. Every day needs at least one real transition buffer.
5. Every week needs a capture sweep across email, messages, docs, and secondary calendars.
6. Related cognitive work should cluster where possible.
7. Reactive communication belongs in windows unless the user's job truly requires constant response.
8. Focus blocks should name an output, not a mood. "Draft guide intro" beats "deep work."
9. Recurring meetings should periodically re-earn their slot.
10. Recovery is part of the system, not a reward for finishing the system.

## Implementation Pattern

```text
1. Read calendar events for -84 to +28 days.
2. Separate current audit window (-14 to +28) from history window (-84 to -15).
3. Read email queries:
   - "due", "deadline", "by Friday", "can you", "following up", "schedule", "reschedule"
   - travel confirmations, school/health/vendor notices, meeting invites
4. Read message queries:
   - mentions, DMs, "can you", "will you", "by EOD", "next week", "following up"
5. Read docs and tasks:
   - project plans, meeting agendas, current docs modified in last 30 days
6. Extract commitments:
   - owner, due date, source, expected output, confidence
7. Compare commitments to calendar blocks.
8. Classify calendar events by type and cognitive mode.
9. Detect current failure modes.
10. Detect historical recurrence patterns.
11. Derive guardrails from evidence.
12. Produce scorecard, cleanup plan, and prevention plan.
13. Draft changes.
14. Ask for approval.
15. Apply approved changes via MCP if available. If not, use computer use and stop before final submission when confirmation is required.
