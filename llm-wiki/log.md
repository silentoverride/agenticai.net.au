# Wiki Log

Operational log of ingests, queries, lints, and schema changes.

## [2026-05-02] docs | Client Portal API documentation and JSDoc
- **Created:** `docs/client-portal.md` — comprehensive markdown documentation covering:
  - Overview and architecture
  - Full API reference for `db.ts`, `portal.ts`, and all `/api/portal/*` routes
  - Usage examples for components, auth, and reveal.js integration
  - Configuration table (env vars, CSP headers, database settings)
  - Error handling matrix (auth, database, Stripe, reveal.js errors)
  - Slide structure mapping (12 slides from assessment JSON)
  - Auto-linking behaviour and troubleshooting guide
- **Documented code with JSDoc:**
  - `src/lib/server/db.ts` — module overview, `getDb()`, type definitions, schema description
  - `src/lib/server/portal.ts` — all 13 functions with params, return types, examples, and `@module` tags
  - `src/hooks.server.ts` — Clerk hook documentation with required env vars
  - `src/routes/api/portal/reports/+server.ts` — GET endpoint with auth and auto-linking notes
  - `src/routes/api/portal/reports/[id]/+server.ts` — report detail endpoint with ownership check
  - `src/routes/api/portal/receipts/+server.ts` — receipts list endpoint
  - `src/routes/api/portal/receipts/[id]/download/+server.ts` — download/redirect endpoint
- **Updated:** `llm-wiki/operations/client-portal.md` — added link to `docs/client-portal.md`
- **Build:** passes cleanly (0 svelte-check errors)

## [2026-05-02] implementation | Client Portal with Clerk auth, reveal.js reports, receipts, Calendly
- **Created:** `src/lib/server/db.ts` — SQLite schema (users, user_reports, receipts) with WAL mode
- **Created:** `src/lib/server/portal.ts` — portal business logic:
  - `upsertUser()` — sync Clerk user to local DB
  - `linkReportToUser()` — associate generated report with user
  - `saveReceipt()` / `savePendingReceipt()` — store Stripe receipts (pending if user not yet signed up)
  - `scanAndLinkReportsByEmail()` — filesystem scan to auto-link reports by customer email on login
  - `linkPendingReceiptsByEmail()` — link orphaned receipts when user first signs in
- **Created:** `src/hooks.server.ts` — svelte-clerk `withClerkHandler()` for session verification
- **Created:** `src/routes/portal/+layout.svelte` — auth gate with `<SignIn>` component + portal navigation
- **Created:** `src/routes/portal/+page.svelte` — dashboard with reports + receipts cards
- **Created:** `src/routes/portal/reports/+page.svelte` — reports grid with View / Download actions
- **Created:** `src/routes/portal/reports/[id]/+page.svelte` — reveal.js presentation viewer
- **Created:** `src/routes/portal/receipts/+page.svelte` — receipts table with download links
- **Created:** `src/lib/components/RevealDeck.svelte` — reveal.js wrapper mapping assessment JSON to 12 slides:
  - Title, Executive Summary, Opportunity at a Glance, Impact-Effort Matrix
  - Recommended Solutions (up to 4 quick wins), 4-Day Quick Wins Plan
  - What Comes After Quick Wins, Financial Impact, Next Steps + Calendly CTA
- **Created:** `src/lib/components/CalendlyButton.svelte` — popup widget button on final slide
- **Created:** `src/routes/api/portal/reports/+server.ts` — GET list reports (auto-links on load)
- **Created:** `src/routes/api/portal/reports/[id]/+server.ts` — GET report + analysis JSON
- **Created:** `src/routes/api/portal/receipts/+server.ts` — GET list receipts
- **Created:** `src/routes/api/portal/receipts/[id]/download/+server.ts` — GET receipt download / redirect
- **Updated:** `src/routes/+layout.svelte` — wrapped app in `<ClerkProvider>`
- **Updated:** `src/lib/components/Navigation.svelte` — added Sign In / Portal / Sign Out buttons based on auth state
- **Updated:** `src/styles.css` — added `.portal-link`, `.nav-signin`, `.nav-signout` styles
- **Updated:** `src/routes/api/stripe/webhook/+server.ts` — saves receipt to portal on payment (pending if no user yet)
- **Updated:** `src/lib/server/assessment/pipeline.ts` — links generated report to user by email after saving
- **Updated:** `.env` — added `CLERK_SECRET_KEY`, `PUBLIC_CLERK_PUBLISHABLE_KEY`, `PUBLIC_CALENDLY_URL`, `DB_DIR`
- **Updated:** `svelte.config.js` — expanded CSP for Clerk and Calendly domains
- **Updated:** `llm-wiki/operations/client-portal.md` — full documentation page
- **Dependencies added:** `svelte-clerk`, `reveal.js`, `better-sqlite3`, `@clerk/backend`, `@types/better-sqlite3`
- **Build:** passes cleanly (0 svelte-check errors)

