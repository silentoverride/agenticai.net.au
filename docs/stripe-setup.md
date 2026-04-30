# Stripe Setup

The AI Business Assessment costs **$1,200.00 AUD**. Payment is collected with Stripe Checkout after Annie completes intake. Annie never collects card details by voice.

## Current Payment Flow

```text
Retell Annie voice intake
-> Website creates Stripe Checkout session
-> Twilio sends Checkout link by SMS
-> Customer pays in Stripe Checkout
-> Stripe confirms payment
-> Retell transcript is sent to report agent
```

## Stripe Docs

- API keys: `https://docs.stripe.com/keys`
- Create Checkout Session: `https://docs.stripe.com/api/checkout/sessions/create`
- Webhooks: `https://docs.stripe.com/webhooks`

## 1. Create Restricted Stripe Key

In Stripe Dashboard:

1. Turn on **Test mode**.
2. Go to **Developers** -> **API keys**.
3. Click **Create restricted key**.
4. Name it `Agentic AI Annie Checkout - test`.
5. Leave all permissions as **None** by default.
6. Set:

| Stripe resource | Permission |
| --- | --- |
| Checkout Sessions | Write |

7. Create the key.
8. Copy it immediately.

Use it server-side only:

```sh
STRIPE_SECRET_KEY=rk_test_xxxxxxxxxxxxxxxxx
```

After testing, repeat in live mode:

```sh
STRIPE_SECRET_KEY=rk_live_xxxxxxxxxxxxxxxxx
```

Do not put Stripe keys in Retell, browser code, prompts, screenshots, or public docs.

## 2. Set Website Env Vars

```sh
STRIPE_SECRET_KEY=rk_test_or_live_restricted_key
PUBLIC_SITE_URL=https://agenticai.net.au
```

`PUBLIC_SITE_URL` creates Stripe return URLs:

```text
Success: /assessment/success?session_id={CHECKOUT_SESSION_ID}
Cancel: /?assessment=cancelled
```

## 3. Website Checkout Endpoint

Endpoint:

```text
POST https://agenticai.net.au/api/create-assessment-checkout
```

Source:

```text
src/routes/api/create-assessment-checkout/+server.ts
```

The endpoint creates:

| Field | Value |
| --- | --- |
| Mode | `payment` |
| Currency | `aud` |
| Amount | `120000` cents |
| Product | `AI Business Assessment` |
| Phone collection | enabled |
| Billing address | auto |

## 4. Retell Function

In Retell, create Annie's custom function:

| Field | Value |
| --- | --- |
| Name | `create_assessment_payment_link` |
| Method | `POST` |
| URL | `https://agenticai.net.au/api/create-assessment-checkout` |
| Payload mode | Args only, if available |

Arguments:

```json
{
  "source": "retell-voice-agent",
  "customerName": "{{customer_name}}",
  "customerEmail": "{{customer_email}}",
  "customerPhone": "{{customer_phone}}",
  "company": "{{company}}",
  "transcriptPreview": "Short voice intake summary"
}
```

Response variables:

```text
url: $.url
sms_sent: $.sms.sent
sms_status: $.sms.status
```

Expected response:

```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sms": {
    "sent": true,
    "sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "status": "queued"
  }
}
```

If Twilio is configured and `source` is `retell-voice-agent`, the website sends the Checkout link by SMS automatically.

## 5. Annie Payment Message

After the function succeeds, Annie should say:

```text
The assessment intake is complete. The next step is secure payment through Stripe for the $1,200.00 AUD assessment fee. I have sent the secure payment link by SMS. Once payment is confirmed, your transcript will be sent for analysis and the report will be prepared.
```

If `sms_sent` is false, Annie should use the configured Retell fallback channel and avoid reading long Checkout URLs aloud unless the caller asks.

## 6. Stripe Metadata

The Checkout session stores:

| Metadata | Value |
| --- | --- |
| `source` | `retell-voice-agent` |
| `assessment_fee_aud` | `1200.00` |
| `transcript_preview` | Short intake preview |
| `customer_name` | Caller name |
| `customer_phone` | Caller phone |
| `company` | Business name |

Stripe also receives `customer_email` when supplied.

## 7. Payment Confirmation

Use Stripe webhooks in production.

Recommended event:

```text
checkout.session.completed
```

Suggested endpoint:

```text
POST /api/stripe/webhook
```

Required env var:

```sh
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
```

Webhook handling should:

1. Verify Stripe webhook signature.
2. Read Checkout session metadata.
3. Mark assessment as paid.
4. Match payment to Retell call by email, phone, company, source, and session ID.
5. Allow the report agent to process the transcript.

## 8. Test Checklist

Use Stripe test mode.

Test card:

```text
4242 4242 4242 4242
```

Any future expiry, any CVC, any postal code.

Checklist:

1. Set `STRIPE_SECRET_KEY=rk_test_...`.
2. Configure Twilio SMS.
3. Start the website.
4. Trigger Annie's Retell payment function.
5. Confirm Checkout shows `$1,200.00 AUD`.
6. Confirm SMS is sent.
7. Pay with the test card.
8. Confirm redirect to `/assessment/success`.
9. Confirm Stripe Dashboard shows successful test payment.
10. Confirm metadata includes source, customer name, phone, company, and transcript preview.

## 9. Live Checklist

Before live mode:

1. Complete Stripe account verification.
2. Create live restricted key with **Checkout Sessions: Write**.
3. Set `STRIPE_SECRET_KEY=rk_live_...`.
4. Set `PUBLIC_SITE_URL=https://agenticai.net.au`.
5. Configure Stripe webhook and `STRIPE_WEBHOOK_SECRET`.
6. Run one live low-risk payment test if appropriate.
7. Confirm Annie discloses the $1,200.00 AUD fee before intake.
8. Confirm Annie does not collect card details.

## 10. Security Rules

- Use Stripe Checkout, not voice card collection.
- Keep Stripe keys server-side only.
- Use restricted keys for Annie checkout.
- Do not expose `STRIPE_SECRET_KEY` to Retell or the browser.
- Do not store card numbers.
- Process transcripts only after payment confirmation.
- Rotate keys if exposed.

## Related Files

- Checkout endpoint: `src/routes/api/create-assessment-checkout/+server.ts`
- Success page: `src/routes/assessment/success/+page.svelte`
- Twilio setup: `docs/twilio-retell-setup.md`
- Retell voice workflow: `docs/retell-annie-voice-agent-workflow.md`
- Report agent handoff: `docs/retell-report-agent-handoff.md`
