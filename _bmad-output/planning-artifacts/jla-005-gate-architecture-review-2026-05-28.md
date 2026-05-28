# JLA-005 — Gate Architecture Review

**Date:** 2026-05-28  
**Inputs:** Phase 1 JLA-001 action surface map, gate definitions (`definitions.ts`), gate runner (`runner.ts`), pipeline composition (`pipeline.ts`)  
**Methodology:** Systematic review of gate specialization, boundary correctness, criteria overlap, and pipeline integration against JLA-001 action inventory

---

## 1. Gate Specialization Assessment

### Current Gate Architecture

| Gate | Evaluates | Input | Position in Pipeline |
|------|-----------|-------|---------------------|
| quick-wins-verification | Quick Win recommendations vs. transcript evidence | Raw transcript | After Evidence Extraction, **before** LLM Analysis |
| major-project-verification | Deeper Opportunity recommendations vs. evidence + budget | Analysis output | After LLM Analysis, before Save |
| report-review | Complete briefing quality, accuracy, safety, taste, PBW patterns | Analysis + Evidence Map + Tools | After Save/Link, before Email |

### Specialist vs. Monolithic Verdict

**Current design: Specialist.** Three gates each evaluate a distinct pipeline artifact. This is correct.

**Specialist advantages (present):**
- Each gate has focused criteria (7 criteria for QW, 8 for MP, 15+ for RR)
- Gate failures are diagnosable (you know WHICH gate blocked and why)
- Gates can be independently killed/disabled via env vars
- Gate costs are bounded per-stage

**Monolithic would be worse because:**
- One catch-all gate evaluating the entire pipeline would need 30+ criteria → diluted attention, lower confidence per criterion
- Harder to diagnose failures ("gate blocked, but which part?")
- Single point of failure — if the monolithic gate is wrong, everything is blocked with no partial signal

**Verdict: Specialist design is correct.** ✅

---

## 2. Gate Boundary Correctness

### ❌ FINDING 1: Quick-Wins Verification Gate — Sequencing Error

**The problem:**

The quick-wins-verification gate runs at pipeline position:
```
Evidence Extraction → [quick-wins-verification gate] → LLM Analysis
```

But its system prompt says:
> "You receive: 1. The Quick Win recommendations **extracted from the report**..."

The Quick Wins haven't been generated yet. The LLM analysis (which produces Quick Wins as part of the structured output) runs AFTER this gate. The gate receives only raw transcript — it cannot evaluate Quick Wins that don't exist yet.

**What actually happens:** The gate receives `content: job.transcript` (raw transcript) and tries to evaluate it. Since no Quick Wins are present, the gate either:
- Parses zero claims → approves vacuously (worst case — false positive)
- Treats the transcript itself as "the report" and hallucinates a verdict (unreliable)

**This is a sequencing bug.** The gate is at the wrong position.

**Fix:** Move quick-wins-verification gate to AFTER LLM analysis, or change its prompt to be a pre-analysis evidence quality check instead of a Quick Win evaluation.

**Recommendation: Split into two distinct gates:**

| Gate | Position | Evaluates | Content |
|------|----------|-----------|---------|
| **intake-quality** (NEW) | Before LLM Analysis | Is the transcript sufficient to support ANY Quick Wins? Minimum evidence density. | Raw transcript |
| **quick-wins-verification** (REPOSITIONED) | After LLM Analysis | Are the generated Quick Wins supported by transcript evidence? Tool grounding. | Analysis output + transcript |

The current "quick-wins-verification" prompt already describes a post-analysis gate. Its position is wrong.

### ✅ FINDING 2: Major-Project Verification Gate — Correctly Positioned

Runs after LLM analysis on the analysis output. Content is `analysis` (the full report). Evaluates Deeper Opportunity recommendations. Position is correct.

### ⚠️ FINDING 3: Report-Review Gate — Correct Position, Too Broad Scope

Runs after save/link, before email. This is the correct boundary — it's the last gate before customer-visible output.

**Correct aspects:**
- Position: ✅ (before email delivery, after all content generation)
- Content: ✅ (full analysis + evidence map + tools — has everything needed)
- Role: ✅ (holistic quality gate)

**Problem: Too many criteria in a single GPT-5.5 call.**

The report-review gate evaluates:
- Completeness: C1, C2 (2 criteria)
- Accuracy: A0, A0b, A1, A2, A3 (5 criteria)
- Tool Citation: TC1, TC2, TC3 (3 criteria)
- Safety: S1, S2, S3 (3 criteria)
- Quality: Q1, Q2, Q3 (3 criteria)
- Taste: T1–T7 (7 dimensions, scored 1-10)
- PBW Patterns: P1–P8 (8 patterns, scored 1-5)
- Verdict aggregation (1 final decision)

