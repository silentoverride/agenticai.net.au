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
   - [Basic Settings](#22-basic-settings)
   - [Speech Settings](#23-speech-settings)
   - [Voice Characteristics](#24-additional-voice-characteristics)
   - [Realtime Transcription](#25-realtime-transcription-settings)
   - [Transition Flexibility](#26-transition-flexibility)
   - [Pronunciation](#27-pronunciation)
   - [Knowledge Base](#28-knowledge-base)
   - [Call Settings](#29-call-settings)
   - [Security & Fallback](#210-security--fallback-settings)
   - [Agent Webhook](#211-webhook-settings-agent-level)
3. [Global Prompt (System Prompt)](#3-global-prompt-system-prompt)
4. [Configure Post-Call Analysis Fields](#4-configure-post-call-analysis-fields)
5. [Webhook Configuration](#5-webhook-configuration)
6. [Phone Number Setup](#6-phone-number-setup)
7. [Environment Variables](#7-environment-variables)
8. [Stripe Checkout Integration](#8-stripe-checkout-integration)
9. [Cloudflare Queue & Consumer Worker](#9-cloudflare-queue--consumer-worker)
10. [Testing in Retell Playground](#10-testing-in-retell-playground)
11. [Going Live](#11-going-live)
12. [Troubleshooting](#12-troubleshooting)

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

### 2.3 Speech settings

Configure these in **Dashboard → Your Agent → Speech**:

| Setting | Value | Why |
|---------|-------|-----|
| **Background Sound** | None | Keep the call clean and professional |
| **Response Eagerness** | 1 | Patient — waits a beat after the caller finishes, avoids cutting in |
| **Dynamically adjust based on user input** | Enabled | Adapts speech cadence to match the caller's pace |
| **Interruption Sensitivity** | 0.9 | Stops immediately when the caller talks over her — high sensitivity means Annie yields fast |
| **Allow DTMF interruption** | Enabled | Caller can press keypad buttons to interrupt if needed |
| **Reminder Message Frequency** | 10 seconds, 1 time | Sends a gentle "Are you still there?" nudge once if silence exceeds 10 seconds |

### 2.4 Additional voice characteristics
These settings are usually found in the **Voice** or **General** tab:

- **Speaking speed**: Medium (1.0x recommended)
- **Temperature**: 0.3–0.5 (keep it focused, don't let Annie ramble)
- **Silence timeout**: 7 seconds (give time for thinking)
- **End-of-sentence detection**: Enabled

### 2.5 Realtime Transcription Settings

Found at **Dashboard → Your Agent → Realtime Transcription**.

| Setting | Recommended Value | Reason |
|---------|-------------------|--------|
| **Denoising Mode** | Remove noise | Filters office hum, keyboard clicks, AC noise. Don't use "Remove noise + background speech" unless callers are in loud open-plan offices — that level of suppression can occasionally clip the caller's voice. |
| **Transcription Mode** | Optimize for accuracy | Business assessments require precise vocabulary (tool names, roles, workflows). Speed optimization can miss technical terms. |
| **Vocabulary Specialization** | General | The assessment covers general business workflows, not healthcare. |
| **Boosted Keywords** | Add below | These are business/tech terms the model might mishear. Boosting them improves transcript accuracy for the downstream report pipeline. |

#### Boosted Keywords to add

Paste these into **Boosted Keywords** (one per line or comma-separated):

```
Agentic AI
HubSpot
Zapier
Make.com
Notion
Slack
Salesforce
Stripe
QuickBooks
Xero
SOP
CRM
KPI
SME
VA
chatbot
Miro
Figma
Calendly
Mailchimp
ActiveCampaign
Airtable
Monday.com
Asana
Trello
ClickUp
```

> **Tip**: Add or remove keywords based on your client's industry. If you serve trades, add "Quote2Cash", "ServiceM8", "simPRO". If you serve professional services, add "Practice Ignition", "Karbon", "FYI Docs".

> **Why boosted keywords matter**: The transcript feeds directly into the AI report pipeline. If "Zapier" is transcribed as "Zap year" or "HubSpot" as "Hub's pot", the tool-lookup step and LLM analysis will produce lower-quality or incorrect recommendations. Accuracy at the transcription layer cascades through the entire report.

---

### 2.6 Transition Flexibility

Found at **Dashboard → Your Agent → General → Transition Flexibility**.

| Setting | Recommended Value | Reason |
|---------|-------------------|--------|
| **Transition Flexibility** | **Flex Mode** | The assessment is a conversation, not a rigid script. Business owners may go on tangents about their workflows, ask clarifying questions, or jump back to earlier topics. Flex Mode allows Annie to handle natural conversational flow rather than forcing a linear sequence. |

> **When to use Rigid Mode**: Only if you find Annie is skipping critical questions or going off-topic too frequently. For most business assessments, Flex Mode produces a more natural caller experience.

---

### 2.7 Pronunciation

Found at **Dashboard → Your Agent → Speech → Pronunciation**.

Add pronunciation guides for names and terms that could be mispronounced:

| Word / Phrase | Pronunciation Hint |
|---------------|-------------------|
| **Agentic** | "uh-JEN-tick" |
| **Xero** | "ZEER-oh" (not "zero") |
| **HubSpot** | "HUB-spot" |
| **Zapier** | "ZAP-ee-er" |
| **Mailchimp** | "MAIL-chimp" |
| **Airtable** | "AIR-table" |
| **Asana** | "ah-SAH-nah" |
| **Miro** | "MEER-oh" |
| **SME** | "ess-em-ee" (spell it out: Small and Medium Enterprise) |
| **KPI** | "kay-pee-eye" |
| **SOP** | "ess-oh-pee" |

> **When to add more**: After your first 5–10 real calls, review the transcripts for any mispronounced words. Add them here so Annie sounds professional on every call.

---

### 2.8 Knowledge Base

Found at **Dashboard → Your Agent → Knowledge Base**.

The Knowledge Base provides Annie with factual context she can reference during the call. Unlike the Global Prompt (which sets personality), the Knowledge Base is for **reference material**.

**Recommended setup**:

1. **Upload your question knowledgebase**: Add `docs/question-knowledgebase.md` as the primary knowledge base document. This contains the structured interview questions and follow-up prompts Annie should use.

2. **Add a company FAQ** (optional): Create a document with answers to common questions:
   - "What does the $1,200 include?"
   - "How long does the report take?"
   - "What happens after the assessment?"
   - "Can I share the report with my team?"
   - "Do you implement the recommendations?"

#### Knowledge Base configuration

| Setting | Recommended Value | Reason |
|---------|-------------------|--------|
| **Industry Specific Questions** | **Add** | Upload `docs/question-knowledgebase.md` (interview questions) and `docs/company-faq.md` (common questions about the business) — both are critical for Annie to answer caller questions and guide the assessment |
| **KB Retrieval Chunks** | 3 | Annie only needs a few relevant questions at a time; too many chunks cause her to jump around |
| **Similarity Threshold** | 0.7 | Balances between recalling the exact right question and having flexibility for related topics |

#### Knowledge Base Instruction

Paste this into **Configure Knowledge Base Instruction**:

```text
Use the knowledge base as a structured interview guide.
- When a caller describes a workflow or pain point, look up the relevant follow-up questions in the knowledge base
- Ask ONE question at a time — never ask multiple questions in one turn
- Use the knowledge base to guide the conversation, but do not read questions verbatim like a robot
- Adapt the phrasing to feel natural and conversational
- After completing a section, move to the next topic smoothly
- If the caller goes off-topic, gently redirect back using the knowledge base structure
- Never skip the pricing disclosure and approval step — this is mandatory regardless of knowledge base content
- If the caller asks about pricing, what's included, refunds, data privacy, how long the report takes, or how to share the report, reference the company FAQ document for accurate, up-to-date answers
```

---

### 2.9 Call Settings

Found at **Dashboard → Your Agent → Call Settings**.

| Setting | Recommended Value | Reason |
|---------|-------------------|--------|
| **Voicemail Detection** | Enabled — Hang up | If the call hits voicemail, Annie should hang up rather than leave a message. The assessment requires a live two-way conversation |
| **IVR Hangup** | Enabled | If an automated phone system answers, Annie should hang up immediately. She cannot navigate IVR menus |
| **User Keypad Input Detection** | Enabled | Caller can press digits during the call (e.g., to confirm a selection). The DTMF interruption setting also enables this |
| **Timeout** | 2.5 seconds | How long Annie waits for keypad input before responding. 2.5s is fast enough to feel responsive without cutting off someone who's still deciding |
| **End Call on Silence** | 10 minutes | If a caller is completely silent for 10 minutes, hang up. This prevents runaway calls where someone walked away |
| **Max Call Duration** | 30 minutes | Cap the call at 30 minutes. The assessment is designed for 20–30 minutes; longer calls degrade transcript quality and increase Retell costs |
| **Ring Duration** | 30 seconds | Wait up to 30 seconds for the caller to answer. Longer than this usually means no one is available |

> **Note on Max Call Duration**: The default is 1 hour, but the assessment rarely needs more than 30 minutes. A 30-minute cap protects against:
> - Runaway conversations where Annie and the caller loop
> - Unexpected Retell billing for very long calls
> - Transcript quality degradation on very long recordings

---

### 2.10 Security & Fallback Settings

Found at **Dashboard → Your Agent → Security & Fallback**.

| Setting | Recommended Value | Reason |
|---------|-------------------|--------|
| **Data Storage** | Everything except PII | Store recordings and transcripts but avoid retaining sensitive personal identifiers in Retell's long-term storage. PII is already captured in your D1 database under your control |
| **Retention** | Keep forever | Assessment transcripts are valuable for quality review and improving the knowledgebase. Keep them until you have a data retention policy in place |
| **Personal Info Redaction (PII)** | Set up selectively | Redact credit card numbers and passwords if they slip through (Annie should refuse these, but defense in depth). Keep names, emails, and phone numbers — they're needed for the report |
| **Safety Guardrails** | Enable all | Prevent Annie from generating harmful, illegal, or inappropriate content |
| **Opt In Secure URLs** | Disabled | Not needed for the assessment flow. The transcript and call data never leave Retell via URL |
| **Fallback Voice ID** | Automatic fallback | If the primary voice provider fails, Retell automatically switches to another voice. Don't override this unless you have a specific backup voice preference |
| **Default Dynamic Variables** | Set fallbacks | If `source`, `assessment_fee`, or `site` are not provided, Annie falls back gracefully. Set defaults: `source` = "unknown", `assessment_fee` = "$1,200.00 AUD", `site` = "agenticai.net.au" |

#### PII Redaction categories to enable

| Category | Enable? | Why |
|----------|---------|-----|
| Credit Card Numbers | ✅ Yes | Annie should never ask for these, but defense in depth |
| Bank Account Numbers | ✅ Yes | Same reason |
| Passwords / API Keys | ✅ Yes | Annie refuses these, but redact if accidentally spoken |
| Social Security / Tax IDs | ✅ Yes | Not relevant for Australian callers, but enable anyway |
| Email Addresses | ☐ No | Needed for the assessment report and portal |
| Phone Numbers | ☐ No | Needed for SMS payment link delivery |
| Names | ☐ No | Needed for personalisation and report |
| Company Names | ☐ No | Core assessment data |

> **Important**: PII redaction in Retell affects the stored transcript, but the raw webhook payload (sent to your server) contains the unredacted data. Your webhook handler at `/api/retell-webhook` receives the full transcript and stores it in D1. Ensure your D1 database has appropriate access controls.

---

### 2.11 Webhook Settings (Agent Level)

Found at **Dashboard → Your Agent → Webhook**.

These settings are specific to this agent. For the global account webhook, see [Section 5](#5-webhook-configuration).

| Setting | Recommended Value | Reason |
|---------|-------------------|--------|
| **Agent Level Webhook URL** | Leave blank | Use the account-level webhook instead (Section 5). Agent-level webhooks are only needed if different agents post to different endpoints |
| **Webhook Timeout** | 5 seconds | Your server should respond in under 3 seconds. 5 seconds gives a small buffer without holding Retell connections open too long |
| **Webhook Events** | `call_analyzed` only | The agent webhook should only receive post-call analysis events. Call-started and call-ended events are handled by the account-level webhook if needed |

> **When to use agent-level webhooks**: If you run multiple Retell agents (e.g., a sales agent and an assessment agent) and want them to post to different backend endpoints. For single-agent setups, the account-level webhook is cleaner.

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

> **Tip:** These variables are optional. If your prompt hardcodes the fee, company name, and site, the dynamic variables are silently ignored. This works fine for a single product at a fixed price. If you later want to run campaigns with different pricing or track call sources, switch the prompt to `{{assessment_fee}}` and `{{source}}` and send the matching values from the `create-retell-web-call` API.

## 4. Configure Post-Call Analysis Categories

This is **critical** — these fields power the AI report generation pipeline. If they're not configured, the report will be low-quality.

Retell's post-call analysis UI has changed: there is no longer a global "Analysis Instructions" text box. Instead, you add each field individually as an **Analysis Category** with its own **Name** and **Description** (the Description field acts as the extraction prompt for that specific field).

### 4.1 Enable post-call analysis
1. Go to **Dashboard → Your Agent → Post-Call Analysis**
2. Toggle **"Enable Post-Call Analysis"** to ON
3. Select **Model**: GPT-4 (required for complex business analysis)

### 4.2 Add analysis categories

In the Retell dashboard, click **"Add Category"** for each field below.

**How the fields work:**
- **Name** — the exact snake_case key. Must match the table below — our webhook handler (`src/lib/server/assessment/retell-job.ts`) expects these exact keys.
- **Description** — the extraction prompt for this field. Paste exactly what's shown.
- **Category Type** — Boolean, Text, or Selector.

> **Important**: There is no longer a global Analysis Instructions prompt. The extraction guidance is distributed across each category's Description field.

### 4.3 Add each analysis category

Create **26 categories** following this pattern. For each one, click **Add Category**, select the type, enter the exact Name, and paste the Description into the Description field.

#### Text categories (20)

| Name | Description (paste into Retell Description field) |
|------|---------------------------------------------------|
| `caller_name` | What is the full name of the person on this call? Return empty string if not mentioned. |
| `caller_role` | What is this person's role or job title in their business? Return empty string if not mentioned. |
| `caller_email` | What email address did the caller provide for the assessment report? Return empty string if not mentioned. |
| `caller_phone` | What phone number did the caller provide? Return empty string if not mentioned. |
| `company` | What is the company or business name mentioned on this call? Return empty string if not mentioned. |
| `industry` | What industry or sector does this business operate in? Return empty string if not clear. |
| `team_size` | How many people are in the team, including contractors? Return as a text description (e.g., "5–10"). Return empty string if not mentioned. |
| `current_tools` | List all software tools, apps, or platforms mentioned by the caller. Separate with commas. Return empty string if none mentioned. |
| `top_pain_points` | What are the top 2–3 biggest workflow pain points mentioned by the caller? Summarise briefly. Return empty string if none. |
| `repeated_tasks` | What tasks does the caller repeat weekly that feel like they should be automated? Return empty string if not discussed. |
| `operating_rhythm` | How does the team work day-to-day? What is their typical workflow rhythm? Return empty string if not discussed. |
| `lead_customer_response_workflow` | How do new enquiries arrive and how are they followed up? Return empty string if not discussed. |
| `knowledge_documentation_gaps` | Where is knowledge documentation missing or incomplete? Return empty string if not mentioned. |
| `reporting_visibility_gaps` | What reports or visibility is missing that would help decision-making? Return empty string if not mentioned. |
| `estimated_time_loss` | How much time per week is lost to manual, repeated, or inefficient work? Return empty string if not mentioned. |
| `revenue_or_customer_impact` | What is the financial or customer impact of the pain points mentioned? Return empty string if not discussed. |
| `priority_outcome` | If the caller had to choose one outcome — owner time saved, faster customer response, reduced admin cost, more sales, or better team consistency — which matters most? Return empty string if unclear. |
| `privacy_or_compliance_constraints` | Did the caller mention any privacy, compliance, or data sensitivity constraints? If yes, summarise. If no, return empty string. |
| `open_questions_for_follow_up` | What open questions remain that the assessment team should follow up on? Return empty string if none. |
| `payment_status` | What was the payment outcome: pending, sent, paid, complete, or not_discussed? Return one of these exact strings. Return empty string if unclear. |

#### Boolean categories (6)

| Name | Description (paste into Retell Description field) |
|------|---------------------------------------------------|
| `lead_response_gap` | Does the call mention delays in responding to new leads or enquiries? Return true or false. |
| `knowledge_gap` | Does the call mention knowledge trapped in one person's head or poor documentation? Return true or false. |
| `manual_reporting_gap` | Does the call mention manual reporting or copying data between systems? Return true or false. |
| `assessment_ready` | Based on the transcript, is there enough information to generate a meaningful assessment report? Return true or false. |
| `verbal_approval_given` | Did the caller explicitly approve proceeding with the $1,200 AUD assessment before or after the questions? Return true or false. |
| `payment_link_sent` | Was a payment link discussed, sent, or completed during this call? Return true or false. |

**Tip**: If you want a consolidated extraction guidance block for all fields, paste this into the Description of your first category (e.g., `caller_name`):

```
Analyse this AI Business Assessment call and extract structured data.
Goal: Generate a flat JSON object with string and boolean values.
Rules: No nested objects, no markdown, no explanation. Use empty string for missing text fields. Use true/false for booleans. Join lists with commas.
```

### 4.4 Built-in post-call data extraction fields

In addition to your 26 custom fields, Retell provides three built-in extraction fields. These are configured separately in **Dashboard → Your Agent → Post-Call Data Extraction**.

| Field | Type | Recommended Prompt / Setting | Used By |
|-------|------|------------------------------|---------|
| **Call Summary** | Text | "Summarise the key points of this AI Business Assessment call in 2-3 sentences. Include: who called, their business, the main pain points discussed, and whether they approved the assessment." | Internal review, quality assurance, CRM notes |
| **Call Successful** | Boolean | "Was this a successful assessment intake? Answer true if the caller completed the discovery questions and gave verbal approval. Answer false if they refused, hung up early, or the call failed." | Pipeline go/no-go logic |
| **User Sentiment** | Text | "What was the caller's overall attitude during the call? Choose one: Very Positive, Positive, Neutral, Negative, Very Negative." | CRM tagging, follow-up prioritisation |

#### How to configure built-in fields

1. Go to **Dashboard → Your Agent → Post-Call Data Extraction**
2. Click **Add** next to each field type (Summary, Success, Sentiment)
3. Paste the recommended prompt into the **Extraction Prompt** field
4. Select **Model**: GPT-4.1 (fast and accurate for summary tasks)

> **Important distinction**: These built-in fields are **not** sent to your webhook handler. The webhook receives the 26 custom fields plus the raw transcript. The built-in fields are only available inside the Retell dashboard for your internal review. If you want them in your system, extract them yourself from the transcript in the webhook handler or include them as custom fields.

> **Storage note**: By default, Retell stores these analysis results alongside the call recording. If you selected "Everything except PII" in Security settings, personal identifiers may be redacted in the Retell-stored summary but will still be present in the webhook payload your server receives.

---

## 5. Webhook Configuration

### 5.1 Register the webhook
1. Go to **Dashboard → Your Agent → Webhook**
2. Add webhook URL:
   - Production: `https://agenticai.net.au/api/retell-webhook`
   - Preview (for testing): `https://<your-deployment>.agenticai-net-au.pages.dev/api/retell-webhook`
     - Find your latest preview URL via: `npx wrangler pages deployment list`
3. Webhook events to select:
   - ✅ `call_analyzed` — **Required** — triggers report pipeline
   - ☐ `call_ended` — Optional — only processed when `ASSESSMENT_REPORT_PROCESS_CALL_ENDED=true`
   - ☐ `call_started` — Optional — accepted but silently ignored (returns 204)
   - ☐ `transcript_updated` — Optional — accepted but silently ignored (returns 204)

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

The frontend code uses the server-side `create-retell-web-call` endpoint for browser calls.

---

## 7. Environment Variables

### 7.1 Server-side (secrets — never exposed to browser)

```bash
# Retell (voice agent)
RETELL_API_KEY=key_xxxxxxxxxxxxxxxxxxxx                        # From Retell dashboard → Settings → API Keys
RETELL_VOICE_AGENT_ID=agent_xxxxxxxxxxxxxxxx                   # From agent settings page
RETELL_VOICE_AGENT_VERSION=0                                 # Agent version number

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx                # From Stripe dashboard → Developers → API Keys
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx              # From Stripe webhook endpoint details

# Twilio (SMS for payment links)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx           # From Twilio Console
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here                  # From Twilio Console
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx          # From Twilio Console → API Keys
TWILIO_API_KEY_SECRET=your_twilio_api_key_secret               # From Twilio Console → API Keys
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx # From Twilio Messaging Service
TWILIO_FROM_NUMBER=+61400000000                                # Your Twilio phone number
RETELL_TWILIO_WEBHOOK_SECRET=replace_with_shared_secret        # Shared secret for Retell→Twilio SMS chain

# Report pipeline (LLM + research + email + storage)
OLLAMA_BASE_URL=https://api.ollama.ai                          # Ollama API base URL (or OpenRouter, etc.)
OLLAMA_API_KEY=your-api-key                                    # API key for Ollama / OpenRouter
OLLAMA_MODEL=kimi-k2.6:cloud                                   # Model identifier (default: kimi-k2.6:cloud)
OPENAI_API_KEY=sk-...                                          # Optional: fallback to OpenAI directly
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxx                       # Perplexity API key for AI tool research
PERPLEXITY_MODEL=sonar-pro                                     # Perplexity model (default: sonar-pro)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxx                     # SendGrid API key for email delivery
DEFAULT_FROM_EMAIL=hello@agenticai.net.au                      # From address for all emails
DEFAULT_FROM_NAME=Agentic AI                                   # Display name for all emails

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxx                # From Clerk dashboard → API Keys

# Internal queue consumer authentication (shared secret — needed by BOTH Pages and Worker)
INTERNAL_SECRET=replace_with_random_32_byte_base64             # openssl rand -base64 32
SELF_URL=https://agenticai.net.au                              # Public URL of your site (used by queue consumer)

# Local development paths (ignored in Cloudflare production)
DB_DIR=./app_data                                              # Local SQLite database directory
REPORTS_DIR=./app_data/reports                                 # Local report output directory
TRANSCRIPTS_DIR=./app_data/transcripts                         # Local transcript backup directory

# Optional features
ASSESSMENT_REPORT_PROCESS_CALL_ENDED=false                   # Also process call_ended events (default: false)
PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=your_cloudflare_token       # Optional: Cloudflare Web Analytics beacon token
```

### 7.2 Public variables (exposed to browser)

Set these in `.env` for local dev and in the Cloudflare Pages dashboard → Settings → Environment Variables for production.

```bash
PUBLIC_SITE_URL=https://agenticai.net.au                       # Public URL of your site
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxx    # From Clerk dashboard → API Keys
PUBLIC_CALENDLY_URL=https://calendly.com/example/30min         # Calendly booking link
```

```bash
# Set each secret on Cloudflare Pages
npx wrangler pages secret put RETELL_API_KEY
npx wrangler pages secret put RETELL_VOICE_AGENT_ID
npx wrangler pages secret put RETELL_VOICE_AGENT_VERSION
npx wrangler pages secret put STRIPE_SECRET_KEY
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
npx wrangler pages secret put SENDGRID_API_KEY
npx wrangler pages secret put TWILIO_ACCOUNT_SID
npx wrangler pages secret put TWILIO_AUTH_TOKEN
npx wrangler pages secret put TWILIO_API_KEY_SID
npx wrangler pages secret put TWILIO_API_KEY_SECRET
npx wrangler pages secret put TWILIO_MESSAGING_SERVICE_SID
npx wrangler pages secret put TWILIO_FROM_NUMBER
npx wrangler pages secret put RETELL_TWILIO_WEBHOOK_SECRET
npx wrangler pages secret put OLLAMA_BASE_URL
npx wrangler pages secret put OLLAMA_API_KEY
npx wrangler pages secret put OLLAMA_MODEL
npx wrangler pages secret put PERPLEXITY_API_KEY
npx wrangler pages secret put PERPLEXITY_MODEL
npx wrangler pages secret put SENDGRID_API_KEY
npx wrangler pages secret put DEFAULT_FROM_EMAIL
npx wrangler pages secret put DEFAULT_FROM_NAME
npx wrangler pages secret put OPENAI_API_KEY
npx wrangler pages secret put CLERK_SECRET_KEY
npx wrangler pages secret put INTERNAL_SECRET

# Also set on the queue consumer worker (must match the Pages value)
npx wrangler secret put INTERNAL_SECRET
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

---

## 9. Cloudflare Queue & Consumer Worker

The pipeline runs **asynchronously** via Cloudflare Queue to avoid Cloudflare Pages' 30-second request limit.

### 9.1 How the queue fits in

Two paths enqueue a pipeline job:

1. **Retell webhook** (`/api/retell-webhook`):
   - Call ends → transcript stored in D1 → if payment already marked `paid`/`complete`, enqueue job → return 204
   - If payment not yet complete, transcript stays in D1 until Stripe webhook triggers

2. **Stripe webhook** (`/api/stripe/webhook`):
   - Customer pays $1,200 AUD → `checkout.session.completed` fires
   - Backend finds the stored transcript by `retell_call_id` → enqueues job
   - Sends receipt email + portal invitation email

### 9.2 What the queue consumer does

A standalone Cloudflare Worker (`workers/queue-consumer.ts`) reads from `assessment-jobs`:

1. Receives the pipeline job message
2. POSTs to the internal endpoint `/api/internal/run-pipeline` with `x-internal-secret` header
3. The SvelteKit handler runs `runReportPipeline()` with R2 bucket access
4. Pipeline stages: tool lookup → LLM analysis → report save → email notification
5. D1 status updated: `queued` → `running_llm` → `completed` or `error`

### 9.3 Queue consumer configuration

Before deploying the worker, you must create the queue and its dead-letter queue (if they don't already exist):

```bash
# Create the main queue (run once)
npx wrangler queues create assessment-jobs

# Create the dead-letter queue (run once)
npx wrangler queues create assessment-jobs-dlq
```

Check `workers/wrangler.toml`:

```toml
name = "agenticai-queue-consumer"
main = "queue-consumer.ts"
compatibility_date = "2026-04-29"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "assessment_db"
database_name = "assessment-db"
database_id = "e497e4c9-7dd2-4fbf-a4ff-2c24899a4d83"

[[r2_buckets]]
binding = "assessment_blobs"
bucket_name = "assessment-blobs"

[[queues.consumers]]
queue = "assessment-jobs"
max_batch_size = 1
max_retries = 3
dead_letter_queue = "assessment-jobs-dlq"

[vars]
SELF_URL = "https://agenticai.net.au"
```

**Deploy the worker:**
```bash
cd workers
npx wrangler deploy
npx wrangler secret put INTERNAL_SECRET
```

### 9.4 Fallback: inline pipeline execution

If the queue binding is unavailable, the retell-webhook handles processing inline. This works for small transcripts but risks timeout on complex jobs. The queue is strongly recommended for production.

---

## 10. Testing in Retell Playground

### 10.1 Use the Playground for rapid testing
1. Go to **Dashboard → Your Agent → Playground**
2. Click **"Start Call"** to simulate a browser voice call
3. Talk to Annie as if you're a business owner

### 10.2 Test scenarios (run all of these)

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

### 10.3 Verify post-call analysis
1. After each test call, go to **Dashboard → Call History**
2. Click on the call → **Analysis** tab
3. Verify all custom fields are populated
4. Check `assessment_ready` = true
5. Check `verbal_approval_given` = true (for approved calls)

### 10.4 Verify webhook delivery
1. After test call, check your Cloudflare Pages logs:
   ```bash
   npx wrangler tail agenticai-net-au
   ```
2. Look for `POST /api/retell-webhook` with `call_analyzed` event
3. Verify transcript stored in D1 (check `transcripts` table)
4. Verify pipeline status set to `queued`

### 10.5 Check the pipeline
```bash
# List D1 pipeline statuses
npx wrangler d1 execute assessment-db --command="SELECT session_id, status, error FROM pipeline_status ORDER BY updated_at DESC LIMIT 5;"

# Check queue depth
npx wrangler queues info assessment-jobs

# Tail queue consumer logs
npx wrangler tail agenticai-queue-consumer
```

---

## 11. Going Live

### 11.1 Pre-launch checklist
- [ ] Agent created with correct voice and model
- [ ] Global prompt uploaded and tested
- [ ] Post-call analysis enabled with all 26 custom fields
- [ ] Webhook URL registered and tested
- [ ] Phone number purchased and assigned
- [ ] D1 database migrations applied (`wrangler d1 migrations apply assessment-db --remote`)
- [ ] Environment variables set in production (all server secrets + public vars)
- [ ] Stripe Checkout endpoint and webhook working
- [ ] Cloudflare Queue `assessment-jobs` created
- [ ] Queue consumer worker deployed (`cd workers && wrangler deploy`)
- [ ] `INTERNAL_SECRET` set on both Pages and Worker
- [ ] Test call completed end-to-end (call → webhook → queue → pipeline → report)
- [ ] Report renders correctly in portal with RevealDeck

### 11.2 Browser call flow (what your users see)
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

## 12. Troubleshooting

### 12.1 Common issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Webhook returns 401 | Incorrect `RETELL_API_KEY` | Copy the exact key from Retell dashboard → Settings → API Keys |
| Webhook returns 204 but no report | `assessment_ready` = false or `verbal_approval_given` = false | Check post-call analysis fields in Retell call history |
| Webhook times out (502/504) | Server processing too slow | Queue processing handles async work; webhook should respond in <3s |
| `call_analyzed` not firing | Post-call analysis disabled | Enable in **Agent → Post-Call Analysis** |
| Missing analysis fields | Custom fields not configured | Add all 26 fields in Retell dashboard |
| Analysis fields are empty or "null" | LLM couldn't extract from transcript | Improve global prompt instructions or check transcript quality |
| Report says "No analysis available" | Pipeline failed | Check D1 `pipeline_status` table for error messages |
| Call button doesn't work | Missing env vars | Verify `RETELL_API_KEY` and `RETELL_VOICE_AGENT_ID` are set |
| "Unable to connect to Annie" | Retell API error | Check Retell dashboard for agent status; verify API key hasn't expired |
| Payment not triggering report | Stripe webhook not configured | Verify Stripe webhook endpoint and `retell_call_id` in checkout metadata |
| Queue depth growing, no reports | Queue consumer not running | Deploy worker: `cd workers && wrangler deploy` |
| Queue consumer 401 error | `INTERNAL_SECRET` mismatch | Verify same secret on Pages and Worker |
| Pipeline status stuck on `queued` | Consumer not picking up jobs | Check `npx wrangler tail agenticai-queue-consumer` for errors |

### 12.2 Debug commands

```bash
# Tail live logs
npx wrangler tail agenticai-net-au

# Tail queue consumer worker
npx wrangler tail agenticai-queue-consumer

# Check recent pipeline statuses
npx wrangler d1 execute assessment-db --command="SELECT session_id, status, error, attempts FROM pipeline_status ORDER BY updated_at DESC LIMIT 10;"

# Check recent transcripts
npx wrangler d1 execute assessment-db --command="SELECT call_id, customer_email, source FROM transcripts ORDER BY created_at DESC LIMIT 5;"

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

### 12.3 Reset everything after a test

```bash
# Clear local D1 (dev only)
rm -rf .wrangler/state/v3/d1

# Clear pipeline statuses (careful in production)
npx wrangler d1 execute assessment-db --command="DELETE FROM pipeline_status WHERE status = 'error';"

# Reapply migrations
npx wrangler d1 migrations apply assessment-db --local

# Clear R2 bucket (dev only)
# Note: wrangler r2 object delete does not support --recursive.
# Use the Cloudflare dashboard (Storage & Databases → R2 → assessment-blobs → Delete)
# or purge via the R2 API/SDK if you need to bulk-delete.
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
- 26 custom fields extracted per call
- 20 text fields, 6 boolean fields
- All fields feed into `AssessmentReportJob` → pipeline → RevealDeck report

---

## Summary

1. **Create Retell account** → get API key, public key, signing secret
2. **Create Conversation Flow Agent** → upload global prompt, set voice, set model
3. **Configure 26 custom analysis fields** → exact field names matter
4. **Register webhook** → `https://agenticai.net.au/api/retell-webhook`
5. **Buy phone number** → assign to agent
6. **Set environment variables** → ~25 server secrets + 3 public vars
7. **Test in Playground** → verify analysis fields populate
8. **End-to-end test** → call → payment → report → portal
9. **Monitor** → wrangler tail, D1 queries, queue depth
10. **Iterate** → adjust prompt and knowledgebase based on real calls

Questions? Check `docs/retell-annie-voice-agent-workflow.md` for deeper architectural details.