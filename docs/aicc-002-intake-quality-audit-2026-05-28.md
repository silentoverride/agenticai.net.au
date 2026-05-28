# AICC-002 Intake Quality Audit — Annie's Intake Scripts

**Date:** 2026-05-28  
**Methodology:** AICC-002 Vague Ask Auditor (systematic application)  
**Targets:** `src/lib/assessment/intake-script.ts` (text/chat) and `docs/voice-agent-script.md` (voice/Retell)  
**Cross-reference:** `src/lib/server/assessment/intake-quality-check.ts` (existing quality check)

---

## Executive Summary

Annie's intake has **two distinct implementations with significant asymmetry**: a 6-question text script (`intake-script.ts`) and a 12-section voice script (`voice-agent-script.md`). The AICC six-field audit finds:

- **Goal**: Adequate but implicit in text; explicit in voice
- **Context**: Adequate with documentation gaps
- **Sources**: Adequate for voice; ambiguous for text (no gate criteria mapping in code)
- **Constraints**: **Missing from text script entirely** (voice script has guardrails — text script has none)
- **Quality bar**: **Missing from both** — no standard for what constitutes a "good enough" answer
- **Definition of done**: **Missing from both** — `checkIntakeSufficiency()` exists post-hoc but neither script defines completion

**Critical finding:** `intake-quality-check.ts` references question IDs (`workflow_details`, `concrete_metrics`) that **do not exist** in the actual intake script. The `feedsGateCriteria` field described in documentation does not exist in the code. These are documentation-code mismatches.

**Most concerning gap:** The text intake script has **zero guardrails**. Unlike the voice script (which explicitly prohibits regulated topics, sensitive data requests, and prescribing solutions), the text script has no constraints section. Annie (chat) could theoretically ask about tax strategies, recommend specific tools, or request passwords — nothing in the code prevents this.

---

## 1. What's Here (Fields Adequately Covered)

### Goal — ADEQUATE (Voice: Strong; Text: Adequate)

**Voice script** has an explicit Goals section naming 6 objectives: understand business model, identify workflow headaches, capture software stack, quantify repeated tasks, identify quick-win candidates, confirm constraints.

**Text script** has an implicit goal. The header docstring states: "structured question tree for business context capture." The `IntakeQuestion` interface provides structure: `id`, `topic`, `question`, `followUps`, `required`. But there's no explicit statement of "why these 6 questions produce a pipeline-ready intake."

**Evidence:**
- Voice script §"Conversation Goals" — 6 explicit objectives, each traceable to pipeline stages
- Text script header docstring — "structured question tree for business context capture"
- `IntakeQuestion.topic` — provides topic categorization

**What's working:** Both scripts have a clear purpose. The voice script's explicit goal mapping is stronger.

### Context — ADEQUATE

**Voice script** provides rich context: Agent Role, Voice and Tone, Guardrails, Disclaimer, Call Flow sections, a Mock Conversation, and Recovery Prompts. A new developer reading the voice script would understand the full intake interaction model.

**Text script** provides adequate structural context: typed interfaces (`IntakeQuestion`, `IntakeProgress`, `ChatMessage`), `required` flags, `followUps` with keyword matching. The `getFollowUp()` function provides dynamic probing logic.

**Evidence:**
- Voice script: 400+ lines covering role, tone, guardrails, flow, recovery, examples
- Text script: `IntakeQuestion` interface, `getFollowUp()` function, `TOTAL_QUESTIONS` constant
- `IntakeProgress` interface provides session tracking structure

**What's working:** A developer can understand the intake flow from either script. The voice script is more comprehensive.

### Sources — ADEQUATE (Voice) / AMBIGUOUS (Text)

**Voice script** explicitly maps intake to pipeline outputs in the Handoff Summary Format: Business, Caller, Role, Email, Phone, Company, Team size, Industry, Customers, Current tools, Top pain points, Repeated tasks, Lead/customer response workflow, Knowledge/documentation gaps, Reporting/visibility gaps, Estimated time loss, Revenue/customer impact, Constraints, Strong quick-win candidates, Potential implementation candidates, Open questions.

**Text script** has no explicit source hierarchy. The `questions` array has `topic` fields but no mapping to downstream pipeline stages. **The `feedsGateCriteria` field described in the story file documentation does not exist in the actual code.** There is no gate criteria cross-reference in the code.

