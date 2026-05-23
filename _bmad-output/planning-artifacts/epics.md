# Agentic AI Advisory Assessment — Epics & Stories

Generated: 2026-05-21
Total stories: 31
FR range: FR1–FR29 | NFR range: NFR1–NFR20 | UX-DR range: UX-DR1–UX-DR40

## Epic 0: Sprint 0: Platform Foundation & Shared Contracts + Gate Module

- **Status:** done
- **FR Coverage:** FR17

### Story 0.1: Pipeline Worker Re-architecture

**ID:** 0-1

**User Story:**
As a platform engineer, I want the pipeline execution to run inside the Queue Consumer worker so that assessments can process without Cloudflare Pages Functions 30-second CPU timeout.

**Acceptance Criteria:**
- Queue consumer dispatches messages to independent stage handlers by `stage` field
- `workers/stages/` directory contains stage handler files, each a callable function
- Existing Cloudflare Pages Functions routes are untouched
- Pipeline runs in Workers context with 15-minute CPU timeout
- NFR17: webhooks are non-blocking (fire-and-forget via outgoing worker fetch)
- Backward-compatible default stage 'run-pipeline' for existing messages without stage field
- `workers/wrangler.toml` uses `nodejs_compat_v2` and pinned compatibility_date
- Queue bindings in both wrangler.toml files refer to the same `assessment-jobs` queue

**FR References:** FR17

**NFR References:** NFR17

**UX-DR References:** (none)

**Dependencies:** (none)

### Story 0.2: Shared Schema Contracts & Assessment Data Model

**ID:** 0-2

**User Story:**
As a platform engineer, I want shared type contracts and data model definitions so that all pipeline stages and gates agree on the shape of assessment data.

**Acceptance Criteria:**
- `AssessmentBriefing`, `AssessmentOrder`, `PipelineStage`, `GateVerdict` types are defined in `src/lib/server/assessment/types.ts`
- Async state contract defines states: queued, generating, delayed, ready, failed, human_assist with user-facing titles and descriptions
- Empty/edge state contract defines pre-built states for: no assessment, no intake, no briefing, incomplete intake, stale briefing, partial generation
- Migration numbering convention documented: 0001–0009 Epic 1, 0010–0019 Epic 2a, 0020–0029 Epic 2b, 0030–0039 Epic 3, 0040+ future
- D1 table schema agreement documented (UX-DR30–33): assessment_orders, assessment_results, assessment_payments, assessment_gates tables
- schema-contract.md created at src/lib/server/assessment/schema-contract.md

**FR References:** FR17, FR11

**NFR References:** (none)

**UX-DR References:** UX-DR30, UX-DR31, UX-DR33

**Dependencies:** 0-1

### Story 0.3: GPT-5.5 Gate Module Infrastructure

**ID:** 0-3

**User Story:**
As a platform engineer, I want a gate evaluation module with GPT-5.5 so that assessment output quality can be validated before delivery.

**Acceptance Criteria:**
- `JudgeGateProvider` interface defined with `evaluate()` method accepting system prompt, content, and options
- `OpenAiGpt55JudgeProvider` implemented using direct `fetch()` to OpenAI Chat Completions API (no SDK dependency)
- Three gate definitions exist: quick-wins-verification, major-project-verification, report-review
- Each gate definition has: system prompt, output schema, reasoning.effort level, feature flag env var, kill-switch env var
- `applyGatePolicy()` function deterministically maps (verdict, confidence, retryCount) → GateAction (approve/retry/block/escalate)
- Migration 0013 creates `assessment_gates` table
- Gate runner orchestrates: evaluate → policy → D1 persist
- D1 gate store supports: insert, getByAssessment, getByType, getRecent, getStats
- Feature flags + kill switch env vars control each gate independently
- `pipeline.ts` decomposed into stage-callable functions with gate checkpoint hooks

**FR References:** FR17

**NFR References:** (none)

**UX-DR References:** (none)

**Dependencies:** 0-1, 0-2

## Epic e: Epic 1: Public Offer & Intake Flow

- **Status:** active
- **FR Coverage:** FR1–FR6, FR9, FR13, FR16, FR28

