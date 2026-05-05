<script lang="ts">
	import { useClerkContext } from 'svelte-clerk';
	import CalendlyButton from '$lib/components/CalendlyButton.svelte';
	import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';

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
			<CallAssessmentButton label="Start AI Business Assessment" source="portal-empty-state" />
		</div>
	{:else}
  		<div class="reports-grid">
			{#each reports as report}
				<div
					class="report-card"
					role="link"
					tabindex="0"
					onclick={() => window.location.href = `/portal/reports/${report.report_id}`}
					onkeydown={(e) => { if (e.key === 'Enter') window.location.href = `/portal/reports/${report.report_id}`; }}
				>
					<h3>{report.company || 'Business Assessment'}</h3>
					<p class="report-date">{new Date(report.created_at).toLocaleDateString('en-AU', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}</p>
					<div class="report-actions">
						<span class="btn-primary">View Report →</span>
					</div>
				</div>
			{/each}
		</div>

    <div class="portal-cta">
      <div class="calendly-wrap" style="margin-top:2rem">
        <p class="or-text">Want to chat through your results?</p>
        <CalendlyButton />
      </div>
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
  .calendly-wrap {
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .or-text {
    color: #888;
    font-size: 0.875rem;
    margin: 0;
  }
  .portal-cta {
    text-align: center;
    margin-top: 2rem;
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
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .report-card:hover,
  .report-card:focus {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    outline: 3px solid #0066ff;
    outline-offset: 0;
  }
  .report-card:active {
    transform: translateY(-2px);
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
    display: inline-block;
    cursor: pointer;
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
