---
title: Stripe Platform Documentation
type: reference
updated: 2026-05-02
sources:
  - "https://docs.stripe.com/"
  - "https://docs.stripe.com/payments/checkout"
  - "https://docs.stripe.com/webhooks"
  - "https://docs.stripe.com/testing-use-cases"
see_also:
  - "./stripe.md"
---

# Stripe Platform Documentation

Official Stripe documentation reference covering Checkout Sessions, webhooks, testing, and security practices relevant to the Agentic AI assessment payment flow.

## Checkout Sessions

Stripe Checkout provides pre-built payment UIs for one-time and subscription payments. Three UI options are available via the Checkout Sessions API:

| Option | Hosting | Complexity | Best For |
|--------|---------|-----------|----------|
| **Full page** | Stripe-hosted or embedded | Low | Most use cases; built-in support for Billing, Tax, Adaptive Pricing, Link, dynamic payment methods |
| **Embedded form** | Embedded on your site | Some | No redirect required; 70 configurable appearance settings |
| **Elements** | Embedded | Most | Fully custom CSS; full control over payment experience |

Agentic AI uses the **Full page** option — redirect to a Stripe-hosted checkout page.

### Key Features Available

- **Adaptive Pricing** — customers pay in their local currency
- **Link** — Stripe's one-click payment method for returning customers
- **Dynamic payment methods** — payment methods shown based on customer location and device
- **Tax collection** — automatic tax calculation for one-time payments
- **Discounts and promo codes** — trials, discounts, optional items
- **Customer portal** — self-service for subscriptions (not used for one-time assessments)

### API Version

Checkout Sessions API is the same across all three UI options. The core endpoints are:

```
POST /v1/checkout/sessions      — create a session
GET  /v1/checkout/sessions/:id  — retrieve a session
```

## Webhooks

Webhooks push real-time event data to your application when events occur in your Stripe account.

### How Webhooks Work

1. You register an HTTPS webhook endpoint URL in Stripe
2. Stripe sends a JSON payload with an Event object to your endpoint when events occur
3. Your endpoint verifies the signature, processes the event, and returns 2xx quickly

### Webhook Handler Requirements

```
- Accept POST requests with JSON payload
- Return 2xx before complex logic (prevent timeouts)
- Verify webhook signature using endpoint secret
- Handle event.type to route to appropriate handler
```

### Signature Verification

Stripe signs webhook payloads with a secret unique to each endpoint. Verification prevents replay attacks and spoofed events:

```
Header: stripe-signature
Secret: whsec_... (endpoint-specific, NOT your API key)
```

The payload must be verified using the **raw request body** — do not parse then re-serialize before verification.

### Key Event Types for Agentic AI

| Event | When it fires | Action |
|-------|--------------|--------|
| `checkout.session.completed` | Customer completes Checkout | Trigger report pipeline; confirm payment |
| `checkout.session.expired` | Checkout session expires | Log; may retry or follow up |
| `payment_intent.succeeded` | Payment succeeds | Backup confirmation |
| `payment_intent.payment_failed` | Payment fails | Log; notify customer |

### Testing Webhooks Locally

Use the Stripe CLI to forward events to a local endpoint:

```bash
# Forward all events
stripe listen --forward-to localhost:4242/webhook

# Forward specific events only
stripe listen --events checkout.session.completed,payment_intent.succeeded \
  --forward-to localhost:4242/webhook

# Forward from your registered public endpoint
stripe listen --load-from-webhooks-api --forward-to localhost:4242/webhook
```

The CLI outputs a webhook signing secret for local verification.

### Event Destinations

You can register up to **16 webhook endpoints** per Stripe account. You can also send events to AWS EventBridge or Azure Event Grid as alternative destinations.

## Test Mode and Sandboxes

### Test Mode Sandbox

Every Stripe account starts in a test mode sandbox:

- Test API keys begin with `pk_test_` (publishable) and `sk_test_` (secret)
- No real money moves; card networks don't process payments
- Test objects are isolated from live mode

### General Sandboxes

In addition to test mode, you can create up to 5 additional sandboxes:

| Feature | Test Mode | General Sandboxes |
|---------|-----------|-------------------|
| Count | 1 (fixed) | Up to 5 |
| Settings | Shared with live mode | Isolated per sandbox |
| Access control | Same as live mode | Private by default; invite-only |
| API support | V1 + partial V2 | V1 + V2 |
| Deletion | Can't delete | Can delete |

### Test Card Numbers

| Card Number | Brand | Scenario |
|-------------|-------|----------|
| `4242 4242 4242 4242` | Visa | Success |
| `4000 0000 0000 0002` | Visa | Declined (generic) |
| `4000 0000 0000 9995` | Visa | Declined (insufficient funds) |
| `4000 0000 0000 0127` | Visa | Requires authentication (3D Secure) |
| `3782 822463 10005` | Amex | Success |
| `5555 5555 5555 4444` | Mastercard | Success |

Use any future expiration date and any 3-digit CVC for successful payments.

### Security: API Key Management

- Store live secret keys in environment variables or a secrets vault
- **Never** store keys in source code or version control
- Use restricted API keys with minimal permissions for specific integrations
- Rotate keys immediately if exposed

### Live Mode Checklist

1. Complete Stripe account verification
2. Exit test mode sandbox (account picker in Dashboard)
3. Use live API keys (`pk_live_`, `sk_live_`)
4. Register webhook endpoint with live URL
5. Configure webhook endpoint secret for live endpoint
6. Run one low-risk live payment test
7. Monitor Dashboard for first live transactions

## Links

- [Checkout Sessions API](https://docs.stripe.com/payments/checkout)
- [Webhooks guide](https://docs.stripe.com/webhooks)
- [Testing use cases](https://docs.stripe.com/testing-use-cases)
- [Test card numbers](https://docs.stripe.com/testing)
- [API key management best practices](https://docs.stripe.com/keys-best-practices)
