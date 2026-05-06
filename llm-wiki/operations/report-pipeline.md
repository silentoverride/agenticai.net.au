---
title: Report Pipeline
type: concept
updated: 2026-05-06
status: implemented
sources:
  - "docs/retell-report-agent-handoff.md"
see_also:
  - "../agents/annie-chat-agent.md"
  - "../agents/annie-voice-agent.md"
  - "../integrations/retell.md"
  - "../integrations/stripe.md"
---

# Report Pipeline

The report pipeline connects Annie's completed intake (voice or chat) to the AI Business Assessment report generation. The pipeline is self-contained — it runs Perplexity tool research, LLM analysis, R2 storage, and SendGrid email delivery without relying on an external report agent service.

## Flow

```
Annie completes intake (Retell)
→ Retell sends webhook to website
→ Website verifies x-retell-signature
→ Website processes call_analyzed (or call_ended fallback)
→ Website packages transcript + analysis + metadata
→ **Perplexity lookup** — Searches Futurepedia / TAAFT for relevant AI tools
→ **LLM analysis** — Kimi K2.6 (via Ollama Cloud) structures transcript into assessment report JSON
→ **Tool enrichment** — Merge researched tool URLs and pricing into analysis
→ **R2 storage** — Save report to R2 (production) or local filesystem (dev)
→ **User linking** — Link report to portal user if email matches
→ **Email delivery** — Send report-ready notification via SendGrid
```

## Environment Variables

```sh
RETELL_API_KEY=key_xxxxxxxxxxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxx
PERPLEXITY_MODEL=sonar-pro
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=hello@agenticai.net.au
DB_DIR=./app_data
REPORTS_DIR=./app_data/reports
ASSESSMENT_REPORT_PROCESS_CALL_ENDED=false
```

## Webhook Events

| Event | Includes | Usage |
| ------- | -------- | ----- |
| `call_analyzed` | Transcript + post-call analysis | **Primary** — recommended event |
| `call_ended` | Transcript only | Fallback when `ASSESSMENT_REPORT_PROCESS_CALL_ENDED=true` |
| `call_started` | Minimal data | Monitoring only |

**Warning:** Enabling both `call_analyzed` and `call_ended` can create duplicate report jobs.

## Website Webhook Endpoint

```
POST https://agenticai.net.au/api/retell-webhook
```

Handler:
1. Receive Retell webhook
2. Verify `x-retell-signature` using `RETELL_API_KEY`
3. Ignore non-reporting events unless needed for monitoring
4. On `call_analyzed`, read transcript and post-call analysis
5. Check conditions:
   - `verbal_approval_given` is true (voice) or `approval_given` is true (chat)
   - Payment completed or payment link was sent
   - `assessment_ready` is true
6. Pipe transcript and analysis to the report pipeline
7. Notify internal team if analysis incomplete, payment failed, or caller did not approve

## Pipeline Job Shape

```json
{
  "receivedAt": "2026-04-30T06:00:00.000Z",
  "source": "retell-voice-agent" | "retell-chat-agent",
  "event": "call_analyzed",
  "callId": "call_xxxxxxxxx",
  "agentId": "agent_xxxxxxxxx",
  "customerName": "Sarah Mitchell",
  "customerEmail": "sarah@example.com",
  "customerPhone": "+61400123456",
  "company": "Harbour Lane Events",
  "paymentStatus": "payment_link_sent" | "paid" | "pending",
  "transcript": "Full Retell transcript...",
  "transcriptObject": [],
  "transcriptWithToolCalls": [],
  "analysis": {
    "custom_analysis_data": {
      "industry": "Hospitality and events",
      "top_pain_points": "Slow enquiry follow-up, manual reporting"
    }
  },
  "metadata": {},
  "dynamicVariables": {}
}
```

## LLM Analysis Instructions

Kimi K2.6 (via Ollama Cloud) structures the assessment report from the transcript:

1. Clean and structure the transcript
2. Extract workflow pain points, repeated work, handoffs, constraints, and business impact
3. **Research and look up appropriate AI software solutions** based on the identified pain points and workflow gaps
4. For each recommended solution, include:
   - **Tool name** and direct URL
   - **What it does** (one-line description)
   - **Pricing** (free tier / paid / approximate cost)
   - **Why it fits** this specific business and pain point
   - **Integration complexity** (plug-and-play, API required, custom build)
5. Identify quick wins without promising guaranteed results
6. Rank recommendations by effort, impact, cost, and speed to value
7. Produce report sections:
   - Executive summary
   - Pain points
   - Effort vs. impact matrix
   - **Recommended solutions** *(with researched AI tools)*
   - Four-day quick-win plan
   - Estimated hours saved and financial impact
   - Larger implementation opportunities
   - Open follow-up questions

**Constraint:** Do not generate legal, financial, tax, medical, compliance, or professional advice.

## Tool Lookup Strategy

Match pain points to AI tool categories:

| Pain Point Category | Search Strategy | Example Tools |
| --------------------- | --------------- | ------------- |
| **Slow lead response** | "lead response AI", "AI sales assistant", "speed to lead" | Lindy, Copy.ai, Instantly |
| **Manual reporting / data entry** | "AI data extraction", "document parsing", "report automation" | Nanonets, Parser AI, Bardeen |
| **Content creation bottleneck** | "AI content generation", "marketing automation" | Jasper, Copy.ai, Kimi K2.6 |
| **Customer support overload** | "AI customer support", "chatbot", "ticket automation" | Intercom Fin, Tidio, Botpress |
| **Meeting scheduling friction** | "AI scheduling assistant", "calendar automation" | Reclaim.ai, Motion, Calendly |
| **Spreadsheet dependency** | "AI spreadsheet", "no-code database", "Airtable alternative" | Rows, Equals, Coda |
| **Email management** | "AI email assistant", "inbox automation", "email draft" | Superhuman, SaneBox, Lavender |
| **Knowledge base gaps** | "AI knowledge base", "internal wiki AI", "GPT trained on documents" | Tettra, Guru, Custom GPT |

**Guideline:** Prioritise tools with free tiers or low-cost entry points for quick wins. Flag enterprise-only tools as "larger implementation opportunities."

## Payment Correlation

The Stripe webhook (`checkout.session.completed`) and Retell webhook both include metadata that allows matching:
- Stripe metadata: `retell_call_id`, `customer_email`, `customer_phone`, `company`
- Retell webhook: `callId`, `customerEmail`, `customerPhone`, `company`

The pipeline waits for Stripe payment confirmation before generating the final report.

## Open Questions

- Should `call_ended` be enabled as a fallback for transcript-only processing?
- What retry logic is needed if Perplexity or the LLM endpoint is unavailable?
- How should the pipeline handle partial or low-quality intake transcripts?
- Should the tool lookup use live web searches (Perplexity), a cached tool database, or both?

## Implementation Notes

- **Code:** `src/lib/server/assessment/pipeline.ts` coordinates the full pipeline
- **Tool lookup:** `src/lib/server/assessment/tool-lookup.ts` implements Perplexity-based lookup
- **LLM analysis:** `src/lib/server/assessment/llm-analysis.ts` sends transcript to Kimi K2.6 (via Ollama Cloud)
- **Storage:** `src/lib/server/assessment/report-store-r2.ts` saves to R2 or local filesystem
- **Email:** `src/lib/server/assessment/emails.ts` delivers report-ready notification via SendGrid
- **Fallback:** If Perplexity fails or is unconfigured, pipeline continues with the LLM's training knowledge only
- **Queue:** In production, jobs are queued via Cloudflare Queue (`assessment-jobs`) and consumed by `workers/queue-consumer.ts`
