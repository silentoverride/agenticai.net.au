<script lang="ts">
  import { fade, slide } from 'svelte/transition';
  import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui';

  interface TodayStats {
    total_assessments: number;
    completed: number;
    in_progress: number;
    failed: number;
  }

  interface PerGateStat {
    gate_type: string;
    total_evaluations: number;
    avg_confidence: number;
    avg_latency_ms: number;
    last_run: string;
  }

  interface RecentAssessment {
    session_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    attempts: number;
    gate_count: number;
  }

  interface VerdictDistEntry {
    gate_type: string;
    verdict: string;
    count: number;
  }

  interface QueueEntry {
    status: string;
    count: number;
  }

  interface DashboardData {
    today: TodayStats;
    perGate: PerGateStat[];
    recentAssessments: RecentAssessment[];
    verdictDistribution: VerdictDistEntry[];
    queueDepth: QueueEntry[];
    avgPipelineDurationSeconds: number;
    fetchedAt: string;
  }

  let data: DashboardData | null = $state(null);
  let loading = $state(true);
  let error = $state('');
  let autoRefresh = $state(true);
  let refreshInterval: ReturnType<typeof setInterval> | undefined;

  const GATE_LABELS: Record<string, string> = {
    'quick-wins-verification': 'Quick Wins',
    'major-project-verification': 'Major Projects',
    'report-review': 'Report Review'
  };

  const STATUS_COLORS: Record<string, string> = {
    completed: 'var(--color-success, #059669)',
    ready: 'var(--color-success, #059669)',
    delivered: 'var(--color-success, #059669)',
    queued: 'var(--color-accent, #2563eb)',
    generating: 'var(--color-accent, #2563eb)',
    pending: 'var(--color-accent, #2563eb)',
    delayed: 'var(--color-warning, #d97706)',
    human_assist: 'var(--color-warning, #d97706)',
    failed: 'var(--color-danger, #ef4444)',
    error: 'var(--color-danger, #ef4444)',
    retry: 'var(--color-warning, #d97706)'
  };

  const VERDICT_COLORS: Record<string, string> = {
    approve: '#059669',
    retry: '#d97706',
    block: '#ef4444',
    escalate: '#dc2626',
    human_assist: '#7c3aed'
  };

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/operator/dashboard');
      const d = await res.json();
      if (d.success) {
        data = d.dashboard;
      } else {
        error = d.error || 'Failed to load dashboard';
      }
    } catch (e) {
      error = 'Dashboard request failed';
    } finally {
      loading = false;
    }
  }

  function shortId(id: string): string {
    return id.length > 12 ? id.slice(0, 12) + '...' : id;
  }

  function formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }

  function statusBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'secondary' {
    if (['completed', 'ready', 'delivered'].includes(status)) return 'success';
    if (['failed', 'error'].includes(status)) return 'danger';
    if (['delayed', 'human_assist', 'retry'].includes(status)) return 'warning';
    return 'secondary';
  }

  function getVerdictDistribution(gateType: string, verdict: string): VerdictDistEntry | undefined {
    return data?.verdictDistribution.find(v => v.gate_type === gateType && v.verdict === verdict);
  }

  function totalForGate(gateType: string): number {
    return data?.verdictDistribution
      .filter(v => v.gate_type === gateType)
      .reduce((sum, v) => sum + v.count, 0) || 0;
  }

  $effect(() => {
    fetchDashboard();
    if (autoRefresh) {
      refreshInterval = setInterval(fetchDashboard, 30000);
      return () => {
        if (refreshInterval) clearInterval(refreshInterval);
      };
    }
  });
</script>

<svelte:head>
  <title>Operator Dashboard — Gate & Pipeline Health</title>
</svelte:head>

