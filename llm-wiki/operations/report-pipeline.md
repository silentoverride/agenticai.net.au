---
title: Report Pipeline
type: concept
updated: 2026-05-02
status: implemented
sources:
  - "docs/retell-report-agent-handoff.md"
see_also:
  - "../agents/annie-chat-agent.md"
  - "../agents/annie-voice-agent.md"
  - "../integrations/retell.md"
  - "../integrations/stripe.md"
  - "../reports/presenton.md"
---

# Report Pipeline

The report pipeline connects Annie's completed intake (voice or chat) to the AI Business Assessment report generation. After payment confirmation, the transcript and post-call analysis are forwarded to a report-building agent.

## Flow

```
Annie completes intake (Retell)
→ Retell sends webhook to website
→ Website verifies x-retell-signature
→ Website processes call_analyzed (or call_ended fallback)
→ Website packages transcript + analysis + metadata
→ **Website extracts pain points → queries AI tool lookup (cache → Perplexity fallback)**
→ Website posts transcript + analysis + tool suggestions to ASSESSMENT_REPORT_AGENT_WEBHOOK_URL
→ Report agent (Claude) analyzes and builds the assessment report with verified tools
```

## Environment Variables

```sh
RETELL_API_KEY=key_xxxxxxxxxxxxxxxxxxxxx
ASSESSMENT_REPORT_AGENT_WEBHOOK_URL=https://report-agent.example.com/webhook
ASSESSMENT_REPORT_AGENT_WEBHOOK_SECRET=replace_with_report_agent_secret
ASSESSMENT_REPORT_PROCESS_CALL_ENDED=false
```

## Webhook Events

| Event | Includes | Usage |
|-------|----------|-------|
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
6. Pipe transcript and analysis to report-building agent
7. Notify internal team if analysis incomplete, payment failed, or caller did not approve

## Report Agent Payload

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

## Report Agent Instructions

The report agent should:

