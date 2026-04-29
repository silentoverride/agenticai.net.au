# Stripe Setup for Agentic AI Assessments

This guide explains how to configure Stripe for the Agentic AI website, Retell Chat Agent, and Retell Voice Agent.

The AI Business Assessment costs **$1,200.00 AUD**. Payment must be collected before the assessment transcript is processed into a report.

## Payment Flow

1. Annie explains the assessment price, process, terms, privacy policy, and disclaimer.
2. The customer approves the $1,200.00 AUD assessment.
3. Annie collects:
   - business owner name
   - role
   - company name
   - email address
   - phone number
4. Annie completes the intake questions.
5. Annie creates a Stripe Checkout link.
6. Customer pays through Stripe.
7. Stripe redirects to `/assessment/success`.
8. Payment confirmation is matched to the transcript.
9. Transcript is queued for report processing.

## Stripe Dashboard Setup

### 1. Create or Access Stripe Account

1. Go to `https://dashboard.stripe.com`.
2. Create or open the Agentic AI Stripe account.
3. Complete business verification before using live payments.
4. Confirm AUD is enabled for payments.

### 2. Get API Keys

In Stripe Dashboard:

1. Go to **Developers**.
2. Go to **API keys**.
3. Copy the **Secret key**.

Use test mode while building:

```sh
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxx
```

Use live mode only after testing:

```sh
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxx
```

Do not expose the secret key in frontend code.

### 3. Configure Website Environment Variables

Set these server environment variables in the website host:

```sh
STRIPE_SECRET_KEY=sk_test_or_live_key
PUBLIC_SITE_URL=https://agenticai.net.au
```

`PUBLIC_SITE_URL` is used to generate Stripe return URLs:

- Success: `/assessment/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel: `/?assessment=cancelled`

### 4. Confirm Website Endpoint

The website creates Checkout sessions through:

```text
POST /api/create-assessment-checkout
```

Source file:

```text
src/routes/api/create-assessment-checkout/+server.ts
```

The endpoint creates a Stripe Checkout session with:

- mode: `payment`
- currency: `aud`
- amount: `120000` cents
- product name: `AI Business Assessment`
- phone collection: enabled
- billing address collection: auto

## Checkout Request Format

Retell chat, Retell voice, or website code should call:

```http
POST https://agenticai.net.au/api/create-assessment-checkout
Content-Type: application/json
```

Request body:

```json
{
  "source": "retell-chat-agent",
  "customerName": "Sarah Jones",
  "customerEmail": "sarah@example.com",
  "customerPhone": "0400 123 456",
  "company": "Harbour Lane Events",
  "transcriptPreview": "Short preview of the assessment intake transcript"
}
```

Response:

```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

Annie should send the `url` to the customer and explain that transcript processing begins after successful payment.

## Stripe Metadata

The Checkout session stores these metadata fields:

| Metadata field | Source |
| --- | --- |
| `source` | `website-chatbot`, `retell-chat-agent`, or `retell-voice-agent` |
| `assessment_fee_aud` | `1200.00` |
| `transcript_preview` | First part of intake transcript |
| `customer_name` | Business owner name |
| `customer_phone` | Business owner phone |
| `company` | Company/business name |

Stripe also receives `customer_email` when supplied.

## Retell Chat Agent Setup

Create a Retell custom function for the chat agent.

Configure it like this:

| Retell field | Value |
| --- | --- |
| Function name | `create_assessment_payment_link` |
| Method | `POST` |
| URL / Endpoint | `https://agenticai.net.au/api/create-assessment-checkout` |
| Payload mode | Turn on **Payload: args only** if Retell shows it |

Define the function parameters using Retell's JSON Schema format. Use `const` for values Retell should pass directly, including captured dynamic variables. Use `description` for values the LLM should generate, such as the transcript preview.

