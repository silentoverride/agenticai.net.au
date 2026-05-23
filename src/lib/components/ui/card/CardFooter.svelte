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

<div class="card-footer {className}" {...restProps}>
  {#if children}{@render children()}{/if}
</div>

<style>
  .card-footer {
    align-items: center;
    border-top: 1px solid var(--color-line);
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    padding: 1rem 1.35rem;
  }
</style>
