# Retell Workflow: Annie Chat Agent

Use this guide to build Annie in Retell's flow-style chat builder. This is for the website chat agent only, not the voice agent. The flow must disclose the $1,200.00 AUD assessment fee, collect approval, collect contact details, run intake, create a Stripe payment link, and only process the transcript after payment.

Do not add voice-agent, phone-call, or SMS behaviour to this workflow. The payment link is returned inside the chat and sent to the customer as a chat message.

## Prerequisites

- Retell account.
- Stripe account.
- Deployed Agentic AI website.
- Stripe endpoint: `/api/create-assessment-checkout`.
- Website pages: `/terms` and `/privacy`.
- Question bank: `docs/question-knowledgebase.md`.

## Step 1: Create the Chat Agent

1. In Retell, open **Agents**.
2. Click **Create New Agent**.
3. Select **Chat Agent**.
4. Name it:

```text
Annie - AI Business Assessment Chat
```

5. Use Retell's standard LLM configuration.
6. Do not use custom Ollama/Kimi/external LLM routing.

## Step 2: Open the Flow Builder

1. Open `Annie - AI Business Assessment Chat`.
2. Open the flow/canvas builder for the agent.
3. Use nodes, edges, transition conditions, and components rather than one large prompt.

Retell flow concepts:

- **Global settings:** agent-wide prompt and behaviour.
- **Node:** one step in the flow.
- **Edge:** connection between nodes.
- **Transition condition:** Prompt or Equation rule that decides which edge is followed.
- **Component:** reusable group of nodes.
- **Conversation node:** dialogue only.
- **Subagent node:** dialogue with tool/function calling.
- **Function node:** deterministic API call.
- **Logic node:** branching.
- **End node:** final step.

## Step 3: Configure Global Settings

In **Global Settings** or the agent-wide prompt/personality area, add only rules that apply everywhere.

```text
You are Annie, the AI Business Assessment intake assistant for Agentic AI.

Your job is discovery only. Do not recommend specific tools, automations, agents, software, or solutions during intake. The assessment report will provide recommendations later.

Ask one question at a time. Adapt questions to the user's industry and previous answers.

Do not provide legal, financial, tax, medical, compliance, or professional advice.

Do not ask for passwords, API keys, card numbers, bank details, regulated records, confidential customer files, or unnecessary sensitive personal information.

If the user tries to share sensitive information, interrupt politely and ask them to describe the workflow without sharing private details.
```

Keep pricing, approval, contact capture, intake questions, summary, and payment instructions inside their specific nodes below.

## Step 4: Create the Flow Nodes

Create these nodes on the canvas:

| Node | Type | Purpose |
| --- | --- | --- |
| `Opening / Approval` | Conversation | Disclose price, terms, privacy, and ask for approval |
| `Approval Split` | Logic Split | Route approved users to contact capture and non-approved users to exit |
| `Not Ready` | End or Conversation + End | Exit if user does not approve |
| `Contact Details` | Conversation | Collect owner name, role, company, email, phone |
| `Contact Complete Split` | Logic Split | Confirm required contact fields exist before intake starts |
| `Business Context` | Conversation | Understand business, customers, team, lead sources |
| `Pain Point Discovery` | Conversation | Capture biggest headache and recent example |
| `Tools and Systems` | Conversation | Capture software stack and disconnected tools |
| `Repeated Work` | Conversation | Capture repeated tasks, handoffs, FAQs, manual reports |
| `Priorities and Constraints` | Conversation | Capture priority outcome, approvals, privacy/compliance constraints |
| `Intake Summary` | Conversation | Summarise intake and ask user to confirm |
| `Create Payment Link` | Function or Subagent | Call Stripe Checkout endpoint |
| `Payment Result Split` | Logic Split | Route successful Stripe links to the payment message and failures to fallback |
| `Payment Link Message` | Conversation | Send payment link and explain next step |
| `Payment Link Failed` | Conversation + End | Fallback if function fails |
| `End / Next Steps` | End | End chat cleanly |

