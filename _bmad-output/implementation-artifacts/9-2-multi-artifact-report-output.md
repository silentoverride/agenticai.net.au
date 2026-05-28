# Story 9.2: Multi-Artifact Report Output (HCMW-002)

Status: review

## Story

As a pipeline developer,
I want the report generation phase to produce a complete artifact set,
So that assessment deliverables are consistent across executive summary, detailed findings, tool matrix, and roadmap.

**Requirements sourced from:** HCMW-002 Multi-Artifact Work Package (`docs/agentic-workflows/high-capability-model-workflows/hcmw-002-v1-the-multi-artifact-work-package.md`)

**Pipeline context (from `docs/assessment-pipeline-workflow-integration-report.md` §4):**
> HCMW-002 (Multi-Artifact Work Package) would extend report output beyond a single JSON blob. Instead of one monolithic report, the pipeline would produce: an executive summary (1-pager for quick decisions), detailed findings (full analysis for deep dives), a tool recommendation matrix (tabular, for procurement), and a phased implementation roadmap (actionable timeline). Cross-artifact consistency checks flag contradictions before delivery.

## Acceptance Criteria

### AC1: Multi-artifact output from single LLM generation

**Given** the structure-first approach from Story 9.1 is in place (2-phase generation: structural plan → full report)
**When** HCMW-002 is applied to report generation (adapting the multi-artifact work package methodology from `docs/agentic-workflows/high-capability-model-workflows/hcmw-002-v1-the-multi-artifact-work-package.md`)
**Then** the pipeline produces four distinct, independently usable artifacts extracted from the LLM analysis:
  - **Executive Summary**: self-contained 2-3 paragraph overview with key findings, top recommendation, and financial impact summary — usable by itself for a quick read
  - **Detailed Findings**: full pain points, quick wins, and deeper opportunities with evidence annotations — supports deep dives
  - **Tool Recommendation Matrix**: tabular listing of all recommended tools with name, category, purpose, estimated monthly cost, setup complexity, and hours saved — supports procurement decisions
  - **Phased Implementation Roadmap**: phase-by-phase action plan with timeline, dependencies, and risk factors — actionable execution plan
**And** each artifact is stored as a separate R2 object under `reports/{id}/` (e.g., `reports/{id}/executive-summary.json`, `reports/{id}/detailed-findings.json`, etc.)

### AC2: Cross-artifact consistency validation

**Given** multi-artifact output is generated
**When** cross-artifact consistency is checked
**Then** contradictions between artifacts are detected — specifically:
  - Tool recommended in tool matrix but not mentioned in roadmap
  - Financial impact numbers in executive summary inconsistent with detailed findings
  - Timeline in roadmap different from financial impact assumptions
  - Pain point mentioned in detailed findings but absent from executive summary's "key findings"
**And** detected contradictions are flagged for human review rather than silently delivered
**And** a consistency report is included with the artifact set showing: verified checks, contradictions found, and warnings

### AC3: Independently usable artifacts

**Given** the multi-artifact approach is active
**When** artifacts are compared to single-report output
**Then** each artifact is independently usable:
  - Executive summary is self-contained for quick reads — no need to open other artifacts to understand the recommendation
  - Detailed findings support deep dives — structured with evidence annotations
  - Tool matrix supports procurement decisions — all tools listed with cost, complexity, and rationale
  - Roadmap supports execution planning — phases are sequenced with dependencies and risk notes

### AC4: Backward compatibility with existing pipeline

**Given** the multi-artifact extraction is introduced into the pipeline
**When** the pipeline runs
**Then** all existing guarantees from Story 9.1 are preserved:
  - The structure-first 2-phase approach (plan → report) is unchanged
  - The raw `AnalysisData`/`StructuredAnalysis` JSON is still saved as the authoritative source (`analysis.json`)
  - Artifacts are derived from that source — they do not replace it
  - Existing gate evaluation (quick-wins-verification, major-project-verification, report-review) operates on the full analysis as before
  - Email delivery, report linking, and portal retrieval continue to work
  - Fallback to single-pass when Phase 1 fails is preserved

