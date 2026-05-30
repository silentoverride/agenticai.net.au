<script lang="ts">
  /**
   * Command Center — prioritized work queue for staff members.
   *
   * Server-side priority derivation via getCommandCenterItems().
   * Client renders rows with StatusBadge, PriorityLabel, RiskIndicator, OwnerChip.
   */

  import type { PageData } from './$types';
  import type { StaffCommandCenterItemDto } from '$lib/staff-portal/dto';
  import StatusBadge from '$lib/components/staff-portal/StatusBadge.svelte';
  import PriorityLabel from '$lib/components/staff-portal/PriorityLabel.svelte';
  import OwnerChip from '$lib/components/staff-portal/OwnerChip.svelte';

  let { data }: { data: PageData } = $props();

  // svelte-ignore state_referenced_locally
  let items = $state<StaffCommandCenterItemDto[]>(data.items ?? []);
  // svelte-ignore state_referenced_locally
  let total = $state<number>(data.total ?? 0);
  // svelte-ignore state_referenced_locally
  let hasMore = $state<boolean>(data.hasMore ?? false);

  // Compute counts per priority group
  let p0Count = $derived(items.filter(i => i.priorityRank === 0).length);
  let p1Count = $derived(items.filter(i => i.priorityRank === 1).length);
  let needsAttention = $derived(p0Count + p1Count);

  function workTypeIcon(type: string): string {
    const icons: Record<string, string> = { report: '📄', 'follow-up': '📋', meeting: '📅', 'commercial': '💰' };
    return icons[type] ?? '●';
  }

  function toneFromState(state: string): 'neutral' | 'attention' | 'warning' | 'danger' | 'success' {
    const dangerStates = ['escalated', 'conflict', 'blocked'];
    const warningStates = ['inReview', 'pending', 'delayed'];
    const successStates = ['approved', 'resolved', 'completed'];
    if (dangerStates.includes(state)) return 'danger';
    if (warningStates.includes(state)) return 'warning';
    if (successStates.includes(state)) return 'success';
    return 'neutral';
  }
</script>

