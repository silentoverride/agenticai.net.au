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

  // --- Local filter state ---
  let filterText = $state('');
  let lastFetchedAt = $state(Date.now());

  // --- Derived: stale check ---
  const staleThreshold = 300_000; // 5 minutes
  const isStale = $derived(Date.now() - lastFetchedAt > staleThreshold);

  // --- Derived: filtered items ---
  const filteredItems = $derived(
    filterText
      ? items.filter((i) => i.clientName.toLowerCase().includes(filterText.toLowerCase()))
      : items
  );

  const hasActiveFilter = $derived(filterText.length > 0);
  const filteredTotal = $derived(filteredItems.length);

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
      items: filteredItems.filter((i) => i.priorityRank === tier.rank)
    })).filter((g) => g.items.length > 0)
  );

  // --- Refresh handler ---
  function handleRefresh() {
    lastFetchedAt = Date.now();
    onRefresh();
  }
</script>

<div class="console" data-testid="command-console">
  <!-- Breadcrumbs -->
  <nav class="breadcrumbs" aria-label="Breadcrumb" data-testid="console-breadcrumbs">
    <ol>
      <li><a href="/operator">Staff Portal</a></li>
      <li aria-current="page">Command Console</li>
    </ol>
  </nav>

  <!-- Header -->
  <header class="console-header">
    <div class="header-info">
      <h1 data-testid="console-heading">Command Console</h1>
      <p class="header-summary" data-testid="console-summary">
        {hasActiveFilter ? filteredTotal : total} work item{(hasActiveFilter ? filteredTotal : total) !== 1 ? 's' : ''} requiring attention
      </p>
    </div>
    <Button onclick={handleRefresh} disabled={loading}>
      {loading ? 'Refreshing...' : 'Refresh'}
    </Button>
  </header>

  <!-- Stale-state warning -->
  {#if isStale && !loading && items.length > 0}
    <div class="stale-warning" role="status" data-testid="console-stale-warning">
      <p>The work list may have changed since last loaded. <Button variant="link" size="sm" onclick={handleRefresh}>Refresh now</Button></p>
    </div>
  {/if}

  <!-- Local filter -->
  <div class="filter-bar" data-testid="console-filter-bar">
    <label for="console-filter" class="filter-label">Filter this list</label>
    <input
      id="console-filter"
      type="search"
      bind:value={filterText}
      placeholder="Filter by client name..."
      class="filter-input"
      data-testid="console-filter-input"
    />
    {#if hasActiveFilter}
      <span class="filter-count" data-testid="console-filter-count">{filteredTotal} of {total} shown</span>
    {/if}
  </div>

  <!-- Loading state -->
  {#if loading && items.length === 0}
    <div class="state-section loading" role="status" aria-label="Loading work items" data-testid="console-loading">
      <Progress />
      <p>Loading work items...</p>
    </div>
  {/if}

  <!-- Error state -->
  {#if error && !loading}
    <div class="state-section error" role="alert" data-testid="console-error">
      <p class="error-message">{error}</p>
      <Button variant="secondary" size="sm" onclick={handleRefresh}>Retry</Button>
    </div>
  {/if}

  <!-- Empty state: no records at all -->
  {#if !loading && !error && items.length === 0 && !hasActiveFilter}
    <div class="state-section empty" data-testid="console-empty">
      <p>No work items require attention right now.</p>
    </div>
  {/if}

  <!-- Empty state: no matching results from filter -->
  {#if !loading && !error && items.length > 0 && hasActiveFilter && filteredItems.length === 0}
    <div class="state-section empty filter-empty" data-testid="console-filter-empty">
      <p>No items match your filter.</p>
    </div>
  {/if}

  <!-- Empty state: permission-limited (some items hidden by role) -->
  {#if !loading && !error && items.length === 0 && hasActiveFilter}
    <!-- already handled above -->
  {/if}

  <!-- Priority groups -->
  {#if !loading && filteredItems.length > 0}
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
          <p>Showing {filteredItems.length} of {total} items. Refine filters or increase limit.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .console {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Breadcrumbs */
  .breadcrumbs ol {
    list-style: none;
    display: flex;
    gap: 0.5rem;
    padding: 0;
    margin: 0;
    font-size: 0.8rem;
  }

  .breadcrumbs li + li::before {
    content: '›';
    margin-right: 0.5rem;
    color: var(--color-text-muted, #888);
  }

  .breadcrumbs a {
    color: var(--color-accent);
    text-decoration: none;
  }

  .breadcrumbs a:hover {
    text-decoration: underline;
  }

  .breadcrumbs [aria-current="page"] {
    color: var(--color-text, #333);
    font-weight: 600;
  }

  /* Header */
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

  /* Stale warning */
  .stale-warning {
    padding: 0.5rem 1rem;
    background: var(--color-warning-light, #fff8e1);
    border: 1px solid var(--color-warning, #f0ad4e);
    border-radius: 6px;
    font-size: 0.82rem;
  }

  .stale-warning p {
    margin: 0;
  }

  /* Filter bar */
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-label {
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .filter-input {
    flex: 1;
    max-width: 320px;
    padding: 0.4rem 0.65rem;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    outline: none;
  }

  .filter-input:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent-light, rgba(0,102,204,0.15));
  }

  .filter-count {
    font-size: 0.75rem;
    color: var(--color-text-muted, #888);
  }

  /* State sections */
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

  .filter-empty {
    border-color: var(--color-warning, #f0ad4e);
  }

  /* Priority groups */
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
