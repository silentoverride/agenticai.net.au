<script lang="ts">
  /**
   * Badge — shadcn-svelte-style badge primitive.
   *
   * Variants: default | secondary | outline | success | warning | danger
   */

  import type { Snippet } from 'svelte';

  let {
    variant = 'default' as 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger',
    class: className = '',
    children,
    ...restProps
  }: {
    variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
    class?: string;
    children?: Snippet;
  } & import('svelte/elements').HTMLAttributes<HTMLSpanElement> = $props();
</script>

<span class="badge badge-{variant} {className}" {...restProps}>
  {#if children}{@render children()}{/if}
</span>

<style>
  .badge {
    border-radius: 999px;
    display: inline-flex;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1;
    padding: 0.28rem 0.65rem;
    white-space: nowrap;
    width: fit-content;
  }

  .badge-default {
    background: var(--color-accent-light);
    border: 1px solid var(--color-accent-mid);
    color: var(--color-accent);
  }

  .badge-secondary {
    background: var(--color-panel-soft);
    border: 1px solid var(--color-line);
    color: var(--color-muted);
  }

  .badge-outline {
    background: transparent;
    border: 1px solid var(--color-line);
    color: var(--color-ink);
  }

  .badge-success {
    background: #ecfdf5;
    border: 1px solid #6ee7b7;
    color: #059669;
  }

  .badge-warning {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    color: #d97706;
  }

  .badge-danger {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #dc2626;
  }
</style>
