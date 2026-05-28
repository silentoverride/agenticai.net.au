# Story 9.4: Evidence Traceability (OFEWG-009)

Status: ready-for-dev

## Story

As a pipeline developer,
I want every claim in the final report to have a traceable source,
So that client questions about "why this recommendation" have auditable answers.

**Requirements sourced from:** OFEWG-009 Evidence Map Builder (`docs/agentic-workflows/office-files-evidence-workflow-guide/ofewg-009-v1-evidence-map-builder.md`)

**Important:** The evidence map system (`evidence-map.ts`) is already built with transcript claim extraction, confidence classification (direct/inferred/speculative), gap detection, and prompt formatting. This story extends it with tool-research source provenance — linking evidence claims to the specific tool research queries and catalog entries that produced them.

## Acceptance Criteria

### AC1: Evidence claim source provenance extension

**Given** the existing EvidenceClaim type in `evidence-map.ts`
**When** tool research results are available for an assessment
**Then** evidence claims can optionally reference their tool research source:
  - `tool_source_type`: 'futurepedia' | 'taaft' | 'perplexity' | null
  - `tool_source_name`: the specific tool/catalog entry name, or null
  - `tool_source_url`: the source URL, or null
**And** claims that originate from tool research are tagged distinctly from transcript-only claims

### AC2: Traceability matrix builder

**Given** an evidence map and tool research results
**When** `buildTraceabilityMatrix()` is called
**Then** a traceability matrix is produced that maps:
  - Every report claim → evidence source (transcript quote or tool research entry)
  - Source type (direct statement, research result, LLM inference)
  - Confidence level
  - Whether the claim is independently verifiable via the source
**And** claims with no evidence source are flagged as "LLM inference only"

### AC3: Pipeline integration

**Given** the traceability matrix is built
**When** the pipeline runs
**Then** the matrix is:
  - Logged alongside the evidence map extraction stage
  - Included in the formatted evidence map passed to the LLM analysis prompt
  - Saved as part of the assessment artifacts

### AC4: Tests

**Given** the traceability extensions
**When** tests run
**Then** unit tests verify:
  - EvidenceClaim with tool source fields is backward compatible
  - buildTraceabilityMatrix() correctly classifies claims by source
  - Claims without any source are flagged as "LLM inference only"
  - Evidence map formatting includes tool source provenance

## Tasks / Subtasks

- [ ] Task 1: Extend EvidenceClaim with tool source fields (AC: 1)
  - [ ] Add `tool_source_type`, `tool_source_name`, `tool_source_url` optional fields to EvidenceClaim
  - [ ] Fields are optional (null) — backward compatible with existing evidence extraction

- [ ] Task 2: Build traceability matrix (AC: 2)
  - [ ] Add `buildTraceabilityMatrix(evidenceMap, tools)` function in evidence-map.ts
  - [ ] For each claim: classify source (transcript, tool_research, inference)
  - [ ] Flag claims with no evidence source

- [ ] Task 3: Integrate traceability matrix into evidence map formatting (AC: 3)
  - [ ] Enhance `formatEvidenceMapForPrompt()` to include tool research provenance
  - [ ] Include traceability summary in the evidence map section

- [ ] Task 4: Add tests (AC: 4)
  - [ ] EvidenceClaim backward compatibility (optional tool fields)
  - [ ] buildTraceabilityMatrix classification
  - [ ] Unsourced claim flagging

## Dev Notes

### Existing Infrastructure

The evidence map system (`evidence-map.ts`, 288 lines) is mature:
- `EvidenceClaim`: id, claim, type, confidence, transcript_evidence, performed_by, hours_per_week, estimated_annual_cost_aud
- `EvidenceGap`: field, gate_impact, recommended_handling
- `EvidenceMap`: claims, coverage stats, gaps, extracted_at
- `extractEvidenceMap()`: Perplexity LLM call to extract structured claims from transcript
- `formatEvidenceMapForPrompt()`: Formats evidence map for inclusion in analysis prompt
- `emptyEvidenceMap()`: Fallback for extraction failures

Tool research types from `tool-lookup.ts`:
- `AITool`: name, url, description, pricing, category, source ('futurepedia'|'taaft'|'perplexity'), setup_complexity, etc.

### OFEWG-009 Adaptation

| OFEWG-009 Step | Office Files Workflow | Pipeline Adaptation |
|---|---|---|
| Every slide claim → workbook tab/cell | claim → transcript quote | Already done (transcript_evidence) |
| Source file IDs behind data | Which tool catalog entry | Add: tool_source_name, tool_source_url |
| Calculation/transformation used | How claim was derived | Add: confidence (direct/inferred/speculative) |
| Assumptions involved | Named assumptions | Already done (EvidenceGap) |
| Date range | Timestamp of extraction | Already done (extracted_at) |
| Owner/source authority | Who said it / which catalog | Add: tool_source_type → performed_by for tool claims |
| Review status | verified/needs review/unsupported/conflicting | Already done via confidence + gap flags |

### Implementation Plan

1. Add optional tool source fields to EvidenceClaim — backward compatible, no migration needed
2. Build `buildTraceabilityMatrix()` — pure function, maps claims to sources with classification
3. Enhance `formatEvidenceMapForPrompt()` to surface tool research provenance
4. Add unit tests

### File List

Files to MODIFY:
- `src/lib/server/assessment/evidence-map.ts` — extend EvidenceClaim, add buildTraceabilityMatrix(), enhance formatting

Files to CREATE:
- `tests/assessment/evidence-traceability.test.ts` — traceability matrix tests

### Architecture Compliance

- No new external dependencies
- Backward compatible — optional fields on EvidenceClaim
- No changes to extractEvidenceMap() — the Perplexity call remains unchanged
- Deterministic traceability matrix builder — no LLM calls
- Pure function design — testable without external services

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