**Evidence:**
- Voice script: Handoff Summary Format with 19 fields mapping to pipeline artifact inputs
- Text script: `topic` field on each question — implicit categorization, no downstream mapping
- Text script: NO `feedsGateCriteria`, NO header cross-reference table

**What's working:** The voice script's Handoff Summary Format provides excellent traceability to pipeline stages. The text script's `topic` field is a lightweight proxy but insufficient for gate criteria traceability.

---

## 2. What's Missing (Fields Absent or Too Vague)

### Constraints — MISSING (Text Script) / ADEQUATE (Voice Script)

**Critical gap: The text intake script has ZERO guardrails.**

**Voice script** has a comprehensive Guardrails section:
- Do not recommend specific tools during the intake call
- Do not diagnose legal, medical, financial, tax, or compliance issues
- Do not ask for passwords, API keys, bank details, or sensitive customer records
- If sensitive information comes up, ask the caller to describe the workflow without sharing private details
- Do not criticise the caller's current process
- If the caller asks for pricing, say the assessment team can confirm scope after reviewing the transcript
- If the caller asks whether AI can solve everything, explain the assessment will separate practical quick wins from ideas

**Text script** has no constraints. None. The chat Annie has no guardrails preventing:
- Asking about regulated topics (tax strategy, legal compliance, financial advice)
- Recommending specific tools during intake
- Requesting sensitive data (passwords, API keys, bank details)
- Criticizing the user's current workflow
- Making promises about savings or outcomes
- Collecting PII beyond what's necessary

**Downstream risk:** Without text-script guardrails, the LLM generating Annie's chat responses could ask "What's your tax strategy?" or "What's your Xero password?" — producing non-compliant transcripts that trigger safety gate failures or, worse, pass through gates because the gate can't catch conversational guardrail violations.

**What intake change would capture this:**
- Add a `Guardrails` section to `intake-script.ts` header comment
- Add a `constraints` field to the `IntakeQuestion` interface or a system prompt wrapper
- Wire guardrails into the chat webhook handler at `src/routes/api/stripe/webhook/+server.ts` as a system message before Annie's prompt

### Quality Bar — MISSING (Both Scripts)

Neither script defines what "good enough" means for an answer. There is no standard for:

**For numeric answers (Q1 team size, Q5 budget):**
- Is "a few people" acceptable, or must the user say "5 full-time, 2 casual"?
- Is "around a few hundred a month" for budget sufficient?
- Is "we lose some leads when we're slow" specific enough for Q3 pain points?

**For tool answers (Q2):**
- Is "we use Google Workspace and spreadsheets" sufficient?
- Does "we tried HubSpot once but didn't like it" count as a tool answer?

**For pain point answers (Q3):**
- Is "admin tasks take too long" sufficient without naming which tasks?
- Must the answer include time estimates or recent examples?

**Downstream risk:** Without a quality bar, the LLM generates Annie's chat responses without knowing when to probe vs. accept. The pipeline receives transcripts with varying evidence density. Some transcripts enable high-quality reports (Marketing Agency example: "Every Monday I spend 3-4 hours pulling data from Google Analytics, Meta Ads, and our scheduling tool"). Others produce vague reports (Lorie Test Business: "manual spreadsheet data entry" — no specifics). The quality bar determines which bucket each intake lands in.

**Note:** `checkIntakeSufficiency()` provides a post-hoc structural check (minimum transcript length, keyword detection) but this is a binary gate, not a quality bar. It catches completely empty intakes but doesn't differentiate "adequate" from "excellent."

**What intake change would capture this:**
- Add answer quality guidelines per question type
- Define minimum specificity standards: numeric ranges need actual numbers, pain points need frequency + impact, tools need named products
- Add probe escalation logic: if answer doesn't meet quality bar, Annie asks a more specific follow-up (similar to how `getFollowUp()` works today with keyword matching, but triggered by insufficiency instead of keyword match)

### Definition of Done — MISSING (Both Scripts)

Neither script defines when intake is "complete enough" to trigger the pipeline.

**Voice script** ends with a Close section: "Thanks, that gives us useful context. The next step is for the assessment team to review this conversation..." This is a conversational close but not a definition of done.

