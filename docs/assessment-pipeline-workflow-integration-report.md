# AI Business Assessment Pipeline — Agentic Workflow Integration Analysis

**Date:** 2026-05-28  
**Source library:** `docs/agentic-workflows/` (68 directories, 155+ prompt files)  
**Target:** AI Business Assessment pipeline v1 (Intake → Tool Research → Evidence Extraction → LLM Analysis → 3 Gates → Save/Link → Email Delivery)

---

## Executive Summary

Of 155+ agentic workflow prompts across 68 thematic folders, **13 workflow families** (comprising 30+ individual prompts) have direct applicability to improving the AI Business Assessment pipeline. The highest-value opportunities cluster in three areas: **judge/gate hardening** (JLA suite), **intake quality** (AICC suite), and **retrieval/evidence rigor** (RRC suite). Several workflow families serve as prerequisite audits before undertaking any pipeline auto-optimization.

---

## 1. Judge Layer Architecture (JLA) — **CRITICAL PRIORITY**

**Folder:** `judge-layer-architecture/` | **5 prompts:** JLA-001 through JLA-005

### What It Does
A complete methodology for designing, writing, testing, and reviewing AI judge/validator layers in production agent systems. Based on the principle that "the judge layer IS the product" — every boundary where work can go wrong needs explicit, testable judgment.

| Prompt | Function |
|--------|----------|
| JLA-001 | Action Surface Audit — maps every action the agent can take, classifies by risk tier (read-only → reversible writes → external side effects → high-risk) |
| JLA-002 | Judge Criteria & Action Proposal Designer — defines what a judge must evaluate across authorization, evidence, exposure/risk, and policy dimensions |
| JLA-003 | Judge Prompt Writer — produces production-ready judge system prompts with structured outcomes (ALLOW/BLOCK/REVISE/ESCALATE) and anti-gaming protections |
| JLA-004 | Judge Evaluation Suite Generator — creates 20+ test cases across all outcome categories to verify judge reliability |
| JLA-005 | Judge Architecture Reviewer — holistic architecture review evaluating judge placement, failure modes, specialist judge needs, memory provenance, and human review calibration |

### Pipeline Fit
The current pipeline has three gates: **quick-wins-verification**, **major-project-verification**, and **report-review**. These gates were architected as structural checkpoints but have never been systematically evaluated for reliability.

- **JLA-001** would audit the full pipeline action surface (Perplexity tool research calls, LLM analysis generation, R2 writes, D1 writes, SendGrid emails)
- **JLA-002 + JLA-003** would produce testable judge prompts for each existing gate, replacing implicit "is this good enough?" with structured criteria
- **JLA-004** would generate an evaluation suite to verify each gate catches its target failure modes
- **JLA-005** would audit whether three gates are the right number, whether they're placed at optimal boundaries, and whether specialist judges should replace the current monolithic gate approach

### Expected Benefits
- Gates become auditable and improvable rather than opaque quality filters
- False-allow and false-block rates become measurable
- The pipeline gains a defense against specification gaming (the LLM learning to write persuasive-but-wrong assessments)
- Human review escalation becomes targeted rather than blanket

### Risks & Dependencies
- Requires the pipeline's action surface to be fully mapped first (JLA-001 is a prerequisite)
- Judge prompts add latency; lightweight judges for low-risk actions, thorough for high-risk
- Over-judging could create a bottleneck; the JLA-005 architecture review guards against this

### Implementation Priority: **1 (Immediate)**
Start with JLA-001 (action surface audit), then JLA-005 (architecture review) to confirm the 3-gate design before investing in JLA-003/JLA-004 (prompt writing and evals). The existing gates work — this makes them provably reliable.

---

## 2. AI Communication Clarity (AICC) — **HIGH PRIORITY**

**Folder:** `ai-communication-clarity/` | **3 prompts:** AICC-001 through AICC-003

### What It Does
A structured methodology for transforming fuzzy task descriptions into precise, actionable work briefs. Focuses on six fields: goal, context, sources, constraints, quality bar, and definition of done.

