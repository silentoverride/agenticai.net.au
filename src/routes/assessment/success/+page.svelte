<script lang="ts">
  import { onMount } from 'svelte';

  let status = $state('Finalising your assessment intake...');
  let reportId = $state('');
  let pollInterval: ReturnType<typeof setInterval>;
  let sessionId = $state('');
  const processingStatus =
    "Payment received. Your transcript is being processed and report will be ready within 48 hours.\n\nOnce you receive your report, you'll have the opportunity to book a complimentary 30-minute consultation with one of our consultants. During this session, they will walk you through the report and discuss how we can support you in implementing the proposed solutions.";

  interface TranscriptResponse {
    status?: string;
    reportId?: string;
    message?: string;
  }

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    sessionId = params.get('session_id') || '';

    if (!sessionId) {
      status = 'Payment completed, but no Stripe session id was returned.';
      return;
    }

    // Step 1: Submit transcript (or trigger server-side retrieval)
    const stored = localStorage.getItem('annie-assessment-transcript');
    const payload: Record<string, unknown> = { sessionId };

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        Object.assign(payload, parsed);
        payload.sessionId = sessionId;
      } catch {
        // ignore invalid stored JSON
      }
    }

    try {
      const response = await fetch('/api/assessment-transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = (await response.json().catch(() => ({}))) as TranscriptResponse;

      if (!response.ok && response.status !== 202) {
        throw new Error(data.message || 'Transcript submission failed.');
      }

      // If queued (202), start polling for status
      if (data.status === 'queued' || response.status === 202) {
        status = processingStatus;
        startPolling(sessionId);
      } else if (data.status === 'pending_transcript') {
        status = 'Payment received. Waiting for the voice interview to finish - your report will be generated automatically.';
        startPolling(sessionId);
      } else {
        status = 'Your report has been generated and is ready for delivery.';
        if (data.reportId) reportId = data.reportId;
      }

      localStorage.removeItem('annie-assessment-transcript');
    } catch (err) {
      console.error('Assessment pipeline failed:', err);
      status = "Payment received. There was an issue starting the report pipeline - we'll retry automatically or contact hello@agenticai.net.au if it persists.";
    }
  });

  function startPolling(sid: string) {
    pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/assessment-transcript?sessionId=${encodeURIComponent(sid)}`);
        if (!res.ok) return;
        const data = (await res.json()) as TranscriptResponse;

        if (data.status === 'completed') {
          clearInterval(pollInterval);
          status = 'Your AI Business Assessment report is ready!';
          reportId = data.reportId || '';
        } else if (data.status === 'error') {
          clearInterval(pollInterval);
          status = 'Report generation ran into an issue. Please contact hello@agenticai.net.au with your payment reference.';
        }
        // else keep polling
      } catch {
        // ignore polling errors
      }
    }, 5000); // poll every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (!reportId) {
        status = 'Your report is taking longer than expected. Please contact hello@agenticai.net.au with your payment reference.';
      }
    }, 10 * 60 * 1000);
  }
</script>

<main>
  <section class="page-hero">
    <p class="eyebrow">Assessment payment</p>
    <h1>Thank you</h1>
    <p class="status-message">{status}</p>
    {#if reportId}
      <p class="deck-link">
        <a href={`/portal/reports/${reportId}`}>
          View your assessment report
        </a>
      </p>
    {/if}
  </section>

  <section class="section split-section">
    <div>
      <h2>What happens next</h2>
      <p>
        Your intake is reviewed and turned into an AI Business Assessment report covering workflow pain
        points, quick wins, effort versus impact, estimated value, and implementation options.
      </p>
    </div>
    <div class="statement-panel">
      <h3>Report timeline</h3>
      <p>The standard turnaround target is 48 hours after payment and transcript receipt.</p>
      <a href="mailto:hello@agenticai.net.au">hello@agenticai.net.au</a>
    </div>
  </section>
</main>

<style>
  .status-message {
    white-space: pre-line;
  }

  .deck-link {
    margin-top: 1.5rem;
  }
  .deck-link a {
    display: inline-block;
    background: var(--color-accent, #0066cc);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
  }
  .deck-link a:hover {
    opacity: 0.9;
  }
</style>
