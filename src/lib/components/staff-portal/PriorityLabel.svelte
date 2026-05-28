<script lang="ts">
  /**
   * PriorityLabel — shows a priority P0-P6 badge with severity colour.
   *
   * Maps:
   *  P0 → danger (immediate/overdue)
   *  P1 → warning (high)
   *  P2 → attention (medium)
   *  P3 → attention (due-soon)
   *  P4-P6 → neutral (lower urgency)
   */

  export let priorityRank: number = 6;
  export let reason = '';
  export let testId = '';

  function priorityLabel(p: number): string {
    return `P${p}`;
  }

  function priorityCssClass(p: number): string {
    if (p <= 0) return 'priority-p0';
    if (p <= 1) return 'priority-p1';
    if (p <= 3) return 'priority-p2';
    return 'priority-normal';
  }

  $: label = priorityLabel(priorityRank);
  $: cssClass = priorityCssClass(priorityRank);
</script>

<span
  class="priority-label {cssClass}"
  role="status"
  aria-label="Priority {label}{#if reason}: {reason}{/if}"
  data-testid={testId || 'priority-label'}
>
  <span class="priority-rank">{label}</span>
  {#if reason}
    <span class="priority-reason">{reason}</span>
  {/if}
</span>

<style>
  .priority-label {
    display: inline-flex;
    align-items: center;
    gap: var(--ai-space-sm);
    font-size: var(--ai-font-size-small-meta);
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
    user-select: none;
  }

  .priority-rank {
    padding: 1px 6px;
    border-radius: var(--portal-radius-sm);
    font-variant-numeric: tabular-nums;
  }

  .priority-p0 .priority-rank {
    color: var(--status-danger-text);
    background: var(--status-danger-bg);
    border: 1px solid var(--status-danger-border);
  }

  .priority-p1 .priority-rank {
    color: var(--status-warning-text);
    background: var(--status-warning-bg);
    border: 1px solid var(--status-warning-border);
  }

  .priority-p2 .priority-rank {
    color: var(--status-attention-text);
    background: var(--status-attention-bg);
    border: 1px solid var(--status-attention-border);
  }

  .priority-normal .priority-rank {
    color: var(--status-neutral-text);
    background: var(--status-neutral-bg);
    border: 1px solid var(--status-neutral-border);
  }

  .priority-reason {
    color: var(--status-neutral-text);
    font-weight: 400;
  }
</style>
