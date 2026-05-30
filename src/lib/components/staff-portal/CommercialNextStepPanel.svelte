<script lang="ts">
  /**
   * CommercialNextStepPanel — Staff-entered commercial next step with status,
   * owner, notes, follow-up continuity validation, audit receipts,
   * confirmation for risky changes, responsive layout, and accessibility.
   */

  import type {
    StaffCommercialNextStepDto,
    StaffActionReceiptDto,
    CommercialNextStepStatus,
    CommercialDisplayState
  } from '$lib/staff-portal/dto';
  import { COMMERCIAL_NEXT_STEP_STATUSES, COMMERCIAL_DISPLAY_STATES } from '$lib/staff-portal/commercial-utils';
  import { isHighIntentStatus } from '$lib/staff-portal/commercial-utils';
  import { requiresConfirmation } from '$lib/staff-portal/commercial-utils';

  // ── Props ──

  let {
    commercialStep = null,
    assessmentId = ''
  }: {
    commercialStep?: StaffCommercialNextStepDto | null;
    assessmentId?: string;
  } = $props();

  // ── Local state ──

  let expanded = $state(false);
  let isEditing = $state(false);
  let saveStatus = $state<'idle' | 'saving' | 'success' | 'error'>('idle');
  let saveError = $state<string | null>(null);

  let editStatus = $state<CommercialNextStepStatus>('noAction');
  let editOwner = $state('');
  let editNotes = $state('');

  // Follow-up continuity fields
  let followUpNote = $state('');
  let showConfirmation = $state(false);
  let pendingSave = $state(false);

  // Audit receipt
  let lastReceipt = $state<StaffActionReceiptDto | null>(null);
  let showReceipt = $state(false);

  let apiUrl = $derived(`/api/staff/assessments/${assessmentId}/commercial-next-step`);

  type SaveCommercialStepResult = {
    success: boolean;
    commercialStep?: StaffCommercialNextStepDto | null;
    receipt?: StaffActionReceiptDto | null;
    error?: { message?: string };
  };

  // ── Derived ──

  let isHighIntentChange = $derived(
    isHighIntentStatus(editStatus) &&
    (!commercialStep || commercialStep.status !== editStatus)
  );

  let needsConfirmation = $derived(
    commercialStep && requiresConfirmation(
      commercialStep.status,
      editStatus,
      commercialStep.owner,
      editOwner || null
    )
  );

  // ── Status labels ──

  const STATUS_LABELS: Record<CommercialNextStepStatus, string> = {
    noAction: 'No action',
    nurture: 'Nurture',
    discussOffer: 'Discuss offer',
    sendFollowUp: 'Send follow-up',
    createFutureOpportunity: 'Create future opportunity',
    not_available: 'Not available'
  };

  const DISPLAY_LABELS: Record<CommercialDisplayState, string> = {
    missing: 'Not set',
    draft: 'Draft',
    active: 'Active',
    needsFollowUp: 'Needs follow-up',
    completed: 'Completed',
    deferred: 'Deferred',
    cancelled: 'Cancelled',
    stale: 'Stale'
  };

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

  function startEditing() {
    editStatus = commercialStep?.status ?? 'noAction';
    editOwner = commercialStep?.owner ?? '';
    editNotes = commercialStep?.notes ?? '';
    followUpNote = '';
    showConfirmation = false;
    showReceipt = false;
    isEditing = true;
    saveError = null;
  }

  function cancelEditing() {
    isEditing = false;
    showConfirmation = false;
    pendingSave = false;
    saveError = null;
  }

  function confirmSave() {
    showConfirmation = false;
    pendingSave = false;
    doSave();
  }

  function cancelConfirm() {
    showConfirmation = false;
    pendingSave = false;
  }

  // ── Keyboard handlers ──

  function onConfirmKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      showConfirmation = false;
    }
  }

  function onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('confirm-overlay')) {
      showConfirmation = false;
    }
  }

  // ── Save logic ──

  async function doSave() {
    // Duplicate-submit guard
    if (saveStatus === 'saving') return;

    saveStatus = 'saving';
    saveError = null;

    const body: Record<string, unknown> = {
      status: editStatus,
      owner: editOwner || null,
      notes: editNotes || null
    };

    // Include follow-up continuity fields when relevant
    if (isHighIntentChange && followUpNote.trim()) {
      body.followUpNote = followUpNote.trim();
    } else if (isHighIntentChange && !followUpNote.trim()) {
      body.confirmedNoFollowUp = true;
    }

    body.idempotencyKey = `commercial:${assessmentId}:${Date.now()}`;

    try {
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json() as SaveCommercialStepResult;
      if (data.success) {
        commercialStep = data.commercialStep ?? null;
        lastReceipt = data.receipt ?? null;
        showReceipt = true;
        saveStatus = 'success';
        isEditing = false;
        showConfirmation = false;

        // Auto-hide receipt after 8 seconds
        if (data.receipt) {
          setTimeout(() => { showReceipt = false; }, 8000);
        }
      } else {
        saveStatus = 'error';
        saveError = data.error?.message ?? 'Failed to save.';
      }
    } catch {
      saveStatus = 'error';
      saveError = 'Network error. Please try again.';
    }
  }

  async function save() {
    // Show confirmation for risky changes before saving
    if (needsConfirmation) {
      showConfirmation = true;
      return;
    }

    await doSave();
  }

  function dismissReceipt() {
    showReceipt = false;
  }