**Text script** has `TOTAL_QUESTIONS = INTAKE_SCRIPT.length` (which is 6). An intake with 6 answers (even trivial ones) is considered "complete" from the script's perspective.

**`checkIntakeSufficiency()`** provides a structural check but it operates at the webhook handler level, not the script level. And it has a critical mismatch (see §4).

**Downstream risk:** A user who answers all 6 questions with one-word answers triggers the pipeline. The pipeline spends ~$0.30-0.50 in LLM costs and produces a low-quality report. The user paid $1,200 AUD for this.

**What intake change would capture this:**
- Define minimum answer quality per question before proceeding
- Add explicit completion criteria: "Intake is complete when Q1-Q5 have substantive answers containing specific numbers, named tools, or time-anchored examples"
- Surface completion status in `IntakeProgress` interface (currently `completed: boolean` is just "all questions answered" — need "all questions answered with sufficient quality")

---

## 3. What's Ambiguous

### Ambiguity 1: Compound Questions (Both Scripts, Q1-Q4)

**Q1 (text)**: "What does your business do, and what's your role there? Tell me a bit about the team size and how long you've been operating."

This is a **four-part question** packed into one turn:
1. What does your business do?
2. What's your role?
3. Team size?
4. How long operating?

In chat, users typically answer the first part ("we do events") and skip the rest. In voice, a caller answering naturally will likely skip at least two of the four parts. The voice script handles this better by separating these into individual turns in the mock conversation.

**Alternative interpretations:**
- A user who answers only "we organize corporate events" — is the answer incomplete, or did they intentionally skip role/team/time?
- Annie (chat) has no mechanism to detect which sub-questions were answered and re-ask the missed ones
- The `followUps` mechanism only triggers on keyword matches, not on omissions

**Downstream stage affected:** Evidence extraction (no team size → can't compute staff count for tool fit), LLM analysis (no operating history → can't contextualize business maturity)

**Consequence:** Missed evidence — gate criteria QW-A1 (stated need) and MP-A2 (business context) receive incomplete signals.

### Ambiguity 2: Budget Framing (Text Q5, Voice §11)

**Text Q5**: "For improving your business with AI and automation, what's a comfortable monthly investment range? Are you thinking a small subscription, a few hundred, or more significant investment?"

This framing has two interpretative problems:

1. **"Comfortable" is ambiguous.** A user says "$200" — is that their maximum budget or their starting point? The pipeline's budget alignment check (`computeBudgetAlignment()`) treats this as a hard constraint, but "comfortable" implies there's room above it.

2. **The examples ("small subscription, a few hundred") anchor the answer low.** A user who might spend $1,000/month hears "a few hundred" and says "$300." The anchoring effect biases answers downward.

**Downstream stage affected:** Budget detection (`budget-detection.ts`), budget alignment check, MP-E1 gate criterion (budget alignment)

**Consequence of misinterpretation:** Pipeline rejects tools at $250/month because they're "3x the stated budget of $200" — but the user's actual ceiling was $500/month and they just answered with a comfortable number, not a maximum.

**The Phase 1 diagnostics flagged this same ambiguity:**

> "Budget framing (Q8) — the examples "small subscription, a few hundred, or more significant investment" anchor low; users may state "comfortable" budget rather than maximum; unclear whether budget is per-month or total."

### Ambiguity 3: Timeline Framing (Text Q6, Voice §11)

**Text Q6**: "And lastly — how urgent is this for you? Are you looking for quick wins this month, planning improvements over the next quarter, or just exploring what's possible?"

The follow-ups are:
- "urgent, asap, this month, now, immediately, quick" → "What's driving the urgency?"
- "quarter, next few, planning, exploring, sometime" → "No rush at all. Is there a particular trigger?"

The ambiguity: **"exploring" is treated as "no rush"** when it should be treated as "there's an unstated trigger they're waiting for." The follow-up asks "what trigger would move this up?" but only if the user explicitly says "exploring" or "sometime." If the user says "we're just looking into options" without using those keywords, the follow-up never triggers and the timeline signal is lost.

**Downstream stage affected:** Implementation roadmap (pipeline uses timeline to sequence Quick Wins vs. Deeper Opportunities), report structure (roadmap phase labels)

