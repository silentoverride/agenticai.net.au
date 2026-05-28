# Story 7.1: Pipeline Action Surface Audit (JLA-001)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a pipeline safety reviewer,
I want a complete map of every action the pipeline can take classified by risk tier,
So that judge placement and criteria are based on a full risk picture, not assumptions.

## Acceptance Criteria

### AC1: Complete action inventory catalogued

**Given** the full pipeline codebase (`src/lib/server/assessment/` and dependencies)
**When** JLA-001 is applied (following the methodology in `docs/agentic-workflows/judge-layer-architecture/jla-001-v1-action-surface-audit.md`)
**Then** every distinct action the pipeline can take or trigger is catalogued in a structured inventory table with columns: Action | Stage | Tier (1-4) | Boundary crossed | Affected parties | Judge needed? | Human review needed? | Currently gated?

### AC2: All four risk tiers correctly classified

**Given** the action inventory
**When** each action is classified
**Then** the classification follows these tier definitions exactly:
- **Tier 1 — Read-only**: retrieve, summarize, inspect, classify, draft, compare, explain. No external side effects.
- **Tier 2 — Reversible writes**: labels, internal notes, local files, branch changes, non-public draft updates. Side effects contained to internal systems with undo paths.
- **Tier 3 — External side effects**: sending messages, booking meetings, updating external systems, triggering workflows, posting publicly, opening PRs, notifying customers, changing shared records. Affects other people or systems.
- **Tier 4 — High-risk**: spending money, deleting data, changing permissions, merging code, submitting legal/financial work, exposing sensitive information, executing production commands. Consequences are severe, costly, or irreversible.

### AC3: Gate bypasses identified

**Given** the action inventory
**When** the pipeline's gate placement is analyzed
**Then** every action that currently bypasses any gate evaluation entirely is explicitly identified
**And** each bypass is flagged with whether the bypass is acceptable (read-only, low-risk) or a gap (Tier 2+ action with no pre/post gate)

### AC4: Risk map narrative produced

**Given** the complete action inventory and classification
**When** the findings are analyzed
**Then** a risk map narrative is produced that:
- Lists the action boundaries to instrument with judges, in priority order
- Provides a one-sentence rationale for each
- Orders by consequence severity × frequency
- Identifies the single action boundary to instrument first

### AC5: Audit document saved to docs/

**Given** the JLA-001 audit is complete
**When** findings are written
**Then** the complete audit is saved to `docs/agentic-workflows/judge-layer-architecture/jla-001-pipeline-action-surface-audit-{date}.md`
**And** the document includes all sections of the JLA-001 output format: Action inventory table, Risk map, and First boundary recommendation
**And** a summary is logged to the console during execution for observability

## Tasks / Subtasks

- [ ] **Task 1: Read and internalize the JLA-001 methodology** (AC: 1)
  - [ ] Read `docs/agentic-workflows/judge-layer-architecture/jla-001-v1-action-surface-audit.md` completely
  - [ ] Understand the four-tier risk classification system
  - [ ] Understand the output format requirements (inventory table, risk map, first boundary recommendation)