### Story e.1: Design Token Foundation & Component Primitives

**ID:** 1-1

**User Story:**
As a frontend developer, I want shadcn-svelte design tokens and component primitives so that I can build consistent UI elements across the application.

**Acceptance Criteria:**
- shadcn-svelte design tokens defined in CSS custom properties (colors, typography, spacing, shadows, border-radius)
- Core primitives installed and configured: Button, Card, Input, Form, Dialog, Sheet, Badge, Progress
- Dark mode toggle respects prefers-color-scheme and user override with localStorage persistence
- Theme switcher accessible from any page via a floating or header toggle
- Typography scale applied globally (h1–h6, body, small, caption) with responsive sizing
- Design system documented in a local style guide or Storybook-style reference file
- UX-DR6: premium moments design pattern documented for upsell/cross-sell (shadow, animation, badge)
- Components are SSR-compatible

**FR References:** FR1

**NFR References:** NFR1, NFR2, NFR3, NFR11, NFR15

**UX-DR References:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10, UX-DR11, UX-DR12, UX-DR34, UX-DR35, UX-DR37, UX-DR38

**Dependencies:** (none)

### Story e.2: Public Landing Page, Offer & Trust / Start Path

**ID:** 1-2

**User Story:**
As a potential customer, I want a clear landing page explaining the assessment offer with testimonials so that I can decide to start my free AI assessment.

**Acceptance Criteria:**
- Landing page displays: hero section with value proposition, assessment offer description (free, 15 min via Annie AI chat), social proof / testimonials, FAQ accordion, prominent CTA buttons
- CTA buttons trigger start assessment flow: scroll to start section → Annie chat widget opens
- No authentication required to start assessment
- Offer page renders with proper card layout and trust signals
- Mobile responsive: all sections collapse gracefully on small screens
- UX-DR5: testimonials section rendered on landing page
- UX-DR13/14/15: page uses trust signals, simple pricing (free), and FAQ section

**FR References:** FR1, FR2

**NFR References:** NFR1, NFR2, NFR3, NFR11, NFR15

**UX-DR References:** UX-DR5, UX-DR13, UX-DR14, UX-DR15, UX-DR18

**Dependencies:** 1-1

### Story e.3: Orientation Panel & Annie Intake Disclosure

**ID:** 1-3

**User Story:**
As a potential customer starting the assessment, I want an orientation panel explaining what Annie will ask so that I understand the scope before providing business context.

**Acceptance Criteria:**
- Orientation panel opens after CTA click: title, purpose (free AI advisory assessment), privacy notice, and scope disclaimer
- Scope disclaimer clarifies: not professional advice, AI-generated assessment for informational purposes only
- Privacy notice links to privacy policy (external or modal)
- Once dismissed/acknowledged, Annie chat interface activates and begins intake
- NFR12/13/14: privacy notice clearly displayed, assessment is informational not professional advice, opt-out mechanism available
- User can exit the intake at any point via X button or back navigation

**FR References:** FR3, FR16

**NFR References:** NFR12, NFR13, NFR14, NFR16

**UX-DR References:** UX-DR16, UX-DR17, UX-DR18

**Dependencies:** 1-2

### Story e.4: Guided Annie Intake — Business Context Capture & Probing

**ID:** 1-4

**User Story:**
As a business owner, I want Annie to guide me through structured questions about my business so that the assessment captures meaningful context.

**Acceptance Criteria:**
- Annie conversation UI renders with chat bubbles, typing indicators, and smooth animations
- Structured intake script covering: business overview, current tooling/tech stack, pain points, AI readiness, budget range, timeline
- Annie uses probing follow-up questions based on user responses
- Conversation state persisted to D1 on each user message (partial progress save)
- NFR6, NFR10: intake messages process within 3 seconds, 99.5% uptime for intake flow
- Chat overflow scrolls naturally within fixed-height container

**FR References:** FR3, FR4, FR5, FR6

**NFR References:** NFR6, NFR10, NFR16

