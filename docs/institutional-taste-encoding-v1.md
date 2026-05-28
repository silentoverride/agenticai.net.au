# Agentic AI — Institutional Taste Encoding (Complete)

> Built from the Institutional Taste Encoder (`aispeed-004-v1`) interview with Lorin.
> Status: **COMPLETE** — ready for gate integration.
> Interview date: 2026-05-28

---

## Judgment Domain Summary

The core tacit judgment: **"Is this a credible, useful, and commercially sensible AI opportunity report for an Australian SMB owner?"** Encoded below as a concrete, testable rubric across 7 dimensions, with 4 structural checks that transcend any single dimension.

---

## 4 Structural Checks (apply to EVERY report)

These are not dimension-specific — they are preconditions that must be verified before any dimensional scoring matters.

### S1: The Monday Morning Test
> Can the owner walk in on Monday and start doing something based on this sentence?

Every recommendation, every quick win, every deeper opportunity. If the sentence survives, it's actionable. If not ("Leverage AI to streamline your operations"), it's not ready.

### S2: The Swap Test
> Replace the client's company name/industry with a completely different business. Does the sentence still make sense?

If yes, the sentence contains zero client-specific information. It's filler. Every sentence must contain at least one detail that would be wrong for a different business.

### S3: The Standardization Test
> Does the workflow the recommendation automates exist as a standardized process, or just as a collection of individual habits?

Before recommending automation of any workflow, check whether the transcript indicates the process is standardized — same steps, same sequence, same rules, regardless of who performs it. Signals it's not: "each agent has their own way," personal templates, inconsistency mentioned. When absent, recommendation should be "standardize first — then automate the standard version."

### S4: The Replay Test
> Can I walk the arithmetic chain from hours_saved to net_annual_value and verify every link?

The chain: hours_saved_per_week × hourly_rate_assumed_aud = weekly_value_aud × 52 = annual_value_aud − (tool_costs_monthly × 12) = net_annual_value_aud. Every link must be stated, sourced, and independently falsifiable by the client.

---

## 7 Dimensional Rubric

### 1. Evidence Grounding
*"Does the report prove it listened?"*

| Score | Descriptor |
|-------|-----------|
| **0-2 (Poor)** | Executive summary contains no auditable dollar amount. Quick wins use generic pain descriptors ("inefficiencies in scheduling"). No transcript quotes or timestamps. Evidence coverage < 40%. |
| **3-5 (Acceptable)** | At least one specific dollar amount present, but not disaggregated. Some transcript quotes but not timestamped. Evidence coverage 40-60%. |
| **6-7 (Good)** | Auditable dollar amount in executive summary with traceable provenance. Each quick win has ≥1 direct transcript quote. Hours-saved claims are disaggregated, not monolithic. Evidence coverage > 60%. |
| **8-10 (Excellent)** | Executive summary names a specific dollar loss the owner can verify against their payroll. Every hours-saved sub-claim is independently falsifiable ("20 min/invoice × 18 invoices/week"). The owner reads something and thinks "they actually listened." |

**Key signal:** The executive summary contains a dollar amount with traceable transcript provenance. Not "inefficiencies" — "$28K/year from manual appointment confirmations across 3 systems."

---

### 2. Recommendation Credibility
*"Are the recommendations things someone can actually do?"*

| Score | Descriptor |
|-------|-----------|
| **0-2 (Poor)** | Strategies disguised as steps ("Automate invoice processing with AI"). Multiple tool-category hallucinations (recommends "AI chatbot" not a specific product). Quick wins require procurement + training + ongoing maintenance. |
| **3-5 (Acceptable)** | Most quick wins are specific, but 1-2 are compressed projects. Some tools named but not priced. Effort labels match reality in majority of cases. |
| **6-7 (Good)** | Quick wins are single configuration changes in existing tools ("Turn on Jobber's after-hours auto-reply"). Each tool recommendation names a real product, real URL, real price. Free tier entry points specified where available. |
| **8-10 (Excellent)** | Every quick win can be done this Friday afternoon by a specific named person without clearing their diary or doing procurement. Each tool recommendation passes three checks: (1) exists now at that URL at that price, (2) team_size_fit matches client, (3) has free tier or low-commitment entry point. |

