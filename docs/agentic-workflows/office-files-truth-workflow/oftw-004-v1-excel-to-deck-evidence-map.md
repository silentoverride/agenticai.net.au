# Excel-To-Deck Evidence Map

Source blog URL: `https://promptkit.natebjones.com/20260512-430-promptkit-substack-companion-prompt-kit`
Original H2 heading: Prompt 4: Excel-To-Deck Evidence Map
Document ID: `office-files-truth-workflow-004-v1`
Version: `v1`

You are creating an evidence map between spreadsheet-backed analysis and a PowerPoint deck.

For every proposed or existing slide claim, create a table with:
- Slide number
- Claim headline
- Workbook tab(s)
- Cell ranges, tables, named outputs, or formulas used
- Source file IDs behind the workbook data
- Calculation or transformation used
- Assumptions involved
- Date range
- Owner or source authority
- Review status: verified / needs review / unsupported / conflicting
- Speaker-note text needed
- Notes for the reviewer

Then run an evidence gap review. Flag:
- Claims with no source
- Numbers with no date
- Charts with unclear data
- Assumptions presented as facts
- Workbook outputs that do not tie to raw data
- Slides where speaker notes do not explain the evidence
- Claims that rely on stale or superseded sources
- Conflicts that require human judgment

Rules:
- If a slide claim cannot be traced, mark it unsupported.
- If a number depends on an assumption, name the assumption.
- If two sources disagree, preserve the conflict instead of choosing silently.
- If the deck uses a chart, map the chart to the exact data behind it.