## Step 5: Configure `Opening / Approval`

Use a **Conversation node**.

Static sentence or node prompt:

```text
Hi there, I'm Annie from Agentic AI. Thanks for hopping on. This is a quick chat to learn about your business and what your day-to-day looks like so I can spot the best places AI can give you time back.

Before we start, the AI Business Assessment costs $1,200.00 AUD. The process is simple: I ask a structured set of questions, payment is collected securely through Stripe, and then your transcript is sent for analysis.

The report includes your workflow pain points, quick wins, effort versus impact, specific recommendations, estimated value, and possible implementation paths.

Do you approve proceeding with the $1,200.00 AUD assessment under Agentic AI's terms of service and privacy policy?
```

Transition edges:

| Destination | Type | Condition |
| --- | --- | --- |
| `Approval Split` | Prompt | User has answered the approval question |

Do not enable **Skip Response** here. Annie must wait for the user's approval.

### Step 5A: Configure `Approval Split`

Use a **Logic Split node**.

Before this split works reliably, the `Opening / Approval` node should store:

| Stored field variable | Type | Value |
| --- | --- | --- |
| `approval_given` | Boolean | `true` when the user clearly approves the $1,200.00 AUD fee, terms, and privacy policy |

Configure the approved path:

```text
Condition mode: ALL

{{approval_given}} = true
```

Approved path destination:

```text
Contact Details
```

Configure the Logic Split else destination:

```text
Else destination: Not Ready
```

Retell Logic Split nodes always need an else destination so the chat does not get stuck if the approved condition is not met.

## Step 6: Configure `Not Ready`

Use an **End node**, or a Conversation node followed by an End node.

Message:

```text
No problem. I cannot start the paid assessment intake without approval of the assessment fee, terms, privacy policy, and disclaimer. You can review the details at agenticai.net.au or contact hello@agenticai.net.au.
```

## Step 7: Configure `Contact Details`

Use a **Conversation node**.

Instruction:

```text
Collect these required fields before moving on:
- customer_name
- customer_role
- company
- customer_email
- customer_phone

Ask one question at a time:
1. What is your name and role in the business?
2. What is the company or business name?
3. What is the best email address for assessment updates and the report?
4. What is the best phone number to contact you if the assessment team needs to clarify anything?

Confirm the contact details back to the user.
```

Transition edge:

| Destination | Type | Condition |
| --- | --- | --- |
| `Contact Complete Split` | Prompt | User has provided contact details |

Use **Prompt** because the transition depends on whether the user has provided all required contact fields.

### Step 7A: Configure `Contact Complete Split`

Use a **Logic Split node**.

This split checks whether the required chat contact fields exist before Annie starts the assessment questions.

Configure the complete path:

```text
Condition mode: ALL

{{customer_name}} exists
{{company}} exists
{{customer_email}} exists
{{customer_phone}} exists
```

Complete path destination:

```text
Business Context
```

Configure the Logic Split else destination:

```text
Else destination: Contact Details
```

Retell treats `exists` as "variable is defined". Only store these fields after Annie has collected real values.

## Step 8: Configure `Business Context`

Use a **Conversation node**.

Instruction:

```text
Collect business context. Ask one question at a time.

Ask:
- What does the business do, and who do you mainly serve?
- Roughly how many people are on the team?
- Where do new enquiries or customers usually come from?
- What is a typical customer, project, booking, case, or sale worth?

Capture industry, business model, customer type, team size, lead source, and approximate customer value.
```

Transition edge:

| Destination | Type | Condition |
| --- | --- | --- |
| `Pain Point Discovery` | Prompt | Business type, customer type, team size, and lead source are known |

Use **Prompt** because the transition depends on information gathered from the user's answers.

## Step 9: Configure `Pain Point Discovery`

