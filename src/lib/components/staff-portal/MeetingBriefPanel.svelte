<script lang="ts">
  /**
   * MeetingBriefPanel — Meeting Brief preparation panel with readiness
   * controls, follow-up creation, responsive layout, and accessibility.
   */

  import type {
    StaffMeetingBriefDto,
    MeetingBriefStalenessWarning
  } from '$lib/staff-portal/dto';
  import { enhance } from '$app/forms';
  import { applyAction, deserialize } from '$app/forms';

  // ── Props ──

  let {
    meetingBrief = null,
    staleWarning = null,
    calendlyLink = null,
    assessmentId = ''
  }: {
    meetingBrief?: StaffMeetingBriefDto | null;
    staleWarning?: MeetingBriefStalenessWarning | null;
    calendlyLink?: string | null;
    assessmentId?: string;
  } = $props();

  // ── Local state ──

  let readinessExpanded = $state(false);
  let followUpExpanded = $state(false);

  let markReadyStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
  let markReadyError = $state<string | null>(null);
  let exceptionReason = $state('');
  let apiPath = $derived(`/api/operator/assessments/${assessmentId}/meeting-brief`);
  let followUpApiPath = $derived(`/api/operator/assessments/${assessmentId}/follow-ups`);
  let followUpError = $state<string | null>(null);

  // ── Helpers ──

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-AU', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }

  async function handleMarkReady() {
    if (markReadyStatus === 'loading') return; // duplicate-submit guard
    markReadyStatus = 'loading';
    markReadyError = null;

    try {
      const body: Record<string, unknown> = { status: 'ready' };
      if (exceptionReason) body.exceptionReason = exceptionReason;

      const res = await fetch(apiPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        markReadyStatus = 'success';
        exceptionReason = '';
        window.location.reload();
      } else {
        markReadyStatus = 'error';
        markReadyError = data.error?.message ?? 'Failed to mark ready.';
      }
    } catch (err) {
      markReadyStatus = 'error';
      markReadyError = 'Network error. Please try again.';
    }
  }

  async function handleCreateFollowUp() {
    if (!meetingBrief) return;
    followUpExpanded = true;
  }

  // ── Keyboard handlers ──

  function onFollowupKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      followUpExpanded = false;
    }
  }

  function onReadinessKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      readinessExpanded = false;
    }
  }

  async function submitFollowUp(e: SubmitEvent) {
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    followUpError = null;

    // Duplicate-submit guard: disable submit button immediately
    const submitBtn = form.querySelector<HTMLButtonElement>('[data-testid="mb-followup-submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch(followUpApiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: (formData.get('description') as string) || 'Follow-up from meeting',
          description: formData.get('description') as string,
          dueDate: formData.get('dueDate') as string || null,
          source: 'meeting_brief',
          linkedMeetingBriefId: meetingBrief?.id
        })
      });

      const data = await res.json();
      if (data.success) {
        followUpExpanded = false;
        window.location.reload();
      } else {
        followUpError = data.error?.message ?? 'Failed to create follow-up.';
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch {
      followUpError = 'Network error. Please try again.';
      if (submitBtn) submitBtn.disabled = false;
    }
  }
</script>

