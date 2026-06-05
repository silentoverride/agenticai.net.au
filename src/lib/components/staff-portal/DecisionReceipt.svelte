<script lang="ts">
  /**
   * DecisionReceipt — Renders a StaffActionReceiptDto as a compact
   * confirmation card after a successful action.
   *
   * Shows: receipt/event ID, affected item, previous state, resulting state,
   * actor, timestamp, rationale/reason, next owner/action, audit reference.
   */

  import { Badge } from '$lib/components/ui';
  import {
    REPORT_STATE_PRESENTATION,
    GATE_FINDING_STATE_PRESENTATION,
    REPORT_ACTION_PRESENTATION,
    GATE_FINDING_ACTION_PRESENTATION
  } from '$lib/staff-portal/dto';
  import type { StaffActionReceiptDto } from '$lib/staff-portal/dto';

  let {
    receipt,
    dismissible = false,
    onDismiss
  }: {
    receipt: StaffActionReceiptDto;
    dismissible?: boolean;
    onDismiss?: () => void;
  } = $props();

  function stateLabel(state: string): string {
    return REPORT_STATE_PRESENTATION[state as keyof typeof REPORT_STATE_PRESENTATION]?.label
      ?? GATE_FINDING_STATE_PRESENTATION[state as keyof typeof GATE_FINDING_STATE_PRESENTATION]?.label
      ?? state;
  }

  function actionLabel(action: string): string {
    return REPORT_ACTION_PRESENTATION[action as keyof typeof REPORT_ACTION_PRESENTATION]?.label
      ?? GATE_FINDING_ACTION_PRESENTATION[action as keyof typeof GATE_FINDING_ACTION_PRESENTATION]?.label
      ?? action;
  }

  function targetLabel(target: StaffActionReceiptDto['target']): string {
    if (target.type === 'gateFinding' && target.id) return `Gate Finding ${target.id.slice(0, 8)}`;
    if (target.type === 'report') return 'Report';
    return `${target.type}: ${target.id ?? '–'}`;
  }

  function formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString('en-AU', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }
</script>

<div
  class="decision-receipt"
  role="status"
  aria-live="polite"
  data-testid="decision-receipt-{receipt.id}"
>
  <div class="receipt-header">
    <span class="receipt-heading">✓ Decision Recorded</span>
    {#if dismissible && onDismiss}
      <button class="dismiss-btn" onclick={onDismiss} aria-label="Dismiss receipt">&times;</button>
    {/if}
  </div>

  <div class="receipt-body">
    <div class="receipt-row">
      <span class="receipt-label">Receipt ID</span>
      <span class="receipt-value mono">{receipt.id}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Action</span>
      <span class="receipt-value"><Badge variant="default">{actionLabel(receipt.action)}</Badge></span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Affected</span>
      <span class="receipt-value">{targetLabel(receipt.target)}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">From</span>
      <span class="receipt-value">{stateLabel(receipt.previousState)}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">To</span>
      <span class="receipt-value"><Badge variant="success">{stateLabel(receipt.resultingState)}</Badge></span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Staff</span>
      <span class="receipt-value mono">{receipt.actorId}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">When</span>
      <span class="receipt-value">{formatTime(receipt.createdAt)}</span>
    </div>
    {#if receipt.reasonCode}
      <div class="receipt-row">
        <span class="receipt-label">Reason Code</span>
        <span class="receipt-value">{receipt.reasonCode}</span>
      </div>
    {/if}
    {#if receipt.reason}
      <div class="receipt-row">
        <span class="receipt-label">Rationale</span>
        <span class="receipt-value receipt-reason">{receipt.reason}</span>
      </div>
    {/if}
    <div class="receipt-row">
      <span class="receipt-label">Audit Ref</span>
      <span class="receipt-value mono">{receipt.auditReference}</span>
    </div>
  </div>
</div>

<style>
  .decision-receipt {
    background: var(--color-success-bg);
    border: 1px solid var(--color-success);
    border-radius: var(--radius, 8px);
    padding: 0.75rem 1rem;
    margin-top: 0.5rem;
  }

  .receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .receipt-heading {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--color-success);
  }

  .dismiss-btn {
    background: none;
    border: none;
    color: var(--color-success);
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    padding: 0;
    opacity: 0.7;
  }

  .dismiss-btn:hover {
    opacity: 1;
  }

  .receipt-body {
    display: grid;
    gap: 0.35rem;
  }

  .receipt-row {
    display: flex;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }

  .receipt-label {
    color: var(--color-ink-muted);
    min-width: 6rem;
    flex-shrink: 0;
    font-weight: 500;
  }

  .receipt-value {
    color: var(--color-ink);
  }

  .receipt-value.mono {
    font-family: monospace;
    font-size: 0.75rem;
  }

  .receipt-reason {
    font-style: italic;
  }

  /* ── Accessibility ── */
  .dismiss-btn:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }
</style>