<div class="dashboard-page">
  <header class="page-header">
    <div class="header-top">
      <div>
        <h1>Operator Dashboard</h1>
        <p>Pipeline and gate health monitoring</p>
      </div>
      <div class="header-actions">
        <label class="toggle-label">
          <input type="checkbox" bind:checked={autoRefresh} />
          Auto-refresh (30s)
        </label>
        <Button onclick={fetchDashboard} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
    </div>
    {#if data}
      <p class="last-fetched">Last updated: {formatTime(data.fetchedAt)}</p>
    {/if}
  </header>

  {#if error}
    <div class="error-banner" in:fade>{error}</div>
  {/if}

  {#if loading && !data}
    <div class="loading" in:fade>Loading dashboard data...</div>
  {/if}

  {#if data}
    <!-- Today's Overview -->
    <div class="overview-grid" in:fade>
      <div class="stat-card">
        <span class="stat-value">{data.today.total_assessments}</span>
        <span class="stat-label">Assessments Today</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: var(--color-success, #059669)">{data.today.completed}</span>
        <span class="stat-label">Completed</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: var(--color-accent)">{data.today.in_progress}</span>
        <span class="stat-label">In Progress</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: var(--color-danger, #ef4444)">{data.today.failed}</span>
        <span class="stat-label">Failed</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{formatDuration(data.avgPipelineDurationSeconds)}</span>
        <span class="stat-label">Avg Duration</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">
          {data.queueDepth.reduce((s, q) => s + q.count, 0)}
        </span>
        <span class="stat-label">Queue Depth</span>
      </div>
    </div>

    <!-- Per-Gate Breakdown -->
    <Card>
      <CardHeader>
        <CardTitle>Per-Gate Health</CardTitle>
      </CardHeader>
      <CardContent>
        {#if data.perGate.length === 0}
          <p class="empty-state">No gate evaluations today.</p>
        {:else}
          <div class="gate-grid">
            {#each data.perGate as gate}
              <div class="gate-card">
                <h3>{GATE_LABELS[gate.gate_type] || gate.gate_type}</h3>
                <div class="gate-stats">
                  <div class="gate-stat">
                    <span class="gs-value">{gate.total_evaluations}</span>
                    <span class="gs-label">Runs</span>
                  </div>
                  <div class="gate-stat">
                    <span class="gs-value">{(gate.avg_confidence * 100).toFixed(0)}%</span>
                    <span class="gs-label">Avg Conf</span>
                  </div>
                  <div class="gate-stat">
                    <span class="gs-value">{gate.avg_latency_ms}ms</span>
                    <span class="gs-label">Avg Latency</span>
                  </div>
                </div>

                <!-- Verdict distribution bar -->
                {#if totalForGate(gate.gate_type) > 0}
                  <div class="verdict-bar">
                    {#each ['approve', 'retry', 'block', 'escalate', 'human_assist'] as verdict}
                      {@const entry = getVerdictDistribution(gate.gate_type, verdict)}
                      {#if entry && entry.count > 0}
                        <div
                          class="verdict-segment"
                          style="
                            flex: {entry.count};
                            background: {VERDICT_COLORS[verdict]};
                          "
                          title="{verdict}: {entry.count}"
                        >
                          <span class="segment-label">{entry.count}</span>
                        </div>
                      {/if}
                    {/each}
                  </div>
                  <div class="verdict-legend">
                    {#each ['approve', 'retry', 'block', 'escalate', 'human_assist'] as verdict}
                      {@const entry = getVerdictDistribution(gate.gate_type, verdict)}
                      {#if entry && entry.count > 0}
                        <span class="legend-item">
                          <span class="legend-dot" style="background: {VERDICT_COLORS[verdict]}"></span>
                          {verdict}: {entry.count}
                        </span>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Recent Assessments -->
    <Card>
      <CardHeader>
        <CardTitle>Recent Assessments</CardTitle>
      </CardHeader>
      <CardContent>
        {#if data.recentAssessments.length === 0}
          <p class="empty-state">No recent assessments.</p>
        {:else}
          <div class="table-wrap">
            <table class="assessments-table">
              <thead>
                <tr>
                  <th>Assessment ID</th>
                  <th>Status</th>
                  <th>Gates</th>
                  <th>Attempts</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {#each data.recentAssessments as a}
                  <tr>
                    <td class="mono">{shortId(a.session_id)}</td>
                    <td>
                      <Badge variant={statusBadgeVariant(a.status)}>{a.status}</Badge>
                    </td>
                    <td>{a.gate_count}</td>
                    <td>{a.attempts}</td>
                    <td class="mono">{formatTime(a.updated_at)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Queue Depth -->
    <Card>
      <CardHeader>
        <CardTitle>Queue Depth by Status</CardTitle>
      </CardHeader>
      <CardContent>
        {#if data.queueDepth.length === 0}
          <p class="empty-state">No items in queue.</p>
        {:else}
          <div class="queue-grid">
            {#each data.queueDepth as q}
              <div class="queue-item">
                <Badge variant={statusBadgeVariant(q.status)}>{q.status}</Badge>
                <span class="queue-count">{q.count}</span>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>

<style>
  .dashboard-page {
    max-width: 1100px;
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
    color: var(--color-ink);
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

  .toggle-label {
    font-size: 0.8125rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--color-ink-muted);
    cursor: pointer;
  }

  .toggle-label input {
    accent-color: var(--color-accent);
  }

  .last-fetched {
    font-size: 0.75rem;
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

  .loading {
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

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-ink);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
  }

  .empty-state {
    color: var(--color-ink-muted);
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }

  .gate-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .gate-card {
    padding: 1rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-page-muted, #f9fafb);
  }

  .gate-card h3 {
    margin: 0 0 0.75rem;
    font-size: 0.9375rem;
  }

  .gate-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .gate-stat {
    flex: 1;
    text-align: center;
  }

  .gs-value {
    display: block;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-ink);
  }

  .gs-label {
    font-size: 0.6875rem;
    color: var(--color-ink-muted);
    text-transform: uppercase;
  }

  .verdict-bar {
    display: flex;
    height: 1.5rem;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .verdict-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    transition: flex 0.3s;
  }

  .segment-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }

  .verdict-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.6875rem;
    color: var(--color-ink-muted);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .legend-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .assessments-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
  }

  .assessments-table th {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--color-line);
    color: var(--color-ink-muted);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.6875rem;
    letter-spacing: 0.05em;
  }

  .assessments-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-line);
    color: var(--color-ink);
  }

  .assessments-table tr:hover td {
    background: var(--color-page-muted, #f9fafb);
  }

  .mono {
    font-family: monospace;
    font-size: 0.75rem;
  }

  .queue-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .queue-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-page-muted, #f9fafb);
  }

  .queue-count {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-ink);
  }
</style>
