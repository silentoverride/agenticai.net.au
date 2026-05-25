<script lang="ts">
  /**
   * CommandConsole — route-level composition for prioritized operational work.
   *
   * Renders a prioritized list of PriorityWorkItemRow components grouped
   * by priority tier with loading, empty, and error states.
   *
   * Props:
   *   items: StaffCommandCenterItemDto[] — from getCommandCenterItems
   *   total: number — total matching items
   *   hasMore: boolean — whether more items exist beyond current page
   *   loading: boolean — whether data is being fetched
   *   error: string — error message if load failed
   *   onRefresh: () => void — callback to refresh data
   */

  import PriorityWorkItemRow from './priority-work-item-row.svelte';
  import { Button, Progress } from '$lib/components/ui';
  import type { StaffCommandCenterItemDto } from '$lib/staff-portal/dto';

  let {
    items = [] as StaffCommandCenterItemDto[],
    total = 0,
    hasMore = false,
    loading = false,
    error = '',
    onRefresh = () => {}
  }: {
    items: StaffCommandCenterItemDto[];
    total: number;
    hasMore: boolean;
    loading: boolean;
    error: string;
    onRefresh: () => void;
  } = $props();

  // --- Priority tier labels and grouping ---

  const PRIORITY_TIERS: { rank: number; label: string; description: string }[] = [
    { rank: 1, label: 'Escalated / Blocked', description: 'Reports requiring immediate human intervention' },
    { rank: 2, label: 'Delayed / Stalled', description: 'Reports with generation delays' },
    { rank: 3, label: 'Ready for Review', description: 'Reports needing an approval decision' },
    { rank: 4, label: 'Completed', description: 'Reports needing a delivery decision' },
    { rank: 5, label: 'Routine', description: 'Other work items requiring attention' }
  ];

  const groupedItems = $derived(
    PRIORITY_TIERS.map((tier) => ({
      tier,
      items: items.filter((i) => i.priorityRank === tier.rank)
    })).filter((g) => g.items.length > 0)
  );
</script>

<div class="console" data-testid="command-console">
  <!-- Header -->
  <header class="console-header">
    <div class="header-info">
      <h1 data-testid="console-heading">Command Console</h1>
      <p class="header-summary" data-testid="console-summary">
        {total} work item{total !== 1 ? 's' : ''} requiring attention
      </p>
    </div>
    <Button onclick={onRefresh} disabled={loading}>
      {loading ? 'Refreshing...' : 'Refresh'}
    </Button>
  </header>

  <!-- Loading state -->
  {#if loading && items.length === 0}
    <div class="state-section loading" role="status" aria-label="Loading work items" data-testid="console-loading">
      <Progress value={null} />
      <p>Loading work items...</p>
    </div>
  {/if}

  <!-- Error state -->
  {#if error && !loading}
    <div class="state-section error" role="alert" data-testid="console-error">
      <p class="error-message">{error}</p>
      <Button variant="secondary" size="sm" onclick={onRefresh}>Retry</Button>
    </div>
  {/if}

  <!-- Empty state -->
  {#if !loading && !error && items.length === 0}
    <div class="state-section empty" data-testid="console-empty">
      <p>No work items require attention right now.</p>
    </div>
  {/if}

  <!-- Priority groups -->
  {#if !loading && items.length > 0}
    <div class="console-list" role="list" aria-label="Prioritized work items">
      {#each groupedItems as group (group.tier.rank)}
        <div class="priority-group" data-testid="priority-group-{group.tier.rank}">
          <div class="group-header">
            <h2 class="group-title">{group.tier.label}</h2>
            <span class="group-count">{group.items.length}</span>
            <p class="group-desc">{group.tier.description}</p>
          </div>
          {#each group.items as item (item.workItemId)}
            <PriorityWorkItemRow {item} />
          {/each}
        </div>
      {/each}

      {#if hasMore}
        <div class="pagination-hint" data-testid="console-pagination-hint">
          <p>Showing {items.length} of {total} items. Refine filters or increase limit.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .console {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .console-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .header-info h1 {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
  }

  .header-summary {
    font-size: 0.85rem;
    color: var(--color-text-secondary, #555);
    margin: 0;
  }

  .state-section {
    padding: 2rem 1rem;
    text-align: center;
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }

  .state-section p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: var(--color-text-secondary, #555);
  }

  .error-message {
    color: var(--color-danger, #c00);
  }

  .console-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .priority-group {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .group-header {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: var(--color-surface-secondary, #f8f8f8);
    border-bottom: 1px solid var(--color-border);
  }

  .group-title {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0;
  }

  .group-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted, #888);
  }

  .group-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted, #888);
    margin: 0 0 0 auto;
  }

  .pagination-hint {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    color: var(--color-text-muted, #888);
    text-align: center;
  }
</style>
