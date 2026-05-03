# Retell Workflow: Annie Voice Agent

This workflow describes how to build Annie, the Agentic AI voice intake assistant, in Retell for the paid AI Business Assessment.

The recommended Retell setup is a **Conversation Flow Agent**, not a single prompt agent. Annie has a structured path: disclose price and terms, collect verbal approval, run the assessment intake, collect payment, and hand the transcript to report processing. Retell conversation flow agents are designed for structured conversations using nodes, edges, logic, and functions.

## Goals

Annie should:

1. Answer inbound assessment calls or be triggered for scheduled outbound calls.
2. Explain the $1,200.00 AUD assessment price, process, report contents, terms, privacy policy, and disclaimer.
3. Ask for verbal approval before starting the paid assessment intake.
4. Collect the business owner name, company name, email address, and phone number.
5. Conduct a 20 to 30 minute discovery interview.
6. Avoid giving recommendations during the call.
7. Collect payment through Stripe before transcript processing.
8. Send the call transcript and post-call analysis data to Agentic AI for report creation.
9. End the call cleanly with next steps and support contact details.

## Retell Build Choice

Use a **Conversation Flow Agent** because it gives predictable control over the call path:

- Nodes define individual conversation or action steps.
- Edges control transitions between nodes.
- Logic nodes branch based on extracted values such as approval status or payment status.
- Function nodes call external APIs, such as payment link creation or transcript handoff.
- Post-call analysis can extract structured fields after the call.

Use a single-prompt agent only for early testing. A single prompt is simpler but less reliable for payment approval, legal disclaimers, branching, and handoff.

## Required Systems

- Retell account and phone agent.
- Agentic AI website/API deployment.
- Stripe Checkout endpoint: `/api/create-assessment-checkout`.
- Transcript/report intake endpoint or CRM/report automation endpoint.
- Terms page: `/terms`.
- Privacy page: `/privacy`.
- Annie script: `docs/voice-agent-script.md`.
- Question knowledgebase: `docs/question-knowledgebase.md`.
- Voice disclaimer: `docs/voice-agent-disclaimer.md`.

## Recommended Conversation Flow

### Node 1: Greeting and Call Purpose

**Type:** Conversation node  
**Purpose:** Introduce Annie and explain why the caller is speaking with her.

**Static opening:**

```text
Hi there, I'm Annie from Agentic AI. Thanks for hopping on. This is a quick chat to learn about your business and what your day-to-day looks like so I can spot the best places AI can give you time back.
```

**Instruction:**

- Keep the tone calm, practical, and friendly.
- Do not start the assessment questions yet.
- Transition to the disclaimer and pricing node when Annie finishes the greeting.

**Transition:** Next node after Annie finishes speaking.

### Node 2: Disclaimer, Price, Process, and Report

**Type:** Conversation node  
**Purpose:** Clearly disclose commercial terms before intake.

**Static readout:**

```text
Before we start, the AI Business Assessment costs $1,200.00 AUD. The process is simple: I ask a structured set of questions, we confirm you are happy to proceed, payment is collected securely through Stripe, and then your transcript is sent for analysis.

The report includes your workflow pain points, quick wins, effort versus impact, specific recommendations, estimated value, and possible implementation paths.

I am an AI intake assistant. I do not provide legal, financial, tax, medical, compliance, or professional advice. Please do not share passwords, API keys, card numbers, bank details, confidential customer records, or unnecessary sensitive personal information.

Do I have your verbal approval to proceed with the $1,200.00 AUD assessment under Agentic AI's terms of service and privacy policy?
```

**Transition rules:**

- If the caller clearly approves, go to Node 3.
- If the caller asks a question, answer only about price, process, report, terms, privacy, timing, or payment, then ask for approval again.
- If the caller does not approve, go to Node 12.

**Dynamic variable to extract:**

- `verbal_approval`: boolean

### Node 3: Approval Confirmation and Contact Details

**Type:** Conversation node  
**Purpose:** Confirm approval is recorded and collect required contact information.

**Static sentence:**

```text
Great, thank you. I have recorded your approval. I will ask one question at a time and focus on how your business works, where time is being lost, and where AI or automation may help.
```

**Required fields to collect before general discovery:**

- `customer_name`
- `customer_role`
- `company`
- `customer_email`
- `customer_phone`

**Required questions:**

- What is your name and role in the business?
- What is the company or business name?
- What is the best email address for assessment updates and the report?
- What is the best phone number to contact you if the assessment team needs to clarify anything?

**Confirmation line:**

```text
Thanks. I have your contact details recorded. Now I will move into the business workflow questions.
```

**Transition:** Continue to general discovery only after all required contact fields are captured.

