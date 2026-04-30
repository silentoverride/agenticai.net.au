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
PUBLIC_RETELL_VOICE_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxx
PUBLIC_RETELL_VOICE_AGENT_VERSION=0
PUBLIC_RETELL_CALLBACK_PHONE_NUMBER=+61000000000
PUBLIC_RETELL_CALLBACK_COUNTRIES=AU
PUBLIC_RETELL_RECAPTCHA_KEY=optional_recaptcha_v3_site_key
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=twilio_api_key_secret
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RETELL_TWILIO_WEBHOOK_SECRET=replace_with_shared_secret
ASSESSMENT_REPORT_AGENT_WEBHOOK_URL=https://report-agent.example.com/webhook
ASSESSMENT_REPORT_AGENT_WEBHOOK_SECRET=replace_with_report_agent_secret
ASSESSMENT_REPORT_PROCESS_CALL_ENDED=false
```

The website uses Retell's hosted callback widget for Annie. The widget collects visitor contact details and triggers a phone call from the configured Retell phone number to Annie's voice agent. Configure Annie's voice agent, conversation flow, knowledge, and guardrails inside Retell. The assessment price is configured in `src/routes/api/create-assessment-checkout/+server.ts` as `$1,200.00 AUD`.

Twilio sends assessment SMS messages from the backend. When Annie creates a Stripe Checkout link from the Retell voice agent, the website sends the payment link by SMS if Twilio is configured. See `docs/twilio-retell-setup.md`.

Retell posts voice call webhooks to `src/routes/api/retell-webhook/+server.ts`. When the `call_analyzed` event arrives, the website packages the transcript, Retell call analysis, caller details, and dynamic variables, then sends them to `ASSESSMENT_REPORT_AGENT_WEBHOOK_URL` for report generation. If no report-agent webhook URL is configured, the job is logged server-side.

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
