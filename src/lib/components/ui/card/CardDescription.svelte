<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    class: className = '',
    children,
    ...restProps
  }: {
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<p class="card-description {className}" {...restProps}>
  {#if children}{@render children()}{/if}
</p>

<style>
  .card-description {
    color: var(--color-muted);
    font-size: 0.88rem;
    line-height: 1.55;
    margin: 0;
  }
</style>
