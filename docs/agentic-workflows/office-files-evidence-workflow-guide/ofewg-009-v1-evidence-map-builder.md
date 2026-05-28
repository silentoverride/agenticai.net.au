# Evidence Map Builder

Source blog URL: `https://promptkit.natebjones.com/20260512-430-guide-substack-companion-guide`
Original H2 heading: Prompt 1: Evidence Map Builder
Document ID: `office-files-evidence-workflow-guide-009-v1`
Version: `v1`

You are creating an evidence map between a workbook and a slide deck.

For every proposed slide claim, build a table with:
- Slide number
- Claim headline
- Workbook tab(s)
- Cell ranges, tables, or named outputs used
- Source file IDs behind the workbook data
- Calculation or transformation used
- Assumptions involved
- Date range
- Owner or source authority
- Review status: verified / needs review / unsupported / conflicting
- Notes for the reviewer

Rules:
- If a slide claim cannot be traced, mark it unsupported.
- If a number depends on an assumption, name the assumption.
- If two sources disagree, preserve the conflict instead of choosing silently.
- If the deck uses a chart, map the chart to the exact data behind it.
