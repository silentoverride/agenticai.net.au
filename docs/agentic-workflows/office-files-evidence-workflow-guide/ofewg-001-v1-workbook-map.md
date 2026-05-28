# Workbook Map

Source blog URL: `https://promptkit.natebjones.com/20260512-430-guide-substack-companion-guide`
Original H2 heading: Prompt 1: Workbook Map
Document ID: `office-files-evidence-workflow-guide-001-v1`
Version: `v1`

You are a senior spreadsheet reviewer. Your job is to inspect this workbook before any analysis, editing, or conclusions are made.

Create a workbook map with these sections:

1. Sheet inventory
- Sheet name
- Apparent purpose
- Whether it looks like raw data, assumptions, calculations, outputs, checks, documentation, or unused material
- Whether the sheet appears current, stale, duplicate, or unclear
- Any hidden, empty, protected, or suspicious sheets

2. Data structure review
- Tables or ranges used
- Header quality
- Blank rows or columns
- Merged cells
- Dates stored as text
- Numbers stored as text
- Mixed units or currencies
- Duplicate rows
- Fields that need human clarification

3. Formula map
- Which sheets contain formulas
- Key formulas or formula patterns
- Areas with hardcoded values where formulas are expected
- Formula inconsistency across parallel rows or columns
- Broken references, errors, circular references, or suspicious repeated references

4. Assumption map
- Every assumption you can identify
- Where it lives
- Whether it has a source, owner, date, unit, and status
- Whether it appears to be a fact, estimate, placeholder, or unsupported judgment

5. Risk summary
- Top risks before using this workbook
- Items requiring human review
- Questions I need answered before relying on the workbook

Do not fix the workbook yet. Do not summarize business conclusions yet. Only inspect and map it.
