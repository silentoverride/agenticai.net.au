<script lang="ts">
  /**
   * SummaryReview — Post-intake summary, edit, and confirmation step.
   *
   * Presents a structured summary of the user's intake answers.
   * Allows inline editing and per-section retrigger of Annie chat.
   * On explicit confirmation, calls the server to queue the assessment.
   */

  import { Progress } from '$lib/components/ui';

  let {
    summary = $bindable<Array<{ question: string; answer: string; followUpAnswer?: string }>>([]),
    sessionId = '',
    customerName = '',
    customerEmail = '',
    company = '',
    onComplete = () => {},
    onBack = () => {}
  }: {
    summary?: Array<{ question: string; answer: string; followUpAnswer?: string }>;
    sessionId?: string;
    customerName?: string;
    customerEmail?: string;
    company?: string;
    onComplete?: () => void;
    onBack?: () => void;
  } = $props();

  let isEditing = $state<Record<number, boolean>>({});
  let editValues = $state<Record<number, string>>({});
  let confirming = $state(false);
  let confirmed = $state(false);
  let error = $state('');
  let queueStatus = $state<'idle' | 'queuing' | 'queued'>('idle');
  let estimatedMinutes = $state(48);

  function sectionTitle(questionId: string): string {
    const titles: Record<string, string> = {
      business_overview: 'Business Profile',
      current_tools: 'Current Tools & Tech Stack',
      pain_points: 'Pain Points & Bottlenecks',
      ai_readiness: 'AI Readiness',
      budget: 'Budget & Investment',
      timeline: 'Timeline & Urgency'
    };
    return titles[questionId] || questionId;
  }

  function startEdit(index: number) {
    isEditing = { ...isEditing, [index]: true };
    editValues = { ...editValues, [index]: summary[index]?.answer || '' };
  }

  function saveEdit(index: number, questionId: string) {
    const updated = [...summary];
    updated[index] = { ...updated[index], answer: editValues[index] || updated[index].answer };
    summary = updated;
    isEditing = { ...isEditing, [index]: false };
  }

  function cancelEdit(index: number) {
    isEditing = { ...isEditing, [index]: false };
  }

  async function handleConfirm() {
    confirming = true;
    error = '';
    queueStatus = 'queuing';

    try {
      const res = await fetch('/api/assessment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          summary: summary.map(s => ({
            question: s.question,
            answer: s.answer,
            followUpAnswer: s.followUpAnswer
          })),
          customerName,
          customerEmail,
          company,
          source: 'annie-chat-intake'
        })
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errBody?.message || `Server error: ${res.status}`);
      }

      const data = (await res.json()) as { url: string };
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      queueStatus = 'idle';
      confirming = false;
    }
  }
</script>

