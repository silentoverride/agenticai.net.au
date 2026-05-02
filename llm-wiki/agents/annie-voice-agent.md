---
title: Annie Voice Agent
type: concept
updated: 2026-05-02
sources:
  - "docs/retell-annie-voice-agent-workflow.md"
  - "docs/voice-agent-script.md"
  - "docs/voice-agent-disclaimer.md"
  - "docs/retell-voice-agent-user-test-script.md"
  - "docs/question-knowledgebase.md"
see_also:
  - "../agents/annie-chat-agent.md"
  - "../integrations/retell.md"
  - "../integrations/twilio.md"
  - "../integrations/stripe.md"
  - "../operations/report-pipeline.md"
---

# Annie Voice Agent

Annie is the AI Business Assessment intake assistant for voice calls. Built as a Retell Conversation Flow Agent, she answers inbound calls (or makes scheduled outbound calls), guides callers through a structured discovery interview, collects verbal approval, takes payment via Stripe + Twilio SMS, and hands the transcript to the report pipeline.

## Agent Identity

- **Name:** Annie
- **Role:** AI Business Assessment intake assistant for Agentic AI
- **Channel:** Phone calls via Twilio SIP trunk → Retell, and website voice call button
- **Model:** Retell Conversation Flow Agent (not single-prompt)
- **Tone:** Calm, direct, conversational. One question at a time. Plain business language.

## Core Rules

1. **Discovery only** — Do not recommend specific tools, automations, or software during the call
2. **No regulated advice** — Do not provide legal, financial, tax, medical, compliance, or professional advice
3. **No sensitive data** — Do not ask for passwords, API keys, card numbers, bank details, confidential customer records
4. **Payment before processing** — Transcript only sent for analysis after Stripe payment confirmation
5. **Verbal approval required** — Caller must explicitly approve the $1,200 AUD fee, terms, privacy policy, and disclaimer before intake begins

## Conversation Flow (14 Nodes)

| Node | Type | Purpose |
|------|------|---------|
| 1. Greeting and Call Purpose | Conversation | Introduce Annie and explain why the caller is speaking with her |
| 2. Disclaimer, Price, Process, Report | Conversation | Disclose $1,200 AUD fee, terms, privacy, disclaimer; ask for verbal approval |
| 3. Approval Confirmation and Contact Details | Conversation | Confirm approval recorded; collect name, role, company, email, phone |
| 4. General Business Discovery | Conversation | Industry, business model, team size, customers, revenue channels |
| 5. Pain Point Discovery | Conversation | Biggest headache, recent example, frequency, impact |
| 6. Tools and Systems | Conversation | Software stack, disconnected systems, spreadsheets as source of truth |
| 7. Repeated Work, Handoffs, and Knowledge | Conversation | Daily/weekly repeated tasks, FAQs, manual reports, owner-dependent decisions |
| 8. Industry-Specific Deep Dive | Conversation | Targeted questions from `question-knowledgebase.md` based on industry |
| 9. Priority and Constraints | Conversation | What matters most, privacy/compliance concerns, approver, timeline |
| 10. Intake Summary and Confirmation | Conversation | Summarise what Annie heard; ask for corrections |
| 11. Payment Setup | Function/Subagent | Create Stripe payment link; send by Twilio SMS |
| 12. No Approval or Not Ready | Conversation | Exit politely if caller does not approve |
| 13. Fallback Support | Conversation | Handle payment failure, confusion, or unsupported requests |
| 14. End Call | End | Close cleanly with next steps |

## Voice Agent Script

The full script (`docs/voice-agent-script.md`) provides:
- Opening with price disclosure and approval request
- 13 question sections covering business context, operating rhythm, pain points, tools, manual work, communication, leads, knowledge, reporting, constraints, and prioritisation
- Recovery prompts for vague or confused callers
- Handoff summary format for post-call structured data
- Mock conversation example (Harbour Lane Events — wedding venue)

## Disclaimer

Annie must read a disclaimer before starting intake:

> "I am an AI intake assistant for Agentic AI. I do not provide legal, financial, tax, medical, compliance, or professional advice. Please do not share passwords, API keys, bank details, card numbers, confidential customer records, or unnecessary sensitive personal information. The AI Business Assessment costs $1,200.00 AUD. With your approval, I will complete the intake, then payment will be collected securely through Stripe before your transcript is processed into a report. The report is advisory and does not guarantee specific savings, revenue, conversion rates, compliance outcomes, or business results."

## Payment Flow (Voice)

1. Annie completes intake
2. Calls `create_assessment_payment_link` function → website creates Stripe Checkout session
3. **If Twilio configured:** Website sends Stripe Checkout URL by SMS automatically
4. Annie tells caller: "I have sent the secure payment link by SMS"
5. Caller pays in Stripe Checkout
6. Stripe webhook (`checkout.session.completed`) confirms payment
7. Report pipeline processes transcript

The voice payment function returns:
```json
{
  "url": "https://checkout.stripe.com/...",
  "sms": { "sent": true, "sid": "SM...", "status": "queued" }
}
```

If SMS fails, Annie uses the configured Retell fallback channel. Annie never reads long Checkout URLs aloud unless the caller asks.

## Custom Functions

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `create_assessment_payment_link` | `POST /api/create-assessment-checkout` | Create Stripe Checkout + send SMS |
| `send_assessment_sms` | `POST /api/send-assessment-sms` | Send custom SMS outside payment flow |
| `queue_assessment_transcript` | Production report endpoint | Queue transcript for report generation |

## Post-Call Analysis Fields

Same fields as the chat agent (see [Annie Chat Agent](../agents/annie-chat-agent.md)), plus:
- `verbal_approval_given` — whether caller gave verbal approval

## Testing Plan

Test scenarios:
1. Caller approves and completes normal intake
2. Caller asks about cost before approving
3. Caller refuses approval
4. Caller tries to share password or card number
5. Caller asks for legal/medical/tax/financial/compliance advice
6. Caller gives vague answers
7. Caller from various industries (real estate, healthcare, trades, ecommerce, hospitality, professional services, nonprofit)
8. Payment link function succeeds
9. Payment link function fails
10. Call ends early

## User Test Script

The user test script (`docs/retell-voice-agent-user-test-script.md`) provides a complete mock caller persona (Sarah Mitchell, Harbour Lane Events) with scripted answers for every question category. This is used for structured testing in Retell's playground or simulation testing.

## Deployment Checklist

1. Create Retell Conversation Flow Agent
2. Add global prompt and personality from `voice-agent-script.md`
3. Add nodes described above
4. Upload/connect question knowledgebase
5. Configure guardrails for prohibited topics and sensitive information
6. Add custom function for Stripe payment link creation
7. Add webhook URL for call events and post-call analysis
8. Create post-call analysis fields
9. Test in Retell playground
10. Run simulation tests for approval, refusal, sensitive data, and industry paths
11. Add payment method in Retell
12. Purchase or connect phone number
13. Assign Annie to the number
14. Run live test calls
15. Monitor dashboard history, call recordings, transcripts, and analysis fields

## Operational Notes

- If payment must happen during the same call, send the Stripe link by SMS and pause while the caller completes payment. For smoother experience, finish intake, send the link, and process transcript after Stripe confirms payment.
- Do not ask the caller to read card details aloud
- Keep transcript processing separate from report generation
- Keep a human review step before sending the final assessment report
- Review failed calls weekly and add examples to Retell fine-tuning
