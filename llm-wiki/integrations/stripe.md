---
title: Stripe Payment Integration
type: reference
updated: 2026-05-02
sources:
  - "docs/stripe-setup.md"
see_also:
  - "../agents/annie-chat-agent.md"
  - "../agents/annie-voice-agent.md"
  - "../integrations/twilio.md"
  - "./stripe-platform.md"
---

# Stripe Payment Integration

The AI Business Assessment costs **$1,200.00 AUD**. Payment is collected with Stripe Checkout after Annie completes intake. Annie never collects card details by voice or chat.

## Payment Flow

```
Retell Annie (voice or chat) completes intake
→ Website creates Stripe Checkout session
→ [Voice only] Twilio sends Checkout link by SMS
→ Customer pays in Stripe Checkout
→ Stripe confirms payment via webhook
→ Retell transcript sent to report pipeline
```

## Environment Variables

```sh
STRIPE_SECRET_KEY=rk_test_or_live_restricted_key
PUBLIC_SITE_URL=https://agenticai.net.au
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
```

## Checkout Endpoint

| Field | Value |
|-------|-------|
| Endpoint | `POST https://agenticai.net.au/api/create-assessment-checkout` |
| Source | `src/routes/api/create-assessment-checkout/+server.ts` |
| Mode | `payment` |
| Currency | `aud` |
| Amount | `120000` cents ($1,200.00 AUD) |
| Product | "AI Business Assessment" |
| Phone collection | enabled |
| Billing address | auto |

## Retell Function Configuration

| Field | Value |
|-------|-------|
| Name | `create_assessment_payment_link` |
| Method | `POST` |
| URL | `https://agenticai.net.au/api/create-assessment-checkout` |
| Payload mode | Args only, if available |

Arguments:
```json
{
  "source": "retell-voice-agent" | "retell-chat-agent",
  "customerName": "{{customer_name}}",
  "customerEmail": "{{customer_email}}",
  "customerPhone": "{{customer_phone}}",
  "company": "{{company}}",
  "transcriptPreview": "Short intake summary"
}
```

## Return URLs

| Outcome | URL |
|---------|-----|
| Success | `/assessment/success?session_id={CHECKOUT_SESSION_ID}` |
| Cancel | `/?assessment=cancelled` |

## Stripe Metadata

| Key | Value |
|-----|-------|
| `source` | `retell-voice-agent` or `retell-chat-agent` |
| `assessment_fee_aud` | `1200.00` |
| `transcript_preview` | Short intake preview |
| `customer_name` | Caller name |
| `customer_phone` | Caller phone |
| `company` | Business name |

## Webhook Setup

Event: `checkout.session.completed`
Endpoint: `POST https://agenticai.net.au/api/stripe/webhook`

Handler:
1. Verifies Stripe signature using HMAC-SHA256
2. Extracts metadata and payment details
3. Logs structured record with session ID, status, customer info
4. Triggers the report pipeline to match payment to transcript and generate the assessment report

Correlation: metadata includes `retell_call_id` so the report pipeline can match payment to transcript.

## Test Card

```
4242 4242 4242 4242
```
Any future expiry, any CVC, any postal code.

## Security Rules

- Use Stripe Checkout, not voice card collection
- Keep Stripe keys server-side only
- Use restricted keys for Annie checkout (permission: Checkout Sessions → Write)
- Do not expose `STRIPE_SECRET_KEY` to Retell or browser
- Do not store card numbers
- Process transcripts only after payment confirmation
- Rotate keys if exposed

## Live Checklist

1. Complete Stripe account verification
2. Create live restricted key with Checkout Sessions: Write
3. Set `STRIPE_SECRET_KEY=rk_live_...`
4. Set `PUBLIC_SITE_URL=https://agenticai.net.au`
5. Configure Stripe webhook and `STRIPE_WEBHOOK_SECRET`
6. Run one live low-risk payment test
7. Confirm Annie discloses $1,200.00 AUD fee before intake
8. Confirm Annie does not collect card details
