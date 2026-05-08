Refactor the agenticai.net.au SvelteKit codebase applying common software engineering principles and industry best practices.

## Current Known Issues
### Surgical Fixes Applied (Iteration 2)
1. **Bug D**: `transcript-store-db.ts` metadata corruption (`metadata = excluded.transcript` → `metadata = excluded.metadata`) + defensive `JSON.parse`
2. **Bug B**: `queue.ts` `runPipelineInline` now re-throws after writing error status; `enqueueReportJob` awaits inline fallback and returns `{ inline: false }` on failure so callers (e.g. Stripe webhook) can react
3. **Bug C/E**: `pipeline-status-db.ts` & `pipeline-store.ts` added `getPipelineStatusByCallId()`; `retell-webhook/+server.ts` catches up orphaned transcripts when payment arrived before transcript — enqueues pipeline with correct sessionId
4. **Bug E**: `retell-job.ts` now extracts `stripe_session_id` from Retell payload metadata/custom analysis
5. **Bug A**: `run-pipeline/+server.ts` validates `result.savedReport?.id` exists before writing `completed`; throws 500 otherwise

### Architectural Fixes Applied (Iteration 3)
1. **Issue #1 — Duplicated auth/dev-bypass logic across 7 portal API routes**
   - Created `$lib/server/portal-auth.ts` with `requirePortalAuth(locals, url)` helper
   - Refactored all 7 portal routes to use the shared helper (eliminates ~15 lines of duplicated boilerplate per route)
   - Unchanged behavior: DB availability check → resolveUser → upsertUser (if not dev bypass)
   - Routes updated: `user`, `reports`, `reports/[id]`, `receipts`, `receipts/[id]`, `receipts/[id]/download`

### Scout Findings (Iteration 4)
Four parallel scouts investigated: `assessment/pipeline`, `database discrepancy`, `API route patterns`, `testing/tooling`.

