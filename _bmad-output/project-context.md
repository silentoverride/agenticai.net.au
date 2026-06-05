---
project_name: 'agenticai-net-au'
user_name: 'Lorin'
date: '2026-06-05'
sections_completed: ['discovery', 'technology_stack', 'language_specific', 'framework_specific', 'testing', 'code_organization', 'design_skill_integration']
status: 'complete'
existing_patterns_found: 14
rule_count: 85
optimized_for_llm: true
input_sources:
  - package.json
  - tsconfig.json
  - vite.config.ts
  - vitest.config.ts
  - svelte.config.js
  - wrangler.toml
  - README.md
  - src/hooks.server.ts
  - src/lib/server/db.ts
  - src/lib/server/auth.ts
  - src/lib/server/portal-auth.ts
  - src/lib/server/operator-auth.ts
  - src/lib/styles/DESIGN_SYSTEM.md
  - src/lib/styles/design-tokens.ts
  - src/styles.css
  - src/routes/api/operator/human-assist/+server.ts
  - src/routes/portal/+layout.svelte
  - src/routes/operator/gates/+page.svelte
  - src/routes/staff/**
  - src/lib/components/staff-portal/**
  - tests/**/*.test.ts
  - migrations/*.sql
  - workers/queue-consumer.ts
  - .pi/skills/impeccable/SKILL.md
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- SvelteKit `^2.20.0` with Svelte `^5.28.0`; use SvelteKit file-based routing and Svelte 5 runes/component patterns for new code.
- `@sveltejs/vite-plugin-svelte ^5.1.0` and `svelte-check ^4.1.6` are part of the Svelte 5 compatibility surface.
- Vite `^6.3.4`; build target is `esnext`, with explicit SSR `noExternal` entries for Cloudflare compatibility.
- TypeScript `^5.8.3` with `strict: true`, `allowJs: true`, `checkJs: true`, `moduleResolution: bundler`, and Cloudflare worker types.
- Project uses ESM via `"type": "module"`; avoid CommonJS patterns.
- Deploy target is Cloudflare Pages via `@sveltejs/adapter-cloudflare ^7.2.8`; do not switch to `adapter-auto`.
- Pages build output is `.svelte-kit/cloudflare`; deploy uses `wrangler pages deploy`.
- Wrangler is `^4.86.0`; root `wrangler.toml` uses `compatibility_date = "2026-04-29"` and `nodejs_compat`.
- Cloudflare bindings are exact: D1 `assessment_db`, R2 `assessment_blobs`, Queue producer `assessment_queue`; access production bindings through `event.platform.env`, not `process.env`.
- Worker config is separate under `workers/wrangler.toml`; queue consumer handles `assessment-jobs` and uses worker `env`.
- Local DB fallback uses `better-sqlite3 ^12.9.0`; production uses Cloudflare D1 through the async DB facade. Never import or execute `better-sqlite3` in Cloudflare runtime code.
- Clerk auth uses `@clerk/backend ^3.4.4` and `svelte-clerk ^1.1.5`.
- Vitest `^3.0.0` includes only `tests/**/*.test.ts`, targets `es2022`, with 60s test timeout and 120s hook timeout.
- Retell, Stripe, Twilio, SendGrid, Perplexity, Ollama/Kimi, and Calendly are external API integrations unless their SDKs are explicitly added to `package.json`; prefer existing fetch/API patterns.

## Critical Implementation Rules

### Language-Specific Rules

- Use TypeScript ESM imports/exports; the project is `"type": "module"` and uses bundler module resolution.
- Server-only code belongs under `src/lib/server/`, SvelteKit server routes, or `.server.ts` modules. Never value-import server modules into `.svelte`, `+page.ts`, `+layout.ts`, or shared `$lib` modules used by client code.
- If shared code only needs server-side types, use `import type` or move DTO/types into `$lib/types`; never create runtime imports of `$lib/server/*` just for types.
- Use `.server.ts` / `.client.ts` suffixes when a module must be restricted to one runtime.
- Guard browser globals (`window`, `document`, `localStorage`, media APIs) with `onMount`, `browser`, or `typeof window !== 'undefined'` because Svelte components SSR.
- Treat Cloudflare bindings as request/runtime values: SvelteKit routes/hooks use `event.platform.env`; Worker code uses the Worker `env` argument. Do not read production D1/R2/Queue bindings from `process.env`.
- Do not capture request/user-specific values or Cloudflare bindings in module-level state; Worker isolates can be reused across requests.
- Keep database operations async even for local SQLite; use the `AsyncDb` facade instead of calling `better-sqlite3` directly from business logic.
- Keep Node-only APIs (`fs`, `path`, `Buffer`, Node `crypto`) inside server-only/local fallback code unless Cloudflare compatibility is explicit.
- Ensure data returned from `load` functions and API boundaries is plain serializable DTO data; never return DB handles, Cloudflare bindings, `Response`, functions, class instances, or platform objects.
- Use SvelteKit `error(...)` for auth/permission failures where framework errors are intended; use `json({ success, error }, { status })` for API endpoints that already follow structured success/error bodies.
- Parse request JSON as `unknown`, assert it is an object, then validate. Avoid `(await request.json()) as T` or `request.json<T>()` patterns without runtime validation.
- Prefer Zod schemas for non-trivial request bodies and derive TypeScript types from schemas.
- Preserve strict null handling: database nullable fields are `T | null`, not optional unless the value is truly absent.
- In tests and shared utilities, keep Cloudflare-specific types explicit. Prefer narrow typed fakes with `satisfies` / `Pick<>` over broad `as any`.

### Framework-Specific Rules

- Use SvelteKit file conventions: UI routes in `+page.svelte`, layouts in `+layout.svelte`, server-only loads/actions in `+page.server.ts` / `+layout.server.ts`, and API endpoints in `+server.ts`.
- New Svelte components should use Svelte 5 patterns: `$props()`, `$state`, `$derived`, event attributes like `onclick`, and `{@render children?.()}` for snippets. Avoid legacy `export let`, `on:click`, and `<slot>` unless matching nearby code.
- Use `$effect` only for real effects; prefer `$derived` for route/query/state-derived values to avoid stale locals.
- Use `$app/state` for page state in Svelte 5 code; avoid introducing legacy `$app/stores` unless matching nearby existing code.
- Universal `+page.ts` / `+layout.ts` can run on both server and client; do not access secrets, `$lib/server/*`, Clerk server helpers, Cloudflare bindings, or `event.platform` there.
- Use `+page.server.ts`, `+layout.server.ts`, `+server.ts`, or `.server.ts` whenever code needs auth state, private env, D1/R2/Queue, internal secrets, or Cloudflare platform objects.
- `src/hooks.server.ts` applies Clerk to all routes except the documented public API allowlist; bypassed public/webhook routes must validate their own signatures, secrets, timestamps, or replay protection before trusting payloads.
- Do not add public API routes to the Clerk bypass list unless they are webhooks/external callbacks or explicitly unauthenticated; prefer exact allowlists over broad prefixes.
- Any Clerk bypass allowlist change requires tests proving protected routes reject unauthenticated access.
- SvelteKit endpoint exports should use framework handler signatures/types; destructure from the `RequestEvent` rather than inventing custom handler signatures.
- Access Cloudflare D1/R2/Queue bindings through `event.platform?.env` in SvelteKit routes; Worker code uses the Worker `env` argument.
- If a production route requires D1/R2/Queue, fail explicitly when the binding is missing; local/test behavior should use typed fakes or existing local fallback patterns, never production resources.
- Do not create module-level caches/singletons for request-scoped bindings, users, sessions, or platform objects; Cloudflare isolates are reused.
- Preserve the configured CSP in `svelte.config.js`; adding third-party scripts, frames, media, websockets, or API origins usually requires updating CSP directives.
- Use SvelteKit `json(...)` for API responses and preserve existing structured `{ success: true/false, ... }` response shapes.
- For portal routes, preserve dev bypass behavior using `dev_user_id` only outside production; production must ignore or reject `dev_user_id`.
- Portal navigation/API calls should use existing helpers such as `portalGet` and `portalNavUrl` so dev-bypass query propagation is not lost.
- Do not move queue-heavy or long-running work into Pages request handlers; use the Worker/Queue pipeline and internal callback pattern.
- Queue messages must contain plain serializable data only; do not enqueue `Request`, `Response`, bindings, DB handles, class instances, or functions.

### Testing Rules

- Use Vitest for current automated tests; configured include pattern is `tests/**/*.test.ts`.
- Run targeted tests with `vitest run tests/<area>/...` or existing scripts such as `npm run test:gate`; run `npm run check` for Svelte/TypeScript validation.
- Keep tests ESM/TypeScript and use `$lib` alias imports, matching `vitest.config.ts`.
- Prefer testing real exported pure functions and service boundaries over duplicating implementation logic inside tests.
- For SvelteKit endpoints, test handler behavior with typed fake `RequestEvent` objects, including `platform.env` when D1/R2/Queue bindings are required.
- Cloudflare D1/R2/Queue tests must use narrow typed fakes or local fallback patterns; never use production resources.
- Tests for routes requiring bindings must cover missing-binding behavior: explicit error response, 503/degraded response, or documented local fallback.
- Auth/security tests must cover unauthenticated access, Clerk bypass allowlist behavior, webhook/internal secret validation, and production rejection of `dev_user_id`.
- Request-body tests must cover malformed JSON, missing fields, wrong primitive types, `null`, and unexpected extra fields for non-trivial APIs.
- Preserve structured API response assertions: `{ success: true, ... }` and `{ success: false, error }` should be tested with status codes.
- For queue/pipeline logic, test idempotency, retry/error paths, serializable message payload shape, and that long-running work is not performed synchronously in Pages handlers.
- For payment/webhook flows, test idempotency, invalid transitions, failed events, and signature/secret failure paths.
- Avoid broad `as any` in tests; use `satisfies`, `Pick<>`, or small local interfaces for fakes.
- Test factories should produce complete typed domain objects with `Partial<T>` overrides and unique IDs to avoid nullable/optional drift and parallel-test collisions.
- CSP-affecting changes should include regression evidence for required script/frame/connect/media origins and no unexpected CSP violations.

### Code Organization Rules

- Keep browser/UI code in `src/routes/**` and `src/lib/components/**`; keep server-only business logic, service clients, auth helpers, and DB access in `src/lib/server/**`.
- Shared client-safe types belong in `src/lib/types.ts` or a client-safe `$lib` module; do not import from `$lib/server/**` for shared DTOs.
- Keep portal auth flow centralized: use `src/lib/server/auth.ts`, `portal-auth.ts`, `operator-auth.ts`, and `src/lib/portal-client.ts` instead of duplicating Clerk/dev-bypass logic in routes.
- Keep database access behind `src/lib/server/db.ts` and domain stores/services; do not call D1 or `better-sqlite3` directly from UI routes or components.
- Keep local SQLite schema initialization in `src/lib/server/db.ts` synchronized with `migrations/*.sql` when schema changes.
- Assessment pipeline code belongs under `src/lib/server/assessment/**`; route handlers should stay thin and delegate to pipeline/store/service modules.
- R2 artifact key conventions belong in the relevant store modules, not ad hoc string construction in routes.
- Operator-specific pages and APIs stay under `src/routes/operator/**` and `src/routes/api/operator/**`; protect operator actions through the shared operator auth helper.
- Portal pages/APIs stay under `src/routes/portal/**` and `src/routes/api/portal/**`; preserve portal helper usage for dev-bypass propagation.
- Local shadcn-style primitives live under `src/lib/components/ui/**` and are exported through `src/lib/components/ui/index.ts`; do not add an external shadcn package unless explicitly requested.
- Design tokens are defined in `src/styles.css` and documented in `src/lib/styles/design-tokens.ts`; prefer token usage over hard-coded one-off colors/spacing in new shared UI.
- Queue consumer code belongs under `workers/**`; add new queue stages as separate files in `workers/stages/` and register them in `workers/stages/index.ts`.
- Keep Worker stage handlers independent and serializable: stage input/output should be plain data, with dependencies passed via Worker `env`/`ctx`.
- Tests should mirror feature areas under `tests/<area>/*.test.ts`; avoid placing test-only helpers in production modules unless they are useful typed factories.

### Design System & Skill Integration

- The public site's design tokens are defined in `src/styles.css` and documented in `src/lib/styles/design-tokens.ts`. The `:root` block now exposes: `--color-warning: #d97706`, `--color-page-muted: #f1f5f9`, `--color-danger: #b91c1c`, `--color-danger-bg: #fef2f2`, `--color-success-bg: #f0fdf4`, `--color-accent-bg: #eff6ff` (added 2026-06-05). New shared UI must resolve colors through these tokens, not via `var(--color-*, #hex)` fallback patterns.
- The `/staff/*` routes and `/lib/components/staff-portal/*` are still on a separate, hard-coded design system (6+ undefined tokens including `--color-text`, `--color-text-muted`, `--color-border`, `--color-bg`; ~30+ hard-coded colors; do not respond to `data-theme=dark`). New staff-portal code must either (a) include a token-migration story, or (b) explicitly document the divergence; do not silently extend the hard-coded palette.
- For any new page or major UI change, use the `impeccable` skill (`.pi/skills/impeccable/SKILL.md`). Required setup: run `node .pi/skills/impeccable/scripts/context.mjs` once per session, read the matching `reference/<command>.md` for the chosen sub-command, and read the `register` reference (`reference/brand.md` for marketing/landing surfaces, `reference/product.md` for app/admin/tool surfaces).
- Canonical Impeccable chain for a new page: `/impeccable shape` → `/impeccable craft` → `/impeccable layout` → `/impeccable adapt` → `/impeccable live` → `/impeccable critique` → `/impeccable polish` → `/impeccable audit`. `/impeccable audit` is the acceptance gate (0 axe-core violations on desktop 1280 + mobile 393; touch targets ≥ 44px on mobile; mobile-adapted nav sheet pattern).
- P0 absolute bans on new UI: no `border-left` side-stripes (tag pills, split sections, dark columns, CTA panels); no decorative gradients (section headings, opportunity maps, lane tracks); no banned hex literals (purple `#7c3aed`, indigo `#6366f1`) — use `var(--color-*)` tokens.
- AI-tell patterns to avoid: big-number hero metric (e.g. `8.5 hrs / week`) + 3 progress bars, 4 stacked uppercase eyebrows, ranked "quick wins" lists, editorial-typographic lane scaffolding.
- Verification rule: read the changed region back after every edit; do not trust the tool's success message alone (lesson from the 2026-06-05 audit where a prior polish session's edit claim was a false success).
- For new pages introduced mid-sprint, route the change through the `bmad-correct-course` skill first; the Sprint Change Proposal's Section 4 should name the Impeccable sub-command chain and the P0/AI-tell/token rules as acceptance criteria.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code in this project.
- Follow all rules exactly as documented; when in doubt, prefer the more restrictive option.
- When the `impeccable` skill is active, its required setup (`context.mjs` + `reference/<command>.md` + `register` reference) supersedes this file's design rules only where the skill explicitly says so.
- Update this file if a new pattern emerges that future agents would otherwise miss.

**For Humans:**

- Keep this file lean and focused on agent needs; remove rules that become obvious over time.
- Update `date`, `rule_count`, and `input_sources` whenever a section changes.
- Bump `rule_count` and re-scan after any audit/polish pass that codifies new bans or tokens.
- Review quarterly for outdated rules (especially version pins and skill-version references).

Last Updated: 2026-06-05
