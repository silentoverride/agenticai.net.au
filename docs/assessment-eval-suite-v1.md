# Assessment Report Eval Suite v1

> Built using the Domain-Specific Eval Writer workflow (`amdc-002-v1`).
> Target pipeline: `src/lib/server/assessment/pipeline.ts` stages 0–5 + gates.
> Status: **DRAFT** — requires Lorin/Agentic AI review before gate integration.

---

## Eval Overview

This eval suite protects against the AI Business Assessment's highest-risk failure: a report that reads well and passes JSON validation but makes organizationally or commercially wrong claims — recommendations unsupported by the transcript, hallucinated tools, invented ROI numbers, or regulated-adjacent advice. Every check is traceable to specific pipeline stages and gate definitions.

---

## Pre-Action Evals (before LLM generates the report)

These must pass before `stageLlmAnalysis` proceeds.

### PRE‑1: Transcript Sufficiency Check

- **Check:** The transcript contains at least one concrete statement about the business's workflow, tools, pain points, or pain frequency — not just identity/contact information.
- **Why this matters:** An empty or near-empty transcript produces hallucinated recommendations. The `edge-001` golden test case ("Not sure what to say…") must block.
- **How to check:** Count substantive customer utterances (lines not spoken by Agent/Annie, length > 20 chars). Require ≥ 3.
- **Failure action:** **BLOCK** — mark assessment as `needs_clarification`, notify operator, do not consume LLM tokens.

### PRE‑2: Tool Cache Freshness

- **Check:** The tool lookup cache (`src/lib/server/assessment/tool-cache.ts`) was refreshed within the last 7 days or a fresh Perplexity search was run for this job.
- **Why this matters:** Stale tool data produces recommendations for discontinued, rebranded, or changed-pricing tools. This is the "confident but wrong" failure.
- **How to check:** Compare `cacheUpdatedAt` timestamp against current time. Require ≤ 168 hours.
- **Failure action:** **RETRY** — force a fresh tool lookup before proceeding. If retry fails twice, proceed with a warning flag.

### PRE‑3: Budget and Timeline Detection

- **Check:** The transcript contains explicit or implicit budget information (e.g., "we spend $X on software," "I'd be comfortable investing $Y," "we have $Z set aside") AND timeline information (e.g., "within 3 months," "before next quarter," "we need it by X").
- **Why this matters:** Without budget/timeline signals, cost estimates are pure guesses. The `mp-001` golden test case shows a 10x budget mismatch must be caught.
- **How to check:** Scan for currency amounts ($, AUD, budget, spend, invest) and time-bounded phrases. If absent, flag.
- **Failure action:** **FLAG** — do not block, but mark `financial_impact` estimates as "low confidence — no explicit budget signal in transcript." Gate should lower confidence thresholds.

---

## In-Process Evals (during or immediately after LLM generation)

These run during or right after `stageLlmAnalysis`.

### IN‑1: Quick Win Traceability

- **Check:** Every `quick_wins[i].title` maps to at least one specific statement in the transcript. The mapping can be semantic (not exact text match).
- **Why this matters:** Quick wins are the primary value signal in the report. Hallucinated quick wins destroy report credibility and waste the client's time.
- **How to check:** Gate `quick-wins-verification` evaluates this. The current gate prompt is directionally correct. This eval should also check that ≥ 50% of quick wins have a confidence score ≥ 0.7.
- **Failure action:** **RETRY** — regenerating with stricter prompt instructions. After 2 retries, **BLOCK**.

### IN‑2: Tool Recommendation Provenance

- **Check:** Every `tool_recommendations[i].name` must either appear in the tool lookup results OR be a well-known tool that can be verified against the current market.
- **Why this matters:** The `qw-002` golden test case demonstrates hallucination risk: recommending an AI chatbot when the customer never mentioned support. Tool hallucinations are the most common LLM failure mode.
- **How to check:** Cross-reference tool names against the `AITool[]` results from `stageToolResearch`. Mark unmatched tools as "unverified — not in tool research results."
- **Failure action:** **REVISE** — strip unverified tools. If all tools are unverified, **BLOCK**.

### IN‑3: Financial Impact Internal Consistency

- **Check:** `financial_impact.annual_value_aud` ≈ `financial_impact.weekly_value_aud * 52` (±10%). `financial_impact.net_annual_value_aud` ≈ `annual_value_aud - (tool_costs_monthly_aud * 12)` (±15%).
- **Why this matters:** LLMs frequently produce arithmetic errors in JSON. The `mp-001` case shows budget mismatches must be caught. Internal inconsistency is a clear quality signal.
- **How to check:** Simple arithmetic validation. No LLM needed — deterministic.
- **Failure action:** **REVISE** — recalculate from hours_saved_per_week and hourly_rate. If recalculated values differ > 20% from LLM output, flag for human review.

### IN‑4: Category Consistency

