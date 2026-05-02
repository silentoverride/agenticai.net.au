# Client Portal

The Agentic AI client portal gives paying customers a password-protected area to view their AI Business Assessment reports as interactive slide decks, download their PPTX files, and access their Stripe receipts. Authentication is handled by Clerk.

## What the Portal Does

- **Sign-in / Sign-up** — Customers authenticate via Clerk (Google OAuth or email/password).
- **Report Viewer** — Assessment reports are rendered as interactive reveal.js presentations matching the PPTX template structure.
- **Receipts** — Stripe payment receipts are stored and downloadable, even if the customer paid before creating their portal account.
- **Calendly CTA** — Every report ends with a "Book Your Complimentary 30-Min Session" button.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Clerk     │────▶│   Portal    │────▶│  reveal.js deck │
│   (auth)    │     │   (Svelte)  │     │  (12 slides)    │
└─────────────┘     └─────────────┘     └─────────────────┘
        │                   │
        ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  SQLite DB  │     │  API routes │
│  (users,    │     │  (/api/portal/*)│
│   reports,  │     └─────────────┘
│   receipts) │
└─────────────┘
```

## Database Schema

Three tables in `app_data/portal.db`:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Portal users synced from Clerk | `clerk_id`, `email`, `name`, `phone` |
| `user_reports` | Links users to assessment reports | `user_id`, `report_id`, `deck_url`, `title` |
| `receipts` | Stripe payment records | `user_id` (nullable), `stripe_session_id`, `amount_cents`, `receipt_url` |

The `receipts.user_id` column is nullable so receipts can be stored **before** the customer signs up for the portal. When they later sign in, pending receipts are auto-linked by matching email address.

## API Reference

### Database (`src/lib/server/db.ts`)

#### `getDb(): Database.Database`

Returns the shared SQLite database instance. Creates the file and runs schema migration on first call.

```typescript
import { getDb } from '$lib/server/db';

const db = getDb();
const row = db.prepare('SELECT * FROM users WHERE clerk_id = ?').get('user_123');
```

**Returns:** `Database.Database` (better-sqlite3 instance)

**Throws:** `Error` if the database file cannot be created (permissions, disk full, etc.)

### Portal Logic (`src/lib/server/portal.ts`)

#### `upsertUser(clerkId, email, name?, phone?): DbUser`

Inserts or updates a user from Clerk authentication data. Non-destructive — existing values are kept if new ones are empty.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clerkId` | `string` | Yes | Clerk user ID (e.g. `user_abc123`) |
| `email` | `string` | Yes | Email from Clerk session |
| `name` | `string` | No | Display name |
| `phone` | `string` | No | Phone number |

```typescript
const user = upsertUser('user_123', 'alice@example.com', 'Alice Smith');
```

#### `linkReportToUser(userId, reportId, stripeSessionId?, deckUrl?, title?, company?): DbReport`

Associates a generated assessment report with a portal user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string` | Yes | Clerk user ID |
| `reportId` | `string` | Yes | Report directory name |
| `stripeSessionId` | `string` | No | Stripe Checkout session ID |
| `deckUrl` | `string` | No | Presenton PPTX export URL |
| `title` | `string` | No | Human-readable title |
| `company` | `string` | No | Company name |

```typescript
const report = linkReportToUser(
  'user_123',
  'report-456',
  'cs_test_xxx',
  'https://presenton.ai/exports/...',
  'Acme — AI Assessment',
  'Acme Inc'
);
```

#### `saveReceipt(userId, stripeSessionId, amountCents, currency, ...): DbReceipt`

Stores a Stripe payment receipt. Idempotent — duplicate `stripe_session_id` values update `amount_cents`, `currency`, and `receipt_url` instead of creating a new row.

```typescript
const receipt = saveReceipt(
  'user_123',
  'cs_test_xxx',
  120000,        // $1,200.00 AUD in cents
  'aud',
  'alice@example.com',
  'Alice Smith',
  'Acme Inc'
);
```

#### `savePendingReceipt(stripeSessionId, amountCents, currency, ...): DbReceipt`

Stores a receipt **without** a `user_id`. Used when a customer pays before signing up for the portal. The receipt is linked later via `linkPendingReceiptsByEmail()`.

#### `scanAndLinkReportsByEmail(userId, email): number`

Scans the filesystem report directories and links any reports whose `customerEmail` matches the given email. Called automatically on portal login.

**Returns:** `number` — count of newly linked reports.

```typescript
const linked = scanAndLinkReportsByEmail('user_123', 'alice@example.com');
console.log(`Linked ${linked} historical reports`);
```

#### `linkPendingReceiptsByEmail(userId, email): number`

Links pending receipts (`user_id IS NULL`) to a user by matching `customer_email`. Called automatically on portal login.

**Returns:** `number` — count of newly linked receipts.

### API Routes

#### `GET /api/portal/reports`

Returns all reports for the authenticated user. Auto-links orphan records on first load.

**Auth required:** Yes (Clerk session cookie)

**Response:** `DbReport[]`

**Errors:**
- `401` — Not authenticated

```javascript
const res = await fetch('/api/portal/reports');
if (res.status === 401) { /* redirect to sign-in */ }
const reports = await res.json();
```

#### `GET /api/portal/reports/[id]`

Returns a single report with its full analysis JSON for the reveal.js viewer.

**Auth required:** Yes

**Response:** `DbReport & { analysis: object }`

**Errors:**
- `401` — Not authenticated
- `404` — Report not found or not owned

```javascript
const res = await fetch(`/api/portal/reports/${reportId}`);
const data = await res.json();
console.log(data.analysis.pain_points);
```

#### `GET /api/portal/receipts`

Returns all receipts for the authenticated user.

**Auth required:** Yes

**Response:** `DbReceipt[]`

**Errors:**
- `401` — Not authenticated

#### `GET /api/portal/receipts/[id]/download`

Redirects to the Stripe-hosted receipt URL if available, otherwise returns a JSON receipt payload.

**Auth required:** Yes

**Response:** `302 redirect` or `JSON receipt`

**Errors:**
- `401` — Not authenticated
- `404` — Receipt not found or not owned

```javascript
window.open(`/api/portal/receipts/${receiptId}/download`, '_blank');
```

## Usage

### Adding the Portal to the Navigation

The `Navigation.svelte` component already includes conditional Sign In / Portal / Sign Out buttons based on Clerk auth state:

```svelte
{#if clerk.auth.userId != null}
  <a href="/portal" class="portal-link">Portal</a>
  <button class="nav-signout" onclick={() => clerk.clerk?.signOut()}>Sign Out</button>
{:else}
  <button class="nav-signin" onclick={() => clerk.clerk?.openSignIn()}>Sign In</button>
{/if}
```

### Wrapping the App in ClerkProvider

The root `+layout.svelte` wraps the application in `<ClerkProvider>`:

```svelte
<script>
  import { ClerkProvider } from 'svelte-clerk';
  import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
</script>

<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
  <slot />
</ClerkProvider>
```

### Rendering a Report with RevealDeck

```svelte
<script>
  import RevealDeck from '$lib/components/RevealDeck.svelte';

  let report = { analysis: { /* assessment JSON */ }, company: 'Acme Inc' };
</script>

<RevealDeck analysis={report.analysis} company={report.company} />
```

### Adding a Calendly Button

```svelte
<script>
  import CalendlyButton from '$lib/components/CalendlyButton.svelte';
</script>

<CalendlyButton />
```

## Configuration

### Required Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLERK_SECRET_KEY` | *(required)* | Backend API key from Clerk Dashboard |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | *(required)* | Frontend publishable key |
| `PUBLIC_CALENDLY_URL` | *(required)* | Your Calendly booking link |
| `DB_DIR` | `./app_data` | Directory for SQLite database |
| `REPORTS_DIR` | `./app_data/reports` | Directory where assessment reports are stored |

### CSP Headers

The portal requires additional domains in `svelte.config.js`:

```javascript
const config = {
  kit: {
    csp: {
      directives: {
        'script-src': ['self', '*.clerk.accounts.dev', 'assets.calendly.com'],
        'connect-src': ['self', 'api.clerk.com', '*.clerk.accounts.dev', 'calendly.com'],
        'img-src': ['self', 'img.clerk.com', '*.clerk.com'],
        'frame-src': ['self', 'calendly.com', '*.calendly.com']
      }
    }
  }
};
```

### Database Configuration

The SQLite database uses WAL (Write-Ahead Logging) mode for better concurrent read performance. The schema is forward-compatible with Cloudflare D1 migration:

- All primary keys are `TEXT` (D1 does not auto-increment integers reliably)
- All foreign keys use `ON DELETE CASCADE`
- Timestamps are stored as ISO-8601 strings

## Error Handling

### Authentication Errors

| Scenario | HTTP Status | Response | Action |
|----------|-------------|----------|--------|
| No session cookie | `401` | `{ message: "Not authenticated" }` | Redirect to `/portal` (SignIn page) |
| Invalid/expired token | `401` | Same as above | Clerk SDK auto-refreshes; if still invalid, re-authenticate |
| Clerk API down | `500` | SvelteKit error page | Retry or show offline message |

### Database Errors

| Scenario | Cause | Handling |
|----------|-------|----------|
| Disk full | SQLite cannot write | Logs error; API returns `500` |
| Permission denied | `DB_DIR` not writable | Startup crash; fix directory permissions |
| Corrupt meta.json | Invalid JSON in report directory | Skipped during `scanAndLinkReportsByEmail()`; logged as warning |
| Missing report JSON | `analysis.json` deleted after linking | `GET /api/portal/reports/[id]` returns `analysis: null` |

### Stripe Receipt Errors

| Scenario | Handling |
|----------|----------|
| Webhook delivered before user signs up | Receipt saved as pending; linked on first login |
| Duplicate webhook delivery | Idempotent `ON CONFLICT` update — no duplicate rows |
| Missing `receipt_url` | API returns JSON payload instead of redirect |

### reveal.js Errors

| Scenario | Handling |
|----------|----------|
| CSS load failure | Static imports at build time — should not occur |
| `container` ref not ready | Guarded by `if (!container) return;` in `onMount` |
| Invalid analysis JSON | Component renders empty slides; error logged to console |

## Slide Structure

The reveal.js deck maps assessment JSON to 12 slides:

1. **Title** — Company name + assessment date
2. **Executive Summary** — Pain points + desired outcome
3. **Opportunity at a Glance** — Hours reclaimable, quick-win count, effort level
4. **Impact-Effort Matrix** — Four quadrants (Low Effort / High Impact, etc.)
5-8. **Recommended Solutions** — Up to 4 quick wins with tool URLs from Futurepedia
9. **4-Day Quick Wins Plan** — Day-by-day implementation schedule
10. **What Comes After Quick Wins** — 3 deeper opportunities with investment estimates
11. **Financial Impact** — Weekly time returned, monthly ROI, tool costs
12. **Next Steps + Calendly CTA** — Implementation steps + book 30-min session button

## Auto-Linking Behaviour

When a customer pays via Stripe **before** signing up for the portal:

1. **Payment webhook** (`/api/stripe/webhook`) saves the receipt as **pending** (`user_id IS NULL`).
2. **Report pipeline** (`runReportPipeline`) stores report metadata with `customerEmail` on the filesystem.
3. **First portal login** — `GET /api/portal/reports` triggers:
   - `scanAndLinkReportsByEmail()` — scans filesystem for matching emails
   - `linkPendingReceiptsByEmail()` — links pending receipts by email
4. Dashboard immediately shows the full history.

## Migration Notes

- The SQLite schema is designed to be forward-compatible with **Cloudflare D1**.
- `clerk_id` is the primary key in `users` — D1-friendly text-based ID.
- When migrating to D1, replace `better-sqlite3` with the Cloudflare Workers D1 binding and update `getDb()` to return the D1 database object.
- The `receipts.receipt_url` field stores Stripe-hosted receipt URLs. If you switch to Stripe's PDF receipt generation, store the PDF URL here instead.

## Troubleshooting

### "Not authenticated" on every request
- Check `CLERK_SECRET_KEY` is set and valid.
- Verify the `__session` cookie is being sent (CSP `connect-src` must include Clerk domains).
- Ensure `hooks.server.ts` is using `withClerkHandler()` from `svelte-clerk/server`.

### Reports not appearing after payment
- Check `customerEmail` is being passed to `runReportPipeline()`.
- Verify the report metadata file (`meta.json`) contains `job.customerEmail`.
- Look for `scanAndLinkReportsByEmail` log entries in the server console.

### Calendly button not opening
- Verify `PUBLIC_CALENDLY_URL` is set in `.env`.
- Check browser console for CSP violations (`frame-src` must include `calendly.com`).
- If the widget script fails to load, the button falls back to opening Calendly in a new tab.
