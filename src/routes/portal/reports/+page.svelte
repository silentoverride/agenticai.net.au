<script lang="ts">
  import { useClerkContext } from 'svelte-clerk';

  const clerk = useClerkContext();

  let reports = $state<any[]>([]);
  let loading = $state(true);

  $effect(() => {
    if (clerk.auth.userId != null) loadReports();
  });

  async function loadReports() {
    try {
      const res = await fetch('/api/portal/reports');
      if (res.ok) reports = await res.json();
    } catch (e) {
      console.error('Failed to load reports', e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="portal-page">
  <h1>Your Reports</h1>

  {#if loading}
    <p>Loading reports...</p>
  {:else if reports.length === 0}
    <div class="empty-state">
      <p>No reports yet.</p>
      <a href="/assessment" class="cta-button">Start AI Business Assessment</a>
    </div>
  {:else}
    <div class="reports-grid">
      {#each reports as report}
        <div class="report-card">
          <h3>{report.company || 'Business Assessment'}</h3>
          <p class="report-date">{new Date(report.created_at).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <div class="report-actions">
            <a href="/portal/reports/{report.report_id}" class="btn-primary">View Presentation</a>
            {#if report.deck_url}
              <a href={report.deck_url} target="_blank" rel="noopener" class="btn-secondary">Download PPTX</a>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .portal-page h1 {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
    color: #1a1a2e;
  }
  .empty-state {
    text-align: center;
    padding: 3rem;
    background: white;
    border-radius: 12px;
  }
  .empty-state p {
    color: #666;
    margin-bottom: 1rem;
  }
  .cta-button {
    display: inline-block;
    background: #0066ff;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
  }
  .reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  .report-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .report-card h3 {
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
    color: #1a1a2e;
  }
  .report-date {
    font-size: 0.8125rem;
    color: #888;
    margin-bottom: 1rem;
  }
  .report-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .btn-primary, .btn-secondary {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .btn-primary {
    background: #0066ff;
    color: white;
  }
  .btn-secondary {
    background: #f0f0f0;
    color: #1a1a2e;
  }
</style>