| Prompt | Function |
|--------|----------|
| AICC-001 | Useful Question Builder — conducts a natural conversation to extract the six fields from a vague ask and produces a self-contained work brief |
| AICC-002 | Vague Ask Auditor — diagnoses what's missing/ambiguous in an existing request and produces a rewritten version |
| AICC-003 | Definition-of-Done Generator — defines what "finished" looks like before work begins, with compact and expanded versions |

### Pipeline Fit
The intake phase (Annie chat + Retell voice) currently asks 10 questions. The quality of the entire downstream pipeline depends on how well those 10 questions extract actionable information.

- **AICC-001** could be used to audit and redesign Annie's question sequence, ensuring each question maps to a specific downstream need (tool research, LLM analysis, report generation)
- **AICC-002** could audit the aggregated intake transcript before it enters the pipeline, catching ambiguous answers that would produce generic output
- **AICC-003** could define what "a complete intake" means — when has Annie extracted enough to stop asking questions?

### Expected Benefits
- Higher-quality intake data reduces hallucination risk in downstream LLM analysis
- Clearer "definition of done" for intake prevents premature pipeline triggering
- The structured brief format could become the pipeline's internal representation of client context

### Risks & Dependencies
- Over-structuring could make the intake feel robotic; AICC-001's conversational design mitigates this
- Applying these to Retell (voice) intake requires adapting the six-field framework to spoken conversation patterns

### Implementation Priority: **2 (This sprint)**
Audit the current 10-question intake against the six-field framework using AICC-002, then refine with AICC-001.

---

## 3. RAG Retrieval Contracts (RRC) — **HIGH PRIORITY**

**Folder:** `rag-retrieval-contracts/` | **3 prompts:** RRC-001 through RRC-003

### What It Does
An engineering methodology for specifying exactly what a retrieval system must deliver before an agent starts acting. Based on seven contract dimensions: work object, retrieval units, authoritative sources, permissions, provenance, compiled context, and write-back.

| Prompt | Function |
|--------|----------|
| RRC-001 | Retrieval Contract Spec — produces a formal spec naming exact data sources, stale-tolerances, and what the contract rules out |
| RRC-002 | Retrieval Failure Triage — diagnoses specific production failures against seven failure modes, with minimum viable fixes |
| RRC-003 | Retrieval Stack ADR — formalizes architectural decisions implied by the retrieval contract |

### Pipeline Fit
The pipeline's **Tool Research** phase uses Perplexity to query Futurepedia/TAAFT for relevant AI tools. This is a retrieval problem with known failure modes:

- **Wrong retrieval unit** — Perplexity returns web-search results when the pipeline needs structured tool catalog entries
- **Non-authoritative source** — Futurepedia may be stale; TAAFT may differ; no source hierarchy is defined
- **Missing provenance** — tool recommendations in the final report can't be traced to which source and when

- **RRC-001** would produce a formal retrieval contract for the tool research phase, naming Futurepedia and TAAFT as sources with explicit stale-tolerances
- **RRC-002** would diagnose specific failures (e.g., "Perplexity returned 2023 articles when tools launched in 2025") and produce minimum fixes
- **RRC-003** would document architectural decisions for future maintainers

### Expected Benefits
- Tool recommendations gain source provenance (which catalog, when queried)
- Stale tool data becomes detectable rather than silently contaminating assessments
- The retrieval system becomes auditable — you can reconstruct why a specific tool was recommended

### Risks & Dependencies
- Requires Perplexity API to support structured queries (or a wrapper that enforces structure)
- May require maintaining a local cache of tool data to reduce dependency on live queries

### Implementation Priority: **3 (Next sprint)**
Start with RRC-001 (contract spec) for the tool research phase. RRC-002 is valuable post-incident; keep it in the debugging toolkit.

---

## 4. High-Capability Model Workflows (HCMW) — **HIGH PRIORITY**

