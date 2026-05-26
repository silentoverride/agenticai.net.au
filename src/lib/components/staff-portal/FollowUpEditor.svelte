<script lang="ts">
  /**
   * FollowUpEditor — Create and update follow-up commitments on the Client Profile.
   *
   * Provides:
   *   - Owner, due date, source, consequence, client-visible flag, notes fields
   *   - Save / Cancel for new follow-ups
   *   - Complete, Defer (with reason), Reassign (with owner) controls
   *   - Draft state visually distinct from persisted state
   *   - Keyboard accessible with visible focus and deterministic tab order
   */

  import type {
    StaffFollowUpDto,
    FollowUpStatus,
    FollowUpSource
  } from '$lib/staff-portal/dto';

  // ── Props ──

  let {
    followUp,
    onSave,
    onCancel,
    onUpdateStatus,
    assessmentId
  }: {
    /** Existing follow-up to edit, or null for a new one */
    followUp: StaffFollowUpDto | null;
    /** Called with form data when saving a new or edited follow-up */
    onSave: (data: {
      title: string;
      description: string | null;
      ownerId: string | null;
      dueDate: string | null;
      source: FollowUpSource;
      clientVisiblePromise: boolean;
      consequenceOfInaction: string | null;
      notes: string | null;
    }) => void;
    /** Called when cancelling the editor */
    onCancel: () => void;
    /** Called when completing/deferring/reassigning an existing follow-up */
    onUpdateStatus: (input: {
      action: 'completeFollowUp' | 'deferFollowUp' | 'reassignFollowUp';
      reason?: string;
      newOwnerId?: string;
    }) => void;
    assessmentId: string | null;
  } = $props();

  // ── Local state ──

  function fromFollowUp<T>(getter: (f: StaffFollowUpDto | null) => T): T {
    return getter(followUp);
  }

  let title = $state(fromFollowUp(f => f?.title ?? ''));
  let description = $state(fromFollowUp(f => f?.description ?? ''));
  let ownerId = $state(fromFollowUp(f => f?.ownerId ?? ''));
  let dueDate = $state(fromFollowUp(f => f?.dueDate ?? ''));
  let source = $state<FollowUpSource>(fromFollowUp(f => f?.source ?? 'client_profile'));
  let clientVisiblePromise = $state(fromFollowUp(f => f?.clientVisiblePromise ?? false));
  let consequenceOfInaction = $state(fromFollowUp(f => f?.consequenceOfInaction ?? ''));
  let notes = $state(fromFollowUp(f => f?.notes ?? ''));

  // Defer/Reassign transient state
  let showDeferDialog = $state(false);
  let showReassignDialog = $state(false);
  let deferReason = $state('');
  let reassignOwner = $state('');

  // Validation
  let validationError = $state('');

  // Track whether the form has been modified (for unsaved-changes guard)
  let dirty = $derived(hasUnsavedChanges());
  export { dirty as formDirty };

  // ── Helpers ──

  function isNew(): boolean {
    return followUp === null;
  }

  function statusBadgeClass(status: FollowUpStatus): string {
    const map: Record<FollowUpStatus, string> = {
      open: 'badge-attention',
      completed: 'badge-success',
      deferred: 'badge-warning',
      reassigned: 'badge-audit'
    };
    return map[status] ?? 'badge-default';
  }

  function sourceLabel(s: FollowUpSource): string {
    const map: Record<FollowUpSource, string> = {
      client_profile: 'Client Profile',
      human_review: 'Human Review',
      meeting_brief: 'Meeting Brief',
      commercial_next_step: 'Commercial Next Step',
      support_issue: 'Support Issue',
      admin_task: 'Admin Task',
      delayed_journey: 'Delayed Journey'
    };
    return map[s] ?? s;
  }

  function statusLabel(s: FollowUpStatus): string {
    const map: Record<FollowUpStatus, string> = {
      open: 'Open', completed: 'Completed',
      deferred: 'Deferred', reassigned: 'Reassigned'
    };
    return map[s] ?? s;
  }

  function formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }

  function hasUnsavedChanges(): boolean {
    if (isNew()) {
      return title !== '' || description !== '' || ownerId !== '' || dueDate !== '' ||
        consequenceOfInaction !== '' || notes !== '';
    }
    return title !== (followUp?.title ?? '') ||
      description !== (followUp?.description ?? '') ||
      ownerId !== (followUp?.ownerId ?? '') ||
      dueDate !== (followUp?.dueDate ?? '') ||
      source !== (followUp?.source ?? 'client_profile') ||
      clientVisiblePromise !== (followUp?.clientVisiblePromise ?? false) ||
      consequenceOfInaction !== (followUp?.consequenceOfInaction ?? '') ||
      notes !== (followUp?.notes ?? '');
  }

  function handleSave() {
    if (!title.trim()) {
      validationError = 'Title is required.';
      return;
    }
    validationError = '';
    onSave({
      title: title.trim(),
      description: description || null,
      ownerId: ownerId || null,
      dueDate: dueDate || null,
      source,
      clientVisiblePromise,
      consequenceOfInaction: consequenceOfInaction || null,
      notes: notes || null
    });
    // Reset form
    if (isNew()) {
      title = '';
      description = '';
      ownerId = '';
      dueDate = '';
      source = 'client_profile';
      clientVisiblePromise = false;
      consequenceOfInaction = '';
      notes = '';
    }
  }

  function handleComplete() {
    onUpdateStatus({ action: 'completeFollowUp' });
  }

  function handleDeferConfirm() {
    if (!deferReason.trim()) {
      validationError = 'A reason is required to defer.';
      return;
    }
    validationError = '';
    onUpdateStatus({ action: 'deferFollowUp', reason: deferReason.trim() });
    showDeferDialog = false;
    deferReason = '';
  }

  function handleReassignConfirm() {
    if (!reassignOwner.trim()) {
      validationError = 'A new owner is required for reassignment.';
      return;
    }
    validationError = '';
    onUpdateStatus({ action: 'reassignFollowUp', newOwnerId: reassignOwner.trim() });
    showReassignDialog = false;
    reassignOwner = '';
  }
