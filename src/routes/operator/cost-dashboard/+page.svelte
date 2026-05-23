<script lang="ts">
  import { fade } from 'svelte/transition';
  import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui';

  interface DailyCost {
    day: string;
    evaluations: number;
    withTokens: number;
  }

  interface GateCost {
    gate: string;
    count: number;
    withTokens: number;
  }

  interface PromptVersionRow {
    prompt_version: string;
    model: string | null;
    reasoning_effort: string | null;
  }

  interface VersionComparison {
    promptVersion: string;
    verdicts: Record<string, number>;
    total: number;
  }

  interface CostProjection {
    estimatedMonthlyCost: number;
    estimatedMonthlyAssessments: number;
  }

  interface CostData {
    period: string;
    costByDay: DailyCost[];
    costByGate: GateCost[];
    averageCostPerAssessment: number;
    totalCost: number;
    totalEvaluations: number;
    assessmentsProcessed: number;
    promptVersions: PromptVersionRow[];
    versionComparison: VersionComparison[];
    costProjection: CostProjection;
    fetchedAt: string;
  }

  let data: CostData | null = $state(null);
  let loading = $state(true);
  let error = $state('');
  let period = $state('week');
  let expandedVersion: string | null = $state(null);

  const GATE_LABELS: Record<string, string> = {
    'quick-wins-verification': 'Quick Wins',
    'major-project-verification': 'Major Projects',
    'report-review': 'Report Review'
  };

  const VERDICT_COLORS: Record<string, string> = {
    approve: '#059669',
    retry: '#d97706',
    block: '#ef4444',
    escalate: '#dc2626',
    human_assist: '#7c3aed'
  };

  async function fetchData() {
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/operator/cost-dashboard?period=${period}`);
      const d = await res.json();
      if (d.success) {
        data = d.dashboard;
      } else {
        error = d.error;
      }
    } catch (e) {
      error = 'Failed to load cost dashboard';
    } finally {
      loading = false;
    }
  }

  function formatCost(cents: number): string {
    if (cents < 0.01) return '$0.00';
    return `$${cents.toFixed(4)}`;
  }

  function formatShortCost(c: number): string {
    if (c < 0.01) return '<$0.01';
    return `$${c.toFixed(2)}`;
  }

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch { return iso; }
  }

  function maxDailyValue(days: DailyCost[]): number {
    return Math.max(...days.map(d => d.evaluations), 1);
  }

  $effect(() => { fetchData(); });
</script>

<svelte:head>
  <title>Cost Dashboard — Operator</title>
</svelte:head>

<div class="cd-page">
  <header class="page-header">
    <div class="header-top">
      <div>
        <h1>Cost Dashboard</h1>
        <p>LLM usage costs, token tracking, and prompt version analytics</p>
      </div>
      <div class="header-actions">
        <div class="period-selector">
          <button class="period-btn" class:active={period === 'today'} onclick={() => { period = 'today'; fetchData(); }}>Today</button>
          <button class="period-btn" class:active={period === 'week'} onclick={() => { period = 'week'; fetchData(); }}>Week</button>
          <button class="period-btn" class:active={period === 'month'} onclick={() => { period = 'month'; fetchData(); }}>Month</button>
        </div>
        <Button onclick={fetchData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    </div>
  </header>

  {#if error}
    <div class="error-banner" in:fade>{error}</div>
  {/if}

  {#if loading && !data}
    <div class="loading">Loading cost data...</div>
  {/if}

  {#if data}
    <div class="overview-grid" in:fade>
      <div class="stat-card accent">
        <span class="stat-value">{formatShortCost(data.totalCost)}</span>
        <span class="stat-label">Total Cost ({data.period})</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{formatShortCost(data.averageCostPerAssessment)}</span>
        <span class="stat-label">Avg Cost / Assessment</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{data.totalEvaluations}</span>
        <span class="stat-label">Gate Evaluations</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{data.assessmentsProcessed}</span>
        <span class="stat-label">Assessments</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{formatShortCost(data.costProjection.estimatedMonthlyCost)}</span>
        <span class="stat-label">Estimated Monthly Cost</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{data.costProjection.estimatedMonthlyAssessments}</span>
        <span class="stat-label">Monthly Projection (assessments)</span>
      </div>
    </div>

    <!-- Cost by Day (sparkline/bar) -->
    <Card>
      <CardHeader>
        <CardTitle>Cost by Day</CardTitle>
      </CardHeader>
      <CardContent>
        {#if data.costByDay.length === 0}
          <p class="empty-state">No data for this period.</p>
        {:else}
          <div class="daily-chart">
            <div class="bar-chart">
              {#each data.costByDay as day}
                <div class="bar-column">
                  <div class="bar-fill" style="height: {(day.evaluations / maxDailyValue(data.costByDay)) * 100}%"></div>
                  <span class="bar-label">{formatDate(day.day)}</span>
                  <span class="bar-count">{day.evaluations}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Cost by Gate Type -->
    <Card>
      <CardHeader>
        <CardTitle>Cost by Gate Type</CardTitle>
      </CardHeader>
      <CardContent>
        {#if data.costByGate.length === 0}
          <p class="empty-state">No gate evaluations in this period.</p>
        {:else}
          <div class="gate-cost-grid">
            {#each data.costByGate as gate}
              <div class="gate-cost-card">
                <h3>{GATE_LABELS[gate.gate] || gate.gate}</h3>
                <div class="gc-stats">
                  <span class="gc-value">{gate.count}</span>
                  <span class="gc-label">Evaluations</span>
                </div>
                <div class="gc-stats">
                  <span class="gc-value">{gate.withTokens}</span>
                  <span class="gc-label">With Tokens</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Prompt Version Registry -->
    <Card>
      <CardHeader>
        <CardTitle>Prompt Version Registry</CardTitle>
      </CardHeader>
      <CardContent>
        {#if data.promptVersions.length === 0}
          <p class="empty-state">No prompt version data available.</p>
        {:else}
          <div class="table-wrap">
            <table class="pv-table">
              <thead>
                <tr>
                  <th>Prompt Version</th>
                  <th>Model</th>
                  <th>Reasoning Effort</th>
                </tr>
              </thead>
              <tbody>
                {#each data.promptVersions as v}
                  <tr>
                    <td><Badge variant="secondary">{v.prompt_version}</Badge></td>
                    <td class="mono">{v.model || 'N/A'}</td>
                    <td>{v.reasoning_effort || 'N/A'}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Prompt Version Comparison -->
    <Card>
      <CardHeader>
        <CardTitle>Prompt Version Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {#if data.versionComparison.length === 0}
          <p class="empty-state">No version comparison data available.</p>
        {:else}
          <div class="version-compare-grid">
            {#each data.versionComparison as vc}
              <div class="version-card">
                <button class="vc-header" onclick={() => expandedVersion = expandedVersion === vc.promptVersion ? null : vc.promptVersion}>
                  <Badge variant="secondary">{vc.promptVersion}</Badge>
                  <span class="vc-total">{vc.total} evaluations</span>
                  <span class="chevron">{expandedVersion === vc.promptVersion ? '▼' : '▶'}</span>
                </button>

                {#if expandedVersion === vc.promptVersion}
                  <div class="vc-details" in:fade>
                    <div class="vc-verdict-bar">
                      {#each Object.entries(vc.verdicts) as [verdict, count]}
                        <div
                          class="vc-segment"
                          style="flex: {count}; background: {VERDICT_COLORS[verdict] || '#666'}"
                          title="{verdict}: {count} ({((count / vc.total) * 100).toFixed(0)}%)"
                        >
                          <span class="vc-seg-label">{count}</span>
                        </div>
                      {/each}
                    </div>
                    <div class="vc-legend">
                      {#each Object.entries(vc.verdicts) as [verdict, count]}
                        <span class="vc-leg-item">
                          <span class="vc-leg-dot" style="background: {VERDICT_COLORS[verdict] || '#666'}"></span>
                          {verdict}: {count} ({((count / vc.total) * 100).toFixed(0)}%)
                        </span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>

<style>
  .cd-page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .page-header {
    margin-bottom: 2rem;
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .period-selector {
    display: flex;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .period-btn {
    padding: 0.375rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .period-btn:hover {
    background: var(--color-page-muted, #f9fafb);
  }

  .period-btn.active {
    background: var(--color-accent);
    color: white;
  }

  .error-banner {
    padding: 0.75rem 1rem;
    background: #fef2f2;
    border: 1px solid #ef4444;
    border-radius: var(--radius);
    color: #b91c1c;
    margin-bottom: 1rem;
  }

  .loading, .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--color-ink-muted);
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 640px) {
    .overview-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.25rem;
    background: var(--color-page-muted, #f9fafb);
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
  }

  .stat-card.accent {
    border-color: var(--color-accent);
    background: var(--color-accent-bg, #eff6ff);
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-ink);
  }

  .stat-label {
    font-size: 0.6875rem;
    color: var(--color-ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
    text-align: center;
  }

  .daily-chart {
    padding: 0.5rem 0;
  }

  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    height: 120px;
  }

  .bar-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
  }

  .bar-fill {
    width: 100%;
    max-width: 2rem;
    background: var(--color-accent);
    border-radius: 3px 3px 0 0;
    min-height: 4px;
    transition: height 0.3s;
  }

  .bar-label {
    font-size: 0.625rem;
    color: var(--color-ink-muted);
    margin-top: 0.25rem;
    white-space: nowrap;
  }

  .bar-count {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-ink);
    margin-top: 0.125rem;
  }

  .gate-cost-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .gate-cost-card {
    padding: 1rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    text-align: center;
  }

  .gate-cost-card h3 {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
  }

  .gc-stats {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.5rem;
  }

  .gc-value {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .gc-label {
    font-size: 0.6875rem;
    color: var(--color-ink-muted);
    text-transform: uppercase;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .pv-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
  }

  .pv-table th {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--color-line);
    color: var(--color-ink-muted);
    font-weight: 600;
    font-size: 0.6875rem;
    text-transform: uppercase;
  }

  .pv-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-line);
  }

  .pv-table .mono {
    font-family: monospace;
    font-size: 0.75rem;
  }

  .version-compare-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .version-card {
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .vc-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    text-align: left;
    color: var(--color-ink);
  }

  .vc-header:hover {
    background: var(--color-page-muted, #f9fafb);
  }

  .vc-total {
    flex: 1;
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
  }

  .chevron {
    color: var(--color-ink-muted);
    font-size: 0.75rem;
  }

  .vc-details {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--color-line);
  }

  .vc-verdict-bar {
    display: flex;
    height: 1.5rem;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .vc-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
  }

  .vc-seg-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }

  .vc-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-ink-muted);
  }

  .vc-leg-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .vc-leg-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
  }
</style>
