<script lang="ts">
  /**
   * StatusBadge — displays a workflow status, risk level, or readiness indicator.
   *
   * Variants:
   *  - status:  Maps to PresentationTone (neutral, attention, warning, danger, success, audit, disabled)
   *  - risk:    Maps to RiskSignal (none, low, medium, high, blocked)
   *  - readiness: Maps to readiness state (available, pending, unavailable, stale)
   *
   * Non-colour cues:
   *  - Icon prefix for each variant (✓ success, ⚠ warning, ✕ danger, ⊘ blocked, etc.)
   *  - Shape indicator via border-left accent for risk variants
   */

  import type { RiskSignal, PresentationTone } from '$lib/staff-portal/dto';

  export let variant: 'status' | 'risk' | 'readiness' = 'status';
  export let tone: PresentationTone = 'neutral';
  export let riskLevel: RiskSignal = 'none';
  export let readinessState: 'available' | 'pending' | 'unavailable' | 'stale' = 'available';

  /** Accessible name for screen readers (falls back to label) */
  export let accessibleName = '';
  /** Text label displayed in the badge */
  export let label = '';
  /** data-testid for stable test hook */
  export let testId = '';

  // --- Compute icon per variant ---
  function iconForStatus(t: PresentationTone): string {
    const map: Record<PresentationTone, string> = {
      neutral: '●', attention: '◉', warning: '⚠', danger: '✕',
      success: '✓', audit: '◈', disabled: '⊘'
    };
    return map[t] ?? '●';
  }

  function iconForRisk(r: RiskSignal): string {
    const map: Record<RiskSignal, string> = {
      none: '○', low: '◌', medium: '◉', high: '⚠', blocked: '⊘'
    };
    return map[r] ?? '○';
  }

  function iconForReadiness(s: string): string {
    const map: Record<string, string> = {
      available: '✓', pending: '⟳', unavailable: '⊘', stale: '⏱'
    };
    return map[s] ?? '●';
  }

  $: ariaLabel = accessibleName || label || 'status badge';
  $: icon = variant === 'status' ? iconForStatus(tone)
          : variant === 'risk' ? iconForRisk(riskLevel)
          : iconForReadiness(readinessState);

  function computeCssClass(): string {
    if (variant === 'status') return 'tone-' + tone;
    if (variant === 'risk') return 'risk-' + riskLevel;
    return 'readiness-' + readinessState;
  }

  $: cssClass = computeCssClass();
</script>

<span
  class="status-badge {cssClass}"
  class:risk-variant={variant === 'risk'}
  class:readiness-variant={variant === 'readiness'}
  role="status"
  aria-label={ariaLabel}
  data-testid={testId || 'status-badge'}
>
  <span class="badge-icon" aria-hidden="true">{icon}</span>
  {#if label}
    <span class="badge-label">{label}</span>
  {/if}
</span>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--ai-space-sm);
    padding: 2px var(--ai-space-md);
    border-radius: var(--portal-radius-sm);
    font-size: var(--ai-font-size-small-meta);
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    user-select: none;
  }

  /* Status tones */
  .tone-neutral   { color: var(--status-neutral-text); background: var(--status-neutral-bg); border: 1px solid var(--status-neutral-border); }
  .tone-attention { color: var(--status-attention-text); background: var(--status-attention-bg); border: 1px solid var(--status-attention-border); }
  .tone-warning   { color: var(--status-warning-text); background: var(--status-warning-bg); border: 1px solid var(--status-warning-border); }
  .tone-danger    { color: var(--status-danger-text); background: var(--status-danger-bg); border: 1px solid var(--status-danger-border); }
  .tone-success   { color: var(--status-success-text); background: var(--status-success-bg); border: 1px solid var(--status-success-border); }
  .tone-audit     { color: var(--status-audit-text); background: var(--status-audit-bg); border: 1px solid var(--status-audit-border); }
  .tone-disabled  { color: var(--status-disabled-text); background: var(--status-disabled-bg); border: 1px solid var(--status-disabled-border); }

  /* Risk variants — border-left accent as shape cue */
  .risk-variant { padding-left: 6px; }
  .risk-none    { color: var(--risk-none-text); background: var(--risk-none-bg); border-color: var(--risk-none-border); }
  .risk-low     { color: var(--risk-low-text); background: var(--risk-low-bg); border-color: var(--risk-low-border); }
  .risk-medium  { color: var(--risk-medium-text); background: var(--risk-medium-bg); border-color: var(--risk-medium-border); }
  .risk-high    { color: var(--risk-high-text); background: var(--risk-high-bg); border-color: var(--risk-high-border); }
  .risk-blocked { color: var(--risk-blocked-text); background: var(--risk-blocked-bg); border-color: var(--risk-blocked-border); }

  /* Readiness variants */
  .readiness-available   { color: var(--readiness-available-text); background: var(--readiness-available-bg); border: 1px solid var(--readiness-available-border); }
  .readiness-pending     { color: var(--readiness-pending-text); background: var(--readiness-pending-bg); border: 1px solid var(--readiness-pending-border); }
  .readiness-unavailable { color: var(--readiness-unavailable-text); background: var(--readiness-unavailable-bg); border: 1px solid var(--readiness-unavailable-border); }
  .readiness-stale       { color: var(--readiness-stale-text); background: var(--readiness-stale-bg); border: 1px solid var(--readiness-stale-border); }

  .badge-icon {
    font-size: var(--ai-font-size-small-meta);
    line-height: 1;
  }

  .badge-label {
    line-height: 1;
  }
</style>