### AC5: Artifact extraction handles edge cases

**Given** edge cases in the analysis output
**When** artifact extraction runs
**Then**:
  - **Empty sections**: if pain_points is empty, the detailed findings artifact notes "No pain points identified" rather than producing an empty/invalid artifact
  - **Minimal analysis**: if the analysis has only an executive_summary and nothing else (fallback/default analysis from 9.1), all artifacts are produced with graceful "insufficient data" placeholders
  - **Missing financial data**: if financial_impact has zeros, the executive summary artifact states "Financial impact not estimated" rather than showing $0
  - **Single-tool recommendations**: tool matrix handles 1-tool and 0-tool cases without error
  - **Single-phase roadmap**: roadmap artifact handles 1-phase cases

## Tasks / Subtasks

- [x] Task 1: Define multi-artifact types (AC: 1)
  - [x] Add `ExecutiveSummaryArtifact`, `DetailedFindingsArtifact`, `ToolMatrixArtifact`, `RoadmapArtifact`, `ConsistencyReport`, `AssessmentArtifacts` types to `src/lib/server/assessment/types.ts`
  - [x] Types must be serializable (camelCase, no server imports)

- [x] Task 2: Implement artifact extraction (AC: 1, 5)
  - [x] Create `src/lib/server/assessment/artifact-extraction.ts` with `extractArtifacts(structured: StructuredAnalysis): AssessmentArtifacts`
  - [x] Extract executive summary: compose from `executive_summary`, top 3 pain points, top quick win, financial impact summary, and recommended next step
  - [x] Extract detailed findings: pain_points, quick_wins, deeper_opportunities with evidence, plus an evidence coverage summary
  - [x] Extract tool matrix: tool_recommendations enriched with enrichment data, plus tool selection rationale and total monthly cost
  - [x] Extract roadmap: implementation_roadmap phases with timeline summary, dependencies between phases, and risk factors

- [x] Task 3: Implement cross-artifact consistency validation (AC: 2)
  - [x] Add `checkCrossArtifactConsistency(artifacts: AssessmentArtifacts): ConsistencyReport` in `artifact-extraction.ts`
  - [x] Check: tool matrix names vs roadmap actions (tools in matrix must appear in roadmap)
  - [x] Check: financial impact numbers consistency between executive summary and detailed findings
  - [x] Check: executive summary key findings match pain points listed in detailed findings
  - [x] Check: roadmap phase count and timing alignment with financial impact assumptions
  - [x] Each contradiction produces a `ConsistencyIssue` with: field, description, severity (contradiction|warning), artifact locations

- [x] Task 4: Add multi-artifact storage (AC: 1)
  - [x] Modify `src/lib/server/assessment/report-store-r2.ts`: add `saveArtifactsToR2(bucket, reportId, artifacts)` that writes each artifact as a separate JSON key under `reports/{id}/`
  - [x] Modify `saveReportUnified` to accept optional artifacts and save them alongside analysis.json
  - [x] Add `getArtifactFromR2(bucket, reportId, artifactType)` for future retrieval

- [x] Task 5: Wire into pipeline (AC: 1, 4)
  - [x] Add `stageExtractArtifacts` function in `src/lib/server/assessment/pipeline.ts`
  - [x] Call artifact extraction after `stageLlmAnalysis` succeeds and validation passes
  - [x] Call consistency validation as part of extraction stage
  - [x] Log: artifact counts, consistency issues found, extraction duration
  - [x] Pass extracted artifacts to `stageSaveReport`

- [x] Task 6: Modify Phase 2 prompt for artifact-ready output (AC: 1, 3)
  - [x] In `src/lib/server/assessment/llm-analysis.ts`, enhance `buildReportFromPlanPrompt` to instruct the LLM that each section must be self-contained
  - [x] Executive summary must include key findings, top recommendation, and financial impact — readable standalone
  - [x] Tool recommendations must include purpose and selection rationale per tool
  - [x] Roadmap must include dependencies between phases and risk factors