</script>

<section class="section" data-testid="commercial-next-step-section" aria-label="Commercial Next Step">
  <div class="section-header">
    <h2 class="section-title">Commercial Next Step</h2>
    <span class="header-note">Staff-entered · Operational</span>
  </div>

  {#if isEditing}
    <div class="step-card" data-testid="commercial-step-editing">
      <div class="edit-form">
        <label class="field-label" for="cs-status">Status</label>
        <select id="cs-status" class="field-select" bind:value={editStatus} data-testid="cs-status-select">
          {#each Object.entries(COMMERCIAL_NEXT_STEP_STATUSES) as [, val]}
            {#if val !== 'not_available'}
              <option value={val}>{STATUS_LABELS[val]}</option>
            {/if}
          {/each}
        </select>

        <label class="field-label" for="cs-owner">Owner</label>
        <input
          id="cs-owner"
          class="field-input"
          type="text"
          bind:value={editOwner}
          placeholder="e.g. Sarah (staffer)"
          maxlength="200"
          data-testid="cs-owner-input"
        />

        <label class="field-label" for="cs-notes">Notes</label>
        <textarea
          id="cs-notes"
          class="field-textarea"
          bind:value={editNotes}
          placeholder="Brief operational notes about the next step..."
          maxlength="2000"
          rows="3"
          data-testid="cs-notes-input"
        ></textarea>

        {#if isHighIntentChange}
          <div class="followup-continuity" data-testid="cs-followup-continuity">
            <label class="field-label" for="cs-followup-note">
              Follow-up explanation <span class="label-hint">(required for this status)</span>
            </label>
            <textarea
              id="cs-followup-note"
              class="field-textarea continuity-textarea"
              bind:value={followUpNote}
              placeholder="Explain why no follow-up is needed, or describe the follow-up plan..."
              maxlength="2000"
              rows="2"
              data-testid="cs-followup-note"
            ></textarea>
            <p class="continuity-hint">
              Status "{STATUS_LABELS[editStatus]}" requires follow-up continuity.
              Provide a note or <button class="link-btn" onclick={() => { followUpNote = 'CONFIRMED_NO_FOLLOWUP'; }} data-testid="cs-confirm-no-followup">confirm no follow-up needed</button>.
            </p>
          </div>
        {/if}

        {#if saveError}
          <p class="feedback-error" role="alert">{saveError}</p>
        {/if}

        <div class="edit-actions">
          <button class="btn btn-secondary" onclick={cancelEditing} disabled={saveStatus === 'saving'}>Cancel</button>
          <button class="btn btn-primary" onclick={save} disabled={saveStatus === 'saving'} aria-busy={saveStatus === 'saving'} data-testid="cs-save-btn">
            {saveStatus === 'saving' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  {:else if commercialStep}
    <div class="step-card" data-testid="commercial-step-content">
      <dl class="step-fields">
        <div class="field-row">
          <dt>Status</dt>
          <dd>
            <span class="state-badge state-{commercialStep.displayState}" data-testid="cs-display-state">
              {DISPLAY_LABELS[commercialStep.displayState]}
            </span>
            <span class="field-value">{STATUS_LABELS[commercialStep.status]}</span>
          </dd>
        </div>
        <div class="field-row">
          <dt>Owner</dt>
          <dd>
            {#if commercialStep.owner}
              {commercialStep.owner}
            {:else}
              <em class="empty">Not assigned</em>
            {/if}
          </dd>
        </div>
        <div class="field-row">
          <dt>Notes</dt>
          <dd>
            {#if commercialStep.notes}
              {commercialStep.notes}
            {:else}
              <em class="empty">No notes</em>
            {/if}
          </dd>
        </div>
      </dl>

      <div class="step-meta">
        <span class="step-timestamp">Updated: {formatDate(commercialStep.updatedAt)}</span>
      </div>

      {#if showReceipt && lastReceipt}
        <div class="receipt-banner" data-testid="cs-receipt" role="status" aria-live="polite">
          <span class="receipt-icon" aria-hidden="true">✓</span>
          <span class="receipt-text">Saved. Action: {lastReceipt.action} | Ref: <code>{lastReceipt.id.slice(0, 8)}</code></span>
          <button class="receipt-dismiss" onclick={dismissReceipt} aria-label="Dismiss">×</button>
        </div>
      {/if}

      <div class="step-actions">
        <button class="btn btn-secondary btn-sm" onclick={startEditing} data-testid="cs-edit-btn">Edit</button>
      </div>
    </div>
  {:else}
    <div class="step-card step-empty" data-testid="cs-empty-state">
      <p class="empty-note">No commercial next step recorded. <em>Staff can enter the next step here.</em></p>
      <button class="btn btn-secondary btn-sm" onclick={startEditing} data-testid="cs-add-btn">+ Add next step</button>
    </div>
  {/if}

  {#if showConfirmation}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="confirm-overlay"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onclick={onOverlayClick}
      onkeydown={onConfirmKeydown}
    >
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="confirm-dialog" onclick={(e: MouseEvent) => e.stopPropagation()} onkeydown={(e: KeyboardEvent) => e.stopPropagation()}>
        <h3 id="confirm-title" class="confirm-title">Confirm commercial change</h3>
        <p class="confirm-text">
          You are changing from <strong>{commercialStep?.status ?? 'none'}</strong>
          {#if needsConfirmation}
            to <strong>{editStatus}</strong>
            {#if commercialStep?.owner !== editOwner && editOwner}
              and reassigning owner from <strong>{commercialStep?.owner ?? 'unassigned'}</strong> to <strong>{editOwner}</strong>
            {/if}
          {/if}.
          This is a significant commercial action. Are you sure?
        </p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" onclick={cancelConfirm} data-testid="cs-confirm-cancel">Cancel</button>
          <button class="btn btn-primary" onclick={confirmSave} data-testid="cs-confirm-yes">Confirm</button>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  /* ── Section layout ── */
  .section { padding: 0; }

  .section-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .header-note {
    font-size: 0.6875rem;
    color: var(--color-muted);
    font-style: italic;
  }

  /* ── Card ── */
  .step-card {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    padding: 1rem;
  }

  .step-empty {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty-note {
    font-size: 0.8125rem;
    color: var(--color-muted);
    margin: 0;
  }

  /* ── Fields (read mode) ── */
  .step-fields {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
  }

  .field-row {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8125rem;
  }

  .field-row dt {
    min-width: 4rem;
    font-weight: 600;
    color: var(--color-muted);
    flex-shrink: 0;
  }

  .field-row dd {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: wrap;
  }

  .field-value { color: var(--color-text); }

  .empty { color: var(--color-muted); font-style: italic; }

  /* ── State badge ── */
  .state-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-sm);
  }

  .state-missing, .state-draft { background: var(--color-panel-soft); color: var(--color-muted); }
  .state-active { background: #eff6ff; color: #1d4ed8; }
  .state-needsFollowUp { background: #fffbeb; color: #b45309; }
  .state-completed { background: #f0fdf4; color: #15803d; }
  .state-deferred { background: var(--color-panel-soft); color: var(--color-muted); }
  .state-cancelled { background: #fef2f2; color: #dc2626; }
  .state-stale { background: #fff7ed; color: #c2410c; }

  /* ── Follow-up continuity ── */
  .followup-continuity {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: var(--radius-sm);
    padding: 0.625rem;
  }

  .label-hint {
    font-weight: 400;
    color: var(--color-muted);
    font-size: 0.75rem;
  }

  .continuity-textarea {
    margin-top: 0.25rem;
  }

  .continuity-hint {
    font-size: 0.75rem;
    color: #92400e;
    margin: 0.25rem 0 0;
  }

  .link-btn {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: #2563eb;
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.75rem;
  }

  .link-btn:hover { color: #1d4ed8; }

  /* ── Edit form ── */
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .field-label { font-size: 0.8125rem; font-weight: 600; }

  .field-select {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    max-width: 16rem;
    box-sizing: border-box;
  }

  .field-input {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    max-width: 20rem;
    box-sizing: border-box;
  }

  .field-textarea {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    min-height: 4rem;
    resize: vertical;
    max-width: 100%;
    box-sizing: border-box;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .feedback-error { color: #dc2626; font-size: 0.75rem; margin: 0; }

  /* ── Receipt banner ── */
  .receipt-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    color: #15803d;
  }

  .receipt-icon { font-weight: 700; font-size: 0.875rem; }

  .receipt-text {
    flex: 1;
    word-break: break-word;
  }

  .receipt-dismiss {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    color: #15803d;
    padding: 0 0.25rem;
    line-height: 1;
    flex-shrink: 0;
  }

  /* ── Meta & actions ── */
  .step-meta { margin-top: 0.75rem; }

  .step-timestamp { font-size: 0.6875rem; color: var(--color-muted); }

  .step-actions { margin-top: 0.75rem; }

  /* ── Confirmation dialog ── */
  .confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  }

  .confirm-dialog {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    padding: 1.25rem;
    max-width: 28rem;
    width: 100%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 90vh;
    overflow-y: auto;
    box-sizing: border-box;
  }

  .confirm-title { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; }

  .confirm-text { font-size: 0.8125rem; color: var(--color-muted); margin: 0 0 1rem; line-height: 1.5; }

  .confirm-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  /* ── Buttons ── */
  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    white-space: nowrap;
  }

  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-primary {
    background: var(--color-primary, #2563eb);
    color: #fff;
    border-color: var(--color-primary, #2563eb);
  }

  .btn-primary:focus-visible {
    outline: 2px solid var(--color-primary, #2563eb);
    outline-offset: 2px;
  }

  .btn-secondary {
    background: var(--color-panel-soft);
    color: var(--color-text);
    border-color: var(--color-line);
  }

  .btn-secondary:focus-visible {
    outline: 2px solid var(--color-line);
    outline-offset: 2px;
  }

  .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }

  /* ── Responsive ── */

  @media (max-width: 768px) {
    .section-header {
      flex-wrap: wrap;
    }

    .field-select,
    .field-input {
      max-width: 100%;
      font-size: 16px; /* prevent iOS zoom */
    }

    .field-textarea {
      font-size: 16px;
    }

    .field-row {
      flex-direction: column;
      gap: 0.15rem;
    }

    .field-row dt {
      min-width: auto;
    }

    .edit-actions {
      flex-direction: column;
    }

    .edit-actions .btn {
      width: 100%;
      text-align: center;
    }

    .confirm-actions {
      flex-direction: column;
    }

    .confirm-actions .btn {
      width: 100%;
      text-align: center;
    }

    .step-meta {
      flex-direction: column;
      gap: 0.25rem;
    }

    .receipt-banner {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 480px) {
    .step-card {
      padding: 0.75rem;
    }

    .confirm-dialog {
      padding: 1rem;
    }
  }
</style>