1. Clean and structure the transcript
2. Extract workflow pain points, repeated work, handoffs, constraints, and business impact
3. **Research and look up appropriate AI software solutions** from [Futurepedia](https://www.futurepedia.io/ai-tools) and [There's An AI For That](https://theresanaiforthat.com/) based on the identified pain points and workflow gaps
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
   - Effort versus impact matrix
   - **Recommended solutions** *(with researched AI tools from Futurepedia / TAAFT)*
   - Four-day quick-win plan
   - Estimated hours saved and financial impact
   - Larger implementation opportunities
   - Open follow-up questions

**Constraint:** Do not generate legal, financial, tax, medical, compliance, or professional advice.

## Tool Lookup Strategy

The report agent should match pain points to AI tool categories:

| Pain Point Category | Search Strategy | Example Tools |
|---------------------|-----------------|---------------|
| **Slow lead response** | "lead response AI", "AI sales assistant", "speed to lead" | Lindy, Copy.ai, Instantly |
| **Manual reporting / data entry** | "AI data extraction", "document parsing", "report automation" | Nanonets, Parser AI, Bardeen |
| **Content creation bottleneck** | "AI content generation", "marketing automation" | Jasper, Copy.ai, Claude |
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

Report pipeline should wait for Stripe payment confirmation before generating the final report.

## Open Questions

- Should `call_ended` be enabled as a fallback for transcript-only processing?
- What retry logic is needed if the report agent webhook is unavailable?
- How should the pipeline handle partial or low-quality intake transcripts?
- **Should the report agent perform live web searches on Futurepedia and TAAFT, or should tool recommendations come from its training knowledge?**
- **Which lookup strategy is most reliable: search API (Perplexity/Exa), browser automation, or a cached tool database?**

## Tool Lookup Architecture (Proposed)

For programmatic AI tool discovery, three approaches exist. The hybrid approach (cached + live fallback) is recommended for reliability and speed.

### Approach A: Live Search API (Recommended Primary)

Use a search API to query Futurepedia and TAAFT in real-time:

```
Pain points extracted from transcript
→ Perplexity API: "site:futurepedia.io OR site:theresanaiforthat.com lead response AI tools small business"
→ Parse results: tool name, URL, description, pricing hints
→ Feed structured results to Claude for report formatting
```

**Pros:** Always current, captures new tools, respects site rate limits via API
**Cons:** Adds 5–15 seconds per query, costs per search call
**Best for:** High-value reports where accuracy matters more than speed

### Approach B: Browser Automation (Fallback)

Programmatically search the directories using a headless browser:

```
Pain points → Puppeteer/Playwright navigates to futurepedia.io/search?q=...
→ Scrapes result cards: name, URL, category, rating
→ Same for theresanaiforthat.com
→ Returns structured JSON to pipeline
```

**Pros:** Direct from source, sees exact same results as human
**Cons:** Fragile to UI changes, slower, may hit anti-bot measures
**Best for:** Backup when search APIs fail or return stale results

### Approach C: Cached Tool Database (Fastest)

Maintain a periodically refreshed local database:

```
Scheduled job (weekly) scrapes top tools from both directories
→ Stores in SQLite/Postgres: name, url, category, pricing, description, last_updated
→ Pipeline queries local DB by category/tags
→ Claude receives pre-structured tool data instantly
```

**Pros:** Instant lookup, no external API dependency, works offline
**Cons:** Stale data, misses new tools, requires maintenance job
**Best for:** Speed-critical pipeline where "good enough" tool knowledge suffices

### Recommended Hybrid Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Claude extracts pain points from transcript       │
│  Step 2: Query cached DB for known tools by category       │
│  Step 3: If cache stale/missing → Perplexity live search   │
│  Step 4: Merge results, deduplicate, verify URLs alive       │
│  Step 5: Claude structures report with verified tools      │
│  Step 6: Template mapper transforms JSON → 9-slide layout  │
│  Step 7: Presenton from-json generates branded PPTX        │
└─────────────────────────────────────────────────────────────┘
```

### Perplexity Search Prompt Template

```json
{
  "model": "sonar-pro",
  "messages": [
    {
      "role": "system",
      "content": "You are an AI tool researcher. Find specific AI software tools from futurepedia.io and theresanaiforthat.com that solve the described business problem. Return ONLY a JSON array of tools with: name, url, one_line_description, pricing_hint, category. Limit to 5 tools."
    },
    {
      "role": "user",
      "content": "Business: Wedding venue. Pain point: Slow lead response — enquiries come in via website and Instagram but staff are often on tours and responses take 4+ hours. Need: AI tool that automatically responds to leads instantly with personalised info."
    }
  ]
}
```

### Expected Output Format

```json
[
  {
    "name": "Lindy",
    "url": "https://www.futurepedia.io/tool/lindy",
    "one_line_description": "AI assistant that automates email and lead responses with custom workflows",
    "pricing_hint": "Free tier available; paid from $49/month",
    "category": "lead_response",
    "source": "futurepedia"
  },
  {
    "name": "Instantly",
    "url": "https://www.futurepedia.io/tool/instantly",
    "one_line_description": "Cold email and lead outreach automation with AI personalisation",
    "pricing_hint": "From $37/month",
    "category": "lead_response",
    "source": "futurepedia"
  }
]
```

### Integration into Report Pipeline

Add a new async step between transcript processing and Claude formatting:

```typescript
// Pseudocode for pipeline step
async function lookupToolsForPainPoints(painPoints: string[]): Promise<Tool[]> {
  const cache = await queryToolCache(painPoints);
  if (cache.fresh && cache.results.length >= 3) return cache.results;
  
  const searchResults = await perplexitySearch(
    `site:futurepedia.io OR site:theresanaiforthat.com ${painPoints.join(' ')} AI tools`
  );
  
  const parsed = parsePerplexityToTools(searchResults);
  await updateToolCache(parsed);
  return parsed;
}
```

### Environment Variables

```sh
# Required for live search approach
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxx
PERPLEXITY_MODEL=sonar-pro

# Required for cached approach
TOOL_CACHE_DB_URL=sqlite:///app_data/tool_cache.db
TOOL_CACHE_REFRESH_CRON=0 3 * * 1  # Weekly Monday 3am

# Optional: fallback browser automation
BROWSER_AUTOMATION_ENABLED=false
BROWSER_AUTOMATION_TIMEOUT_MS=30000
```

## Implementation Notes

- **Code:** `src/lib/server/assessment/tool-lookup.ts` implements Perplexity-based lookup
- **Integration:** `src/lib/server/assessment/pipeline.ts` calls `lookupToolsForTranscript()` before analysis
- **Env:** `PERPLEXITY_API_KEY` and `PERPLEXITY_MODEL=sonar-pro` required
- **Fallback:** If Perplexity fails or is unconfigured, pipeline continues with Claude's training knowledge only
- **Cache:** Not yet implemented — current implementation uses live Perplexity search every time
