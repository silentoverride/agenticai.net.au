# JLA-004 Gate Evaluation Suites — Agenticai Pipeline

**Date:** 2026-05-29
**Author:** Dev Agent (subagent)
**Methodology:** JLA-004 v1
**Input:** JLA-002/003 gate criteria, current gate definitions, 5 reports in evaluation corpus

---

## Evaluation Suite 1: Quick-Wins Verification (QW)

**What this gate evaluates:** Quick Wins in assessment reports — must be evidence-anchored, tool-cited, quantitatively grounded, safe, and genuinely quick.

### ALLOW Cases (5)

| # | Scenario | Driving Criterion | Why It Should Pass |
|---|----------|-------------------|--------------------|
| QW-A1 | QW: "Set up Jobber auto-reply for after-hours leads" (2hrs saved/week, $50/hr rate stated, transcript: "I miss leads when we're closed") | QW-E1, QW-E2, QW-E3 | Evidence-anchored (transcript quote), tool correctly cited (Jobber), arithmetic traceable (2hrs × $50 × 48wk) |
| QW-A2 | QW: "Connect Xero to bank feed for auto-reconciliation" (3hrs/week, business uses Xero already — stated in transcript) | QW-E1, QW-E2, QW-A1 | Tool already in stack, solves named pain ("manual reconciliation"), hours anchored to transcript statement |
| QW-A3 | QW: "Create Calendly booking link on website" (1.5hrs/week, $75/hr, transcript: "I spend an hour a day playing phone tag") | QW-E1, QW-E3 | Specific tool, specific problem, hours traceable (1hr/day → 5hrs/week, but 1.5hrs only claimed for booking component) |
| QW-A4 | QW: "Set up Gmail canned responses for common quote replies" (2hrs saved/week, transcript: "I write the same email 15 times a day") | QW-E1, QW-E2, QW-R2 | Evidence specific ("15 times a day"), tool correctly cited (Gmail canned responses), no over-promise |
| QW-A5 | QW: "Import contacts from spreadsheet to HubSpot CRM" (4hrs/week, business has HubSpot free tier — confirmed in transcript) | QW-E1, QW-E2 | Tool confirmed in stack, hours stated in transcript, low-effort single configuration |

### BLOCK Cases (8)

| # | Scenario | Driving Criterion | Why It Should Block |
|---|----------|-------------------|---------------------|
| QW-B1 | QW: "Implement AI knowledge base for customer support" (10hrs saved/week, no transcript evidence) | QW-E1, QW-A1 | No transcript evidence whatsoever. Generic "AI knowledge base" is a major project, not a QW. |
| QW-B2 | QW: "Set up Zapiar to connect forms to CRM" (tool name hallucination) | QW-E2 | "Zapiar" doesn't exist. Tool hallucination → BLOCK. |
| QW-B3 | QW: "Use Monday.com for project management" (recommended even though transcript says "we tried Monday and hated it") | QW-A1 | Directly contradicts transcript evidence. Customer explicitly rejected this tool. |
| QW-B4 | QW: "Your team will save 20 hours per week" (over-promise, no arithmetic) | QW-R2, QW-E3 | "Will save" language + unverified number + no arithmetic chain → BLOCK. |
| QW-B5 | QW: "Restructure your company as a trust to minimize tax" (regulated advice) | QW-R1 | Financial/legal advice → BLOCK. |
| QW-B6 | QW: "Switch to Salesforce Enterprise ($150/user/month)" for a 2-person business on $50/hr rate | QW-E3, QW-A2 | Cost vastly exceeds budget. $300/month for $50/hr business is misaligned. |
| QW-B7 | QW: "Generate social media posts with AI" (5hrs saved/week, transcript: "we don't use social media") | QW-A1 | Solves a problem the customer doesn't have. |
| QW-B8 | QW: "Automate your entire workflow with Zapier" — no specific integrations named, no hours traceable | QW-E1, QW-E3 | Generic "automate everything" is not a Quick Win. No evidence, no specific numbers. |

### REVISE Cases (4)