</script>

<div class="follow-up-editor" class:draft={!followUp} data-testid="follow-up-editor">
  {#if followUp}
    <!-- Existing follow-up: read-only with action controls -->
    <div class="follow-up-card" data-testid="follow-up-card-{followUp.id}">
      <div class="card-header">
        <h3 class="card-title">{followUp.title}</h3>
        <span class="status-badge {statusBadgeClass(followUp.status)}" data-testid="follow-up-status">
          {statusLabel(followUp.status)}
        </span>
      </div>

      <div class="card-body">
        {#if followUp.description}
          <p class="card-description">{followUp.description}</p>
        {/if}

        <dl class="card-details">
          {#if followUp.ownerId}
            <div class="detail-row">
              <dt>Owner</dt>
              <dd>{followUp.ownerId}</dd>
            </div>
          {/if}
          {#if followUp.dueDate}
            <div class="detail-row">
              <dt>Due</dt>
              <dd>{formatDate(followUp.dueDate)}</dd>
            </div>
          {/if}
          <div class="detail-row">
            <dt>Source</dt>
            <dd>{sourceLabel(followUp.source)}</dd>
          </div>
          {#if followUp.clientVisiblePromise}
            <div class="detail-row">
              <dt>Client-visible</dt>
              <dd>Yes</dd>
            </div>
          {/if}
          {#if followUp.consequenceOfInaction}
            <div class="detail-row">
              <dt>Consequence</dt>
              <dd>{followUp.consequenceOfInaction}</dd>
            </div>
          {/if}
        </dl>

        {#if followUp.notes}
          <div class="card-notes">
            <strong>Notes:</strong>
            <p>{followUp.notes}</p>
          </div>
        {/if}
      </div>

      {#if followUp.status === 'open' || followUp.status === 'deferred' || followUp.status === 'reassigned'}
        <div class="card-actions" role="group" aria-label="Follow-up actions">
          <button
            type="button"
            class="btn btn-primary"
            onclick={handleComplete}
            data-testid="btn-complete-{followUp.id}"
            tabindex="0"
          >Complete</button>

          <button
            type="button"
            class="btn btn-secondary"
            onclick={() => showDeferDialog = true}
            data-testid="btn-defer-{followUp.id}"
            tabindex="0"
          >Defer</button>

          <button
            type="button"
            class="btn btn-secondary"
            onclick={() => showReassignDialog = true}
            data-testid="btn-reassign-{followUp.id}"
            tabindex="0"
          >Reassign</button>
        </div>
      {/if}

      <!-- Defer dialog -->
      {#if showDeferDialog}
        <div class="dialog-overlay" role="dialog" aria-label="Defer follow-up" data-testid="defer-dialog">
          <div class="dialog">
            <h4>Defer Follow-up</h4>
            <label for="defer-reason">Reason for deferral</label>
            <textarea
              id="defer-reason"
              bind:value={deferReason}
              aria-describedby="defer-error"
              data-testid="defer-reason-input"
              tabindex="0"
            ></textarea>
            {#if validationError && validationError.includes('defer')}
              <p id="defer-error" class="field-error" role="alert">{validationError}</p>
            {/if}
            <div class="dialog-actions">
              <button type="button" class="btn btn-primary" onclick={handleDeferConfirm} data-testid="defer-confirm" tabindex="0">Confirm</button>
              <button type="button" class="btn btn-ghost" onclick={() => { showDeferDialog = false; validationError = ''; }} data-testid="defer-cancel" tabindex="0">Cancel</button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Reassign dialog -->
      {#if showReassignDialog}
        <div class="dialog-overlay" role="dialog" aria-label="Reassign follow-up" data-testid="reassign-dialog">
          <div class="dialog">
            <h4>Reassign Follow-up</h4>
            <label for="reassign-owner">New owner</label>
            <input
              id="reassign-owner"
              type="text"
              bind:value={reassignOwner}
              aria-describedby="reassign-error"
              data-testid="reassign-owner-input"
              tabindex="0"
            />
            {#if validationError && validationError.includes('owner')}
              <p id="reassign-error" class="field-error" role="alert">{validationError}</p>
            {/if}
            <div class="dialog-actions">
              <button type="button" class="btn btn-primary" onclick={handleReassignConfirm} data-testid="reassign-confirm" tabindex="0">Confirm</button>
              <button type="button" class="btn btn-ghost" onclick={() => { showReassignDialog = false; validationError = ''; }} data-testid="reassign-cancel" tabindex="0">Cancel</button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- New follow-up form -->
    <div class="follow-up-form" data-testid="follow-up-form">
      <h3 class="form-title">New Follow-up</h3>

      <div class="form-grid">
        <div class="field">
          <label for="fu-title">Title <span class="required">*</span></label>
          <input id="fu-title" type="text" bind:value={title} data-testid="fu-title-input" tabindex="0" />
        </div>

        <div class="field">
          <label for="fu-owner">Owner</label>
          <input id="fu-owner" type="text" bind:value={ownerId} data-testid="fu-owner-input" tabindex="0" />
        </div>

        <div class="field">
          <label for="fu-due">Due date</label>
          <input id="fu-due" type="date" bind:value={dueDate} data-testid="fu-due-input" tabindex="0" />
        </div>

        <div class="field">
          <label for="fu-source">Source</label>
          <select id="fu-source" bind:value={source} data-testid="fu-source-select" tabindex="0">
            <option value="client_profile">Client Profile</option>
            <option value="human_review">Human Review</option>
            <option value="meeting_brief">Meeting Brief</option>
            <option value="commercial_next_step">Commercial Next Step</option>
            <option value="support_issue">Support Issue</option>
            <option value="admin_task">Admin Task</option>
            <option value="delayed_journey">Delayed Journey</option>
          </select>
        </div>

        <div class="field field-full">
          <label for="fu-description">Description</label>
          <textarea id="fu-description" bind:value={description} rows="2" data-testid="fu-description-input" tabindex="0"></textarea>
        </div>

        <div class="field field-full">
          <label for="fu-consequence">Consequence of inaction</label>
          <textarea id="fu-consequence" bind:value={consequenceOfInaction} rows="2" data-testid="fu-consequence-input" tabindex="0"></textarea>
        </div>

        <div class="field field-full">
          <label for="fu-notes">Notes</label>
          <textarea id="fu-notes" bind:value={notes} rows="2" data-testid="fu-notes-input" tabindex="0"></textarea>
        </div>

        <div class="field field-checkbox">
          <input id="fu-visible" type="checkbox" bind:checked={clientVisiblePromise} data-testid="fu-visible-checkbox" tabindex="0" />
          <label for="fu-visible">Client-visible promise</label>
        </div>
      </div>

      {#if validationError}
        <p class="form-error" role="alert" data-testid="fu-validation-error">{validationError}</p>
      {/if}

      <div class="form-actions">
        <button type="button" class="btn btn-primary" onclick={handleSave} data-testid="fu-save-btn" tabindex="0">
          {followUp ? 'Save' : 'Create'}
        </button>
        <button type="button" class="btn btn-ghost" onclick={onCancel} data-testid="fu-cancel-btn" tabindex="0">Cancel</button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* ── Layout ── */
  .follow-up-editor {
    margin-block: 1rem;
  }

  .follow-up-editor.draft {
    border: 1px dashed var(--color-border-interactive, #94a3b8);
    border-radius: 0.5rem;
    padding: 1rem;
    background: var(--color-surface-raised, #f8fafc);
  }

  /* ── Card (existing follow-up) ── */
  .follow-up-card {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .card-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-text, #1e293b);
  }

  .status-badge {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    font-weight: 500;
  }

  .badge-attention { background: #fef3c7; color: #92400e; }
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-warning { background: #fce4ec; color: #b71c1c; }
  .badge-audit { background: #e0e7ff; color: #3730a3; }
  .badge-default { background: #f1f5f9; color: #475569; }

  .card-body { margin-bottom: 0.75rem; }

  .card-description {
    color: var(--color-text-secondary, #64748b);
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .card-details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 0.75rem;
    font-size: 0.8125rem;
  }

  .detail-row dt { color: var(--color-text-secondary, #64748b); font-weight: 500; }
  .detail-row dd { color: var(--color-text, #1e293b); }

  .card-notes {
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    color: var(--color-text-secondary, #64748b);
  }

  .card-notes p { margin: 0.25rem 0 0; white-space: pre-wrap; }

  .card-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  /* ── Form (new follow-up) ── */
  .follow-up-form {
    padding: 1rem 0;
  }

  .form-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 1rem;
    color: var(--color-text, #1e293b);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .field-full { grid-column: 1 / -1; }

  .field-checkbox {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    grid-column: 1 / -1;
  }

  .field label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text-secondary, #475569);
  }

  .field .required { color: #dc2626; }

  .field input[type="text"],
  .field input[type="date"],
  .field select,
  .field textarea {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    color: var(--color-text, #1e293b);
    background: var(--color-surface, #fff);
    outline: none;
    transition: border-color 0.15s;
  }

  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: var(--color-focus, #3b82f6);
    box-shadow: 0 0 0 2px var(--color-focus-ring, rgba(59,130,246,0.25));
  }

  .field textarea { resize: vertical; min-height: 3rem; }

  .form-error,
  .field-error {
    color: #dc2626;
    font-size: 0.8125rem;
    margin-top: 0.25rem;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .dialog-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  /* ── Buttons ── */
  .btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-focus, #3b82f6);
    outline-offset: 2px;
  }

  .btn-primary {
    background: var(--color-primary, #1d4ed8);
    color: #fff;
  }

  .btn-primary:hover { opacity: 0.9; }

  .btn-secondary {
    background: var(--color-surface-raised, #f1f5f9);
    border: 1px solid var(--color-border, #e2e8f0);
    color: var(--color-text, #1e293b);
  }

  .btn-secondary:hover { background: #e2e8f0; }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary, #64748b);
  }

  .btn-ghost:hover { background: #f1f5f9; }

  /* ── Dialog ── */
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .dialog {
    background: var(--color-surface, #fff);
    border-radius: 0.5rem;
    padding: 1.5rem;
    max-width: 400px;
    width: 90%;
  }

  .dialog h4 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .dialog label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: var(--color-text-secondary, #475569);
  }

  .dialog textarea,
  .dialog input[type="text"] {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    box-sizing: border-box;
  }
</style>