- [x] Task 7: Integration test (AC: 1, 2, 3, 4)
  - [x] 12 unit tests covering full extraction, default analysis, edge cases, and all 6 consistency checks
  - [x] Verify all 4 artifacts are extracted (test: complete analysis fixture)
  - [x] Verify consistency report is generated with all 5 checks performed
  - [x] Verify existing analysis.json is still saved (backward compatible — artifacts param is optional)
  - [x] Verify gates still run on full analysis (no changes to gate checkpoint logic)
  - [x] Full regression suite: 577/578 passing (1 pre-existing staff portal failure)

## Dev Notes

### Context from Prior Work

**Story 9.1 (Structure-First Drafting)** is the immediate predecessor. It established:
- 2-phase generation: structural plan (Phase 1) → full report (Phase 2)
- `analyzeTranscriptStructured()` in `llm-analysis.ts` — returns `{ analysis, plan, usedStructureFirst }`
- Fallback: if Phase 1 fails, gracefully degrades to single-pass `analyzeTranscript()`
- `stageLlmAnalysis()` in `pipeline.ts` — wires the 2-phase flow with 600s timeout, validation, enrichment
- `StructuredAnalysis` type in `analysis-types.ts` — the validated shape of the LLM output

**This story builds ON TOP of 9.1** — it does not change the LLM generation flow. It adds post-processing that decomposes the existing `StructuredAnalysis` into separate artifacts, validates cross-artifact consistency, and stores artifacts individually.

### Where This Story Fits in the Pipeline

```
Current pipeline (pipeline.ts) — after Story 9.1:
  stageToolResearch() → stageEvidenceExtraction() → stageLlmAnalysis() → gates → stageSaveReport() → stageLinkReport() → stageEmailDelivery()

Story 9.2 adds artifact extraction between analysis and save:
  stageLlmAnalysis() → [NEW] stageExtractArtifacts() → gates → stageSaveReport(artifacts) → ...
                                                          ^-- now receives artifacts for multi-key R2 storage
```

### Design Decision: Extraction, Not Regeneration

**Do NOT have the LLM generate 4 separate outputs.** This would 4x LLM costs and increase failure risk. Instead:
1. The LLM produces ONE enriched `StructuredAnalysis` (same as today, with enhanced prompt for self-contained sections)
2. A deterministic post-processing function extracts 4 artifacts from that single analysis
3. Cross-artifact consistency is checked deterministically

**Why this approach:**
- Zero additional LLM cost — same number of calls as Story 9.1
- Deterministic extraction — artifacts are always consistent with the source analysis
- Cross-artifact validation catches LLM inconsistencies before delivery
- Backward compatible — the source `analysis.json` is unchanged

### HCMW-002 Methodology Adaptation

| HCMW-002 Step | Human Workflow | Pipeline Adaptation |
|---|---|---|
| 1. Describe business situation | Human provides context | Already available: transcript + evidence map + tool research |
| 2. Targeted follow-up questions | Human answers about audience/formats/tone | Already defined: assessment report, JSON format, "calibrated competence" tone |
| 3. Artifact contract | Human confirms deliverables | Pipeline auto-produces 4-artifact contract (exec summary, detailed findings, tool matrix, roadmap) |
| 4. Produce each artifact | LLM generates each in sequence | LLM produces enriched StructuredAnalysis; extraction decomposes into artifacts |
| 5. Verification summary | Cross-reference consistency, risk flags, source usage, limitations | Pipeline runs `checkCrossArtifactConsistency()` — deterministic validation |

Key differences from interactive HCMW-002:
- No human-in-the-loop contract confirmation — artifact types are fixed for the assessment domain
- No progressive artifact generation — all artifacts extracted from a single LLM output
- File formats: JSON (not .docx/.pptx) — the pipeline produces structured data consumed by the Staff Portal UI

### New Types

