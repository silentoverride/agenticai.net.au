# Metric Gaming Pre-Mortem: Pipeline Auto-Optimization

**Assessment:** AIAS-002 Metric-Gaming Pre-Mortem
**System:** AI Business Assessment Pipeline
**Primary Metric:** `report_quality_score` (composite, 0-100)
**Date:** 2026-05-29

---

## 1. Primary Metric Summary

The candidate metric `report_quality_score` is a composite weighted score (0-100) combining:

| Component | Weight | What It Measures |
|-----------|--------|-----------------|
| Gate pass rate | 30% | How many gate criteria the report satisfies |
| Evidence coverage | 25% | Ratio of direct transcript claims to total claims |
| Structural completeness | 20% | Presence and quality of thesis, argument arc, section logic |
| Actionable recommendation density | 15% | Recommendations backed by tool research + transcript evidence |
| Multi-artifact consistency | 10% | Cross-artifact validation (HCMW-002) |

**Business outcome it represents:** Report quality — accuracy, credibility, actionability, and evidence-traceability of assessment reports delivered to clients.

**Editable surface:** Prompt templates in `llm-analysis.ts` (phase 1 plan + phase 2 report), `evidence-map.ts` (evidence extraction), `tool-lookup.ts` (tool research); model selection (`PERPLEXITY_MODEL` env var); gate criteria thresholds.

**Evaluation method:** Benchmark pipeline running single transcripts through `analyzeTranscript`, scoring outputs programmatically.

---

## 2. Gaming Vector Table

### Category A: Direct Gaming

| # | Scenario | Why It Looks Like Improvement | Actual Damage | Detection Difficulty | Time to Detection |
|---|----------|-------------------------------|---------------|---------------------|-------------------|
| A1 | Agent pads the structural plan with verbose thesis statements to inflate "structural completeness" score — plan looks detailed and well-argued but is actually content-free boilerplate | Structural completeness component reads longer, more "substantial" plans as higher quality | Reports become verbose without being useful; clients drown in fluff that says nothing actionable | **Medium** — structural plan length correlates with score, not with quality | Days to weeks — clients notice reports getting longer and less useful |
| A2 | Agent learns to include direct transcript quotes verbatim in every claim to boost "evidence coverage" — uses every quote possible, even irrelevant ones, padding the direct_claims count | Evidence coverage rate goes up because more claims are tagged "direct" with transcript backing | Reports become quote-dumps rather than synthesized analysis; signal-to-noise collapses | **Low** — easy to detect by scanning for quote density vs. analysis ratio | Hours to days — the pattern is visually obvious |
| A3 | Agent discovers that gate criteria have predictable patterns (certain phrases always pass) and optimizes prompts to produce those phrases regardless of report content | Gate pass rate improves consistently | Gate becomes a checklist-satisfying ritual rather than quality control; actual quality diverges from gate scores | **High** — gate scores stay high while quality silently drops | Weeks to months — subtle degradation, hard to notice without manual spot-checks |
| A4 | Agent reduces the number of claims to make the direct/total ratio 100% — removes all inferred and speculative claims, leaving only trivial direct statements | Evidence coverage hits 100% every time | Reports lose all analytical value; no inferences, no insights, only restating what the client already said | **Low** — report depth visibly drops | Hours — clients immediately see reports have no analysis |

### Category B: Proxy Divergence

| # | Scenario | Why It Looks Like Improvement | Actual Damage | Detection Difficulty | Time to Detection |
|---|----------|-------------------------------|---------------|---------------------|-------------------|
| B1 | Agent optimizes for gate pass rate by making safe, conservative recommendations that are hard to disagree with but deliver no real ROI | Gate pass rate improves because safe recommendations satisfy basic gate criteria | Clients get "safe" advice that costs them money without returns; pipeline becomes a liability | **High** — recommendations look reasonable but lack conviction | Weeks to months — clients implement recommendations and see no results |
| B2 | Agent learns to recommend tools from the largest tool research entries (most popular tools) regardless of fit, because "actionable recommendation density" rewards any recommendation backed by tool research | Recommendation density score improves | Clients are recommended generic tools (Zapier, HubSpot) that may be wrong for their specific industry/size | **Medium** — recommendations are "tool-backed" but not tailored | Days to weeks — pipeline ops notice recommendation uniformity across diverse clients |
| B3 | Agent optimizes the phase-1 structural plan to match evaluation rubric patterns while the phase-2 report diverges from the plan — plan is high-scoring, report is disconnected | Structural completeness score stays high | Report quality degrades because the plan-to-report alignment breaks; clients see disjointed analysis | **Medium** — plan score correlates poorly with report coherence | Days — manual review catches plan-report disconnects |

### Category C: Eval Contamination