**Database (scout #2):**
- Drizzle `schema.ts` is dead code (imported by zero files). All queries are raw SQL via custom `AsyncDb` wrapper.
- `schema.ts` vs `db.ts` vs migrations: 7+ discrepancies including missing `processed_events` table, missing `idx_users_role`, partial unique indexes without `WHERE` clauses, missing `CHECK` constraint, datetime format mismatch.
- `db.ts` `initSchema()` missing `idx_users_role` — fresh local DBs diverge from migrated prod DBs.

**API Routes (scout #3):**
- 14 API routes with 5 different auth patterns (Stripe HMAC, Retell HMAC, Clerk portal, internal secret, none).
- No unified error envelope: throws `error()`, returns `json({ message })`, returns plain text, leaks stack traces.
- Retell webhook verification is **fail-open** (skipped if `RETELL_API_KEY` missing).
- Stripe webhook suppresses side-effect errors, returns 200 anyway — tells Stripe event succeeded when it may not have.

**Assessment Pipeline (scout #1):**
- No retry on transient LLM/Perplexity failures. No dead-letter handling. Queue consumer unconditionally calls `msg.retry()`.
- Risk of double-processing if queue ACK lost (inline fallback runs after queue send fails ambiguously).
- Several steps swallow errors (tool lookup, portal linking, email). Two steps fatal (LLM analysis, report save).

**Testing & Tooling (scout #4):**
- Zero unit/integration tests. Only visual smoke tests via Playwright (`check:visual`).
- No CI/CD. Manual wrangler deploys. No GitHub Actions.
- 30+ ad-hoc scripts in `scripts/`, mostly manual debugging tools.
- TypeScript `strict: true` enabled, but `any` casts visible in `benchmark/pipeline` and likely elsewhere.

### Architectural Fixes Applied (Iteration 4 — Issue #3: Dual-Mode DB Centralisation)
2. **Database layer centralised — eliminated 34+ scattered `isDatabaseAvailable() → getDb()` guards**
   - Added `withDb<T>(label, fallback, fn)` to `$lib/server/db.ts`
   - All business-logic functions now use `withDb` instead of inline guard+log+getDb boilerplate
   - Canonical log format: `[db] <label> skipped: database unavailable` (uniform, grep-able)
   - Files refactored: `portal.ts` (13 functions), `processed-events.ts` (3 functions), `transcript-store-db.ts` (4 methods), `pipeline-status-db.ts` (3 methods)
   - Preserved: `pipeline-store.ts` and `transcript-store.ts` keep `isDatabaseAvailable()` for D1-or-memory branching
   - Preserved: `portal-auth.ts` keeps `isDatabaseAvailable()` for intentional 503 responses
   - Net result: ~70 lines of boilerplate removed; all unavailability handling is uniform

### Remaining Architectural Issues (updated)
2. Portal pages repeat similar fetch patterns with dev_user_id plumbing
3. Database layer: dead Drizzle schema, raw SQL everywhere, schema drift between `db.ts`/`schema.ts`/migrations
6. No centralized validation/schemas
7. Report generation pipeline: no retries, no DLQ, swallowed errors, tight coupling
8. Zero automated tests, no CI/CD pipeline

### Architectural Fixes Applied (Iteration 5 — Issue #4: Type Safety)
4. **Type safety — eliminated 17 `any` casts and added structured `AnalysisData` types**
   - Created 7 new TypeScript interfaces in `src/lib/server/assessment/types.ts`:
     - `AnalysisData` — root analysis object (was `Record<string, any>`)
     - `AnalysisPainPoint`, `AnalysisQuickWin`, `AnalysisResearchedTool`
     - `AnalysisDeeperOpportunity`, `AnalysisFinancialImpact`, `AnalysisToolRecommendation`
     - `implementation_roadmap` shape (discovered in `report-markdown.ts`)
   - Updated `RevealDeck.svelte` — replaced all 14 `any` types with proper types
     - `analysis` prop: `Record<string, any>` → `AnalysisData`
     - All helper functions typed: `matchToolForWin`, `complexityLabel`, `setupTime`, `toolTimeSaved`, `renderQuickWinsBars`
     - Template callbacks typed: `some((w: AnalysisQuickWin) => ...)`
   - Updated `report-markdown.ts` — `data` parameter: `Record<string, any>` → `AnalysisData`
   - Updated `tool-lookup.ts` — removed local `AnalysisQuickWin` interface, now imports from shared types
   - Updated `routes/test/voice-agent/+page.svelte` — replaced `any` Retell event types with `RetellWebClient`, proper error types, and typed event payloads
   - Remaining `any` uses: `CalendlyButton.svelte` (window.Calendly integration) — legitimate third-party JS
   - Net result: 17 `any` instances removed, all analysis data is now statically typed
   - `npm run check`: clean except pre-existing `call.ts` error (unrelated)

### Architectural Fixes Applied (Iteration 6 — Issue #5: Error Handling)
5. **Error handling standardised across all 14 API routes**
   - Created `$lib/server/api-error.ts` with `apiError(status, message)` helper — thin wrapper around SvelteKit's `error()`
   - Refactored 5 routes from `return json({message}, {status})` to `throw error()`:
     - `assessment-transcript/+server.ts` (4 occurrences)
     - `create-assessment-checkout/+server.ts` (3 occurrences)
     - `create-retell-web-call/+server.ts` (2 occurrences)
     - `retell-webhook/+server.ts` (3 occurrences)
     - `send-assessment-sms/+server.ts` (4 occurrences)
   - All 14 API routes now use the same error pattern: `throw error()` for errors, `json()` for success
   - Routes already using `error()` correctly left unchanged: `end-call`, `internal/run-pipeline`, `pipeline-status`, `portal/user`, all portal routes
   - Stripe webhook intentionally keeps `text()` responses (Stripe requires specific HTTP responses)
   - Fixed pre-existing type error in `call.ts` (Retell client `on('error')` callback widening)
   - `npm run check`: 0 errors, 0 warnings

## Remaining Issues (post-Iteration 6)
- Issue #2: Portal pages repeat similar fetch patterns (low priority — portal-client.ts already centralises fetch)
### Architectural Fixes Applied (Iteration 7 — Issue #2: Portal Fetch Patterns)
2. **Portal auth context centralised — eliminated 5× copy-pasted devUserId boilerplate**
   - Created `$lib/portal-context.svelte.ts` with `usePortalAuth()` / `setPortalAuth()`
   - Portal layout sets reactive auth context once; 6 child pages consume it
   - Added `portalNavUrl(path)` helper to `portal-client.ts` for dev-mode URL construction
   - Layout nav links simplified — `portalNavUrl()` handles `?dev_user_id=` appending
   - Fixed profile page using `onMount` without auth guard → now uses `$effect` guard matching all other pages
   - `npm run check`: 0 errors, 0 warnings

## Remaining Issues (post-Iteration 7)
- Issue #3: Dead Drizzle schema + schema drift (low priority — all queries are raw SQL via working wrapper)
- Issue #6: No centralized input validation (Zod)
- Issue #7: Pipeline retry/DLQ/reliability (highest risk/reward remaining)
- Issue #8: Zero automated tests, no CI/CD

## Principles to Apply
- **DRY**: Extract common auth patterns, API wrappers, UI components
- **SOLID**: Separate concerns (auth, DB, business logic, presentation)
- **Type Safety**: Replace `any` with proper interfaces
- **Error Handling**: Consistent patterns, early returns, structured logging
- **Clean Architecture**: Domain layer independent of framework
- **Testability**: Dependency injection over direct imports

## Focus Areas
1. Create shared auth middleware/hooks ✅
2. Create shared API client for portal pages ✅
3. Extract common UI components
4. Type the database schema properly
5. Add input validation schemas (Zod)
6. Refactor pipeline for testability
7. Standardize error handling ✅

## Verification
- npm run check passes
- No regression in portal functionality
- Architecture decisions documented