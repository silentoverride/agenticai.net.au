<script lang="ts">
  import { PUBLIC_CALENDLY_URL } from '$env/static/public';
  import CalendlyButton from '$lib/components/CalendlyButton.svelte';

  interface Props {
    reportId?: string;
    company?: string;
  }

  let { reportId, company }: Props = $props();

  const hasCalendly = PUBLIC_CALENDLY_URL && PUBLIC_CALENDLY_URL.length > 0;

  function downloadPdf() {
    if (!reportId) return;
    // Trigger PDF download via the existing API
    const link = document.createElement('a');
    link.href = `/api/portal/reports/${reportId}/download`;
    link.download = `advisory-briefing-${company || 'assessment'}.pdf`;
    link.click();
  }

  async function shareWithTeam() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Advisory Briefing — Agentic AI',
          text: `Here's our AI Business Assessment briefing${company ? ` for ${company}` : ''}`,
          url
        });
      } catch {
        // User cancelled share dialog — noop
      }
    } else {
      await navigator.clipboard.writeText(url);
      // Briefly show a "Copied" state — use a simple approach
      const btn = document.activeElement as HTMLElement;
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    }
  }
</script>

<div class="cta-panel-wrapper">
  <aside class="cta-panel" aria-label="Next steps">
    <div class="cta-content">
      <h2>Ready to take the next step?</h2>
      <p class="cta-subtitle">
        Your assessment highlights real opportunities. Let's turn them into results.
      </p>

      <div class="cta-buttons">
        {#if hasCalendly}
          <CalendlyButton label="Book a Free Consultation" />
        {:else}
          <a href="mailto:hello@agenticai.net.au" class="btn btn-contact">
            Contact Us
          </a>
        {/if}

        {#if reportId}
          <button class="btn btn-secondary" onclick={downloadPdf}>
            <span class="btn-icon">📄</span> Download PDF
          </button>
        {/if}

        <button class="btn btn-secondary" onclick={shareWithTeam}>
          <span class="btn-icon">🔗</span> Share with Team
        </button>
      </div>

      <p class="cta-note">
        Have questions? Email <a href="mailto:hello@agenticai.net.au">hello@agenticai.net.au</a>
      </p>
    </div>
  </aside>
</div>

<style>
  .cta-panel-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1.5rem 3rem;
  }

  .cta-panel {
    position: sticky;
    bottom: 1.5rem;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px;
    padding: 2rem;
    color: white;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }

  .cta-content {
    text-align: center;
  }

  .cta-content h2 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
    font-weight: 700;
  }

  .cta-subtitle {
    font-size: 1rem;
    margin: 0 0 1.5rem;
    opacity: 0.85;
    line-height: 1.5;
  }

  .cta-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    font-size: 0.9375rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-family: inherit;
  }
  .btn:hover {
    transform: translateY(-1px);
  }

  .btn-contact {
    background: #667eea;
    color: white;
  }
  .btn-contact:hover {
    background: #5a6fd6;
  }

  .btn-secondary {
    background: rgba(255,255,255,0.12);
    color: white;
  }
  .btn-secondary:hover {
    background: rgba(255,255,255,0.2);
  }

  .btn-icon {
    font-size: 1rem;
  }

  .cta-note {
    font-size: 0.8125rem;
    opacity: 0.6;
    margin: 0;
  }
  .cta-note a {
    color: #a8b5ff;
    text-decoration: underline;
  }

  /* Mobile: inline instead of sticky */
  @media (max-width: 640px) {
    .cta-panel {
      position: static;
      margin-top: 1.5rem;
    }
    .cta-buttons {
      flex-direction: column;
      width: 100%;
    }
    .btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>
