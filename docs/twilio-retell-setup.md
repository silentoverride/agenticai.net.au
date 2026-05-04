# Twilio and Retell Setup

This guide connects Twilio to the Agentic AI website and Annie in Retell.

Twilio is used for SMS delivery. Retell is used for Annie's voice conversation. The website backend sits between them so Twilio credentials are never exposed to Retell, the browser, or customers.

## What This Integration Does

1. Annie completes a Retell voice intake.
2. Annie calls the website Stripe function: `/api/create-assessment-checkout`.
3. The website creates the Stripe Checkout session.
4. If `source` is `retell-voice-agent` and Twilio is configured, the website sends the Stripe payment link by SMS through Twilio.
5. The endpoint still returns the checkout URL to Retell.

There is also a dedicated SMS endpoint:

```text
POST /api/send-assessment-sms
```

Use that endpoint from Retell if Annie needs to send a custom SMS outside the Stripe checkout function.

## Twilio Account Setup

1. Create or open the Agentic AI Twilio account.
2. Complete any required account verification.
3. Buy or configure a Twilio phone number, or create a Messaging Service.
4. Prefer a Messaging Service for production because it can manage sender selection and delivery settings.
5. If sending SMS to the United States, complete required A2P 10DLC registration before production traffic.

Twilio documentation references:

- Twilio Docs home: `https://www.twilio.com/docs`
- Messages API: `https://www.twilio.com/docs/messaging/api/message-resource`
- API keys: `https://www.twilio.com/docs/iam/api-keys`
- Phone numbers: `https://www.twilio.com/docs/phone-numbers`

## Create Twilio API Credentials

Use API keys for production. Twilio says API keys are preferred for REST API authentication because they can be issued for specific applications and revoked if compromised.

1. In Twilio Console, go to **Account** -> **API keys and tokens**.
2. Create a new API key for the website backend.
3. Name it `Agentic AI Website SMS`.
4. Copy the API Key SID and Secret.
5. Store the secret immediately. Twilio only shows it once.

Use the Account SID plus API Key SID and API Key Secret in the website environment:

```sh
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=twilio_api_key_secret
```

For local testing only, the backend also supports Twilio Account SID plus Auth Token:

```sh
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=twilio_auth_token
```

Do not use the Auth Token in production unless there is a specific operational reason.

## Configure the Sender

Use one of these options.

Preferred production option:

```sh
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Simple local/test option:

```sh
TWILIO_FROM_NUMBER=+61400000000
```

If `TWILIO_MESSAGING_SERVICE_SID` is set, the backend uses it. Otherwise it uses `TWILIO_FROM_NUMBER`.

## Website Environment Variables

Set these server-only variables in the website host:

```sh
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=twilio_api_key_secret
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RETELL_TWILIO_WEBHOOK_SECRET=replace_with_shared_secret
```

Keep these values out of public frontend variables. They must not start with `PUBLIC_`.

## Stripe Payment Link SMS

The existing Stripe endpoint now sends SMS automatically when all conditions are true:

- request body `source` is `retell-voice-agent`
- request body includes `customerPhone`
- Twilio environment variables are configured
- Stripe Checkout session creation succeeds

Endpoint:

```text
POST /api/create-assessment-checkout
```

Relevant response shape:

```json
{
  "url": "https://checkout.stripe.com/...",
  "sms": {
    "sent": true,
    "sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "status": "queued"
  }
}
```

If SMS fails, the endpoint still returns the Stripe URL:

```json
{
  "url": "https://checkout.stripe.com/...",
  "sms": {
    "sent": false,
    "message": "Unable to send Twilio SMS."
  }
}
```

Annie should tell the caller the link will be sent by SMS. If SMS fails, Annie can read or send the checkout URL through the configured Retell fallback channel.

## Dedicated Retell SMS Function

Create a Retell custom function if Annie needs to send a custom SMS.

| Retell field | Value |
| --- | --- |
| Function name | `send_assessment_sms` |
| Method | `POST` |
| URL / Endpoint | `https://agenticai.net.au/api/send-assessment-sms` |
| Header | `x-agenticai-webhook-secret: <RETELL_TWILIO_WEBHOOK_SECRET>` |
| Payload mode | Turn on **Payload: args only** if Retell shows it |

Parameters:

```json
{
  "type": "object",
  "required": ["customerPhone", "checkoutUrl"],
  "properties": {
    "customerPhone": {
      "type": "string",
      "const": "{{caller_phone}}",
      "description": "Customer phone number in E.164 or local Australian format."
    },
    "customerName": {
      "type": "string",
      "const": "{{caller_name}}",
      "description": "Customer name."
    },
    "company": {
      "type": "string",
      "const": "{{company}}",
      "description": "Customer company."
    },
    "checkoutUrl": {
      "type": "string",
      "description": "Stripe Checkout URL to send."
    },
    "message": {
      "type": "string",
      "description": "Optional full SMS body. If omitted, the website generates the payment-link SMS."
    }
  }
}
```

Expected response:

```json
{
  "sent": true,
  "sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued",
  "to": "+61400123456"
}
```

## Security Notes

- Keep Twilio credentials server-side only.
- Prefer API Key SID and Secret over the account Auth Token.
- Use `RETELL_TWILIO_WEBHOOK_SECRET` on Retell-callable endpoints.
- Do not send passwords, API keys, card details, bank details, confidential customer records, or unnecessary sensitive personal information by SMS.
- Keep SMS content short and transactional.
- Rotate Twilio API keys if they are exposed or no longer needed.
