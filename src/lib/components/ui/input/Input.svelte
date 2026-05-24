<script lang="ts">
  /**
   * Input — shadcn-svelte-style input primitive.
   * Extends the native <input> element with design tokens.
   */

  let {
    class: className = '',
    ...restProps
  }: {
    class?: string;
  } & import('svelte/elements').HTMLInputAttributes = $props();
</script>

<input class="input {className}" {...restProps} />

<style>
  .input {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    color: var(--color-ink);
    font: inherit;
    font-size: 0.95rem;
    height: 2.8rem;
    padding: 0 1rem;
    transition: border-color 150ms ease, box-shadow 150ms ease;
    width: 100%;
  }

  .input::placeholder {
    color: var(--color-muted-2);
  }

  .input:focus {
    border-color: var(--color-accent);
    outline: 3px solid rgba(37, 99, 235, 0.15);
    outline-offset: 2px;
  }

  .input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