```json
{
  "type": "object",
  "required": [
    "source",
    "customerName",
    "customerEmail",
    "customerPhone",
    "company",
    "transcriptPreview"
  ],
  "properties": {
    "source": {
      "type": "string",
      "const": "retell-chat-agent"
    },
    "customerName": {
      "type": "string",
      "description": "Business owner's full name.",
      "const": "{{customer_name}}"
    },
    "customerEmail": {
      "type": "string",
      "description": "Business owner's email address.",
      "const": "{{customer_email}}"
    },
    "customerPhone": {
      "type": "string",
      "description": "Business owner's phone number.",
      "const": "{{customer_phone}}"
    },
    "company": {
      "type": "string",
      "description": "Company or business name.",
      "const": "{{company}}"
    },
    "transcriptPreview": {
      "type": "string",
      "description": "Short preview of the assessment intake transcript"
    }
  }
}
```

The resulting chat function arguments should resolve like this:

| Parameter | Value |
| --- | --- |
| `source` | `retell-chat-agent` |
| `customerName` | `{{customer_name}}` |
| `customerEmail` | `{{customer_email}}` |
| `customerPhone` | `{{customer_phone}}` |
| `company` | `{{company}}` |
| `transcriptPreview` | Short summary of the chat intake, including business context, pain points, systems, repeated work, and priorities |

The website returns:

```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

If your Retell function form shows a **Response Variables** area, add this optional extraction:

```text
Variable name: url
JSON path: $.url
```

If the function form does not show **Response Variables**, leave it blank. In Annie's next message, instruct her to use the checkout URL from the function result. Retell includes the custom function response in the tool/function result context, so Annie can read the returned `url` directly.

Success message:

```text
Thanks. The assessment intake is complete. The next step is secure payment through Stripe for the $1,200.00 AUD assessment fee. Once payment is confirmed, your transcript will be sent for analysis and the report will be prepared.

Here is your secure payment link: {{url}}
```

If you did not configure a `url` response variable, replace `{{url}}` with: `Send the secure Stripe checkout URL returned by the create_assessment_payment_link function.`

Failure message:

```text
I am having trouble creating the payment link automatically. Please email hello@agenticai.net.au with your name, company, phone number, and email address so the team can help.
```

## Retell Voice Agent Setup

Create the same custom function for the voice agent.

Configure it like this:

| Retell field | Value |
| --- | --- |
| Function name | `create_assessment_payment_link` |
| Method | `POST` |
| URL / Endpoint | `https://agenticai.net.au/api/create-assessment-checkout` |
| Payload mode | Turn on **Payload: args only** if Retell shows it |

Define the function parameters using Retell's JSON Schema format. Use `const` for values Retell should pass directly, including captured dynamic variables. Use `description` for values the LLM should generate, such as the transcript preview.

```json
{
  "type": "object",
  "required": [
    "source",
    "customerName",
    "customerEmail",
    "customerPhone",
    "company",
    "transcriptPreview"
  ],
  "properties": {
    "source": {
      "type": "string",
      "const": "retell-voice-agent"
    },
    "customerName": {
      "type": "string",
      "description": "Business owner's full name.",
      "const": "{{customer_name}}"
    },
    "customerEmail": {
      "type": "string",
      "description": "Business owner's email address.",
      "const": "{{customer_email}}"
    },
    "customerPhone": {
      "type": "string",
      "description": "Business owner's phone number.",
      "const": "{{customer_phone}}"
    },
    "company": {
      "type": "string",
      "description": "Company or business name.",
      "const": "{{company}}"
    },
    "transcriptPreview": {
      "type": "string",
      "description": "Short preview of the assessment intake transcript"
    }
  }
}
```

The resulting voice function arguments should resolve like this:

| Parameter | Value |
| --- | --- |
| `source` | `retell-voice-agent` |
| `customerName` | `{{customer_name}}` |
| `customerEmail` | `{{customer_email}}` |
| `customerPhone` | `{{customer_phone}}` |
| `company` | `{{company}}` |
| `transcriptPreview` | Short summary of the voice intake, including business context, pain points, systems, repeated work, and priorities |

If your Retell function form shows a **Response Variables** area, add this optional extraction:

```text
Variable name: url
JSON path: $.url
```

If the function form does not show **Response Variables**, leave it blank. The next node should use the checkout URL from the function result.

**Voice behaviour**

