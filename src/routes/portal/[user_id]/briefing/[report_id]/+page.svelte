<script lang="ts">
  import { page } from '$app/state';
  import { portalGet } from '$lib/portal-client';
  import BriefingContent from '$lib/components/briefing/BriefingContent.svelte';
  import BriefingSkeleton from '$lib/components/briefing/BriefingSkeleton.svelte';
  import type { PortalReportDetail } from '$lib/types';

  const reportId = page.params.report_id;

  let report = $state<PortalReportDetail | null>(null);
  let analysis = $state<any>(null);
  let loading = $state(true);
  let error = $state('');

  async function loadBriefing() {
    try {
      const res = await portalGet(`/api/portal/reports/${reportId}`);
      if (!res.ok) throw new Error('Briefing not found');
      report = await res.json();
      if (report?.analysis) {
        analysis = report.analysis;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load briefing';
    } finally {
      loading = false;
    }
  }

  // Use portal auth to trigger load
  import { usePortalAuth } from '$lib/portal-context.svelte';
  import { useClerkContext } from 'svelte-clerk';
  const portalAuth = usePortalAuth();
  const clerk = useClerkContext();

  $effect(() => {
    if (clerk.auth.userId != null || portalAuth.isDevBypass) {
      loadBriefing();
    }
  });
</script>

<svelte:head>
  <title>Advisory Briefing — Agentic AI</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if loading}
  <BriefingSkeleton />
{:else if error}
  <div class="briefing-error">
    <h2>Could not load briefing</h2>
    <p>{error}</p>
    <a href={`/portal/${portalAuth.userId}/reports`} class="back-link">← Back to reports</a>
  </div>
{:else if analysis}
  <BriefingContent {analysis} company={report?.company ?? undefined} />
{/if}

<style>
  .briefing-error {
    max-width: 600px;
    margin: 4rem auto;
    padding: 2rem;
    text-align: center;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .briefing-error h2 {
    color: #d32f2f;
    margin-bottom: 0.5rem;
  }
  .briefing-error p {
    color: #666;
    margin-bottom: 1.5rem;
  }
  .back-link {
    display: inline-block;
    color: #0066ff;
    text-decoration: none;
    font-weight: 500;
  }
</style>