```typescript
// src/lib/server/assessment/types.ts

export interface ExecutiveSummaryArtifact {
  /** Company/assessment this summary is for. */
  company: string;
  /** 2-3 paragraph executive summary — self-contained, no references to other artifacts needed. */
  summary: string;
  /** Top 3-5 key findings. */
  key_findings: string[];
  /** The single most important recommendation. */
  top_recommendation: string;
  /** Financial impact in prose: "We estimate $X weekly / $Y annual value from Z hours saved per week." */
  financial_impact_summary: string;
}

export interface DetailedFindingsArtifact {
  pain_points: PainPoint[];
  quick_wins: QuickWin[];
  deeper_opportunities: DeeperOpportunity[];
  /** Summary of evidence coverage: "X of Y claims have direct transcript evidence." */
  evidence_summary: string;
  /** Generated timestamp — when the analysis this was extracted from was produced. */
  generated_at: string;
}

export interface ToolMatrixEntry {
  name: string;
  category: string;
  purpose: string;
  estimated_monthly_cost_aud: number;
  setup_complexity: SetupComplexity;
  /** Hours saved per week attributed to this tool. */
  estimated_hours_saved_per_week: number;
  /** Why this tool was selected over alternatives. */
  selection_rationale: string;
}

export interface ToolMatrixArtifact {
  tools: ToolMatrixEntry[];
  /** Total estimated monthly tool cost (sum of all entries). */
  total_estimated_monthly_cost_aud: number;
  /** Selection rationale for the overall tool set. */
  tool_selection_rationale: string;
}

export interface RoadmapArtifact {
  phases: ImplementationPhase[];
  /** Overall timeline summary: "Phase 1 (Weeks 1-2): Quick wins. Phase 2 (Weeks 3-4): Automation. ..." */
  timeline_summary: string;
  /** Dependencies between phases: "Phase 2 requires Phase 1 tool setup." */
  dependencies: string[];
  /** Risk factors: "If staff resist new tools, Phase 1 adoption may slip to Week 3." */
  risk_factors: string[];
}

export interface ConsistencyIssue {
  /** Which check flagged this. */
  check: string;
  /** Description of the contradiction or warning. */
  description: string;
  /** severity: 'contradiction' (factual conflict) or 'warning' (potential issue). */
  severity: 'contradiction' | 'warning';
  /** Which artifacts are involved. */
  locations: string[];
}

export interface ConsistencyReport {
  /** Whether all checks passed (no contradictions). */
  verified: boolean;
  /** Contradictions found — factual conflicts between artifacts. */
  contradictions: ConsistencyIssue[];
  /** Warnings — potential issues, not definitive conflicts. */
  warnings: ConsistencyIssue[];
  /** Summary of what was checked. */
  checks_performed: string[];
}

export interface AssessmentArtifacts {
  executive_summary: ExecutiveSummaryArtifact;
  detailed_findings: DetailedFindingsArtifact;
  tool_matrix: ToolMatrixArtifact;
  implementation_roadmap: RoadmapArtifact;
  consistency_report: ConsistencyReport;
}
```

### Extraction Logic (pseudocode)

```
extractArtifacts(analysis: StructuredAnalysis, company: string): AssessmentArtifacts
  → executive_summary:
      company = company
      summary = analysis.executive_summary (enhanced with key numbers)
      key_findings = top 3 pain points (names) + top quick win
      top_recommendation = analysis.quick_wins[0] if exists, else first deeper_opportunity, else "No recommendation available"
      financial_impact_summary = prose format of analysis.financial_impact

  → detailed_findings:
      pain_points = analysis.pain_points
      quick_wins = analysis.quick_wins
      deeper_opportunities = analysis.deeper_opportunities
      evidence_summary = computeEvidenceCoverage(analysis) formatted as prose
      generated_at = now

  → tool_matrix:
      tools = analysis.tool_recommendations mapped to ToolMatrixEntry
        (selection_rationale from enrichment data if available, else derived from category + purpose)
      total_estimated_monthly_cost = sum of tool costs
      tool_selection_rationale = generated from tool categories and business context

  → implementation_roadmap:
      phases = analysis.implementation_roadmap
      timeline_summary = prose summary of phases
      dependencies = inferred from phase ordering (Phase N depends on Phase N-1 tools/actions)
      risk_factors = derived from tool setup complexity + pain point severity

  → consistency_report = checkCrossArtifactConsistency(result)
```

