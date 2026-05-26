<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { goto, pushState, replaceState } from '$app/navigation';
  import { ClerkProvider as ClientClerkProvider } from 'svelte-clerk/client';

  type RouterMetadata = {
    __internal_metadata?: { navigationType?: 'internal' | 'external' | 'window' };
  };

  let {
    children,
    ...props
  }: {
    children?: Snippet;
    [key: string]: unknown;
  } = $props();

  const mergedProps = $derived({
    ...props,
    routerPush: (to: string, metadata?: RouterMetadata) => {
      if (metadata?.__internal_metadata?.navigationType === 'internal') {
        pushState(to, {});
      } else {
        goto(to);
      }
    },
    routerReplace: (to: string, metadata?: RouterMetadata) => {
      if (metadata?.__internal_metadata?.navigationType === 'internal') {
        replaceState(to, {});
      } else {
        goto(to, { replaceState: true });
      }
    }
  });
</script>

<ClientClerkProvider initialState={page?.data?.initialState} {...mergedProps as any}>
  {@render children?.()}
</ClientClerkProvider>
