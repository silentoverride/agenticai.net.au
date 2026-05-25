<script lang="ts">
  import { fade } from 'svelte/transition';
  import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui';

  interface QueueItem {
    id: string;
    assessmentId: string;
    gateType: string;
    status: string;
    gateVerdict: string;
    gateConfidence: number;
    pipelineStatus: string;
    createdAt: string;
    gateReasoning?: string;
    operatorId?: string;
  }

  interface QueueStats {
    pending: number;
    in_review: number;
    approved: number;
    rejected: number;
    edited: number;
  }

  let queue: QueueItem[] = $state([]);
  let stats: QueueStats | null = $state(null);
  let loading = $state(true);
  let error = $state('');
  let filterStatus = $state('pending');

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    in_review: 'In Review',
    approved: 'Approved',
    rejected: 'Rejected',
    edited: 'Edited'
  };

  const VERDICT_COLORS: Record<string, string> = {
    human_assist: '#7c3aed',
    escalate: '#dc2626',
    block: '#ef4444',
    retry: '#d97706',
    approve: '#059669'
  };

  async function fetchQueue() {
    loading = true;
    error = '';
    try {
      const url = `/api/operator/human-assist${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`;
      const res = await fetch(url);
      const data = (await res.json()) as { success?: boolean; queue?: QueueItem[]; stats?: QueueStats; error?: string };
      if (data.success) {
        queue = data.queue || [];
        stats = data.stats || null;
      } else {
        error = data.error || 'Failed to fetch queue';
      }
    } catch (e) {
      error = 'Failed to fetch queue';
    } finally {
      loading = false;
    }
  }

  function shortId(id: string): string {
    return id.length > 12 ? id.slice(0, 12) + '...' : id;
  }

  function formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    } catch { return iso; }
  }

  function statusBadgeVariant(s: string): 'default' | 'warning' | 'success' | 'danger' | 'secondary' {
    if (s === 'pending') return 'warning';
    if (s === 'in_review') return 'default';
    if (s === 'approved') return 'success';
    if (s === 'rejected') return 'danger';
    if (s === 'edited') return 'secondary';
    return 'default';
  }

  function verdictBadgeVariant(v: string): 'default' | 'warning' | 'danger' | 'secondary' {
    if (v === 'human_assist') return 'warning';
    if (v === 'escalate' || v === 'block') return 'danger';
    return 'default';
  }

  $effect(() => { fetchQueue(); });
</script>

<svelte:head>
  <title>Human Assist Queue — Operator</title>
</svelte:head>

<div class="ha-page">
  <header class="page-header">
    <div class="header-top">
      <div>
        <h1>Human Assist Queue</h1>
        <p>Assessments flagged by gates for operator review</p>
      </div>
      <Button onclick={fetchQueue} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  </header>

  {#if error}
    <div class="error-banner" in:fade>{error}</div>
  {/if}

  <!-- Stats bar -->
  {#if stats}
    <div class="stats-bar" in:fade>
      <button class="stat-chip" class:active={filterStatus === 'pending'} onclick={() => { filterStatus = 'pending'; fetchQueue(); }}>
        Pending <span class="chip-count">{stats.pending}</span>
      </button>
      <button class="stat-chip" class:active={filterStatus === 'in_review'} onclick={() => { filterStatus = 'in_review'; fetchQueue(); }}>
        In Review <span class="chip-count">{stats.in_review}</span>
      </button>
      <button class="stat-chip" class:active={filterStatus === 'approved'} onclick={() => { filterStatus = 'approved'; fetchQueue(); }}>
        Approved <span class="chip-count">{stats.approved}</span>
      </button>
      <button class="stat-chip" class:active={filterStatus === 'rejected'} onclick={() => { filterStatus = 'rejected'; fetchQueue(); }}>
        Rejected <span class="chip-count">{stats.rejected}</span>
      </button>
      <button class="stat-chip" class:active={filterStatus === 'all'} onclick={() => { filterStatus = 'all'; fetchQueue(); }}>
        All
      </button>
    </div>
  {/if}

  <!-- Queue -->
  {#if loading}
    <div class="loading">Loading queue...</div>
  {:else if queue.length === 0}
    <div class="empty-state">
      <p>No {filterStatus} items in the human assist queue.</p>
    </div>
  {:else}
    <div class="queue-list" in:fade>
      {#each queue as item}
        <a href="/operator/human-assist/{item.id}" class="queue-card">
          <div class="qc-top">
            <div class="qc-meta">
              <Badge variant={verdictBadgeVariant(item.gateVerdict)}>{item.gateVerdict}</Badge>
              <Badge variant={statusBadgeVariant(item.status)}>{STATUS_LABELS[item.status]}</Badge>
            </div>
            <span class="qc-time">{formatTime(item.createdAt)}</span>
          </div>
          <div class="qc-body">
            <span class="qc-id mono">{shortId(item.assessmentId)}</span>
            <span class="qc-gate">{item.gateType.replace(/-/g, ' ')}</span>
          </div>
          <div class="qc-bottom">
            <span class="qc-confidence">Confidence: {(item.gateConfidence * 100).toFixed(0)}%</span>
            {#if item.gateReasoning}
              <p class="qc-reasoning">{item.gateReasoning.slice(0, 120)}{item.gateReasoning.length > 120 ? '...' : ''}</p>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .ha-page {
    max-width: 900px;
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
    font-size: 1.75rem;
    margin: 0;
  }

  .page-header p {
    color: var(--color-ink-muted);
    margin: 0.25rem 0 0;
  }

  .error-banner {
    padding: 0.75rem 1rem;
    background: var(--color-danger-bg, #fef2f2);
    border: 1px solid var(--color-danger, #ef4444);
    border-radius: var(--radius);
    color: var(--color-danger, #b91c1c);
    margin-bottom: 1rem;
  }

  .stats-bar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .stat-chip {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: transparent;
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .stat-chip:hover {
    border-color: var(--color-accent);
  }

  .stat-chip.active {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }

  .chip-count {
    font-weight: 600;
  }

  .loading, .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--color-ink-muted);
  }

  .queue-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .queue-card {
    display: block;
    text-decoration: none;
    padding: 1rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-page);
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .queue-card:hover {
    border-color: var(--color-accent);
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }

  .qc-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .qc-meta {
    display: flex;
    gap: 0.375rem;
  }

  .qc-time {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
  }

  .qc-body {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 0.375rem;
  }

  .qc-id {
    font-family: monospace;
    font-size: 0.8125rem;
    color: var(--color-ink);
  }

  .qc-gate {
    font-size: 0.8125rem;
    color: var(--color-ink-muted);
    text-transform: capitalize;
  }

  .qc-bottom {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .qc-confidence {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
  }

  .qc-reasoning {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
    margin: 0;
    font-style: italic;
    line-height: 1.4;
  }
</style>
