# Retell Report Pipeline Handoff

This document describes how Annie's completed voice intake flows into the AI Business Assessment report pipeline.

## Flow

1. Annie completes the Retell voice intake.
2. Retell sends call webhooks to the website.
3. The website verifies `x-retell-signature` using `RETELL_API_KEY` when configured.
4. The website processes `call_analyzed` by default because that event includes the transcript and `call_analysis`.
5. The website packages the transcript, caller details, post-call analysis, metadata, and dynamic variables.
6. The website runs the self-contained report pipeline:
   - **Perplexity lookup** — Searches Futurepedia and There's An AI For That for relevant AI tools
   - **LLM analysis** — The Kimi K2.6 model (via Ollama Cloud) structures the transcript, extracts pain points, ranks recommendations
   - **R2 storage** — Saves the analysis and transcript durably
   - **SendGrid email** — Delivers a report-ready notification to the customer

Retell documentation references:

- Webhook overview: `https://docs.retellai.com/features/webhook-overview`
- Secure webhook: `https://docs.retellai.com/features/secure-webhook`
- Post-call analysis: `https://docs.retellai.com/features/post-call-analysis`

## Website Endpoint

Configure Retell to send Annie voice webhooks to:

```text
POST https://agenticai.net.au/api/retell-webhook
```

Recommended Retell webhook event:

```text
call_analyzed
```

`call_ended` includes the transcript but does not include `call_analysis`. The website accepts `call_ended` only when `ASSESSMENT_REPORT_PROCESS_CALL_ENDED=true`, which is useful as a transcript-only fallback but can create duplicate report jobs if `call_analyzed` is also enabled.

## Environment Variables

```sh
RETELL_API_KEY=key_xxxxxxxxxxxxxxxxxxxxx
ASSESSMENT_REPORT_PROCESS_CALL_ENDED=false
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxx
PERPLEXITY_MODEL=sonar-pro
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=hello@agenticai.net.au
```

`RETELL_API_KEY` is used to verify the `x-retell-signature` header. Use the Retell API key that has the webhook badge in Retell.

`PERPLEXITY_API_KEY` powers the AI tool research step. If unconfigured, the pipeline continues with the LLM's internal tool knowledge only.

`SENDGRID_API_KEY` and `DEFAULT_FROM_EMAIL` are required for email delivery of the final report notification.

## Pipeline Payload

The pipeline receives this shape from the Retell webhook:

```json
{
  "receivedAt": "2026-04-30T06:00:00.000Z",
  "source": "retell-voice-agent",
  "event": "call_analyzed",
  "callId": "call_xxxxxxxxx",
  "agentId": "agent_xxxxxxxxx",
  "customerName": "Sarah Mitchell",
  "customerEmail": "sarah@example.com",
  "customerPhone": "+61400123456",
  "company": "Harbour Lane Events",
  "paymentStatus": "payment_link_sent",
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

The pipeline produces:

- **Structured analysis** — pain points, quick wins, effort vs. impact matrix, tool recommendations
- **Estimated ROI** — hours saved, financial impact
- **Implementation roadmap** — four-day quick-win plan and larger opportunities
- **Open follow-up questions** — areas that need clarification

## Pipeline Steps

1. **Tool lookup** — Query Perplexity for relevant AI tools from pain points (fallback: LLM training knowledge)
2. **LLM analysis** — Kimi K2.6 (via Ollama Cloud) structures transcript into the assessment report JSON
3. **Tool enrichment** — Merge researched tool URLs, pricing, and descriptions into the analysis
4. **Storage** — Save analysis and metadata to R2 (production) or local filesystem (dev)
5. **User linking** — Link report to customer portal user if email matches
6. **Email delivery** — Send report-ready notification via SendGrid

## Related Files

- Pipeline entry: `src/routes/api/retell-webhook/+server.ts`
- Pipeline runner: `src/lib/server/assessment/pipeline.ts`
- Queue consumer: `workers/queue-consumer.ts`
- Tool lookup: `src/lib/server/assessment/tool-lookup.ts`
- Email delivery: `src/lib/server/assessment/emails.ts`