Annie should say:

```text
The assessment intake is complete. The next step is secure payment through Stripe for the $1,200.00 AUD assessment fee. Once payment is confirmed, your transcript will be sent for analysis and the report will be prepared.
```

Then send the payment link by SMS or the configured Retell messaging path.

Do not ask the caller to read card details aloud.

## Payment Confirmation

There are two ways to confirm payment.

### Option A: Success Page

Stripe redirects the customer to:

```text
/assessment/success?session_id={CHECKOUT_SESSION_ID}
```

Current website success page:

```text
src/routes/assessment/success/+page.svelte
```

This is enough for simple website testing, but production should also use Stripe webhooks.

### Option B: Stripe Webhook Recommended

Create a webhook endpoint for production payment confirmation.

Recommended event:

```text
checkout.session.completed
```

Recommended webhook flow:

1. Stripe sends `checkout.session.completed`.
2. Backend verifies Stripe webhook signature.
3. Backend reads session metadata and customer email.
4. Backend marks assessment as paid.
5. Backend matches payment to Retell transcript using:
   - email
   - phone
   - company
   - Stripe session ID
   - source
6. Backend queues transcript for report processing.

Suggested future endpoint:

```text
POST /api/stripe/webhook
```

Environment variable needed:

```sh
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
```

## Report Processing Handoff

Do not process the transcript into a report until payment is confirmed.

Minimum report queue payload:

```json
{
  "paymentStatus": "paid",
  "stripeSessionId": "cs_live_or_test_id",
  "source": "retell-chat-agent",
  "customerName": "Sarah Jones",
  "customerEmail": "sarah@example.com",
  "customerPhone": "0400 123 456",
  "company": "Harbour Lane Events",
  "transcript": "Full chat or voice transcript",
  "analysis": {
    "industry": "Hospitality and events",
    "topPainPoints": "...",
    "currentTools": "...",
    "priorityOutcome": "Improve customer response"
  }
}
```

## Testing in Stripe Test Mode

Use Stripe test mode before live payments.

### Test Card

Use:

```text
4242 4242 4242 4242
```

Any future expiry date, any CVC, and any postal code.

### Test Checklist

1. Set `STRIPE_SECRET_KEY` to a test key.
2. Start the website.
3. Trigger payment link creation from the website or Retell function.
4. Confirm Checkout shows `$1,200.00 AUD`.
5. Pay with Stripe test card.
6. Confirm redirect to `/assessment/success`.
7. Confirm Stripe Dashboard shows a successful test payment.
8. Confirm metadata includes source, customer name, phone, company, and transcript preview.
9. Confirm email is attached to the Stripe customer/session.
10. Confirm transcript is not processed until payment is complete.

## Live Mode Checklist

Before switching to live mode:

1. Complete Stripe account verification.
2. Replace `sk_test_...` with `sk_live_...`.
3. Set `PUBLIC_SITE_URL=https://agenticai.net.au`.
4. Create live webhook endpoint if using webhooks.
5. Set `STRIPE_WEBHOOK_SECRET`.
6. Run one low-risk live payment test if appropriate.
7. Confirm refund process is understood.
8. Confirm terms and privacy links are live.
9. Confirm Retell agents disclose the fee before intake.
10. Confirm agents do not collect card details directly.

## Security Notes

- Never expose `STRIPE_SECRET_KEY` to the browser.
- Never ask customers to say card details aloud.
- Never store card numbers.
- Use Stripe-hosted Checkout for payment collection.
- Use webhook signature verification for production webhooks.
- Keep transcript processing separate from payment collection.
- Process transcripts only after payment confirmation.

## Related Files

- Stripe checkout endpoint: `src/routes/api/create-assessment-checkout/+server.ts`
- Payment success page: `src/routes/assessment/success/+page.svelte`
- Terms page: `src/routes/terms/+page.svelte`
- Privacy page: `src/routes/privacy/+page.svelte`
- Retell chat workflow: `docs/retell-annie-chat-agent-workflow.md`
- Retell voice workflow: `docs/retell-annie-voice-agent-workflow.md`
