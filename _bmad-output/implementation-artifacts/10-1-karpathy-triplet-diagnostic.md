# Story 10.1: Karpathy Triplet Diagnostic (AIAS-001)

Status: ready-for-dev

## Story

As a pipeline developer,
I want to know whether the pipeline is ready for automated optimization,
So that optimization investment is not wasted on a system that can't actually be improved.

**Requirements sourced from:** AIAS-001 (`docs/agentic-workflows/auto-improving-agent-safety/aias-001-v1-the-karpathy-triplet-diagnostic.md`)

## Acceptance Criteria

### AC1: Editable surface identified (Gate 1)

**Given** the assessment pipeline codebase
**When** the diagnostic evaluates the editable surface
**Then** it identifies: (a) what would be modified (prompts, model selection, gate criteria, tool research queries), (b) specific files/config/prompt templates that can be changed in isolation, (c) whether the surface is version-controlled and revertible.

### AC2: Optimization metric defined (Gate 2)

**Given** the pipeline's current measurement capabilities
**When** the diagnostic evaluates optimization metrics
**Then** it identifies: (a) a metric that can be computed automatically without human judgment, (b) the time to compute it after a change, (c) whether it correlates with business value, (d) whether it can be computed in a sandbox.

### AC3: Time budget established (Gate 3)

**Given** the pipeline's experiment execution path
**When** the diagnostic evaluates the time budget
**Then** it identifies: (a) time per experiment (change → test), (b) compute requirements, (c) cost per run, (d) sandbox isolation feasibility.

### AC4: Verdict artifact produced

**Given** all three gate evaluations
**When** the diagnostic completes
**Then** it produces ONE of:
  - `_bmad-output/pipeline-optimization/program.md` if all gates passed — with editable surface, metric, time budget, constraints, and research directions
  - `_bmad-output/pipeline-optimization/blocker-report.md` if any gate failed — with per-gate blocker details, remediation sequence, and honest timeline estimate

### AC5: Diagnostic is traceable

**Given** the diagnostic evaluation
**When** the verdict is produced
**Then** the artifact includes references to specific files, configs, and measurements from the pipeline codebase
**And** reasoning for each gate decision is documented

## Dev Notes

### Pipeline Inspection Checklist

Key files to examine for the diagnostic:
- `src/lib/server/assessment/` — analysis prompts, model selection, gate configs
- `src/routes/api/benchmark/pipeline/+server.ts` — benchmark endpoint (timing)
- `scripts/bench-pipeline.mjs` — benchmark runner (METRIC pipeline_ms=...)
- `scripts/test-model-variations.mjs` — model comparison script

### Editable surface candidates
- LLM prompt templates (Perplexity prompts in `evidence-map.ts`, `tool-lookup.ts`)
- Model selection (env vars: PERPLEXITY_MODEL, etc.)
- Gate criteria (judge prompts, evaluation thresholds)
- Tool research queries (Futurepedia/TAAFT search terms)
- Pipeline structure (multi-phase generation in `analyze-transcript.ts`)

### Metric candidates
- `pipeline_ms` — currently measured by bench-pipeline.mjs
- Report quality score (gate evaluation scores)
- Evidence coverage rate (from evidence map)
- Cost per assessment (API calls × token usage)

### Implementation Plan

1. Run the AIAS-001 gated diagnostic against the pipeline by inspecting:
   - Editable surface (prompt files, model configs, phase structure)
   - Metric (pipeline_ms, gate scores, evidence coverage)
   - Time budget (current bench figures, cost estimates)
2. Produce either:
   - `_bmad-output/pipeline-optimization/program.md` (all gates pass)
   - `_bmad-output/pipeline-optimization/blocker-report.md` (gates fail)
3. No code changes — this is purely diagnostic

### File List

Files to CREATE:
- `_bmad-output/pipeline-optimization/program.md` or `_bmad-output/pipeline-optimization/blocker-report.md`

Files READ for diagnostic (no modifications):
- `scripts/bench-pipeline.mjs`
- `src/lib/server/assessment/analyze-transcript.ts`
- `src/lib/server/assessment/evidence-map.ts`
- `src/lib/server/assessment/tool-lookup.ts`
- `src/lib/server/assessment/gate-judge.ts` (if exists)
- `src/routes/api/benchmark/pipeline/+server.ts`

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
