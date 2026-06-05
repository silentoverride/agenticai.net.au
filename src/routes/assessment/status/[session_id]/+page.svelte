<script lang="ts">
  import { page } from '$app/stores';
  import { Button, Progress, Badge } from '$lib/components/ui';
  import { fade } from 'svelte/transition';

  interface StatusData {
    sessionId: string;
    status: string;
    reportId: string | null;
    deckUrl: string | null;
    error: string | null;
  }

  let sessionId = $state('');
  let data = $state<StatusData | null>(null);
  let error = $state('');
  let pollInterval = $state(10_000);      // NFR5: default 10s, reduced on mobile
  let isMobile = $state(false);
  let retryDelay = $state(10_000);        // Delay before next poll after failed attempt

  $effect(() => {
    sessionId = $page.url.searchParams.get('session_id') || '';
    isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      pollInterval = 15_000;  // NFR5: reduced polling on mobile for battery/data
    }
  });

  // Status polling
  let pollingActive = $state(true);
  let pollTimer: ReturnType<typeof setTimeout> | null = null;

  async function poll() {
    if (!sessionId || !pollingActive) return;
    try {
      const res = await fetch(`/api/pipeline-status/${sessionId}`, {
        // NFR9: browser cache respects the 30s cache-control from server
        headers: { 'Cache-Control': 'max-age=0' }
      });
      if (res.ok) {
        const nextData = (await res.json()) as StatusData;
        data = nextData;
        error = '';
        retryDelay = 10_000;
        // Stop polling when terminal state reached
        if (nextData.status === 'ready' || nextData.status === 'completed' || nextData.status === 'failed' || nextData.status === 'error') {
          pollingActive = false;
          return;
        }
      } else if (res.status === 404) {
        // Not yet created — keep polling
      } else {
        error = 'Status check failed';
      }
    } catch {
      error = 'Could not reach status server';
      retryDelay = Math.min(retryDelay * 2, 60_000); // Exponential backoff
    }
    if (pollingActive) {
      pollTimer = setTimeout(poll, pollInterval);
    }
  }

  $effect(() => {
    if (sessionId) {
      poll();
      return () => {
        pollingActive = false;
        if (pollTimer) clearTimeout(pollTimer);
      };
    }
  });

  // ── State display helpers ──────────────────────────────────

  type DisplayState = 'loading' | 'queued' | 'generating' | 'delayed' | 'ready' | 'failed' | 'human_assist' | 'pending_payment' | 'running_llm' | 'error';

  const STATE_ORDER: DisplayState[] = ['pending_payment', 'queued', 'generating', 'delayed', 'ready'];

  function isTerminal(s: string): boolean {
    return ['ready', 'completed', 'failed', 'error'].includes(s);
  }

  function displayState(raw: string): DisplayState {
    if (raw === 'completed') return 'ready';
    if (raw === 'error') return 'failed';
    return raw as DisplayState;
  }

  function stateIcon(status: string): string {
    const icons: Record<string, string> = {
      loading: '\u23F3',
      queued: '\u23ED',
      generating: '\u2699\uFE0F',
      delayed: '\u23F0',
      ready: '\u2705',
      failed: '\u274C',
      human_assist: '\uD83D\uDC68\u200D\uD83D\uDCBB',
      pending_payment: '\uD83D\uDCB3',
      running_llm: '\u2699\uFE0F'
    };
    return icons[status] || '\u2753';
  }

  function stateColor(status: string): string {
    // Token-based; banned hex literals (purple #7c3aed, indigo #6366f1) were
    // removed 2026-06-05 (DESIGN.md: no purple/violet/lavender/mauve).
    // human_assist + running_llm use --color-warm (amber) — specialist/AI work
    // reads as warm, not cool. queued/pending_payment/fallback use --color-accent
    // (steel-blue) — neutral processing.
    const colors: Record<string, string> = {
      queued: 'var(--color-accent)',
      generating: 'var(--color-warm)',
      delayed: 'var(--color-warm)',
      ready: 'var(--color-success)',
      failed: 'var(--color-danger)',
      human_assist: 'var(--color-warm)',
      pending_payment: 'var(--color-accent)',
      running_llm: 'var(--color-warm)'
    };
    return colors[status] || 'var(--color-accent)';
  }

  function stateTitle(status: string): string {
    const titles: Record<string, string> = {
      queued: 'Assessment queued',
      generating: 'Preparing your advisory briefing',
      delayed: 'Assessment is taking longer than expected',
      ready: 'Your advisory briefing is ready',
      failed: 'We encountered an issue generating your briefing',
      human_assist: 'A specialist is reviewing your assessment',
      pending_payment: 'Payment confirmed',
      running_llm: 'Analysing your business context',
      error: 'Assessment failed',
      completed: 'Your advisory briefing is ready'
    };
    return titles[status] || 'Processing your assessment';
  }

  function reportHref(reportId: string | null): string {
    return reportId ? `/assessment/report/${reportId}` : '/portal';
  }

  function stateDescription(status: string): string {
    const descs: Record<string, string> = {
      queued: 'Your assessment has been received and will begin shortly.',
      generating: 'We are analysing your business context and generating recommendations.',
      delayed: 'Analysis is taking longer than expected due to complexity. Your results will be available shortly.',
      ready: 'Your personalised advisory briefing is ready to view.',
      failed: 'Please try again or contact support at support@agenticai.net.au if the issue persists.',
      human_assist: 'A specialist is reviewing your assessment to ensure the most accurate recommendations.',
      pending_payment: 'Payment received. Your assessment is being queued for processing.',
      running_llm: 'Our AI is analysing your responses and generating insights.',
      error: 'We\'re sorry, something went wrong. Please try again or contact support.'
    };
    return descs[status] || 'Processing...';
  }

  // Progress steps
  const STEPS = [
    { key: 'intake', label: 'Intake', doneWhen: ['pending_payment', 'queued', 'generating', 'delayed', 'ready', 'completed'] },
    { key: 'analysis', label: 'Analysis', doneWhen: ['generating', 'delayed', 'ready', 'completed'] },
    { key: 'review', label: 'Review', doneWhen: ['delayed', 'ready', 'completed'] },
    { key: 'ready', label: 'Ready', doneWhen: ['ready', 'completed'] }
  ];

  function stepStatus(stepKey: string, currentStatus: string): 'done' | 'active' | 'pending' {
    const current = displayState(currentStatus);
    if (current === 'failed' || current === 'error') return 'pending'; // Failed — show all incomplete
    const step = STEPS.find(s => s.key === stepKey);
    if (!step) return 'pending';
    if (step.doneWhen.includes(current)) return 'done';
    // Check if previous steps are done — this step is active
    const stepIndex = STEPS.indexOf(step);
    const prevStepsDone = STEPS.slice(0, stepIndex).every(s =>
      s.doneWhen.includes(current)
    );
    if (prevStepsDone) return 'active';
    return 'pending';
  }

  // NFR9: cache control via server headers
  // The API endpoint sets Cache-Control: max-age=30
