---
title: Question Knowledgebase
type: reference
updated: 2026-05-02
sources:
  - "docs/question-knowledgebase.md"
see_also:
  - "../agents/annie-chat-agent.md"
  - "../agents/annie-voice-agent.md"
---

# Question Knowledgebase

The question knowledgebase supports the AI Business Assessment intake agent (Annie). It provides structured discovery questions organised by business function and industry, plus scoring hints for report analysis.

## Selection Rules

- Ask all critical general discovery questions unless already answered
- Select industry questions only after business type is clear
- Ask no more than 20–30 minutes of questions in one intake call
- Prioritise workflows with clear frequency, owner involvement, customer impact, or revenue impact
- Ask for examples when callers use vague phrases like "admin", "follow-up", "manual", "messy", "spreadsheet", or "chasing"
- Do not prescribe tools during intake — capture the need and context

## General Discovery Questions

### Business Model
- Name, role, company, email, phone
- What the business sells and who the best customers are
- How the business makes money
- Average value of a new customer/project/booking/sale
- Business model: one-off, recurring, retainers, projects, memberships, appointments
- Busiest periods

### Team and Roles
- Day-to-day team size
- Roles on the team
- Tasks handled by owner vs. admin/sales/operations/finance/contractors
- Single points of failure (one person's knowledge)

### Tools and Data
- Daily software tools
- CRM, booking/job/project system, accounting, communication, document storage
- Tools that don't talk to each other
- Spreadsheets used as source of truth

### Pain Points
- Biggest headache right now
- Tasks that feel automatable
- Team complaints
- Recurring customer issues
- Delayed important work
- Overly complex workflows
- Processes with most rework
- Hardest parts to scale

### Lead and Customer Response
- Lead sources
- Follow-up process and speed
- Lead qualification
- Missed or delayed leads
- Value of one additional qualified lead per month

### Operations and Admin
- Manual reports, emails, documents, quotes, updates
- Information copied between systems
- Weekly checklists and recurring processes
- Tasks requiring email/file/message searching
- Approval bottlenecks
- Handoff delays
- Work outside main software

### Knowledge and Training
- SOP documentation location
- New staff onboarding process
- Repeated team questions
- Repeated customer questions
- Knowledge trapped in owner's head
- Documents useful for AI assistant
- Frequency of procedure/pricing/policy changes

### Reporting and Decisions
- Regularly viewed numbers
- Number collection process
- Report preparation time
- Decisions from incomplete information
- Valuable automatic dashboard/report
- Late problem discovery

### Constraints
- Sensitive data or compliance rules
- Systems that cannot be changed
- Realistic implementation budget
- Software/workflow approver
- Timeline for first quick win

## Industry Modules

| Industry | Businesses | Key Questions |
|----------|-----------|---------------|
| Professional Services | Consultants, agencies, accountants, lawyers | Client intake, proposals, onboarding, document collection, status updates, reusable knowledge |
| Real Estate and Property | Agents, property managers, brokers, conveyancers | Enquiry follow-up, inspections, listings, documents, owner reporting |
| Healthcare and Wellness | Clinics, dental, allied health, NDIS, fitness | Bookings, reminders, no-shows, admin before/after appointments, compliance |
| Trades and Field Services | Electricians, plumbers, builders, maintenance | Job triage, quoting, scheduling, dispatch, photos, completion, invoicing |
| Retail and Ecommerce | Online stores, marketplaces, boutiques, wholesalers | Channels, fulfilment, inventory, supplier follow-up, ads reporting, listings |
| Hospitality and Events | Restaurants, cafes, hotels, venues, caterers | Bookings, quotes, packages, run sheets, staff rosters, marketing reports |
| Education and Training | Schools, RTOs, tutoring, course creators | Enrolment, schedules, feedback, assessments, content creation, compliance |
| Financial Services | Brokers, planners, insurance, lenders | Enquiries, quotes, applications, compliance notes, reminders, reports |
| Legal and Compliance | Law firms, migration agents, safety consultants | Matter intake, documents, templates, deadlines, file notes, privacy obligations |
| Manufacturing and Logistics | Manufacturers, distributors, warehouses, importers | Orders, stock, backorders, quotes, invoices, forecasting, approvals |
| Nonprofits and Community | Charities, associations, clubs, foundations | Donor/member/volunteer contact, events, grants, impact reports, rosters |

## Scoring Hints

### Strong Quick-Win Signals
- Repeated weekly task with clear steps
- High-volume customer or staff questions
- Manual reporting from known systems
- Lead response delay with known customer value
- Copying data between common software tools
- Existing documents suitable for knowledge assistant
- Owner spends time on low-judgement admin

### Caution Signals
- Workflow not understood clearly
- Process broken and needs redesign before automation
- Sensitive or regulated data
- Outdated or inaccessible tools
- Low team adoption likelihood
- Owner wants complex custom build before proving quick win
- Value cannot be quantified

### Impact Categories
- Owner time saved
- Staff admin reduced
- Faster customer response
- More leads converted
- Fewer errors or missed steps
- Better reporting visibility
- Better staff consistency and training

### Implementation Categories
- Process optimisation
- Zapier or Make automation
- CRM or booking workflow improvement
- Reporting dashboard
- Custom GPT or knowledge assistant
- Voice or chat intake agent
- Speed-to-lead response agent
- Document or email drafting workflow