**Folder:** `high-capability-model-workflows/` | **5 prompts:** HCMW-001 through HCMW-005

### What It Does
Workflows designed to exploit frontier model capabilities — multi-artifact output, structure-first drafting, validated data migrations, task routing, and stress testing.

| Prompt | Function |
|--------|----------|
| HCMW-001 | Stress Test Finder — finds tasks at the edge of what a model can handle, for capability evaluation |
| HCMW-002 | Multi-Artifact Work Package — produces complete deliverable sets (reports, spreadsheets, decks) from messy inputs |
| HCMW-003 | Validated Data Migration — compressed migration with human checkpoints preventing bad-data canonization |
| HCMW-004 | Structure-First Draft — fixes structural plan before writing, producing argument-driven rather than list-driven output |
| HCMW-005 | Task Router — routes tasks to the right model/tool/surface based on task properties, not brand loyalty |

### Pipeline Fit

- **HCMW-002 (Multi-Artifact Work Package)** is directly applicable to the report generation phase. The current pipeline produces a single assessment report; HCMW-002's methodology could extend this to produce an artifact contract (executive summary + detailed findings + tool matrix + implementation roadmap) with cross-artifact consistency checks
- **HCMW-004 (Structure-First Draft)** would improve the LLM Analysis phase. Instead of generating the report directly, the LLM would first produce a structural plan (thesis, argument movement, evidence placement), get approval, then write — preventing the common failure mode of AI-generated reports that are well-written lists without an argument
- **HCMW-005 (Task Router)** would optimize model selection across pipeline stages — which model for tool research, which for analysis, which for gate evaluation. The current pipeline uses Kimi/Ollama Cloud; HCMW-005 would produce a principled routing table

### Expected Benefits
- Report quality moves from "comprehensive list" to "argued assessment with evidence"
- Cross-artifact consistency (no contradictory recommendations between executive summary and detailed findings)
- Cost optimization through intelligent model routing

### Risks & Dependencies
- Multi-artifact output requires the LLM to maintain consistency across multiple generation calls
- Structure-first drafting adds a human-in-the-loop checkpoint that may slow the pipeline

### Implementation Priority: **4 (Within 2 sprints)**
Apply HCMW-004 (Structure-First Draft) to the LLM Analysis phase first; it's the highest-leverage single change. HCMW-005 (Task Router) is valuable but can follow.

---

## 5. Auto-Improving Agent Safety (AIAS) — **PREREQUISITE**

**Folder:** `auto-improving-agent-safety/` | **3 prompts:** AIAS-001 through AIAS-003

### What It Does
A gated diagnostic suite that evaluates whether a system is ready for automated optimization loops (the "Karpathy Loop" pattern). Three phases: editable surface, metric, and time budget — plus metric gaming pre-mortem and trace infrastructure audit.

| Prompt | Function |
|--------|----------|
| AIAS-001 | Karpathy Triplet Diagnostic — gated 4-phase evaluation: what would be modified, what metric would be optimized, what's the experiment cycle time. Produces either a program.md (if ready) or a Blocker Report |
| AIAS-002 | Metric-Gaming Pre-Mortem — adversarial analysis of how an optimization agent could inflate the metric without delivering business value. Produces gaming vectors, secondary metrics, and holdout scenarios |
| AIAS-003 | Trace Infrastructure Audit — evaluates 10 requirements for meta-agent observability (reasoning traces, tool call granularity, session reproducibility, etc.) |

### Pipeline Fit
These are **prerequisites before any autoresearch/auto-optimization** of the pipeline, not direct pipeline enhancements. The pipeline currently uses scripts like `bench-pipeline.mjs` and `test-model-variations.mjs` — suggesting optimization is already being explored.

- **AIAS-001** would determine whether the pipeline is even ready for automated optimization: what's the editable surface (prompts? model selection? gate criteria?), what's the metric (report quality? generation time? cost?), and what's the time budget per experiment
- **AIAS-002** would prevent optimization from gaming a poorly-chosen metric (e.g., optimizing for "report generation speed" at the expense of accuracy)
- **AIAS-003** would audit whether the pipeline's current logging supports attribution of improvements to specific changes

