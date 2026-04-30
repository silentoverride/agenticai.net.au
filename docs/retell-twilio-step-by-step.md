# Retell + Twilio Setup

Use this guide to connect Annie's Retell voice agent to Twilio for calls and SMS.

This setup keeps payments out of the phone call. Annie completes intake, the website creates a Stripe Checkout link, and Twilio sends that link by SMS.

## References

- Retell Twilio SIP trunking: `https://docs.retellai.com/deploy/twilio`
- Twilio docs: `https://www.twilio.com/docs`
- Twilio Messaging API: `https://www.twilio.com/docs/messaging/api/message-resource`
- Twilio Messaging Services: `https://www.twilio.com/docs/messaging/tutorials/send-messages-with-messaging-services`
- Twilio API keys: `https://www.twilio.com/docs/iam/api-keys`

## Screenshot Folder

Save screenshots here:

```text
docs/screenshots/retell-twilio/
```

The screenshot paths below are placeholders. Replace them with real dashboard screenshots after setup.

## 1. Twilio Calls to Retell

### 1.1 Create SIP Trunk

1. Twilio Console -> **Elastic SIP Trunking**.
2. Create trunk: `Agentic AI Annie Retell Trunk`.
3. Save.

![Twilio SIP trunk created](./screenshots/retell-twilio/01-twilio-create-sip-trunk.png)

### 1.2 Configure Termination

1. Open the trunk -> **Termination**.
2. Copy/create the **Termination SIP URI**.
3. Save it for Retell import.

Example:

```text
agentic-ai-annie.pstn.twilio.com
```

![Twilio termination URI](./screenshots/retell-twilio/02-twilio-termination-uri.png)

### 1.3 Allow Retell SIP Traffic

Use one option:

| Option | Setting |
| --- | --- |
| IP allowlist | Add Retell CIDR `18.98.16.120/30` |
| SIP credentials | Create Twilio SIP username/password and enter them in Retell during import |

Prefer IP allowlisting when possible.

![Twilio Retell IP allowlist](./screenshots/retell-twilio/03-twilio-retell-ip-allowlist.png)

### 1.4 Configure Origination

1. Open trunk -> **Origination**.
2. Add:

```text
sip:sip.retellai.com
```

3. Save.

![Twilio origination to Retell](./screenshots/retell-twilio/04-twilio-origination-retell.png)

### 1.5 Attach Phone Number

1. Twilio Console -> **Phone Numbers**.
2. Buy/open a voice-capable number.
3. Assign it to the SIP trunk.

![Twilio number attached to trunk](./screenshots/retell-twilio/05-twilio-number-attached-to-trunk.png)

### 1.6 Import Number into Retell

1. Retell Dashboard -> phone numbers/integrations.
2. Choose **Import number**.
3. Enter the Twilio number in E.164 format, e.g. `+61400123456`.
4. Enter the Twilio Termination SIP URI.
5. Enter SIP credentials only if you used credential auth.
6. Save.

![Retell import Twilio number](./screenshots/retell-twilio/06-retell-import-twilio-number.png)

### 1.7 Assign Number to Annie

1. In Retell, open the imported number.
2. Assign it to Annie's voice agent.
3. Confirm Annie is published/active.

![Retell number assigned to Annie](./screenshots/retell-twilio/07-retell-number-assigned-to-annie.png)

## 2. Twilio SMS for Stripe Links

### 2.1 Create Twilio API Key

1. Twilio Console -> **Account** -> **API keys and tokens**.
2. Create Standard API key: `Agentic AI Website SMS`.
3. Copy the SID and Secret immediately.

```sh
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=twilio_api_key_secret
```

![Twilio API key](./screenshots/retell-twilio/08-twilio-api-key-created.png)

### 2.2 Create Messaging Service

1. Twilio Console -> **Messaging** -> **Services**.
2. Create service: `Agentic AI Assessment SMS`.
3. Add an SMS-capable Twilio number to the sender pool.
4. Copy the Messaging Service SID.

