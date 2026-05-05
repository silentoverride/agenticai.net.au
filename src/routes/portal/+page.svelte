<script lang="ts">
  import { useClerkContext } from 'svelte-clerk';
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';

  const clerk = useClerkContext();

  let reports = $state<any[]>([]);
  let receipts = $state<any[]>([]);
  let loading = $state(true);

  $effect(() => {
    if (clerk.auth.userId != null) {
      loadData();
    }
  });

  async function loadData() {
    try {
      const [reportsRes, receiptsRes] = await Promise.all([
        fetch('/api/portal/reports'),
        fetch('/api/portal/receipts')
      ]);
      if (reportsRes.ok) reports = await reportsRes.json();
      if (receiptsRes.ok) receipts = await receiptsRes.json();
    } catch (e) {
      console.error('Failed to load portal data', e);
    } finally {
      loading = false;
    }
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
                <a href="/portal/reports/{report.report_id}">
                  {report.company || 'Business Assessment'}
                  <span class="meta">{new Date(report.created_at).toLocaleDateString()}</span>
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="empty">No reports yet. Complete your AI Business Assessment to get started.</p>
        {/if}
        <a href="/portal/reports" class="dashboard-link">View all reports →</a>
      </div>

      <div class="dashboard-card">
        <h2>🧾 Receipts</h2>
        <p class="stat">{receipts.length} receipt{receipts.length !== 1 ? 's' : ''}</p>
        {#if receipts.length > 0}
          <ul class="dashboard-list">
            {#each receipts.slice(0, 3) as receipt}
              <li>
                <a href="/portal/receipts">
                  Assessment Fee
                  <span class="meta">
                    ${(receipt.amount_cents / 100).toFixed(2)} {receipt.currency?.toUpperCase()}
                  </span>
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="empty">No receipts yet.</p>
        {/if}
        <a href="/portal/receipts" class="dashboard-link">View all receipts →</a>
      </div>
    </div>

    <div class="portal-cta-row">
      <div class="start-assessment-card">
        <h3>🎤 Start New Assessment</h3>
        <p>Ready to assess another workflow or business area?</p>
        <CallAssessmentButton label="Start AI Business Assessment" source="portal-dashboard" />
      </div>
      <div class="portal-help-card">
        <h3>📧 Need help?</h3>
        <p>Questions about your report, payments, or next steps?</p>
        <a href="mailto:hello@agenticai.net.au" class="btn-secondary">Contact us</a>
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
</style>
