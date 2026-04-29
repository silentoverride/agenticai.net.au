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
- `docs/voice-agent-disclaimer.md` contains short, voice-readout, chatbot, and internal disclaimer language for Annie.
- `docs/retell-annie-voice-agent-workflow.md` maps Annie into a Retell Conversation Flow Agent with nodes, functions, webhooks, post-call analysis, testing, and deployment steps.
- `docs/retell-annie-chat-agent-workflow.md` maps Annie into a Retell Chat Agent and website widget deployment.
- `docs/stripe-setup.md` explains Stripe setup for the website, Retell chat agent, and Retell voice agent.
- `docs/question-knowledgebase.md` contains the human-readable general and industry-specific question bank.
- `docs/question-knowledgebase.json` contains the same question base in a machine-readable format for voice-agent configuration or downstream tooling.

## Stripe Checkout

The website chatbot creates a Stripe Checkout session for the AI Business Assessment fee.

Required server environment variables:

```sh
STRIPE_SECRET_KEY=sk_live_or_test_key
PUBLIC_SITE_URL=https://agenticai.net.au
PUBLIC_RETELL_PUBLIC_KEY=key_xxxxxxxxxxxxxxxxxxxxx
PUBLIC_RETELL_CHAT_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxx
PUBLIC_RETELL_CHAT_AGENT_VERSION=0
PUBLIC_RETELL_RECAPTCHA_KEY=optional_recaptcha_v3_site_key
```

The website uses Retell's hosted chat widget for Annie. Configure Annie's LLM, prompt, knowledge, and guardrails inside Retell. The assessment price is configured in `src/routes/api/create-assessment-checkout/+server.ts` as `$1,200.00 AUD`.

After checkout, the success page posts the locally stored chatbot transcript to `src/routes/api/assessment-transcript/+server.ts`. That endpoint currently logs the transcript server-side; replace that with CRM, email, database, or report-processing integration for production.

## Direction

Agentic AI presents an AI Business Assessment for small businesses. The offer starts with a structured intake, then produces a practical opportunity report covering quick wins, effort versus impact, specific tool recommendations, ROI estimates, and implementation options.

## Initial Site Map

- Home
- Services
- Use Cases
- About
- Contact
# agenticai.net.au