### Node 4: General Business Discovery

**Type:** Conversation node  
**Purpose:** Collect core business context.

**Instruction:**

Ask one question at a time. Collect:

- Caller name and role.
- Business name.
- Caller email.
- Caller phone.
- Industry.
- What the business sells.
- Who the business serves.
- Business age.
- Team size.
- Main revenue model.
- Main customer acquisition channels.

**Example questions:**

- What does the business do, and who do you mainly serve?
- Roughly how many people are on the team, including contractors or regular external partners?
- How do new customers or enquiries usually come into the business?
- What is a typical customer, project, booking, case, or sale worth?

**Transition:** Move to pain discovery when business context is clear.

### Node 5: Pain Point Discovery

**Type:** Conversation node  
**Purpose:** Find the strongest workflow problems.

**Instruction:**

Ask for the biggest headache, then drill into a recent example.

**Required questions:**

- What is the biggest headache in your workday right now?
- Can you walk me through the last time that happened?
- How often does it happen?
- Who is involved?
- What does it cost in time, missed revenue, customer experience, or team frustration?

**Transition:** Move to tools and systems when at least one concrete pain point has frequency and impact.

### Node 6: Tools and Systems

**Type:** Conversation node  
**Purpose:** Understand the software stack and disconnected systems.

**Instruction:**

Collect:

- CRM.
- Booking/job/project/matter/case system.
- Accounting and payment tools.
- Internal communication tools.
- Document storage.
- Reporting tools.
- Spreadsheets that act as source of truth.

**Example questions:**

- What software tools do you currently use every day?
- Where does important business information live?
- Which tools do not talk to each other?
- Where does the team copy information from one system into another?

**Transition:** Move to repeated work when the main systems are known.

### Node 7: Repeated Work, Handoffs, and Knowledge

**Type:** Conversation node  
**Purpose:** Identify quick-win candidates.

**Instruction:**

Ask adaptive questions based on the industry. Use `docs/question-knowledgebase.md` as the knowledgebase for this node.

Collect:

- Repeated daily and weekly tasks.
- Manual reports.
- Customer or staff FAQs.
- Owner-dependent decisions.
- Onboarding steps.
- Follow-ups.
- Handoffs.
- Knowledge gaps.

**Example questions:**

- What tasks are repeated every day or every week?
- What questions do customers, staff, suppliers, or partners ask repeatedly?
- What reports or updates are created manually?
- Where does work get stuck waiting for a person, approval, or missing information?

**Transition:** Move to industry module if industry-specific context is still weak. Otherwise move to priority confirmation.

### Node 8: Industry-Specific Deep Dive

**Type:** Conversation node  
**Purpose:** Ask targeted questions from the relevant industry module.

**Knowledgebase:** `docs/question-knowledgebase.md`

**Routing examples:**

- Real estate or property: ask about enquiries, inspections, listings, documents, follow-up, owner/vendor reporting.
- Healthcare or allied health: ask about bookings, reminders, intake forms, no-shows, admin before/after appointments, compliance constraints.
- Trades or field services: ask about job requests, triage, quoting, scheduling, dispatch, photos, job completion, invoices.
- Retail or ecommerce: ask about customer questions, fulfilment, inventory, returns, supplier discovery, product listings, ads reporting.
- Hospitality/events: ask about bookings, packages, run sheets, event details, lead response, weekly marketing/reporting.
- Professional services: ask about intake, proposals, client onboarding, document collection, status updates, reusable knowledge.

**Transition:** Move to priority confirmation once there are 2 to 4 strong opportunity areas.

### Node 9: Priority and Constraints

**Type:** Conversation node  
**Purpose:** Confirm what matters most and capture implementation constraints.

**Required questions:**

- If we found three good opportunities, would you prioritise saving owner time, improving customer response, reducing admin cost, increasing sales, or improving team consistency?
- Are there privacy, compliance, customer data, or brand voice concerns we should know about?
- Who would approve a new tool or workflow change?
- If the report finds a clear quick win, how soon would you want to act on it?
- What would make this assessment valuable for you?

**Transition:** Move to intake summary.

### Node 10: Intake Summary and Confirmation

**Type:** Conversation node  
**Purpose:** Briefly thank the caller and move on. Do not present a detailed summary or ask for corrections.

**Instruction:**

Say a brief thank-you and proceed directly to the final open question.

```text
Thanks, that gives us really useful context.
```

**Transition rules:**

- Always proceed to the final open question. Do not wait for confirmation.

### Node 11: Payment Setup

**Type:** Function node or Subagent node with custom function  
**Purpose:** Create and send a Stripe payment link.

**Function name:** `create_assessment_payment_link`