**Consequence:** Reports may under-prioritize implementation urgency — a business that's in crisis mode but didn't use the keyword "urgent" gets a relaxed quarterly roadmap.

### Ambiguity 4: AI Readiness Question Placement (Text Q4)

**Text Q4**: "Have you or your team used any AI tools before? Things like ChatGPT, Claude, Copilot, or any AI-powered features in your existing software."

This question is placed as **Q4 (of 6)** — after tool stack, after pain points. But the answer to this question should influence how subsequent questions are framed:

- If AI-experienced: use more technical language, suggest more sophisticated solutions
- If AI-naïve: explain concepts simply, avoid jargon, recommend user-friendly tools

Currently, the question order is fixed and Annie doesn't adapt. After Q4, there are only Q5 (budget) and Q6 (timeline) remaining — minimal opportunity for adaptation.

**The voice script** handles this better: AI readiness is §11 (Constraints and Readiness), late in the conversation where it naturally flows from "Have you tried any AI tools already? What worked, what didn't, and why?"

**Downstream stage affected:** LLM analysis (tool recommendations should match AI sophistication), gate criteria (QW-E2 tool grounding — recommendations for AI-naïve users should favor simpler tools)

**Consequence:** Pipeline may recommend tools too complex for the user's AI readiness level. The gate can't catch this because AI readiness is a TASTE criterion (RR-T7), not a BLOCKING criterion.

### Ambiguity 5: "Roughly" Qualifiers (Both Scripts)

Both scripts use "roughly" for numeric answers:

- Voice script: "**Roughly** how many people are on the team" (Q2)
- Text script: no "roughly" — but answers are still free-text

The "roughly" qualifier signals that precision isn't needed, which is correct. But it also signals that the answer won't be precise, which downstream stages interpret as "approximately correct" rather than "potentially wrong."