**Key signal:** "In your existing [ToolName], turn on…" — if that phrase works, it's a real quick win. If not, it's probably not low-effort.

---

### 3. Client-Specificity
*"Is this report about THIS business, or about businesses in general?"*

| Score | Descriptor |
|-------|-----------|
| **0-2 (Poor)** | Executive summary survives the swap test. Recommendations apply to any SMB. "As a growing business, you face the challenge of balancing operational efficiency with customer satisfaction." Filler eats attention budget. |
| **3-5 (Acceptable)** | Industry-appropriate language used, but 1-2 generic platitudes present. Some client-specific details but recommendations could apply to similar businesses. |
| **6-7 (Good)** | Industry, team size, and specific workflows reflected in every section. "Your competitors are already using AI" absent. Each section references at least one specific detail from the transcript. |
| **8-10 (Excellent)** | The #1 pain point by transcript coverage is the #1 recommendation by position. Tool recommendations match the client's stated channel (phone leads → voice agent, not website chatbot). Every sentence contains at least one detail that would be wrong for a different business. |

**Key signal:** The transcript's most-mentioned topic aligns with `quick_wins[0].title`. Channel specificity: if the client says "people call my mobile," the recommendation shouldn't be a website chatbot.

---

### 4. Financial Honesty
*"Are the numbers built, not generated?"*

| Score | Descriptor |
|-------|-----------|
| **0-2 (Poor)** | Guaranteed savings language ("This will save you $47K/year"). Monolithic hours-saved with no breakdown. hourly_rate_assumed_aud not stated. Tool costs buried in net figure. Savings < 30 min/week annualised into dollar figures. Owner opportunity cost used for junior employee time. |
| **3-5 (Acceptable)** | Hours broken down but not per-workflow. Rate stated but not sourced. Some tool costs disclosed. No guaranteed language. |
| **6-7 (Good)** | Full arithmetic chain visible and replayable. Hours disaggregated by workflow with independently falsifiable sub-claims ("6hrs invoicing + 5hrs scheduling + 3hrs reporting"). Rate stated with footnote. Tool costs broken out monthly. |
| **8-10 (Excellent)** | Time savings denominated — specifies whose hours and whether they're fungible. Owner time savings flagged for partial realisability (~30% conversion to revenue). Small savings (< 30 min/week) handled as quality-of-life notes, never annualised. Threshold discipline applied. |

**Key signal:** Every claim passes the Replay Test. The hourly rate is the most leveraged number — $20 error in rate = $14.5K error at 14hrs/week. It must be stated and sourced.

**Thresholds:**
- < 30 min/week → drop from financial impact, mention in prose only
- 30 min – 2 hrs/week → include with realisability qualifier
- > 2 hrs/week → include with confidence
- Exception: small saving that eliminates escalation risk → frame as risk reduction

---

### 5. AU Market Fit
*"Does this recommendation work for an Australian business?"*

| Score | Descriptor |
|-------|-----------|
| **0-2 (Poor)** | USD pricing throughout. Tools with no AU support presence. US-centric compliance templates (IRS, not ATO). Pricing model assumes US salary structure. |
| **3-5 (Acceptable)** | AUD pricing in most places but 1-2 USD slips. Some tools AU-available but not verified. AU-specific references present but not consistent. |
| **6-7 (Good)** | All pricing in AUD. All tools verified AU-available. Australian regulatory context where relevant (APPs, Fair Work, ATO). Tools without AU support flagged with explanation. |
| **8-10 (Excellent)** | AU alternatives preferred over international tools where equivalent exists. Credit card statement currency confusion avoided. Timezone-appropriate support expectations set. GST implications noted where relevant. |

**Key signal:** No tools recommended that would cause currency confusion on the credit card statement or have a 16-hour support timezone gap.

---

### 6. Tone & Communication
*"Does this sound like unhurried competence or vendor enthusiasm?"*

