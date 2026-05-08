/**
 * Portal API client for SvelteKit frontend pages.
 *
 * Automatically appends `?dev_user_id=` when running in local development
 * so that portal pages can be tested without Clerk authentication.
 *
 * @module $lib/portal-client
 */

function devUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('dev_user_id');
}

function buildUrl(path: string): string {
  const id = devUserId();
  if (!id) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}dev_user_id=${encodeURIComponent(id)}`;
}

export async function portalGet(path: string): Promise<Response> {
  return fetch(buildUrl(path));
}

export async function portalPost(
  path: string,
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function portalPut(
  path: string,
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(buildUrl(path), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function portalDelete(path: string): Promise<Response> {
  return fetch(buildUrl(path), { method: 'DELETE' });
}

/**
 * Build a portal navigation URL with ?dev_user_id appended in dev bypass mode.
 * Use in Svelte components for `<a href={...}>` links.
 *
 * @example
 * ```svelte
 * <a href={portalNavUrl(`/portal/${userId}/reports`)}>Reports</a>
 * ```
 */
export function portalNavUrl(path: string): string {
  const id = devUserId();
  if (!id) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}dev_user_id=${encodeURIComponent(id)}`;
}