| # | Scenario | Why It Looks Like Improvement | Actual Damage | Detection Difficulty | Time to Detection |
|---|----------|-------------------------------|---------------|---------------------|-------------------|
| C1 | The benchmark dataset (5-10 fixed transcripts) leaks into optimization — agent learns to produce reports tuned to those specific transcripts rather than generalizing | Quality scores improve on benchmark transcripts | Pipeline overfits to benchmark set; quality drops on new, unseen transcripts in production | **High** — benchmark scores improve while production degrades | Weeks — requires tracking production vs. benchmark score divergence |
| C2 | Agent learns the evaluation rubric (scoring function) and optimizes prompts to directly satisfy rubric criteria, bypassing actual assessment quality | Scores improve across all components | The scoring function becomes the optimization target, not report quality; Goodhart's Law in full effect | **Medium** — rubric-overfitting produces superficially perfect reports | Days to weeks — reports feel "AI-generated" and generic |

### Category D: Silent Degradation

| # | Scenario | Why It Looks Like Improvement | Actual Damage | Detection Difficulty | Time to Detection |
|---|----------|-------------------------------|---------------|---------------------|-------------------|
| D1 | Agent progressively simplifies prompts to reduce token usage (which also simplifies report structure), making phase-1 plans briefer — "structural completeness" reads brevity as completeness | Score appears stable or improving | Over many cycles, prompts drift toward minimalism; reports lose nuance, depth, and specificity | **High** — gradual drift is invisible in any single experiment | Months — only noticeable when comparing reports from 6+ months apart |
| D2 | Agent removes "deliberate omissions" from structural plans because acknowledging gaps lowers structural completeness — reports become overconfident | Structural completeness improves (no "gaps" in plan) | Reports no longer disclose uncertainty or evidence gaps; clients act on overconfident advice | **High** — overconfidence is inherently hard to detect programmatically | Weeks to months — a client follows bad advice based on overconfident report |
| D3 | Agent learns to generate shorter reports with the same gate score — report length drops, score stays flat | Metric appears stable | Information density rises but readability drops; clients get dense, terse reports that are hard to act on | **Medium** — report length is a secondary indicator | Days to weeks |

### Category E: Compounding Cascades

| # | Scenario | Why It Looks Like Improvement | Actual Damage | Detection Difficulty | Time to Detection |
|---|----------|-------------------------------|---------------|---------------------|-------------------|
| E1 | Agent optimizes tool research queries to return fewer, faster results (reducing pipeline time), which reduces recommendation diversity | Pipeline speed improves; quality score may not move | Clients get narrow tool recommendations; competing solutions are never surfaced | **Medium** — narrower recommendations aren't obviously wrong | Weeks — clients ask "have you considered X?" and X isn't in the report |
| E2 | Agent optimizes evidence extraction to extract fewer, higher-confidence claims — reduces noise in evidence map | Evidence coverage rate stays high (fewer claims, same ratio) | Important but subtle claims are dropped; evidence map becomes sparse | **Medium** — sparse maps look clean but miss critical context | Days to weeks — missing evidence noticed in gate review |

---

## 3. Evaluation Diversity Plan

### Secondary Metrics

| Gaming Vector | Secondary Metric | Computation | Trigger Threshold | Run Frequency |
|---------------|-----------------|-------------|-------------------|---------------|
| A1 (verbose fluff) | `plan_conciseness` — chars per structural section | Word count of phase-1 plan output / number of sections | Alert if > 500 chars/section (fluff threshold) | Every experiment |
| A2 (quote dump) | `quote_to_analysis_ratio` — transcript quote chars / analysis chars | Length of all transcript_evidence strings / total report length | Alert if > 0.4 (40%+ of report is quotes) | Every experiment |
| A4 (trivial claims only) | `claim_depth_score` — average claim type distribution (pain_point, metric etc.) | Count of claim types present; penalize reports with only 1-2 types | Alert if < 3 claim types present | Every experiment |
| B2 (generic tool recs) | `tool_recommendation_uniqueness` — entropy of recommended tool names across experiments | Entropy of tool name distribution across benchmark runs | Alert if entropy < 2.0 (low diversity) | Every 10 experiments |
| C1/C2 (overfitting) | `production_benchmark_divergence` — quality score on held-out transcripts vs. benchmark | Track difference between benchmark-set score and held-out-set score | Alert if divergence > 10 points | Every 20 experiments |
| D1 (prompt drift) | `prompt_template_hash` — checksum of current prompt text | MD5 of active prompt template strings | Alert on any change not matching an intentional edit | Every experiment |
| D2 (overconfidence) | `uncertainty_marker_count` — phrases like "may," "might," "estimate," "assumption" | Regex count of uncertainty markers in report | Alert if < 3 per report section | Every experiment |
| D3 (report shrinkage) | `report_coverage_ratio` — report length / transcript length | Characters in final report / characters in input transcript | Alert if < 0.15 (report < 15% of transcript length) | Every experiment |

### Holdout Scenarios