</script>

<svelte:head>
  <title>Assessment Status — AgenticAI</title>
</svelte:head>

<div class="status-page">
  <div class="status-card">
    <!-- Loading state -->
    {#if !data}
      <div class="status-header">
        <div class="status-icon" style="color: #2563eb">
          <span aria-hidden="true">{stateIcon('loading')}</span>
        </div>
        <h1>Loading assessment status...</h1>
        <p>Checking for your assessment progress.</p>
        <Progress value={25} />
      </div>
    {:else if data}
      {@const raw = data.status}
      {@const ds = displayState(raw)}
      {@const color = stateColor(ds)}

      <!-- Status Header (with aria-live for accessibility — NFR19) -->
      <div class="status-header" aria-live="polite" role="status">
        <div class="status-icon" style="color: {color}" aria-hidden="true">
          <span>{stateIcon(ds)}</span>
        </div>
        <h1 style="color: {color}">{stateTitle(ds)}</h1>
        <p>{stateDescription(ds)}</p>
        {#if isTerminal(ds)}
          <Badge variant={ds === 'ready' ? 'success' : ds === 'failed' ? 'danger' : 'default'}>
            {ds === 'ready' ? 'Complete' : 'Failed'}
          </Badge>
        {:else}
          <Badge variant="default">{ds}</Badge>
        {/if}
      </div>

      <!-- Progress Steps (NFR19: icon + color + text) -->
      <div class="progress-steps" role="list" aria-label="Assessment progress steps">
        {#each STEPS as step}
          {@const ss = stepStatus(step.key, raw)}
          <div class="step {ss}" role="listitem">
            <div class="step-indicator">
              {#if ss === 'done'}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              {:else if ss === 'active'}
                <div class="step-active-dot" style="background: {color}"></div>
              {:else}
                <div class="step-pending-dot"></div>
              {/if}
            </div>
            <div class="step-content">
              <span class="step-label">
                {step.label}
                {#if ss === 'active'}
                  <span class="step-active-indicator" aria-hidden="true">...</span>
                {/if}
              </span>
              <span class="step-description">
                {#if ss === 'done'}
                  Complete
                {:else if ss === 'active'}
                  In progress
                {:else}
                  Pending
                {/if}
              </span>
            </div>
          </div>
        {/each}
      </div>

      <!-- NFR19: accessible color + icon + text for screen readers -->
      <div class="sr-only" aria-live="assertive">
        Current assessment status: {stateTitle(ds)}. {stateDescription(ds)}
      </div>

      <!-- Ready state — CTA -->
      {#if raw === 'ready' || raw === 'completed'}
        <div class="status-cta" in:fade>
          <Button onclick={() => window.location.href = reportHref(data?.reportId ?? null)}>
            View Your Advisory Briefing
          </Button>
        </div>
      {/if}

      <!-- Failed state — error + support -->
      {#if raw === 'failed' || raw === 'error'}
        <div class="status-error" role="alert" in:fade>
          <p>
            <strong>What happened:</strong>
            {data.error || 'An unexpected error occurred during assessment generation.'}
          </p>
          <p>Please try again, or contact <a href="mailto:support@agenticai.net.au">support@agenticai.net.au</a> for assistance.</p>
          <Button onclick={() => { pollingActive = true; poll(); }}>Retry Status Check</Button>
        </div>
      {/if}

      <!-- Auto-refresh indicator -->
      {#if !isTerminal(ds) && !error}
        <div class="poll-indicator" aria-live="polite">
          <span class="poll-dot"></span>
          Auto-refreshing every {isMobile ? '15' : '10'} seconds
        </div>
      {/if}

      {#if error}
        <div class="poll-error" role="alert">
          {error}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .status-page {
    min-height: 70vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 1rem;
  }

  .status-card {
    max-width: 520px;
    width: 100%;
    background: var(--color-panel);
    border: 1.5px solid var(--color-line);
    border-radius: var(--radius);
    padding: 2.5rem 2rem;
  }

  .status-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .status-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    line-height: 1;
  }

  .status-header h1 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem;
  }

  .status-header p {
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0 0 0.75rem;
  }

  /* ── Progress Steps (NFR19: color, icon, text) ───────────── */

  .progress-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin: 1.5rem 0;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-line);
  }

  .step:last-child {
    border-bottom: none;
  }

  .step-indicator {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .step-active-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }

  .step-pending-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    background: var(--color-line);
  }

  .step-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .step-label {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .step-active-indicator {
    animation: dots 1.5s steps(4, end) infinite;
  }

  @keyframes dots {
    0%, 20% { content: '...'; opacity: 0.3; }
    50% { opacity: 1; }
    80%, 100% { opacity: 0.3; }
  }

  .step-description {
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  .step.done .step-label {
    color: #059669;
  }

  .step.active .step-label {
    font-weight: 700;
  }

  /* ── CTA ──────────────────────────────────────────────────── */

  .status-cta {
    text-align: center;
    margin-top: 1.5rem;
  }

  /* ── Error ─────────────────────────────────────────────────── */

  .status-error {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-sm);
    text-align: center;
  }

  .status-error p {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: #b91c1c;
    margin: 0 0 0.5rem;
  }

  .status-error a {
    color: #b91c1c;
    font-weight: 600;
  }

  /* ── Poll indicator ────────────────────────────────────────── */

  .poll-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  .poll-dot {
    width: 0.375rem;
    height: 0.375rem;
    background: var(--color-accent);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  .poll-error {
    text-align: center;
    margin-top: 1rem;
    font-size: 0.75rem;
    color: #ef4444;
  }

  /* ── Screen-reader only (NFR19) ──────────────────────────── */

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
</style>