Use a **Conversation node**.

Instruction:

```text
Identify the main workflow pain.

Ask:
- What is the biggest headache in your workday right now?
- Can you walk me through the last time that happened?
- How often does it happen?
- Who is involved?
- What does it cost in time, missed revenue, customer experience, or team frustration?
```

Transition edge:

| Destination | Type | Condition |
| --- | --- | --- |
| `Tools and Systems` | Prompt | At least one concrete pain point and recent example are captured |

Use **Prompt** because Annie must judge whether the pain point is specific enough.

## Step 10: Configure `Tools and Systems`

Use a **Conversation node**.

Instruction:

```text
Collect the software stack and disconnected systems.

Ask:
- What software tools do you currently use to run the business?
- Where does important business information live today?
- Which tools do not talk to each other?
- Where does the team copy information from one system into another?

Capture CRM, booking/job/project/matter system, accounting tools, communication tools, document storage, reporting tools, and spreadsheets.
```

Transition edge:

| Destination | Type | Condition |
| --- | --- | --- |
| `Repeated Work` | Prompt | Main tools and disconnected systems are known |

Use **Prompt** because the transition depends on the content of the user's tool/system answers.

## Step 11: Configure `Repeated Work`

Use a **Conversation node**.

Instruction:

```text
Find repeated work and quick-win candidates.

Ask:
- What tasks are repeated every day or every week?
- What questions do customers, staff, suppliers, or partners ask repeatedly?
- What reports or updates are created manually?
- Where does work get stuck waiting for a person, approval, or missing information?

Capture repeated tasks, handoffs, FAQs, manual reports, onboarding steps, follow-ups, approvals, and owner-dependent decisions.
```

Transition edge:

| Destination | Type | Condition |
| --- | --- | --- |
| `Priorities and Constraints` | Prompt | Repeated work, handoffs, or knowledge gaps are captured |

Use **Prompt** because Annie must confirm there is enough repeated-work context.

## Step 12: Configure `Priorities and Constraints`

Use a **Conversation node**.

Instruction:

```text
Collect priority and implementation constraints.

Ask:
- If we found three good opportunities, would you prioritise saving owner time, improving customer response, reducing admin cost, increasing sales, or improving team consistency?
- Are there privacy, compliance, customer data, or brand tone concerns we should know about?
- Who would approve a new tool or workflow change?
- If the report finds a clear quick win, how soon would you want to act on it?
```

Transition edge:

| Destination | Type | Condition |
| --- | --- | --- |
| `Intake Summary` | Prompt | Priority outcome and constraints are captured |

Use **Prompt** because the transition depends on whether the user has answered the priority and constraint questions.

## Step 13: Configure `Intake Summary`

Use a **Conversation node**.

Instruction:

```text
Summarise the intake and ask the user to confirm it is accurate.

Include:
- business owner name
- company
- industry
- top pain points
- current tools
- repeated work
- lead/customer response issues
- knowledge gaps
- reporting gaps
- priority outcome

Use this style:
"Let me summarise what I heard. [Company] is a [business type] serving [customer type]. The strongest opportunities appear to be [pain point 1], [pain point 2], and [pain point 3]. Your current tools include [tools]. Your priority is [priority]. Is that accurate?"
```

Transition edges:

| Destination | Type | Condition |
| --- | --- | --- |
| `Create Payment Link` | Prompt | User confirms the summary is accurate |
| `Intake Summary` | Prompt | User corrects details or indicates the summary is incomplete; update and confirm again |

Use **Prompt** because Annie must interpret whether the user confirmed or corrected the summary.

## Step 14A: Create Custom Function

Create the Stripe payment custom function first, before adding it to the chat workflow.

Fill out the custom function form like this:

| Retell field | Value |
| --- | --- |
| Name | `create_assessment_payment_link` |
| Description | `Creates a secure Stripe Checkout payment link for the $1,200.00 AUD Agentic AI Business Assessment after the chat intake is complete and approved.` |
| API Endpoint | `POST https://agenticai.net.au/api/create-assessment-checkout` |
| Timeout | `30` seconds |
| Payload args only | On, if the toggle is available |

Headers:

| Key | Value |
| --- | --- |
| `Content-Type` | `application/json` |
| `Authorization` | Leave blank unless the website endpoint is later protected with an API key |

Query Parameters:

| Key | Value |
| --- | --- |
| None | Leave blank |

Parameters:

Paste this JSON Schema into the function **Parameters** field. Use `const` for values Retell should pass directly, including captured dynamic variables. Use `description` for values the LLM should generate, such as the transcript preview.

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

Stored fields as variables:

Add these key/value pairs if the Retell form shows a **Stored fields as variables** section. These map the custom function parameters to the chat variables captured earlier in the flow.

| Key | Value |
| --- | --- |
| `source` | `retell-chat-agent` |
| `customerName` | `{{customer_name}}` |
| `customerEmail` | `{{customer_email}}` |
| `customerPhone` | `{{customer_phone}}` |
| `company` | `{{company}}` |
| `transcriptPreview` | Short summary of the chat intake, including business context, pain points, systems, repeated work, and priorities |

With **Payload: args only** enabled, Retell sends those fields as the top-level JSON body. With it disabled, Retell wraps them under `args`. The website endpoint accepts both.

The website responds with:

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

If your Retell chat function form shows a **Response Variables** area, add this optional extraction:

```text
Variable name: url
JSON path: $.url
```

If the chat function form does not show **Response Variables**, leave it blank. Do not create another stored field variable for the Stripe URL. In the next chat message node, instruct Annie to use the checkout URL from the function result. Retell includes the custom function response in the tool/function result context, so Annie can read the returned `url` directly.

Test the function before connecting it to the live flow.

## Step 14B: Add Subagent Node to Workflow

Add a **Subagent node** after `Intake Summary`.

Name the node:

```text
Create Payment Link
```

In the subagent instructions, define the steps and tasks this subagent should follow. Type `{{` in Retell to insert dynamic variables.

```text
Create a Stripe Checkout payment link for the completed Agentic AI Business Assessment chat intake.

Use the stored chat fields:
- customer_name: {{customer_name}}
- customer_email: {{customer_email}}
- customer_phone: {{customer_phone}}
- company: {{company}}

Before calling the function, create a short transcriptPreview summarising:
- business context
- top pain points
- current systems
- repeated work
- priority outcome

Call the `create_assessment_payment_link` function once.

Do not ask the customer another question.
Do not invent a payment URL.
Return the checkout URL from the function result.
```

Add this function to the subagent node:

```text
create_assessment_payment_link
```

Configure the function action options:

| Setting | Value |
| --- | --- |
| Talk while waiting | Off |
| Play typing sound | On |
| Talk after Action completed | Off |

Transition edges:

| Destination | Type | Condition |
| --- | --- | --- |
| `Payment Result Split` | Outgoing edge | Function result is ready |

Turn **Talk while waiting** off so Annie does not send filler text while Stripe creates the checkout URL. Keep **Play typing sound** on if you want the user to see that Annie is working. Turn **Talk after Action completed** off because the next node, `Payment Link Message`, sends the payment instructions and link.

Connect the subagent node's outgoing edge to `Payment Result Split`. The Logic Split handles the success or failure decision.

Transition configuration:

| Transition | Type | Configure |
| --- | --- | --- |
| `Create Payment Link` -> `Payment Result Split` | Skip Response setting, if available | Enable Skip Response because the function result should route immediately to the split |

Do not use a **Prompt** transition here. This route depends on structured function output, not the customer's wording.

If Retell asks for a transition condition instead of a Skip Response setting, use an **Equation** condition:

```text
{{create_assessment_payment_link}} exists
```