### Expected Benefits
- Prevents wasted effort on optimization loops that can't actually measure improvement
- Surfaces metric gaming vectors before they corrupt the pipeline
- Identifies observability gaps that would make optimization results untrustworthy

### Risks & Dependencies
- These are diagnostic tools, not implementation tools. They tell you whether you're ready, not how to build it
- AIAS-001 may produce a "not ready" verdict — that's the most valuable possible output

### Implementation Priority: **5 (Before any pipeline optimization work)**
Run AIAS-001 (Karpathy Triplet Diagnostic) on the pipeline before investing in autoresearch. If it produces a Blocker Report, address the blockers. If it produces a program.md, proceed to AIAS-002 and AIAS-003.

---

## 6. Code Verification Evals (CVE) — **MEDIUM PRIORITY**

**Folder:** `code-verification-evals/` | **2 prompts:** CVE-001, CVE-002

### What It Does
Audits codebase readiness for AI-powered adversarial review (CVE-001) and diagnoses the functional-vs-quality eval ratio in AI-generated code (CVE-002).

| Prompt | Function |
|--------|----------|
| CVE-001 | Codebase Verification Readiness Audit — scores codebase on modularity, test coverage, documentation, dependency health, tribal knowledge risk, and security model explicitness |
| CVE-002 | Eval Quality Diagnostic — diagnoses whether evaluation suite over-indexes on functional correctness and under-indexes on code quality |

### Pipeline Fit

- **CVE-002 (Eval Quality Diagnostic)** is the more relevant prompt. Applied to the pipeline's LLM output evaluation, it would diagnose whether the current gates check only functional correctness ("does this report contain the right sections?") versus quality ("is this report actually useful, readable, and well-structured?"). The prompt's core insight — "functional correctness tells you the code does what you asked; quality tells you whether the next system can actually read it" — maps directly to assessment reports

### Expected Benefits
- Identifies evaluation gaps beyond "correct JSON structure"
- Provides specific, implementable quality evals tailored to the pipeline's domain

### Risks & Dependencies
- Requires an existing evaluation suite or at least defined quality criteria

### Implementation Priority: **6 (After JLA gate hardening)**
Apply CVE-002 to the report-review gate after JLA-003/JLA-004 have formalized the gate criteria.

---

## 7. Office Files Evidence Workflow Guide (OFEWG) — **MEDIUM PRIORITY**

**Folder:** `office-files-evidence-workflow-guide/` | **12 prompts** (2 directly relevant)

### What It Does
A comprehensive methodology for working with Office files (Excel, PowerPoint) as evidence-bearing artifacts. Includes evidence mapping, formula risk scanning, brand validation, and pretty-but-wrong detection.

| Prompt | Function |
|--------|----------|
| OFEWG-009 | Evidence Map Builder — traces every claim in a deck/report to its source data (workbook tab, cell range, date range, assumptions) |
| OFEWG-012 | Pretty-But-Wrong Detector — scans for unsupported claims, numbers without sources, untraceable charts, assumptions-as-facts |

### Pipeline Fit

- **OFEWG-012 (Pretty-But-Wrong Detector)** applies directly to the report-review gate. The pipeline generates assessment reports with tool recommendations, implementation roadmaps, and ROI estimates — each claim should be traceable to either client intake data or tool research evidence. OFEWG-012 would catch:
  - Tool recommendations without source attribution
  - ROI estimates without calculation traceability
  - "Confident prose" masking insufficient evidence
- **OFEWG-009 (Evidence Map Builder)** would build a traceability matrix: for every claim in the final report, what's the source (intake answer #3, Futurepedia query result #7, LLM inference)?

### Expected Benefits
- Reports become defensible — every claim has a traceable source
- "Hallucinated confidence" becomes detectable
- Client questions ("why did you recommend this tool?") have traceable answers