| # | Scenario | Driving Criterion | What to Revise |
|---|----------|-------------------|----------------|
| QW-R1 | QW: "Set up Calendly" — correct tool, correct problem, but hours saved not stated | QW-E3 | REVISE: Add hours-saved estimate with transcript anchor |
| QW-R2 | QW: "Use Hubspot CRM" — correct tool, has evidence, but misspelled as "Hubspot" (lowercase 's') | QW-E2 | REVISE: Correct tool name to "HubSpot" |
| QW-R3 | QW: "Automate invoice reminders" — correct problem, but no specific tool named | QW-E2 | REVISE: Name specific tool (Xero, QuickBooks, or FreshBooks) |
| QW-R4 | QW: Good evidence and tool, but "$100/hr" rate stated without transcript source | QW-E3 | REVISE: Note that hourly rate is assumed, not stated — add source |

### ESCALATE Cases (3)

| # | Scenario | Driving Criterion | Why Escalate |
|---|----------|-------------------|-------------|
| QW-E1 | QW recommends "Stripe payment integration" for a business that takes cash-only — transcript mentions "thinking about" cards but no commitment | QW-A1, policy | Ambiguous: customer mentioned cards but didn't commit. Could be premature. |
| QW-E2 | QW claims "automate email follow-up" with a tool that exists in AU but has no free tier and requires $200/month commitment | QW-A2, budget | High-risk recommendation for small business: commitment cost vs. stated budget unclear |
| QW-E3 | QW: "Switch accounting from MYOB to Xero" — both tools exist, transcript has MYOB, switching cost not accounted for in hours-saved estimate | QW-E1, QW-E3 | Migration cost/risk unclear. Switching accounting systems is high-stakes for small business. |

### Coverage Notes — QW Gate

| Criterion | Cases Covering | Gaps |
|-----------|---------------|------|
| QW-E1 (transcript evidence) | A1-A5, B1, B3, B7, B8 | None |
| QW-E2 (tool citation) | A1-A5, B2, R2, R3 | Hallucination detection (B2) covered |
| QW-E3 (quantitative anchoring) | A1-A3, B4, B6, B8, R1, R4 | None |
| QW-A1 (pain point match) | B3, B7, E1 | None |
| QW-R1 (regulated advice) | B5 | Could add tax/legal edge case |
| QW-R2 (over-promise) | B4 | None |

---

## Evaluation Suite 2: Major-Project Verification (MP)

**What this gate evaluates:** Deeper Opportunities — must be budget-aligned, scope-appropriate, and grounded in business readiness.

### ALLOW Cases (5)

| # | Scenario | Driving Criterion | Why It Should Pass |
|---|----------|-------------------|--------------------|
| MP-A1 | DO: "Client Self-Service Portal" — $8,000 setup, $2,000/mo value, business at $5-10K/mo budget band, team of 8, owner explicitly stated desire for portal | MP-E1, MP-A1, MP-A2 | Budget-aligned, team-appropriate, directly named by customer |
| MP-A2 | DO: "End-to-end intake automation" — $3,000 setup, $1,500/mo value, business at $2-5K/mo budget | MP-E1, MP-A1 | Cost within budget, value exceeds cost within 2 months |
| MP-A3 | DO: "AI phone agent for after-hours enquiry intake" — $5,000 setup, $2,000/mo value, business losing $2K/mo in missed leads | MP-E1, MP-A1 | Setup paid back in 2.5 months, solves named problem |
| MP-A4 | DO: "Brand operations playbook with Canva templates" — $3,000 setup, $1,000/mo value, creative agency with 8 staff | MP-A2 | Team size appropriate, scope matches agency workflow |
| MP-A5 | DO: "CRM migration from spreadsheets to Pipedrive" — $2,000 setup, $800/mo value, sole trader at $1-3K/mo budget | MP-E1, MP-A2 | Cost appropriate for sole trader, value exceeds cost in 2.5 months |

### BLOCK Cases (7)

| # | Scenario | Driving Criterion | Why It Should Block |
|---|----------|-------------------|---------------------|
| MP-B1 | DO: "Full Salesforce implementation" — $50,000 setup, $5,000/mo, for a sole trader at $1K/mo budget | MP-E1, MP-A2 | Cost 50× customer budget. Wildly misaligned. |
| MP-B2 | DO: "AI-powered inventory management system" — for a service business with no physical inventory | MP-A1 | Solves a problem the business doesn't have. No transcript evidence. |
| MP-B3 | DO: "Build a custom mobile app" — $20,000 setup, $500/mo value — negative ROI, value doesn't justify cost | MP-E1 | Value ($500/mo) never recovers setup ($20,000) — 40-month payback |
| MP-B4 | DO: "Implement enterprise SSO and RBAC" — for a 3-person business | MP-A2 | Enterprise infrastructure for micro-team. Scale mismatch. |
| MP-B5 | DO: "Hire an AI consultant at $15,000/month" — recommended as technology solution, not staffing | MP-A1 | Confuses technology recommendation with staffing advice |
| MP-B6 | DO: Setup cost "$500-50,000" — absurdly wide range, no basis | MP-E1 | Cost estimate not credible. Range spanning two orders of magnitude. |
| MP-B7 | DO: "Replace all manual processes with AI agents" — no specific scope, no cost, no timeline | MP-E1, MP-A1 | Not a Deeper Opportunity — it's a vague aspirational statement. |