**Downstream risk:** Tool recommendations that depend on team size (e.g., HubSpot's pricing tiers: 1 user vs. 5 users vs. 15 users) may be wrong if the user said "roughly 5" but actually has 8 people.

**Consequence:** Tool recommendations at the wrong pricing tier — a TASTE issue (RR-TC3 pricing accuracy) rather than BLOCKING, but still degrades report quality.

### Ambiguity 6: Question Count Mismatch

**The story file, phase-1 diagnostics, and intake-quality-check.ts all reference 10 intake questions.** The actual `INTAKE_SCRIPT` array has **6 questions**. The `BLOCKING_QUESTION_IDS` in `intake-quality-check.ts` references `workflow_details` and `concrete_metrics` — question IDs that **don't exist** in the actual script.

**Voice script** has 12 sections (not 10 or 6), with different questions from the text script.

This is a **documentation-code mismatch** affecting everything downstream. Any gate criterion that maps to "Q4 workflow_details" or "Q5 concrete_metrics" is checking against nonexistent questions.

---

## 4. Question-Level Assessment (Text Script — 6 Questions)

| # | ID | Topic | Goal | Context | Sources | Constraints | Quality Bar | DoD |
|---|-----|-------|------|---------|---------|-------------|-------------|-----|
| 1 | `business_overview` | Business Overview | ✅ Covered — captures role, team, history | ⚠️ Partial — 4-part compound question | ❌ Missing — no gate criteria mapping | ❌ Missing — no guardrails | ❌ Missing — no standard for "good enough" answer | ❌ Missing |
| 2 | `current_tools` | Current Tooling | ✅ Covered — asks for tools by category | ✅ Adequate — follow-ups for manual/automated | ❌ Missing | ❌ Missing | ⚠️ Partial — follow-ups probe for manual workflows but no tool-name specificity standard | ❌ Missing |
| 3 | `pain_points` | Pain Points | ✅ Covered — asks for frustrations | ✅ Adequate — 3 context-specific follow-ups | ❌ Missing | ❌ Missing | ⚠️ Partial — follow-ups probe for specifics but no temporal anchor requirement | ❌ Missing |
| 4 | `ai_readiness` | AI Readiness | ⚠️ Partial — asks about prior use but doesn't calibrate subsequent questions | ✅ Adequate — follow-ups for positive/negative experiences | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing |
| 5 | `budget` | Budget | ✅ Covered — asks for investment range | ⚠️ Partial — anchors low with examples, no max/min distinction | ❌ Missing | ❌ Missing | ❌ Missing — "comfortable" is ambiguous, no "this is your max" clarification | ❌ Missing |
| 6 | `timeline` | Timeline & Urgency | ✅ Covered — asks urgency and trigger | ⚠️ Partial — "exploring" → "no rush" is too binary | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing |

**Coverage summary:** 6 questions × 6 fields = 36 assessments. **6 covered, 8 partial, 22 missing.**

All 6 questions are missing: Sources (gate criteria mapping), Constraints (guardrails), Quality Bar (answer standards), Definition of Done (completion criteria). This is structural — the script doesn't model these concepts at all.

---

## 5. Voice-Specific Findings

### 5.1 Transcription Risk

The following voice script content is at risk of mistranscription:

| Section | Content | Risk | Pipeline Impact |
|---------|---------|------|-----------------|
| §2 (Basic Business Context) | "What is the best email address" | Low — email format is recognizable | intake-store-r2 saves email for portal linking |
| §2 (Basic Business Context) | "best phone number" | Medium — numbers can be garbled | intake-store-r2 saves phone for report header |
| §5 (Current Tools) | "CRM, booking system, project management tool, accounting system, helpdesk" | **High** — "Xero" → "zero," "HubSpot" → "hub spot," "Asana" → "a sauna" | Tool names are the primary input for QW-E2 and RR-TC1-3 (BLOCKING criteria) |
| §5 (Current Tools) | "Do you use a CRM, booking system..." | Medium — listing many categories in one turn increases chances of partial transcription | Tool coverage gaps |
| §6 (Manual Work) | "reports, emails, documents, quotes, proposals, or updates" | Low — common business words | Pain point classification |
| §8 (Leads) | "website forms, phone calls, email, social media, referrals, ads, marketplaces, or walk-ins" | Low — common channels | Lead source classification |
| §11 (Constraints) | "AI tools or automations already" | **High** — "Claude" → "clawed," "Copilot" → "co-pilot" (which one?) | AI readiness signal, RR-T7 |

**Recommendation:** The intake-quality-check should detect likely transcription errors by comparing tool names in the transcript against known tool name lists. If a transcript mentions "hub spot" (two words) and the tool research returns "HubSpot," flag as possible transcription error rather than tool hallucination.

### 5.2 Voice-Specific Ambiguity

**Compound questions in voice:** The voice script's mock conversation shows Annie asking one question at a time ("What does the business do?" → "How long operating?" → "How many on the team?"), which is correct. But the §2 script block lists them as bullet points, not as sequential turns. A voice agent reading the script could deliver them as a rapid-fire list (as the text script does in Q1), defeating the purpose of breaking them apart.

**Recovery prompts at wrong granularity:** The voice script has excellent recovery prompts at the end ("When you say it is manual, what are the actual steps?"), but they're generic — not tied to specific questions where vagueness is most likely. The recovery prompts should be positioned inline with the questions most likely to produce vague answers (Q4 pain points, Q5 budget range, Q11 constraints).

### 5.3 Missing Voice Guardrails

**What the voice script adds (relative to text):**
- ✅ Full Guardrails section (7 rules)
- ✅ Disclaimer section (legal/regulatory)
- ✅ Recovery Prompts (10 generic probes)
- ✅ Mock Conversation (realistic example)
- ✅ Handoff Summary Format (19-field structured output)

**What the voice script is still missing (relative to what it should have):**
- ❌ No explicit transcription quality check (e.g., "after the call, check that tool names are spelled correctly in the transcript")
- ❌ No timeout handling (what if the caller goes silent for 60 seconds?)
- ❌ No non-English speaker adaptation (what if the caller has a heavy accent?)
- ❌ No background noise handling instructions for Retell

### 5.4 Voice vs. Text Script Asymmetry

This is the most significant finding of the voice-specific analysis:

| Concern | Text Script | Voice Script | Risk |
|---------|-------------|-------------|------|
| Guardrails | **None** | 7 explicit rules | Text Annie can violate all constraints |
| Disclaimer | **None** | Full legal disclaimer | Text Annie provides un-disclaimed advice |
| Recovery prompts | Keyword-based follow-ups only | 10 generic probes | Text Annie can't recover from vague answers |
| Handoff format | `IntakeProgress.answers[]` | 19-field structured summary | Text intake data format is inconsistent with voice |
| Question count | 6 | 12 | Pipeline receives different data from each channel |
| Tool names asked | "What tools and software does your business use day-to-day?" | "Do you use a CRM, booking system, project management tool, accounting system, helpdesk, spreadsheet, or document management system?" | Voice prompts for more specific tool categories |

The two intake channels produce **different intake data shapes** — text intake is sparse (6 questions, minimal follow-ups), voice intake is rich (12 sections, category-specific prompts, handoff summary). This asymmetry is a pipeline-wide issue: downstream stages (tool research, evidence extraction, LLM analysis) receive intake data of varying quality depending on which channel the customer used.

---

## 6. Cross-Reference: intake-quality-check.ts

### 6.1 Coverage Assessment

| Gap | Caught by `checkIntakeSufficiency()`? | Assessment |
|-----|---------------------------------------|------------|
| Transcript too short | ✅ Yes — `MIN_TRANSCRIPT_LENGTH` (400 chars) | Operational guardrail exists. Threshold is adequate for catching empty/hung-up calls. |
| Too few questions answered | ✅ Yes — `MIN_ANSWERS` (5) | Operational guardrail exists. But only applies when structured `answers` data is available. Without answers (raw transcript from Retell), falls back to heuristic `estimateQuestionCount()` which uses topic markers that may not be present. |
| No tool names | ✅ Yes — `SUBSTANTIVE_TOOL_INDICATORS` | Operational guardrail exists. List is comprehensive (32 tools). But the check is binary — detects presence/absence, not whether tool names are real or transcription errors. |
| No specific pain points | ✅ Yes — `SUBSTANTIVE_PAIN_INDICATORS` | Operational guardrail exists. 29 indicators cover common pain language. But "manual" and "slow" match even trivial answers — false positive rate may be high. |
| Budget signal missing | ✅ Yes — `detectBudgetSignal()` | Operational guardrail exists. Budget detection uses regex patterns covering common formats. But Q8 is currently Q5 in the text script — question ID mismatch. |
| Blocking questions incomplete | ⚠️ Partial — wrong question IDs | **Gap partially detected.** The check references `workflow_details` and `concrete_metrics` which don't exist. The check would always report "incomplete blocking questions" because the non-existent questions can never be answered. The current code may be shadow-mode only so this hasn't surfaced. |
| Constraints (guardrails) missing from script | ❌ Not caught | **Gap undetected at runtime.** No check for whether intake was collected with guardrails. A non-compliant text intake passes quality check. |
| Quality bar (answer specificity) missing | ❌ Not caught | **Gap undetected.** `checkIntakeSufficiency()` checks structural completeness (length, count, keyword presence), not quality. A 600-word transcript with generic answers passes. |
| Definition of done missing | ❌ Not caught | **Gap undetected.** No check for whether the intake script itself defines completion. The quality check is the DoD proxy, but it's external to the script. |
| Voice/text asymmetry | ❌ Not caught | **Gap undetected.** The quality check treats all transcripts identically regardless of channel. Voice transcripts (with richer data) and text transcripts (with sparser data) get the same thresholds. |

### 6.2 Critical Bug: Question ID Mismatch

```typescript
// intake-quality-check.ts line 35-40
const BLOCKING_QUESTION_IDS = [
  'business_overview',   // Q1: exists in intake-script.ts ✅
  'current_tools',       // Q2: exists in intake-script.ts ✅
  'pain_points',         // Q3: exists in intake-script.ts ✅
  'workflow_details',    // Q4: DOES NOT EXIST in intake-script.ts ❌
  'concrete_metrics',    // Q5: DOES NOT EXIST in intake-script.ts ❌
];
```

The actual Q4 in `intake-script.ts` is `ai_readiness`. The actual Q5 is `budget`. The actual Q6 is `timeline`.

**Impact:** The `checkIntakeSufficiency()` function calculates `blockingAnswersPresent` by checking if `answers` contain entries matching `BLOCKING_QUESTION_IDS`. Since `workflow_details` and `concrete_metrics` never exist in the answers array, `blockingAnswersPresent` is always ≤ 3 (even when all 6 questions are answered), and the check always reports "Blocking questions incomplete (3/5 answered with substance)."

This means `checkIntakeSufficiency()` will **never return `sufficient: true` when using structured answers** — every intake fails the blocking question check.

**Fix:** Update `BLOCKING_QUESTION_IDS` to match actual intake script question IDs:
```typescript
const BLOCKING_QUESTION_IDS = [
  'business_overview',   // Q1
  'current_tools',       // Q2
  'pain_points',         // Q3
  'ai_readiness',        // Q4 (was workflow_details)
  'budget',              // Q5 (was concrete_metrics)
];
```

Note: `ai_readiness` (Q4) is not currently a BLOCKING criterion — it feeds TASTE criterion RR-T7. Consider whether it should be in the blocking set or whether `timeline` (Q6) should replace it for blocking coverage.

---

## 7. Gap-to-Pipeline Traceability Matrix

### BLOCKING Severity Gaps

| Gap | Pipeline Stage | Gate Criterion | Risk if Unaddressed | Fix |
|-----|---------------|----------------|---------------------|-----|
| **Text script has zero guardrails** | Intake (chat webhook) | QW-R1/R2 (regulated topics), RR-S1-3 (safety) | Annie (chat) could ask about tax strategies, request passwords, or recommend tools — producing non-compliant transcripts that pass structural quality checks but contain unsafe content | Add Guardrails section to `intake-script.ts` + system message guardrails in chat webhook handler |
| **Question ID mismatch in quality check** | Webhook handler (pre-pipeline) | All BLOCKING criteria (QW-A1, QW-E1-3, MP-A1, MP-E1, RR-A0, RR-TC1-3) | `checkIntakeSufficiency()` never returns `sufficient: true` with structured answers — every intake fails silently (or the check is disabled/shadow-mode and no blocking happens) | Fix `BLOCKING_QUESTION_IDS` to match actual intake script IDs |
| **No tool-name answer quality standard** | Tool research (Stage 0) | QW-E2 (tool grounding), RR-TC1 (tool citation) | Vague Q2 answers ("we use spreadsheets") → tool research queries are underspecified → no tools found for key pain points → reports recommend "no tool" for fixable problems | Add minimum specificity for Q2: must name ≥1 specific software product, follow-up must probe for specifics if answer is generic |
| **No pain-point temporal anchor requirement** | Evidence extraction (Stage 1) | QW-E1 (traceability), RR-A0 (evidence traceability) | Vague Q3 answers ("admin takes too long") → evidence extraction misses specific, quotable pain points → gate criteria fail traceability → gate blocks a salvageable report | Add temporal anchor requirement: Q3 answer must include frequency, duration, and a recent example |
| **Budget ambiguity ("comfortable" vs. "maximum")** | Budget detection (Stage 2) | MP-E1 (budget alignment) | User says "$200/mo comfortable" → pipeline rejects $250 tools as "3x budget" → report misses correct-fit tools that were within actual max budget | Rephrase Q5: ask "maximum monthly investment" separately from "comfortable starting point" |

### TASTE Severity Gaps

| Gap | Pipeline Stage | Gate Criterion | Risk if Unaddressed | Fix |
|-----|---------------|----------------|---------------------|-----|
| **No quality bar for answer sufficiency** | LLM analysis (Stage 4) | RR-T1 (accuracy), RR-T2 (completeness) | Reports vary in quality based on intake quality, with no intake-level quality differentiation — same $1,200 AUD price for excellent vs. mediocre intake | Add answer quality guidelines + progressive probing when answers are below threshold |
| **Compound questions lose sub-answers** | Evidence extraction (Stage 1) | RR-A0 (evidence traceability) | Q1 packs 4 sub-questions into one turn → user answers only 2 → evidence extraction misses team size and operating history → report is generic | Break Q1 into sequential sub-questions (already done in voice script — do same in text) |
| **AI readiness question too late for adaptation** | LLM analysis (Stage 4) | RR-T7 (appropriateness) | Q4's AI readiness signal arrives after most substantive questions (Q1-Q3) have been answered → Annie can't adapt language or probe depth for AI-naïve vs. AI-experienced users | Move AI readiness to Q2 or adapt subsequent follow-up language based on the answer |
| **Voice/text asymmetry produces different intake quality** | Pipeline (all stages) | All TASTE criteria | Voice transcripts are richer (12 sections, specific category prompts) → voice customers get better reports than chat customers for the same price | Normalize intake data shape across channels OR calibrate quality expectations per channel |
| **Timeline "exploring" → "no rush" is too binary** | Implementation roadmap | RR-T6 (prioritization) | Users who are exploring but have a trigger are classified as "no urgency" → roadmap phases are too relaxed → report under-prioritizes | Add explicit "waiting for trigger" classification separate from "no rush" |

---

## 8. Summary of Findings

### Top 3 Critical Gaps (BLOCKING severity)

1. **Text script has zero guardrails.** The voice script has 7 explicit guardrails. The text script has none. Annie (chat) is unconstrained and could produce non-compliant transcripts. **Fix priority: P0 — add guardrails before next chat intake goes live.** Affects QW-R1/R2, RR-S1-3 (all BLOCKING).

2. **Question ID mismatch in `intake-quality-check.ts`.** `BLOCKING_QUESTION_IDS` references `workflow_details` and `concrete_metrics` which don't exist in the actual intake script. The quality check can never return `sufficient: true` with structured answers. **Fix priority: P0 — update IDs to match actual script.** Affects all BLOCKING gate criteria indirectly (quality check is the pre-pipeline gate).

3. **No quality bar for answer specificity.** Neither script defines what constitutes a "good enough" answer. The pipeline receives transcripts with wildly varying evidence density and has no mechanism to differentiate. **Fix priority: P1 — add specificity standards per question.** Affects QW-E1, QW-E3, RR-A0 (all BLOCKING).

### Top 3 Important Gaps (TASTE severity)

4. **Voice/text asymmetry.** Voice transcripts are structurally richer (12 sections with category-specific probes) than text transcripts (6 compound questions). Customers paying the same $1,200 AUD get different pipeline input quality depending on channel. **Fix priority: P2 — normalize question depth across channels.**

5. **Budget framing anchors low.** "Comfortable" + low examples biases answers downward, causing the pipeline to reject tools within the user's actual maximum budget. **Fix priority: P2 — add separate "maximum" and "comfortable" budget questions.**

6. **Compound questions lose sub-answers.** Q1 packs 4 questions into one turn. Users answer 1-2 and skip the rest. Evidence extraction misses team size and operating history, producing generic reports. **Fix priority: P2 — break Q1 into sequential sub-questions.**

### Cross-Cutting Issue

The intake has **evolved without an explicit design document** connecting intake questions to pipeline needs. The voice script was adapted from the text script without updating the text script to match. The quality check was written against a different question set than what's in the code. The result is a tripartite divergence: text script (6 questions), voice script (12 sections), quality check (references 5 blocking questions, 2 of which don't exist).

