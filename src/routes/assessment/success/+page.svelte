<script lang="ts">
  import { onMount } from 'svelte';

  let status = 'Finalising your assessment intake...';

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const stored = localStorage.getItem('annie-assessment-transcript');

    if (!sessionId) {
      status = 'Payment completed, but no Stripe session id was returned.';
      return;
    }

    if (!stored) {
      status =
        'Payment completed. We could not find the chatbot transcript in this browser, so please contact hello@agenticai.net.au with your payment reference.';
      return;
    }

    try {
      const payload = JSON.parse(stored);
      const response = await fetch('/api/assessment-transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Transcript submission failed.');
      }

      localStorage.removeItem('annie-assessment-transcript');
      status =
        'Payment received and your intake transcript has been queued for assessment processing.';
    } catch {
      status =
        'Payment received, but the transcript could not be submitted automatically. Please contact hello@agenticai.net.au with your payment reference.';
    }
  });
</script>

<main>
  <section class="page-hero">
    <p class="eyebrow">Assessment payment</p>
    <h1>Thank you</h1>
    <p>{status}</p>
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