### REVISE Cases (4)

| # | Scenario | Driving Criterion | What to Revise |
|---|----------|-------------------|----------------|
| MP-R1 | DO has good scope and fit, but setup cost listed as "TBD" | MP-E1 | REVISE: Provide estimated cost range with basis |
| MP-R2 | DO: "Client portal" — good fit for 8-person agency, but monthly value claimed as $10,000/mo (unrealistic for agency billing) | MP-E1 | REVISE: Recalibrate monthly value to realistic range |
| MP-R3 | DO references "your growing team" but intake shows business is stable (no hiring plans) | MP-A2 | REVISE: Align scope with actual team size, not assumed growth |
| MP-R4 | DO: Good recommendation but timeline says "1-2 weeks" for a project that requires procurement | MP-A2 | REVISE: Adjust timeline to realistic procurement-aware estimate |

### ESCALATE Cases (4)

| # | Scenario | Driving Criterion | Why Escalate |
|---|----------|-------------------|-------------|
| MP-E1 | DO: "Integrate with government API for compliance reporting" — involves regulatory requirements, unclear if business needs this | Policy | Regulatory involvement requires human review |
| MP-E2 | DO: "$10,000-$30,000" setup range — wide but potentially justified if scope depends on vendor selection | MP-E1 | Ambiguous cost range could be legitimate or lazy |
| MP-E3 | DO recommends a tool that's available in US/UK but AU availability unconfirmed | MP-A1, MP-A2 | AU availability unknown — human should verify |
| MP-E4 | DO: "Migrate all data from legacy system" — transcript mentions "we tried this once and lost 3 months of data" | MP-A1, safety | Past data loss incident makes migration high-risk |

### Coverage Notes — MP Gate

| Criterion | Cases Covering | Gaps |
|-----------|---------------|------|
| MP-E1 (budget alignment) | A1-A3, A5, B1, B3, B6, R1, R2, E2 | None |
| MP-A1 (business need match) | A1-A3, B2, B5, B7, E1, E3, E4 | None |
| MP-A2 (scope appropriateness) | A1, A4, A5, B1, B4, R3, R4, E3 | None |

---

## Evaluation Suite 3: Report-Review (RR)

**What this gate evaluates:** Full assessment report quality — evidence traceability, taste, safety, tool credibility, structural quality.

### ALLOW Cases (6)

| # | Scenario | Driving Criterion | Why It Should Pass |
|---|----------|-------------------|--------------------|
| RR-A1 | Full report: "8-person marketing agency" — specific pain points with temporal anchors, 4 QWs each with tool+evidence+hours, 3 DOs with cost/value, clear roadmap, arithmetic verifiable ($50/hr × 10hrs × 48wks) | All criteria | Gold-standard report (evaluation corpus Report 4) |
| RR-A2 | Report: "Deck verification services" — industry-specific, tools appropriate (HubSpot, Zapier, Typeform, Tidio), all sections present, no PBW patterns | T1-T7, TC1-3, structural | Industry specificity passes swap test, tools well-chosen |
| RR-A3 | Report: "Sole trader plumber" — 2 QWs (Jobber scheduling + Gmail templates), modest scope, no over-promise, $30/hr rate stated | T4, T1, S2 | Appropriate scope for small business, no over-promise, honest financials |
| RR-A4 | Executive summary: "Sarah's bookkeeping practice loses 8 hours/week to manual invoice reconciliation. Implementing Xero bank feeds and auto-reminders targets 6 of those 8 hours, freeing capacity for two new monthly clients." | RR-Q1, T1, T4 | Specific, has numbers, named solution, measurable impact |
| RR-A5 | QW: "Connect Stripe to Xero for automatic payment reconciliation" — tool exists, in budget, solves named problem, hours traceable | TC1-3, QW-E2 | All tool credibility checks pass |
| RR-A6 | Report has 1 evidence-map gap ("budget not confirmed") but explicitly notes it as a gap with "assumed $50/hr based on industry standard" — honest gap handling | RR-A0b, T4 | Gap is acknowledged, not invented. Honesty passes. |

