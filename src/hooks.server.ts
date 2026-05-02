/**
 * Server Hook — Clerk Authentication
 *
 * Wraps every incoming request with Clerk session verification via
 * `withClerkHandler()` from `svelte-clerk/server`. This populates
 * `event.locals.auth` (a function that returns session state) and
 * `event.locals.user` (the Clerk user object) so that downstream
 * routes can gate access without re-implementing JWT verification.
 *
 * Requires environment variables:
 * - `CLERK_SECRET_KEY` — Backend API key from Clerk Dashboard.
 * - `PUBLIC_CLERK_PUBLISHABLE_KEY` — Frontend publishable key (also used server-side for request validation).
 *
 * @module hooks.server
 * @see https://clerk.com/docs/references/sveltekit/overview
 * @example
 * // In any +page.server.ts or +server.ts
 * export const load = async ({ locals }) => {
 *   const auth = locals.auth();
 *   if (!auth.userId) throw redirect(307, '/portal');
 *   return { user: locals.user };
 * };
 */

import { withClerkHandler } from 'svelte-clerk/server';

/** SvelteKit server hook that authenticates every request through Clerk. */
export const handle = withClerkHandler();
