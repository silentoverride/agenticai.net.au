# Retell Voice Agent — Complete Deployment Guide

This guide walks through every step needed to configure the Retell voice agent (Annie) for the Agentic AI Business Assessment.

**Required reading before starting:**
- `docs/voice-agent-script.md` — Annie's personality and global prompt
- `docs/question-knowledgebase.md` — Interview question knowledgebase
- `docs/voice-agent-disclaimer.md` — Compliance and legal disclaimers
- `docs/retell-annie-voice-agent-workflow.md` — Conversation flow architecture

---

## Table of Contents

1. [Retell Account Setup](#1-retell-account-setup)
2. [Agent Creation](#2-agent-creation)
3. [Global Prompt (System Prompt)](#3-global-prompt-system-prompt)
4. [Configure Post-Call Analysis Fields](#4-configure-post-call-analysis-fields)
5. [Webhook Configuration](#5-webhook-configuration)
6. [Phone Number Setup](#6-phone-number-setup)
7. [Environment Variables](#7-environment-variables)
8. [Stripe Checkout Integration](#8-stripe-checkout-integration)
9. [Testing in Retell Playground](#9-testing-in-retell-playground)
10. [Going Live](#10-going-live)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Retell Account Setup

### 1.1 Sign up
1. Go to [retellai.com](https://retellai.com)
2. Sign up with your email (you'll get $5 free credit)
3. Verify your email address

### 1.2 Get API keys
1. Go to **Dashboard → Settings → API Keys**
2. Copy the **API Key** (looks like `key_xxxxxxxx`)
3. Copy the **Public Key** (looks like `public_key_xxxxxxxx`)
4. Copy the **Signing Secret** for webhook verification

### 1.3 Configure payment
1. Go to **Dashboard → Billing**
2. Add a payment method (required for production calls)
3. Retell charges per minute (varies by LLM model used)

---

## 2. Agent Creation

### 2.1 Create the agent
1. Go to **Dashboard → Agents**
2. Click **"New Agent"** or **"Create Agent"**
3. Choose agent type: **"Conversation Flow Agent"** (recommended) or **"Single Prompt Agent"** (for initial testing)

### 2.2 Basic settings
| Field | Value |
|-------|-------|
| Agent Name | Annie — AI Business Assessment Specialist |
| Voice | Choose a warm, professional female voice. Recommended: any "English (Australia)" female voice |
| Model | GPT-4 or GPT-4-turbo (required for complex extraction and structured JSON) |
| Language | English (en-AU preferred for Australian business context) |
| First Sentence | See the greeting prompt below |

### 2.3 Set voice characteristics
- **Speaking speed**: Medium (1.0x recommended)
- **Temperature**: 0.3–0.5 (keep it focused, don't let Annie ramble)
- **Interruptions**: Allow (business owners may interrupt with clarifications)
- **Silence timeout**: 7 seconds (give time for thinking)
- **End-of-sentence detection**: Enabled

---

## 3. Global Prompt (System Prompt)

Go to **Dashboard → Your Agent → Prompt** and paste the following as the **Global Prompt** or **System Prompt**:

```text
You are Annie, a warm, professional AI intake specialist for Agentic AI, an Australian AI consulting company.

YOUR ROLE:
- You conduct structured AI Business Assessment intake calls for businesses
- You collect information about workflows, pain points, tools, and opportunities for automation
- You do NOT give tool recommendations during the call — that happens in the report
- You are friendly, practical, and consultative — like a good consultant having a discovery chat

ASSESSMENT FEE:
The AI Business Assessment costs $1,200.00 AUD. You must disclose this before starting questions.

PROCESS OVERVIEW:
1. Greet the caller and explain why they're calling
2. Disclose the $1,200 AUD fee, process, and terms
3. Ask for verbal approval before proceeding
4. Collect contact details (name, company, email, phone)
5. Conduct a 20-30 minute discovery interview
6. Close with next steps and payment process

CONTENT RULES:
- Ask ONE question at a time
- Wait for the caller's complete answer before asking the next question
- If a caller gives a vague answer, ask for a recent specific example: "When was the last time that happened? Walk me through exactly what you did."
- Do not prescribe tools, recommend specific software, or suggest solutions during intake
- Capture needs and context only
- Do not give legal, financial, tax, medical, compliance, or professional advice
- Refuse sensitive information: passwords, API keys, card numbers, bank details

CALL FLOW:
1. Greet: "Hi there, I'm Annie from Agentic AI. Thanks for hopping on. This is a quick chat to learn about your business and where AI can give you time back."
2. Disclose: "Before we start, the assessment is $1,200 AUD. I'll ask questions about your workflow, then our team prepares a report with recommendations. Is that okay?"
3. Get approval — if no approval, politely direct them to the website
4. Collect: name, role, company, email, phone
5. Ask discovery questions from the knowledgebase
6. Close: "Thanks, that gives us great context. The next step is secure payment through Stripe. Once confirmed, your report will be ready in about 48 hours."

DYNAMIC CONTEXT:
- Source: {{source}}
- Assessment fee: {{assessment_fee}}
- Site: {{site}}
```

### 3.1 Global prompt dynamic variables
Add these to **Dashboard → Your Agent → Dynamic Variables**:

| Key | Sample Value | Description |
|-----|------------|-------------|
| `source` | `website-call-assessment-button` | Where the call originated |
| `assessment_fee` | `$1,200.00 AUD` | Fee shown to caller |
| `site` | `agenticai.net.au` | Company website |

---

## 4. Configure Post-Call Analysis Fields

This is **critical** — these fields power the AI report generation pipeline. If they're not configured, the report will be low-quality.

### 4.1 Enable post-call analysis
1. Go to **Dashboard → Your Agent → Post-Call Analysis**
2. Toggle **"Enable Post-Call Analysis"** to ON
3. Select **Model**: GPT-4 (required for complex business analysis)

### 4.2 Configure analysis instructions
Paste this into the **Analysis Instructions** field:

```text
Analyse this AI Business Assessment call and extract structured fields.

GOAL: Generate a structured data object that will be used to build an AI Business Assessment report.

EXTRACTION RULES:
- Extract caller contact details from the transcript
- Identify the business model, industry, and team size
- Capture the top workflow pain points with specific examples
- Identify repeated tasks, manual work, and bottlenecks
- Note the current software/tools stack mentioned
- Assess lead response speed and customer workflow gaps
- Identify knowledge documentation gaps
- Check for privacy, compliance, or data sensitivity constraints
- Determine the caller's priority outcome
- Confirm whether verbal approval was given
- Confirm whether payment was discussed or completed

OUTPUT FORMAT: Return ONLY a valid **flat JSON object** with string, number, or boolean values. No nested objects, no markdown, no explanation. Every key from the custom fields section below must be present with a value.

BOOLEAN RULES: Use the exact string "true" or "false" for boolean fields.
STRING RULES: For missing text fields, return empty string "". For multi-select or list fields, join with commas.
```

### 4.3 Configure custom analysis fields

Add the following **Custom Analysis Fields** one by one in the Retell dashboard.

**Important**: The field names below MUST match exactly — the webhook handler (`src/lib/server/assessment/retell-job.ts`) and pipeline expect these exact keys.

| Field Name | Type | Description | Analysis Prompt |
|-----------|------|-------------|----------------|
| `caller_name` | Text | Caller's full name | "What is the full name of the person on this call?" |
| `caller_role` | Text | Caller's job title | "What is this person's role or job title in the business?" |
| `caller_email` | Text | Caller's email | "What email address did the caller provide for the assessment report?" |
| `caller_phone` | Text | Caller's phone | "What phone number did the caller provide?" |
| `company` | Text | Company name | "What is the company or business name?" |
| `industry` | Text | Business industry | "What industry or sector does this business operate in?" |
| `team_size` | Text | Approx team size | "How many people are in the team, including contractors?" |
| `current_tools` | Text | Software stack | "List all software tools mentioned, separated by commas." |
| `top_pain_points` | Text | Main problems | "What are the top 2-3 biggest workflow pain points mentioned? Summarise briefly." |
| `repeated_tasks` | Text | Repeated work | "What tasks does the caller repeat weekly that feel like they should be automated?" |
| `operating_rhythm` | Text | Work pattern | "How does the team work day-to-day? What's their typical workflow rhythm?" |
| `lead_customer_response_workflow` | Text | Lead handling | "How do new enquiries arrive and how are they followed up?" |
| `knowledge_documentation_gaps` | Text | Knowledge gaps | "Where is knowledge documentation missing or incomplete?" |
| `reporting_visibility_gaps` | Text | Reporting gaps | "What reports or visibility is missing that would help decision-making?" |
| `estimated_time_loss` | Text | Time lost | "How much time per week is lost to manual, repeated, or inefficient work?" |
| `revenue_or_customer_impact` | Text | Business impact | "What is the financial or customer impact of the pain points mentioned?" |
| `lead_response_gap` | Boolean | Lead delay issue | "Does the call mention delays in responding to new leads or enquiries? Answer true or false." |
| `knowledge_gap` | Boolean | Knowledge issue | "Does the call mention knowledge trapped in one person's head or poor documentation? Answer true or false." |
| `manual_reporting_gap` | Boolean | Reporting manual | "Does the call mention manual reporting or copying data between systems? Answer true or false." |
| `priority_outcome` | Text | Priority goal | "If the caller had to choose one outcome: owner time saved, faster customer response, reduced admin cost, more sales, or better team consistency — which matters most?" |
| `privacy_or_compliance_constraints` | Text | Compliance | "Did the caller mention any privacy, compliance, or data sensitivity constraints? If yes, summarise. If no, return empty string." |
| `open_questions_for_follow_up` | Text | Follow-ups | "What open questions remain that the assessment team should follow up on?" |
| `assessment_ready` | Boolean | Ready | "Based on the transcript, is there enough information to generate a meaningful assessment report? Answer true or false." |
| `verbal_approval_given` | Boolean | Approved | "Did the caller explicitly approve proceeding with the $1,200 AUD assessment before or after the questions? Answer true or false." |
| `payment_link_sent` | Boolean | Payment sent | "Was a payment link discussed, sent, or completed during this call? Answer true or false." |
| `payment_status` | Text | Payment state | "What was the payment outcome: 'pending', 'sent', 'paid', 'complete', or 'not_discussed'?" |

### 4.4 Analysis model temperature
Set the analysis model temperature to `0.2` — you want consistent, structured extraction, not creative writing.

---

## 5. Webhook Configuration

### 5.1 Register the webhook
1. Go to **Dashboard → Your Agent → Webhook**
2. Add webhook URL:
   - Production: `https://agenticai.net.au/api/retell-webhook`
   - Preview (for testing): `https://0a61bb67.agenticai-net-au.pages.dev/api/retell-webhook`
   - Local dev (via tunnel like ngrok): `https://your-ngrok.ngrok.io/api/retell-webhook`
3. Webhook events to select:
   - ✅ `call_analyzed` — **Required** — triggers report pipeline
   - ☐ `call_ended` — Optional — only if `ASSESSMENT_REPORT_PROCESS_CALL_ENDED=true`
   - ☐ `call_started` — Optional — for monitoring only
   - ☐ `transcript_updated` — Optional — for real-time transcript sync

### 5.2 Webhook security
Retell signs webhooks with HMAC-SHA256. The signature format is:
```
v={timestamp},d={hex_digest}
```

The backend verifies this at `src/lib/server/retell.ts` using `RETELL_API_KEY` as the secret.

**Your server expects**:
- Header: `x-retell-signature`
- Verification: HMAC-SHA256 of `(raw_body + timestamp)` keyed by `RETELL_API_KEY`
- Timestamp tolerance: ±5 minutes

### 5.3 Webhook retry behavior
- Retell retries failed webhooks 3 times
- Timeout: 10 seconds per attempt
- Your server should respond quickly (2xx within 3 seconds recommended)
- Slow processing is handled by Cloudflare Queue, so just return 204 fast

---

## 6. Phone Number Setup

### 6.1 Buy a phone number
1. Go to **Dashboard → Phone Numbers**
2. Click **"Buy Number"**
3. Select country (Australia recommended: +61)
4. Choose a number and purchase
5. Numbers start at ~$1/month

### 6.2 Assign agent to number
1. Click on the purchased number
2. Under **"Assigned Agent"**, select your Annie agent
3. Save

### 6.3 Configure inbound/outbound
- **Inbound**: Enabled by default — callers can dial this number
- **Outbound**: Enable if you want to make outbound calls (for follow-ups)

### 6.4 Set callback number (for web calls)
If using in-browser calls (the `CallAssessmentButton` on your website):
1. Go to **Dashboard → Phone Numbers → Your Number**
2. Set **Callback Number** to your business number (or the same Retell number)
3. This is the number shown to carriers when the web call is bridged to the PSTN

The frontend code uses `PUBLIC_RETELL_CALLBACK_PHONE_NUMBER` and `PUBLIC_RETELL_CALLBACK_COUNTRIES` for call attribution.

---

## 7. Environment Variables

### 7.1 Server-side (secrets — never exposed to browser)

```bash
# Retell (voice agent)
RETELL_API_KEY=key_45f2aee94a3807e3fa5784d34743              # From Retell dashboard
RETELL_VOICE_AGENT_ID=agent_1bdfd0dff58535cbd4dfc60092       # From agent settings
RETELL_VOICE_AGENT_VERSION=0                                 # Agent version number

# Optional: Process call_ended events in addition to call_analyzed
ASSESSMENT_REPORT_PROCESS_CALL_ENDED=true
```

### 7.2 Client-side (public — visible in browser)

```bash
# Retell (web call SDK)
PUBLIC_RETELL_PUBLIC_KEY=public_key_f338196e7203e647dbcce     # From Retell dashboard
PUBLIC_RETELL_VOICE_AGENT_ID=agent_1bdfd0dff58535cbd4dfc60092 # Same as RETELL_VOICE_AGENT_ID
PUBLIC_RETELL_VOICE_AGENT_VERSION=1                           # Recommended: 1 for browser calls
PUBLIC_RETELL_CALLBACK_PHONE_NUMBER=+61483983003             # Your callback number
PUBLIC_RETELL_CALLBACK_COUNTRIES=AU                          # Comma-separated ISO country codes
```

### 7.3 Deploy to production

```bash
# Set each secret on Cloudflare Pages
npx wrangler pages secret put RETELL_API_KEY
npx wrangler pages secret put RETELL_VOICE_AGENT_ID
npx wrangler pages secret put RETELL_VOICE_AGENT_VERSION

# Public vars go in .env (they are inlined at build time)
# Make sure .env has the PUBLIC_* variables set
```

---

## 8. Stripe Checkout Integration

When the call ends, the webhook handler checks if payment was completed. If not, the assessment stays in "pending_transcript" state until Stripe sends a `checkout.session.completed` webhook.

### 8.1 How payment links flow through Retell

1. Caller completes the assessment intake
2. Annie tells them payment is required
3. The `create-assessment-checkout` API creates a Stripe Checkout session for $1200 AUD
4. Payment URL is sent by SMS (via Twilio) to the caller's phone
5. Caller pays via Stripe
6. Stripe webhook fires → triggers the report pipeline via Cloudflare Queue

### 8.2 Alternative: Pre-payment before call

If you prefer callers to pay before the call:
1. Remove payment discussion from Retell agent
2. Use the website's `CallAssessmentButton` to require payment first
3. Set `paymentStatus` metadata when creating the call
4. The `call_analyzed` webhook will see `paymentStatus: complete` and queue the job immediately

---

## 9. Testing in Retell Playground

### 9.1 Use the Playground for rapid testing
1. Go to **Dashboard → Your Agent → Playground**
2. Click **"Start Call"** to simulate a browser voice call
3. Talk to Annie as if you're a business owner

### 9.2 Test scenarios (run all of these)

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 1 | Approve and complete full intake | Annie conducts full assessment, fields extracted, pipeline queues |
| 2 | Refuse approval at pricing | Annie politely exits, directs to website |
| 3 | Ask about $1,200 AUD cost | Annie explains price, process, report contents, then asks again |
| 4 | Give vague answer | Annie asks: "When was the last time that happened? Give me a specific example." |
| 5 | Try to share password/card | Annie refuses: "Please don't share sensitive information." |
| 6 | Ask for legal/medical/tax advice | Annie refuses: "I'm not qualified to give that advice." |
| 7 | End call early | Transcript saved, pipeline handles incomplete data gracefully |
| 8 | Web call from button | `CallAssessmentButton` connects via Retell Web SDK |

### 9.3 Verify post-call analysis
1. After each test call, go to **Dashboard → Call History**
2. Click on the call → **Analysis** tab
3. Verify all custom fields are populated
4. Check `assessment_ready` = true
5. Check `verbal_approval_given` = true (for approved calls)

### 9.4 Verify webhook delivery
1. After test call, check your Cloudflare Pages logs:
   ```bash
   npx wrangler tail agenticai-net-au
   ```
2. Look for `POST /api/retell-webhook` with `call_analyzed` event
3. Verify transcript stored in D1 (check `transcripts` table)
4. Verify pipeline status set to `queued`

### 9.5 Check the pipeline
```bash
# List D1 pipeline statuses
npx wrangler d1 execute assessment_db --command="SELECT session_id, status, error FROM pipeline_status ORDER BY updated_at DESC LIMIT 5;"

# Check queue depth
npx wrangler queues info assessment-jobs
```

---

## 10. Going Live

### 10.1 Pre-launch checklist
- [ ] Agent created with correct voice and model
- [ ] Global prompt uploaded and tested
- [ ] Post-call analysis enabled with all 24 custom fields
- [ ] Webhook URL registered and tested
- [ ] Phone number purchased and assigned
- [ ] Environment variables set in production (.env + wrangler secrets)
- [ ] Stripe Checkout endpoint working
- [ ] Cloudflare Queue created and consumer deployed
- [ ] Test call completed end-to-end (call → webhook → queue → pipeline → report)
- [ ] Report renders correctly in portal with RevealDeck

### 10.2 Browser call flow (what your users see)
1. User visits `https://agenticai.net.au`
2. Clicks **"Start AI Business Assessment"** button
3. Frontend POSTs to `/api/create-retell-web-call`
4. Backend calls Retell API with `agent_id` and `retell_llm_dynamic_variables`
5. Retell returns `access_token` and `call_id`
6. Frontend loads `RetellWebClient` SDK via dynamic import
7. Audio connection established via WebRTC
8. User speaks with Annie in real-time in the browser
9. When call ends, `call_analyzed` webhook fires
10. Backend: signature verified → transcript stored → payment checked → job queued
11. Queue consumer: runs pipeline → LLM analysis → report saved to R2
12. Email sent: report ready with portal link
13. User visits `/portal` → authenticates via Clerk → views report

---

## 11. Troubleshooting

### 11.1 Common issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Webhook returns 401 | Incorrect `RETELL_API_KEY` | Copy the exact key from Retell dashboard → Settings → API Keys |
| Webhook returns 204 but no report | `assessment_ready` = false or `verbal_approval_given` = false | Check post-call analysis fields in Retell call history |
| Webhook times out (502/504) | Server processing too slow | Queue processing handles async work; webhook should respond in <3s |
| `call_analyzed` not firing | Post-call analysis disabled | Enable in **Agent → Post-Call Analysis** |
| Missing analysis fields | Custom fields not configured | Add all 24 fields in Retell dashboard |
| Analysis fields are empty or "null" | LLM couldn't extract from transcript | Improve global prompt instructions or check transcript quality |
| Report says "No analysis available" | Pipeline failed | Check D1 `pipeline_status` table for error messages |
| Call button doesn't work | Missing env vars | Verify `RETELL_API_KEY` and `RETELL_VOICE_AGENT_ID` are set |
| "Unable to connect to Annie" | Retell API error | Check Retell dashboard for agent status; verify API key hasn't expired |
| Payment not triggering report | Stripe webhook not configured | Verify Stripe webhook endpoint and `retell_call_id` in checkout metadata |

### 11.2 Debug commands

```bash
# Tail live logs
npx wrangler tail agenticai-net-au

# Check recent pipeline statuses
npx wrangler d1 execute assessment_db --command="SELECT session_id, status, error, attempts FROM pipeline_status ORDER BY updated_at DESC LIMIT 10;"

# Check recent transcripts
npx wrangler d1 execute assessment_db --command="SELECT call_id, customer_email, source FROM transcripts ORDER BY created_at DESC LIMIT 5;"

# Inspect queue depth
npx wrangler queues info assessment-jobs

# List recent calls in Retell (via API)
curl -s https://api.retellai.com/v2/get-all-calls \
  -H "Authorization: Bearer $RETELL_API_KEY" \
  -H "Content-Type: application/json" | python3 -m json.tool

# Get specific call transcript
curl -s https://api.retellai.com/v2/get-call/$CALL_ID \
  -H "Authorization: Bearer $RETELL_API_KEY" \
  -H "Content-Type: application/json" | python3 -m json.tool
```

### 11.3 Reset everything after a test

```bash
# Clear local D1 (dev only)
rm -rf .wrangler/state/v3/d1

# Clear pipeline statuses (careful in production)
npx wrangler d1 execute assessment_db --command="DELETE FROM pipeline_status WHERE status = 'error';"

# Reapply migrations
npx wrangler d1 migrations apply assessment_db --local

# Clear R2 bucket (dev only)
npx wrangler r2 object delete assessment_blobs --recursive=true
```

---

## Quick Reference

### File locations
| File | Purpose |
|------|---------|
| `src/routes/api/create-retell-web-call/+server.ts` | Browser call creation endpoint |
| `src/routes/api/retell-webhook/+server.ts` | Webhook receiver (signature verify, queue job) |
| `src/lib/server/assessment/retell-job.ts` | Transforms Retell payload → AssessmentReportJob |
| `src/lib/server/retell.ts` | HMAC-SHA256 signature verification |
| `src/lib/stores/call.ts` | Frontend call state + RetellWebClient SDK |
| `src/lib/components/CallAssessmentButton.svelte` | Call start/end button UI |

### Retell API endpoints used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://api.retellai.com/v2/create-web-call` | POST | Start a browser-based call |
| `https://api.retellai.com/v2/get-call/{id}` | GET | Get call details + transcript |
| `https://api.retellai.com/v2/get-all-calls` | GET | List recent calls |

### Post-call analysis field count
- 24 custom fields extracted per call
- 10 text fields, 5 boolean fields, 1 status field (payment_status)
- All fields feed into `AssessmentReportJob` → pipeline → RevealDeck report

---

## Summary

1. **Create Retell account** → get API key, public key, signing secret
2. **Create Conversation Flow Agent** → upload global prompt, set voice, set model
3. **Configure 24 custom analysis fields** → exact field names matter
4. **Register webhook** → `https://agenticai.net.au/api/retell-webhook`
5. **Buy phone number** → assign to agent
6. **Set environment variables** → 4 server secrets + 5 public vars
7. **Test in Playground** → verify analysis fields populate
8. **End-to-end test** → call → payment → report → portal
9. **Monitor** → wrangler tail, D1 queries, queue depth
10. **Iterate** → adjust prompt and knowledgebase based on real calls

Questions? Check `docs/retell-annie-voice-agent-workflow.md` for deeper architectural details.