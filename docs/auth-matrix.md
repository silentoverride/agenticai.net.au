# Authentication & Authorization Matrix

**Generated:** 2026-05-30

## Clerk Integration
- Primary auth provider (`@clerk/backend`, `svelte-clerk`)
- Organizations + roles used to distinguish Staff vs Client Portal users

## Key Server Modules
- `src/lib/server/auth.ts` — Core Clerk session handling
- `src/lib/server/portal-auth.ts` — Client portal guards
- `src/lib/server/staff-auth.ts` — Staff portal + role checks
- `src/lib/server/staff-invite.ts` — Staff invitation flow

## Protected Areas
- **Portal routes** (`/portal/*`): Require valid Clerk user + portal role
- **Staff routes** (`/staff/*`): Require staff role + organization membership
- **API routes**: Most use `apiError` + auth checks; some internal use platform env bindings

## Additional Security
- Rate limiting (`rate-limiter.ts`)
- Input validation (`validation.ts`)
- Strict CSP (see svelte.config.js)
- API error standardization (`api-error.ts`)

---
*Detailed role/permission matrix and Clerk organization setup can be expanded if needed.*

---
*Generated during bmad-document-project exhaustive scan*