---
title: Client Portal
 type: concept
 updated: 2026-05-02
 sources:
  - https://clerk.com/
  - https://revealjs.com/
  - https://calendly.com/
see_also:
  - ../agents/annie-voice-agent.md
  - ../business/service-model.md
  - ../operations/report-pipeline.md
  - ../../docs/client-portal.md
---

# Client Portal

The Agentic AI client portal is a password-protected area where paying customers can view their AI Business Assessment reports as interactive reveal.js slide decks, download their PPTX files, and access their Stripe receipts. Authentication is handled by Clerk.

**Full technical documentation:** [`docs/client-portal.md`](../../docs/client-portal.md) — API reference, configuration, error handling, and usage examples.

## Key Features

| Feature | Description |
|---------|-------------|
| **Auth** | Clerk (OAuth + email/password) — sign-up and sign-in |
| **Reports Viewer** | reveal.js presentation of assessment JSON matching the PPTX template structure |
| **Receipts** | Downloadable Stripe payment receipts, auto-linked by email |
| **Calendly CTA** | Every report ends with a "Book 30-Min Session" button |
| **Auto-linking** | Reports and receipts are linked to users by matching customer email on first login |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Clerk     │────▶│   Portal    │────▶│  reveal.js deck │
│   (auth)    │     │   (Svelte)  │     │  (12 slides)    │
└─────────────┘     └─────────────┘     └─────────────────┘
        │                   │
        ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  SQLite DB  │     │  API routes │
│  (users,    │     │  (/api/portal/*)│
│   reports,  │     └─────────────┘
│   receipts) │
└─────────────┘
```

## Database Schema

Three tables in `app_data/portal.db`:

- **users** — `clerk_id`, `email`, `name`, `phone`
- **user_reports** — `user_id`, `report_id`, `stripe_session_id`, `deck_url`, `title`, `company`
- **receipts** — `user_id` (nullable for pending), `stripe_session_id`, `amount_cents`, `currency`, `customer_email`, `receipt_url`

## Report Slide Structure (reveal.js)

1. **Title** — Company name + assessment date
2. **Executive Summary** — Pain points + outcome
3. **Opportunity at a Glance** — Hours reclaimable, quick-win count, effort level
4. **Impact-Effort Matrix** — Four quadrants
5-8. **Recommended Solutions** — Up to 4 quick wins with tools, effort, impact
9. **4-Day Quick Wins Plan** — Day-by-day implementation
10. **What Comes After Quick Wins** — 3 deeper opportunities with investment estimates
11. **Financial Impact** — Weekly time returned, monthly ROI, tool costs
12. **Next Steps + Calendly CTA** — Implementation steps + book 30-min session button

## Auto-linking Behaviour

When a customer pays via Stripe **before** signing up for the portal:

1. Receipt is saved as **pending** (`user_id IS NULL`)
2. Report metadata on filesystem stores the customer email
3. When the customer later signs into the portal, the API scans:
   - Filesystem reports matching their email → linked to `user_reports`
   - Pending receipts matching their email → linked to `receipts`
4. Dashboard immediately shows their full history

## Routes

| Route | Purpose |
|-------|---------|
| `/portal` | Dashboard (reports + receipts cards) |
| `/portal/reports` | List all reports |
| `/portal/reports/[id]` | View interactive reveal.js presentation |
| `/portal/receipts` | List all receipts with download links |
| `/api/portal/reports` | GET authenticated user's reports |
| `/api/portal/reports/[id]` | GET specific report + analysis JSON |
| `/api/portal/receipts` | GET authenticated user's receipts |
| `/api/portal/receipts/[id]/download` | GET receipt download / redirect to Stripe |

## Environment Variables

```
CLERK_SECRET_KEY=sk_test_...
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
PUBLIC_CALENDLY_URL=https://calendly.com/YOUR_LINK/30min
DB_DIR=./app_data
```

## Open Questions

- Should the portal also show the raw transcript alongside the slide deck?
- Should users be able to regenerate / update their report if they do a second assessment?
- Should the reveal.js deck be downloadable as a self-contained HTML file?
- Do we need a "Share with my team" feature for the report viewer?
