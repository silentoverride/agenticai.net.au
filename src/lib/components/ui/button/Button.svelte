<script lang="ts">
  /**
   * Button — shadcn-svelte-style button primitive.
   *
   * Variants: primary | secondary | outline | ghost | danger | link
   * Sizes:    sm | default | lg | icon
   *
   * Renders as <button> by default, or <a> when `href` is passed.
   */

  import type { Snippet } from 'svelte';

  let {
    variant = 'default' as 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link',
    size = 'default' as 'sm' | 'default' | 'lg' | 'icon',
    href,
    disabled = false,
    class: className = '',
    children,
    ...restProps
  }: {
    variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
    size?: 'sm' | 'default' | 'lg' | 'icon';
    href?: string;
    disabled?: boolean;
    class?: string;
    children?: Snippet;
  } & import('svelte/elements').HTMLButtonAttributes = $props();
</script>

{#if href}
  <a
    {href}
    class="btn btn-{variant} btn-{size} {className}"
    role="button"
  >
    {#if children}{@render children()}{/if}
  </a>
{:else}
  <button
    {disabled}
    class="btn btn-{variant} btn-{size} {className}"
    {...restProps}
  >
    {#if children}{@render children()}{/if}
  </button>
{/if}

<style>
  /* ── Base ───────────────────────────────────────────────── */
  .btn {
    align-items: center;
    border: 1.5px solid transparent;
    border-radius: 999px;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-weight: 800;
    gap: 0.45rem;
    justify-content: center;
    text-decoration: none;
    transition:
      background 150ms ease,
      border-color 150ms ease,
      box-shadow 150ms ease,
      color 150ms ease,
      transform 150ms ease;
    white-space: nowrap;
  }

  .btn:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.3);
    outline-offset: 3px;
  }

  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    transform: none;
  }

  /* ── Sizes ───────────────────────────────────────────────── */
  .btn-sm {
    font-size: 0.8125rem;
    min-height: 2.2rem;
    padding: 0 0.85rem;
  }

  .btn-default {
    font-size: 0.95rem;
    min-height: 3rem;
    padding: 0 1.25rem;
  }

  .btn-lg {
    font-size: 1.05rem;
    min-height: 3.5rem;
    padding: 0 1.75rem;
  }

  .btn-icon {
    font-size: 0.95rem;
    height: 2.8rem;
    padding: 0;
    width: 2.8rem;
  }

  /* ── Variants ────────────────────────────────────────────── */
  .btn-primary {
    background: var(--color-accent);
    border-color: var(--color-accent-text);
    color: #fff;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-accent-2);
    border-color: var(--color-accent-2);
    transform: translateY(-1px);
  }

  .btn-default,
  .btn-secondary {
    background: var(--color-panel);
    border-color: var(--color-line);
    color: var(--color-ink);
  }

  .btn-default:hover:not(:disabled),
  .btn-secondary:hover:not(:disabled) {
    border-color: var(--color-accent-mid);
    transform: translateY(-1px);
  }

  .btn-outline {
    background: transparent;
    border-color: var(--color-line);
    color: var(--color-ink);
  }

  .btn-outline:hover:not(:disabled) {
    background: var(--color-panel-soft);
    border-color: var(--color-accent-mid);
  }

  .btn-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--color-muted);
  }

  .btn-ghost:hover:not(:disabled) {
    background: var(--color-panel-soft);
    color: var(--color-ink);
  }

  .btn-danger {
    background: #dc2626;
    border-color: #dc2626;
    color: #fff;
  }

  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
    border-color: #b91c1c;
    transform: translateY(-1px);
  }

  .btn-link {
    background: transparent;
    border-color: transparent;
    color: var(--color-accent-text);
    font-weight: 700;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .btn-link:hover:not(:disabled) {
    color: var(--color-accent-2);
  }
</style>
