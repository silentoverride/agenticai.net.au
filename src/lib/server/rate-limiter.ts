/**
 * Simple in-memory rate limiter for login / auth attempts.
 *
 * Tracks attempts by IP address within a sliding window.
 * Not persisted — resets on server restart (acceptable for pilot).
 */

const attempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now >= entry.resetAt) {
    // New window
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetAt: now + WINDOW_MS };
  }

  entry.count += 1;
  const remaining = Math.max(0, MAX_ATTEMPTS - entry.count);
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining, resetAt: entry.resetAt };
}

/** Middleware-friendly: check rate limit and throw 429 if exceeded. */
export function requireRateLimit(ip: string): void {
  const result = checkRateLimit(ip);
  if (!result.allowed) {
    const err = new Error('Too many requests') as any;
    err.status = 429;
    err.headers = {
      'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      'X-RateLimit-Remaining': '0',
    };
    throw err;
  }
}
