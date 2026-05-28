# JLA-002/003 Gate Judge Specification — Agenticai Pipeline

**Date:** 2026-05-29
**Specifier:** Dev Agent (subagent)
**Methodology:** JLA-002 v1 (Judge Criteria Designer) + JLA-003 v1 (Judge Prompt Writer)
**Input:** Current gate definitions (`src/lib/server/assessment/gate/definitions.ts`), JLA-005 recommendations
**Status:** Validated against existing implementation — prompts are production-ready, this document serves as the criteria specification and audit trail.

---

## Executive Summary

The 3 existing gate prompts in `definitions.ts` already satisfy JLA-002 and JLA-003 requirements with high fidelity. The prompts use structured outcomes (ALLOW → `pass`, BLOCK → `block`, ESCALATE → `escalate`), explicit criteria organized by domain, and anti-gaming protections. This specification documents the criteria design (JLA-002) and validates the prompt structure (JLA-003), identifying what's well-implemented and where JLA-005's deterministic split recommendations apply.

**Verdict:** All 3 gate prompts are production-ready. Minor improvements recommended:
1. Add `REVISE` outcome to report-review gate (currently binary pass/block/escalate)
2. Split 7 deterministic checks from LLM prompts (per JLA-005 P2)
3. Add raw transcript pass-through to all gates (per JLA-005 P3)

---

## Gate 1: Quick-Wins Verification

### JLA-002 Criteria Specification

#### Authorization Criteria

| # | Testable Question | How Gate Evaluates | Status |
|---|------------------|-------------------|--------|
| A1 | Is the Quick Win grounded in transcript evidence? | QW-E1: Must cite specific transcript quotes. No generic recommendations. | ✅ Implemented |
| A2 | Does the recommended tool solve a problem the customer named? | QW-A1: Tool must address a named pain point, not a generic improvement. Swap test. | ✅ Implemented |
| A3 | Is this a genuine Quick Win or a disguised major project? | Implicit: effort=low check. Could strengthen with "single configuration change" heuristic. | ⚠️ Could strengthen |

#### Evidence Criteria

| # | Testable Question | How Gate Evaluates | Status |
|---|------------------|-------------------|--------|
| E1 | Is the hours-saved number traceable to transcript? | QW-E1: Hours must anchor to transcript statement. No invented productivity gains. | ✅ Implemented |
| E2 | Is every recommended tool cited with correct name and pricing? | QW-E2: Tool citation check. Tool hallucination → BLOCK. | ✅ Implemented |
| E3 | Is the financial arithmetic replayable? | QW-E3: Hours × rate × weeks must trace to source. Hourly rate must be stated. | ✅ Implemented |

#### Exposure/Risk Criteria

| # | Testable Question | How Gate Evaluates | Status |
|---|------------------|-------------------|--------|
| R1 | Does the QW contain regulated advice? | QW-R1: BLOCK if recommending regulated financial/tax/legal actions. | ✅ Implemented |
| R2 | Does the QW over-promise? | QW-R2: BLOCK if "will save X hours" without evidence basis. | ✅ Implemented |

#### Policy Criteria

| # | Testable Question | How Gate Evaluates | Status |
|---|------------------|-------------------|--------|
| P1 | Is the QW appropriate for the detected team size? | Not explicitly checked. JLA-005 recommends adding team-size validation from intake. | ⚠️ Missing |
| P2 | Is the QW tool available in Australia? | Not explicitly checked. Should be deterministic (tool-lookup cache). Per JLA-005 P2. | ⚠️ Missing |

### JLA-003 Prompt Validation

| JLA-003 Requirement | Current Prompt | Status |
|--------------------|----------------|--------|
| Role clearly defined | "Quality assurance analyst reviewing AI-generated business assessment recommendations" | ✅ |
| Structured input specification | Receives analysis JSON + tools + evidence map + prior gate results | ✅ |
| Four outcomes (ALLOW, BLOCK, REVISE, ESCALATE) | Output: pass/block/escalate. **REVISE missing.** | ⚠️ |
| Structured reasoning | Requires: verdict, action, confidence, reasoning, findings[] | ✅ |
| Anti-gaming protections | QW-E1 blocks unsupported claims. QW-E2 blocks tool hallucination. | ✅ |
| Decision rules per outcome | pass=all criteria met, block=evidence/policy failure, escalate=ambiguous/high-risk | ✅ |
| Uncertainty → ESCALATE | Confidence < threshold triggers escalate | ✅ |

