<script lang="ts">
  /**
   * ResumePrompt — Shows when a returning user has an incomplete intake session.
   * Offers to resume from where they left off, or start fresh.
   */

  let {
    sessionId = '',
    lastQuestionIndex = 0,
    totalQuestions = 6,
    expiresInSeconds = 86400,
    onResume = () => {},
    onStartFresh = () => {}
  }: {
    sessionId?: string;
    lastQuestionIndex?: number;
    totalQuestions?: number;
    expiresInSeconds?: number;
    onResume?: () => void;
    onStartFresh?: () => void;
  } = $props();

  const remainingQuestions = $derived(totalQuestions - Math.min(lastQuestionIndex + 1, totalQuestions));
  const expiresHours = $derived(Math.max(1, Math.round(expiresInSeconds / 3600)));
  const progressPct = $derived(totalQuestions > 0 ? Math.round(((lastQuestionIndex + 1) / totalQuestions) * 100) : 0);
</script>

<div class="resume-prompt" role="dialog" aria-label="Resume assessment">
  <div class="resume-icon" aria-hidden="true">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  </div>

  <h2>You have an assessment in progress</h2>
  <p class="resume-subtitle">
    You completed <strong>{progressPct}%</strong> of the questions ({remainingQuestions} remaining).
    Your session expires in about <strong>{expiresHours} hour{expiresHours > 1 ? 's' : ''}</strong>.
  </p>

  <div class="resume-progress" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
    <div class="resume-progress-fill" style="width: {progressPct}%"></div>
  </div>

  <p class="resume-context">
    You were last answering questions about your business profile and tools.
  </p>

  <div class="resume-actions">
    <button class="resume-btn resume-continue" onclick={onResume}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      Continue where I left off
    </button>
    <button class="resume-btn resume-fresh" onclick={onStartFresh}>
      Start fresh
    </button>
  </div>
</div>

<style>
  .resume-prompt {
    background: var(--color-panel);
    border: 1.5px solid var(--color-line);
    border-radius: var(--radius);
    display: grid;
    gap: 1rem;
    margin: 3rem auto;
    max-width: 480px;
    padding: 2rem;
    text-align: center;
  }

  .resume-icon {
    color: var(--color-accent);
  }

  .resume-prompt h2 {
    font-size: 1.2rem;
    max-width: none;
  }

  .resume-subtitle {
    color: var(--color-muted);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .resume-progress {
    background: var(--color-panel-soft);
    border-radius: 999px;
    height: 6px;
    overflow: hidden;
  }

  .resume-progress-fill {
    background: var(--color-accent);
    border-radius: 999px;
    height: 100%;
    transition: width 500ms ease;
  }

  .resume-context {
    color: var(--color-muted-2);
    font-size: 0.82rem;
  }

  .resume-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .resume-btn {
    align-items: center;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 700;
    gap: 0.4rem;
    justify-content: center;
    padding: 0.7rem 1.25rem;
    transition: background 150ms ease, transform 150ms ease;
  }

  .resume-continue {
    background: var(--color-accent);
    color: #fff;
  }

  .resume-continue:hover {
    background: var(--color-accent-2);
    transform: translateY(-1px);
  }

  .resume-fresh {
    background: transparent;
    border: 1px solid var(--color-line);
    color: var(--color-muted);
  }

  .resume-fresh:hover {
    border-color: var(--color-muted-2);
    color: var(--color-ink);
  }
</style>