### Consistency Checks (detailed)

| # | Check | How | Severity |
|---|---|---|---|
| C1 | Tool matrix ↔ Roadmap | Every tool in matrix must appear in at least one roadmap action. Tools mentioned in roadmap must exist in matrix. | contradiction |
| C2 | Financial: summary ↔ detailed | `financial_impact_summary` annual/net values must match `financial_impact` numbers (±10% rounding tolerance) | contradiction |
| C3 | Executive findings ↔ pain points | Each key_finding should trace to a pain point title | warning |
| C4 | Roadmap phase count ↔ financial | If financial impact > $0, roadmap must have ≥1 phase | warning |
| C5 | Tool cost total ↔ financial | `total_estimated_monthly_cost_aud` should ≈ `estimated_tool_costs_monthly_aud` | warning |
| C6 | Roadmap timeline ↔ financial period | Roadmap phases should align with the period financial impact assumes (weekly vs monthly vs annual) | warning |

### Prompt Enhancement for Artifact-Ready Output

The Phase 2 prompt in `buildReportFromPlanPrompt()` needs minor enhancements to ensure each section is self-contained enough for artifact extraction. Add to the system prompt:

```
ARTIFACT REQUIREMENTS (each section must be independently usable):
- executive_summary: Must include the company name, the central recommendation, top 3 findings, and financial impact numbers. Someone reading ONLY this section should understand the full picture.
- tool_recommendations: Each tool entry must include a "purpose" field explaining WHY this specific tool was chosen (not just what it does). Include selection rationale.
- implementation_roadmap: Each phase must describe what depends on previous phases. Include risk notes where setup complexity is high.
```

This is a MINIMAL prompt change — just adding artifact-readiness requirements to the existing structure-first prompt.

### File List

Files to CREATE:
- `src/lib/server/assessment/artifact-extraction.ts` — `extractArtifacts()`, `checkCrossArtifactConsistency()`

Files to MODIFY:
- `src/lib/server/assessment/types.ts` — add artifact types (ExecutiveSummaryArtifact, DetailedFindingsArtifact, ToolMatrixArtifact, RoadmapArtifact, ConsistencyReport, AssessmentArtifacts)
- `src/lib/server/assessment/llm-analysis.ts` — enhance `buildReportFromPlanPrompt()` with artifact-readiness instructions
- `src/lib/server/assessment/pipeline.ts` — add `stageExtractArtifacts()`, wire into pipeline, pass artifacts to save
- `src/lib/server/assessment/report-store-r2.ts` — add `saveArtifactsToR2()`, modify `saveReportUnified()` to accept optional artifacts

Files to READ (do not modify):
- `docs/agentic-workflows/high-capability-model-workflows/hcmw-002-v1-the-multi-artifact-work-package.md` — source methodology
- `src/lib/server/assessment/analysis-types.ts` — StructuredAnalysis shape (source for extraction)
- `src/lib/server/assessment/tool-lookup.ts` — tool enrichment for matrix
- `src/lib/server/assessment/evidence-map.ts` — evidence coverage for detailed findings

### Testing Requirements

- **Unit tests (artifact-extraction.ts):**
  - `extractArtifacts()` with a complete StructuredAnalysis → all 4 artifacts populated with correct data
  - `extractArtifacts()` with minimal/default analysis (fallback from 9.1) → artifacts with graceful placeholders
  - `extractArtifacts()` with empty arrays → artifacts with "None identified" messages
  - `checkCrossArtifactConsistency()` with consistent artifacts → verified=true, empty contradictions/warnings
  - `checkCrossArtifactConsistency()` with tool in matrix but not roadmap → contradiction detected
  - `checkCrossArtifactConsistency()` with mismatched financial numbers → contradiction detected
  - `checkCrossArtifactConsistency()` with all edge cases (empty artifacts, single entries, zeros)

