<script lang="ts">
  /**
   * DisabledActionPattern — shows a disabled action with:
   *  - Action name
   *  - Missing condition (what's blocking it)
   *  - Why it's unsafe
   *  - Safe alternative action
   */

  export let actionName = '';
  export let missingCondition = '';
  export let whyUnsafe = '';
  export let safeAlternative = '';
  export let testId = '';

  /**
   * Optional: allow the safe alternative to be clickable (only when explicitly enabled)
   */
  export let onAlternativeClick: (() => void) | null = null;
</script>

<div
  class="disabled-action"
  role="status"
  aria-label="{actionName} is disabled: {missingCondition}"
  data-testid={testId || 'disabled-action'}
>
  <div class="disabled-header">
    <span class="disabled-icon" aria-hidden="true">⊘</span>
    <span class="disabled-name">{actionName}</span>
  </div>

  <dl class="disabled-details">
    <div class="detail-row">
      <dt>Missing</dt>
      <dd>{missingCondition}</dd>
    </div>
    <div class="detail-row">
      <dt>Why unsafe</dt>
      <dd>{whyUnsafe}</dd>
    </div>
  </dl>

  {#if safeAlternative}
    <div class="safe-alternative">
      <span class="alt-icon" aria-hidden="true">✓</span>
      {#if onAlternativeClick}
        <button
          type="button"
          class="alt-link"
          on:click={onAlternativeClick}
        >
          {safeAlternative}
        </button>
      {:else}
        <span class="alt-text">{safeAlternative}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .disabled-action {
    padding: var(--ai-space-lg);
    border-radius: var(--portal-radius-md);
    background: var(--status-disabled-bg);
    border: 1px solid var(--status-disabled-border);
    font-size: var(--ai-font-size-body);
    line-height: var(--ai-line-height-body);
  }

  .disabled-header {
    display: flex;
    align-items: center;
    gap: var(--ai-space-sm);
    margin-bottom: var(--ai-space-sm);
  }

  .disabled-icon {
    font-size: var(--ai-font-size-section-title);
    color: var(--status-disabled-icon);
  }

  .disabled-name {
    font-weight: 600;
    color: var(--status-disabled-text);
  }

  .disabled-details {
    margin: 0 0 var(--ai-space-md) var(--ai-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--ai-space-xs);
  }

  .detail-row {
    display: flex;
    gap: var(--ai-space-sm);
    font-size: var(--ai-font-size-small-meta);
  }

  .detail-row dt {
    font-weight: 600;
    color: var(--status-neutral-text);
    min-width: 80px;
  }

  .detail-row dd {
    margin: 0;
    color: var(--status-disabled-text);
  }

  .safe-alternative {
    display: flex;
    align-items: center;
    gap: var(--ai-space-sm);
    padding: var(--ai-space-sm) var(--ai-space-md);
    border-radius: var(--portal-radius-sm);
    background: var(--status-success-bg);
    border: 1px solid var(--status-success-border);
  }

  .alt-icon {
    color: var(--status-success-text);
    font-size: var(--ai-font-size-body);
  }

  .alt-link {
    background: none;
    border: none;
    color: var(--status-success-text);
    font-size: var(--ai-font-size-small-meta);
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  .alt-link:hover {
    opacity: 0.8;
  }

  .alt-link:focus-visible {
    box-shadow: var(--portal-focus-ring);
    border-radius: 2px;
  }

  .alt-text {
    color: var(--status-success-text);
    font-size: var(--ai-font-size-small-meta);
    font-weight: 600;
  }
</style>