**Function behaviour:**

Call Agentic AI backend:

```http
POST /api/create-assessment-checkout
```

**Payload:**

```json
{
  "source": "retell-voice-agent",
  "customerName": "{{customer_name}}",
  "customerPhone": "{{caller_phone}}",
  "customerEmail": "{{customer_email}}",
  "company": "{{company}}",
  "transcriptPreview": "{{transcript_preview}}"
}
```

**Response expected:**

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

**Agent behaviour:**

- Tell the caller payment is required before transcript processing.
- Tell the caller the Stripe link will be sent by SMS if Twilio is enabled on the website.
- If Twilio SMS is not enabled or fails, use the configured Retell fallback channel.
- If the caller confirms they have already completed payment, thank them warmly, confirm their transcript will be reviewed by the assessment team, and say goodbye. Do not call any tools or functions in this step.

**Suggested spoken line:**

```text
The assessment intake is complete. The next step is secure payment through Stripe for the $1,200.00 AUD assessment fee. Once payment is confirmed, your transcript will be sent for analysis and the report will be prepared.

If the caller confirms they have already completed payment, thank them warmly and let them know their transcript will be reviewed by the assessment team.
```

**Transition:** Use a regular edge (not `always_edge`) from the Payment Link Message node to the End Call node so the caller can respond. If they confirm payment, Annie acknowledges and closes. Payment function failed -> fallback support node.

### Node 12: No Approval or Not Ready

**Type:** Conversation node  
**Purpose:** Exit politely if the caller does not approve.

**Script:**

```text
No problem. I cannot start the paid assessment intake without approval of the assessment fee, terms, privacy policy, and disclaimer. You can visit agenticai.net.au or email hello@agenticai.net.au if you would like to review the details and book later.
```

**Transition:** End call.

### Node 13: Fallback Support

**Type:** Conversation node  
**Purpose:** Handle payment link failure, caller confusion, or unsupported requests.

**Script:**

```text
I am having trouble completing that step automatically. The assessment team can help from here. Please email hello@agenticai.net.au and include your name, business, and phone number.
```

**Transition:** End call.

### Node 14: End Call

**Type:** End node  
**Purpose:** Close cleanly.

**Script:**

```text
Thanks again. Once payment is complete, your intake transcript will be reviewed and used to prepare your AI Business Assessment report. Have a great day.
```

## Retell Functions

### `create_assessment_payment_link`

Creates the Stripe Checkout session.

**Retell node:** Function node or Subagent node with tool calling.

**Backend endpoint:** `/api/create-assessment-checkout`

If the request `source` is `retell-voice-agent`, `customerPhone` is present, and Twilio is configured, the website backend sends the Stripe Checkout URL by SMS automatically.

**Required arguments:**

- `source`
- `customerName`
- `customerPhone`
- `customerEmail`
- `company`
- `transcriptPreview`

**Returns:**

- `url`
- `sms.sent`
- `sms.sid`
- `sms.status`

### `send_assessment_sms`

Sends a custom SMS through Twilio when Annie needs a separate SMS outside the payment-link function.

**Retell node:** Function node or Subagent node with tool calling.

**Backend endpoint:** `/api/send-assessment-sms`

**Security header:** `x-agenticai-webhook-secret`

**Required arguments:**

- `customerPhone`
- `checkoutUrl` or `message`

**Returns:**

- `sent`
- `sid`
- `status`
- `to`

### `queue_assessment_transcript`

Queues transcript data for report processing after payment or after a `call_analyzed` webhook.

**Backend endpoint:** production report-processing endpoint.

**Suggested payload:**

```json
{
  "source": "retell-voice-agent",
  "callId": "{{call_id}}",
  "customerName": "{{customer_name}}",
  "customerPhone": "{{caller_phone}}",
  "customerEmail": "{{customer_email}}",
  "company": "{{company}}",
  "paymentStatus": "{{payment_status}}",
  "transcript": "{{transcript}}",
  "analysis": "{{call_analysis}}"
}
```

## Post-Call Analysis Fields

Create custom post-call analysis categories in Retell so the report workflow receives structured data.