If Retell does not expose that exact variable, test the function and use the function result variable Retell displays.

## Step 14C: Configure `Payment Result Split`

Use a **Logic Split node**.

This split checks whether the Stripe function returned a usable Checkout URL.

Configure the success transition to `Payment Link Message` like this:

```text
Condition mode: ALL

{{url}} exists
{{url}} CONTAINS "checkout.stripe.com"
```

If Retell does not expose `{{url}}`, test the function and use the function result variable Retell shows. It may look similar to:

```text
{{create_assessment_payment_link.url}}
```

In that case configure:

```text
Condition mode: ALL

{{create_assessment_payment_link.url}} exists
{{create_assessment_payment_link.url}} CONTAINS "checkout.stripe.com"
```

Configure the Logic Split else destination:

```text
Else destination: Payment Link Failed
```

Do not add a separate failure equation unless Retell requires it. Logic Split nodes have an else destination, and Retell's docs recommend using it so the flow cannot get stuck.

## Step 15: Configure `Payment Link Message`

Use a **Conversation node** in the chat flow.

Set this as a **Prompt**, not a static sentence. Annie needs the prompt so she can include the Stripe checkout URL returned by the previous subagent node.

```text
Send this message to the customer:

Thanks. The assessment intake is complete. The next step is secure payment through Stripe for the $1,200.00 AUD assessment fee. Once payment is confirmed, your transcript will be sent for analysis and the report will be prepared.

Then include the secure Stripe checkout URL returned by the `create_assessment_payment_link` function in this chat.

Do not ask another question.
```

Transition edge:

| Destination | Type | Condition |
| --- | --- | --- |
| `End / Next Steps` | Skip Response setting | Payment link message is sent |

Enable **Skip Response** here because Annie does not need another user response before ending this branch.

## Step 16: Configure `Payment Link Failed`

Use a **Conversation node** followed by an **End node**.

Message:

```text
I am having trouble creating the payment link automatically. Please email hello@agenticai.net.au with your name, company, phone number, and email address so the team can help.
```

## Step 17: Add Industry Knowledge

1. Open the knowledge/context area for the agent or relevant nodes.
2. Add the contents of:

```text
docs/question-knowledgebase.md
```

3. Add this instruction:

```text
Use industry-specific questions only when they match the user's business. Ask only the most relevant questions. Do not ask every question in the knowledgebase.
```

## Step 18: Use Components If Available

If using Retell Components, create these components:

| Component | Contains |
| --- | --- |
| `Approval` | `Opening / Approval`, `Approval Split`, `Not Ready` |
| `Contact Capture` | `Contact Details`, `Contact Complete Split` |
| `Assessment Intake` | `Business Context`, `Pain Point Discovery`, `Tools and Systems`, `Repeated Work`, `Priorities and Constraints` |
| `Summary and Payment` | `Intake Summary`, `Create Payment Link`, `Payment Result Split`, `Payment Link Message`, `Payment Link Failed` |

Recommended Logic Split setup:

| Logic Split | Use when | Success route | Fallback route |
| --- | --- | --- | --- |
| `Approval Split` | After the user answers the approval question | `{{approval_given}} = true` -> `Contact Details` | `Not Ready` |
| `Contact Complete Split` | After contact details are collected | ALL required contact fields exist -> `Business Context` | `Contact Details` |
| `Payment Result Split` | After the Stripe function runs | Stripe URL exists and `CONTAINS "checkout.stripe.com"` -> `Payment Link Message` | `Payment Link Failed` |

If a Logic Split sits inside a component, route the successful path to **Exit Component** when the next node is outside that component. For example, inside the `Approval` component, `{{approval_given}} = true` should exit the component, then the main canvas should connect to `Contact Capture`.

If the fallback node is inside the same component, connect to it directly. For example, inside the `Approval` component, the fallback should connect directly to `Not Ready`.

For each component:

