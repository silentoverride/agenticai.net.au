<script lang="ts">
  import { page } from '$app/stores';
  import { Badge } from '$lib/components/ui';
  import { fade } from 'svelte/transition';

  interface GateRecord {
    gateRunId: string;
    assessmentId: string;
    gateType: string;
    verdict: string;
    confidence: number;
    reasoning: string | null;
    model: string | null;
    evaluationTimeMs: number | null;
    createdAt: string;
  }

  interface Pagination {
    count: number;
    hasMore: boolean;
    nextCursor: string | undefined;
    limit: number;
  }

  interface Filters {
    gateTypes: string[];
    verdicts: string[];
  }

  interface GateResponse {
    success: boolean;
    gates: GateRecord[];
    pagination: Pagination;
    filters: Filters;
    activeFilters: { gateType: string | null; verdict: string | null };
  }

  let gates = $state<GateRecord[]>([]);
  let pagination = $state<Pagination>({ count: 0, hasMore: false, nextCursor: undefined, limit: 50 });
  let filters = $state<Filters>({ gateTypes: [], verdicts: [] });
  let activeGateType = $state<string>('');
  let activeVerdict = $state<string>('');
  let loading = $state(true);
  let error = $state('');

  const GATE_LABELS: Record<string, string> = {
    'quick-wins-verification': 'Quick Wins',
    'major-project-verification': 'Major Project',
    'report-review': 'Report Review'
  };

  const VERDICT_COLORS: Record<string, string> = {
    approve: '#059669',
    retry: '#d97706',
    block: '#ef4444',
    escalate: '#dc2626',
    human_assist: '#7c3aed'
  };

  async function fetchGates(resetCursor = true) {
    loading = true;
    error = '';
    try {
      const params = new URLSearchParams();
      if (activeGateType) params.set('gateType', activeGateType);
      if (activeVerdict) params.set('verdict', activeVerdict);
      if (!resetCursor && pagination.nextCursor) params.set('cursor', pagination.nextCursor);
      params.set('limit', String(pagination.limit));

      const res = await fetch(`/api/operator/gates?${params}`);
      const data: GateResponse = await res.json();

      if (data.success) {
        if (resetCursor) {
          gates = data.gates;
        } else {
          gates = [...gates, ...data.gates];
        }
        pagination = data.pagination;
        filters = data.filters;
      } else {
        error = 'Failed to load gate data';
      }
    } catch {
      error = 'Could not fetch gate evaluations';
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    fetchGates(true);
  }

  function loadMore() {
    fetchGates(false);
  }

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso + 'Z');
      return d.toLocaleDateString('en-AU', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }

  function shortId(id: string): string {
    return id.length > 12 ? id.slice(0, 12) + '...' : id;
  }

  $effect(() => { fetchGates(); });
</script>

<svelte:head>
  <title>Gate State View — Operator</title>
</svelte:head>