### Risks & Dependencies
- Requires structured intermediate outputs from the pipeline to enable traceability
- OFEWG-009's methodology assumes Excel/PowerPoint format; adaptation needed for JSON/Markdown report format

### Implementation Priority: **7 (After JLA gate hardening)**
Apply OFEWG-012 methodology to the report-review gate. OFEWG-009 can follow as part of evidence pipeline improvements.

---

## 8. Workspace Agent Evaluation (WAE) — **MEDIUM PRIORITY**

**Folder:** `workspace-agent-evaluation/` | **2 prompts:** WAE-001, WAE-002

### What It Does
Evaluates whether a recurring workflow is suitable for ChatGPT Workspace Agent automation, with five diagnostic criteria (repeats on schedule, recognizable good vs. bad, describable in a paragraph, crosses 2+ tools, path is known). Produces build specifications for agent builders.

| Prompt | Function |
|--------|----------|
| WAE-001 | Workflow-Fit Diagnostic — scores a workflow against five criteria, delivers verdict (Fit / Different Tool / Resolve Ambiguity First) |
| WAE-002 | Build-Paragraph Generator — produces operational build spec with connectors, trigger schedule, output channel, and evaluation rubric |

### Pipeline Fit
Not directly applicable to the assessment pipeline itself, but valuable for **identifying adjacent automation opportunities**:

- **WAE-001** could evaluate recurring operational workflows around the pipeline: customer onboarding, report delivery follow-up, pipeline monitoring, incident response
- **WAE-002** would produce build specs for any workflows that pass the diagnostic

### Expected Benefits
- Identifies non-pipeline workflows that could be agent-automated without building custom infrastructure
- Forces clarity on "what does good look like" before automation begins

### Implementation Priority: **8 (Opportunistic)**
Apply WAE-001 to operational workflows as they become bottlenecks.

---

## 9. Model Migration Playbook (MMP) — **MEDIUM PRIORITY**

**Folder:** `model-migration-playbook/` | **3 prompts:** MMP-001 through MMP-003

### What It Does
A structured methodology for migrating between AI models, including pre-flight checks for breaking changes, cost impact estimation, and peer review workflow design. Originally written for Claude Opus 4.6→4.7 but the methodology generalizes.

| Prompt | Function |
|--------|----------|
| MMP-001 | Migration Pre-Flight Check — audits current setup against known breaking/silent changes in the target model |
| MMP-002 | Cost Impact Estimator — estimates token/cost changes from migration |
| MMP-003 | Peer Review Workflow Builder — designs review architectures exploiting model asymmetries |

### Pipeline Fit
The pipeline currently uses Kimi and Ollama Cloud for LLM analysis, with scripts testing DeepSeek and Gemini variations. Any model switch (e.g., moving from Kimi to Claude, or upgrading versions) would benefit from:

- **MMP-001** to audit pipeline prompts for constructs that rely on the current model's implicit behaviors
- **MMP-003** to design a multi-model review architecture where a different model reviews the primary model's output

### Expected Benefits
- Prevents silent quality degradation during model switches
- The peer review architecture (MMP-003) could add a cheap reviewer model as an additional quality gate

### Implementation Priority: **9 (On model change)**
Keep in toolkit for next model migration. MMP-003 (Peer Review) is worth exploring independently — adding a second model as reviewer for high-stakes assessments.

---

## 10. AI Knowledge Architecture (AKA) — **MEDIUM PRIORITY**

**Folder:** `ai-knowledge-architecture/` | **5 prompts** (1 directly relevant)

| Prompt | Function |
|--------|----------|
| AKA-004 | Knowledge Base Drift & Contradiction Auditor — finds contradictions, source drift, staleness, and gaps in knowledge bases |

### Pipeline Fit
The pipeline's tool research relies on Futurepedia and TAAFT as knowledge sources. Over time, these sources may accumulate contradictions (same tool rated differently across queries), drift (tool capabilities change but cached data doesn't), and staleness.