**Total: 32 scoring operations in a single ~45s GPT-5.5 call.**

The risk: attention dilution. The model may score some criteria correctly and others sloppily depending on which appear earlier in the prompt. A report that's excellent on structure but has a subtle PBW pattern may get approved because the model doesn't reach deep into the PBW section.

**Recommendation: Monitor, don't split yet.** The gate is too broad in theory, but splitting increases cost (3 GPT-5.5 calls instead of 1) and latency (+90s). The right approach is:
1. Deploy current gate in shadow mode
2. Collect gate run records (which criteria fail most often? which are never triggered?)
3. Split only after data shows which dimensions need dedicated attention

**The blocking logic implemented in Phase 1 mitigation handles this correctly** — even a broad gate catching one critical failure (e.g., tool hallucination TC1) will block email delivery. The risk isn't false negatives (gate missing problems), it's false positives (gate blocking a good report due to diluted attention on one marginal criterion).

---

## 3. Criteria Overlap Analysis

### Overlapping Criteria Between Gates

| Criterion Pair | Gate 1 | Gate 2 | Severity | Resolution |
|----------------|--------|--------|----------|------------|
| Tool grounding / researched provenance | QW-E2: "If a Quick Win names specific tools, does each tool appear in the researched tools list?" | RR-TC1: "Every tool named... must appear in the researched tools list... ≥1 unverified tool name = fail" | **Direct overlap** — both gates check the same thing | **Deconflict**: QW gate checks Quick Win tools specifically. RR gate checks ALL tools in the report. Keep both but clarify scope in prompts: QW-E2 is "tools named in Quick Wins section," RR-TC1 is "all tools named anywhere in report." Add to prompt: "This gate checks Quick Win tools ONLY. Report-wide tool verification happens in the report-review gate." |
| Evidence traceability | QW-E1: "Can you identify the specific transcript line(s) that support it?" | RR-A0: "Can each substantive claim... be traced to a specific entry ID in the evidence map?" | **Functional overlap** — same concept, different granularity | **Accept**: QW gate checks QUICK WIN evidence specifically against raw transcript. RR gate checks ALL claims against the structured evidence map (more precise). They operate at different resolution levels. |
| Budget alignment | MP-E1: "If budget stated and cost > 3x budget = fail" | RR-T4 (financial honesty): "Full arithmetic chain replayable? Hourly rate stated and sourced?" | **Partial overlap** — MP checks budget-vs-cost, RR checks financial arithmetic quality | **Accept**: MP gate is a structural check (does the cost fit the budget?). RR gate is a quality check (is the cost calculation honest and traceable?). Complementary, not redundant. |
| Number grounding | QW-E3: "If a Quick Win includes time-saved or cost estimates, are those estimates derived from numbers the customer stated?" | RR-T4 (financial honesty): similar concept across the full report | **Partial overlap** | **Accept**: Same rationale as above. QW checks Quick Wins specifically. RR checks full report. |

**Verdict: Overlap is mostly structural vs. quality — acceptable.** ✅

The only concerning overlap is QW-E2 ↔ RR-TC1 (tool names). Both gates claim to catch tool hallucinations. The fix is scope clarification in the prompts, not gate removal.

---

## 4. Gate-to-Gate Communication

### ❌ FINDING 4: Prior Gate Results Not Passed to Subsequent Gates

The report-review prompt states:
> "4. Results from the quick-wins-verification and major-project-verification gates, **if available**."

But the pipeline has **no mechanism to pass prior gate results** to `runGateCheckpoint()`. The content is a string — it's `analysis + formatEvidenceMapForPrompt(...) + formatToolsForPrompt(...)`.

Prior gate results are never included. If a prior gate flagged a tool hallucination, the report-review gate has no way to know and must re-derive it from scratch.

**Fix:** Add a `priorGateResults` parameter to `runGateCheckpoint()` or inject prior gate results into the content string before the report-review gate.

```typescript
// After running QW and MP gates:
const priorGateResults = `\n\n---\n## Prior Gate Results\n\n` +
  `### Quick Wins Verification\nVerdict: ${qwResult.verdict}\n` +
  `### Major Project Verification\nVerdict: ${mpResult.verdict}\n`;

// Pass to report-review:
const reviewContent = analysis +
  formatEvidenceMapForPrompt(evidenceMap, budgetSignal) +
  formatToolsForPrompt(tools, budgetSignal) +
  priorGateResults; // ← NEW
