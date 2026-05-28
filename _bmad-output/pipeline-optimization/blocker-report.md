# AIAS-001 Blocker Report: Pipeline Auto-Optimization Readiness

**System evaluated:** AI Business Assessment Pipeline (`agenticai-net-au`)
**Diagnostic:** AIAS-001 Karpathy Triplet Diagnostic
**Date:** 2026-05-29
**Verdict:** **NOT READY** — two of three gates failed.

---

## Gate Results Summary

| Gate | Name | Result | 
|------|------|--------|
| 1 | Editable Surface | ✅ **PASSED** |
| 2 | Optimization Metric | ❌ **FAILED** |
| 3 | Time Budget | ❌ **FAILED** |

**Epic 9 improvements** (Structure-First Drafting, Multi-Artifact Reports, PBW Detection, Evidence Traceability) strengthened the editable surface. The pipeline is version-controlled, prompt templates are structured, and gate criteria exist. However, **no automated quality metric exists**, and the benchmark path runs against production data with no sandbox isolation.

---

## Blocker Details

### ❌ Gate 2 — Optimization Metric FAILED

**Gap:** The pipeline's only measured metric is `pipeline_ms` (duration of a single `analyzeTranscript` call). This is a **timing metric only** — it does not correlate with report quality, business value, or customer outcomes.

**Why it matters:** An auto-optimization loop optimizing `pipeline_ms` would converge on the fastest possible report, not the best one. The agent would learn to truncate analysis, skip evidence extraction, reduce tool research, and generate superficial recommendations — exactly the "prettier, faster, wronger" failure mode Epic 9's PBW detector was built to catch. Optimizing for speed alone is actively harmful.

**Current measurement capabilities:**
- `pipeline_ms`: measured by `scripts/bench-pipeline.mjs` via `/api/benchmark/pipeline` — automated ✅
- Gate evaluation scores: manual staff review — NOT automated ❌
- Evidence coverage rate: computed (`direct_claims / total_claims`) — automated ✅ but not exposed as a benchmark metric ❌
- Report structure scores (phase 1 structural plan quality): NOT scored ❌
- Multi-artifact consistency (HCMW-002 validation): computed but NOT benchmarked ❌

**Concrete next step:** Define and implement an automated report quality metric (see Remediation Sequence below).

---

### ❌ Gate 3 — Time Budget FAILED

**Gap:** The benchmark pipeline (`scripts/bench-pipeline.mjs` → `/api/benchmark/pipeline`) fetches transcripts from the **production D1 database** and calls the full `analyzeTranscript` path against production API keys (Perplexity). There is **no sandboxed environment** for running optimization experiments.

**Why it matters:** 
1. **Cost**: Each experiment burns production API credits (Perplexity calls: evidence extraction, tool research, analysis phases 1+2 = ~4 API calls per experiment)
2. **Data isolation**: Cannot run experiments against production data without risk
3. **No batch mode**: The benchmark supports single runs only — no concurrent experiment infrastructure
4. **No regression dataset**: No fixed test set of transcripts with known quality scores — every experiment result is incomparable

**Current benchmark characteristics:**
- Time per experiment: ~60-120s (single-threaded, serial)
- API calls per experiment: ~4 Perplexity calls (evidence + tools + plan + report)
- Cost per experiment: ~$0.02-0.10 (Perplexity sonar-pro pricing)
- 100 experiments: ~$2-10 and ~2-3 hours
- Sandbox: **None** — uses production D1 and production API keys

**Concrete next step:** Create a sandboxed benchmark environment with a fixed evaluation dataset (see Remediation Sequence below).

---

## Remediation Sequence

### Step 1: Build Automated Report Quality Metric (unblocks Gate 2)

**Effort:** ~3-5 days

Create a composite quality score that combines:
1. **Gate pass rate** (30% weight): Run the gate judge against benchmark reports. Score based on gate criteria passed. Requires making gate evaluation callable programmatically.
2. **Evidence coverage** (25% weight): `direct_claims / total_claims` from the evidence map — already computed, just needs benchmarking exposure.
3. **Structural completeness** (20% weight): Phase 1 structural plan quality — presence of thesis, argument movement, connective logic, deliberate omissions.
4. **Actionable recommendation density** (15% weight): Count of recommendations backed by tool research + transcript evidence vs. generic advice.
5. **Multi-artifact consistency** (10% weight): Cross-artifact validation score from HCMW-002.

**Output:** A single scalar `report_quality_score` (0-100) computable automatically after each pipeline run, with a clear "higher is better" direction.

### Step 2: Build Sandboxed Benchmark Environment (unblocks Gate 3)

**Effort:** ~3-5 days

1. **Fixed evaluation dataset**: Select 5-10 diverse transcripts from D1 (different industries, company sizes, pain points). Store as local JSON fixtures in `tests/fixtures/benchmark/`. Manually score each for quality (human baseline).
2. **Sandboxed benchmark mode**: Add a `--sandbox` flag to `bench-pipeline.mjs` that uses local fixture transcripts instead of D1. Accept `PERPLEXITY_API_KEY` override for sandboxed API billing.
3. **Batch runner**: Script that runs `N` experiments against the fixed dataset and collects `report_quality_score` per transcript + aggregate.
4. **Regression detection**: Track baseline scores. Flag experiments where quality drops >1 std dev below baseline while speed improves.

### Step 3: Re-run AIAS-001

After Steps 1-2 are complete, re-run this diagnostic. Expected outcome: all three gates pass, producing a `program.md`.

---

## Honest Timeline Estimate

| Phase | Work | Timeline |
|-------|------|----------|
| Gate 2 fix | Automated quality metric | 3-5 days |
| Gate 3 fix | Sandboxed benchmark environment | 3-5 days |
| **Total to readiness** | | **1-2 weeks** |

The pipeline is **weeks, not months** from auto-optimization readiness. The foundation is strong — version-controlled prompts, structured pipeline stages, evidence traceability, and multi-artifact validation are all in place. The gaps are narrow and well-defined: an automated quality metric and a sandboxed benchmark.

---

## Why This Matters

Running autoresearch against `pipeline_ms` today would optimize for the wrong thing. The agent would discover that removing the evidence map step, skipping tool research, and generating shorter reports all improve `pipeline_ms` — and it would be right about the metric but wrong about the outcome. The pipeline would get faster and worse simultaneously.

The two blockers (quality metric + sandbox) are each ~3-5 days of well-scoped work. Once resolved, the pipeline is an excellent candidate for auto-optimization: small editable surface (prompts + model selection), cheap experiments (~$0.05 each), reasonable cycle time (~60s), and clear optimization target (report quality).
