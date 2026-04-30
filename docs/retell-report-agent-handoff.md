# Retell Report Agent Handoff

This handoff makes Annie's completed voice intake automatically flow into a separate report-building agent.

## Flow

1. Annie completes the Retell voice intake.
2. Retell sends call webhooks to the website.
3. The website verifies `x-retell-signature` using `RETELL_API_KEY` when configured.
4. The website processes `call_analyzed` by default because that event includes the transcript and `call_analysis`.
5. The website packages the transcript, caller details, post-call analysis, metadata, and dynamic variables.
6. The website posts that package to `ASSESSMENT_REPORT_AGENT_WEBHOOK_URL`.
7. The report agent analyzes the conversation and builds the AI Business Assessment report.

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
ASSESSMENT_REPORT_AGENT_WEBHOOK_URL=https://report-agent.example.com/webhook
ASSESSMENT_REPORT_AGENT_WEBHOOK_SECRET=replace_with_report_agent_secret
ASSESSMENT_REPORT_PROCESS_CALL_ENDED=false
```

`RETELL_API_KEY` is used to verify the `x-retell-signature` header. Use the Retell API key that has the webhook badge in Retell.

`ASSESSMENT_REPORT_AGENT_WEBHOOK_SECRET` is sent to the report agent as:

```http
Authorization: Bearer <secret>
```

## Report Agent Payload

The website sends this shape to the report agent:

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

The report agent should build the assessment report from:

- transcript
- post-call analysis fields
- company and caller details
- current tools
- top pain points
- repeated tasks
- lead/customer response workflow
- knowledge/documentation gaps
- reporting/visibility gaps
- constraints
- priority outcome
- open questions for follow-up

## Report Agent Instructions

The report agent should:

1. Clean and structure the transcript.
2. Extract workflow pain points, repeated work, handoffs, constraints, and business impact.
3. Identify quick wins without promising guaranteed results.
4. Rank recommendations by effort, impact, cost, and speed to value.
5. Produce the AI Business Assessment report sections:
   - executive summary
   - pain points
   - effort versus impact matrix
   - recommended solutions
   - four-day quick-win plan
   - estimated hours saved and financial impact
   - larger implementation opportunities
   - open follow-up questions

Do not generate legal, financial, tax, medical, compliance, or professional advice.
