<script lang="ts">
  interface FaqItem {
    q: string;
    a: string;
  }

  interface Props {
    items: FaqItem[];
    /** "simple" = divider rows with SVG chevron (default). "card" = bordered cards with +/Q. prefix. */
    variant?: 'simple' | 'card';
    /** Optional footer slot (e.g. "View all N answers" link). Only used with variant="card". */
    footer?: import('svelte').Snippet;
    /** Accordion group name — clicking one item closes others in the same group. Only used with variant="simple". */
    name?: string;
    /** Index of the item that should start expanded. Only used with variant="card". */
    initialOpenIndex?: number;
  }

  let {
    items,
    variant = 'simple',
    footer,
    name = 'faq',
    initialOpenIndex = 0
  }: Props = $props();
</script>

<div class="faq-list faq-list-{variant}">
  {#each items as item, index}
    <details
      class="faq-item"
      name={variant === 'simple' ? name : undefined}
      open={variant === 'card' ? index === initialOpenIndex : undefined}
    >
      <summary class="faq-question">
        {#if variant === 'card'}
          <span class="faq-qmark">Q.</span>
          <span class="faq-qtext">{item.q}</span>
          <span class="faq-icon" aria-hidden="true">+</span>
        {:else}
          <span>{item.q}</span>
          <svg
            class="faq-chevron"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        {/if}
      </summary>
      <div class="faq-answer">
        <p>{item.a}</p>
      </div>
    </details>
  {/each}
</div>

{#if footer}
  {@render footer()}
{/if}

<style>
  /* ── Shared: hide default <summary> marker ─────────────────── */
  .faq-question {
    color: inherit;
    list-style: none;
  }

  .faq-question::-webkit-details-marker,
  .faq-question::marker {
    content: '';
    display: none;
  }

  /* ── Shared: focus ring on summary (keyboard a11y) ─────────── */
  .faq-question:focus-visible {
    border-radius: var(--radius-sm);
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
  }

  /* ── Simple variant (home) ───────────────────────────────── */
  .faq-list-simple {
    display: grid;
    gap: 0;
    max-width: 720px;
  }

  :global(.faq-list-simple) .faq-item,
  .faq-list-simple .faq-item {
    border-bottom: 1px solid var(--color-line);
  }

  .faq-list-simple .faq-item:first-child {
    border-top: 1px solid var(--color-line);
  }

  .faq-list-simple .faq-question {
    align-items: center;
    cursor: pointer;
    display: flex;
    font-size: 0.95rem;
    font-weight: 700;
    gap: 0.75rem;
    justify-content: space-between;
    padding: 1.15rem 0;
    transition: color 200ms ease-out;
    user-select: none;
  }

  .faq-list-simple .faq-question:hover,
  .faq-list-simple .faq-question:hover .faq-chevron {
    color: var(--color-accent-text);
  }

  .faq-list-simple .faq-chevron {
    color: var(--color-muted-2);
    flex-shrink: 0;
    transition: color 200ms ease-out, transform 200ms ease-out;
  }

  .faq-list-simple .faq-item[open] .faq-chevron {
    transform: rotate(180deg);
  }

  .faq-list-simple .faq-answer {
    padding-bottom: 1.15rem;
  }

  .faq-list-simple .faq-answer p {
    color: var(--color-muted);
    font-size: 0.9rem;
    line-height: 1.65;
    margin: 0;
    max-width: 60ch;
  }

  /* ── Card variant (services) ─────────────────────────────── */
  .faq-list-card {
    max-width: 800px;
    margin: 0 auto;
  }

  .faq-list-card .faq-item {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    margin-bottom: 0.6rem;
    overflow: hidden;
    transition: border-color 200ms ease-out;
  }

  .faq-list-card .faq-item[open] {
    border-color: var(--color-accent-mid);
  }

  .faq-list-card .faq-question {
    align-items: flex-start;
    cursor: pointer;
    display: flex;
    font-size: 0.95rem;
    font-weight: 700;
    gap: 0.6rem;
    padding: 1rem 1.2rem;
    transition: color 200ms ease-out;
  }

  .faq-list-card .faq-question:hover {
    color: var(--color-accent-text);
  }

  .faq-list-card .faq-qmark {
    color: var(--color-accent-text);
    flex-shrink: 0;
    font-weight: 800;
    letter-spacing: 0.02em;
    line-height: 1.4;
    padding-top: 0.05rem;
  }

  .faq-list-card .faq-qtext {
    flex: 1;
  }

  .faq-list-card .faq-icon {
    color: var(--color-muted-2);
    display: inline-block;
    flex-shrink: 0;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.4;
    margin-top: 0;
    padding-top: 0.05rem;
    transition: color 200ms ease-out, transform 200ms ease-out;
  }

  .faq-list-card .faq-question:hover .faq-icon {
    color: var(--color-accent-text);
  }

  .faq-list-card .faq-item[open] .faq-icon {
    color: var(--color-accent-text);
    transform: rotate(45deg);
  }

  .faq-list-card .faq-answer {
    color: var(--color-muted);
    padding: 0 1.2rem 1.2rem 1.2rem;
  }

  .faq-list-card .faq-answer p {
    font-size: 0.9rem;
    line-height: 1.65;
    margin: 0;
    max-width: 60ch;
  }

  /* ── Reduced motion: drop the open/close rotations ── */
  @media (prefers-reduced-motion: reduce) {
    .faq-list-simple .faq-chevron,
    .faq-list-card .faq-icon {
      transition: none;
    }

    .faq-list-simple .faq-item[open] .faq-chevron,
    .faq-list-card .faq-item[open] .faq-icon {
      transform: none;
    }
  }
</style>