**UX-DR References:** UX-DR16, UX-DR17, UX-DR18, UX-DR19, UX-DR20, UX-DR21, UX-DR22, UX-DR23, UX-DR24, UX-DR25, UX-DR26, UX-DR27, UX-DR32

**Dependencies:** 1-3

### Story e.5: Business Summary Review & Confirmation

**ID:** 1-5

**User Story:**
As a business owner, I want to review a structured summary of what I told Annie so that I can confirm or correct it before submitting.

**Acceptance Criteria:**
- After intake completes, Annie presents a structured summary of key points: company profile, problems, tools, goals
- User can edit specific sections inline or re-trigger Annie to revisit a topic
- User explicitly confirms the summary → assessment is queued for processing
- Confirmation triggers payment flow (if applicable) or direct queuing for free tier
- UX-DR36: confirmation step prevents accidental submission
- After confirmation, user sees assessment queued state with estimated completion time

**FR References:** FR5

**NFR References:** NFR10, NFR16

**UX-DR References:** UX-DR28, UX-DR36

**Dependencies:** 1-4

### Story e.6: Intake Interruption, Recovery & Session Resume

**ID:** 1-6

**User Story:**
As a busy business owner, I want to take a break during intake and resume later so that I can complete the assessment at my own pace.

**Acceptance Criteria:**
- If user closes the browser or navigates away during intake, session state is saved to D1
- Returning user with an incomplete intake sees a resume prompt with last answered question context
- Resume flow restores Annie conversation to the point of interruption
- Session timeout (24h) after which incomplete intake expires and requires restart
- Clean error message on session expiry (not a broken page or blank state)

**FR References:** FR3, FR13

**NFR References:** NFR10, NFR16

**UX-DR References:** UX-DR32

**Dependencies:** 1-4

## Epic 2a: Epic 2a: Payment & Pipeline + GPT-5.5 Gate (Shadow)

- **Status:** backlog
- **FR Coverage:** FR7–FR8, FR10–FR12, FR14, FR17–FR21, FR25, FR27, FR29

### Story 2a.1: Stripe Checkout Payment Integration

**ID:** 2a-1

**User Story:**
As a paying customer, I want to complete payment via Stripe Checkout so that my assessment is queued after successful payment.

**Acceptance Criteria:**
- Stripe Checkout session created server-side when user confirms assessment
- Checkout session includes: price ID, customer email, success/cancel URLs, metadata (sessionId, assessmentId)
- Stripe webhook endpoint (`/api/stripe/webhook`) handles `checkout.session.completed` event
- On successful payment: update D1 assessment order status to paid, queue the assessment for pipeline processing
- Webhook validates Stripe signature with `WEBHOOK_SECRET`
- NFR17: webhook handler is non-blocking and returns 200 immediately

**FR References:** FR7, FR8

**NFR References:** NFR17, NFR18

**UX-DR References:** (none)

**Dependencies:** 0-2

### Story 2a.2: Payment Intake Reconciliation & Idempotency

**ID:** 2a-2

**User Story:**
As a platform engineer, I want idempotent payment reconciliation so that duplicate webhooks or retries don't create duplicate orders.

**Acceptance Criteria:**
- Stripe webhook idempotency key used to prevent duplicate processing
- Payment reconciliation updates D1 assessment status: pending → paid → queued
- Failed payment webhooks (charge.failed, checkout.session.expired) logged and set order status to failed
- NFR8: payment processing completes within 5 seconds end-to-end
- Idempotency guarantee: replaying the same webhook event produces exactly one state transition

**FR References:** FR8, FR13

**NFR References:** NFR8, NFR18

**UX-DR References:** (none)

**Dependencies:** 2a-1

### Story 2a.3: Source Data Preservation & Artifact Storage

**ID:** 2a-3

**User Story:**
As a platform engineer, I want raw intake data preserved in R2 so that we have an immutable audit trail of what was submitted.

**Acceptance Criteria:**
- Raw transcript JSON stored in R2 with key: `assessments/{assessmentId}/transcript.json`
- Assessment metadata (customer info, timestamps, pipeline state) persisted to D1 `assessment_orders` table
- R2 bucket has CORS policy allowing read access only from application origin
- R2 artifact key convention documented: `assessments/{assessmentId}/{stage}-{timestamp}.json`
- UX-DR30: data preservation strategy documented