**Root cause:** No single source of truth for "what constitutes a complete intake." The intake script, voice script, and quality check are independently maintained and have drifted apart.

---

## Appendix A: Files Reviewed

| File | Lines | Status |
|------|-------|--------|
| `src/lib/assessment/intake-script.ts` | 118 | 6 questions, typed interfaces, no guardrails |
| `docs/voice-agent-script.md` | 400+ | 12 sections, full guardrails, mock conversation |
| `src/lib/server/assessment/intake-quality-check.ts` | 187 | 6 checks, wrong Q4/Q5 IDs, keyword-based |
| `docs/agentic-workflows/ai-communication-clarity/aicc-002-v1-vague-ask-auditor.md` | N/A | 6-field methodology applied systematically |
| `_bmad-output/planning-artifacts/phase-1-diagnostics-2026-05-28.md` | N/A | Preliminary audit findings used as starting point |
| `_bmad-output/planning-artifacts/jla-005-gate-architecture-review-2026-05-28.md` | N/A | JLA-005 Finding 5 (intake-quality gate needed) cross-referenced |

## Appendix B: Next Steps (Stories 6.2 and 6.3)

This audit feeds directly into:

- **Story 6.2 (AICC-001 — Intake Question Redesign):** Redesign the text script questions based on gap findings. Add guardrails, break compound questions, fix budget anchoring, add quality standards per question.

- **Story 6.3 (AICC-003 — Intake Completion Criteria):** Define explicit "intake is complete" criteria. Fix `BLOCKING_QUESTION_IDS` in `intake-quality-check.ts`. Add intake-quality gate blocking logic. Wire guardrails into chat webhook handler.