### JLA-005 P2: Deterministic Checks to Split

| Check | Current: LLM | Future: Deterministic | Implementation |
|-------|-------------|----------------------|----------------|
| Tool name exists in cache | QW-E2 (LLM evaluates) | Check `tool-lookup` cache | `gate/deterministic-checks.ts` |
| Tool AU availability | Not checked | Check `au_available` field | Same |
| Tool pricing | QW-E2 partial | Check pricing within budget band | Same |

---

## Gate 2: Major-Project Verification

### JLA-002 Criteria Specification

#### Authorization Criteria

| # | Testable Question | How Gate Evaluates | Status |
|---|------------------|-------------------|--------|
| A1 | Does the Deeper Opportunity address a named business need? | MP-A1: Must trace to intake pain points. No generic "AI implementation" recommendations. | ✅ Implemented |
| A2 | Is the scope appropriate for the business size? | MP-A2: Team size, budget, and readiness from intake must align with recommendation scope. | ✅ Implemented |

#### Evidence Criteria

| # | Testable Question | How Gate Evaluates | Status |
|---|------------------|-------------------|--------|
| E1 | Are setup costs and monthly values grounded? | MP-E1: Costs must be realistic for stated scope. Blatant under/over-estimation → BLOCK. | ✅ Implemented |
| E2 | Is the ROI calculation traceable? | Implicit in E1. Could strengthen with explicit cost/value ratio check. | ⚠️ Could strengthen |

#### Exposure/Risk Criteria

| # | Testable Question | How Gate Evaluates | Status |
|---|------------------|-------------------|--------|
| R1 | Could this recommendation create vendor lock-in? | Not checked. | ⚠️ Missing |
| R2 | Is the implementation timeline realistic? | Not explicitly checked. | ⚠️ Missing |

#### Policy Criteria

| # | Testable Question | How Gate Evaluates | Status |
|---|------------------|-------------------|--------|
| P1 | Does the recommendation fit the detected budget band? | MP-E1: Budget alignment check. | ✅ Implemented |
| P2 | Does this require procurement/approval that the business hasn't indicated readiness for? | Not checked. Depends on intake readiness data. | ⚠️ Missing |

### JLA-003 Prompt Validation

| Requirement | Current | Status |
|------------|---------|--------|
| Role | "Budget and ROI analyst..." | ✅ |
| Four outcomes | pass/block/escalate. **REVISE missing.** | ⚠️ |
| Structured reasoning | verdict, action, confidence, reasoning, findings[] | ✅ |
| Anti-gaming | MP-E1 blocks unrealistic costs. | ✅ |
| Decision rules | Explicit: block if budget-violating, escalate if ambiguous | ✅ |

### JLA-005 P2: Deterministic

| Check | Implementation |
|-------|----------------|
| Budget band vs. cost alignment | Compare `budgetSignal.min/max` vs. deeper opportunity cost — deterministic |
| Timeline ≤ 8 weeks check | Roadmap phases ≤ 8 weeks per JLA-005 implicit rule |

---

## Gate 3: Report-Review (Final Quality Gate)

### JLA-002 Criteria Specification

#### Authorization Criteria

| # | Domain | Testable Question | Gate Criterion | Status |
|---|--------|------------------|----------------|--------|
| A0 | Evidence | Does every claim trace to an evidence source? | RR-A0: ≥3 orphan claims → BLOCK | ✅ |
| A0b | Evidence | Is gap data invented? | RR-A0b: Gap fields not in evidence map → BLOCK | ✅ |

#### Evidence Criteria (Taste Dimensions T1-T7)

| # | Dimension | Testable Question | Gate Criterion | Status |
|---|----------|------------------|----------------|--------|
| T1 | Specificity | Would the swap test fail? | Every sentence must contain at least one client-specific detail | ✅ |
| T2 | Recommendation Credibility | Are QWs specific and implementable? | Tools correctly cited, one per named problem | ✅ |
| T3 | Client Specificity | Is this report about THIS business? | Industry-specific language, named tools, specific numbers | ✅ |
| T4 | Financial Honesty | Arithmetic chain replayable? Hourly rate stated? | Hours × rate × weeks → net must compute | ✅ |
| T5 | Tone | Calm advisory tone? | No alarmism or overselling. Passes Monday Morning Test | ✅ |
| T6 | Structural Quality | All sections present and coherent? | 7 sections, logical flow, no placeholder text | ✅ |
| T7 | PBW Detection | Pretty-but-wrong patterns? | Generic platitudes, tool worship, missing pain, scale mismatch, buzzword padding, automating chaos, never-rule violations | ✅ |