### BLOCK Cases (9)

| # | Scenario | Driving Criterion | Why It Should Block |
|---|----------|-------------------|---------------------|
| RR-B1 | Report with 5 orphan claims (no evidence source): "AI will save your business", "your competitors are already using AI", "this is the industry standard", "our analysis shows 40% improvement", "best-in-class solution" | RR-A0 | ≥3 orphan claims → BLOCK |
| RR-B2 | Report invents "budget: $5,000-10,000/month" when intake has no budget data | RR-A0b | Invented gap data → BLOCK |
| RR-B3 | Report recommends: "You should restructure as a Pty Ltd and claim R&D tax incentives" | RR-S1 | Regulated financial/tax advice → BLOCK |
| RR-B4 | Report claims: "This solution will save you $50,000 per year — guaranteed" | RR-S2 | Over-promise + "guaranteed" language → BLOCK |
| RR-B5 | Report includes customer's full name, phone number, and email address in the executive summary | RR-S3 | PII in customer-facing section → BLOCK |
| RR-B6 | Report recommends "ZapierAI Pro Max Enterprise" — tool that doesn't exist | RR-TC1 | Tool hallucination → BLOCK |
| RR-B7 | Report recommends Salesforce at $300/user/month for a 2-person business at $30/hr — 7/21 PBW patterns detected | T7, TC1, TC3 | Multiple PBW patterns + scale mismatch + cost violation |
| RR-B8 | Executive summary: "As a growing business in today's competitive landscape, leveraging AI-powered automation solutions can transform your operational efficiency and unlock new revenue streams." — zero specifics | T1, RR-Q1 | Generic platitudes, no client-specific detail, swap test fails completely |
| RR-B9 | Report has 6 sections (missing Financial Impact), pain points have no temporal anchors, QWs have no effort/impact estimates | T6, RR-Q2, RR-Q3 | Structural incompleteness + missing evidence |

### REVISE Cases (5)

| # | Scenario | Driving Criterion | What to Revise |
|---|----------|-------------------|----------------|
| RR-R1 | Report is excellent overall but Financial Impact says "$250/week value" without stating hourly rate or weeks calculation | T4 | REVISE: Add hourly rate and weeks assumption to make arithmetic replayable |
| RR-R2 | Executive summary is 7 paragraphs — too long. Content is good but needs condensation. | RR-Q1 | REVISE: Condense to ≤3 paragraphs |
| RR-R3 | Pain point: "Manual data entry is time-consuming" — no temporal anchor, no measurable impact | RR-Q2 | REVISE: Add "~3 hours/day" or "every Monday morning" anchor |
| RR-R4 | Report uses "synergistic AI-powered workflow automation" 8 times across sections | T7 (buzzword padding) | REVISE: Replace buzzwords with concrete tool names and specific actions |
| RR-R5 | Roadmap has phase 3 "review and optimize" with no specific actions — placeholder | T6, structural | REVISE: Add specific optimization actions or remove placeholder phase |

### ESCALATE Cases (5)

| # | Scenario | Driving Criterion | Why Escalate |
|---|----------|-------------------|-------------|
| RR-E1 | Report recommends AI tools for a medical practice handling patient data — HIPAA/privacy implications unclear | RR-S1, policy | Healthcare data → regulatory complexity → human must review |
| RR-E2 | Report's financial impact claims $500/hr rate for what appears to be a receptionist role based on transcript | T4, QW-E3 | Rate/role mismatch suggests either misunderstanding or fabricated numbers |
| RR-E3 | Report has 2 orphan claims and 2 ambiguous ones — borderline A0 threshold | RR-A0 | Close to BLOCK threshold but claims might trace to implicit transcript evidence |
| RR-E4 | Report recommends "AI-powered legal document review" for a business that handles contracts | RR-S1 | Near-legal-advice boundary — human must assess if this crosses the line |
| RR-E5 | Report quality is uneven: QW section excellent, DO section vague, Executive summary contradictory with roadmap timeline | T1, T6, structural | Inconsistent quality suggests generation error rather than bad intake — escalate for regeneration decision |

---

## Cross-Suite Coverage Analysis

### Failure Mode Coverage