{#if queueStatus === 'queued'}
  <!-- Assessment Queued State -->
  <div class="queued-container">
    <div class="queued-icon" aria-hidden="true">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    </div>
    <h2>Your assessment is being prepared</h2>
    <p class="queued-subtitle">
      Annie is analysing your responses and building your personalised AI business assessment report.
    </p>
    <div class="queued-status">
      <Progress value={25} />
      <span class="queued-estimate">Estimated completion: within {estimatedMinutes} hours</span>
    </div>
    <div class="queued-info">
      <div class="queued-info-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>Your data is encrypted and stored securely</span>
      </div>
      <div class="queued-info-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>We'll email you when the report is ready</span>
      </div>
      <div class="queued-info-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>You can check progress anytime via your assessment page</span>
      </div>
    </div>
  </div>
{:else}
  <!-- Summary Review -->
  <div class="summary-review">
    <div class="summary-header">
      <h2>Review your assessment summary</h2>
      <p>Please check the information below is correct before we start processing your assessment.</p>
    </div>

    <div class="summary-sections">
      {#each summary as item, i}
        <div class="summary-section">
          <div class="summary-section-header">
            <strong>{sectionTitle((item as any).questionId || '') || `Section ${i + 1}`}</strong>
            {#if !isEditing[i]}
              <button class="summary-edit-btn" onclick={() => startEdit(i)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            {/if}
          </div>

          {#if isEditing[i]}
            <div class="summary-edit-area">
              <textarea
                bind:value={editValues[i]}
                class="summary-textarea"
                rows="3"
                aria-label="Edit your answer for {item.question}"
              ></textarea>
              <div class="summary-edit-actions">
                <button class="edit-cancel" onclick={() => cancelEdit(i)}>Cancel</button>
                <button class="edit-save" onclick={() => saveEdit(i, (item as any).questionId)}>Save</button>
              </div>
            </div>
          {:else}
            <p class="summary-answer">{item.answer}</p>
            {#if item.followUpAnswer}
              <p class="summary-followup">
                <span class="summary-followup-label">Follow-up:</span> {item.followUpAnswer}
              </p>
            {/if}
          {/if}
        </div>
      {/each}
    </div>

    {#if error}
      <div class="summary-error" role="alert">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {error}
      </div>
    {/if}

    <div class="summary-actions">
      <button class="summary-back" onclick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to chat
      </button>
      <button
        class="summary-confirm"
        onclick={handleConfirm}
        disabled={confirming}
      >
        {#if confirming}
          <span class="confirm-spinner"></span>
          Queuing assessment...
        {:else}
          Confirm & Start Assessment
        {/if}
      </button>
    </div>
  </div>
{/if}

<style>
  /* ── Summary Review ─────────────────────────────────────── */
  .summary-review {
    display: grid;
    gap: 1.5rem;
    margin: 0 auto;
    max-width: 640px;
    padding: 2rem 0;
  }

  .summary-header {
    text-align: center;
  }

  .summary-header h2 {
    font-size: 1.3rem;
    max-width: none;
  }

  .summary-header p {
    color: var(--color-muted);
    font-size: 0.9rem;
    margin-top: 0.3rem;
  }

  .summary-sections {
    display: grid;
    gap: 1rem;
  }

  .summary-section {
    background: var(--color-panel);
    border: 1.5px solid var(--color-line);
    border-radius: var(--radius);
    padding: 1rem 1.25rem;
  }

  .summary-section-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .summary-section-header strong {
    font-size: 0.85rem;
    letter-spacing: 0;
    max-width: none;
  }

  .summary-edit-btn {
    align-items: center;
    background: none;
    border: none;
    color: var(--color-accent-text);
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    gap: 0.3rem;
    padding: 0.25rem 0.4rem;
  }

  .summary-edit-btn:hover {
    color: var(--color-accent-2);
    text-decoration: underline;
  }

  .summary-answer {
    color: var(--color-ink-2);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .summary-followup {
    color: var(--color-muted);
    font-size: 0.82rem;
    margin-top: 0.35rem;
  }

  .summary-followup-label {
    font-weight: 700;
  }

  /* ── Inline Edit ────────────────────────────────────────── */
  .summary-edit-area {
    display: grid;
    gap: 0.5rem;
  }

  .summary-textarea {
    background: var(--color-panel-soft);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    color: var(--color-ink);
    font: inherit;
    font-size: 0.9rem;
    line-height: 1.6;
    outline: none;
    padding: 0.6rem 0.8rem;
    resize: vertical;
    width: 100%;
  }

  .summary-textarea:focus {
    border-color: var(--color-accent-text);
  }

  .summary-edit-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .edit-cancel {
    background: transparent;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    color: var(--color-muted);
    cursor: pointer;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.35rem 0.85rem;
  }

  .edit-cancel:hover {
    color: var(--color-ink);
  }

  .edit-save {
    background: var(--color-accent);
    border: none;
    border-radius: 999px;
    color: #fff;
    cursor: pointer;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    padding: 0.35rem 0.85rem;
    transition: background 150ms ease;
  }

  .edit-save:hover {
    background: var(--color-accent-2);
  }

  /* ── Actions ────────────────────────────────────────────── */
  .summary-actions {
    align-items: center;
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .summary-back {
    align-items: center;
    background: transparent;
    border: none;
    color: var(--color-muted);
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    gap: 0.35rem;
    padding: 0.5rem 0.75rem;
  }

  .summary-back:hover {
    color: var(--color-ink);
  }

  .summary-confirm {
    align-items: center;
    background: var(--color-accent);
    border: none;
    border-radius: 999px;
    color: #fff;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-size: 0.95rem;
    font-weight: 800;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    transition: background 150ms ease, transform 150ms ease;
  }

  .summary-confirm:hover:not(:disabled) {
    background: var(--color-accent-2);
    transform: translateY(-1px);
  }

  .summary-confirm:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .confirm-spinner {
    animation: spin 0.8s linear infinite;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    display: inline-block;
    height: 1rem;
    width: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Error ──────────────────────────────────────────────── */
  .summary-error {
    align-items: center;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-sm);
    color: #b91c1c;
    display: flex;
    font-size: 0.85rem;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }

  /* ── Queued State ───────────────────────────────────────── */
  .queued-container {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 0 auto;
    max-width: 500px;
    padding: 3rem 1rem;
    text-align: center;
  }

  .queued-icon {
    color: var(--color-accent-text);
  }

  .queued-container h2 {
    font-size: 1.3rem;
    max-width: none;
  }

  .queued-subtitle {
    color: var(--color-muted);
    font-size: 0.9rem;
  }

  .queued-status {
    display: grid;
    gap: 0.5rem;
    width: 100%;
  }

  .queued-estimate {
    color: var(--color-muted-2);
    font-size: 0.78rem;
  }

  .queued-info {
    display: grid;
    gap: 0.6rem;
    margin-top: 0.5rem;
    text-align: left;
  }

  .queued-info-item {
    align-items: center;
    color: var(--color-muted);
    display: flex;
    font-size: 0.82rem;
    gap: 0.6rem;
  }

  .queued-info-item svg {
    color: var(--color-accent-text);
    flex-shrink: 0;
  }
</style>
