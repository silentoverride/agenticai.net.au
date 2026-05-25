<script lang="ts">
  /**
   * CommercialNextStepPanel — Staff-entered commercial next step with status,
   * owner, notes, and display state. Operational record, not CRM/pipeline.
   */

  import type { StaffCommercialNextStepDto, CommercialNextStepStatus, CommercialDisplayState } from '$lib/staff-portal/dto';
  import { COMMERCIAL_NEXT_STEP_STATUSES, COMMERCIAL_DISPLAY_STATES } from '$lib/server/staff-portal/domain/commercial-next-step-states';

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

  let apiUrl = $derived(`/api/operator/assessments/${assessmentId}/commercial-next-step`);

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
    isEditing = true;
    saveError = null;
  }

  function cancelEditing() {
    isEditing = false;
    saveError = null;
  }

  async function save() {
    saveStatus = 'saving';
    saveError = null;

    try {
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          owner: editOwner || null,
          notes: editNotes || null
        })
      });

      const data = await res.json();
      if (data.success) {
        commercialStep = data.commercialStep;
        saveStatus = 'success';
        isEditing = false;
      } else {
        saveStatus = 'error';
        saveError = data.error?.message ?? 'Failed to save.';
      }
    } catch {
      saveStatus = 'error';
      saveError = 'Network error. Please try again.';
    }
  }
</script>

<section class="section" data-testid="commercial-next-step-section" aria-label="Commercial Next Step">
  <div class="section-header">
    <h2 class="section-title">Commercial Next Step</h2>
    <span class="header-note">Staff-entered · Operational</span>
  </div>

  {#if commercialStep}
    <div class="step-card" data-testid="commercial-step-content">
      {#if isEditing}
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
            placeholder="e.g. Sarah (operator)"
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

          {#if saveError}
            <p class="feedback-error" role="alert">{saveError}</p>
          {/if}

          <div class="edit-actions">
            <button class="btn btn-secondary" onclick={cancelEditing} disabled={saveStatus === 'saving'}>Cancel</button>
            <button class="btn btn-primary" onclick={save} disabled={saveStatus === 'saving'} data-testid="cs-save-btn">
              {saveStatus === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      {:else}
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
            <dd>{commercialStep.owner ?? <em class="empty">Not assigned</em>}</dd>
          </div>
          <div class="field-row">
            <dt>Notes</dt>
            <dd>{commercialStep.notes ?? <em class="empty">No notes</em>}</dd>
          </div>
        </dl>

        <div class="step-meta">
          <span class="step-timestamp">Updated: {formatDate(commercialStep.updatedAt)}</span>
        </div>

        <div class="step-actions">
          <button class="btn btn-secondary btn-sm" onclick={startEditing} data-testid="cs-edit-btn">Edit</button>
        </div>
      {/if}
    </div>
  {:else}
    <div class="step-card step-empty" data-testid="cs-empty-state">
      <p class="empty-note">No commercial next step recorded. <em>Staff can enter the next step here.</em></p>
      <button class="btn btn-secondary btn-sm" onclick={startEditing} data-testid="cs-add-btn">+ Add next step</button>
    </div>
  {/if}
</section>

<style>
  /* ── Section layout (matches other panels) ── */
  .section {
    padding: 0;
  }

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
  }

  .field-row dd {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: wrap;
  }

  .field-value {
    color: var(--color-text);
  }

  .empty {
    color: var(--color-muted);
    font-style: italic;
  }

  /* ── State badge ── */
  .state-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-sm);
  }

  .state-missing,
  .state-draft { background: var(--color-panel-soft); color: var(--color-muted); }
  .state-active { background: #eff6ff; color: #1d4ed8; }
  .state-needsFollowUp { background: #fffbeb; color: #b45309; }
  .state-completed { background: #f0fdf4; color: #15803d; }
  .state-deferred { background: var(--color-panel-soft); color: var(--color-muted); }
  .state-cancelled { background: #fef2f2; color: #dc2626; }
  .state-stale { background: #fff7ed; color: #c2410c; }

  /* ── Edit form ── */
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .field-label {
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .field-select {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    max-width: 16rem;
  }

  .field-input {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    max-width: 20rem;
  }

  .field-textarea {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    min-height: 4rem;
    resize: vertical;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .feedback-error {
    color: #dc2626;
    font-size: 0.75rem;
    margin: 0;
  }

  /* ── Meta & actions ── */
  .step-meta {
    margin-top: 0.75rem;
  }

  .step-timestamp {
    font-size: 0.6875rem;
    color: var(--color-muted);
  }

  .step-actions {
    margin-top: 0.75rem;
  }

  /* ── Buttons ── */
  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-primary, #2563eb);
    color: #fff;
    border-color: var(--color-primary, #2563eb);
  }

  .btn-secondary {
    background: var(--color-panel-soft);
    color: var(--color-text);
    border-color: var(--color-line);
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
</style>