<section class="section" data-testid="meeting-brief-section" aria-label="Meeting Briefs">
  <div class="section-header">
    <h2 class="section-title">Meeting Brief</h2>
    {#if calendlyLink}
      <a href={calendlyLink} target="_blank" rel="noopener noreferrer" class="calendly-link">
        📅 Schedule via Calendly
      </a>
    {/if}
  </div>

  {#if staleWarning?.stale}
    <div class="mb-stale-warning" role="alert" data-testid="mb-stale-warning">
      ⚠ {staleWarning.message}
    </div>
  {/if}

  {#if meetingBrief}
    <!-- Main content card -->
    <div class="meeting-brief-card" data-testid="meeting-brief-content">
      {#if meetingBrief.meetingDate}
        <p class="mb-field"><strong>Meeting date:</strong> {meetingBrief.meetingDate}</p>
      {:else}
        <p class="mb-field mb-missing"><strong>Meeting date:</strong> <em>Not set</em></p>
      {/if}

      {#if meetingBrief.objective}
        <p class="mb-field"><strong>Objective:</strong> {meetingBrief.objective}</p>
      {/if}
      {#if meetingBrief.talkingPoints}
        <p class="mb-field"><strong>Talking points:</strong> {meetingBrief.talkingPoints}</p>
      {/if}
      {#if meetingBrief.sensitiveIssues}
        <p class="mb-field mb-sensitive"><strong>Sensitive issues:</strong> {meetingBrief.sensitiveIssues}</p>
      {/if}
      {#if meetingBrief.offerNextStep}
        <p class="mb-field"><strong>Offer / next step to discuss:</strong> {meetingBrief.offerNextStep}</p>
      {/if}
      {#if meetingBrief.followUpIntention}
        <p class="mb-field"><strong>Follow-up intention:</strong> {meetingBrief.followUpIntention}</p>
      {/if}
      {#if meetingBrief.finalAgendaNotes}
        <p class="mb-field"><strong>Final agenda / notes:</strong> {meetingBrief.finalAgendaNotes}</p>
      {/if}
      {#if meetingBrief.prepChecklist}
        <div class="mb-field">
          <strong>Prep checklist:</strong>
          <pre class="mb-checklist">{meetingBrief.prepChecklist}</pre>
        </div>
      {/if}

      <div class="mb-meta">
        <span class="state-badge state-{meetingBrief.status}" data-testid="mb-status-badge">{meetingBrief.status}</span>
        <span class="mb-timestamp">Updated: {formatDate(meetingBrief.updatedAt)}</span>
      </div>

      <!-- Linked report context -->
      {#if meetingBrief.linkedReportId}
        <div class="mb-field">
          <strong>Linked report:</strong> {meetingBrief.linkedReportId}
        </div>
      {/if}
    </div>

    <!-- Readiness checklist and mark-ready controls -->
    <button
      class="panel-toggle"
      onclick={() => { readinessExpanded = !readinessExpanded; }}
      aria-expanded={readinessExpanded}
      aria-controls="readiness-panel"
      data-testid="mb-readiness-toggle"
    >
      <span class="toggle-icon">{readinessExpanded ? '▾' : '▸'}</span>
      <span>Readiness &amp; State</span>
    </button>

    {#if readinessExpanded}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        id="readiness-panel"
        class="readiness-panel"
        data-testid="mb-readiness-panel"
        role="region"
        aria-label="Readiness and state"
        tabindex="-1"
        onkeydown={onReadinessKeydown}
      >
        <dl class="readiness-dl">
          <dt>Current state</dt>
          <dd><span class="state-badge state-{meetingBrief.status}">{meetingBrief.status}</span></dd>

          <dt>Freshness</dt>
          <dd>{staleWarning?.stale ? '⚠ Stale' : '✓ Fresh'}</dd>

          {#if meetingBrief.linkedReportId}
            <dt>Linked report</dt>
            <dd>{meetingBrief.linkedReportId}</dd>
          {:else}
            <dt>Linked report</dt>
            <dd><em>None — no approved deliverable required</em></dd>
          {/if}
        </dl>

        <!-- Mark Ready controls -->
        {#if meetingBrief.status !== 'completed' && meetingBrief.status !== 'ready'}
          <div class="mark-ready-section">
            <h4 class="readiness-subtitle">Mark Ready</h4>

            {#if markReadyStatus === 'success'}
              <p class="feedback-success" role="status" data-testid="mb-ready-success" aria-live="polite">
                ✓ Meeting Brief marked ready.
              </p>
            {:else}
              <!-- Exception reason field (for bypass when report not approved) -->
              <label class="exception-label">
                <span>Exception reason <em>(optional — bypass linked report approval check)</em></span>
                <input
                  type="text"
                  class="exception-input"
                  bind:value={exceptionReason}
                  placeholder="e.g. No approved deliverable required"
                  data-testid="mb-exception-reason"
                  disabled={markReadyStatus === 'loading'}
                  aria-describedby="mark-ready-desc"
                />
              </label>

              <div class="mark-ready-actions">
                <p id="mark-ready-desc" class="sr-only">Marks the meeting brief as ready for discussion</p>
                <button
                  class="btn btn-primary"
                  onclick={handleMarkReady}
                  disabled={markReadyStatus === 'loading'}
                  aria-busy={markReadyStatus === 'loading'}
                  data-testid="mb-mark-ready-btn"
                >
                  {markReadyStatus === 'loading' ? 'Marking…' : 'Mark Ready'}
                </button>

                {#if markReadyError}
                  <p class="feedback-error" role="alert" data-testid="mb-ready-error" aria-live="assertive">
                    {markReadyError}
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Follow-up creation -->
    <button
      class="panel-toggle"
      onclick={() => { followUpExpanded = !followUpExpanded; }}
      aria-expanded={followUpExpanded}
      aria-controls="followup-form"
      data-testid="mb-followup-toggle"
    >
      <span class="toggle-icon">{followUpExpanded ? '▾' : '▸'}</span>
      <span>Create Follow-up from Notes</span>
    </button>

    {#if followUpExpanded}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <form
        id="followup-form"
        class="followup-form"
        onsubmit={submitFollowUp}
        onkeydown={onFollowupKeydown}
        data-testid="mb-followup-form"
        aria-label="Create follow-up from meeting notes"
      >
        <label class="followup-label">
          <span>Description</span>
          <textarea
            name="description"
            class="followup-textarea"
            required
            value={meetingBrief.objective ?? meetingBrief.talkingPoints ?? ''}
            placeholder="Follow-up description from meeting notes…"
            data-testid="mb-followup-desc"
          ></textarea>
        </label>

        <label class="followup-label">
          <span>Due date <em>(optional)</em></span>
          <input
            type="date"
            name="dueDate"
            class="followup-date"
            data-testid="mb-followup-date"
          />
        </label>

        <div class="followup-actions">
          <button type="submit" class="btn btn-primary" data-testid="mb-followup-submit">
            Create Follow-up
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            onclick={() => { followUpExpanded = false; }}
            data-testid="mb-followup-cancel"
          >
            Cancel
          </button>
        </div>

        <p class="feedback-error" data-testid="fu-error" role="alert" aria-live="polite">{followUpError}</p>
      </form>
    {/if}
  {:else}
    <p class="empty-note">No meeting brief yet. <em>Draft notes will appear here once saved.</em></p>
  {/if}
</section>

<style>
  /* ── Panel toggle ── */
  .panel-toggle {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
    text-align: left;
    background: var(--color-panel-soft);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-ink-2);
    cursor: pointer;
  }
  .panel-toggle:hover {
    background: var(--color-panel);
  }
  .panel-toggle:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .toggle-icon {
    flex-shrink: 0;
    width: 1em;
    text-align: center;
  }

  /* ── Readiness panel ── */
  .readiness-panel {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    padding: 0.75rem;
    margin-top: 0.25rem;
  }

  .readiness-dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.35rem 0.75rem;
    font-size: 0.8125rem;
    margin: 0 0 0.75rem;
  }
  .readiness-dl dt {
    font-weight: 600;
    color: var(--color-ink-2);
  }
  .readiness-dl dd {
    margin: 0;
  }

  .readiness-subtitle {
    font-size: 0.8125rem;
    margin: 0 0 0.5rem;
  }

  .mark-ready-section {
    border-top: 1px solid var(--color-line);
    padding-top: 0.75rem;
  }

  .exception-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }
  .exception-label span em {
    color: var(--color-muted);
    font-style: italic;
  }
  .exception-input {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    max-width: 100%;
    box-sizing: border-box;
  }

  .mark-ready-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    white-space: nowrap;
  }
  .btn-primary {
    background: var(--color-accent);
    color: white;
  }
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn-ghost {
    background: transparent;
    border-color: var(--color-line);
    color: var(--color-ink-2);
  }
  .btn-ghost:hover {
    background: var(--color-panel-soft);
  }

  .feedback-success {
    font-size: 0.8125rem;
    color: #15803d;
  }
  .feedback-error {
    font-size: 0.8125rem;
    color: #b91c1c;
    margin: 0.25rem 0 0;
  }

  /* ── Follow-up form ── */
  .followup-form {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    padding: 0.75rem;
    margin-top: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .followup-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
  }
  .followup-label span em {
    color: var(--color-muted);
    font-style: italic;
  }

  .followup-textarea {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    font-family: inherit;
    min-height: 4rem;
    resize: vertical;
    max-width: 100%;
    box-sizing: border-box;
  }

  .followup-date {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    max-width: 12rem;
    box-sizing: border-box;
  }

  .followup-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
    flex-wrap: wrap;
  }

  /* ── State badge ── */
  .state-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-sm);
  }
  :global(.state-draft),
  :global(.state-not_available) { background: var(--color-panel-soft); color: var(--color-muted); }
  :global(.state-ready) { background: #f0fdf4; color: #15803d; }
  :global(.state-needsReview) { background: var(--color-accent-light); color: var(--color-accent); }
  :global(.state-stale) { background: #fffbeb; color: #b45309; }
  :global(.state-completed) { background: var(--color-panel-soft); color: var(--color-muted); }

  /* ── Screen reader only ── */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ── Responsive ── */

  /* Tablet and below */
  @media (max-width: 768px) {
    .readiness-dl {
      grid-template-columns: 1fr;
      gap: 0.25rem;
    }
    .readiness-dl dt {
      margin-top: 0.35rem;
    }
    .readiness-dl dt:first-child {
      margin-top: 0;
    }

    .exception-input {
      font-size: 16px; /* prevent iOS zoom on focus */
    }

    .followup-textarea {
      font-size: 16px;
    }

    .followup-date {
      font-size: 16px;
      max-width: 100%;
    }

    .btn {
      flex: 1;
      text-align: center;
    }
  }

  /* Mobile */
  @media (max-width: 480px) {
    .section-header {
      flex-direction: column;
      gap: 0.375rem;
    }

    .calendly-link {
      align-self: flex-start;
    }

    .followup-actions {
      flex-direction: column;
    }

    .followup-actions .btn {
      width: 100%;
    }
  }
</style>
