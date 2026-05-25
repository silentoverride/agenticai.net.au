<script lang="ts">
  import { fade } from 'svelte/transition';
  import { Button, Badge } from '$lib/components/ui';
  import { REPORT_STATE_PRESENTATION, BLOCKED_REASON_PRESENTATION } from '$lib/staff-portal/dto';
  import type { StaffReportReviewQueueItemDto } from '$lib/staff-portal/dto';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let queue = $derived(data.queue);
  let total = $derived(data.total);
  let hasMore = $derived(data.hasMore);
  let loading = $state(false);
  let error = $state('');

  async function refresh() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/operator/assessments?limit=50&offset=0');
      if (res.ok) {
        window.location.href = '/operator/assessments';
      } else {
        error = 'Failed to refresh queue';
      }
    } catch {
      error = 'Could not refresh queue data';
    } finally {
      loading = false;
    }
  }

  function reportStateBadgeVariant(state: string): 'default' | 'warning' | 'success' | 'danger' | 'secondary' | 'outline' {
    if (['escalated', 'inReview'].includes(state)) return 'warning';
    if (['approved'].includes(state)) return 'success';
    if (['rejected', 'conflict', 'unavailable'].includes(state)) return 'danger';
    if (['delayed', 'regenerationRequired', 'clarificationRequired'].includes(state)) return 'warning';
    return 'default';
  }

  function reviewStateBadgeVariant(s: string): 'default' | 'warning' | 'success' | 'danger' | 'secondary' | 'outline' {
    if (s === 'pending') return 'warning';
    if (s === 'inReview') return 'default';
    if (s === 'approved') return 'success';
    if (s === 'rejected') return 'danger';
    if (s === 'edited') return 'secondary';
    return 'default';
  }

  function formatAge(days: number): string {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  }

  function shortId(id: string): string {
    return id.length > 12 ? id.slice(0, 12) + '...' : id;
  }
</script>

<svelte:head>
  <title>Review Queue — Operator</title>
</svelte:head>

<div class="queue-page">
  <header class="page-header">
    <div class="header-top">
      <div>
        <h1>Report Review Queue</h1>
        <p>Assessments requiring human review — {total} total</p>
      </div>
      <Button onclick={refresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  </header>

  {#if error}
    <div class="state-banner error" role="alert">
      <p>{error}</p>
      <button class="retry-link" onclick={refresh}>Retry</button>
    </div>
  {/if}

  {#if loading && queue.length === 0}
    <div class="state-banner loading">
      <p>Loading review queue...</p>
    </div>
  {:else if !loading && queue.length === 0}
    <div class="state-banner empty">
      <p>No reports requiring review.</p>
    </div>
  {:else}
    <div class="queue-table-wrap">
      <table class="queue-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Report State</th>
            <th>Review State</th>
            <th>Blocker</th>
            <th>Owner</th>
            <th>Age</th>
            <th>Next Safe Action</th>
          </tr>
        </thead>
        <tbody>
          {#each queue as item (item.assessmentId)}
            <tr in:fade class="queue-row">
              <td class="client-cell">
                <a href="/operator/assessments/{item.assessmentId}">
                  {item.clientName}
                </a>
                <span class="mono id-hint">{shortId(item.assessmentId)}</span>
              </td>
              <td>
                <Badge variant={reportStateBadgeVariant(item.reportState)}>
                  {REPORT_STATE_PRESENTATION[item.reportState]?.label ?? item.reportState}
                </Badge>
              </td>
              <td>
                <Badge variant={reviewStateBadgeVariant(item.humanReviewState)}>
                  {item.humanReviewState}
                </Badge>
              </td>
              <td class="blocker-cell">
                {item.blockerSummary ?? '—'}
              </td>
              <td class="owner-cell">
                {item.owner ?? 'Unassigned'}
              </td>
              <td class="age-cell">
                {formatAge(item.ageDays)}
              </td>
              <td>
                <span class="action-label" class:disabled={!item.nextSafeAction.enabled}>
                  {item.nextSafeAction.label}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if hasMore}
      <div class="pagination-hint">
        <p>Showing {queue.length} of {total} items. Refine filters or increase limit.</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .queue-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .page-header h1 {
    font-size: 1.5rem;
    margin: 0;
  }

  .page-header p {
    color: var(--color-ink-muted);
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
  }

  .state-banner {
    padding: 1rem;
    border-radius: var(--radius);
    margin-bottom: 1rem;
    text-align: center;
  }

  .state-banner.error {
    background: var(--color-danger-bg, #fef2f2);
    border: 1px solid var(--color-danger, #ef4444);
    color: var(--color-danger, #b91c1c);
  }

  .state-banner.loading {
    background: var(--color-page-muted, #f9fafb);
    border: 1px solid var(--color-line);
    color: var(--color-ink-muted);
  }

  .state-banner.empty {
    background: var(--color-page-muted, #f9fafb);
    border: 1px dashed var(--color-line);
    color: var(--color-ink-muted);
  }

  .retry-link {
    background: none;
    border: none;
    color: var(--color-accent);
    text-decoration: underline;
    cursor: pointer;
    font: inherit;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .queue-table-wrap {
    overflow-x: auto;
  }

  .queue-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
  }

  .queue-table th {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--color-line);
    color: var(--color-ink-muted);
    font-weight: 600;
    font-size: 0.6875rem;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .queue-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-line);
    vertical-align: middle;
  }

  .queue-row {
    transition: background-color 0.1s;
  }

  .queue-row:hover {
    background: var(--color-page-muted, #f9fafb);
  }

  .client-cell {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .client-cell a {
    color: var(--color-accent);
    text-decoration: none;
    font-weight: 500;
  }

  .client-cell a:hover {
    text-decoration: underline;
  }

  .mono {
    font-family: monospace;
    font-size: 0.6875rem;
    color: var(--color-ink-muted);
  }

  .blocker-cell {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-ink-muted);
  }

  .owner-cell {
    color: var(--color-ink-muted);
  }

  .age-cell {
    white-space: nowrap;
    color: var(--color-ink-muted);
  }

  .action-label {
    font-weight: 500;
  }

  .action-label.disabled {
    color: var(--color-ink-muted);
    opacity: 0.7;
  }

  .pagination-hint {
    text-align: center;
    margin-top: 1rem;
    font-size: 0.8125rem;
    color: var(--color-ink-muted);
  }
</style>
