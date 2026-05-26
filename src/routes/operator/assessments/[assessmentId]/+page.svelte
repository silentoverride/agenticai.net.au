<script lang="ts">
  import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui';
  import GateFindingCard from '$lib/components/staff-portal/GateFindingCard.svelte';
  import GuardedActionPanel from '$lib/components/staff-portal/GuardedActionPanel.svelte';
  import AuditTimeline from '$lib/components/staff-portal/AuditTimeline.svelte';
  import {
    REPORT_STATE_PRESENTATION
  } from '$lib/staff-portal/dto';
  import type { StaffAssessmentReviewDto, StaffGateFindingDto, StaffArtifactVersionDto, GateFindingState } from '$lib/staff-portal/dto';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let review = $derived(data.review ?? null);
  let loading = $state(false);
  let stale = $state(false);
  let error = $state('');

  // Viewport size warning
  let viewportBelowSafe = $state(false);
  $effect(() => {
    const mq = window.matchMedia('(max-width: 479px)');
    viewportBelowSafe = mq.matches;
    const handler = (e: MediaQueryListEvent) => { viewportBelowSafe = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  // Derive ordered gate findings: unresolved first, then resolved, then overridden
  let orderedFindings = $derived.by(() => {
    if (!review) return [];
    const unresolved: StaffGateFindingDto[] = [];
    const resolved: StaffGateFindingDto[] = [];
    const overridden: StaffGateFindingDto[] = [];
    for (const f of review.linkedGateFindings) {
      if (f.state === 'resolved') resolved.push(f);
      else if (f.state === 'overriddenWithReason') overridden.push(f);
      else unresolved.push(f);
    }
    return [...unresolved, ...resolved, ...overridden];
  });

  let unresolvedCount = $derived(
    orderedFindings.filter((f) => f.state === 'open' || f.state === 'inReview' || f.state === 'escalatedFurther' || f.state === 'conflict').length
  );

  function handleFindingStateChange(findingId: string, newState: string) {
    // Update the finding's state in local state to reflect the server response
    // This triggers a re-render via the $derived chain
    const finding = review?.linkedGateFindings.find((f) => f.id === findingId);
    if (finding) {
      finding.state = newState as GateFindingState;
    }
  }

  function handleReportStateChange(newState: string) {
    if (review) {
      review.reportState = newState as any;
      stale = true;
    }
  }

  async function refresh() {
    loading = true;
    stale = false;
    error = '';
    try {
      const res = await fetch(window.location.pathname);
      if (res.ok) {
        window.location.reload();
      } else if (res.status === 403) {
        error = 'You do not have access to this assessment.';
      } else if (res.status === 404) {
        error = 'Assessment not found.';
      } else {
        error = 'Could not load review data.';
      }
    } catch {
      error = 'Could not load review data.';
    } finally {
      loading = false;
    }
  }

  function reportStateBadgeVariant(state: string): 'default' | 'warning' | 'success' | 'danger' | 'secondary' | 'outline' {
    if (['escalated', 'inReview'].includes(state)) return 'warning';
    if (['approved'].includes(state)) return 'success';
    if (['rejected', 'conflict', 'unavailable'].includes(state)) return 'danger';
    if (['delayed', 'regenerationRequired', 'clarificationRequired'].includes(state)) return 'warning';
    return 'default';
  }

  function riskBadgeVariant(r: string): 'default' | 'warning' | 'success' | 'danger' | 'secondary' | 'outline' {
    if (r === 'blocked' || r === 'high') return 'danger';
    if (r === 'medium') return 'warning';
    return 'default';
  }

  function formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString('en-AU', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }
</script>

<svelte:head>
  <title>Assessment Review — Command Console</title>
</svelte:head>

<div class="workspace-page">
  <!-- Header -->
  <header class="page-header">
    <div class="breadcrumb">
      <a href="/operator/assessments">← Back to Command Console</a>
      <span class="breadcrumb-sep">/</span>
      <span>Assessment Review</span>
    </div>

    {#if review}
      <div class="header-info">
        <div>
          <h1>{review.clientName}</h1>
          <p class="mono">Assessment: {review.assessmentId}</p>
        </div>
        <div class="header-badges">
          <Badge variant={reportStateBadgeVariant(review.reportState)}>
            {REPORT_STATE_PRESENTATION[review.reportState]?.label ?? review.reportState}
          </Badge>
          <Badge variant={review.humanReviewState === 'approved' ? 'success' : review.humanReviewState === 'rejected' ? 'danger' : 'default'}>
            {review.humanReviewState}
          </Badge>
        </div>
      </div>
    {/if}
  </header>

  <!-- Error / Stale Banners -->
  {#if error}
    <div class="state-banner error" role="alert">
      <p>{error}</p>
      <button class="retry-link" onclick={refresh}>Retry</button>
    </div>
  {/if}

  {#if stale}
    <div class="state-banner stale" role="alert">
      <p>Data may be stale. Refresh to see the latest state.</p>
      <button class="retry-link" onclick={refresh}>Refresh</button>
    </div>
  {/if}

  {#if viewportBelowSafe}
    <div class="state-banner viewport-warning" role="status">
      <p>This screen size is not recommended for safe review.</p>
    </div>
  {/if}

  <!-- Loading -->
  {#if loading}
    <div class="state-banner loading">
      <p>Loading review workspace...</p>
    </div>
  {:else if review}
    <!-- ============ PRESERVE STATE ============ -->
    <Card>
      <CardHeader>
        <CardTitle>Report State</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="state-info-grid">
          <div class="si-row">
            <span class="si-label">State</span>
            <span class="si-value">
              <Badge variant={reportStateBadgeVariant(review.reportState)}>
                {review.statePresentation.label}
              </Badge>
            </span>
          </div>
          <div class="si-row">
            <span class="si-label">Description</span>
            <span class="si-value muted">{review.statePresentation.description}</span>
          </div>
          <div class="si-row">
            <span class="si-label">Human Review</span>
            <span class="si-value">{review.humanReviewState}</span>
          </div>
          {#if review.blockedReasons.length > 0}
            <div class="si-row">
              <span class="si-label">Blocked Reasons</span>
              <div class="blocked-list">
                {#each review.blockedReasons as reason (reason.reason)}
                  <div class="blocked-item">
                    <Badge variant="danger">{reason.label}</Badge>
                    <p class="blocked-desc">{reason.description}</p>
                    <p class="blocked-hint">{reason.remediationHint}</p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </CardContent>
    </Card>

    <!-- ============ REPORT CONTEXT / RISK ============ -->
    <Card>
      <CardHeader>
        <CardTitle>Report Context</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="context-grid">
          <div class="ci-row">
            <span class="ci-label">Business</span>
            <span class="ci-value">{review.reportContext.businessName}</span>
          </div>
          {#if review.reportContext.owner}
            <div class="ci-row">
              <span class="ci-label">Owner</span>
              <span class="ci-value">{review.reportContext.owner}</span>
            </div>
          {/if}
          <div class="ci-row">
            <span class="ci-label">Journey Stage</span>
            <span class="ci-value">{review.reportContext.journeyStage}</span>
          </div>
          {#if review.reportContext.riskFlags.length > 0}
            <div class="ci-row">
              <span class="ci-label">Risk Flags</span>
              <div class="flag-list">
                {#each review.reportContext.riskFlags as flag}
                  <Badge variant={riskBadgeVariant(flag)}>{flag}</Badge>
                {/each}
              </div>
            </div>
          {/if}
          {#if review.reportContext.valueFlags.length > 0}
            <div class="ci-row">
              <span class="ci-label">Value Flags</span>
              <div class="flag-list">
                {#each review.reportContext.valueFlags as flag}
                  <Badge variant="default">{flag}</Badge>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </CardContent>
    </Card>

    <!-- ============ EVIDENCE: LINKED GATE FINDINGS ============ -->
    <Card>
      <CardHeader>
        <CardTitle>Gate Findings ({review.linkedGateFindings.length})</CardTitle>
        {#if unresolvedCount > 0}
          <p class="card-subtitle">{unresolvedCount} unresolved</p>
        {/if}
      </CardHeader>
      <CardContent>
        {#if review.linkedGateFindings.length === 0}
          <p class="no-data">No gate findings for this assessment.</p>
        {:else}
          <div class="gate-findings-list">
            {#each orderedFindings as finding (finding.id)}
              <GateFindingCard {finding} assessmentId={review.assessmentId} onStateChange={handleFindingStateChange} />
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- ============ REPORT ARTIFACT / VERSION HISTORY ============ -->
    <Card>
      <CardHeader>
        <CardTitle>Report Artifact Versions</CardTitle>
      </CardHeader>
      <CardContent>
        {#if review.artifactHistory.length === 0}
          <p class="no-data">No report artifacts available.</p>
        {:else}
          <div class="artifact-list">
            {#each review.artifactHistory as artifact (artifact.versionId)}
              <div class="artifact-row">
                <div class="artifact-left">
                  <Badge variant={
                    artifact.type === 'original' ? 'default' :
                    artifact.type === 'edited' ? 'secondary' :
                    'warning'
                  }>
                    {artifact.type}
                  </Badge>
                  <span class="artifact-label">{artifact.label}</span>
                </div>
                <div class="artifact-right">
                  <span class="artifact-date">{formatTime(artifact.createdAt)}</span>
                  {#if artifact.available && artifact.url}
                    <a href={artifact.url} class="artifact-link" target="_blank" rel="noopener noreferrer">View</a>
                  {:else if artifact.available}
                    <span class="artifact-available">Available</span>
                  {:else}
                    <span class="artifact-unavailable">Unavailable</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- ============ VALID ACTIONS ============ -->
    <Card>
      <CardHeader>
        <CardTitle>Decide Report</CardTitle>
      </CardHeader>
      <CardContent>
        {#if review.canDeliver === false && review.reportState !== 'approved'}
          <div class="delivery-banner">
            <p>Report must be approved before client delivery is available.</p>
          </div>
        {/if}
        <GuardedActionPanel
          actions={review.availableActions}
          assessmentId={review.assessmentId}
          reportState={review.reportState}
          onStateChange={handleReportStateChange}
        />
      </CardContent>
    </Card>

    <!-- ============ AUDIT TIMELINE ============ -->
    <Card>
      <CardContent>
        <AuditTimeline assessmentId={review.assessmentId} />
      </CardContent>
    </Card>

    <!-- Degraded data banner -->
    {#if review.linkedGateFindings.length === 0 && review.artifactHistory.length === 0}
      <div class="state-banner degraded">
        <p>Some data is unavailable. Gate findings and artifact history could not be loaded.</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .workspace-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .breadcrumb a {
    font-size: 0.8125rem;
    color: var(--color-accent);
    text-decoration: none;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }

  .breadcrumb-sep {
    margin: 0 0.4rem;
    font-size: 0.8rem;
    color: var(--color-text-muted, #888);
  }

  .header-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .page-header h1 {
    font-size: 1.5rem;
    margin: 0;
  }

  .mono {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--color-ink-muted);
    margin: 0.25rem 0 0;
  }

  .header-badges {
    display: flex;
    gap: 0.375rem;
  }

  .state-banner {
    padding: 1rem;
    border-radius: var(--radius);
    margin-bottom: 1rem;
    text-align: center;
  }

  .state-banner.error {
    background: var(--color-danger-bg, #fef2f2);
    border: 1px solid var(--color-danger, #ef4444);
    color: var(--color-danger, #b91c1c);
  }

  .state-banner.stale {
    background: var(--color-warning-bg, #fffbeb);
    border: 1px solid var(--color-warning, #d97706);
    color: var(--color-warning, #92400e);
  }

  .state-banner.loading {
    background: var(--color-page-muted, #f9fafb);
    border: 1px solid var(--color-line);
    color: var(--color-ink-muted);
  }

  .state-banner.degraded {
    background: var(--color-warning-bg, #fffbeb);
    border: 1px dashed var(--color-warning, #d97706);
    color: var(--color-warning, #92400e);
  }

  .retry-link {
    background: none;
    border: none;
    color: var(--color-accent);
    text-decoration: underline;
    cursor: pointer;
    font: inherit;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .no-data {
    text-align: center;
    padding: 1.5rem;
    color: var(--color-ink-muted);
    font-size: 0.875rem;
  }

  .state-info-grid {
    display: grid;
    gap: 0.75rem;
  }

  .si-row {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .si-label {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .si-value {
    font-size: 0.9375rem;
    color: var(--color-ink);
  }

  .si-value.muted {
    color: var(--color-ink-muted);
    font-size: 0.875rem;
  }

  .blocked-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .blocked-item {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .blocked-desc, .blocked-hint {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-ink-muted);
  }

  .blocked-hint {
    font-style: italic;
    font-size: 0.75rem;
  }

  .context-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 640px) {
    .context-grid {
      grid-template-columns: 1fr;
    }
  }

  .ci-row {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .ci-label {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ci-value {
    font-size: 0.9375rem;
    color: var(--color-ink);
  }

  .flag-list {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
  }

  .card-subtitle {
    font-size: 0.8125rem;
    color: var(--color-ink-muted);
    margin: 0.25rem 0 0;
  }

  .gate-findings-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .artifact-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .artifact-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .artifact-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .artifact-label {
    font-size: 0.875rem;
    color: var(--color-ink);
  }

  .artifact-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .artifact-date {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
  }

  .artifact-link {
    font-size: 0.8125rem;
    color: var(--color-accent);
    text-decoration: none;
    font-weight: 500;
  }

  .artifact-link:hover {
    text-decoration: underline;
  }

  .artifact-available {
    font-size: 0.75rem;
    color: var(--color-success, #059669);
  }

  .artifact-unavailable {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
    font-style: italic;
  }

  .delivery-banner {
    background: var(--color-warning-bg, #fffbeb);
    border: 1px solid var(--color-warning, #d97706);
    border-radius: var(--radius);
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: var(--color-ink);
  }

  .delivery-banner p {
    margin: 0;
  }

  /* ── Accessibility: viewport warning ── */
  .state-banner.viewport-warning {
    background: var(--color-warning-bg, #fffbeb);
    border: 2px dashed var(--color-warning, #d97706);
    color: var(--color-warning, #92400e);
  }

  /* ── Accessibility: focus indicators ── */
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* ── Responsive: state-first order ── */
  @media (max-width: 768px) {
    .workspace-page {
      padding: 1rem 0.75rem;
    }

    .context-grid {
      grid-template-columns: 1fr;
    }

    .header-info {
      flex-direction: column;
    }

    .state-info-grid {
      gap: 0.5rem;
    }

    .gate-findings-list {
      gap: 0.75rem;
    }

    .artifact-row {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (max-width: 480px) {
    .page-header h1 {
      font-size: 1.25rem;
    }
  }

  /* ── Accessibility: reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