<div class="gates-page">
  <header class="page-header">
    <h1>Gate Evaluation Results</h1>
    <p>Monitor gate evaluation outcomes across all pipeline runs.</p>
  </header>

  {#if error}
    <div class="error-banner" role="alert">{error}</div>
  {/if}

  <!-- Filters -->
  <div class="filters">
    <div class="filter-group">
      <label for="gate-filter">Gate Type</label>
      <select id="gate-filter" bind:value={activeGateType}>
        <option value="">All gates</option>
        {#each filters.gateTypes as gt}
          <option value={gt}>{GATE_LABELS[gt] || gt}</option>
        {/each}
      </select>
    </div>
    <div class="filter-group">
      <label for="verdict-filter">Verdict</label>
      <select id="verdict-filter" bind:value={activeVerdict}>
        <option value="">All verdicts</option>
        {#each filters.verdicts as v}
          <option value={v}><span style="color: {VERDICT_COLORS[v] || '#666'}">{v}</span></option>
        {/each}
      </select>
    </div>
    <button class="apply-btn" onclick={applyFilters} disabled={loading}>
      {loading ? 'Loading...' : 'Apply Filters'}
    </button>
  </div>

  <!-- Gate table -->
  <div class="table-wrap">
    {#if loading && gates.length === 0}
      <p class="loading-text">Loading gate evaluations...</p>
    {:else if gates.length === 0}
      <p class="empty-text">No gate evaluations found{activeGateType || activeVerdict ? ' matching filters' : ''}.</p>
    {:else}
      <table class="gates-table" role="table">
        <thead>
          <tr>
            <th>Assessment ID</th>
            <th>Gate Type</th>
            <th>Verdict</th>
            <th>Confidence</th>
            <th>Model</th>
            <th>Time</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {#each gates as gate (gate.gateRunId)}
            <tr in:fade>
              <td class="mono" title={gate.assessmentId}>{shortId(gate.assessmentId)}</td>
              <td>{GATE_LABELS[gate.gateType] || gate.gateType}</td>
              <td>
                <Badge variant={
                  gate.verdict === 'approve' ? 'success' :
                  gate.verdict === 'block' ? 'danger' :
                  gate.verdict === 'retry' ? 'warning' :
                  'default'
                }>
                  {gate.verdict}
                </Badge>
              </td>
              <td>{(gate.confidence * 100).toFixed(0)}%</td>
              <td class="mono">{gate.model || 'N/A'}</td>
              <td class="mono">{gate.evaluationTimeMs ? `${gate.evaluationTimeMs}ms` : 'N/A'}</td>
              <td class="muted">{formatDate(gate.createdAt)}</td>
            </tr>
            {#if gate.reasoning}
              <tr in:fade>
                <td colspan="7" class="reasoning-cell">
                  <details>
                    <summary>Reasoning</summary>
                    <p class="reasoning-text">{gate.reasoning}</p>
                  </details>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <!-- Pagination -->
  {#if pagination.hasMore && gates.length > 0}
    <div class="pagination">
      <button class="load-more" onclick={loadMore} disabled={loading}>
        {loading ? 'Loading...' : `Load more (${pagination.count} shown, more available)`}
      </button>
    </div>
  {/if}
</div>

<style>
  .gates-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
    margin: 0;
  }

  .page-header p {
    color: var(--color-muted);
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
  }

  .error-banner {
    padding: 0.75rem 1rem;
    background: #fef2f2;
    border: 1px solid #ef4444;
    border-radius: var(--radius);
    color: #b91c1c;
    margin-bottom: 1rem;
  }

  .filters {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .filter-group label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .filter-group select {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    background: var(--color-panel);
    font: inherit;
    font-size: 0.8125rem;
    color: var(--color-ink);
    min-width: 140px;
  }

  .apply-btn {
    padding: 0.375rem 1rem;
    background: var(--color-accent);
    border: none;
    border-radius: var(--radius-sm);
    color: #fff;
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
  }

  .apply-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .loading-text, .empty-text {
    text-align: center;
    padding: 3rem;
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  .gates-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
  }

  .gates-table th {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--color-line);
    color: var(--color-muted);
    font-weight: 600;
    font-size: 0.6875rem;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .gates-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-line);
    vertical-align: top;
  }

  .gates-table .mono {
    font-family: monospace;
    font-size: 0.75rem;
  }

  .gates-table .muted {
    color: var(--color-muted);
    white-space: nowrap;
  }

  .reasoning-cell {
    padding: 0 0.75rem 0.5rem !important;
  }

  .reasoning-cell details {
    font-size: 0.75rem;
  }

  .reasoning-cell summary {
    cursor: pointer;
    color: var(--color-muted);
    font-weight: 600;
  }

  .reasoning-text {
    margin: 0.5rem 0 0;
    padding: 0.5rem;
    background: var(--color-page-muted, #f9fafb);
    border-radius: var(--radius-sm);
    line-height: 1.5;
    font-size: 0.75rem;
  }

  .pagination {
    text-align: center;
    margin-top: 1.5rem;
  }

  .load-more {
    padding: 0.5rem 1.5rem;
    background: transparent;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    color: var(--color-ink);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .load-more:hover {
    background: var(--color-page-muted);
  }

  .load-more:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
