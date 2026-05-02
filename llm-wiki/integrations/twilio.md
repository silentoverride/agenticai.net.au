---
title: Twilio Integration
type: reference
updated: 2026-05-02
sources:
  - "docs/twilio-retell-setup.md"
  - "docs/connect-twilio-number-to-retell-voice-agent.md"
see_also:
  - "../integrations/retell.md"
  - "../integrations/stripe.md"
  - "../agents/annie-voice-agent.md"
  - "../integrations/cloudflare.md"
---

# Twilio Integration

Twilio provides telephony for Annie voice calls (SIP trunking) and SMS delivery of Stripe payment links. The website backend sits between Twilio and Retell so credentials are never exposed to Retell, the browser, or customers.

## What the Integration Does

1. Annie completes Retell voice intake
2. Annie calls website Stripe function
3. Website creates Stripe Checkout session
4. If `source` is `retell-voice-agent` and Twilio is configured, website sends Stripe link by SMS
5. Endpoint still returns checkout URL to Retell

## Environment Variables

```sh
# Twilio credentials (server-side only)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=twilio_api_key_secret
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+61400000000

# Security
RETELL_TWILIO_WEBHOOK_SECRET=replace_with_shared_secret
```

## Credential Setup

1. In Twilio Console, go to **Account → API keys and tokens**
2. Create new API key named "Agentic AI Website SMS"
3. Copy API Key SID and Secret (shown once only)
4. Store in environment

**Prefer API keys over Auth Token** for production. The backend also supports Account SID + Auth Token for local testing only.

## Sender Configuration

| Option | Variable | Use case |
|--------|----------|----------|
| Messaging Service (preferred) | `TWILIO_MESSAGING_SERVICE_SID` | Production — manages sender selection and delivery |
| From Number | `TWILIO_FROM_NUMBER` | Simple local/test |

If `TWILIO_MESSAGING_SERVICE_SID` is set, backend uses it. Otherwise falls back to `TWILIO_FROM_NUMBER`.

## SIP Trunk for Voice Calls

To connect a Twilio number to Annie in Retell:

| Step | Action | Key Detail |
|------|--------|------------|
| 1 | Create Twilio Elastic SIP Trunk | Name: "Agentic AI Annie Retell Trunk" |
| 2 | Configure Termination | Copy Termination SIP URI (e.g., `agentic-ai-annie.pstn.twilio.com`) |
| 3 | Allow Retell IP | Add IP access control list: `18.98.16.120/30` |
| 4 | Configure Origination | Set URI to `sip:sip.retellai.com` |
| 5 | Attach number to trunk | Assign voice-capable Twilio number |
| 6 | Import into Retell | Enter number (E.164) + Termination URI |
| 7 | Assign to Annie | Connect imported number to Annie's voice agent |

## Dedicated SMS Function

For custom SMS outside the Stripe payment flow:

| Field | Value |
|-------|-------|
| Function name | `send_assessment_sms` |
| Method | `POST` |
| URL | `https://agenticai.net.au/api/send-assessment-sms` |
| Header | `x-agenticai-webhook-secret: <RETELL_TWILIO_WEBHOOK_SECRET>` |

Parameters:
```json
{
  "customerPhone": "{{customer_phone}}",
  "customerName": "{{customer_name}}",
  "company": "{{company}}",
  "checkoutUrl": "Stripe URL",
  "message": "Optional custom SMS body"
}
```

Response:
```json
{
  "sent": true,
  "sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued",
  "to": "+61400123456"
}
```

## Security Notes

- Keep Twilio credentials server-side only
- Prefer API Key SID and Secret over Auth Token
- Use `RETELL_TWILIO_WEBHOOK_SECRET` on Retell-callable endpoints
- Do not send passwords, API keys, card details, bank details, or confidential records by SMS
- Keep SMS content short and transactional
- Rotate Twilio API keys if exposed
- For US sending, complete A2P 10DLC registration before production traffic

## Troubleshooting

| Problem | Check |
|---------|-------|
| Caller hears silence | Twilio number assigned to SIP trunk |
| Retell never receives call | Origination points to `sip:sip.retellai.com` |
| Outbound calls fail | Termination URI correct |
| Twilio rejects Retell traffic | Retell CIDR `18.98.16.120/30` added or SIP credentials configured |
| Annie does not answer | Number imported and assigned to Annie; Annie published |
| No transcript/report handoff | Retell webhook has `call_analyzed` enabled |
