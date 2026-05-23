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

<div class="card-content {className}" {...restProps}>
  {#if children}{@render children()}{/if}
</div>

<style>
  .card-content {
    padding: 1.25rem 1.35rem;
  }

  .card-content:first-child {
    padding-top: 1.35rem;
  }
</style>
