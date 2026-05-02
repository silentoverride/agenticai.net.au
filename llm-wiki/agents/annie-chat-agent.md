---
title: Annie Chat Agent
type: concept
updated: 2026-05-02
sources:
  - "docs/retell-annie-chat-agent-workflow.md"
  - "docs/question-knowledgebase.md"
  - "docs/Annie - AI Business Assessment Chat.json"
see_also:
  - "../agents/annie-voice-agent.md"
  - "../integrations/retell.md"
  - "../integrations/stripe.md"
  - "../agents/question-knowledgebase.md"
---

# Annie Chat Agent

Annie is the AI Business Assessment intake assistant for website chat. Built as a Retell Conversation Flow Agent, she guides visitors through a structured discovery interview, collects payment, and hands the transcript to the report pipeline.

> **Status: Not deployed.** The chat agent exists as a Retell Conversation Flow Agent design and was tested in Retell's playground. The live website at agenticai.net.au uses the [Annie Voice Agent](../agents/annie-voice-agent.md) exclusively — a floating voice call button triggers voice calls, not text chat. The chat flow documented here is preserved for future deployment if text-based intake is desired.

## Agent Identity

- **Name:** Annie
- **Role:** AI Business Assessment intake assistant for Agentic AI
- **Channel:** Website chat widget (Retell web chat)
- **Model:** Retell standard LLM
- **Colour:** `#0891b2`
- **Popup message:** "Ask Annie about the AI Business Assessment"

## Core Rules

1. **Discovery only** — Do not recommend specific tools, automations, agents, software, or solutions during intake
2. **One question at a time** — Ask one question, adapt to industry and previous answers
3. **No regulated advice** — Do not provide legal, financial, tax, medical, compliance, or professional advice
4. **No sensitive data** — Do not ask for passwords, API keys, card numbers, bank details, regulated records, or confidential customer files
5. **Payment before processing** — Transcript is only sent for analysis after Stripe payment confirmation

## Conversation Flow

The chat flow has 14 nodes across 4 logical components:

| Component | Nodes | Purpose |
|-----------|-------|---------|
| **Approval** | Opening / Approval, Approval Split, Not Ready | Disclose $1,200 AUD fee, terms, privacy; get approval |
| **Contact Capture** | Contact Details, Contact Complete Split | Collect name, role, company, email, phone |
| **Assessment Intake** | Business Context, Pain Point Discovery, Tools and Systems, Repeated Work, Priorities and Constraints | Run the 20–30 minute discovery interview |
| **Summary and Payment** | Intake Summary, Create Payment Link, Payment Result Split, Payment Link Message, Payment Link Failed | Summarise intake, create Stripe link, send to customer |

### Key Logic Splits

| Split | Success condition | Fallback |
|-------|-----------------|----------|
| **Approval Split** | `{{approval_given}} = true` | Not Ready (exit) |
| **Contact Complete Split** | All required fields exist | Back to Contact Details |
| **Payment Result Split** | `{{url}}` exists and contains `checkout.stripe.com` | Payment Link Failed |

## Payment Integration

The Stripe custom function (`create_assessment_payment_link`) calls:

```http
POST https://agenticai.net.au/api/create-assessment-checkout
```

Payload includes:
- `source`: `retell-chat-agent`
- `customerName`, `customerEmail`, `customerPhone`, `company` — from stored fields
- `transcriptPreview` — LLM-generated summary of the intake

Response: Stripe Checkout URL returned to the chat. No SMS is sent for chat (unlike voice).

## Post-Chat Data

Retell extracts these fields after the chat ends:

| Field | Type | Purpose |
|-------|------|---------|
| `approval_given` | Boolean | Fee/terms approved |
| `payment_link_sent` | Boolean | Stripe link delivered |
| `payment_status` | Text | `pending`, `paid`, `cancelled`, `unknown` |
| `customer_name`, `customer_email`, `customer_phone`, `company` | Text | Contact details |
| `industry`, `team_size`, `current_tools` | Text | Business context |
| `top_pain_points`, `repeated_tasks` | Text | Workflow problems |
| `lead_response_gap`, `knowledge_gap`, `manual_reporting_gap` | Boolean | Opportunity signals |
| `priority_outcome` | Text | What the owner wants most |
| `privacy_or_compliance_constraints` | Text | Implementation constraints |
| `assessment_ready` | Boolean | Whether transcript is suitable for report processing |

## Widget Configuration

```javascript
{
  source: "agenticai-website",
  assessment_fee: "$1,200.00 AUD",
  terms_url: "/terms",
  privacy_url: "/privacy"
}
```

- Auto open: `false`
- Popup delay: `5` seconds

## Testing Plan

Test these scenarios in Retell before going live:

1. User asks what the assessment costs
2. User approves fee and terms
3. User refuses approval
4. User skips email or phone
5. User gives vague pain points
6. User asks for legal/financial/tax/medical/compliance advice
7. User tries to share sensitive information
8. User completes intake and receives Stripe link
9. Stripe function fails
10. User asks whether results are guaranteed
11. User asks for tool recommendations during intake

## Acceptance Criteria

- Price disclosed before intake
- Approval required before intake
- Name, role, company, email, phone collected
- Nodes transition only when required data captured
- One question at a time
- Adapts to industry
- Refuses sensitive information safely
- Avoids tool recommendations during intake
- Creates Stripe payment link
- Transcript processing waits for payment

## Why Not Deployed

The chat widget (`src/lib/components/RetellChatWidget.svelte`) was removed from `+layout.svelte` on 2026-05-02 because the website now uses a **floating voice call button** instead. The RetellChatWidget component was actually a voice call launcher (not a text chat interface) — it triggered voice calls via `toggleCall()` with a phone icon, which was confusingly named. The chat agent flow remains documented in Retell's platform as a Conversation Flow Agent but is not active on the website.
