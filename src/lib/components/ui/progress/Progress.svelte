<script lang="ts">
  /**
   * Progress — shadcn-svelte-style progress bar primitive.
   * Uses the native <progress> element for accessibility.
   */

  let {
    value = 0,
    max = 100,
    class: className = '',
    ...restProps
  }: {
    value?: number;
    max?: number;
    class?: string;
  } & import('svelte/elements').ProgressHTMLAttributes<HTMLProgressElement> = $props();

  const pct = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
</script>

<div class="progress-wrap {className}">
  <progress {value} {max} class="progress-native" {...restProps}></progress>
  <div class="progress-track">
    <div class="progress-fill" style="width: {pct}%" role="presentation"></div>
  </div>
</div>

<style>
  .progress-wrap {
    width: 100%;
  }

  .progress-native {
    height: 0;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    width: 0;
  }

  .progress-track {
    background: var(--color-line);
    border-radius: 999px;
    height: 0.5rem;
    overflow: hidden;
    width: 100%;
  }

  .progress-fill {
    background: linear-gradient(90deg, var(--color-accent-2), var(--color-accent));
    border-radius: 999px;
    height: 100%;
    transition: width 300ms ease;
  }
</style>