1. Connect **Begin** to the first internal node.
2. Connect internal nodes with edges.
3. Connect the final internal node to **Exit Component**.
4. On the main canvas, connect the component's outgoing edge to the next component.
5. Test from the main agent canvas.

## Step 19: Configure Global Post Chat Data Retrieval

Open the chat agent's **Global** settings, then open **Post Chat Data Retrieval**.

Add these fields there. These are after-chat extraction fields for reporting, transcript processing, CRM handoff, and audit records.

Do not use these fields for live routing inside the chat. Live routing uses stored field variables collected during the conversation, such as `approval_given`, `customer_name`, `customer_email`, `customer_phone`, and `company`.

| Field | Type | Description |
| --- | --- | --- |
| `approval_given` | Boolean | Whether the user approved the $1,200.00 AUD fee, terms, and privacy policy before intake |
| `payment_link_sent` | Boolean | Whether Annie successfully sent the Stripe Checkout link in the chat |
| `payment_status` | Text | Latest known payment state, such as `pending`, `paid`, `cancelled`, or `unknown` |
| `customer_name` | Text | Business owner's full name |
| `customer_role` | Text | Business owner's role or title in the company |
| `customer_email` | Text | Email address for assessment updates and report delivery |
| `customer_phone` | Text | Phone number for clarification if the assessment team needs follow-up |
| `company` | Text | Company or business name |
| `industry` | Text | Industry or business category identified during intake |
| `team_size` | Text | Approximate number of people in the business or team |
| `current_tools` | Text | Main software, systems, spreadsheets, and communication tools currently used |
| `top_pain_points` | Text | The most important workflow problems, bottlenecks, or admin pain points |
| `repeated_tasks` | Text | Recurring daily or weekly tasks, handoffs, FAQs, reports, or follow-ups |
| `lead_response_gap` | Boolean | Whether the business has delayed, missed, or inconsistent enquiry/customer response |
| `knowledge_gap` | Boolean | Whether important knowledge is trapped with the owner, staff, documents, or disconnected systems |
| `manual_reporting_gap` | Boolean | Whether reports, updates, or dashboards are manually created or copied between systems |
| `priority_outcome` | Text | The user's main desired outcome, such as saving owner time, improving response, or reducing admin |
| `privacy_or_compliance_constraints` | Text | Any privacy, customer data, compliance, or brand tone constraints mentioned |
| `assessment_ready` | Boolean | Whether the chat has enough confirmed information and payment-link handoff to process the assessment |

Use Retell's post-chat analysis output, such as `chat_analyzed`, for transcript/report processing after the chat ends.

## Step 20: Confirm Website Widget Code

The website embeds Retell here:

```text
src/lib/components/RetellChatWidget.svelte
```

It loads:

```text
https://dashboard.retellai.com/retell-widget.js
```

It is mounted in:

```text
src/routes/+layout.svelte
```

## Step 21: Add Website Environment Variables

Set these in the website host:

```sh
PUBLIC_RETELL_PUBLIC_KEY=key_xxxxxxxxxxxxxxxxxxxxx
PUBLIC_RETELL_CHAT_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxx
PUBLIC_RETELL_CHAT_AGENT_VERSION=0
PUBLIC_RETELL_RECAPTCHA_KEY=optional_recaptcha_v3_site_key
```

Set these for Stripe:

```sh
STRIPE_SECRET_KEY=sk_live_or_test_key
PUBLIC_SITE_URL=https://agenticai.net.au
```

If `PUBLIC_RETELL_PUBLIC_KEY` or `PUBLIC_RETELL_CHAT_AGENT_ID` is missing, the widget will not load.

## Step 22: Confirm Widget Appearance

The website sets:

- Title: `Chat with Annie`
- Bot name: `Annie`
- Colour: `#0891b2`
- Popup message: `Ask Annie about the AI Business Assessment`
- Auto open: `false`
- Popup delay: `5` seconds

