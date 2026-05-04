/**
 * Server Hook — Clerk Authentication
 *
 * Wraps most incoming requests with Clerk session verification,
 * but skips public API routes used by the voice agent, webhooks,
 * and external services (they don't carry Clerk session tokens).
 *
 * @module hooks.server
 */

import { withClerkHandler } from 'svelte-clerk/server';
import { setD1Binding } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';

const PUBLIC_API_PREFIXES = [
  '/api/create-retell-web-call',
  '/api/create-assessment-checkout',
  '/api/retell-webhook',
  '/api/assessment-transcript',
  '/api/send-assessment-sms',
  '/api/stripe/webhook',
  '/api/test-',
];

function isPublicApi(path: string): boolean {
  return PUBLIC_API_PREFIXES.some(prefix => path.startsWith(prefix));
}

const clerkHandler = withClerkHandler();

export const handle: Handle = async ({ event, resolve }) => {
  // Wire Cloudflare D1 binding when available (production / preview)
  const d1 = (event.platform as Record<string, any>)?.env?.assessment_db;
  if (d1) {
    setD1Binding(d1);
  }

  if (isPublicApi(event.url.pathname)) {
    return resolve(event);
  }
  return clerkHandler({ event, resolve });
};