```

This is a small change with outsized impact — the report-review gate can skip re-verifying what prior gates already confirmed.

**Cost savings:** If QW gate already verified 3 of 4 tools, RR gate can focus on the 4th tool + holistic quality. Currently, RR gate re-verifies all 4 tools from scratch.

---

## 5. Missing Gates

### FINDING 5: No Intake Quality Gate

From AICC-002: the pipeline triggers on webhook, not on intake quality. A customer who hangs up at Q3 triggers the full pipeline with incomplete evidence.

**Missing gate:** `intake-quality` — validates that the transcript has sufficient evidence density before pipeline launch.

**Criteria:**
- Minimum transcript length (characters)
- Minimum 5 questions answered with substantive responses
- Budget signal detected (or explicitly "not stated" — explicit absence is different from missing)
- At least one specific, quotable pain point with temporal anchor ("this week," "last month")
- At least one tool named

**Position:** Before Stage 0 (Tool Research). This is a pre-pipeline gate that could be lightweight (regex + keyword check, no LLM call needed) or LLM-based.

**Recommendation:** Implement as a lightweight pre-check in the webhook handler, not as a full GPT-5.5 gate. A simple function `isIntakeSufficient(transcript, intakeProgress)` that returns `{ sufficient: boolean, gaps: string[] }` is sufficient.

### FINDING 6: No Transcription Quality Gate

Voice intake (Retell) produces transcripts that may contain errors. Misrecognized tool names ("HubSpot" → "hub spot") produce wrong tool citations downstream.

**Missing gate:** `transcription-quality` — validates that the transcript is accurate enough for tool citation.

This is hard to implement without a reference audio. Recommendation: defer. For now, add a warning to the report-review gate's safety criteria about known transcription failure modes. If the report-review gate sees a tool name that doesn't match anything in the researched list, it should consider "transcription error" as a possible cause and escalate rather than block.

---

## 6. Anti-Gaming Assessment

### Current Anti-Gaming Rules

The gate definitions include explicit anti-gaming rules:

- **Evaluate CLAIMS, not PROSE** — confident language ≠ evidence
- **Uncertainty → escalate** — do not default to approve
- **Sparse transcript does not authorize gap-filling** — assumptions are not evidence
- **Tool hallucination is a hard block** — ≥1 unverified tool = fail
- **Gap handling is scored** — inventing a number is worse than flagging a gap
- **Internal inconsistency is a strong signal** — contradiction → flag
- **Paid product quality bar** — $1,200 AUD value means generic/vague is not acceptable

**Assessment: These are well-chosen.** ✅

**Additional rule recommended:**
> "The absence of a problem is not proof of correctness. If the report doesn't mention a tool's pricing, that is not evidence the tool is free — it's an information gap. Mark TC3 as 'unverifiable' in this case."

This closes a subtle gaming path: the LLM analysis could "accidentally" omit tool pricing for expensive tools to avoid pricing accuracy failures.

---

## 7. Architect's Verdict

| Dimension | Assessment | Action |
|-----------|------------|--------|
| **Specialist vs. Monolithic** | ✅ Correct — specialist is right choice | None |
| **Gate boundaries** | ❌ QW gate positioned BEFORE analysis but expects report content | Move QW gate to after LLM analysis. Add intake-quality pre-check. |
| **Report-review scope** | ⚠️ Too broad (32 scoring ops in one call) but splitting premature | Monitor in shadow mode. Split only after data. |
| **Criteria overlap** | ✅ Acceptable — structural vs. quality overlap is deliberate | Clarify QW-E2 vs. RR-TC1 scope in prompts |
| **Gate communication** | ❌ Prior gate results not passed to subsequent gates | Inject priorGateResults into report-review content |
| **Missing gates** | ❌ No intake-quality gate, no transcription-quality gate | Add lightweight intake-quality pre-check. Defer transcription gate. |
| **Anti-gaming** | ✅ Well-chosen rules | Add "absent pricing ≠ free" rule |

### Priority Actions

| Priority | Finding | Action | Files |
|----------|---------|--------|-------|
| **P0** | QW gate sequencing bug | Move QW gate to after LLM analysis OR split into intake-quality (pre) + QW-verification (post) | `pipeline.ts`, `definitions.ts` |
| **P1** | Gate results not communicated | Inject prior gate results into report-review content string | `pipeline.ts` |
| **P2** | No intake quality check | Add `isIntakeSufficient()` pre-check in webhook handler | New: `intake-quality-check.ts` |
| **P3** | QW-E2 vs RR-TC1 scope ambiguity | Clarify scope in respective prompts | `definitions.ts` |
| **P4** | Anti-gaming gap | Add "absent pricing ≠ free" rule | `definitions.ts` |
| **P5** | Report-review scope monitoring | Deploy, collect failure data, evaluate splitting | Future epic |