```sh
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

![Twilio Messaging Service](./screenshots/retell-twilio/09-twilio-messaging-service.png)

![Twilio sender pool](./screenshots/retell-twilio/10-twilio-sender-pool.png)

### 2.3 Set Website Env Vars

Set server-only variables:

```sh
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=twilio_api_key_secret
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RETELL_TWILIO_WEBHOOK_SECRET=replace_with_shared_secret
```

Optional fallback if not using a Messaging Service:

```sh
TWILIO_FROM_NUMBER=+61400000000
```

Do not use `PUBLIC_` for Twilio credentials.

![Hosting Twilio env vars](./screenshots/retell-twilio/11-hosting-env-vars-twilio.png)

## 3. Retell Functions

### 3.1 Payment Link Function

In Retell, configure Annie's custom function:

| Field | Value |
| --- | --- |
| Name | `create_assessment_payment_link` |
| Method | `POST` |
| URL | `https://agenticai.net.au/api/create-assessment-checkout` |
| Payload mode | Args only, if available |

Required args:

```json
{
  "source": "retell-voice-agent",
  "customerName": "{{customer_name}}",
  "customerEmail": "{{customer_email}}",
  "customerPhone": "{{customer_phone}}",
  "company": "{{company}}",
  "transcriptPreview": "Short intake summary"
}
```

Response variables:

```text
url: $.url
sms_sent: $.sms.sent
sms_status: $.sms.status
```

When called by Annie, the website creates the Stripe Checkout link and sends it by SMS through Twilio.

![Retell payment function](./screenshots/retell-twilio/12-retell-payment-function.png)

### 3.2 Optional SMS Function

Only add this if Annie needs custom SMS outside payment-link creation.

| Field | Value |
| --- | --- |
| Name | `send_assessment_sms` |
| Method | `POST` |
| URL | `https://agenticai.net.au/api/send-assessment-sms` |
| Header | `x-agenticai-webhook-secret: <RETELL_TWILIO_WEBHOOK_SECRET>` |

Required args:

```json
{
  "customerPhone": "{{customer_phone}}",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

![Retell SMS function](./screenshots/retell-twilio/13-retell-send-sms-function.png)

## 4. Retell Webhook for Report Handoff

Set Annie's webhook URL:

```text
https://agenticai.net.au/api/retell-webhook
```

Enable only:

```text
call_analyzed
```

Do not enable `call_ended` for report generation unless:

```sh
ASSESSMENT_REPORT_PROCESS_CALL_ENDED=true
```

`call_analyzed` includes transcript and post-call analysis, and avoids duplicate report jobs.

![Retell webhook call_analyzed](./screenshots/retell-twilio/14-retell-webhook-call-analyzed.png)

Set report-agent env vars:

```sh
ASSESSMENT_REPORT_AGENT_WEBHOOK_URL=https://report-agent.example.com/webhook
ASSESSMENT_REPORT_AGENT_WEBHOOK_SECRET=replace_with_report_agent_secret
ASSESSMENT_REPORT_PROCESS_CALL_ENDED=false
```

![Report agent env vars](./screenshots/retell-twilio/15-hosting-env-vars-report-agent.png)

## 5. End-to-End Test

1. Call the Twilio number.
2. Confirm Annie answers.
3. Complete a short intake.
4. Confirm Annie creates the Stripe Checkout link.
5. Confirm Twilio sends SMS.
6. End the call.
7. Confirm Retell emits `call_analyzed`.
8. Confirm website receives `/api/retell-webhook`.
9. Confirm report agent receives transcript payload.

![Retell call history](./screenshots/retell-twilio/16-retell-call-history-test.png)

![Twilio call log](./screenshots/retell-twilio/17-twilio-call-log-test.png)

![Twilio SMS delivered](./screenshots/retell-twilio/18-twilio-sms-log-delivered.png)

![Report agent received payload](./screenshots/retell-twilio/19-report-agent-received-payload.png)

## Troubleshooting

| Problem | Check |
| --- | --- |
| Calls do not reach Annie | Twilio Origination is `sip:sip.retellai.com`; number is assigned to trunk; Retell import is active |
| Outbound calls fail | Termination URI is correct; Retell CIDR `18.98.16.120/30` is allowed or SIP credentials match |
| SMS does not send | Twilio API key, Account SID, Messaging Service SID, and sender pool are configured |
| SMS endpoint returns 401 | `x-agenticai-webhook-secret` matches `RETELL_TWILIO_WEBHOOK_SECRET` |
| Report agent gets nothing | Retell webhook has `call_analyzed`; `ASSESSMENT_REPORT_AGENT_WEBHOOK_URL` is set |
| Duplicate reports | Keep `ASSESSMENT_REPORT_PROCESS_CALL_ENDED=false` |