## [2026-05-02] implementation | PPTX template mapping for Presenton report generation
- **Template source:** `docs/ai-tools-assessment-redacted.pptx` — 8-slide branded assessment report template
- **Created:** `src/lib/server/assessment/template-mapper.ts` — maps LLM analysis JSON to Presenton v3 `from-json` slide structure:
  - 12 slides matching the redacted PPTX layout (title, executive summary, opportunity, matrix, solutions ×4, 4-day plan, deeper opportunities, financial impact, next steps)
  - Extracts pain points, quick wins, tool recommendations, financial impact from analysis JSON
  - Embeds researched tool URLs directly into Recommended Solutions slide bullets
  - Maps effort/impact to 2×2 quadrant categories
- **Updated:** `src/lib/server/assessment/presenton.ts` — switched from `/presentation/generate` to `/presentation/from-json` with fallback to `/generate` on failure
- **Updated:** `llm-wiki/reports/presenton.md` — documented template mapping, slide table, and from-json rationale
- **Updated:** `llm-wiki/operations/report-pipeline.md` — updated hybrid pipeline diagram to include template mapper step
- **Build:** passes cleanly

## [2026-05-02] implementation | Perplexity tool lookup integrated into report pipeline
- **Created:** `src/lib/server/assessment/tool-lookup.ts` — 180-line module with:
  - `extractPainPointsForToolLookup(transcript)` — uses Perplexity API to extract pain points + search queries from transcript
  - `lookupToolsWithPerplexity(painPoints)` — searches Perplexity for real AI tools from Futurepedia and TAAFT
  - `lookupToolsForTranscript(transcript)` — convenience wrapper (extract → search)
  - `formatToolsForPrompt(tools)` — formats discovered tools as markdown for LLM prompt injection
  - `enrichAnalysisWithTools(analysisJson, tools)` — merges tool data into final JSON report
- **Updated:** `src/lib/server/assessment/pipeline.ts` — added Step 0 (tool lookup) and Step 1b (enrichment) to `runReportPipeline()`
- **Updated:** `src/lib/server/assessment/llm-analysis.ts` — `analyzeTranscript()` now accepts optional `AITool[]` and injects them into the system prompt via `formatToolsForPrompt()`
- **Updated:** `.env` — added `PERPLEXITY_API_KEY` and `PERPLEXITY_MODEL=sonar-pro`
- **Build:** passes cleanly
- **Security note:** old Perplexity key was exposed in chat; user rotated to new key

## [2026-05-02] workflow update | AI tool lookup architecture documented
- **Report pipeline (`operations/report-pipeline.md`):**
  - Added complete **Tool Lookup Architecture** section with three approaches:
    - **Approach A:** Live Search API (Perplexity) — recommended primary
    - **Approach B:** Browser Automation (Puppeteer/Playwright) — fallback
    - **Approach C:** Cached Tool Database — fastest, requires refresh job
  - Documented recommended **hybrid pipeline**: cache first → Perplexity fallback
  - Added Perplexity search prompt template with expected JSON output format
  - Added TypeScript pseudocode for `lookupToolsForPainPoints()` pipeline step
  - Added environment variables for all three approaches
  - Updated flow diagram to include tool lookup step
- **Previous:** AI tool lookup requirement added to report generation

