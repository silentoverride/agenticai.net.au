<script lang="ts">
  /**
   * OrientationPanel — Pre-intake disclosure modal.
   *
   * Shows after the user clicks "Start Assessment". Displays:
   * - Title and purpose of the assessment
   * - Privacy notice with link to privacy policy
   * - Scope disclaimer (not professional advice, informational only)
   * - Acknowledge button to proceed
   * - Close button to exit
   *
   * Once acknowledged, emits `onacknowledge` so the parent can start the intake.
   */

  import { Dialog } from '$lib/components/ui';

  let {
    open = $bindable(false),
    onacknowledge = () => {}
  }: {
    open?: boolean;
    onacknowledge?: () => void;
  } = $props();

  function acknowledge() {
    open = false;
    onacknowledge();
  }

  function handleCancel() {
    open = false;
  }
</script>

<Dialog bind:open>
  <div class="orientation-panel" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }} role="presentation">
    <div class="orientation-header">
      <div class="orientation-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </div>
      <div>
        <h2 class="orientation-title">Before you start</h2>
        <p class="orientation-subtitle">Your free AI business assessment</p>
      </div>
      <button class="orientation-close" onclick={handleCancel} aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div class="orientation-body">
      <section class="orientation-section">
        <h3>What happens next</h3>
        <p>
          Annie, our AI assistant, will guide you through a short conversation about your
          business — about 15 minutes. She will ask about your workflows, tools, daily
          bottlenecks, and goals so we can tailor the assessment to your situation.
        </p>
      </section>

      <div class="orientation-disclaimers">
        <div class="disclaimer-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <strong>Scope disclaimer</strong>
            <p>
              This is an AI-generated informational assessment, not professional advice.
              Recommendations are based on the information you provide and should be reviewed
              with your team before implementation. Always consult qualified professionals
              for legal, financial, or compliance decisions.
            </p>
          </div>
        </div>

        <div class="disclaimer-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <strong>Privacy notice</strong>
            <p>
              Your conversation with Annie is encrypted and stored securely. We use your
              responses only to generate your assessment report. We never share your data
              with third parties. You can request deletion at any time.
            </p>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" class="privacy-link">
              Read our privacy policy
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="orientation-footer">
      <button class="orientation-cancel" onclick={handleCancel}>
        Not now, maybe later
      </button>
      <button class="orientation-cta" onclick={acknowledge}>
        I understand, let's start
      </button>
    </div>
  </div>
</Dialog>

<style>
  .orientation-panel {
    display: grid;
    gap: 0;
    max-height: 80vh;
    overflow-y: auto;
  }

  .orientation-header {
    align-items: flex-start;
    display: flex;
    gap: 0.85rem;
    padding: 1.5rem 1.5rem 0;
  }

  .orientation-icon {
    align-items: center;
    background: var(--color-accent-light);
    border-radius: 999px;
    color: var(--color-accent);
    display: inline-flex;
    flex-shrink: 0;
    height: 2.5rem;
    justify-content: center;
    width: 2.5rem;
  }

  .orientation-title {
    font-size: 1.25rem;
    font-weight: 900;
    letter-spacing: 0;
    line-height: 1.2;
    margin: 0;
    max-width: none;
  }

  .orientation-subtitle {
    color: var(--color-muted);
    font-size: 0.85rem;
    margin-top: 0.15rem;
  }

  .orientation-close {
    align-items: center;
    background: none;
    border: none;
    border-radius: 999px;
    color: var(--color-muted-2);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 2rem;
    justify-content: center;
    margin-left: auto;
    padding: 0;
    transition: background 150ms ease, color 150ms ease;
    width: 2rem;
  }

  .orientation-close:hover {
    background: var(--color-panel-soft);
    color: var(--color-ink);
  }

  .orientation-body {
    display: grid;
    gap: 1rem;
    padding: 1rem 1.5rem;
  }

  .orientation-section h3 {
    font-size: 0.9rem;
    letter-spacing: 0;
    margin-bottom: 0.4rem;
    max-width: none;
  }

  .orientation-section p {
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .orientation-disclaimers {
    display: grid;
    gap: 0.85rem;
  }

  .disclaimer-banner {
    align-items: flex-start;
    background: var(--color-panel-soft);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    display: flex;
    gap: 0.75rem;
    padding: 0.9rem 1rem;
  }

  .disclaimer-banner svg {
    color: var(--color-accent);
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .disclaimer-banner strong {
    color: var(--color-ink);
    display: block;
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
  }

  .disclaimer-banner p {
    color: var(--color-muted);
    font-size: 0.82rem;
    line-height: 1.55;
  }

  .privacy-link {
    color: var(--color-accent);
    display: inline-block;
    font-size: 0.82rem;
    font-weight: 700;
    margin-top: 0.4rem;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .privacy-link:hover {
    color: var(--color-accent-2);
  }

  .orientation-footer {
    align-items: center;
    border-top: 1px solid var(--color-line);
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
  }

  .orientation-cancel {
    background: transparent;
    border: none;
    color: var(--color-muted);
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.5rem 0.75rem;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .orientation-cancel:hover {
    color: var(--color-ink);
  }

  .orientation-cta {
    background: var(--color-accent);
    border: none;
    border-radius: 999px;
    color: #fff;
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 800;
    padding: 0.65rem 1.25rem;
    transition: background 150ms ease, transform 150ms ease;
  }

  .orientation-cta:hover {
    background: var(--color-accent-2);
    transform: translateY(-1px);
  }
</style>