**FR References:** FR10, FR11

**NFR References:** NFR4, NFR9

**UX-DR References:** UX-DR30, UX-DR31

**Dependencies:** 0-2, 2a-2

### Story 2a.4: Analysis Generation Pipeline

**ID:** 2a-4

**User Story:**
As a platform engineer, I want the pipeline to generate structured assessments via LLM so that customers receive meaningful advisory content.

**Acceptance Criteria:**
- Pipeline stage `analysis-generation` invokes LLM with structured prompt (system prompt + transcript + tool data)
- Analysis output includes: Quick Wins, Deeper Opportunities, recommendations, evidence citations, confidence levels
- Generated analysis validated for required fields before being saved
- Pipeline timeout alarm: if analysis exceeds 10 minutes, mark as failed and notify operator
- NFR7: analysis generation completes within 10 minutes for 95th percentile
- NFR10: pipeline processes assessments with 99.5% uptime
- Analysis stored in R2 and D1 results table

**FR References:** FR10, FR11, FR12, FR14, FR18

**NFR References:** NFR7, NFR10

**UX-DR References:** UX-DR31, UX-DR33

**Dependencies:** 2a-3

### Story 2a.5: Tool-Based Research Integration

**ID:** 2a-5

**User Story:**
As a platform engineer, I want the pipeline to research real AI tools relevant to the customer's context so that recommendations reference actual products.

**Acceptance Criteria:**
- `toolResearch` stage uses Perplexity API or similar to search for AI tools matching customer's described needs
- Tool research results include: name, description, URL, pricing tier, category
- Results are cached with TTL (24 hours) to avoid duplicate API calls
- Tool data is injected into the LLM analysis prompt as supplementary context
- Graceful degradation: if tool research fails, pipeline continues with analysis using only transcript data
- Research limited to 3–5 most relevant tools to control token usage

**FR References:** FR10, FR11, FR12, FR14, FR21

**NFR References:** (none)

**UX-DR References:** (none)

**Dependencies:** 2a-4

### Story 2a.6: GPT-5.5 Gate Pipeline Wiring (Shadow Mode)

**ID:** 2a-6

**User Story:**
As a platform engineer, I want the GPT-5.5 gate module wired into the pipeline in shadow mode so that verdicts are collected without blocking delivery.

**Acceptance Criteria:**
- Gate evaluation runs after analysis generation (quick-wins-verification, major-project-verification, report-review)
- Shadow mode: gate verdicts are logged to D1 but never block pipeline delivery
- Gate failure in shadow mode generates an internal alert (console.error + metric increment)
- Gate evaluation results visible in D1 `assessment_gates` table for operator review
- Promotion to blocking mode controlled by `GATE_*_ENABLED` and `GATE_*_KILL` env vars (Epic 2b)

**FR References:** FR14, FR17, FR18, FR19, FR20

**NFR References:** (none)

**UX-DR References:** (none)

**Dependencies:** 2a-4, 0-3

### Story 2a.7: Pipeline Status Views (User-Facing)

**ID:** 2a-7

**User Story:**
As a paying customer, I want to see the real-time status of my assessment pipeline so that I know when my briefing will be ready.

**Acceptance Criteria:**
- Status display shows: assessment state (queued/generating/delayed/ready/failed), estimated time remaining, progress steps (intake → analysis → review → ready)
- Status page auto-refreshes every 10 seconds via polling or SSE
- On completion: status transitions to ready with download/view CTA
- On failure: clear error message with support contact information
- NFR4: status views load within 2 seconds
- NFR5: auto-refresh rate respects user's battery/data preferences (reduced on mobile)
- NFR9: status data cached for 30 seconds, reads from cache-hit
- NFR19: accessible status indicators (aria-live region, color + icon + text)

**FR References:** FR13, FR23

**NFR References:** NFR4, NFR5, NFR9, NFR19

**UX-DR References:** UX-DR32, UX-DR34, UX-DR35, UX-DR37, UX-DR38

