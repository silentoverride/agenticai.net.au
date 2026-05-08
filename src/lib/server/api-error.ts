/**
 * Standard API error helper.
 *
 * Thin wrapper around SvelteKit's `error()` for ergonomic use in API routes.
 *
 * ```ts
 * import { apiError } from '$lib/server/api-error';
 *
 * if (!user) throw apiError(401, 'User not authenticated');
 * if (!data) throw apiError(404, 'Not found');
 * ```
 *
 * Thrown errors are caught by SvelteKit and returned as JSON with
 * shape `{ message: string }` — identical to calling `error(status, message)`
 * from `@sveltejs/kit`, but with a friendlier name for business-logic errors.
 */

import { error } from '@sveltejs/kit';

export function apiError(status: number, message: string): never {
  throw error(status, message);
}