- [ ] **Task 2: Map the complete pipeline action surface** (AC: 1, 2)
  - [ ] Read and analyze all pipeline stages in `src/lib/server/assessment/pipeline.ts` and stage functions
  - [ ] Read and analyze `src/lib/server/assessment/queue.ts` (enqueue, inline fallback, queue consumer)
  - [ ] Read and analyze `src/lib/server/assessment/tool-lookup.ts` (Perplexity API calls: pain-point extraction + tool search)
  - [ ] Read and analyze `src/lib/server/assessment/evidence-map.ts` (Perplexity API: evidence extraction)
  - [ ] Read and analyze `src/lib/server/assessment/llm-analysis.ts` (Kimi/Ollama: report generation)
  - [ ] Read and analyze `src/lib/server/assessment/budget-detection.ts` (heuristic budget detection)
  - [ ] Read and analyze `src/lib/server/assessment/emails.ts` (SendGrid: welcome, receipt, report-ready, portal invitation)
  - [ ] Read and analyze `src/lib/server/assessment/gate/runner.ts` (gate evaluation orchestration)
  - [ ] Read and analyze `src/lib/server/assessment/gate/definitions.ts` (gate prompts for 3 gates)
  - [ ] Read and analyze `src/lib/server/assessment/gate/gpt55-provider.ts` (GPT-5.5 judge provider)
  - [ ] Read and analyze `src/lib/server/assessment/gate/gate-store.ts` (D1 persistence of gate results)
  - [ ] Read and analyze `src/lib/server/assessment/gate/gate-mode.ts` (shadow/blocking mode)
  - [ ] Read and analyze `src/lib/server/assessment/intake-quality-check.ts` (heuristic intake quality, no API)
  - [ ] Read and analyze `src/lib/server/assessment/intake-script.ts` (Annie question tree)
  - [ ] Read and analyze `src/lib/server/assessment/report-store-r2.ts` (R2 report persistence)
  - [ ] Read and analyze `src/lib/server/assessment/report-store.ts` (report metadata persistence)
  - [ ] Read and analyze `src/lib/server/assessment/pipeline-store.ts` and `pipeline-status-db.ts` (D1 status writes)
  - [ ] Read and analyze `src/lib/server/assessment/tool-cache.ts` (D1 tool cache)
  - [ ] Read and analyze `src/lib/server/portal.ts` functions used by pipeline (findOrCreateUserFromStripe, linkReportToUser, upsertReportMetadata)
  - [ ] Read intake webhook handlers: `src/routes/api/retell-webhook/+server.ts` and `src/routes/api/stripe/webhook/+server.ts` (entry points that trigger pipeline)
  - [ ] Map the Retell voice agent interaction and Annie chat interaction (boundary: customer ↔ system)

- [ ] **Task 3: Classify every action by risk tier** (AC: 2)
  - [ ] For each discovered action, determine the tier (1-4) based on the action's consequences
  - [ ] Identify the boundary crossed (internal → external, draft → published, private → shared, reversible → irreversible)
  - [ ] Identify who is affected if the action is wrong
  - [ ] Determine whether a judge should run before, after, or not at all
  - [ ] Determine whether human review should be in the path
  - [ ] Flag any actions with ambiguous tier classification and explain the uncertainty

- [ ] **Task 4: Identify gate bypasses** (AC: 3)
  - [ ] Trace the current gate placement: `quick-wins-verification` (post-LLM), `major-project-verification` (post-LLM), `report-review` (post-save)
  - [ ] Identify which pipeline actions occur BEFORE any gate evaluation runs
  - [ ] Identify which Tier 2/3/4 actions have no gate coverage at all
  - [ ] Classify each bypass as acceptable (Tier 1, or inherently safe) or a gap

- [ ] **Task 5: Produce risk map narrative** (AC: 4)
  - [ ] Rank action boundaries by risk severity × frequency
  - [ ] Write a prioritized build plan: which boundaries to add judgment to first
  - [ ] Provide a one-sentence rationale for each item
  - [ ] Recommend the single action boundary to instrument first

- [ ] **Task 6: Write and save the audit document** (AC: 5)
  - [ ] Compose the JLA-001 formatted output with all required sections
  - [ ] Save to `docs/agentic-workflows/judge-layer-architecture/jla-001-pipeline-action-surface-audit-{date}.md`
  - [ ] Log summary stats: total actions catalogued, tier breakdown count, gate bypass count, first boundary recommendation
  - [ ] Ensure all file paths reference real source files in the repository

## Dev Notes

**⚠️ CRITICAL: This story produces a DOCUMENT, not code changes.** The dev agent reads the entire pipeline codebase, applies the JLA-001 methodology, and writes a structured audit document. There are zero code changes in this story. The output is a markdown file in `docs/`.

### What This Story IS

- An exhaustive READ-ONLY audit of the existing pipeline code
- Application of the JLA-001 methodology (action surface mapping + risk tier classification)
- Production of a structured audit document that informs Stories 7.2 (architecture review), 7.3 (judge prompts), and 7.4 (evaluation suites)

### What This Story IS NOT

- A code implementation
- A gate prompt modification
- A pipeline refactor
- A schema migration
- A test suite

### The JLA-001 Methodology

The prompt at `docs/agentic-workflows/judge-layer-architecture/jla-001-v1-action-surface-audit.md` defines a 4-step process:

1. **Describe the agent system**: What does it do? What tools/APIs/systems can it interact with? What side effects? Who is affected? What judgment/review exists?
2. **Ask follow-up questions** if the action surface is unclear — especially around agent chaining, handoffs, and memory writes
3. **Produce the full action surface audit**: inventory, classification, boundary notes, judge/human-review determination
4. **End with summary table and first boundary recommendation**

