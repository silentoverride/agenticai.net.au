<script lang="ts">
  import { onMount } from 'svelte';

  let status = 'Finalising your assessment intake...';
  let deckUrl = '';
  let pollInterval: ReturnType<typeof setInterval>;
  let sessionId = '';

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    sessionId = params.get('session_id') || '';

    if (!sessionId) {
      status = 'Payment completed, but no Stripe session id was returned.';
      return;
    }

    // Step 1: Submit transcript (or trigger server-side retrieval)
    const stored = localStorage.getItem('annie-assessment-transcript');
    let payload: any = { sessionId };

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        payload = { ...parsed, sessionId };
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok && response.status !== 202) {
        throw new Error(data.message || 'Transcript submission failed.');
      }

      // If queued (202), start polling for status
      if (data.status === 'queued' || response.status === 202) {
        status = 'Payment received. Your report is being generated — this usually takes 2-3 minutes.';
        startPolling(sessionId);
      } else if (data.status === 'pending_transcript') {
        status = 'Payment received. Waiting for the voice interview to finish — your report will be generated automatically.';
        startPolling(sessionId);
      } else {
        status = 'Your report has been generated and is ready for delivery.';
        if (data.deckUrl) deckUrl = data.deckUrl;
      }

      localStorage.removeItem('annie-assessment-transcript');
    } catch (err: any) {
      console.error('Assessment pipeline failed:', err);
      status = 'Payment received. There was an issue starting the report pipeline — we\'ll retry automatically or contact hello@agenticai.net.au if it persists.';
    }
  });

  function startPolling(sid: string) {
    pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/assessment-transcript?sessionId=${encodeURIComponent(sid)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(pollInterval);
          status = 'Your AI Business Assessment report is ready!';
          deckUrl = data.deckUrl || '';
        } else if (data.status === 'error') {
          clearInterval(pollInterval);
          status = 'Report generation ran into an issue. Please contact hello@agenticai.net.au with your payment reference.';
        }
        // else keep polling
      } catch (e) {
        // ignore polling errors
      }
    }, 5000); // poll every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (!deckUrl) {
        status = 'Your report is taking longer than expected. Please contact hello@agenticai.net.au with your payment reference.';
      }
    }, 10 * 60 * 1000);
  }
</script>

<main>
  <section class="page-hero">
    <p class="eyebrow">Assessment payment</p>
    <h1>Thank you</h1>
    <p>{status}</p>
    {#if deckUrl}
      <p class="deck-link">
        <a href={deckUrl} target="_blank" rel="noopener noreferrer">
          Download your assessment report (PPTX)
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
