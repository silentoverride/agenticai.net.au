<script lang="ts">
  import { useClerkContext } from 'svelte-clerk';
  import { portalGet } from '$lib/portal-client';
  import { usePortalAuth } from '$lib/portal-context.svelte';
  import type { PortalReport, PortalReceipt } from '$lib/types';
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';
  import CalendlyButton from '$lib/components/CalendlyButton.svelte';

  const clerk = useClerkContext();
  const portalAuth = usePortalAuth();
  const { userId } = portalAuth;

  let reports = $state<PortalReport[]>([]);
  let receipts = $state<PortalReceipt[]>([]);
  let assessments = $state<any[]>([]);
  let loading = $state(true);

  $effect(() => {
    if (clerk.auth.userId != null || portalAuth.isDevBypass) {
      loadData();
    }
  });

  async function loadData() {
    try {
      const [reportsRes, receiptsRes, assessmentsRes] = await Promise.all([
        portalGet('/api/portal/reports'),
        portalGet('/api/portal/receipts'),
        portalGet('/api/portal/assessments')
      ]);
      if (reportsRes.ok) reports = await reportsRes.json();
      if (receiptsRes.ok) receipts = await receiptsRes.json();
      if (assessmentsRes.ok) {
        const data = (await assessmentsRes.json()) as { assessments?: typeof assessments };
        assessments = data.assessments || [];
      }

      // Fetch user role in case layout hasn't set it yet
      if (!portalAuth.role) {
        const userRes = await portalGet('/api/portal/user');
        if (userRes.ok) {
          const userData: { role?: string } = await userRes.json();
          portalAuth.role = userData.role || '';
        }
      }
    } catch (e) {
      console.error('Failed to load portal data', e);
    } finally {
      loading = false;
    }
  }

  const isOperator = $derived(portalAuth.role === 'operator' || portalAuth.role === 'admin');

  function statusLabel(status: string): string {
    const labels: Record<string, string> = {
      queued: 'Queued',
      generating: 'Processing',
      delayed: 'Delayed',
      ready: 'Ready',
      failed: 'Failed',
      error: 'Error',
      human_assist: 'Under Review'
    };
    return labels[status] || status;
  }

  function statusClass(status: string): string {
    const classes: Record<string, string> = {
      queued: 'badge-amber',
      generating: 'badge-blue',
      delayed: 'badge-amber',
      ready: 'badge-green',
      failed: 'badge-red',
      error: 'badge-red',
      human_assist: 'badge-purple'
    };
    return classes[status] || 'badge-amber';
  }
</script>