The dev agent must INTERNALIZE this methodology and apply it to the real pipeline code, not just regurgitate the prompt.

### Pipeline Architecture Overview (for the dev agent)

The assessment pipeline (`src/lib/server/assessment/pipeline.ts`) is a composed, multi-stage pipeline:

```
Webhook Entry (Retell voice or Stripe chat)
    │
    ▼
Intake Quality Check (heuristic, no API — `intake-quality-check.ts`)
    │
    ▼
Queue Enqueue (Cloudflare Queue — `queue.ts`)
    │
    ▼
=== Queue Consumer Stage Router ===
    │
    ├── Stage 0: Tool Research (Perplexity API × 2 calls — `tool-lookup.ts`)
    │      ├── Pain Point Extraction (Perplexity sonar-pro)
    │      ├── Tool Lookup (Perplexity sonar-pro → futurepedia.io / theresanaiforthat.com)
    │      └── Budget Detection (heuristic, no API — `budget-detection.ts`)
    │
    ├── Stage 0.5: Evidence Extraction (Perplexity API — `evidence-map.ts`)
    │      └── Structured claims + gaps from transcript
    │
    ├── Stage 1: LLM Analysis (Kimi/Ollama Cloud via `llmChat` — `llm-analysis.ts`)
    │      └── Structured JSON assessment from evidence map + tools + transcript
    │
    ├── Gate: quick-wins-verification (GPT-5.5 — `gate/runner.ts` → prompt from `gate/definitions.ts`)
    │      └── Blocks pipeline on fail in blocking mode; logs in shadow mode
    │
    ├── Gate: major-project-verification (GPT-5.5)
    │      └── Blocks pipeline on fail in blocking mode; logs in shadow mode
    │
    ├── Stage 2: Save Report (R2 — `report-store-r2.ts`)
    │      └── Persist analysis JSON to R2 bucket; filesystem fallback in dev
    │
    ├── Stage 3: Link Report (D1 — `pipeline.ts` + `portal.ts`)
    │      ├── upsertReportMetadata → D1 (report metadata)
    │      ├── findOrCreateUserFromStripe → D1 + Stripe API
    │      └── linkReportToUser → D1 (portal user-report link)
    │
    ├── Gate: report-review (GPT-5.5 — includes taste + PBW detection)
    │      └── Blocks email delivery in blocking mode
    │
    ├── Stage 4: Email Delivery (SendGrid — `emails.ts`)
    │      └── sendReportReadyEmail → SendGrid API
    │
    └── Pipeline Status Update (D1 — `pipeline-status-db.ts`)
           └── completed | human_assist (blocked) | error
```

### Key Files to Read (exhaustive list)

The dev agent MUST read ALL of these files during the audit:

| File | Purpose |
|------|---------|
| `src/lib/server/assessment/pipeline.ts` | Full pipeline orchestration, all stages, composed run |
| `src/lib/server/assessment/queue.ts` | Queue producer/consumer, inline fallback |
| `src/lib/server/assessment/tool-lookup.ts` | Perplexity API: pain points + tool lookup |
| `src/lib/server/assessment/tool-cache.ts` | D1 cache for tool lookups |
| `src/lib/server/assessment/evidence-map.ts` | Perplexity API: evidence extraction |
| `src/lib/server/assessment/llm-analysis.ts` | Kimi/Ollama: report generation |
| `src/lib/server/assessment/budget-detection.ts` | Heuristic budget signal extraction |
| `src/lib/server/assessment/emails.ts` | SendGrid: all email templates |
| `src/lib/server/assessment/gate/runner.ts` | Gate orchestration, GPT-5.5 calls, persistence |
| `src/lib/server/assessment/gate/definitions.ts` | Gate system prompts (3 gates) |
| `src/lib/server/assessment/gate/gpt55-provider.ts` | GPT-5.5 judge provider |
| `src/lib/server/assessment/gate/gate-store.ts` | D1 gate result persistence |
| `src/lib/server/assessment/gate/gate-mode.ts` | Shadow/blocking mode config |
| `src/lib/server/assessment/gate/types.ts` | Gate type definitions |
| `src/lib/server/assessment/intake-quality-check.ts` | Heuristic intake sufficiency |
| `src/lib/server/assessment/intake-script.ts` | Annie's question tree |
| `src/lib/server/assessment/report-store-r2.ts` | R2 report persistence |
| `src/lib/server/assessment/report-store.ts` | Report metadata (D1) |
| `src/lib/server/assessment/pipeline-store.ts` | Pipeline state management |
| `src/lib/server/assessment/pipeline-status-db.ts` | D1 pipeline status persistence |
| `src/lib/server/assessment/retell-job.ts` | Retell webhook → job mapping |
| `src/lib/server/assessment/transcript-store.ts` | Transcript persistence |
| `src/lib/server/assessment/transcript-store-db.ts` | D1 transcript persistence |
| `src/lib/server/assessment/transcript-file-store.ts` | Filesystem transcript fallback |
| `src/lib/server/assessment/analysis-types.ts` | Structured analysis validation |
| `src/lib/server/assessment/types.ts` | Pipeline type definitions |
| `src/lib/server/portal.ts` (portal user functions) | Stripe user lookup, report linking |
| `src/lib/server/email.ts` | SendGrid base client |
| `src/routes/api/retell-webhook/+server.ts` | Voice intake entry point |
| `src/routes/api/stripe/webhook/+server.ts` | Chat intake entry point |
| `workers/queue-consumer.ts` | Queue consumer worker |
| `workers/stages/` | Stage routing |
| `docs/agentic-workflows/judge-layer-architecture/jla-001-v1-action-surface-audit.md` | JLA-001 methodology |
| `docs/assessment-pipeline-workflow-integration-report.md` | Pipeline workflow context |