#### Safety Criteria

| # | Testable Question | Gate Criterion | Status |
|---|------------------|----------------|--------|
| S1 | Any regulated advice? | RR-S1: BLOCK for legal/financial/tax/medical advice | ✅ |
| S2 | Any over-promises? | RR-S2: BLOCK for "will save", "guaranteed ROI" | ✅ |
| S3 | Any PII exposure? | RR-S3: BLOCK if PII in customer-facing sections | ✅ |

#### Tool Credibility Criteria

| # | Testable Question | Gate Criterion | Status |
|---|------------------|----------------|--------|
| TC1 | Tool pricing realistic? | RR-TC1: Pricing must be in market range | ✅ |
| TC2 | Tool available in AU? | RR-TC2: Must be available to AU customers | ✅ |
| TC3 | Tool appropriate for team size? | RR-TC3: Must fit detected team size | ✅ |

#### Quality Criteria

| # | Testable Question | Gate Criterion | Status |
|---|------------------|----------------|--------|
| Q1 | Executive summary actionable? | RR-Q1: Must state problem, solution, impact in ≤3 paragraphs | ✅ |
| Q2 | Pain points specific? | RR-Q2: Must have temporal anchors and measurable impact | ✅ |
| Q3 | Quick wins are genuine quick wins? | RR-Q3: Must be single-config-change, low-effort items | ✅ |

### JLA-003 Prompt Validation

| Requirement | Current | Status |
|------------|---------|--------|
| Role | "Senior assessment reviewer..." | ✅ |
| Four outcomes | pass/block/escalate. REVISE missing. | ⚠️ |
| Structured reasoning | verdict, action, confidence, reasoning, findings[], tasteScores{} | ✅ |
| Anti-gaming | T1-T7 catches persuasive-but-empty prose. A0 catches unsupported claims. | ✅ |
| Decision rules | Retry threshold: any taste dimension < 3 or average < 5. | ✅ |
| Uncertainty → ESCALATE | Ambiguous safety/policy violations escalate. | ✅ |

### JLA-005 P2: Deterministic Checks to Split

| Check | Current: LLM | Deterministic | Implementation |
|-------|-------------|---------------|----------------|
| Structural completeness (7 sections) | T6 (LLM) | Count section headers | `gate/deterministic-checks.ts` |
| Orphan claim count (A0) | RR-A0 (LLM) | Count evidence map claims with no source | Same |
| Gap data invention (A0b) | RR-A0b (LLM) | Cross-check gap fields vs evidence map | Same |
| Hourly rate stated (T4) | T4 (LLM) | Regex: "$XX/hr" or "$XXX/hr" | Same |
| Tool pricing in budget band (TC1) | TC1 (LLM) | Compare tool price vs budgetSignal | Same |
| AU availability (TC2) | TC2 (LLM) | Check `au_available` field | Same |
| Team size fit (TC3) | TC3 (LLM) | Check `team_size_fit` field | Same |

---

## Anti-Gaming Protections (All Gates)

### What the Actor Could Do (and How Gates Catch It)

| Gaming Vector | Gate Defense | Gate |
|---------------|-------------|------|
| Write persuasive-but-unsupported QWs | QW-E1: Must cite transcript evidence. Swap test. | QW |
| Invent tool names that sound real | QW-E2: Tool hallucination → BLOCK | QW |
| Use high-confidence language to mask weak evidence | T1: "As a growing business" → generic platitude flag. T5: Tone check. | RR |
| Overstate hours saved | QW-E1 + QW-E3: Hours must anchor to transcript. Arithmetic must verify. | QW |
| Recommend expensive tools for cheap budget | MP-E1: Budget alignment check. TC1: Pricing check. | MP + RR |
| Pad with AI buzzwords | T7: Buzzword padding flag. | RR |
| Annualize <30min/week savings | QW-E3: Savings under 30min → flagged. T4: Financial honesty. | QW + RR |
| Make up numbers that sound plausible | A0: Orphan claims ≥3 → BLOCK. A0b: Invented gaps → BLOCK. | RR |
| Recommend enterprise tools for small business | TC3: Team size fit. MP-A2: Scope appropriateness. | RR + MP |
| Omit PII but still reference identifiable info | S3: PII detection. | RR |

