# Agentic AI (.net.au) — Project Documentation Index

**Generated:** 2026-05-30  
**Scan Mode:** Exhaustive (initial_scan)  
**Primary Project Type:** web (SvelteKit)  
**Repository Type:** Monolith

---

## 1. Project Overview

Brownfield SvelteKit 5 application for AI-powered business assessments (Annie voice/chat intake, pipeline processing, staff portal, client portal, Retell integration, Stripe payments, follow-ups).

**Core Purpose**
- Deliver AI business assessments via voice (Retell) + chat intake
- Pipeline orchestration with gates, reports, and human-assist workflows
- Staff and client portals with Clerk authentication
- Commercial features: Stripe checkout, Calendly, follow-up management

---

## 2. Technology Stack (from project-context.md + scan)

- **Framework**: SvelteKit ^2.20.0 + Svelte ^5.28.0 (runes)
- **Adapter**: @sveltejs/adapter-cloudflare ^7.2.8 (Pages + Workers)
- **Build**: Vite ^6.3.4, TypeScript ^5.8.3 (strict)
- **Database**: Cloudflare D1 (`assessment_db`) + local better-sqlite3 fallback
- **Storage**: Cloudflare R2 (`assessment_blobs`)
- **Queue**: Cloudflare Queues (`assessment_queue`)
- **Auth**: Clerk (`@clerk/backend`, `svelte-clerk`)
- **Voice**: Retell AI (web calls, webhooks, transcripts)
- **Payments**: Stripe (checkout, webhooks)
- **Other**: Playwright (E2E), Vitest, wrangler, Calendly, Presenton, Perplexity

**Key Constraints**
- ESM only (`"type": "module"`)
- Cloudflare Pages deployment (`wrangler pages deploy`)
- Strict CSP in `svelte.config.js` (Retell, Clerk, Stripe, Calendly, etc.)
- Never import `better-sqlite3` in Cloudflare runtime

---

## 3. Architecture Highlights

### Frontend / Routes
- File-based SvelteKit routing
- Major sections: `/portal`, `/staff`, `/assessment`, `/dashboard`, `/services`, `/about`, etc.
- 49 API endpoints under `src/routes/api/`

### Server Layer (`src/lib/server/`)
- `db.ts`, `assessment/`, `pipeline-store`
- Auth: `auth.ts`, `portal-auth.ts`, `staff-auth.ts`, `staff-invite.ts`
- Integrations: `retell.ts`, `stripe.ts`, `twilio.ts`, `email.ts`, `llm.ts`
- Supporting: `rate-limiter.ts`, `validation.ts`, `api-error.ts`

### Data & Migrations
- 4+ migrations (init, intake_progress, pipeline_state, user_role, call_id)
- Assessment reports, pipeline status, intake transcripts

### BMAD / Agent Layer
- Extensive `_bmad/` skills, WDS workflows, planning artifacts (`_bmad-output/`)
- LLM Wiki (`llm-wiki/`)
- `.agents/skills/` custom agents

### Deployment & Ops
- Cloudflare Pages + Workers
- `wrangler.toml` + separate `workers/wrangler.toml`
- GitHub Actions (gate-regression.yml)
- E2E reports in `app_data/`

---

## 4. Key Integrations & External Services

- **Retell**: Voice agent (Annie), web calls, webhooks, transcripts
- **Stripe**: Checkout sessions, webhooks, receipts
- **Clerk**: User/organization auth, staff vs portal roles
- **Calendly**: Meeting booking
- **Others**: Twilio, Presenton, Perplexity, LiveKit

---

## 5. Documentation Structure (Planned)

This index will be expanded with:
- API surface catalog
- Data models & schema
- Authentication & authorization matrix
- Pipeline & gate architecture
- Deployment & environment variables
- BMAD skill inventory
- Testing strategy (Vitest + Playwright)
- Technical debt & improvement opportunities

---

**Data Models Progress**:
- 0001: users, user_reports, receipts
- 0002: intake_progress (Annie chat), transcripts, pipeline_status (with status enum + idempotency keys)
- Additional migrations: user_role, call_id

See `data-models.md` for complete schema details from migrations 0001–0004.
See `api-catalog.md` for grouped list of all 49 endpoints.
See `auth-matrix.md` for Clerk role separation (staff vs portal).

**API Surface (49 endpoints)**
- assessment/*: checkout, transcript, queue, regenerate
- portal/*: receipts, reports, user, assessments, access
- staff/*: assessments actions, audit-events, follow-ups
- stripe/*, retell-webhook, create-retell-web-call
- pipeline-status, internal/run-pipeline, chat/intake, benchmark, test/*
- Others: send-assessment-sms, end-call, assessment-transcript

**Auth & Security**
- Clerk-based (staff vs portal roles via portal-auth.ts, staff-auth.ts, staff-invite.ts)
- Rate limiting, validation, api-error handling
- Strict CSP in svelte.config.js covering Retell, Clerk, Stripe, Calendly, LiveKit, etc.

**Deployment**
- Cloudflare Pages + Workers (wrangler)
- D1 (assessment_db), R2 (assessment_blobs), Queues
- Separate workers/wrangler.toml for queue consumer

**BMAD / Agentic Layer**
- Full BMAD skills in _bmad/ + .agents/skills/
- Extensive planning/implementation artifacts in _bmad-output/
- LLM Wiki in llm-wiki/
- WDS workflows and custom agents

**Recommendations / Technical Debt**
- High volume of generated artifacts — consider archiving strategy
- 49 API routes — good candidate for OpenAPI spec generation
- Strong separation of concerns in server/ modules
- Continue expanding this index with detailed data models and per-API docs

**Generated Documentation Files**
- `index.md` — Main project index
- `data-models.md` — Schema from migrations
- `api-catalog.md` — All 49 API endpoints
- `auth-matrix.md` — Clerk auth & roles

---
*State: documentation_generation phase active*