# Trace Infrastructure Audit: Pipeline Auto-Optimization

**Assessment:** AIAS-003 Trace Infrastructure Audit
**System:** AI Business Assessment Pipeline (`agenticai-net-au`)
**Date:** 2026-05-29

---

## 1. Current State Summary

The assessment pipeline logs stage transitions via `console.info/warn/error` with structured `[pipeline:stage:X]` tags and key metrics (duration, claim counts, tools found). Reports are persisted to Cloudflare R2 with metadata in D1. The full pipeline codebase is version-controlled in Git. A benchmark script (`bench-pipeline.mjs`) measures pipeline duration against a single transcript from production. No structured trace storage exists beyond console output. No session replay, no harness snapshots tied to performance data, no sandboxed execution environment.

---

## 2. Requirement Assessment Table

| # | Requirement | Status | Current State Notes | Impact on Auto-Improvement |
|---|------------|--------|--------------------|-----------------------|
| a | Full Reasoning Traces | **ABSENT** | Only final outputs logged via console; intermediate LLM reasoning (chain-of-thought, tool selection reasoning) not captured anywhere | Meta-agent cannot understand WHY a report failed gate or WHY evidence was missed — only THAT it failed. Optimization becomes random mutation, not surgical editing. |
| b | Tool Call Granularity | **PARTIAL** | `stageToolResearch` logs toolsFound count and MVTD stats, but individual tool search queries, API responses, and latency per call are not captured | Meta-agent cannot attribute report quality changes to specific tool research queries or identify which queries produce high-value vs. low-value results |
| c | Decision Point Visibility | **ABSENT** | No logging at branching points: phase-1 plan acceptance/rejection is logged with thesis snippet, but no log of what alternatives were considered or why one was chosen | Meta-agent cannot identify the specific decision (e.g., "plan rejected because thesis was too generic") that led to a poor outcome — must guess from final output |
| d | Structured Format | **PARTIAL** | Console logs use structured key-value pairs (`{ coverage, gaps, durationMs }`) within freeform strings, but no machine-parseable trace format (JSONL, OpenTelemetry spans) | Meta-agent can't programmatically navigate traces — must regex-parse console output, which is fragile and loses metadata |
| e | Session Reproducibility | **ABSENT** | No ability to replay a pipeline session with the same inputs and tool responses. Transcripts are fetched from production D1, API calls are live. | Cannot verify that a harness change caused an outcome difference vs. external variance (different API response, different tool catalog). Attribution is impossible. |
| f | Baseline Snapshots | **PARTIAL** | All source is Git-versioned, but no harness snapshot is automatically captured at experiment time. No metadata ties a specific commit hash to a specific benchmark result. | Can manually trace commits to experiments, but automated correlation is missing. Over many experiments, attributing improvements to specific changes becomes guesswork. |
| g | Failure Classification | **ABSENT** | Failures are logged as error messages with stack traces, but not categorized (wrong tool, hallucination, timeout, format error, budget exceeded). Gate failures are categorized but only in staff portal UI, not in traces. | Meta-agent treats all failures as undifferentiated — can't learn "timeout failures" vs. "quality failures" as separate problem classes requiring different remediation strategies |
| h | Cost and Latency Tracking | **PARTIAL** | Pipeline duration measured in bench script and stage logs. No per-step cost tracking (API call token counts, Perplexity usage). No cost attribution per stage. | Meta-agent can optimize for speed but not cost-efficiency. A change that's 5% faster but 3x the API cost looks like an improvement when it's not. |
| i | Sandboxed Execution Environment | **ABSENT** | Benchmarks run against production D1 and production Perplexity API keys. No isolated environment exists for running experiments. | Cannot run hundreds of experiments without (a) polluting production data and (b) burning real money. This is a showstopper — no auto-improvement is possible without sandboxed execution. |
| j | Evaluation Harness | **PARTIAL** | 601+ vitest tests cover gate logic, artifact extraction, evidence map, traceability. But no automated end-to-end benchmark harness that scores report quality against a held-out set. The bench script only measures duration. | Can verify code correctness but can't automatically score report quality changes. Meta-agent needs a quality signal, not just "did the code compile." |

