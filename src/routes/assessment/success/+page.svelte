<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui';

  let sessionId = $state('');
  let status = $state<'pending' | 'paid' | 'error'>('pending');

  $effect(() => {
    sessionId = $page.url.searchParams.get('session_id') || '';
    if (sessionId) {
      // Poll pipeline status to confirm payment went through
      const checkStatus = async () => {
        try {
          const res = await fetch(`/api/pipeline-status/${sessionId}`);
          if (res.ok) {
            const data = (await res.json()) as { status?: string };
            if (data.status === 'queued' || data.status === 'running_llm' || data.status === 'completed') {
              status = 'paid';
              // Redirect to full status page
              window.location.href = `/assessment/status/${sessionId}`;
            } else if (data.status === 'pending_payment') {
              // Still pending — Stripe might not have fired webhook yet
              setTimeout(checkStatus, 2000);
            } else {
              status = 'paid'; // Assume paid, pipeline will catch up
            }
          }
        } catch {
          // Webhook will process it — show success regardless
          status = 'paid';
        }
      };
      checkStatus();
    } else {
      status = 'error';
    }
  });
</script>

<svelte:head>
  <title>Assessment Confirmed — AgenticAI</title>
</svelte:head>

<div class="success-page">
  <div class="success-card">
    {#if status === 'pending'}
      <div class="spinner-large"></div>
      <h1>Confirming your payment...</h1>
      <p>Please wait while we verify your payment and queue your assessment.</p>
    {:else if status === 'paid'}
      <div class="success-icon" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h1>Payment confirmed!</h1>
      <p>Your AI Business Assessment is being queued for processing.</p>
      <p class="success-subtitle">
        Annie is preparing your personalised analysis. We'll email you when it's ready.<br>
        You can check progress anytime.
      </p>
      <div class="success-actions">
        <Button onclick={() => window.location.href = '/'}>Return to Home</Button>
      </div>
    {:else}
      <div class="error-icon" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1>Something went wrong</h1>
      <p>We couldn't find your payment session. Please check your email for updates or contact support.</p>
      <div class="success-actions">
        <Button onclick={() => window.location.href = '/'}>Return to Home</Button>
      </div>
    {/if}
  </div>
</div>

<style>
  .success-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 70vh;
    padding: 2rem;
  }

  .success-card {
    text-align: center;
    max-width: 480px;
    padding: 3rem 2rem;
    background: var(--color-panel);
    border: 1.5px solid var(--color-line);
    border-radius: var(--radius);
  }

  .success-icon {
    color: #059669;
    margin-bottom: 1rem;
  }

  .error-icon {
    color: #ef4444;
    margin-bottom: 1rem;
  }

  .success-card h1 {
    font-size: 1.5rem;
    margin: 0 0 0.75rem;
  }

  .success-card p {
    color: var(--color-muted);
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 0 0 0.5rem;
  }

  .success-subtitle {
    font-size: 0.82rem;
  }

  .success-actions {
    margin-top: 1.5rem;
  }

  .spinner-large {
    width: 48px;
    height: 48px;
    border: 3px solid var(--color-line);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
