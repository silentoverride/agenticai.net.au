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

<div class="card-header {className}" {...restProps}>
  {#if children}{@render children()}{/if}
</div>

<style>
  .card-header {
    align-items: center;
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
    padding: 1.25rem 1.35rem 0;
  }
</style>