---

## 3. Critical Gaps (ABSENT requirements that completely block auto-improvement)

### Gap 1: Sandboxed Execution Environment (i)

**Why it's critical:** Without sandbox isolation, every experiment burns production API credits, touches production data, and risks corrupting production metrics. This is the absolute prerequisite — auto-improvement is impossible without it.

**Minimum viable implementation:**
- Copy 10 diverse transcripts from D1 to local JSON fixtures in `tests/fixtures/benchmark/`
- Add `--sandbox` mode to `bench-pipeline.mjs` that uses local fixtures + a separate `PERPLEXITY_API_KEY_SANDBOX` env var
- Ensure sandbox writes go to a separate R2 prefix or local filesystem, never production

**Build vs. buy:** **Build** — the bench script already exists; the sandbox is a mode flag + fixture data + env var separation. ~3 days of work.

**Estimated effort:** 3-5 days, 1 developer.

---

### Gap 2: Full Reasoning Traces (a)

**Why it's critical:** Without chain-of-thought from the LLM, the meta-agent is blind to the "why" behind every output. It can see that a report scored 72/100 but not that the plan generation chose a weak thesis because the evidence extraction missed a key pain point. Optimization becomes a genetic algorithm of random changes rather than targeted surgical edits.

**Minimum viable implementation:**
- Capture the raw LLM response for each pipeline phase (plan, report, evidence extraction) — not just the parsed output
- Store as structured JSON trace entries: `{ stage, timestamp, model, prompt_snippet, full_response, tokens_used, latency_ms }`
- Write trace files per session to a `traces/` directory (local initially, R2 later)

**Build vs. buy:** **Build** — the LLM calls already return full responses; we're just saving them instead of discarding after parse. Use existing Perplexity response objects.

**Estimated effort:** 2-3 days, 1 developer — mostly adding `saveTrace(stage, response)` calls at each LLM invocation point.

---

### Gap 3: Session Reproducibility (e)

**Why it's critical:** Without reproducibility, you can't trust that a benchmark score change was caused by your harness change rather than by variance in API responses, tool catalog freshness, or network conditions. All attribution breaks. You're measuring noise, not improvement.

**Minimum viable implementation:**
- Record exact tool research API responses for benchmark transcripts (cache as fixtures)
- Record exact Perplexity responses for evidence extraction (cache for replay)
- Add a `--replay` mode to bench-pipeline.mjs that uses cached responses instead of live API calls
- This enables deterministic re-runs where the only variable is the harness code

**Build vs. buy:** **Build** — simple response caching. Store API responses by session ID. Replay reads from cache.

**Estimated effort:** 2-3 days, 1 developer.

---

### Gap 4: Decision Point Visibility (c)

**Why it's critical:** The phase-1 structure-first plan (from HCMW-004) is the single most important decision point in the pipeline — a good plan produces a good report. Without logging WHY the plan was accepted or rejected, the meta-agent can't learn what makes a plan good.

**Minimum viable implementation:**
- Log the phase-1 plan validation result with structured reasons: which plan fields passed/failed (thesis present, argument movement present, sections > 2, connective logic present)
- Log the plan review decision payload: what the plan LLM judged and what score it assigned
- Add these as structured trace entries alongside the LLM response trace

**Build vs. buy:** **Build** — the plan validation already runs; we just need to log the validation internals rather than only the accept/reject verdict.

**Estimated effort:** 1 day, 1 developer.

---

## 4. Partial Gaps (PARTIAL requirements that degrade meta-agent performance)

### Gap 5: Structured Format (d)

**Why it matters:** Console logs with `[pipeline:stage:X]` prefixes are grep-able but not programmatically navigable. A meta-agent needs to answer queries like "show me all experiments where evidence coverage dropped below 0.5" without writing regex.

