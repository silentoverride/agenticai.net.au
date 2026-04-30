# Connect a Twilio Number to Annie in Retell

Use this guide when you want customers to call a Twilio phone number and reach Annie, the Retell voice agent.

## Goal

```text
Customer calls Twilio number
-> Twilio routes the call through Elastic SIP Trunking
-> Retell receives the call
-> Annie answers
```

## Requirements

- Twilio account.
- Retell account.
- Annie voice agent created and published in Retell.
- Twilio voice-capable phone number.
- Twilio Elastic SIP Trunking access.

Retell reference:

```text
https://docs.retellai.com/deploy/twilio
```

## Step 1: Create a Twilio SIP Trunk

1. Open Twilio Console.
2. Go to **Elastic SIP Trunking**.
3. Create a new trunk.
4. Name it `Agentic AI Annie Retell Trunk`.
5. Save.

Screenshot:

```text
docs/screenshots/retell-twilio/01-twilio-create-sip-trunk.png
```

## Step 2: Configure Twilio Termination

Termination lets Retell send outbound calls through the Twilio trunk.

1. Open the SIP trunk.
2. Go to **Termination**.
3. Copy or create the **Termination SIP URI**.

Example:

```text
agentic-ai-annie.pstn.twilio.com
```

4. Save the URI. You will enter it in Retell later.

Screenshot:

```text
docs/screenshots/retell-twilio/02-twilio-termination-uri.png
```

## Step 3: Allow Retell to Use the Trunk

Choose one authentication method.

Preferred option:

1. In Twilio **Termination**, add an IP access control list.
2. Allow Retell's SIP CIDR:

```text
18.98.16.120/30
```

Alternative option:

1. Create SIP username/password credentials in Twilio.
2. Attach the credential list to the trunk.
3. Save the username and password for Retell import.

Screenshot:

```text
docs/screenshots/retell-twilio/03-twilio-retell-ip-allowlist.png
```

## Step 4: Configure Twilio Origination

Origination lets inbound calls from the Twilio number reach Retell.

1. Open the SIP trunk.
2. Go to **Origination**.
3. Add this Origination SIP URI:

```text
sip:sip.retellai.com
```

4. Save.

Screenshot:

```text
docs/screenshots/retell-twilio/04-twilio-origination-retell.png
```

## Step 5: Attach the Twilio Number to the SIP Trunk

1. Go to **Phone Numbers** in Twilio.
2. Buy a voice-capable number or open an existing number.
3. Assign the number to `Agentic AI Annie Retell Trunk`.
4. Save.

Use E.164 format when writing the number down:

```text
+61400123456
```

Screenshot:

```text
docs/screenshots/retell-twilio/05-twilio-number-attached-to-trunk.png
```

## Step 6: Import the Twilio Number into Retell

1. Open Retell Dashboard.
2. Go to phone numbers or integrations.
3. Choose **Import number**.
4. Enter the Twilio phone number in E.164 format.
5. Enter the Twilio **Termination SIP URI** from Step 2.
6. If you used SIP credentials, enter the Twilio SIP username and password.
7. Save.

Screenshot:

```text
docs/screenshots/retell-twilio/06-retell-import-twilio-number.png
```

## Step 7: Assign the Number to Annie

1. In Retell, open the imported number.
2. Assign it to Annie's voice agent.
3. Confirm Annie is published or active.
4. Save.

Screenshot:

```text
docs/screenshots/retell-twilio/07-retell-number-assigned-to-annie.png
```

## Step 8: Test the Customer Call Path

1. Call the Twilio number from a mobile phone.
2. Confirm Annie answers.
3. Speak for 30 to 60 seconds.
4. End the call.
5. Confirm the call appears in Retell call history.
6. Confirm the call appears in Twilio call logs.
7. Confirm Retell creates the transcript and `call_analyzed` event.

Screenshots:

```text
docs/screenshots/retell-twilio/08-retell-call-history-test.png
docs/screenshots/retell-twilio/09-twilio-call-log-test.png
```

## Troubleshooting

| Problem | Check |
| --- | --- |
| Caller hears silence or failure | Twilio number must be assigned to the SIP trunk |
| Retell never receives the call | Twilio Origination must point to `sip:sip.retellai.com` |
| Outbound Retell calls fail | Twilio Termination URI must be correct |
| Twilio rejects Retell traffic | Add Retell CIDR `18.98.16.120/30` or configure SIP credentials |
| Annie does not answer | Confirm the imported Retell number is assigned to Annie and Annie is published |
| No transcript/report handoff | Confirm Retell webhook has `call_analyzed` enabled |

## Production Checklist

- Twilio account billing enabled.
- Twilio number supports voice.
- SIP trunk created.
- Termination URI copied.
- Retell IP CIDR or SIP credentials configured.
- Origination URI is `sip:sip.retellai.com`.
- Twilio number assigned to trunk.
- Number imported into Retell.
- Number assigned to Annie.
- Test call completed.
- Retell `call_analyzed` webhook confirmed.