- **Check:** `pain_points`, `quick_wins`, and `deeper_opportunities` cover related themes. If the transcript mentions invoicing as a pain point, at least one recommendation should address invoicing. If nothing addresses a stated pain point, flag.
- **Why this matters:** A report that identifies pain points but recommends solutions for different problems is the "technically valid, commercially wrong" failure.
- **How to check:** Semantic overlap between pain_point descriptions and recommendation descriptions. Gate `report-review` should check this.
- **Failure action:** **FLAG** — if > 1 pain point has no corresponding recommendation, mark for human review.

### IN‑5: Australian Market Relevance

- **Check:** Tool recommendations reference tools available in Australia. Pricing is in AUD. Implementation assumes Australian business context (GST, Fair Work, Australian Privacy Principles where relevant).
- **Why this matters:** The target market is explicitly Australian SMBs. Recommending US-only tools or USD pricing undermines credibility.
- **How to check:** Gate `report-review` should flag USD pricing, US-only tools, or non-Australian regulatory references.
- **Failure action:** **REVISE** — convert currency, replace region-locked tools. If pervasive, **BLOCK**.

---

## Post-Action Evals (after report generation, before delivery)

These run during `stageSaveReport` through `stageEmailDelivery`.

### POST‑1: Safety / Regulated Advice Scan

- **Check:** The report contains no content that could be interpreted as legal, financial, tax, medical, HR, or compliance advice. No statements like "you should," "we recommend you," or "the law requires" in regulated domains.
- **Why this matters:** This is the highest-risk failure. Agentic AI is an AI opportunity assessment, not a law firm or accounting practice. The voice-agent script explicitly disclaims this. The `rr-001` test case checks for safety issues.
- **How to check:** Gate `report-review` scans for regulated-domain language. Pattern matching for "legal," "tax," "compliance," "regulatory," "HR policy," "employment law," etc. combined with LLM semantic review.
- **Failure action:** **ESCALATE** — route to human operator immediately. Never auto-send a report that may contain regulated advice.

### POST‑2: Evidence Map Completeness

- **Check:** At least 60% of `quick_wins` and `deeper_opportunities` have traceable transcript evidence (specific customer statements, not inferred needs).
- **Why this matters:** This is the "pretty but wrong" prevention. A report with confident prose and beautiful formatting but weak evidence is the reputational risk.
- **How to check:** Gate `report-review` evaluates this per the existing gate definition. Additionally, evidence should be annotated in the report metadata.
- **Failure action:** Below 40% evidence coverage: **BLOCK**. 40–60%: **FLAG** for human review. Above 60%: **APPROVE**.

### POST‑3: Email Delivery Gating

- **Check:** The `report-review` gate passed with APPROVE verdict AND confidence ≥ 0.7 before triggering `sendReportReadyEmail`.
- **Why this matters:** Once the email is sent, errors are public. The email is the irreversible boundary.
- **How to check:** Check `GateRunResult.passed === true` and `GateRunResult.confidence >= 0.7` before calling `stageEmailDelivery`.
- **Failure action:** **BLOCK** email. Route to operator review queue. Never auto-send a gated report.

### POST‑4: No Default/Empty Report Delivery

- **Check:** The saved report is not a `createDefaultAnalysis()` fallback (all fields populated, `financial_impact.hours_saved_per_week > 0`).
- **Why this matters:** A default/error report delivered to a paying customer ($1,200 AUD) is a refund event and reputation damage.
- **How to check:** Validate `StructuredAnalysis` is populated. Check `hours_saved_per_week > 0`, `pain_points.length > 0`, `quick_wins.length > 0`.
- **Failure action:** **BLOCK** — do not deliver. Mark pipeline as failed, notify operator.

---

## Evals You'll Need to Update

These evals are time-sensitive and must be reviewed regularly:

| Eval | Review cadence | Why |
|------|---------------|-----|
| PRE-2 (Tool Cache Freshness) | Weekly | Tool market changes rapidly; URLs break, pricing shifts |
| IN-5 (AU Market Relevance) | Quarterly | New tools launch, region restrictions change |
| POST-1 (Safety Scan) | Monthly + after any legal review | Regulatory language sensitivity changes; escalate-on-new-pattern |
| IN-2 (Tool Provenance) | Per model update | Each model version hallucinates tools differently |
| POST-3 (Email Gating) | After any gate mode change | Shadow → blocking transition changes the risk profile |

---

## Context Documentation Needed

The following knowledge currently lives in Lorin's head and must be written down for these evals to work reliably:

| Knowledge | Current location | Suggested format |
|-----------|-----------------|------------------|
| "What makes a good vs. bad assessment report" | Lorin's consulting judgment | Institutional Taste Encoder rubric (see `aispeed-004-v1`) |
| Accepted tool categories and pricing bands for AU SMBs | Lorin's market knowledge | Structured tool catalogue in D1 or local knowledge base |
| Explicit boundaries for "not legal/financial advice" | Voice agent script (Annie) | Constraint spec — MUST NOT statements |
| Industry-specific "red flag" patterns | Lorin's domain experience | Tagged golden test cases per industry |
| Report quality calibration examples (3-5 real reports) | Lorin's review history | Golden test cases with scored expectations |