- **AKA-004** would periodically audit the pipeline's tool knowledge — either the cached data or the retrieval patterns — for contradictions and drift

### Expected Benefits
- Prevents the pipeline from recommending tools based on outdated capabilities
- Surfaces contradictions before they reach client reports

### Implementation Priority: **10 (Maintenance cadence)**
Apply AKA-004 as a periodic audit (monthly) on the tool research data.

---

## 11. Enterprise AI Implementation Architecture (EAIA) — **LOWER PRIORITY**

**Folder:** `enterprise-ai-implementation-architecture/` | **1 prompt**

| Prompt | Function |
|--------|----------|
| EAIA-001 | Implementation Architecture Audit — scores AI products on 6 components (workflow design, data access, authority, evaluation, audit trails, recovery). Produces a 0-12 score classifying products as Wrapper, Feature, Tool, or System of Action |

### Pipeline Fit
Not directly applicable to the pipeline itself, but valuable for:
- Competitive analysis of the AI Business Assessment product against alternatives
- Identifying which of the six components the assessment product needs to own vs. delegate to the model

### Expected Benefits
- Clear competitive positioning
- Identifies architectural gaps before customers do

### Implementation Priority: **11 (Strategic planning)**
Run when evaluating market positioning or investor readiness.

---

## 12. Explanation Artifacts (EA) — **LOWER PRIORITY**

**Folder:** `explanation-artifacts/` | **1 prompt**

| Prompt | Function |
|--------|----------|
| EA-001 | Explanation Artifact Builder — structured interview producing a 4-section artifact (What is this, Why this approach, What would break, What I learned) |

### Pipeline Fit
Valuable for **pipeline documentation and team knowledge transfer**:
- Apply to each pipeline stage to produce explanation artifacts that capture design rationale, known fragile points, and lessons learned
- Particularly valuable for the 3-gate architecture — documenting why each gate exists, what it catches, and what it misses

### Expected Benefits
- Reduces tribal knowledge dependency
- Onboarding documentation for new contributors
- Surfaces unexamined assumptions

### Implementation Priority: **12 (Documentation sprint)**
Apply during a dedicated documentation effort.

---

## 13. Human Moats (HMOAT) — **STRATEGIC**

**Folder:** `human-moats/` | **2 prompts** (1 relevant)

| Prompt | Function |
|--------|----------|
| HMOAT-002 | Agent Readiness Stress Test — stress tests whether a business/product is ready for AI agent adoption |

### Pipeline Fit
Strategic-level prompt. The AI Business Assessment product is itself an AI agent system; HMOAT-002 evaluates whether it's genuinely ready for the market it targets, or whether it's pushing AI into workflows that still need human judgment.

### Expected Benefits
- Reality check on product-market fit for AI-powered assessment
- Identifies which parts of the assessment should remain human-directed

### Implementation Priority: **13 (Strategic review)**
Run as part of quarterly strategic review.

---

## Consolidated Prioritization Matrix

| Priority | Workflow Family | Pipeline Stage(s) | Effort | Impact | Risk |
|----------|----------------|-------------------|--------|--------|------|
| **1** | Judge Layer Architecture (JLA) | 3 Gates | Medium | Critical | Low |
| **2** | AI Communication Clarity (AICC) | Intake | Low | High | Low |
| **3** | RAG Retrieval Contracts (RRC) | Tool Research | Medium | High | Medium |
| **4** | High-Capability Model Workflows (HCMW) | LLM Analysis, Report Gen | Medium | High | Low |
| **5** | Auto-Improving Agent Safety (AIAS) | Pre-optimization prerequisite | Low | Critical | N/A (diagnostic) |
| **6** | Code Verification Evals (CVE) | Report Review Gate | Low | Medium | Low |
| **7** | Office Files Evidence (OFEWG) | Report Review Gate | Medium | Medium | Low |
| **8** | Workspace Agent Eval (WAE) | Operational workflows | Low | Medium | Low |
| **9** | Model Migration Playbook (MMP) | Model selection | Low | Medium | Low |
| **10** | AI Knowledge Architecture (AKA) | Tool Research (maintenance) | Low | Medium | Low |
| **11** | Enterprise AI Impl. Arch. (EAIA) | Strategic | Low | Low-Medium | N/A |
| **12** | Explanation Artifacts (EA) | Documentation | Low | Low | N/A |
| **13** | Human Moats (HMOAT) | Strategic | Low | Medium | N/A |

