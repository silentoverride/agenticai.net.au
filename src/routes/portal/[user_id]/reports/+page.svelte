<script lang="ts">
  import { useClerkContext } from 'svelte-clerk';
  import { portalGet } from '$lib/portal-client';
  import { usePortalAuth } from '$lib/portal-context.svelte';
  import type { PortalReport } from '$lib/types';
  import CalendlyButton from '$lib/components/CalendlyButton.svelte';
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';

  const clerk = useClerkContext();
  const { userId, isDevBypass } = usePortalAuth();

  let reports = $state<PortalReport[]>([]);
  let loading = $state(true);

  $effect(() => {
    if (clerk.auth.userId != null || isDevBypass) loadReports();
  });

  async function loadReports() {
    try {
      const res = await portalGet('/api/portal/reports');
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
    <div class="empty-state">
      <p>No reports yet.</p>
      <div class="empty-cta">
        <CallAssessmentButton label="Start Your AI Business Assessment" source="portal-empty-state" />
      </div>
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
          <h3>{report.title || report.company || 'Business Assessment'}</h3>
          <p class="report-date">{new Date(report.created_at).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <div class="report-actions">
            <span class="btn-primary">View Report →</span>
            <a
              href={`/deck/${report.id}`}
              target="_blank"
              rel="noopener noreferrer"
              class="btn-deck"
              onclick={(e) => e.stopPropagation()}
            >
              View Deck →
            </a>
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
  .btn-deck {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    display: inline-block;
    cursor: pointer;
    background: transparent;
    color: #0066ff;
    border: 1.5px solid #0066ff;
    transition: background 0.2s ease, color 0.2s ease;
  }
  .btn-deck:hover {
    background: #0066ff;
    color: white;
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