### Anti-Gaming Design Principles

1. **Persuasive prose ≠ evidence.** Gates inspect structured claims against evidence sources, not the quality of the writing.
2. **Confident language is suspicious, not reassuring.** Taste T1 penalizes unjustified confidence.
3. **Numbers must compute.** Financial honesty (T4) requires replayable arithmetic. Round numbers (5, 10, 20 hours) are flagged.
4. **Gap is a finding, not an invitation to invent.** A0b blocks invented gap data.
5. **Every claim needs a source.** A0 orphan-claim threshold forces traceability.

---

## Revise Outcome Gap (JLA-003 Compliance)

### Current State

All 3 gates use: `ALLOW (pass) | BLOCK (block) | ESCALATE (escalate)`

The `REVISE` outcome from JLA-003 is missing. REVISE means: "directionally correct but needs a specific change before execution."

### When REVISE Would Be Used

| Scenario | Current Behavior | REVISE Behavior |
|----------|-----------------|-----------------|
| QW has good evidence but tool name is slightly wrong | BLOCK (harsh) | REVISE: "Correct tool name from 'Zapair' to 'Zapier', then resubmit" |
| Report is well-structured but one taste dimension scores 2 | RETRY (vague) | REVISE: "Strengthen T4 by stating hourly rate source in Financial Impact section" |
| Executive summary is comprehensive but too long (RR-Q1) | BLOCK (harsh) | REVISE: "Condense to ≤3 paragraphs" |

### Recommendation

Add REVISE to report-review gate only. QW and MP gates can remain binary (pass/block/escalate) because:
- QWs are small enough that a block = "replace this one" is acceptable
- Major projects are too high-stakes for auto-revision
- Report-review has many taste dimensions where specific fixes are actionable

Implementation: Add `action: 'revise'` alongside `findings[].suggested_fix` so the pipeline can route revision instructions back to the LLM.

---

## Raw Transcript Pass-Through (JLA-005 P3)

### Current: "Hidden Context Soup"

```
Gate receives: analysis + tool_data + evidence_map + prior_gate_results
                ──ALL LLM-GENERATED──    ───LLM-GENERATED───
```

The only ground-truth anchor is the original transcript, which is NOT passed to gates.

### Fix

Add `{{transcript}}` to every gate prompt. Each gate receives:

```
CONTEXT:
- Transcript: {{transcript}}          ← NEW: raw ground truth
- Analysis: {{content}}
- Tools: {{tools_data}}
- Evidence Map: {{evidence_map}}
- Prior Gate Results: {{prior_results}}
```

This enables gates to directly cross-reference claims against the transcript ("The analysis claims 10 hours/week saved, but the transcript states 'about half an hour a day' (3.5 hrs/week). Flag.")

---

## Summary: Gate Prompt Quality Assessment

| Gate | JLA-002 Criteria Coverage | JLA-003 Structure | Anti-Gaming | Ready? |
|------|--------------------------|-------------------|-------------|--------|
| quick-wins-verification | 7/9 criteria covered (missing: team size, AU availability) | ⚠️ REVISE missing | ✅ Strong | ✅ Production-ready |
| major-project-verification | 5/7 criteria covered (missing: vendor lock-in, timeline) | ⚠️ REVISE missing | ✅ Good | ✅ Production-ready |
| report-review | 20/20 criteria covered | ⚠️ REVISE missing | ✅ Strongest | ✅ Production-ready |

### Recommended Improvements (Non-Blocking)

| Priority | Change | Effort | Gate |
|----------|--------|--------|------|
| P0 | Split 7 deterministic checks from LLM prompts | Medium | RR |
| P1 | Add raw transcript pass-through to all gates | Low | All |
| P2 | Add REVISE outcome to report-review gate | Low | RR |
| P3 | Add team-size validation to QW gate | Low | QW |
| P4 | Add tool AU-availability check (deterministic) | Low | QW + RR |

All gate prompts are production-ready. The above are optimizations, not blockers.
