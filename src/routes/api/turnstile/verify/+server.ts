/**
 * POST /api/turnstile/verify
 *
 * Server-side Cloudflare Turnstile token verification.
 * Called by the client after the user solves the Turnstile challenge
 * in the orientation modal.
 *
 * @body { token: string } - The Turnstile token from the widget
 * @returns JSON { success: boolean, error?: string }
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const POST: RequestHandler = async ({ request }) => {
  const secretKey = env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not configured — allowing all requests');
    return json({ success: true, skip: true });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.token) {
    return json({ success: false, error: 'Missing token' }, { status: 400 });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', body.token);

    // Optionally include the visitor's IP for extra security
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
      formData.append('remoteip', cfConnectingIp);
    }

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const result = (await response.json()) as {
      success: boolean;
      'error-codes'?: string[];
      challenge_ts?: string;
      hostname?: string;
    };

    if (result.success) {
      console.info('[turnstile] Token verified', {
        challenge_ts: result.challenge_ts,
        hostname: result.hostname,
      });
      return json({ success: true });
    } else {
      console.warn('[turnstile] Token verification failed', {
        error_codes: result['error-codes'],
      });
      return json(
        { success: false, error: 'Verification failed', codes: result['error-codes'] },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('[turnstile] Verification request failed', err);
    return json({ success: false, error: 'Verification service unavailable' }, { status: 502 });
  }
};
