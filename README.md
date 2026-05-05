# Agentic AI Website

Website project for Agentic AI.

## Development

Install dependencies:

```sh
npm install
```

Start the local development server:

```sh
npm run dev
```

Build for production:

```sh
npm run build
```

## AI Assessment Operating Assets

- `docs/voice-agent-script.md` contains the intake voice agent script, call flow, guardrails, recovery prompts, and handoff summary format.
- `docs/voice-agent-disclaimer.md` contains short, voice-readout, and internal disclaimer language for Annie.
- `docs/retell-annie-voice-agent-workflow.md` maps Annie into a Retell Conversation Flow Agent with nodes, functions, webhooks, post-call analysis, testing, and deployment steps.
- `docs/stripe-setup.md` explains Stripe setup for the website and Retell voice agent.
- `docs/question-knowledgebase.md` contains the human-readable general and industry-specific question bank.

## Stripe Checkout

The website creates a Stripe Checkout session for the AI Business Assessment fee.

Required server environment variables:

```sh
STRIPE_SECRET_KEY=sk_live_or_test_key
PUBLIC_SITE_URL=https://agenticai.net.au
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=twilio_api_key_secret
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RETELL_TWILIO_WEBHOOK_SECRET=replace_with_shared_secret
```

The website uses Retell's hosted callback widget for Annie. The widget collects visitor contact details and triggers a phone call from the configured Retell phone number to Annie's voice agent. Configure Annie's voice agent, conversation flow, knowledge, and guardrails inside Retell. The assessment price is configured in `src/routes/api/create-assessment-checkout/+server.ts` as `$1,200.00 AUD`.

Twilio sends assessment SMS messages from the backend. When Annie creates a Stripe Checkout link from the Retell voice agent, the website sends the payment link by SMS if Twilio is configured. See `docs/twilio-retell-setup.md`.

Retell posts voice call webhooks to `src/routes/api/retell-webhook/+server.ts`. When the `call_analyzed` event arrives, the website packages the transcript, Retell call analysis, caller details, and dynamic variables, then runs the report pipeline inline (Perplexity tool lookup → LLM analysis → R2 storage → SendGrid email delivery).

After checkout, the success page posts the locally stored transcript to `src/routes/api/assessment-transcript/+server.ts`. The endpoint verifies the Stripe payment, retrieves the stored transcript, and enqueues the report pipeline for processing.

## Direction

Agentic AI presents an AI Business Assessment for small businesses. The offer starts with a structured intake, then produces a practical opportunity report covering quick wins, effort versus impact, specific tool recommendations, ROI estimates, and implementation options.

## Initial Site Map

- Home
- Services
- Use Cases
- About
- Contact
# agenticai.net.au