---

## Recommended Implementation Sequence

### Phase 1: Foundation (This Sprint)
1. **JLA-001** — Audit the pipeline's full action surface and risk tiers
2. **AICC-002** — Audit the 10-question intake against the six-field framework
3. **AIAS-001** — Run the Karpathy Triplet Diagnostic before any optimization work

### Phase 2: Gate Hardening (Next Sprint)
4. **JLA-005** — Architecture review of the 3-gate design
5. **JLA-002 + JLA-003** — Produce testable judge prompts for each gate
6. **JLA-004** — Generate evaluation suites for gate reliability
7. **CVE-002** — Audit functional-vs-quality eval ratio at report-review gate

### Phase 3: Input & Evidence Quality (Within Month)
8. **AICC-001 + AICC-003** — Refine Annie's intake with structured briefs and definition-of-done
9. **RRC-001** — Produce retrieval contract for tool research phase
10. **HCMW-004** — Apply structure-first drafting to LLM Analysis phase

### Phase 4: Production Hardening (Within Quarter)
11. **OFEWG-012** — Apply pretty-but-wrong detection to report-review gate
12. **HCMW-002** — Multi-artifact work package for report generation
13. **RRC-002 + RRC-003** — Failure triage and ADR for retrieval system

### Phase 5: Ongoing
14. **AIAS-002 + AIAS-003** — If autoresearch proceeds, metric gaming pre-mortem and trace audit
15. **AKA-004** — Periodic tool knowledge drift audits
16. **MMP-001** — Pre-flight checks on model migrations
17. **EA-001** — Pipeline documentation via explanation artifacts
18. **HMOAT-002** — Quarterly strategic readiness review

---

## Workflows NOT Recommended (With Rationale)

The following 55 folders were reviewed and excluded:

- **Agent infrastructure/stack/control-layer workflows** (agent-control-layer-infrastructure, agent-stack-infrastructure, agent-tool-control-layer, etc.) — These address multi-agent deployment infrastructure; the current pipeline is a single-agent monolith
- **Consumer/creative AI workflows** (claude-design-prototyping, image-reasoning-stack, seven-day-ai-jumpstart-plan, etc.) — Not applicable to the assessment domain
- **Prompt engineering meta-workflows** (anthropic-prompt-engineering, state-of-prompt-engineering, etc.) — Valuable reference but not directly pipeline-applicable
- **Career/strategy workflows** (arbitrage-career-strategy, job-automation-risk-audit, etc.) — Not applicable
- **External tool workflows** (codex-plugin-builder, open-brain-extension-prompts, etc.) — Tool-specific, not pipeline-relevant
- **Single-use prompt libraries** (prompt-template-library, essential-prompts-organized-edition) — Individual prompts, not workflow methodologies

---

## Key Risks Not Addressed by Any Workflow

1. **Voice intake quality (Retell)** — No workflow specifically addresses voice-to-structured-data quality; the AICC suite is text-oriented
2. **Payment/subscription gating (Stripe)** — No workflow addresses payment flow reliability or failure modes
3. **Queue worker reliability** — The Cloudflare Queue consumer is deployed separately; no workflow addresses distributed worker coordination
4. **Multi-tenant data isolation** — No workflow addresses data leakage risks between client assessments

These should be addressed through standard engineering practices rather than agentic workflow integration.

---

*Report generated by analysis of 68 workflow folders in `docs/agentic-workflows/` against the current AI Business Assessment pipeline v1 architecture.*
