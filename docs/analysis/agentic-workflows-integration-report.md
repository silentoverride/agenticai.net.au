# Agentic Workflows for Assessment Pipeline — Integration Analysis

**Date:** 2026-05-28
**Scope:** `docs/agentic-workflows/` (155+ workflows across 44 categories)
**Pipeline:** Annie intake → Tool Research → Evidence Extraction → LLM Analysis → 3 Gates → Delivery

---

## Executive Summary

Of the 155+ agentic workflow prompts in `docs/agentic-workflows/`, **12 workflows** directly apply to improving the AI Business Assessment pipeline. Four are Tier 1 (already partially implemented or implementable in days), five are Tier 2 (high impact, 1-3 weeks), and three are Tier 3 (foundational infrastructure, 1-2 months).

The highest-impact gap is **gate evaluation rigor** — the judge-layer architecture workflows provide a systematic framework for validating that our three gates actually catch the failures they're designed for. The second gap is **Annie question quality** — the Useful Question Builder and Definition-of-Done Generator would systematically improve intake elicitation. The third is **auto-improvement safety** — if we pursue autoresearch optimization of the pipeline, the Karpathy Triplet Diagnostic and Metric-Gaming Pre-Mortem are prerequisites.

---

## Tier 1: Directly Applicable (days to implement)

These workflows map directly to existing pipeline components and would strengthen them with minimal effort.

### 1. JLA-003: Judge Prompt Writer

**Source:** `judge-layer-architecture/jla-003-v1-judge-prompt-writer.md`

**What it does:** A prompt engineering workflow that writes production-grade judge/validator prompts. It forces the designer to define: role clarity, structured input expectations, explicit criteria with pass/fail conditions, four decision outcomes (ALLOW/BLOCK/REVISE/ESCALATE), anti-gaming rules, and output format with reasoning chains.

**Where it fits:** Replaces or strengthens `src/lib/server/assessment/gate/definitions.ts`. Our three gate prompts already follow a similar structure (Parse → Score → Verdict) but the JLA workflow would add:

- Explicit REVISE outcome (currently we collapse revise into retry)
- Structured action proposal format for the actor (the LLM analysis should submit a structured "proposal" that the judge inspects, rather than receiving raw prose)
- Per-criterion passthrough rates for calibration monitoring
- Clearer distinction between "the judge evaluates claims against criteria" vs "the judge does a vibe check"