| Failure Mode | QW Suite | MP Suite | RR Suite | Total |
|-------------|----------|----------|----------|-------|
| Missing evidence | B1, B8 | B2 | B1, B8, B9 | 6 |
| Tool hallucination | B2, R2 | — | B6 | 3 |
| Over-promise | B4 | — | B4 | 2 |
| Regulated advice | B5 | — | B3, E1, E4 | 4 |
| Budget misalignment | B6 | B1, B3, B6 | B7 | 5 |
| Scale mismatch | — | B4 | B7 | 2 |
| Generic/platitudes | — | B7 | B8, R4 | 3 |
| PII exposure | — | — | B5 | 1 |
| Invented data | — | — | B2 | 1 |
| Scope creep | — | B5 | — | 1 |
| **Total** | **8** | **7** | **10** | **25 unique** |

### Outcome Distribution

| Outcome | QW | MP | RR | Total |
|---------|----|----|----|-------|
| ALLOW | 5 | 5 | 6 | 16 |
| BLOCK | 8 | 7 | 9 | 24 |
| REVISE | 4 | 4 | 5 | 13 |
| ESCALATE | 3 | 4 | 5 | 12 |
| **Total** | **20** | **20** | **25** | **65** |

---

## Metrics to Track (Per JLA-004)

### Per-Gate Metrics

| Metric | Definition | Healthy Range | Alert If |
|--------|-----------|---------------|----------|
| False Allow Rate | Gate ALLOWs → human later overrides to BLOCK | <5% | >10% |
| False Block Rate | Gate BLOCKs → human overrides to ALLOW | <15% | >30% |
| Escalation Rate | Gate ESCALATEs ÷ total evaluations | 5-15% | >25% (gate too cautious) or <2% (gate not escalating edge cases) |
| Revision Rate | Gate REVISEs ÷ total evaluations | 10-25% | >40% (gate too pedantic) |
| Avg Confidence | Mean confidence score per gate | >0.7 | <0.5 (gate unsure too often) |
| Per-Criterion Pass Rate | % of evaluations where specific criterion is met | Varies | <50% for any criterion (systemic weakness) |

### Cross-Gate Pipeline Metrics

| Metric | Definition | Why Track |
|--------|-----------|-----------|
| Gate Chain Pass Rate | % of assessments passing all 3 gates | Measures pipeline yield. Too low = gates too strict or intake too weak. Too high = gates not catching anything. |
| Gate-to-Gate Drop-off | % failing at each gate stage | Identifies worst bottleneck. If QW gate blocks 40% but MP blocks 2%, QW needs calibration. |
| Time in Gate | Latency per gate evaluation | Cost optimization: if report-review is 50% of pipeline time, deterministic split (P2) has high ROI |
| Cost per Gate | GPT-5.5 cost per evaluation | Track alongside deterministic split implementation to verify savings |

### Calibration Signals

| Pattern | What It Means | Action |
|---------|---------------|--------|
| Escalation rate dropping to near-zero | Gate is getting complacent or intake is improving | Review edge cases — is gate skipping ambiguous scenarios? |
| False block rate rising | Gate is becoming too strict | Review recent blocks — was criteria tightened too much? |
| False allow rate rising but confidence is high | Gate has a blind spot | New failure pattern emerging — add to evaluation suite |
| Per-criterion pass rate suddenly drops on one criterion | Prompt drift or model change | Check if model update changed behavior on specific criterion |
| Revision rate >50% | Gate is nitpicking minor issues | Tune REVISE threshold — reserve for meaningful changes |

---

## Implementation Notes

### Where These Suites Live

Each suite should be implemented as a test file:
- `tests/gate/qw-verification-suite.test.ts`
- `tests/gate/mp-verification-suite.test.ts`
- `tests/gate/report-review-suite.test.ts`

### Test Format

Each test case:
1. Constructs a synthetic AssessmentReportJob or report section
2. Calls `runGate()` with the appropriate gate type
3. Asserts expected outcome (action: 'pass' | 'block' | 'escalate')
4. For REVISE cases: currently asserts 'block' or 'escalate' (REVISE not implemented) — tagged `@pending-revise`
5. Records per-criterion findings for coverage tracking

### Integration with JLA-005 Recommendations

| JLA-005 Rec | Test Impact |
|-------------|-------------|
| P2 (deterministic split) | Add separate test suite for deterministic check functions — no LLM call needed |
| P3 (transcript pass-through) | All cases must include transcript field in test input |
