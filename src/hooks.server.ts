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
import { systemLogger } from '$lib/server/staff-portal/services/logger';
import type { Handle } from '@sveltejs/kit';

const PRIVATE_PREFIXES = ['/operator/', '/api/operator/'];

function isPrivateRoute(path: string): boolean {
  return PRIVATE_PREFIXES.some(prefix => path.startsWith(prefix));
}

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

  const response = await clerkHandler({ event, resolve });

  // Add noindex headers to all private /operator/ routes
  if (isPrivateRoute(event.url.pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  // Log permission denials on private routes
  if (isPrivateRoute(event.url.pathname) && (response.status === 401 || response.status === 403)) {
    systemLogger.permissionDenied({
      detail: `${event.request.method} ${event.url.pathname} → ${response.status}`,
      metadata: { method: event.request.method, path: event.url.pathname, status: response.status },
    });
  }

  return response;
};
