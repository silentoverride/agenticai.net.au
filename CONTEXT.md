# Context — Agentic AI Platform

An AI-powered business assessment platform. Customers call a voice agent (Annie), which generates a structured AI assessment report delivered via email and a web portal.

## Core Concepts

### Customer
A person who completes a voice call with Annie. Identified by email. May or may not have a portal account.

### Voice Call
A real-time conversation between a customer and the Annie voice agent, powered by Retell. Produces a transcript.

### Transcript
The text record of a voice call. Stored in DB (`transcripts` table). Trigger for the assessment pipeline.

### Assessment Pipeline
The process that turns a transcript into a deliverable report:
1. **Tool Lookup** — Search Futurepedia/TAAFT for relevant AI tools via Perplexity
2. **LLM Analysis** — Generate structured business assessment using DeepSeek/Gemini
3. **Report Generation** — Save analysis + markdown deck to R2 (prod) or filesystem (dev)
4. **Portal Linking** — Associate report with customer in portal DB
5. **Email Delivery** — Send report-ready notification via SendGrid

Pipeline statuses: `pending` → `queued` → `running_llm` → `running_tools` → `running_deck` → `completed` | `error` | `retry`

### Report
The deliverable artifact from an assessment. Contains analysis JSON, a markdown deck, and metadata. Lives in R2 (production) or local filesystem (development).

### Receipt
Record of a Stripe payment. Linked to a User once they sign up for the portal. Orphan receipts are matched by email on first login.

### User (Portal)
A person with a Clerk-authenticated portal account. Can view reports and receipts. Created/upserted on first auth.

### Session
A Stripe Checkout session. Triggers the assessment flow on completion. Can be linked to a Retell call via metadata.

## Data Model

| Entity | Table(s) | Key Fields |
|--------|----------|-------------|
| User | `users` | clerk_id (PK), email, name, phone, role, company |
| Receipt | `receipts` | id (PK), user_id → users, stripe_session_id, amount_cents |
| Transcript | `transcripts` | call_id (PK), transcript, metadata, processed_at |
| Report | `reports` | id (PK), user_id → users, receipt_id → receipts, call_id → transcripts, session_id, r2_key, deck_url |
| Pipeline Status | `pipeline_status` | session_id (PK), status, report_id → reports, error, attempts |
| Processed Event | `processed_events` | event_id (PK), event_type, processed_at |

## Architecture

- **Frontend**: SvelteKit + Svelte 5, deployed to Cloudflare Pages
- **Backend**: SvelteKit API routes (server-side rendering / endpoints)
- **Auth**: Clerk for portal authentication
- **Database**: Cloudflare D1 (production) / better-sqlite3 (local development)
- **Storage**: Cloudflare R2 for reports
- **Queue**: Cloudflare Queues for async pipeline processing
- **Payments**: Stripe Checkout + webhooks
- **Voice**: Retell AI for real-time calls
- **Email**: SendGrid for transactional emails
- **LLM**: DeepSeek / Perplexity for analysis and tool lookup
