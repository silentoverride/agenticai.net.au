---
title: Service Model and Pricing
type: concept
updated: 2026-05-02
sources:
  - "docs/AI Business Assessment Business Plan.md"
see_also:
  - "../business/business-plan-source.md"
  - "../agents/annie-chat-agent.md"
  - "../agents/annie-voice-agent.md"
  - "../operations/report-pipeline.md"
  - "../reports/presenton.md"
---

# Service Model and Pricing

Agentic AI's AI Business Assessment service is modelled on Corey Ganim's "Return My Time" assessment agency. The core proposition: a structured discovery interview followed by a professional report identifying specific AI tools and automation opportunities for the client's business.

## Service Tiers

| Tier | Price | What the client gets |
|------|-------|---------------------|
| **AI Business Assessment** | $1,200.00 AUD | 20–30 minute voice intake → professional report with pain points, quick wins, effort vs. impact matrix, recommended tools, 4-day implementation plan, and financial impact estimate |
| **Quick-Win Implementation** | $1,500–$3,000 | Build a single automation (Zapier/Make), custom GPT, or process optimisation identified in the assessment |
| **Speed-to-Lead Agent** | $2,000–$5,000 | AI agent that responds to incoming leads within seconds, personalised to the business |
| **Knowledge System** | $2,000–$5,000 + recurring | Custom GPT or AI assistant trained on the client's documents, FAQs, and processes |
| **Process Optimisation** | $3,000–$5,000 | Redesign a broken process before automating it |

## Why $1,200 AUD?

The pricing evolution from free → $200 → $500 → $1,000 reveals a key insight:

| Price | Client behaviour | Upsell conversion |
|-------|-----------------|-------------------|
| Free | Grateful but not invested | Low |
| $200 | "Great value!" but not serious about upsells | Low |
| $500 | Better engagement; some upsells | Medium |
| $1,000 | Fully bought in; attentive; pursues upsells | High |

The $1,000 fee is not about the assessment revenue — it is a **psychological anchor** that makes the $3,500–$10,000 upsell feel reasonable rather than enormous.

## The Assessment Process

```
1. Client calls Annie (voice)
2. Annie conducts structured 20–30 minute discovery interview
3. Client pays $1,200 AUD via Stripe Checkout
4. Transcript + analysis forwarded to report pipeline
5. Report agent (Kimi K2.6 via Ollama Cloud) analyzes and builds assessment report
6. Report formatted in Presenton (professional visual report)
7. Delivered within 48 hours
8. 30-minute follow-up call to walk through report
9. Upsell conversation on the follow-up call
```

## Report Contents

| Section | Purpose |
|---------|---------|
| Executive Summary | Validates listening; anchors value proposition |
| Effort vs. Impact Matrix | Prioritises quick wins (low effort, high impact) |
| Recommended Solutions | Specific AI tools researched from [Futurepedia](https://www.futurepedia.io/ai-tools) and [There's An AI For That](https://theresanaiforthat.com/), what they do, why they fit, pricing, and integration complexity |
| 4-Day Quick Win Plan | Day-by-day action plan to remove overwhelm |
| Upsell Opportunities | Larger, higher-effort changes — sets stage for follow-up call |
| Financial Impact | Hours saved × hourly rate ($100) = annual value; minus tool costs = net gain |

## Upsell Specialisation Strategy

Corey's advice: **do not upsell everything from day one**. Pick one and get very good at it:

| Specialisation | Why start here | Example |
|---------------|----------------|---------|
| **Speed-to-Lead** | Most directly tied to revenue; easy to quantify; owners understand it immediately | Wedding venue: AI agent answers website leads while sales rep is on tours |
| **Knowledge System** | Most repeatable — one template, deployed over and over | Business brokerage: custom GPT trained on listing SIM handles 95% of buyer emails |
| **Automation (Zapier/Make)** | Easiest to learn; basic automation knowledge worth $1,000–$3,000 per build | Zapier automation formats new client Asana projects |
| **Process Optimisation** | Highest ticket but requires consulting experience | Save 10 hours/week by redesigning 15-step process to 7 steps |

## Client Acquisition: 7 Methods

1. **Host a local AI meetup** — pure value, collect emails, become the authority
2. **Door-knock local businesses** — lead with "I help small businesses figure out where AI can save them time"
3. **Free assessments for your network** — 1–2 free assessments for testimonials and process refinement
4. **AI office hours** — weekly/monthly free sessions at co-working spaces or professional offices
5. **LinkedIn content** — document learning, share case studies, offer quick tips
6. **Referral partnerships** — partner with accountants, bookkeepers, web designers, business coaches
7. **DM outreach** — personalised messages to small business owners offering a free 15-minute AI conversation

## Revenue Projection (First 6 Months)

| Month | Assessments | Avg Price | Upsell Revenue | Monthly Total | Cumulative |
|-------|------------|-----------|---------------|---------------|------------|
| 1 | 3 (free) | $0 | $0 | $0 | $0 |
| 2 | 4 | $350 | $1,500 | $2,900 | $2,900 |
| 3 | 6 | $700 | $3,000 | $7,200 | $10,100 |
| 4 | 8 | $1,000 | $6,000 | $14,000 | $24,100 |
| 5 | 8–10 | $1,000 | $8,000 | $17,000 | $41,100 |
| 6 | 10 | $1,000 | $10,000 | $20,000 | $61,100 |

## Adjacent Revenue Streams

Beyond assessments and upsells, the business opens five natural extensions:

1. **AI workshops and training** — $500–$2,500 per half-day workshop at professional offices
2. **Assessment certification/training** — $997–$9,997 course teaching others the assessment model
3. **White-label implementation agency** — $1,500–$5,000 per build, delivered under referring agency's brand
4. **Retainer-based AI operations partner** — $500–$1,500/month recurring for ongoing AI check-ins
5. **Vertical-specific assessment products** — specialist pricing at $2,000–$5,000 per assessment

## Open Questions

- What vertical should Agentic AI specialise in first? (Corey stumbled into wedding venues and business brokerages)
- Should the assessment price start at $1,200 AUD or begin lower and escalate?
- Which upsell specialisation aligns best with the team's current technical capabilities?
- How quickly can the report pipeline deliver the 48-hour turnaround?
- Should the pipeline use live web search to look up tools on [Futurepedia](https://www.futurepedia.io/ai-tools) and [There's An AI For That](https://theresanaiforthat.com/), or rely on its training knowledge?