Recommended fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `verbal_approval_given` | Boolean | Whether caller approved price, terms, privacy, and disclaimer |
| `payment_link_sent` | Boolean | Whether Annie sent or attempted to send Stripe checkout |
| `business_name` | Text | Name of the business |
| `caller_name` | Text | Caller name |
| `caller_role` | Text | Caller role |
| `caller_email` | Text | Email address for report delivery |
| `caller_phone` | Text | Phone number for clarification or payment follow-up |
| `company` | Text | Company or trading name |
| `industry` | Selector/Text | Caller industry |
| `team_size` | Number/Text | Approximate team size |
| `current_tools` | Text | Software stack |
| `top_pain_points` | Text | Main workflow pain |
| `repeated_tasks` | Text | Repeated work candidates |
| `lead_response_gap` | Boolean | Whether speed-to-lead appears relevant |
| `knowledge_gap` | Boolean | Whether a knowledge assistant appears relevant |
| `manual_reporting_gap` | Boolean | Whether reporting automation appears relevant |
| `priority_outcome` | Selector | Time, revenue, admin cost, customer response, consistency |
| `privacy_or_compliance_constraints` | Text | Constraints mentioned |
| `assessment_ready` | Boolean | Whether transcript is suitable for report processing |

## Webhook Workflow

Register a Retell webhook for the Annie agent.

Recommended events:

- `call_analyzed`

Optional events:

- `call_started` for monitoring.
- `call_ended` only if you need a transcript-only fallback.
- `transcript_updated` if real-time transcript sync is needed.

Website webhook endpoint:

```text
POST https://agenticai.net.au/api/retell-webhook
```

Recommended backend handling:

1. Receive Retell webhook.
2. Verify `x-retell-signature`.
3. Ignore non-reporting events unless needed for monitoring.
4. On `call_analyzed`, read transcript and post-call analysis.
5. Check:
   - `verbal_approval_given` is true.
   - payment has been completed or payment link was sent.
   - `assessment_ready` is true.
6. Pipe the transcript and analysis to the report-building AI agent.
7. Notify internal team if analysis is incomplete, payment failed, or caller did not approve.

Retell webhooks should respond with a 2xx status quickly. If processing is slow, acknowledge the webhook first and process asynchronously.

See `docs/retell-report-agent-handoff.md` for the report-agent payload and environment variables.

## Testing Plan

Use Retell's web playground and simulation testing before assigning a live number.

### Test Scenarios

1. Caller approves and completes a normal assessment intake.
2. Caller asks about the $1,200 AUD cost before approving.
3. Caller refuses approval.
4. Caller tries to share a password or payment card number.
5. Caller asks for legal, medical, tax, financial, or compliance advice.
6. Caller gives vague answers and Annie asks for examples.
7. Caller is from real estate, healthcare, trades, ecommerce, hospitality, professional services, or nonprofit sectors.
8. Payment link function succeeds.
9. Payment link function fails.
10. Call ends early.

### Acceptance Criteria

- Annie discloses price before assessment intake.
- Annie does not continue without approval.
- Annie asks one question at a time.
- Annie does not prescribe tools during intake.
- Annie refuses sensitive information safely.
- Annie captures enough detail for a report.
- Payment is requested before transcript processing.
- `call_analyzed` contains the required post-call fields.

## Deployment Checklist

1. Create a Retell Conversation Flow Agent.
2. Add global prompt and personality from `docs/voice-agent-script.md`.
3. Add the nodes described above.
4. Upload or connect the question knowledgebase.
5. Configure guardrails for prohibited topics and sensitive information.
6. Add custom function for Stripe payment link creation.
7. Add webhook URL for call events and post-call analysis.
8. Create post-call analysis fields.
9. Test in the Retell playground.
10. Run simulation tests for approval, refusal, sensitive data, and industry paths.
11. Add payment method in Retell.
12. Purchase or connect a phone number.
13. Assign Annie to the number.
14. Run live test calls.
15. Monitor dashboard history, call recordings, transcripts, and analysis fields.

## Operational Notes

- If payment must happen during the same phone call, send the Stripe link by SMS and pause while the caller completes payment. For a smoother experience, finish intake, send the payment link, and process the transcript only after Stripe confirms payment.
- Do not ask the caller to read card details aloud.
- Keep transcript processing separate from report generation. The voice agent gathers context; the report workflow performs analysis.
- Keep a human review step before sending the final assessment report.
- Review failed calls weekly and add examples to Retell fine-tuning where Annie misunderstood approval, pricing, or industry-specific workflows.

## Retell Documentation References

- Introduction: https://docs.retellai.com/general/introduction
- Quickstart: https://docs.retellai.com/get-started/quick-start
- Conversation Flow Overview: https://docs.retellai.com/build/conversation-flow/overview
- Node Overview: https://docs.retellai.com/build/conversation-flow/node
- Conversation Node: https://docs.retellai.com/build/conversation-flow/conversation-node
- Custom Function: https://docs.retellai.com/build/conversation-flow/custom-function
- Guardrails: https://docs.retellai.com/build/guardrails
- Webhook Overview: https://docs.retellai.com/features/webhook
- Post-Call Analysis: https://docs.retellai.com/features/post-call-analysis