## [2026-05-02] workflow update | AI tool lookup added to report generation
- **Report pipeline (`operations/report-pipeline.md`):**
  - Added Step 3: Research AI software solutions from [Futurepedia](https://www.futurepedia.io/ai-tools) and [There's An AI For That](https://theresanaiforthat.com/)
  - Added tool lookup strategy table mapping pain point categories to search terms and example tools
  - Updated report agent instructions to require tool name, URL, pricing, fit rationale, and integration complexity for each recommendation
  - Added open question about live web search vs. training knowledge for tool recommendations
- **Service model (`business/service-model.md`):**
  - Updated "Recommended Solutions" report section to reference Futurepedia and TAAFT as research sources
  - Added open question about live web search vs. training knowledge

## [2026-05-02] cleanup | Removed unused chat widget code
- **Deleted:** `src/lib/components/RetellChatWidget.svelte`
- **Deleted:** `src/routes/api/annie-chat/` (empty directory)
- **Verified:** No remaining references to `RetellChatWidget` or `annie-chat` in codebase
- **Verified:** Build passes; `callStatus`/`toggleCall` still used by `CallAssessmentButton.svelte` and test page

## [2026-05-02] correction | Chat widget removed from website
- **Code change:** Removed `RetellChatWidget` import and usage from `src/routes/+layout.svelte`
- **Wiki updated:** `agents/annie-chat-agent.md` — added status note clarifying chat agent is documented but not deployed; website uses voice-only
- **Wiki updated:** `agents/annie-voice-agent.md` — updated channel to include website voice call button
- **Wiki updated:** `business/service-model.md` — corrected assessment process from "voice/chat" to "voice"
- **Note:** The removed `RetellChatWidget` was actually a voice call launcher (not text chat), but was confusingly named. The website now relies on the "Call Annie" button and Twilio phone number for all intake.

## [2026-05-02] ingest | Cloudflare Documentation (developers.cloudflare.com)
- **Sources registered:** Cloudflare docs main page (llms.txt), DNS get-started, SSL/TLS get-started, Cache get-started
- **Page created:** `integrations/cloudflare.md`
- **Updated:** `integrations/twilio.md` (added See Also link), `raw-sources/index.md`, `index.md`

## [2026-05-02] ingest | Presenton Documentation (docs.presenton.ai)
- **Sources registered:** Presenton docs main page, llms.txt, quickstart, end-to-end flow, API reference (generate, from-json, export), data report tutorial
- **Page created:** `reports/presenton.md`
- **Updated:** `operations/report-pipeline.md` (added See Also), `business/service-model.md` (added See Also), `raw-sources/index.md`, `index.md`

## [2026-05-02] ingest | Stripe Documentation (docs.stripe.com)
- **Sources registered:** Stripe docs main page, Checkout Sessions, Webhooks, Testing use cases
- **Page created:** `integrations/stripe-platform.md`
- **Updated:** `integrations/stripe.md` (added See Also link), `raw-sources/index.md`

## [2026-05-02] ingest | Multiple sources from docs/ + Retell web docs

### Sources registered
- **Retell AI — Introduction** (`https://docs.retellai.com/general/introduction`) — web reference
- **AI Business Assessment Business Plan** (`docs/AI Business Assessment Business Plan.md`) — in-project reference
- **Question Knowledgebase** (`docs/question-knowledgebase.md`) — in-project reference
- **Retell Chat Agent Workflow** (`docs/retell-annie-chat-agent-workflow.md`) — in-project reference
- **Retell Voice Agent Workflow** (`docs/retell-annie-voice-agent-workflow.md`) — in-project reference
- **Retell Report Agent Handoff** (`docs/retell-report-agent-handoff.md`) — in-project reference
- **Twilio and Retell Setup** (`docs/twilio-retell-setup.md`) — in-project reference
- **Connect Twilio Number** (`docs/connect-twilio-number-to-retell-voice-agent.md`) — in-project reference
- **Stripe Setup** (`docs/stripe-setup.md`) — in-project reference
- **Voice Agent Script** (`docs/voice-agent-script.md`) — in-project reference
- **Voice Agent Disclaimer** (`docs/voice-agent-disclaimer.md`) — in-project reference
- **Voice Agent User Test Script** (`docs/retell-voice-agent-user-test-script.md`) — in-project reference
- **Annie — AI Business Assessment Chat** (`raw-sources/conversations/2026-05-01-annie-business-assessment-chat.json`) — copied transcript
- **Annie Voice Agent Config** (`docs/annie_voice_agent.json`) — in-project reference
- **Question Knowledgebase (JSON)** (`docs/question-knowledgebase.json`) — in-project reference

### Pages created
- `business/business-plan-source.md` — Source summary for business plan
- `business/service-model.md` — Service model, pricing, upsells, acquisition
- `agents/annie-chat-agent.md` — Chat agent flow, nodes, payment integration
- `agents/annie-voice-agent.md` — Voice agent flow, script, disclaimer, testing
- `agents/question-knowledgebase.md` — Discovery questions and scoring hints
- `integrations/retell.md` — Retell platform overview
- `integrations/stripe.md` — Stripe payment integration reference
- `integrations/twilio.md` — Twilio SIP and SMS integration reference
- `operations/report-pipeline.md` — Transcript-to-report pipeline

### Notes
- PPTX and DOCX binaries registered as references without text extraction
- Business plan is a significant source (41 KB) — created dedicated source summary page first
- Schema proposed and accepted: domain=Agentic AI, buckets=docs/conversations/configs/decks/figures, topics=business/agents/integrations/reports/operations