**Dependencies:** 2a-4, 2a-6

### Story 2a.8: Basic Operator Gate State View

**ID:** 2a-8

**User Story:**
As an operator, I want a basic view of gate evaluation results so that I can monitor pipeline quality without the full dashboard.

**Acceptance Criteria:**
- Simple table view showing: assessment ID, gate type, verdict, confidence, timestamp
- Filterable by gate type and verdict
- Pagination for results beyond 50 rows
- View accessible only by operators (role-based access)

**FR References:** FR25

**NFR References:** (none)

**UX-DR References:** (none)

**Dependencies:** 2a-6, 0-3

## Epic 2b: Epic 2b: Gate Calibration & Operator Dashboard

- **Status:** backlog
- **FR Coverage:** FR14–FR15, FR22–FR26, FR29

### Story 2b.1: Gate Mode Promotion Framework

**ID:** 2b-1

**User Story:**
As an operator, I want to promote gates from shadow mode to blocking mode so that gates actively protect delivery quality.

**Acceptance Criteria:**
- Env var configuration: each gate has `GATE_{TYPE}_ENABLED` (flag) and `GATE_{TYPE}_KILL` (kill switch)
- Shadow mode: gates log verdicts but pipeline continues regardless of result
- Blocking mode: if gate verdict is block or escalate, pipeline is halted and marked for human review
- Partial block: verdict is retry → pipeline retries the stage (max configurable retries, default 2)
- Human_assist verdict triggers escalation to operator dashboard (Story 2b-4)
- Promotion from shadow → blocking requires zero code changes (env var toggle only)
- NFR20: gate evaluation latency adds at most 30 seconds to pipeline time

**FR References:** FR14, FR18, FR20, FR25

**NFR References:** NFR20

**UX-DR References:** (none)

**Dependencies:** 2a-6

### Story 2b.2: Calibration Tooling

**ID:** 2b-2

**User Story:**
As an operator, I want calibration tooling to tune gate prompts and thresholds so that gate accuracy improves over time.

**Acceptance Criteria:**
- Calibration interface: load a set of golden test cases, run gates, view pass/fail per case
- Golden test cases stored as JSON files: input transcript, expected gate verdict, notes
- Batch run: execute all gates against all golden cases, produce pass/fail report
- Prompt version tracking: each gate run records prompt_version for A/B comparison
- Threshold adjustment UI for applyGatePolicy confidence thresholds

**FR References:** FR14, FR22, FR24, FR25, FR26

**NFR References:** (none)

**UX-DR References:** (none)

**Dependencies:** 2b-1

### Story 2b.3: Full Operator Dashboard

**ID:** 2b-3

**User Story:**
As an operator, I want a full dashboard showing pipeline and gate health so that I can monitor system performance and intervene when needed.

**Acceptance Criteria:**
- Dashboard displays: total assessments processed today, pass/fail rates per gate, average pipeline duration, queue depth
- Per-gate breakdown: verdict distribution (approve/retry/block/escalate/human_assist), average confidence, average latency
- Recent assessments table: assessment ID, status, gates triggered, verdicts, timestamps
- NFR20: dashboard queries complete within 3 seconds
- View accessible only by operators (role-based access)

**FR References:** FR22, FR25

**NFR References:** NFR20

**UX-DR References:** (none)

**Dependencies:** 2b-1

### Story 2b.4: Human Assist Workflow

**ID:** 2b-4

**User Story:**
As an operator, I want a human-in-the-loop workflow so that assessments flagged by gates can be reviewed and resolved manually.

**Acceptance Criteria:**
- Human assist queue: assessments with verdict 'human_assist' or 'escalate' appear in operator queue
- Review interface: operator sees the assessment transcript, generated analysis, gate verdict and reasoning
- Operator actions: approve (deliver as-is), edit (modify content), reject (do not deliver, notify customer)
- If approved: assessment transitions to ready state and delivery proceeds
- If rejected: customer receives notification that assessment could not be completed
- FR18: human assist workflow provides escalation path for complex or uncertain assessments

**FR References:** FR14, FR15, FR18, FR24, FR25, FR29

**NFR References:** NFR20