| Score | Descriptor |
|-------|-----------|
| **0-2 (Poor)** | Vendor marketing register: "Leverage AI to streamline operations," "powerful AI automation," "exciting opportunity," "your competitors are already using AI." Exclamation marks. Future-tense promises. "We recommend" in regulated domains. Superlatives. |
| **3-5 (Acceptable)** | Mostly professional but 1-2 buzzword instances. Some emotion words. Passive constructions where active would be clearer. |
| **6-7 (Good)** | No buzzword padding. No superlatives. No "will save" guarantees. Advisory not prescriptive. The owner feels recognised (concrete transcript language), then mobilised (specific, calm velocity). |
| **8-10 (Excellent)** | Reads like a GP delivering test results: confident, unhurried, no exclamation marks. The executive summary names the feeling using the client's own words. Every recommendation survives the Monday Morning Test. The word "recommend" never appears near a regulated domain. |

**Tone markers to enforce:**

| Marker | Wrong | Right |
|--------|-------|-------|
| Adjectives before nouns | "powerful AI automation" | "an automation that handles X" |
| Emotion words | "exciting opportunity" | "a practical next step" |
| Future tense | "AI will transform" | "This tool handles" |
| Superlatives | "your biggest opportunity" | "the first thing we'd address" |
| Second person | "you should" | "we'd recommend" |

---

### 7. Safety
*"Could this report create liability or harm?"*

| Score | Descriptor |
|-------|-----------|
| **0-2 (Poor)** | Regulated-domain advice ("Switch to a trust accounting structure"). Guaranteed savings language as promises. "We recommend" in proximity to legal/tax/HR/medical. "Your competitors are already using AI" as unverifiable claim. Data exposure beyond necessary PII. |
| **3-5 (Acceptable)** | No regulated advice but inadequate disclaimers. Some borderline language that could be misread. PII appropriately scoped. |
| **6-7 (Good)** | Clear differentiation between assessment recommendations and professional advice. Disclaimers present and specific. "We recommend" never appears near regulated domains. Adequate hedging on financial projections. |
| **8-10 (Excellent)** | Regulated domains identified but not advised on ("this is outside scope — should be reviewed separately"). Financial estimates framed as estimates with methodology, never as guarantees. The report cannot be mistaken for professional advice by a reasonable reader. |

---

## Four "Never" Rules

These are hard constraints, not scoring guidelines:

1. **Never** use "will save" — always "we estimate approximately" with methodology
2. **Never** use "We recommend" near a regulated domain (legal, tax, financial advice, HR, medical)
3. **Never** say "Your competitors are already using AI" — unverifiable, condescending
4. **Never** include savings < 30 min/week in financial impact — mention in prose only

---

## Trigger Checklist for Human Escalation

These patterns override automated scoring and require operator review:

1. **Regulated domain is the problem** — client's stated pain points are all inside a regulated function, not adjacent to one
2. **Contradictory ground truths** — two statements about the same factual attribute differ by more than rounding error
3. **Outside target market** — teamSize < 5 or > 50, or operational complexity implies larger org than stated headcount
4. **People problem framed as process problem** — "staff don't follow processes," "they go back to the old way"
5. **Budget signal is $0** — client can't action any recommendation worth making, and no free-tier tool quick wins exist

---

## Deployment

### Gate Integration

Inject into `report-review` gate as a supplementary evaluation dimension. The existing gate checks completeness (C1-C2), accuracy (A1-A3), and safety (S1-S3). Add:

```
Q4 — Taste alignment: Score the report against the 7-dimensional taste rubric below.
  - Evidence Grounding (1-10): ____
  - Recommendation Credibility (1-10): ____
  - Client-Specificity (1-10): ____
  - Financial Honesty (1-10): ____
  - AU Market Fit (1-10): ____
  - Tone & Communication (1-10): ____
  - Safety (1-10): ____

  Threshold: any dimension < 3 → RETRY. Average across all dimensions < 5 → RETRY.
  All dimensions ≥ 5 and average ≥ 7 → ALLOW.
```

### Golden Test Case Scoring

Score each dimension for every golden test case. Expected scores become calibration targets:
- `full-001` (happy path): all dimensions ≥ 7
- `pbw-001` (industry misfire): Client-Specificity ≤ 2
- `pbw-003` (scale mismatch): Recommendation Credibility ≤ 3, Financial Honesty ≤ 4

### Operator Training

Use the rubric as a shared language for report review. Two operators reviewing the same report should agree on dimension scores within ±1 point.

### Maintenance

Review quarterly. Update pricing thresholds, AU market tool availability, and regulated-domain boundaries as the offer and market evolve.