<svelte:head>
  <title>Client Portal — Agentic AI</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="portal-dashboard">
  <h1>Welcome back, {clerk.user?.firstName || 'there'} 👋</h1>

  {#if loading}
    <p>Loading your dashboard...</p>
  {:else}
    <div class="dashboard-grid">
      <div class="dashboard-card">
        <h2>📊 Your Reports</h2>
        <p class="stat">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
        {#if reports.length > 0}
          <ul class="dashboard-list">
            {#each reports.slice(0, 3) as report}
              <li>
                <a href={`/portal/${portalAuth.userId}/reports/${report.id}`}>
                  {report.company || 'Business Assessment'}
                  <span class="meta">{new Date(report.created_at).toLocaleDateString()}</span>
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="empty">No reports yet. Complete your AI Business Assessment to get started.</p>
        {/if}
        <a href={`/portal/${portalAuth.userId}/reports`} class="dashboard-link">View all reports →</a>
      </div>

      <div class="dashboard-card">
        <h2>🧾 Receipts</h2>
        <p class="stat">{receipts.length} receipt{receipts.length !== 1 ? 's' : ''}</p>
        {#if receipts.length > 0}
          <ul class="dashboard-list">
            {#each receipts.slice(0, 3) as receipt}
              <li>
                <a href={`/portal/${portalAuth.userId}/receipts`}>
                  Assessment Fee
                  <span class="meta">
                    ${receipt.amount_cents != null ? (receipt.amount_cents / 100).toFixed(2) : '—'} {receipt.currency?.toUpperCase()}
                  </span>
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="empty">No receipts yet.</p>
        {/if}
        <a href={`/portal/${portalAuth.userId}/receipts`} class="dashboard-link">View all receipts →</a>
      </div>
    </div>

    <!-- Assessment Statuses -->
    {#if assessments.length > 0}
      <div class="assessments-section">
        <h2>📋 Assessment Status</h2>
        <div class="assessments-list">
          {#each assessments as a}
            <div class="assessment-row">
              <div class="assessment-info">
                <span class="assessment-title">{a.company || 'Business Assessment'}</span>
                <span class="assessment-date">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <div class="assessment-actions">
                <span class="status-badge {statusClass(a.status)}">{statusLabel(a.status)}</span>
                {#if a.status === 'ready'}
                  <a href={`/portal/${portalAuth.userId}/reports/${a.id}`} class="assessment-cta">View</a>
                {:else if a.status === 'failed' || a.status === 'error'}
                  <span class="assessment-cta muted">Retry</span>
                {:else}
                  <span class="assessment-cta muted">In Progress</span>
                {/if}
                {#if a.receiptId}
                  <a href={`/portal/${portalAuth.userId}/receipts`} class="assessment-receipt-link">Receipt</a>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if isOperator}
      <div class="operator-section">
        <h2>🔧 Staff Tools</h2>
        <div class="operator-grid">
          <a href="/operator/dashboard" class="operator-card">
            <strong>📊 Operator Dashboard</strong>
            <span>Pipeline health, gate metrics, and queue depth</span>
          </a>
          <a href="/operator/gates" class="operator-card">
            <strong>🔬 Gate Management</strong>
            <span>Review gate evaluations and override verdicts</span>
          </a>
          <a href="/operator/human-assist" class="operator-card">
            <strong>💬 Human Assist Queue</strong>
            <span>Pending assessments needing human review</span>
          </a>
          <a href="/operator/calibration" class="operator-card">
            <strong>⚙️ Calibration</strong>
            <span>Run calibration tests and tune gate thresholds</span>
          </a>
        </div>
      </div>
    {/if}

    <div class="portal-cta-row">
      <div class="start-assessment-card">
        <h3>🎤 Start New Assessment</h3>
        <p>Ready to assess another workflow or business area?</p>
        <CallAssessmentButton label="Start AI Business Assessment" source="portal-dashboard" />
      </div>
      <div class="portal-help-card">
        <h3>📅 Need help?</h3>
        <p>Questions about your report, payments, or next steps? Book a complimentary 30-minute session.</p>
        <CalendlyButton />
      </div>
    </div>
  {/if}</div>

<style>
  .portal-dashboard h1 {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
    color: #1a1a2e;
  }
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }
  .dashboard-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .dashboard-card h2 {
    font-size: 1.125rem;
    margin-bottom: 0.75rem;
    color: #1a1a2e;
  }
  .stat {
    font-size: 2rem;
    font-weight: 700;
    color: #0066ff;
    margin: 0.5rem 0;
  }
  .dashboard-list {
    list-style: none;
    padding: 0;
    margin: 0.75rem 0;
  }
  .dashboard-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
  }
  .dashboard-list a {
    display: flex;
    justify-content: space-between;
    color: #1a1a2e;
    text-decoration: none;
    font-weight: 500;
  }
  .dashboard-list a:hover {
    color: #0066ff;
  }
  .meta {
    font-size: 0.8125rem;
    color: #888;
    font-weight: 400;
  }
  .empty {
    color: #888;
    font-size: 0.9375rem;
    margin: 0.75rem 0;
  }
  .dashboard-link {
    display: inline-block;
    margin-top: 0.75rem;
    color: #0066ff;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9375rem;
  }
  .portal-cta-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }
  .start-assessment-card, .portal-help-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .start-assessment-card h3, .portal-help-card h3 {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    color: #1a1a2e;
  }
  .start-assessment-card p, .portal-help-card p {
    color: #666;
    font-size: 0.9375rem;
    margin-bottom: 1rem;
  }
  .btn-secondary {
    display: inline-block;
    background: #f0f0f0;
    color: #1a1a2e;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9375rem;
  }

  /* ── Assessment Statuses ── */
  .assessments-section {
    margin-top: 2rem;
  }
  .assessments-section h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: #1a1a2e;
  }
  .assessments-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .assessment-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 0.875rem 1.25rem;
    border-radius: 10px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  }
  .assessment-info {
    display: flex;
    flex-direction: column;
  }
  .assessment-title {
    font-weight: 600;
    color: #1a1a2e;
    font-size: 0.9375rem;
  }
  .assessment-date {
    font-size: 0.8125rem;
    color: #888;
    margin-top: 0.125rem;
  }
  .assessment-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .status-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .badge-green { background: #e8f5e9; color: #2e7d32; }
  .badge-amber { background: #fff8e1; color: #f57f17; }
  .badge-blue { background: #e3f2fd; color: #1565c0; }
  .badge-red { background: #ffebee; color: #c62828; }
  .badge-purple { background: #f3e5f5; color: #6a1b9a; }
  .assessment-cta {
    display: inline-block;
    background: #0066ff;
    color: white;
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.8125rem;
    font-weight: 500;
  }
  .assessment-cta.muted {
    background: #e0e0e0;
    color: #888;
    font-size: 0.8125rem;
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
  }
  .assessment-receipt-link {
    font-size: 0.8125rem;
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
  }
  .assessment-receipt-link:hover {
    text-decoration: underline;
  }

  /* ── Staff Tools Section ── */
  .operator-section {
    margin-top: 2rem;
  }
  .operator-section h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: #1a1a2e;
  }
  .operator-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }
  .operator-card {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 1.125rem;
    text-decoration: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .operator-card:hover {
    border-color: #0066ff;
    box-shadow: 0 2px 12px rgba(0,102,255,0.1);
  }
  .operator-card strong {
    font-size: 0.9375rem;
    color: #1a1a2e;
  }
  .operator-card span {
    font-size: 0.8125rem;
    color: #888;
    line-height: 1.4;
  }
</style>