<div class="command-center" data-testid="command-center">
  <header class="cc-header">
    <div>
      <h2 class="cc-title">Command Center</h2>
      <p class="cc-subtitle">
        {total} work items
        {#if needsAttention > 0}
          <span class="cc-attention">— {needsAttention} need attention</span>
        {/if}
      </p>
    </div>
    <div class="cc-summary">
      <span class="summary-chip danger">P0: {p0Count}</span>
      <span class="summary-chip warning">P1: {p1Count}</span>
    </div>
  </header>

  {#if items.length === 0}
    <div class="cc-empty" data-testid="command-center-empty">
      <p class="empty-icon" aria-hidden="true">✓</p>
      <h3>All clear</h3>
      <p>No work items require attention right now. Check back later or review recent activity.</p>
    </div>
  {:else}
    <div class="cc-queue" role="list" aria-label="Work queue">
      {#each items as item (item.clientName + '-' + item.workItemId)}
        <a
          href="/staff/staff/clients/{item.workItemId}"
          class="work-item-row"
          data-testid="work-item-row"
        >
          <div class="row-left">
            <span class="work-type-icon" aria-hidden="true">{workTypeIcon(item.workItemType)}</span>
            <div class="row-primary">
              <div class="row-client">{item.clientName}</div>
              <div class="row-meta">
                <StatusBadge variant="status" tone={toneFromState(item.lifecycleState)} label={item.lifecycleState} />
                <span class="row-work-type-text">{item.workItemType}</span>
              </div>
            </div>
          </div>

          <div class="row-center">
            <PriorityLabel priorityRank={item.priorityRank} reason={item.priorityReason} />
          </div>

          <div class="row-right">
            <OwnerChip ownerName={item.owner ?? ''} />
            {#if item.dueDate}
              <span class="row-due" aria-label="Due {item.dueDate}">
                {item.dueDate}
              </span>
            {/if}
          </div>
        </a>
      {/each}
    </div>

    {#if hasMore}
      <div class="cc-has-more">
        <p>Showing first 50 items. Refine filters to see more.</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .command-center {
    max-width: 960px;
    margin: 0 auto;
    padding: var(--ai-space-lg) var(--ai-space-lg);
  }

  .cc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--ai-space-xl);
    padding-bottom: var(--ai-space-lg);
    border-bottom: 1px solid var(--portal-surface-border);
  }

  .cc-title {
    font-size: var(--ai-font-size-page-title);
    font-weight: var(--ai-font-weight-page-title);
    line-height: var(--ai-line-height-page-title);
    margin: 0 0 var(--ai-space-xs);
    color: var(--color-ink);
    font-family: var(--portal-font-sans);
  }

  .cc-subtitle {
    margin: 0;
    font-size: var(--ai-font-size-body);
    color: var(--color-muted);
  }

  .cc-attention {
    color: var(--status-warning-text);
    font-weight: 600;
  }

  .cc-summary {
    display: flex;
    gap: var(--ai-space-sm);
  }

  .summary-chip {
    font-size: var(--ai-font-size-small-meta);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    padding: 2px 8px;
    border-radius: var(--portal-radius-sm);
  }

  .summary-chip.danger {
    color: var(--status-danger-text);
    background: var(--status-danger-bg);
  }

  .summary-chip.warning {
    color: var(--status-warning-text);
    background: var(--status-warning-bg);
  }

  /* Empty state */
  .cc-empty {
    text-align: center;
    padding: var(--ai-space-3xl) var(--ai-space-lg);
    border-radius: var(--portal-radius-lg);
    background: var(--portal-surface-bg);
    border: 1px solid var(--portal-surface-border);
  }

  .empty-icon {
    font-size: 2rem;
    margin: 0 0 var(--ai-space-md);
    color: var(--status-success-text);
  }

  .cc-empty h3 {
    font-size: var(--ai-font-size-section-title);
    font-weight: 600;
    margin: 0 0 var(--ai-space-sm);
  }

  .cc-empty p {
    margin: 0;
    color: var(--color-muted);
    font-size: var(--ai-font-size-body);
  }

  /* Queue */
  .cc-queue {
    display: flex;
    flex-direction: column;
    gap: var(--ai-space-sm);
  }

  /* Work item row */
  .work-item-row {
    display: flex;
    align-items: center;
    gap: var(--ai-space-lg);
    padding: var(--ai-space-md) var(--ai-space-lg);
    border-radius: var(--portal-radius-md);
    background: var(--portal-surface-bg);
    border: 1px solid var(--portal-surface-border);
    text-decoration: none;
    color: inherit;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
  }

  .work-item-row:hover {
    box-shadow: var(--portal-shadow-md);
    border-color: var(--color-accent-mid);
  }

  .work-item-row:focus-visible {
    box-shadow: var(--portal-focus-ring);
    outline: none;
  }

  .row-left {
    display: flex;
    align-items: center;
    gap: var(--ai-space-md);
    flex: 1;
    min-width: 0;
  }

  .work-type-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .row-primary {
    min-width: 0;
  }

  .row-client {
    font-weight: 600;
    font-size: var(--ai-font-size-body);
    line-height: var(--ai-line-height-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-meta {
    display: flex;
    align-items: center;
    gap: var(--ai-space-sm);
    margin-top: 2px;
  }

  .row-work-type-text {
    font-size: var(--ai-font-size-small-meta);
    color: var(--color-muted);
    text-transform: capitalize;
  }

  .row-center {
    flex-shrink: 0;
  }

  .row-right {
    display: flex;
    align-items: center;
    gap: var(--ai-space-sm);
    flex-shrink: 0;
  }

  .row-due {
    font-size: var(--ai-font-size-small-meta);
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
  }

  /* Has more */
  .cc-has-more {
    text-align: center;
    padding: var(--ai-space-lg);
    color: var(--color-muted);
    font-size: var(--ai-font-size-small-meta);
  }

  .cc-has-more p {
    margin: 0;
  }
</style>