**UX-DR References:** (none)

**Dependencies:** 2b-1

### Story 2b.5: Cost Dashboards & Prompt Versioning

**ID:** 2b-5

**User Story:**
As an operator, I want cost dashboards and prompt version tracking so that I can manage operational costs and iterate on prompts.

**Acceptance Criteria:**
- Cost dashboard: total LLM cost per day/week/month, cost breakdown by pipeline stage, average cost per assessment
- Token usage tracking: prompt tokens, completion tokens, total tokens per assessment
- Prompt version registry: each gate run records prompt_version, model, reasoning_effort
- Prompt version comparison: side-by-side view of verdict distribution for different prompt versions
- Cost projection: estimated monthly cost based on current volume and average cost per assessment

**FR References:** FR22, FR25, FR26

**NFR References:** (none)

**UX-DR References:** (none)

**Dependencies:** 2b-2

### Story 2b.6: Gate Regression Test Suite

**ID:** 2b-6

**User Story:**
As a quality engineer, I want an automated regression test suite for gates so that prompt changes don't silently degrade quality.

**Acceptance Criteria:**
- Regression test suite: set of golden test cases covering: approve path, retry path, block path, escalate path, human_assist path
- Each test case defines: gate type, input content, expected verdict range
- CI-compatible: tests can run in GitHub Actions or similar
- Regression report: pass/fail per test case, verdict drift compared to baseline
- If regression rate drops below 80%, tests fail and block deployment

**FR References:** FR24, FR26, FR29

**NFR References:** (none)

**UX-DR References:** (none)

**Dependencies:** 2b-2

## Epic e: Epic 3: Advisory Portal Experience

- **Status:** backlog
- **FR Coverage:** FR1, FR3–FR6, FR9, FR13, FR16, FR23, FR27–FR28

### Story e.1: Clerk Auth & Private Briefing Room Shell

**ID:** 3-1

**User Story:**
As a customer, I want to sign in with Clerk so that I can access my private assessment briefing room.

**Acceptance Criteria:**
- Clerk authentication configured: sign in / sign up with email + Google OAuth
- Post-authentication redirect to /dashboard (private briefing room)
- Briefing room shell layout: sidebar navigation (assessments, settings) + main content area
- Unauthenticated users are redirected to sign-in page
- UX-DR29: authentication modals used sparingly — inline form preferred over overlay
- UX-DR6, UX-DR39/40: premium moments for return visits, test coverage for auth flows, accessibility coverage

**FR References:** FR3, FR4, FR5, FR6, FR13

**NFR References:** NFR10, NFR16

**UX-DR References:** UX-DR6, UX-DR29, UX-DR34, UX-DR35, UX-DR37, UX-DR38, UX-DR39, UX-DR40

**Dependencies:** 1-1

### Story e.2: Advisory Briefing Content Rendering

**ID:** 3-2

**User Story:**
As a customer, I want to read my completed assessment briefing in a clean, readable layout so that I can understand the recommendations.

**Acceptance Criteria:**
- Briefing page renders: header with assessment title/date, executive summary, Quick Wins section, Deeper Opportunities section, methodology note
- Briefing data fetched from D1 via /api/assessment/{id} endpoint
- Sections render with proper typography, spacing, and visual hierarchy
- Supporting evidence (citations from transcript) rendered inline with expand/collapse
- UX-DR6: premium moments for key recommendations (shadow, animation, badge)
- UX-DR39/40: test coverage for content rendering, accessibility compliance with WCAG 2.1 AA
- Loading state while briefing data is fetched — skeleton loader shown

**FR References:** FR1, FR9, FR13, FR16

**NFR References:** NFR4, NFR6, NFR10

**UX-DR References:** UX-DR6, UX-DR34, UX-DR35, UX-DR37, UX-DR38, UX-DR39, UX-DR40

**Dependencies:** 3-1

### Story e.3: Assessment Status & Receipt Display

**ID:** 3-3

**User Story:**
As a customer, I want to see the status of my assessment (queued/processing/ready) and view past receipts so that I know what's happening.