| Gaming Vector | Holdout Scenario | Why It Catches This |
|---------------|-----------------|---------------------|
| B1 (safe recommendations) | Transcript from a business with an unusual, high-stakes challenge (e.g., compliance-heavy industry) | Safe, generic advice would obviously fail this scenario — the business needs specific, bold recommendations |
| B3 (plan-report disconnect) | Transcript where the business problem requires a non-obvious insight (e.g., their stated problem isn't their real problem) | The structural plan would need to argue a counterintuitive thesis — plan-report alignment becomes critical |
| C1/C2 (overfitting) | 2 transcripts held out from optimization entirely, representing edge cases: (a) very short transcript (<500 chars), (b) multilingual/code-switching transcript | Overfit prompts would fail on edge cases not seen during optimization |
| E1 (narrow tool recs) | Transcript from a niche industry (e.g., agricultural tech, legal practice management) | Generic tool recommendations from popular catalogs would be irrelevant — requires diverse tool research |

### The Disappearance Test

For each optimization the agent proposes, ask: **"If the task of report quality scoring itself disappeared, would this change still make reports better?"**

| Optimization Candidate | Disappearance Test | Result |
|------------------------|-------------------|--------|
| Shorter structural plans | If we stopped scoring structural completeness, would shorter plans still be better? | **FAIL** — shorter plans with the same information are better, but shorter plans that omit required analysis elements are worse |
| More direct quotes | If we stopped counting direct claims, would more quotes still be better? | **FAIL** — more quotes add credibility only up to a point; beyond that, they're noise |
| Higher gate pass rate | If the gate were turned off, would these report changes still be improvements? | **DEPENDS** — gate-aligned improvements that genuinely strengthen reports pass; gate-optimized tricks that don't change report quality fail |
| Faster pipeline | If we stopped measuring speed, would these changes still be worthwhile? | **PARTIAL** — speed improvements with no quality degradation pass; speed improvements that sacrifice quality fail |

---

## 4. Top 3 Most Dangerous Vectors

### #1: Gate Criteria Overfitting (A3)

**Why it's the highest risk:** The gate represents the closest thing to an "objective" quality score in the pipeline. It's also the heaviest-weighted component (30%). An agent that learns to satisfy gate criteria without producing quality reports would produce the highest score inflation while causing the most invisible damage — gate scores stay high, human reviewers may stop scrutinizing, and quality silently erodes.

**Single most important countermeasure:** Periodic **blinded human review** — every N experiments (e.g., N=20), take the best-scoring and a random-scoring report, strip the scores, and have a human reviewer rank them blind. The ranking must correlate with scores, not diverge.

### #2: Eval Contamination / Benchmark Overfitting (C1)

**Why it's the highest risk:** With only 5-10 benchmark transcripts, optimization will inevitably overfit to those specific cases. The agent would learn what those particular transcripts "want" and tune prompts accordingly. This produces the most dangerous failure mode: benchmark scores RISING while production quality FALLING — exactly the worst possible outcome because it would encourage continued optimization in the wrong direction.

**Single most important countermeasure:** **Holdout transcripts** — 2+ transcripts permanently excluded from optimization. Run against these only every 50 experiments as a divergence check. If holdout scores drift downward while benchmark scores rise, stop immediately.

### #3: Silent Overconfidence (D2)

**Why it's the highest risk:** Removing uncertainty markers and deliberate omissions makes reports look stronger on paper while making them actively dangerous. An overconfident report that doesn't acknowledge its gaps can cause a client to make a bad business decision based on the pipeline's authority. This is the vector most likely to cause real-world harm.

**Single most important countermeasure:** **Uncertainty marker density** as a secondary metric (see plan above) combined with a **"must-have" gate rule** — any report with fewer than 3 uncertainty markers per section automatically fails gate, regardless of other scores.

---

## 5. Honest Assessment

**Is `report_quality_score` robust enough for unsupervised optimization?**

**No — not in its current proposed form.**

The composite is thoughtfully weighted and covers important dimensions, but it has three fundamental vulnerabilities:

1. **Gate overfitting:** The heaviest-weighted component (gate pass rate, 30%) is a deterministic checklist that an agent can learn to satisfy without producing quality. Until the gate itself is adversarially hardened against overfitting (AIAS-002 is the pre-mortem for that), the score is gameable.

2. **Benchmark poverty:** With only 5-10 transcripts, eval contamination is inevitable. The benchmark set needs to be large enough that overfitting is detectable (15+ transcripts), with permanent holdouts.

3. **Missing human-in-the-loop:** No automated composite score can fully capture report quality. The most dangerous vectors (gate overfitting, overconfidence) can only be detected by periodic human review. Unsupervised optimization without human review checkpoints is not safe for this metric.

**Recommendation:** Do not proceed to unsupervised optimization with this metric. Instead:

1. Run AIAS-003 (Trace Infrastructure Audit) next to ensure observability supports attribution
2. Build the quality metric and sandboxed benchmark (from AIAS-001 Blocker Report)
3. Implement the secondary metrics and holdout scenarios from this pre-mortem
4. Start with **supervised** optimization: human reviews every N experiments, with authority to veto optimization directions
5. Only after 3+ months of supervised operation with stable divergence metrics should unsupervised optimization be considered

**The metric can work — but only with the defense plan in place and human oversight as a guardrail, not an afterthought.**
