# Story 10.2: Metric Gaming Pre-Mortem (AIAS-002)

Status: done

## Story

As a pipeline quality engineer,
I want to identify how optimization could game the chosen metric without delivering business value,
So that the optimization target is hardened against Goodhart's Law before experiments begin.

**Requirements sourced from:** AIAS-002 (`docs/agentic-workflows/auto-improving-agent-safety/aias-002-v1-the-metric-gaming-pre-mortem.md`)

## Acceptance Criteria

### AC1: Target gathered

**Given** the primary metric from AIAS-001 (report_quality_score or similar candidate)
**When** the pre-mortem gathers the target
**Then** it documents: the metric, what business outcome it represents, the editable surface, and how the metric is evaluated.

### AC2: Gaming vectors identified

**Given** the optimization target
**When** the pre-mortem is applied adversarially
**Then** gaming vectors are identified across 5 categories: direct gaming, proxy divergence, eval contamination, silent degradation, compounding cascades
**And** each vector includes: concrete scenario, why it would register as improvement, actual damage, and detection difficulty.

### AC3: Defense plan produced

**Given** identified gaming vectors
**When** countermeasures are designed
**Then** secondary metrics, holdout scenarios, and disappearance tests are defined for each vector.

### AC4: Honest assessment delivered

**Given** the full pre-mortem analysis
**When** the evaluation diversity plan is complete
**Then** the artifact includes an honest assessment of metric robustness and whether the metric is adequate for unsupervised optimization.

### AC5: Artifact produced

**Given** the pre-mortem analysis
**When** complete
**Then** `_bmad-output/pipeline-optimization/metric-gaming-pre-mortem.md` is produced.

## Dev Notes

### Context from Story 10-1

AIAS-001 produced a Blocker Report:
- **Primary metric (candidate):** `report_quality_score` (composite, 0-100)
  - Gate pass rate (30%)
  - Evidence coverage (25%)
  - Structural completeness (20%)
  - Actionable recommendation density (15%)
  - Multi-artifact consistency (10%)
- **Editable surface:** Prompt templates in `llm-analysis.ts`, `evidence-map.ts`, model selection env vars, gate criteria
- **Evaluation env:** Single-run benchmark against production D1 (not sandboxed yet)

### Gaming Vector Categories

The pre-mortem analyzes how an auto-optimization agent could inflate `report_quality_score` without delivering client value:
1. Direct Gaming — exploiting the score calculation itself
2. Proxy Divergence — score up, business value flat/down
3. Eval Contamination — leaking test info into training
4. Silent Degradation — accumulating side effects
5. Compounding Cascades — downstream harm from local optimization

### Implementation Plan

1. Apply AIAS-002 pre-mortem methodology to the pipeline's optimization context
2. Generate gaming vectors across all 5 categories
3. Design secondary metrics and holdout scenarios
4. Produce `_bmad-output/pipeline-optimization/metric-gaming-pre-mortem.md`

No code changes — purely analytical.

### File List

Files to CREATE:
- `_bmad-output/pipeline-optimization/metric-gaming-pre-mortem.md`
