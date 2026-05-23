<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    as = 'h3' as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
    class: className = '',
    children,
    ...restProps
  }: {
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<svelte:element this={as} class="card-title {className}" {...restProps}>
  {#if children}{@render children()}{/if}
</svelte:element>

<style>
  .card-title {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0;
    line-height: 1.25;
    margin: 0;
    max-width: none;
  }
</style>