**Acceptance Criteria:**
- Dashboard shows list of assessments: date, status badge (queued/processing/delayed/ready/failed), CTA (view/pending/retry)
- Status polling auto-refreshes for in-progress assessments
- Receipt page shows: amount paid, date, payment method, assessment reference
- Receipt accessible from assessment card dropdown menu
- UX-DR32: empty state handling when no assessments exist

**FR References:** FR13, FR23

**NFR References:** NFR4, NFR5, NFR9

**UX-DR References:** UX-DR32, UX-DR34, UX-DR35, UX-DR37, UX-DR38

**Dependencies:** 3-1, 2a-7

### Story e.4: Recommendation Cards & Evidence Blocks

**ID:** 3-4

**User Story:**
As a customer, I want Quick Win recommendations presented as actionable cards so that I can prioritize next steps.

**Acceptance Criteria:**
- Quick Win cards: title, description, effort estimate (low/medium/high), impact estimate, CTA button
- Each card has expandable 'evidence' section showing which part of the transcript supports the recommendation
- Cards sortable by effort or impact
- Cards use shadcn-svelte Card component with consistent styling

**FR References:** FR1, FR9, FR16

**NFR References:** (none)

**UX-DR References:** UX-DR34, UX-DR35, UX-DR37

**Dependencies:** 3-2

### Story e.5: Opportunity Map / Card List v1

**ID:** 3-5

**User Story:**
As a customer, I want to see the Deeper Opportunities mapped visually so that I can evaluate larger strategic recommendations.

**Acceptance Criteria:**
- Deeper Opportunities section renders as a two-column or grid layout of opportunity cards
- Each opportunity card: title, description, estimated timeline, estimated investment range, ROI potential
- Filter by: effort level, impact level
- Cards link to Calendly booking (if configured) for consultation follow-up

**FR References:** FR1, FR9, FR16

**NFR References:** (none)

**UX-DR References:** UX-DR34, UX-DR35, UX-DR37

**Dependencies:** 3-2

### Story e.6: Controlled Pilot Access, Boundaries & Email Notifications

**ID:** 3-6

**User Story:**
As an operator, I want controlled access to the briefing portal during pilot so that only invited customers can see their assessments.

**Acceptance Criteria:**
- Access control: only customers with a completed assessment can access the portal
- Email notification sent when assessment is ready with magic link or sign-in prompt
- Admin can manually grant/revoke access to specific customers
- Rate limiting on login attempts (5 attempts per 15 minutes per IP)
- NFR16: unauthorized access returns 401 without revealing whether the email exists

**FR References:** FR3, FR4, FR5, FR6, FR13

**NFR References:** NFR16

**UX-DR References:** (none)

**Dependencies:** 3-1

### Story e.7: Follow-up CTA Panel & Recovery

**ID:** 3-7

**User Story:**
As a customer, I want a follow-up CTA panel so that I can book a consultation or take the next step after reading my briefing.

**Acceptance Criteria:**
- Panel at bottom of briefing: 'Ready to take the next step?' heading
- CTA buttons: Book a free consultation (Calendly), Download PDF, Share with team
- If Calendly not configured, show 'Contact us' link instead
- Panel is sticky on desktop, inline on mobile
- UX-DR18: CTA panel provides clear next-step guidance

**FR References:** FR1, FR9

**NFR References:** (none)

**UX-DR References:** UX-DR18, UX-DR34, UX-DR37

**Dependencies:** 3-2

### Story e.8: Versioning, Regeneration & Display

**ID:** 3-8

**User Story:**
As a customer, I want version tracking on my assessment so that I can see when it was last updated and request regeneration if needed.

**Acceptance Criteria:**
- Briefing displays version number and last-updated date
- Regeneration request: customer can click 'Re-run assessment' to trigger a new analysis with updated transcript
- Previous version preserved in R2 with key: `assessments/{assessmentId}/v{version}-briefing.json`
- Version history viewable: date, version number, status (current/archived)
- Rate limit regeneration to 1 per 30 days per assessment

**FR References:** FR9, FR27, FR28

**NFR References:** (none)

**UX-DR References:** (none)

**Dependencies:** 3-2