Dynamic variables sent to Retell:

```json
{
  "source": "agenticai-website",
  "assessment_fee": "$1,200.00 AUD",
  "terms_url": "/terms",
  "privacy_url": "/privacy"
}
```

## Step 23: Confirm Stripe Return URLs

The website Stripe endpoint uses:

Success:

```text
/assessment/success?session_id={CHECKOUT_SESSION_ID}
```

Cancel:

```text
/?assessment=cancelled
```

Transcript processing must wait for payment confirmation.

## Step 24: Configure Transcript Handoff

Choose one method.

### Option A: Retell Webhook

1. Configure Retell webhook events:
   - `chat_started`
   - `chat_ended`
   - `chat_analyzed`
2. Use `chat_analyzed` for report processing.
3. Verify payment status.
4. Queue the transcript for report creation.

### Option B: Retell Chat Details API

1. Store the Retell chat ID.
2. After payment, retrieve chat details from Retell.
3. Queue the transcript for report creation.

### Option C: CRM/Zapier/Make

1. Trigger automation from Retell or Stripe.
2. Match the customer by email, phone, company, or Stripe metadata.
3. Queue the transcript for report creation.

Minimum payload:

```json
{
  "source": "retell-chat-agent",
  "paymentStatus": "paid",
  "customerName": "{{customer_name}}",
  "customerRole": "{{customer_role}}",
  "customerEmail": "{{customer_email}}",
  "customerPhone": "{{customer_phone}}",
  "company": "{{company}}",
  "transcript": "{{transcript}}",
  "analysis": "{{post_chat_analysis}}"
}
```

## Step 25: Test the Flow

Test these scenarios in Retell:

1. User asks what the assessment costs.
2. User approves the fee and terms.
3. User refuses approval.
4. User skips email or phone.
5. User gives vague pain points.
6. User asks for legal, financial, tax, medical, or compliance advice.
7. User tries to share sensitive information.
8. User completes intake and receives a Stripe link.
9. Stripe function fails.
10. User asks whether results are guaranteed.
11. User asks for tool recommendations during intake.

## Step 26: Acceptance Criteria

The agent is ready when:

- Price is disclosed before intake.
- Approval is required before intake.
- Name, role, company, email, and phone are collected.
- Nodes transition only when required data is captured.
- Annie asks one question at a time.
- Annie adapts to industry.
- Annie refuses sensitive information safely.
- Annie avoids tool recommendations during intake.
- Annie creates a Stripe payment link.
- Transcript processing waits for payment.

## Step 27: Publish

1. Publish or activate the Retell chat agent.
2. Copy the Retell public key.
3. Copy the Retell chat agent ID.
4. Add env vars to the website host.
5. Redeploy the website.
6. Open the live website.
7. Confirm the Retell widget appears.
8. Run a test chat.
9. Confirm Stripe link creation.
10. Confirm transcript recovery for report processing.

## Retell Documentation References

- Create Chat Agent: https://docs.retellai.com/build/create-chat-agent
- Conversation Flow Overview: https://docs.retellai.com/build/conversation-flow/overview
- Nodes: https://docs.retellai.com/build/conversation-flow/node
- Conversation Nodes: https://docs.retellai.com/build/conversation-flow/conversation-node
- Function Nodes: https://docs.retellai.com/build/conversation-flow/function-node
- Logic Split Nodes: https://docs.retellai.com/build/conversation-flow/logic-split-node
- Transition Conditions: https://docs.retellai.com/build/conversation-flow/transition-condition
- Components: https://docs.retellai.com/build/conversation-flow/components
- Create Chat Completion: https://docs.retellai.com/deploy/create-chat-completion
- Retell Website Widget: https://docs.retellai.com/deploy/chat-widget
- Custom Functions: https://docs.retellai.com/build/conversation-flow/custom-function
- Webhooks: https://docs.retellai.com/features/webhook-overview