### Action Boundaries to Map

The dev agent should identify actions at these boundaries:

1. **Customer ↔ System** (intake): Voice call connection, chat session, transcript generation
2. **Webhook → Pipeline** (trigger): Retell webhook POST, Stripe webhook POST
3. **Heuristic → Queue** (quality): Intake quality check decision, queue enqueue
4. **Pipeline → Perplexity** (external API): Pain-point extraction, tool lookup, evidence extraction
5. **Pipeline → Kimi/Ollama** (LLM generation): Report generation with evidence map
6. **Pipeline → GPT-5.5** (gate evaluation): 3 gate evaluations, each an API call with cost
7. **Pipeline → R2** (storage): Report JSON persistence to R2 bucket
8. **Pipeline → D1** (database): Pipeline status, gate metadata, report metadata, tool cache, transcript, portal user linking
9. **Pipeline → Stripe** (payment): User lookup via Stripe API
10. **Pipeline → SendGrid** (email): Report-ready, welcome, receipt, portal invitation emails
11. **Pipeline → Queue** (message): Queue.send(), message ack/retry
12. **Gate → D1** (audit): Gate run record persistence

### Tier Classification Guide

| Tier | Name | Examples in this pipeline |
|------|------|--------------------------|
| 1 | Read-only | Pain-point extraction (just reads transcript), budget detection (no API), intake quality check (no API), gate evaluation (reads content, doesn't modify) |
| 2 | Reversible writes | D1 writes (pipeline status, gate metadata, report metadata — all reversible via migration/update), R2 writes (report JSON — can be overwritten), D1 tool cache writes |
| 3 | External side effects | SendGrid emails (customer receives email), Perplexity API calls (cost money, external service), Kimi/Ollama API calls (cost money, external service), GPT-5.5 gate calls (cost money, external service), Stripe API user lookup (external service) |
| 4 | High-risk | None currently — but note that pipeline blocking/failing gate evaluation could waste $1,200 customer payment if a bad report is blocked after payment. The Stripe payment happened before the pipeline runs. |

**Important nuance**: Perplexity, Kimi/Ollama, and GPT-5.5 API calls are Tier 3 (not Tier 4) because they cost money but are bounded (~$0.30-0.50/run). They are external side effects with financial cost. SendGrid emails are Tier 3 because they notify an external party (the customer) and cannot be unsent — but the consequence of a wrong email is reputational, not directly financial.

### Architecture Constraints

From `_bmad-output/planning-artifacts/architecture.md`:

- Production persistence uses Cloudflare D1, R2, and Queue bindings accessed through `event.platform.env`.
- Queue worker and report pipeline already create gate and pipeline artifacts.
- Keep database operations async even for local SQLite; use the `AsyncDb` facade.
- Access Cloudflare D1/R2/Queue bindings through `event.platform?.env` in SvelteKit routes; Worker code uses the Worker `env` argument.
- Queue messages must contain plain serializable data only.
- All external API keys are accessed via `$env/dynamic/private` (never hardcoded).

### Project Context

From `_bmad-output/project-context.md`:

- TypeScript ESM, `"type": "module"`, bundler module resolution
- SvelteKit 2 / Svelte 5 / Cloudflare Pages
- External API integrations: Retell, Stripe, Twilio, SendGrid, Perplexity, Ollama/Kimi, Calendly
- Queue consumer code belongs under `workers/**`
- Pipeline code under `src/lib/server/assessment/**`
- Deploy target: Cloudflare Pages via `@sveltejs/adapter-cloudflare`

### Previous Story Learnings (Epic 6)

From Story 6.3 (`6-3-intake-completion-criteria.md`):

- Epic 6 established the intake quality check as a heuristic gate that runs BEFORE queueing the pipeline
- The intake-quality-check.ts now has 4 quality states: sufficient, adequate, incomplete, invalid
- The `INTAKE_QUALITY_BLOCK` env var controls whether incomplete intakes block pipeline triggering
- The intake script was redesigned from 6 to 8+ questions with explicit gate criterion mapping
- `BLOCKING_QUESTION_IDS` is imported from intake-script.ts (not hardcoded)

### Git Intelligence

Recent commits show the Epic 6 pipeline hardening pattern:

- `d96e2c7` — Epic 6 complete (all 3 stories done)
- `98fe9e8` — Story 6.3: AICC-003 Intake Completion Criteria
- `cc20f82` — Story 6.2: map Annie chat question keys
- `8ddbd73` — Story 6.2: AICC-001 Intake Question Redesign
- `92b5d45` — Story 6.1: AICC-002 Intake Quality Audit
- `ee89ef7` — Phase 1 pipeline hardening (gates, diagnostics, evaluation corpus, agentic workflows)

**Pattern**: Epic 6 stories were audit/analysis stories that read code and produced documents. Epic 7 follows the same pattern with JLA instead of AICC.

### Testing Standards

- No automated tests required for THIS story (it produces a document, not code)
- The audit document itself serves as the "test" — it must be comprehensive and accurate
- Stories 7.3 and 7.4 will require tests for the judge prompts and evaluation suites
- Vitest configured: `tests/**/*.test.ts`, ESM/TypeScript, `$lib` alias imports
- For SvelteKit endpoints, test with typed fake `RequestEvent` objects

### References

- [Source: docs/agentic-workflows/judge-layer-architecture/jla-001-v1-action-surface-audit.md] — JLA-001 methodology
- [Source: docs/assessment-pipeline-workflow-integration-report.md §1] — Pipeline fit for JLA suite
- [Source: _bmad-output/planning-artifacts/epics.md §Epic 7] — Epic 7 requirements
- [Source: _bmad-output/planning-artifacts/architecture.md] — Architecture constraints
- [Source: _bmad-output/project-context.md] — Project technology and conventions
- [Source: _bmad-output/implementation-artifacts/6-3-intake-completion-criteria.md] — Previous story learnings
- [Source: src/lib/server/assessment/pipeline.ts] — Pipeline orchestration
- [Source: src/lib/server/assessment/queue.ts] — Queue producer/consumer
- [Source: src/lib/server/assessment/tool-lookup.ts] — Perplexity tool research
- [Source: src/lib/server/assessment/evidence-map.ts] — Evidence extraction
- [Source: src/lib/server/assessment/llm-analysis.ts] — LLM report generation
- [Source: src/lib/server/assessment/budget-detection.ts] — Budget signal extraction
- [Source: src/lib/server/assessment/emails.ts] — SendGrid email delivery
- [Source: src/lib/server/assessment/gate/definitions.ts] — Gate system prompts
- [Source: src/lib/server/assessment/gate/runner.ts] — Gate orchestration
- [Source: src/lib/server/assessment/gate/gate-mode.ts] — Shadow/blocking mode
- [Source: src/lib/server/assessment/gate/gate-store.ts] — Gate D1 persistence
- [Source: src/lib/server/assessment/intake-quality-check.ts] — Intake quality heuristic
- [Source: src/lib/server/assessment/intake-script.ts] — Annie intake script

## Dev Agent Record

### Agent Model Used

<!-- Filled by dev agent -->

### Debug Log References

<!-- Filled by dev agent -->

### Completion Notes List

<!-- Filled by dev agent -->

### File List

<!-- Filled by dev agent -->