**Improvement path:**
- Adopt JSONL trace files (one JSON object per pipeline event, appended per session)
- Minimal schema: `{ ts, stage, event, data }` where `data` is stage-specific
- Store alongside reports in R2 with a `traces/{callId}/` prefix

**Estimated effort:** 2 days, 1 developer.

---

### Gap 6: Cost and Latency Tracking (h)

**Why it matters:** Without per-step cost data, the meta-agent can't distinguish between "same speed, same cost, better quality" (pure win) and "same speed, 3x cost, slightly better quality" (net loss). Cost-blind optimization is dangerous.

**Improvement path:**
- Track token usage per LLM call (Perplexity returns `usage.total_tokens`)
- Add `cost_estimate` field based on published Perplexity pricing
- Log per-stage: `{ stage, latency_ms, tokens_in, tokens_out, estimated_cost }`
- Surface in bench-pipeline.mjs output

**Estimated effort:** 2 days, 1 developer.

---

### Gap 7: Baseline Snapshots (f)

**Why it matters:** The harness IS version-controlled (Git), but experiments don't automatically capture which commit they ran against. Over hundreds of experiments, manual correlation becomes error-prone.

**Improvement path:**
- `bench-pipeline.mjs` captures `git rev-parse HEAD` and includes it in benchmark output
- Trace files include `harness_commit` field
- Dashboard or log viewer can filter experiments by commit range

**Estimated effort:** 0.5 days — a single `git rev-parse` call in the bench script.

---

### Gap 8: Evaluation Harness (j)

**Why it matters:** 601+ vitest tests verify code correctness but don't score report quality. The meta-agent needs a quality signal from the evaluation harness — not just "did it run?"

**Improvement path:**
- Build the `report_quality_score` composite metric (from AIAS-001 Blocker Report)
- Run it as part of the benchmark pipeline alongside duration
- Surface both `pipeline_ms` and `report_quality_score` in bench output

**Estimated effort:** 3-5 days (already in AIAS-001 remediation plan).

---

### Gap 9: Tool Call Granularity (b)

**Why it matters:** Tool research is a major cost and quality driver (4+ API calls). Without per-query logging, the meta-agent can't identify which tool research strategies produce the most valuable recommendations.

**Improvement path:**
- Log each individual tool lookup query (Futurepedia, TAAFT, Perplexity) with: query text, catalog used, result count, latency, cached/hit
- Add to structured trace format

**Estimated effort:** 1 day, 1 developer.

---

## 5. Readiness Verdict

### Verdict: **FOUNDATIONAL WORK NEEDED**

The pipeline has strong software engineering foundations — version control, automated tests, structured code, production monitoring. But it lacks the **trace infrastructure** that distinguishes a deployed application from an optimizable system.

**Four critical gaps** would completely prevent a meta-agent from functioning:
1. No sandbox (can't experiment safely)
2. No reasoning traces (blind to why things fail)
3. No reproducibility (can't trust measurements)
4. No decision point visibility (can't identify where to intervene)

**All four are buildable** and well-scoped — collectively ~8-12 days of focused engineering, not months. But they must be built before any auto-optimization can begin.

**Priority sequence:**
1. Sandbox (3-5 days) — prerequisite for any experimentation at all
2. Reasoning traces (2-3 days) — prerequisite for understanding failures
3. Session reproducibility (2-3 days) — prerequisite for trusting results
4. Decision point visibility (1 day) — prerequisite for targeted improvements

---

## 6. The One Thing To Do This Week

**Build the sandboxed benchmark environment.**

Take `scripts/bench-pipeline.mjs` and add `--sandbox` mode:
- Copy 5 diverse transcripts from D1 → `tests/fixtures/benchmark/` as local JSON
- Add `PERPLEXITY_API_KEY_SANDBOX` env var for separate API billing
- Route sandbox writes to local filesystem or separate R2 prefix
- Add `--count N` flag for running N experiments in sequence

This unlocks everything else. Once you can safely run experiments, you can add reasoning traces and reproducibility incrementally — with each experiment immediately validating that the traces work. Without the sandbox, none of the other gaps can even be tested. **Start here.**
