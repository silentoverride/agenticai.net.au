---
title: Retell Platform Overview
type: concept
updated: 2026-05-02
sources:
  - "https://docs.retellai.com/general/introduction"
  - "docs/retell-annie-chat-agent-workflow.md"
  - "docs/retell-annie-voice-agent-workflow.md"
  - "docs/retell-report-agent-handoff.md"
see_also:
  - "../agents/annie-chat-agent.md"
  - "../agents/annie-voice-agent.md"
  - "../integrations/twilio.md"
  - "../operations/report-pipeline.md"
---

# Retell Platform Overview

Retell is a comprehensive platform for building, testing, deploying, and monitoring AI phone and chat agents. Agentic AI uses Retell as the primary conversation infrastructure for Annie, the AI Business Assessment intake assistant.

## What Retell Provides

Retell handles the full lifecycle of conversational AI agents:

| Capability | What it means for Agentic AI |
|-----------|------------------------------|
| **Build** | Conversation Flow Agents for structured intake calls, plus Single/Multi Prompt Agents for simpler interactions |
| **Test** | Playground for manual testing, Simulation Testing for automated validation at scale |
| **Deploy** | Phone calls via purchased numbers or custom telephony (SIP), plus web chat widget |
| **Monitor** | Real-time webhooks, Post Call Analysis, call transcripts, dashboard analytics |

## Build: Agent Types

Retell supports two agent architectures. Agentic AI uses both:

**Conversation Flow Agent** — used for Annie voice and chat intake.
- Nodes define individual conversation or action steps
- Edges control transitions between nodes
- Logic nodes branch based on extracted values (approval status, payment status)
- Function nodes call external APIs (Stripe payment link creation, transcript handoff)
- Post-call analysis extracts structured fields after the call

**Single/Multi Prompt Agent** — useful for simpler, dynamic conversations where fine-grained control is unnecessary.

## Deploy: Telephony Integration

Retell supports two deployment modes for voice:

| Mode | Setup | Use case |
|------|-------|----------|
| Retell phone numbers | Purchase directly in Retell | Quick start, minimal integration |
| Custom telephony via SIP | Connect Twilio or other provider via SIP trunk | Production scale, existing number portability |

Agentic AI uses **Twilio Elastic SIP Trunking** for production voice calls. This keeps Twilio credentials server-side and enables SMS delivery of payment links.

## Monitor: Events and Analysis

Retell emits webhook events throughout a call:

| Event | When | Agentic AI usage |
|-------|------|------------------|
| `call_started` | Call begins | Monitoring only |
| `call_ended` | Call ends | Transcript-only fallback if `call_analyzed` unavailable |
| `call_analyzed` | Post-call analysis complete | Primary trigger for report pipeline |

Post-call analysis fields configured for Annie include:
- `verbal_approval_given` — whether caller approved fee/terms
- `payment_link_sent` — whether Stripe link was delivered
- `industry`, `team_size`, `current_tools` — business context
- `top_pain_points`, `repeated_tasks` — workflow problems
- `lead_response_gap`, `knowledge_gap`, `manual_reporting_gap` — opportunity signals
- `priority_outcome`, `privacy_or_compliance_constraints` — implementation guidance
- `assessment_ready` — whether transcript is suitable for report processing

## Key Integrations

- **Stripe** — Custom function calls `/api/create-assessment-checkout` to generate payment links
- **Twilio** — SIP trunk for voice; SMS delivery of payment links
- **Website widget** — Retell chat widget (see Clerk authentication setup)
- **Report pipeline** — Self-contained: Perplexity tool lookup → LLM analysis → R2 storage → SendGrid email delivery

## Environment Variables

```sh
# Retell API
RETELL_API_KEY=key_xxxxxxxxxxxxxxxxxxxxx

# Website widget (public)
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxx
```

## Security

- Retell webhooks include `x-retell-signature` header verified with `RETELL_API_KEY`
- Webhook endpoint must respond 2xx quickly; process asynchronously if slow
- Custom functions (Stripe, SMS) use server-side endpoints to keep credentials out of Retell

## Open Questions

- Should Agentic AI enable `call_ended` as a fallback when `call_analyzed` is delayed? (Controlled by `ASSESSMENT_REPORT_PROCESS_CALL_ENDED`)
- What Retell analytics or alerting should be monitored for production health?
