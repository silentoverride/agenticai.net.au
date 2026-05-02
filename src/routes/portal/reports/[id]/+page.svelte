<script lang="ts">
  import { page } from '$app/state';
  import { useClerkContext } from 'svelte-clerk';
  import RevealDeck from '$lib/components/RevealDeck.svelte';

  const clerk = useClerkContext();
  const reportId = page.params.id;

  let report = $state<any>(null);
  let analysis = $state<any>(null);
  let loading = $state(true);
  let error = $state('');

  $effect(() => {
    if (clerk.auth.userId != null) loadReport();
  });

  async function loadReport() {
    try {
      const res = await fetch(`/api/portal/reports/${reportId}`);
      if (!res.ok) throw new Error('Report not found');
      report = await res.json();
      if (report.analysis) {
        analysis = report.analysis;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load report';
    } finally {
      loading = false;
    }
  }
</script>

<div class="report-viewer">
  {#if loading}
    <p>Loading your assessment report...</p>
  {:else if error}
    <p class="error">{error}</p>
    <a href="/portal/reports">← Back to reports</a>
  {:else if analysis}
    <div class="viewer-header">
      <h1>{report?.company || 'AI Business Assessment'}</h1>
      <div class="viewer-actions">
        {#if report?.deck_url}
          <a href={report.deck_url} target="_blank" class="btn-download">Download PPTX</a>
        {/if}
      </div>
    </div>
    <RevealDeck {analysis} company={report?.company} />
  {/if}
</div>

<style>
  .report-viewer {
    max-width: 100%;
    margin: 0 auto;
  }
  .viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 0 1rem;
  }
  .viewer-header h1 {
    font-size: 1.5rem;
    color: #1a1a2e;
    margin: 0;
  }
  .btn-download {
    background: #0066ff;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .error {
    color: #d32f2f;
    padding: 1rem;
    background: #ffebee;
    border-radius: 8px;
  }
</style>
