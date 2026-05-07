---
title: SendGrid Dynamic Templates
type: concept
updated: 2026-05-07
sources:
  - "https://www.twilio.com/docs/sendgrid/ui/sending-email/how-to-send-an-email-with-dynamic-templates"
---

# SendGrid Dynamic Templates

SendGrid provides **Dynamic Templates** for transactional email — reusable designs with Handlebars substitution for personalization data. This is separate from [Marketing Campaigns](https://www.twilio.com/docs/sendgrid/ui/sending-email/getting-started-with-automation) and from inline HTML payloads.

## Overview

| Aspect | Detail |
|--------|--------|
| Template language | [Handlebars](https://docs.sendgrid.com/for-developers/sending-email/using-handlebars) |
| Template ID prefix | `d-` + 62 hex chars |
| Versions | Multiple versions per template; one active at a time |
| Editors | Design Editor (drag-and-drop) or Code Editor (HTML) |
| API | `POST /v3/mail/send` with `template_id` and `dynamic_template_data` |
| Content types | HTML + plain text + subject line |

## Creating a Dynamic Template

1. Log in to [SendGrid app](https://app.sendgrid.com)
2. Go to **Email API → Dynamic Templates**
3. Click **Create a Dynamic Template**
4. Enter a human-readable name
5. Click the template name → **Add Version**
6. Choose a starting template (SendGrid designs or your own)
7. Pick editor (**Design** or **Code**)
8. Set version name, subject line, preheader

### Handlebars in Templates

Use double braces for variables:

```handlebars
Hi {{customerName}},

Your invoice for {{company}} is ready.
Amount: {{amount}}

View report: {{reportUrl}}
```

SendGrid supports Handlebars conditionals, loops, and partials. See [Handlebars guide](https://docs.sendgrid.com/for-developers/sending-email/using-handlebars).

## Sending via API

### Finding the Template ID

**Via UI:** Email API → Dynamic Templates → click template name → ID shown under the name.

**Via API:**

```bash
curl -X GET \
  'https://api.sendgrid.com/v3/templates?generations=dynamic' \
  -H 'Authorization: Bearer $ACCESS_TOKEN' \
  -H 'Content-Type: application/json'
```

### Mail Send Request

```json
{
  "personalizations": [
    {
      "to": [{"email": "customer@example.com"}],
      "dynamic_template_data": {
        "customerName": "Jane",
        "company": "Acme Pty Ltd",
        "amount": "$1,200.00 AUD",
        "reportUrl": "https://agenticai.net.au/portal/reports/abc123"
      }
    }
  ],
  "from": {"email": "hello@agenticai.net.au", "name": "Agentic AI"},
  "template_id": "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

No `content` or `subject` needed — the template provides both.

## Substitution Tags (Legacy)

If you use your own HTML (not Dynamic Templates), use **Substitution Tags** instead:

```json
{
  "personalizations": [{
    "to": [{"email": "to@example.com"}],
    "substitutions": {
      "-customerName-": "Jane",
      "-amount-": "$1,200.00"
    }
  }],
  "from": {"email": "hello@agenticai.net.au"},
  "template_id": "your-legacy-template-id"
}
```

Dynamic Templates with Handlebars are the recommended approach for new implementations.

## Current Project Usage

The Agentic AI codebase uses inline HTML via `sendEmail()` in `src/lib/server/email.ts` rather than Dynamic Templates. This works but requires embedding HTML directly in the codebase (`src/lib/server/email-templates.ts`).

| Approach | Pros | Cons |
|----------|------|------|
| Inline HTML (current) | Full control, no external template dependency | HTML in code, harder to update, no designer collaboration |
| Dynamic Templates | Designer-friendly, versioned, centralised, conditional logic in template | Requires SendGrid account setup, template ID management |

### Migration Path

To switch to Dynamic Templates:

1. Create templates in SendGrid UI for:
   - Welcome email
   - Receipt / tax invoice
   - Portal invitation
   - Report ready notification
2. Replace `content` array in `sendEmail()` with `template_id`
3. Pass personalization data via `dynamic_template_data`
4. Store template IDs in environment variables

## Security Notes

- Keep `SENDGRID_API_KEY` server-side only
- Use restricted API keys scoped to "Mail Send" if possible
- Validate all dynamic data before passing to templates
- Include unsubscribe module in marketing templates (optional for transactional)

## Related

- [SendGrid API reference](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [Stripe webhook emails](stripe.md) — current email triggers
- [Report pipeline](operations/report-pipeline.md) — where emails are sent
- [Twilio integration](twilio.md) — sibling messaging integration
