# Speaker Notes Evidence Layer

Source blog URL: `https://promptkit.natebjones.com/20260512-430-guide-substack-companion-guide`
Original H2 heading: Prompt 3: Speaker Notes Evidence Layer
Document ID: `office-files-evidence-workflow-guide-011-v1`
Version: `v1`

Using the evidence map, write speaker notes for each slide.

Each slide's notes must include:
- Claim
- Source IDs
- Calculation or transformation
- Assumptions
- Review status
- Open questions or limitations

Keep notes concise but audit-ready. Do not add unsupported claims.
```

## Safe To Use Checklist

- Every slide claim maps to evidence.
- Every important number has a date and source.
- Charts can be traced back to data.
- Assumptions are visible.
- Reviewer can audit the deck from the evidence map and speaker notes.

---

# Pretty-But-Wrong Detector

Use this after AI creates a workbook or deck. The goal is to catch the kind of mistake that looks fine until someone knowledgeable checks it.

```prompt
Read this deck or workbook as a skeptical reviewer who suspects every claim and every number.

For each slide or sheet, identify:
- Claims without source attribution
- Numbers without a date or source
- Charts whose underlying data is not traceable
- Formulas inconsistent across parallel rows or columns
- Hardcoded outputs where formulas are expected
- Assumptions presented as facts
- Stale or mixed date ranges
- Brand/template drift
- Low-contrast or unreadable charts
- Overcrowded slides
- Broken narrative logic
- Items requiring human judgment

Produce a written list of every issue found. Do not fix anything. Just enumerate.

Rank each issue as:
- Must fix before sharing
- Should fix before important review
- Polish
