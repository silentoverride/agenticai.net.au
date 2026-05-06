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

Required server environment variables (see `docs/RETELL-DEPLOYMENT-GUIDE.md` Section 7 for the full list):

```sh
STRIPE_SECRET_KEY=sk_live_or_test_key
RETELL_API_KEY=key_xxxxxxxxxxxxxxxxxxxxx
RETELL_VOICE_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxx
RETELL_TWILIO_WEBHOOK_SECRET=replace_with_shared_secret
PUBLIC_SITE_URL=https://agenticai.net.au
# ...plus Twilio, Clerk, SendGrid, Perplexity, Ollama, internal auth, D1/R2/queue bindings
```

### Call flow

Visitors click **"Start AI Business Assessment"** (`CallAssessmentButton.svelte`) on the website. The browser calls `/api/create-retell-web-call` which:
1. Creates a Retell browser call via `POST /v2/create-web-call` with the `Annie` agent
2. Returns an `access_token` and `call_id`
3. The frontend loads `RetellWebClient` SDK and establishes a WebRTC audio connection
4. Annie conducts the assessment intake voice interview in real time

If the caller approves the fee, Annie creates a Stripe Checkout link. The payment link is sent by SMS (Twilio) to the caller's phone.

### Report pipeline (async)

After payment + transcript are received, the report is generated **asynchronously** via Cloudflare Queue to avoid the 30-second Pages limit:

1. **Retell webhook** (`/api/retell-webhook`) stores the transcript and enqueues the job
2. **Cloudflare Queue** (`assessment-jobs`) holds pending jobs
3. **Queue consumer worker** (`workers/queue-consumer.ts`) picks up jobs and POSTs to `SELF_URL/api/internal/run-pipeline`
4. **Pipeline** (`/api/internal/run-pipeline`) processes:
   - **Perplexity tool lookup** — Finds relevant AI tools via web search (Sonar Pro)
   - **LLM analysis** — Kimi K2.6 via Ollama Cloud structures findings into JSON
   - **R2 storage** — Saves analysis and transcript to Cloudflare R2 (`assessment-blobs`)
   - **SendGrid email** — Notifies the customer with a portal link
5. **Client portal** (`/portal`) — Clerk-authenticated users view their reports as interactive RevealDeck presentations

If the queue is unavailable, the webhook falls back to **inline processing** (not recommended for production).

After checkout, the success page posts the locally stored transcript to `/api/assessment-transcript`, verifies Stripe payment, retrieves the stored transcript, and enqueues the pipeline the same way.

## Direction

Agentic AI presents an AI Business Assessment for small businesses. The offer starts with a structured voice intake with Annie, then produces a practical opportunity report covering quick wins, effort versus impact, specific tool recommendations, ROI estimates, and implementation options.

## Architecture

| Component | Technology |
|-----------|-----------|
| Frontend | SvelteKit + Cloudflare Pages |
| Auth | Clerk (Google OAuth + email OTP) |
| Voice Agent | Retell Conversation Flow (Annie) |
| Transcript Storage | Cloudflare D1 + local SQLite fallback |
| Report Storage | Cloudflare R2 + local filesystem fallback |
| Queue | Cloudflare Queue (`assessment-jobs`) |
| Pipeline Worker | Cloudflare Worker (`workers/queue-consumer.ts`) |
| Payments | Stripe Checkout |
| SMS | Twilio |
| Email | SendGrid |
| Tool Research | Perplexity (Sonar Pro) |
| Report LLM | Kimi K2.6 via Ollama Cloud |
| Scheduling | Calendly (embedded in report) |

## Key Files

| File | Purpose |
|------|---------|
| `src/routes/api/create-retell-web-call/+server.ts` | Browser call creation |
| `src/routes/api/retell-webhook/+server.ts` | Webhook receiver, signature verify, queue job |
| `src/routes/api/stripe/webhook/+server.ts` | Stripe payment confirmation, queue job |
| `src/routes/api/assessment-transcript/+server.ts` | Post-checkout transcript submission, queue job |
| `src/routes/api/internal/run-pipeline/+server.ts` | Pipeline execution (LLM analysis, R2 save, email) |
| `src/lib/server/assessment/pipeline.ts` | Orchestrates Perplexity → LLM → R2 → SendGrid |
| `workers/queue-consumer.ts` | Queue consumer worker |
| `src/lib/server/portal.ts` | Client portal DB logic |

## Documentation

- `docs/RETELL-DEPLOYMENT-GUIDE.md` — Complete setup guide (Retell, Stripe, Twilio, Cloudflare Queue, env vars)
- `docs/retell-annie-voice-agent-workflow.md` — Retell Conversation Flow node-by-node mapping
- `docs/stripe-setup.md` — Stripe webhook and checkout configuration
- `docs/twilio-retell-setup.md` — Twilio phone number and SMS configuration
- `docs/client-portal.md` — Client portal architecture and API reference
- `docs/voice-agent-script.md` — Annie's call script and recovery prompts
- `docs/voice-agent-disclaimer.md` — Disclaimer language
- `docs/retell-report-agent-handoff.md` — How the voice call flows into the report pipeline
- `docs/retell-voice-agent-user-test-script.md` — End-to-end test script

## Initial Site Map

- Home
- Services
- Use Cases
- About
- Contact
- Portal (`/portal` — Clerk-authenticated)
# agenticai.net.au