**Expected benefits:**
- More rigorous gate prompts with clearer failure tracing
- REVISE outcome would enable partial-block feedback loops (fix this specific thing, don't restart the whole report)
- Anti-gaming rules become more enforceable when criteria are explicitly testable

**Risks/dependencies:** The REVISE outcome requires the pipeline to support partial rework — currently we only have approve/block/retry/escalate. Adding REVISE means building a targeted fix mechanism. Start without it.

**Recommended priority:** **P1 — This week.** The prompt is essentially a spec for what we've already built. The main change is adding structured "action proposal" formatting to the LLM analysis output so the judge receives structured input, not raw prose.

---

### 2. JLA-004: Judge Evaluation Suite Generator

**Source:** `judge-layer-architecture/jla-004-v1-judge-evaluation-suite-generator.md`

**What it does:** Designs comprehensive eval suites for AI judge systems — 20+ test cases distributed across ALLOW, BLOCK, REVISE, and ESCALATE outcomes. Tests mundane boundary failures (not dramatized adversarial scenarios). Requires the judge criteria and action proposal format as inputs.

**Where it fits:** Extends `src/lib/server/assessment/calibration/` with systematic eval generation. Currently we have golden test cases but they're manually written and sparse. This workflow would generate a full eval suite for each gate:

- **Quick Wins gate:** 20+ test cases testing authorization creep (scope mismatch), tool hallucination (recommending unresearched tools), number grounding (estimates without customer anchors), over-promise language, regulated-domain risk
- **Major Projects gate:** 20+ test cases testing budget alignment (cost vs stated range), scale mismatch (enterprise tools for SMB), capability assumptions, ROI methodology
- **Report Review gate:** 20+ test cases testing evidence traceability (orphan claims), tool citation (hallucinated tools), PBW patterns, taste dimensions, safety violations

**Expected benefits:**
- Systematic coverage of failure modes — not just the ones we thought of manually
- Quantitative gate performance: false-allow rate, false-block rate, escalation rate per gate
- Regression testing when gate prompts are updated
- Confidence that gates actually catch what they claim to catch

**Risks/dependencies:** Requires stable gate criteria first (JLA-003). The eval cases need realistic assessment data — synthetic transcripts, partial reports, edge-case analyses. Building the eval harness to run these cases programmatically is ~1-2 days of engineering.

**Recommended priority:** **P1 — This week (after JLA-003).** Even 5-10 eval cases per gate would surface major gaps.

---

### 3. JLA-005: Judge Architecture Reviewer

**Source:** `judge-layer-architecture/jla-005-v1-judge-architecture-reviewer.md`

**What it does:** A systematic architecture review of the judge layer answering: (A) Are judges placed at every meaningful action boundary? (B) What failure modes exist — correlated judgment, specification gaming, escalation drift, latency/cost, version management? (C) Should specialists split from generalist judges? (D) Is memory provenance tracked? (E) Is human review real and calibrated?

**Where it fits:** Audits the current 3-gate architecture answering specific questions:

- **Correlated judgment:** All three gates run on the same model (GPT-5.5). If the model has a systematic blind spot (e.g., tendency to accept confident-sounding prose as evidence), all three gates share it. This is the single highest architecture risk.
- **Escalation drift:** In shadow mode, escalations are logged but never reach a human. When we move to blocking mode, who reviews escalated reports? What's the SLA?
- **Specialist judges:** Currently our gates mix authorization, evidence, risk, quality, and taste in single prompts. The reviewer would identify where splitting would improve reliability.
- **Memory provenance:** The evidence map has confidence tiers (direct/inferred/speculative) — this is provenance. But the gates don't distinguish between observed facts and agent inferences in the LLM analysis output.

**Expected benefits:**
- Structured risk assessment of the current gate architecture
- Prioritized remediation roadmap
- Identifies gaps before they cause incidents in production

**Risks/dependencies:** Requires honest, detailed description of the current system. The reviewer will find gaps — that's the point. Some gaps may be expensive to fix (e.g., switching to multiple judge models to break correlation).

**Recommended priority:** **P2 — Before moving gates to blocking mode.** Shadow-mode gates have no consequence for false allows. Before blocking mode gates can halt the pipeline, the architecture review is essential.

---

### 4. OFEWG-009 + OFEWG-012: Evidence Map Builder + Pretty-But-Wrong Detector

**Source:** `office-files-evidence-workflow-guide/ofewg-009-v1-evidence-map-builder.md`, `ofewg-012-v1-pretty-but-wrong-detector.md`

**What they do:** OFEWG-009 builds evidence maps tracing every claim to its source data. OFEWG-012 reads a deliverable as a skeptical reviewer, enumerating unsupported claims, stale data, assumptions-as-facts, and broken logic.

**Where they fit:** **Already partially implemented.** Our `evidence-map.ts` maps transcript claims. The report-review gate's Taste + PBW scoring dimensions implement OFEWG-012's skepticism. The remaining gap is tighter integration: the report-review gate currently scores taste dimensions (T1-T7) but the OFEWG-012 workflow's systematic "claim → source check" per section would be more rigorous than a holistic taste score.

**Improvement:** Add a pre-scoring phase to the report-review gate that enumerates every claim in each section and checks it against the evidence map (already done for A0/A0b but could be per-section systematic).

**Recommended priority:** **Already implemented.** Minor refinement only.

---

## Tier 2: High Impact (1-3 weeks)

These workflows address pipeline stages that currently exist but would be significantly improved.

### 5. AICC-001: Useful Question Builder

**Source:** `ai-communication-clarity/aicc-001-v1-useful-question-builder.md`

**What it does:** A structured workflow for turning fuzzy tasks into complete, delegable briefs. Works through six fields conversationally: Goal, Context, Sources, Constraints, Quality Bar, and Definition of Done. Produces a natural-language brief that can be handed to any executor (human or AI).

**Where it fits:** Annie's intake script (`src/lib/assessment/intake-script.ts`). Currently Annie asks 10 structured questions with follow-up probes. The Useful Question Builder workflow would improve: **the intake itself** — applying the six-field framework to ensure each question elicits Specific, Source-citable, Constraint-aware answers.

For example, Q4 (workflow_details) currently asks: "Walk me through a typical week. Pick the 2-3 most time-consuming tasks — roughly how many hours each, and who handles them?" After applying the Useful Question Builder framework, the question would be sharper: explicitly state the Goal (what this data enables), the Context (why specificity matters), the Constraints (estimates are fine, don't need exact numbers), and the Quality Bar (disaggregated hours, not monolithic "we spend 20 hours on admin").

**Expected benefits:**
- Higher-quality transcript data → better evidence map → stronger gate verification
- Follow-up probes that elicit specific, quotable statements rather than general complaints
- Customers who understand WHY each question matters answer more precisely

**Risks/dependencies:** Over-structuring the intake could feel like an interrogation. The Useful Question Builder's conversational approach (natural dialogue, not form-filling) must be preserved in Annie's voice.

**Recommended priority:** **P2 — Next sprint.** Apply the six-field framework to each of the 10 intake questions. Run A/B testing on question quality.

---

### 6. AICC-003: Definition-of-Done Generator

**Source:** `ai-communication-clarity/aicc-003-v1-definition-of-done-generator.md`

**What it does:** Produces a "definition of done" for any task — what the deliverable looks like, completeness criteria, quality standard, checkpoints, and boundaries. Designed to prevent the "looks done but isn't" failure mode.

**Where it fits:** Each pipeline stage should have a definition of done. Currently stages have implicit completion (function returns) but no explicit quality gate at each transition:

- **Stage 0 (Tool Research):** Done = ≥5 tools, ≥80% MVTD pass rate, no tool with missing critical fields
- **Stage 0.5 (Evidence Extraction):** Done = ≥5 direct claims, ≤3 speculative claims, gaps inventory populated
- **Stage 1 (LLM Analysis):** Done = All 7 sections present and non-empty, JSON parseable, no "TBD" placeholders
- **Stage 2+3 (Save + Link):** Done = R2 object created, D1 record linked, no errors
- **Stage 4 (Email):** Done = Email sent, no bounce, link valid

**Expected benefits:**
- Each stage validates its own output before handing to the next
- Catches basic failures earlier (before they reach the expensive gate evaluation)
- Enables partial rework — if LLM Analysis returns 5/7 sections, fix the missing sections without re-running tool research

**Risks/dependencies:** Adding stage-level validation increases pipeline latency. Balance: cheap validation (JSON parse, section count, null checks) at each stage; expensive validation (LLM-based gates) only at gate checkpoints.

**Recommended priority:** **P2 — Next sprint.** Start with Stage 1 (LLM Analysis) definition of done — it's the highest-variance stage.

---

### 7. AIAS-001 + AIAS-002: Karpathy Triplet Diagnostic + Metric-Gaming Pre-Mortem

**Source:** `auto-improving-agent-safety/aias-001-v1-the-karpathy-triplet-diagnostic.md`, `aias-002-v1-the-metric-gaming-pre-mortem.md`

**What they do:** AIAS-001 evaluates whether a system is ready for auto-improvement by checking three gates: editable surface (what the agent modifies), metric (what it optimizes), and time budget (how fast experiments run). AIAS-002 stress-tests the metric for gaming vectors — ways the optimizer could inflate the score without delivering real value.

**Where it fits:** The assessment pipeline has an autoresearch loop (`autoresearch-create` skill) but it was set up for general optimization, not pipeline-specific tuning. These workflows would:

- **AIAS-001:** Evaluate whether the pipeline IS ready for autoresearch. The editable surface would be: gate prompts (definitions.ts), tool lookup prompts (tool-lookup.ts), evidence extraction prompts (evidence-map.ts), LLM analysis prompts (llm-analysis.ts). The metric would be: gate approval rate, claim-evidence traceability score, or customer NPS. The time budget: each experiment requires running the full pipeline end-to-end with a test transcript → ~2-5 minutes.

- **AIAS-002:** For any metric we choose (e.g., "report-review gate approval rate"), find the gaming vectors. Example: if we optimize for approval rate, the pipeline might learn to produce reports that say nothing controversial → high approval but useless assessments. Or the LLM analysis might learn to echo the evidence map verbatim → high traceability but zero insight.

**Expected benefits:**
- Prevents optimizing for metrics that diverge from actual report quality
- Surfaces the "editable surface" problem — which pipeline components actually benefit from optimization vs which should be hand-tuned
- Honest assessment of whether the pipeline is ready for self-optimization

**Risks/dependencies:** Full application requires running the pipeline repeatedly, which costs Perplexity + OpenAI API credits. Start with a paper exercise (run the diagnostic prompts conversationally about the pipeline) before building automated experiments.

**Recommended priority:** **P2 — Before any autoresearch optimization of the pipeline.** The pre-mortem alone would prevent significant wasted experimentation.

---

### 8. EPOE-024: Automation Opportunity Scanner

**Source:** `essential-prompts-organized-edition/epoe-024-v1-automation-opportunity-scanner.md`

**What it does:** A structured workflow for identifying, prioritizing, and implementing automation opportunities. Decomposes workflows by task type, ranks candidates by ROI, provides week-by-week implementation roadmaps with specific tool recommendations and ROI calculations.

**Where it fits:** This is essentially a productized version of what the assessment pipeline produces for customers — it IS the assessment methodology in prompt form. Three applications:

1. **Self-serve assessment product:** Offer a lighter-weight version where customers run EPOE-024 themselves (guided by Annie) before committing to the full $1,200 assessment
2. **Assessment quality benchmark:** Use EPOE-024's output structure as a quality standard for our own assessments — if the assessment doesn't cover the same ground with the same rigor, it's underserving the customer
3. **Internal pipeline optimization:** Run EPOE-024 against the pipeline itself to identify automation opportunities in our own operations

**Expected benefits:**
- Product extension: self-serve assessment tier at lower price point
- Quality benchmark for full assessments
- Internal efficiency improvements

**Risks/dependencies:** Productizing as a self-serve tool requires UI/UX work, not just prompt deployment. The workflow assumes the user already has workflow data — our pipeline extracts this from transcripts, which is a fundamentally different starting point.

**Recommended priority:** **P3 — Product roadmap item, not pipeline improvement.** The methodology validation aspect (using EPOE-024 as a quality benchmark) can be done immediately.

---

### 9. WAE-001: Workflow-Fit Diagnostic

**Source:** `workspace-agent-evaluation/wae-001-v1-workflow-fit-diagnostic.md`

**What it does:** Evaluates whether a recurring workflow should be automated as a Workspace Agent, handled by a different tool, or needs further scoping. Scores against five criteria: repeats on schedule, recognizable good vs bad output, describable in a paragraph, crosses 2+ tools, and path is known.

**Where it fits:** Two applications:

1. **Assessment scoping:** Before running the full pipeline, evaluate whether the customer's business actually fits the assessment methodology. A customer with one-off needs (not recurring workflows) or novel work (not automatable patterns) should be flagged early.
2. **Pipeline stage evaluation:** Each pipeline stage (tool research, evidence extraction, LLM analysis, gate evaluation) can be evaluated for whether it's a good fit for agentic automation or should remain deterministic/supervised.

**Expected benefits:**
- Prevents running expensive assessments on businesses that won't benefit
- Identifies pipeline stages that should be moved from agentic to deterministic

**Risks/dependencies:** Applying this to customers requires analyzing the transcript before the full pipeline runs — essentially a pre-assessment triage step.

**Recommended priority:** **P3 — Pipeline stage evaluation first (no customer impact), then assessment scoping.**

---

## Tier 3: Foundational Infrastructure (1-2 months)

These workflows improve the pipeline's long-term maintainability and quality but don't directly change assessment output.

### 10. AIAS-003: Trace Infrastructure Audit

**Source:** `auto-improving-agent-safety/aias-003-v1-the-trace-infrastructure-audit.md` (not fully read but purpose is clear from README)

**What it does:** Audits whether an agent system has sufficient observability to support optimization — can you trace why a decision was made, what evidence was used, what alternatives were rejected?

**Where it fits:** The pipeline currently logs stage completions and gate verdicts but doesn't trace individual decisions. If the LLM analysis recommends "implement Xero + Zapier integration," there's no trace showing which evidence claim and which researched tool led to that recommendation. For auto-improvement, we'd need this trace to understand WHY recommendations change across experiments.

**Expected benefits:** Enables root-cause analysis of assessment quality issues, supports auto-improvement experiments

**Risks/dependencies:** Full trace infrastructure is a significant engineering investment (event sourcing, structured logging, trace storage/query). Start with adding `decision_trace` to the LLM analysis output format.

**Recommended priority:** **P3 — Start with decision trace in LLM output, build full infrastructure later.**

---

### 11. CVE-002: Eval Quality Diagnostic

**Source:** `code-verification-evals/cve-002-v1-eval-quality-diagnostic.md`

**What it does:** Evaluates whether a team's evals test the right things — specifically the balance between functional correctness (does it work?) and code quality (is it readable/maintainable?). For AI-generated code, the recommendation is at least 50% quality evals.

**Where it fits:** The pipeline codebase (`src/lib/server/assessment/`) has tests but they're functional (does the function return the right shape?). The Eval Quality Diagnostic would identify missing quality evals: Does the LLM analysis output pass a JSON schema check? Does the evidence map have the correct confidence distribution? Do gate verdicts follow the decision rules deterministically?

**Expected benefits:** Catches regressions when pipeline code changes, validates that AI-generated pipeline code meets quality standards

**Risks/dependencies:** Requires the team to define what "quality" means for each pipeline component. Some quality evals require running the full pipeline (expensive).

**Recommended priority:** **P3 — During next major pipeline refactor.**

---

### 12. codecomp-002 + codecomp-003: Context Layer Generator + Comprehension Gate

**Source:** `code-comprehension/codecomp-002-v1-context-layer-generator.md`, `codecomp-003-v1-comprehension-gate.md`

**What they do:** Context Layer Generator produces three artifacts per module — structural context (dependencies, data flows), semantic context (behavioral contracts), and philosophical context (why decisions were made). Comprehension Gate reviews code changes for system-level understanding (blast radius, side effects, implicit assumptions).

**Where it fits:** The pipeline codebase has ~500 lines per major file with implicit dependencies (Perplexity API, D1, R2, OpenAI). Context layers would make the pipeline maintainable by someone other than the original author. The Comprehension Gate would prevent changes that look correct locally but break pipeline stages — e.g., changing the tool-lookup response format would break LLM analysis prompt injection.

**Expected benefits:**
- Pipeline maintainability beyond original author
- Safer code changes with blast-radius analysis
- Onboarding documentation for new contributors

**Risks/dependencies:** Context layers are documentation — they go stale. Comprehension Gate is a review workflow, not an automated tool. Both require discipline to maintain.

**Recommended priority:** **P3 — During next major pipeline refactor.**

---

## Priority Roadmap

```
Week 1-2 (Tier 1):
├── JLA-003: Refine gate prompts with structured action proposal format
├── JLA-004: Build eval suite (10+ cases per gate)
└── Fix AICC-001 insights into Annie question wording

Week 3-4 (Tier 2):
├── JLA-005: Architecture review before blocking mode
├── AICC-003: Stage-level definitions of done (start with Stage 1)
└── AIAS-001+002: Paper exercise — is the pipeline ready for auto-optimization?

Month 2-3 (Tier 2 continued + Tier 3):
├── EPOE-024: Quality benchmark validation
├── WAE-001: Pipeline stage fitness evaluation
├── AIAS-003: Decision trace in LLM output
└── CVE-002 + codecomp: Infrastructure quality (opportunistic)

Month 4+ (Tier 3):
└── Full trace infrastructure, context layer documentation
```

---

## Workflows NOT Recommended

Several workflow categories were evaluated and rejected for the assessment pipeline:

- **Agent commerce control (AGCC):** Spending authorization — not applicable (no agent spending in current pipeline)
- **Agent platform risk (APRA, platrisks):** Enterprise deployment risk — applicable if we white-label, not now
- **AI memory architecture compression (AMAC, aimem):** GPU fleet optimization — not applicable (no GPU fleet)
- **AI structural shifts (ASSA, aishift):** Market analysis — interesting context but not pipeline-relevant
- **Calendar hygiene (CHS):** Personal productivity — not pipeline-relevant
- **Claude design prototyping (CDP):** UI/design workflows — not applicable to backend pipeline
- **Codex plugin builder (CPB):** Plugin development — not applicable
- **Consumer AI anticipation (CAAG except 004):** Product strategy — CAAG-004 (delegation audit) could be productized but not pipeline
- **Explanation artifacts (EA):** Communication tool — potentially useful for customer-facing report explanations but secondary
- **Human moats (HMAR, hmoat):** Business positioning — not pipeline-relevant
- **Image reasoning (IRS):** Visual design — not applicable
- **Job automation risk (JARA):** Career strategy — not pipeline-relevant
- **Marketing agent legibility (MAL):** Marketing analysis — potentially useful for go-to-market but not pipeline
- **Model migration (MMP):** Model switching — useful if we change LLM providers, currently not needed
- **Office files truth (OFTW):** Excel/PowerPoint workflows — partially applicable (OFEWG is the superset)
- **Open Brain extensions (OBEP):** Tool-specific — not applicable
- **Personal AI computer (PACP):** Hardware planning — not applicable
- **Product substrate (PSAR):** Product readiness — potentially applicable to assessment product strategy but not pipeline
- **Project file organization (PFO):** File management — minor applicability to report storage
- **Prompt stack (PSW):** Prompt engineering patterns — individually applicable but redundant with JLA and AICC
- **Public AI work sharing (PAWS):** Open-source workflow sharing — not applicable
- **RAG retrieval contracts (RRC):** Retrieval design — partially applicable to tool lookup but already superseded by MVTD
- **Semantic moat (semm, wps):** Product strategy — not pipeline-relevant
- **Seven-day AI jumpstart (SDAIJP):** Consumer onboarding — not pipeline-relevant
- **AI speed tooling (aispeed, astb):** Performance optimization — relevant metrics but addressed by autoresearch

---

## Key Insight

The most important finding: **our gate architecture is architecturally correct but unvalidated.** The judge-layer workflows (JLA-003, 004, 005) confirm we're on the right path — Parse → Score → Verdict, explicit criteria, anti-gaming rules, shadow/blocking modes. But they also reveal what's missing: systematic evaluation of the judges themselves. If the gates are the product's quality defense, we should be as rigorous about testing the gates as we are about testing the code they protect.
