/**
 * Shared portal auth context for SvelteKit portal pages.
 *
 * Provides reactive `userId`, `isDevBypass`, and `devUserId` values
 * that are set once by the portal layout and consumed by child pages.
 *
 * Usage in layout:
 * ```svelte
 * import { PortalAuthProvider } from '$lib/portal-context.svelte';
 * <PortalAuthProvider {userId} {isDevBypass} {devUserId}>
 *   {@render children?.()}
 * </PortalAuthProvider>
 * ```
 *
 * Usage in page:
 * ```svelte
 * import { usePortalAuth } from '$lib/portal-context.svelte';
 * const { userId, isDevBypass } = usePortalAuth();
 * ```
 *
 * @module $lib/portal-context
 */

import { setContext, getContext } from 'svelte';

export interface PortalAuth {
  userId: string;
  isDevBypass: boolean;
  devUserId: string;
  role: string;
}

const AUTH_KEY = Symbol('portal-auth');

export function setPortalAuth(auth: PortalAuth): void {
  setContext(AUTH_KEY, auth);
}

export function usePortalAuth(): PortalAuth {
  return getContext<PortalAuth>(AUTH_KEY);
}