- **Integration test:**
  - Run `scripts/trigger-pipeline.mjs` with sample transcript
  - Verify R2 keys: `analysis.json`, `executive-summary.json`, `detailed-findings.json`, `tool-matrix.json`, `implementation-roadmap.json`, `consistency-report.json`
  - Verify each artifact is valid JSON and independently readable
  - Verify existing pipeline output (analysis.json) is unchanged
  - Verify gates still operate on full analysis
  - Verify email still sends

- **Regression tests:**
  - Gate evaluation tests (Epic 7) still pass — gates receive same analysis content
  - Fallback path: force Phase 1 failure → verify artifacts still generated from default analysis
  - Existing portal/email tests still pass

### Architecture Compliance

- Do NOT introduce new external dependencies
- Do NOT change the `StructuredAnalysis` type schema — extraction reads from it, doesn't modify it
- Do NOT change the LLM generation flow — this is post-processing only (except prompt enhancement)
- Do NOT move pipeline work into SvelteKit Pages handlers
- Do NOT introduce Staff Portal UI dependencies
- Artifact extraction is a deterministic, pure function — no side effects, no async calls except logging
- Consistency validation is deterministic — no LLM calls, no external services

### Edge Cases

- **Default/fallback analysis** (from `createDefaultAnalysis()`): All artifacts produced with "Insufficient data" or "Not available" placeholders. Consistency report shows all checks as N/A with notes.
- **Empty pain_points / quick_wins / deeper_opportunities**: Artifacts note "None identified" — not empty objects
- **Zero financial impact**: Executive summary states "Financial impact not estimated — insufficient data" instead of $0
- **Single tool / single phase**: Matrix and roadmap handle single-entry cases gracefully
- **Very long executive summary**: Truncate `key_findings` to top 5 if analysis produces more
- **Tool names with special characters**: Sanitized in matrix — no injection risk since extraction is server-side only

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- **Task 1-3:** Added 9 multi-artifact types to `types.ts` (ExecutiveSummaryArtifact, DetailedFindingsArtifact, ToolMatrixArtifact, ToolMatrixEntry, RoadmapArtifact, ConsistencyIssue, ConsistencyReport, AssessmentArtifacts). Created `artifact-extraction.ts` with `extractArtifacts()` (deterministic decomposition of StructuredAnalysis) and `checkCrossArtifactConsistency()` (6 deterministic consistency checks: C1 tool-roadmap alignment, C2 financial consistency, C3 findings-pain-point alignment, C4 roadmap-financial, C5 tool cost consistency, C6 timeline-period alignment).
- **Task 4:** Added `saveArtifactsToR2()` (writes 5 artifact JSONs in parallel to R2), `getArtifactFromR2()` (retrieval by type), and modified `saveReportUnified()` and `saveReportToR2()` to accept optional `AssessmentArtifacts` parameter (backward compatible).
- **Task 5:** Added `stageExtractArtifacts()` in `pipeline.ts` wired between `stageLlmAnalysis` and gate checkpoints. Extraction logs artifact counts, consistency verification status, contradictions, and warnings. Artifacts passed through to `stageSaveReport`.
- **Task 6:** Enhanced `buildReportFromPlanPrompt()` with ARTIFACT-READINESS REQUIREMENTS section: executive_summary must be self-contained with company name, tool_recommendations must include purpose/selection rationale, roadmap must describe dependencies and risk notes.
- **Task 7:** 12 Vitest unit tests passing: extractArtifacts with complete/default/minimal/single-entry/zero-fixture analysis; checkCrossArtifactConsistency for verified, tool-roadmap misalignment, findings-pain-point mismatch, single-phase warnings, empty artifacts, and contradiction detection. Full regression: 577/578 passing (1 pre-existing failure in commercial-audit.test.ts unrelated to this story).

### File List
