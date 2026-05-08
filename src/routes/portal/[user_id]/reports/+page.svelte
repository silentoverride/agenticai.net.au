<script lang="ts">
	import { useClerkContext } from 'svelte-clerk';
	import CalendlyButton from '$lib/components/CalendlyButton.svelte';
	import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';

	const clerk = useClerkContext();
	const userId = $derived(clerk.auth.userId ?? '');

  let reports = $state<any[]>([]);
  let loading = $state(true);

  const sampleReports = [
    { company: 'Acme Consulting', date: '15 January 2025', desc: 'Marketing automation, CRM integration, and reporting workflow assessment with projected 12 hrs/week savings.' },
    { company: 'Brightspire Dental', date: '3 February 2025', desc: 'Patient scheduling, reminder bots, and practice management tool stack review with AI scheduling recommendations.' },
    { company: 'Coastal Logistics', date: '22 February 2025', desc: 'Supply-chain dashboarding, route optimisation, and automated invoicing assessment with ROI projections.' }
  ];

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
      // Minimum dwell time so skeleton placeholders are visible (UX comfort)
      setTimeout(() => { loading = false; }, 400);
    }
  }
</script>

<div class="portal-page">
  <h1>Your Reports</h1>

  {#if loading}
    <div class="reports-grid">
      {#each [1, 2, 3] as _}
        <div class="report-card skeleton">
          <div class="skeleton-title"></div>
          <div class="skeleton-date"></div>
          <div class="skeleton-action"></div>
        </div>
      {/each}
    </div>
  {:else if reports.length === 0}
    <div class="reports-grid">
      <!-- Permanent sample / placeholder cards -->
      {#each sampleReports as sample}
        <div class="report-card placeholder">
          <span class="placeholder-badge">Sample</span>
          <h3>{sample.company}</h3>
          <p class="report-date">{sample.date}</p>
          <p class="placeholder-desc">{sample.desc}</p>
          <div class="report-actions">
            <span class="btn-primary placeholder-btn">Preview →</span>
          </div>
        </div>
      {/each}
    </div>
    <div class="empty-cta">
      <CallAssessmentButton label="Start Your AI Business Assessment" source="portal-empty-state" />
    </div>
	{:else}
  		<div class="reports-grid">
			{#each reports as report}
				<div
					class="report-card"
					role="link"
					tabindex="0"
					onclick={() => window.location.href = `/portal/${userId}/reports/${report.id}`}
					onkeydown={(e) => { if (e.key === 'Enter') window.location.href = `/portal/${userId}/reports/${report.id}`; }}
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
  .btn-primary {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    display: inline-block;
    cursor: pointer;
    background: #0066ff;
    color: white;
  }

  /* Skeleton placeholder cards */
  .report-card.skeleton {
    cursor: default;
    pointer-events: none;
  }
  .report-card.skeleton:hover,
  .report-card.skeleton:focus {
    transform: none;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    outline: none;
  }
  .skeleton-title {
    height: 1.25rem;
    width: 70%;
    background: linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%);
    background-size: 200% 100%;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    animation: shimmer 1.4s infinite;
  }
  .skeleton-date {
    height: 0.875rem;
    width: 45%;
    background: linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    animation: shimmer 1.4s infinite;
  }
  .skeleton-action {
    height: 2rem;
    width: 6rem;
    background: linear-gradient(90deg, #c7d2fe 25%, #a5b4fc 50%, #c7d2fe 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: shimmer 1.4s infinite;
  }
  /* Placeholder / sample cards */
  .report-card.placeholder {
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
    border: 2px dashed #c7d2fe;
    cursor: default;
  }
  .report-card.placeholder:hover,
  .report-card.placeholder:focus {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(99,102,241,0.1);
    outline: 2px dashed #a5b4fc;
    outline-offset: 2px;
  }
  .placeholder-badge {
    display: inline-block;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    background: #e0e7ff;
    color: #4f46e5;
    margin-bottom: 0.5rem;
  }
  .placeholder-desc {
    font-size: 0.8125rem;
    color: #666;
    line-height: 1.45;
    margin: 0 0 1rem 0;
  }
  .btn-primary.placeholder-btn {
    background: #818cf8;
    cursor: default;
    opacity: 0.7;
  }
  .empty-cta {
    text-align: center;
    margin-top: 2rem;
    padding: 1.5rem;
    background: white;
    border-radius: 12px;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
