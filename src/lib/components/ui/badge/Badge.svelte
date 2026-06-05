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
    color: var(--color-accent-text);
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
    color: #047857; /* 5.21:1 on #ecfdf5 — was #059669 (3.58:1, fail) */
  }

  .badge-warning {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    color: #b45309; /* 4.51:1 on #fffbeb — was #d97706 (3.07:1, fail) */
  }

  .badge-danger {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #b91c1c; /* 5.21:1 on #fef2f2 — was #dc2626 (4.41:1, borderline) */
  }
</style>
