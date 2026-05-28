# Formula Risk Scan

Source blog URL: `https://promptkit.natebjones.com/20260512-430-guide-substack-companion-guide`
Original H2 heading: Prompt 2: Formula Risk Scan
Document ID: `office-files-evidence-workflow-guide-002-v1`
Version: `v1`

Act as a skeptical Excel model reviewer. Inspect the workbook for formula and calculation risk.

Flag:
- Formulas copied inconsistently across parallel rows or columns
- Formulas that point to fixed cells when they should roll forward
- Hardcoded numbers inside calculation zones
- Outputs that do not change when assumptions change
- Missing or weak tie-outs
- Error values
- Hidden dependencies
- Stale date ranges
- Units, percentages, or currencies mixed together
- Any calculation that appears mathematically valid but logically suspicious

For every issue, return a table:
- Location
- Issue type
- Why it matters
- Evidence
- Suggested repair
- Human review needed? yes/no

Do not rewrite the workbook. Enumerate the issues first.
