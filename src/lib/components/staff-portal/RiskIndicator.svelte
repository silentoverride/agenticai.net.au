<script lang="ts">
  /**
   * RiskIndicator — displays a risk severity level with icon + label.
   *
   * Levels: none, low, medium, high, blocked
   * Non-colour cue: icon per level + label text
   */

  import type { RiskSignal } from '$lib/staff-portal/dto';

  export let level: RiskSignal = 'none';
  export let label = '';
  export let showLabel = true;
  export let accessibleName = '';
  export let testId = '';

  const RISK_ICONS: Record<RiskSignal, string> = {
    none: '○', low: '◌', medium: '◉', high: '⚠', blocked: '⊘'
  };

  const RISK_LABELS: Record<RiskSignal, string> = {
    none: 'Normal', low: 'Low', medium: 'Medium', high: 'High', blocked: 'Blocked'
  };

  $: icon = RISK_ICONS[level];
  $: displayLabel = label || (showLabel ? RISK_LABELS[level] : '');
  $: ariaLabel = accessibleName || displayLabel || `Risk: ${level}`;
  $: cssClass = `risk-${level}`;
</script>

<span
  class="risk-indicator {cssClass}"
  role="status"
  aria-label={ariaLabel}
  data-testid={testId || 'risk-indicator'}
>
  <span class="risk-icon" aria-hidden="true">{icon}</span>
  {#if displayLabel}
    <span class="risk-label">{displayLabel}</span>
  {/if}
</span>

<style>
  .risk-indicator {
    display: inline-flex;
    align-items: center;
    gap: var(--ai-space-sm);
    font-size: var(--ai-font-size-small-meta);
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
    user-select: none;
  }

  .risk-none    { color: var(--risk-none-text); }
  .risk-low     { color: var(--risk-low-text); }
  .risk-medium  { color: var(--risk-medium-text); }
  .risk-high    { color: var(--risk-high-text); }
  .risk-blocked { color: var(--risk-blocked-text); }

  .risk-icon {
    font-size: var(--ai-font-size-body);
    line-height: 1;
  }

  .risk-label {
    font-weight: 500;
  }
</style>
