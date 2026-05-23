<script lang="ts">
  /**
   * Label — shadcn-svelte-style label primitive.
   * Wraps native <label> with design tokens.
   */

  import type { Snippet } from 'svelte';

  let {
    class: className = '',
    children,
    ...restProps
  }: {
    class?: string;
    children?: Snippet;
  } & import('svelte/elements').HTMLLabelAttributes = $props();
</script>

<label class="label {className}" {...restProps}>
  {#if children}{@render children()}{/if}
</label>

<style>
  .label {
    color: var(--color-ink);
    display: inline-block;
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1;
  }

  .label:has(+ :disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
