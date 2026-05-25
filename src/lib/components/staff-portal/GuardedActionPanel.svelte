<script lang="ts">
  /**
   * GuardedActionPanel — Renders report-level guarded decision actions.
   *
   * For approveReport: shows a guarded button. If blocked (unresolvedBlockingFinding),
   * displays the blocked reason and a link/note to the findings section. If enabled,
   * requires the approval checklist before submit.
   *
   * For rejectReport, requestRegeneration, requestClarification: inline form with
   * reasonCode (select) and reason (free text).
   *
   * Handles API errors: validationFailed, staleState, duplicateAction, permissionDenied,
   * auditWriteFailed.
   */

  import { Button, Badge } from '$lib/components/ui';
  import {
    BLOCKED_REASON_PRESENTATION,
    REPORT_STATE_PRESENTATION
  } from '$lib/staff-portal/dto';
  import type {
    StaffActionDescriptor,
    StaffPortalActionId,
    StaffActionMutationResultDto,
    StaffActionReceiptDto
  } from '$lib/staff-portal/dto';
  import DecisionReceipt from './DecisionReceipt.svelte';

  let {
    actions,
    assessmentId,
    reportState,
    onStateChange
  }: {
    actions: StaffActionDescriptor[];
    assessmentId: string;
    reportState: string;
    onStateChange?: (newState: string) => void;
  } = $props();

  // ── State ──────────────────────────────────────────────
  let submitting = $state<string | null>(null);
  let actionError = $state<string | null>(null);
  let actionSuccess = $state<string | null>(null);

  // Inline form state (reject, regeneration, clarification)
  let showActionForm = $state<StaffPortalActionId | null>(null);
  let formReasonCode = $state('');
  let formReason = $state('');
  let formError = $state<string | null>(null);

  // Receipt state
  let lastReceipt = $state<StaffActionReceiptDto | null>(null);

  // Approval checklist state
  let showApprovalForm = $state(false);
  let reviewNote = $state('');
  let reasonCode = $state('');
  let deliveryImpactConfirmed = $state(false);
  let checklistError = $state<string | null>(null);

  // ── Derived ────────────────────────────────────────────
  let approveAction = $derived(actions.find((a) => a.id === 'approveReport'));
  let otherActions = $derived(actions.filter((a) => a.id !== 'approveReport'));

  const REPORT_ACTION_FORM_IDS = new Set<StaffPortalActionId>([
    'rejectReport', 'requestRegeneration', 'requestClarification'
  ]);

  // ── Actions ────────────────────────────────────────────

  function startApproval() {
    showApprovalForm = true;
    reviewNote = '';
    reasonCode = '';
    deliveryImpactConfirmed = false;
    checklistError = null;
  }

  function cancelApproval() {
    showApprovalForm = false;
    reviewNote = '';
    reasonCode = '';
    deliveryImpactConfirmed = false;
    checklistError = null;
  }

  async function submitApproval() {
    if (!approveAction) return;

    // Validate checklist
    if (!reviewNote.trim()) {
      checklistError = 'A review note is required.';
      return;
    }
    if (!reasonCode) {
      checklistError = 'A Reason Code must be selected.';
      return;
    }
    if (!deliveryImpactConfirmed) {
      checklistError = 'Delivery impact review must be confirmed.';
      return;
    }

    submitting = 'approveReport';
    actionError = null;
    actionSuccess = null;
    checklistError = null;

    const body: Record<string, unknown> = {
      action: 'approveReport',
      targetType: 'report',
      targetId: null,
      idempotencyKey: crypto.randomUUID(),
      expectedState: reportState,
      reasonCode,
      note: reviewNote,
      checklistVersion: '1.0',
      evidenceId: crypto.randomUUID(),
      artifactVersion: 'latest'
    };

    await executeSubmit(body, approveAction);
  }

  function startForm(action: StaffActionDescriptor) {
    showActionForm = action.id;
    showApprovalForm = false;
    formReasonCode = '';
    formReason = '';
    formError = null;
  }

  function cancelForm() {
    showActionForm = null;
    formReasonCode = '';
    formReason = '';
    formError = null;
  }

  async function submitForm(action: StaffActionDescriptor) {
    if ((action.requiresReasonCode && !formReasonCode) || (action.requiresNote && !formReason)) {
      formError = 'A reason code and explanation are required.';
      return;
    }

    submitting = action.id;
    actionError = null;
    actionSuccess = null;
    formError = null;

    const body: Record<string, unknown> = {
      action: action.id,
      targetType: 'report',
      targetId: null,
      idempotencyKey: crypto.randomUUID(),
      expectedState: reportState,
      reasonCode: formReasonCode || undefined,
      reason: formReason || undefined
    };

    await executeSubmit(body, action);
  }

  async function executeSubmit(body: Record<string, unknown>, action: StaffActionDescriptor) {
    try {
      const res = await fetch(`/api/operator/assessments/${assessmentId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      let result: StaffActionMutationResultDto;
      try {
        result = await res.json();
      } catch {
        actionError = 'An unexpected error occurred. Please try again.';
        submitting = null;
        return;
      }

      if (result.success) {
        showApprovalForm = false;
        showActionForm = null;
        actionSuccess = `${action.label} completed.`;
        lastReceipt = result.receipt;
        onStateChange?.(result.state);
      } else {
        const err = result.error;
        handleApiError(err.code, err.message, err.currentState);
      }
    } catch (e) {
      if (e instanceof TypeError && e.message === 'Failed to fetch') {
        actionError = 'Network error: could not reach the server. Please check your connection.';
      } else {
        actionError = 'An unexpected error occurred. Please try again.';
      }
    } finally {
      submitting = null;
    }
  }

  function handleApiError(code: string, message: string, currentState?: string) {
    switch (code) {
      case 'validationFailed':
        checklistError = message || 'Validation failed. Please check your inputs.';
        formError = message || 'Validation failed. Please check your inputs.';
        break;
      case 'staleState':
        actionError = `State changed. Current: ${currentState ?? 'unknown'}. Refresh to retry.`;
        break;
      case 'duplicateAction':
        actionError = 'This action was already completed.';
        break;
      case 'permissionDenied':
        actionError = 'You do not have permission for this action.';
        break;
      case 'auditWriteFailed':
        actionError = 'Audit record could not be saved. Please try again.';
        break;
      default:
        actionError = message || 'Action failed.';
    }
  }
</script>

<div class="guarded-actions-panel">
  <!-- ===== Approve Report (guarded) ===== -->
  {#if approveAction}
    <div class="approve-section">
      {#if approveAction.enabled}
        {#if showApprovalForm}
          <div class="approval-checklist" role="form" aria-label="Approval checklist">
            <h3 class="checklist-title">Report Approval Checklist</h3>

            <div class="form-field">
              <label for="approval-note" class="form-label">Review Note *</label>
              <textarea
                id="approval-note"
                class="form-textarea"
                bind:value={reviewNote}
                rows="2"
                aria-required="true"
                placeholder="Summarise your review findings..."
                data-testid="guarded-action-approval-note"
              ></textarea>
            </div>

            <div class="form-field">
              <label for="approval-reason-code" class="form-label">Reason Code *</label>
              <select
                id="approval-reason-code"
                class="form-select"
                bind:value={reasonCode}
                aria-required="true"
                data-testid="guarded-action-approval-reason-code"
              >
                <option value="">Select reason...</option>
                <option value="evidence_sufficient">Evidence sufficient</option>
                <option value="false_positive">False positive</option>
                <option value="already_addressed">Already addressed</option>
                <option value="customer_preference">Customer preference</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="form-field checkbox-field">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  bind:checked={deliveryImpactConfirmed}
                  aria-required="true"
                  data-testid="guarded-action-delivery-impact"
                />
                <span>I have reviewed the delivery impact and confirm this report is safe to approve.</span>
              </label>
            </div>

            {#if checklistError}
              <p class="form-error" role="alert" data-testid="guarded-action-checklist-error">{checklistError}</p>
            {/if}

            <div class="form-actions">
              <Button variant="primary" onclick={submitApproval} disabled={submitting !== null} data-testid="guarded-action-submit-approveReport">
                {submitting === 'approveReport' ? 'Submitting...' : 'Approve report'}
              </Button>
              <Button variant="ghost" onclick={cancelApproval} disabled={submitting !== null}>
                Cancel
              </Button>
            </div>
          </div>
        {:else}
          <div class="guarded-action-row">
            <Button
              variant="primary"
              onclick={startApproval}
              disabled={submitting !== null}
              data-testid="guarded-action-trigger-approveReport"
            >
              {submitting === 'approveReport' ? '...' : 'Approve report'}
            </Button>
            <span class="action-consequence">{approveAction.consequence}</span>
          </div>
        {/if}
      {:else}
        <div class="guarded-action-row blocked">
          <Button variant="outline" disabled data-testid="guarded-action-trigger-approveReport">
            Approve report
          </Button>
          {#if approveAction.blockedReason}
            <span class="blocked-reason" data-testid="guarded-action-blocked-approveReport">
              {BLOCKED_REASON_PRESENTATION[approveAction.blockedReason]?.label ?? approveAction.blockedReason}
            </span>
            {#if approveAction.blockedReason === 'unresolvedBlockingFinding'}
              <p class="blocked-hint">Resolve or override all blocking gate findings above before approving.</p>
            {/if}
          {/if}
          {#if approveAction.remediationHint}
            <p class="remediation-hint">{approveAction.remediationHint}</p>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <p class="no-action">No approval action available for the current state.</p>
  {/if}

  <!-- ===== Other report actions (reject, regeneration, clarification) ===== -->
  {#each otherActions as action (action.id)}
    <div class="action-section">
      {#if showActionForm === action.id && REPORT_ACTION_FORM_IDS.has(action.id)}
        <div class="action-form" role="form" aria-label="{action.label} form">
          {#if action.requiresReasonCode}
            <div class="form-field">
              <label for="reason-code-{action.id}" class="form-label">Reason Code</label>
              <select
                id="reason-code-{action.id}"
                class="form-select"
                bind:value={formReasonCode}
                aria-required="true"
                data-testid="guarded-action-reason-code"
              >
                <option value="">Select reason...</option>
                <option value="evidence_sufficient">Evidence sufficient</option>
                <option value="false_positive">False positive</option>
                <option value="already_addressed">Already addressed</option>
                <option value="out_of_scope">Out of scope</option>
                <option value="customer_preference">Customer preference</option>
                <option value="other">Other</option>
              </select>
            </div>
          {/if}
          {#if action.requiresNote}
            <div class="form-field">
              <label for="reason-note-{action.id}" class="form-label">Note</label>
              <textarea
                id="reason-note-{action.id}"
                class="form-textarea"
                bind:value={formReason}
                rows="2"
                aria-required="true"
                placeholder="Explain your decision..."
                data-testid="guarded-action-reason-note"
              ></textarea>
            </div>
          {/if}
          {#if formError}
            <p class="form-error" role="alert" data-testid="guarded-action-form-error">{formError}</p>
          {/if}
          <div class="form-actions">
            <Button variant="primary" onclick={() => submitForm(action)} disabled={submitting === action.id} data-testid="guarded-action-submit-{action.id}">
              {submitting === action.id ? 'Submitting...' : 'Confirm'}
            </Button>
            <Button variant="ghost" onclick={cancelForm} disabled={submitting !== null}>
              Cancel
            </Button>
          </div>
        </div>
      {:else}
        <div class="guarded-action-row" class:blocked={!action.enabled}>
          {#if action.enabled}
            <Button
              variant={action.id === 'rejectReport' ? 'danger' : 'outline'}
              onclick={() => startForm(action)}
              disabled={submitting !== null}
              data-testid="guarded-action-trigger-{action.id}"
            >
              {submitting === action.id ? '...' : action.label}
            </Button>
          {:else}
            <Button variant="outline" disabled data-testid="guarded-action-trigger-{action.id}">
              {action.label}
            </Button>
            {#if action.blockedReason}
              <span class="blocked-reason" data-testid="guarded-action-blocked-{action.id}">
                {BLOCKED_REASON_PRESENTATION[action.blockedReason]?.label ?? action.blockedReason}
              </span>
            {/if}
          {/if}
          {#if action.consequence}
            <span class="action-consequence">{action.consequence}</span>
          {/if}
        </div>
      {/if}
    </div>
  {/each}

  <!-- General action messages -->
  {#if actionError}
    <p class="general-error" role="alert" data-testid="guarded-action-error">{actionError}</p>
  {/if}
  {#if actionSuccess}
    <p class="general-success" role="status" data-testid="guarded-action-success">{actionSuccess}</p>
  {/if}

  {#if lastReceipt}
    <DecisionReceipt receipt={lastReceipt} dismissible onDismiss={() => (lastReceipt = null)} />
  {/if}
</div>

<style>
  .guarded-actions-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .approve-section,
  .action-section {
    display: flex;
    flex-direction: column;
  }

  .guarded-action-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .guarded-action-row.blocked {
    opacity: 0.8;
  }

  .action-consequence {
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  .blocked-reason {
    font-size: 0.75rem;
    color: var(--color-muted);
    font-style: italic;
  }

  .blocked-hint {
    font-size: 0.75rem;
    color: var(--color-danger, #dc2626);
    margin: 0.25rem 0;
    width: 100%;
  }

  .remediation-hint {
    font-size: 0.75rem;
    color: var(--color-muted);
    font-style: italic;
    margin: 0;
    width: 100%;
  }

  .no-action {
    font-size: 0.875rem;
    color: var(--color-muted);
    text-align: center;
    padding: 1rem;
  }

  /* ── Approval checklist ── */
  .approval-checklist {
    background: var(--color-panel-soft);
    border: 1px solid var(--color-line);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .checklist-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-ink);
    margin: 0;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .form-select,
  .form-textarea {
    background: var(--color-panel);
    border: 1.5px solid var(--color-line);
    border-radius: 6px;
    color: var(--color-ink);
    font: inherit;
    font-size: 0.875rem;
    padding: 0.4rem 0.6rem;
    transition: border-color 150ms ease;
    width: 100%;
  }

  .form-select:focus,
  .form-textarea:focus {
    border-color: var(--color-accent);
    outline: 3px solid rgba(37, 99, 235, 0.2);
    outline-offset: 0;
  }

  .checkbox-field {
    flex-direction: row;
    align-items: flex-start;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-ink);
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    margin-top: 0.15rem;
    accent-color: var(--color-accent);
  }

  .form-error {
    font-size: 0.8125rem;
    color: var(--color-danger, #dc2626);
    margin: 0;
    padding: 0.3rem 0.5rem;
    background: var(--color-danger-bg, #fef2f2);
    border-radius: 4px;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
  }

  /* ── Inline action form ── */
  .action-form {
    background: var(--color-panel-soft);
    border: 1px solid var(--color-line);
    border-radius: 6px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .general-error {
    font-size: 0.8125rem;
    color: var(--color-danger, #dc2626);
    margin: 0;
    padding: 0.35rem 0.5rem;
    background: var(--color-danger-bg, #fef2f2);
    border-radius: 4px;
  }

  .general-success {
    font-size: 0.8125rem;
    color: var(--color-success, #059669);
    margin: 0;
    padding: 0.35rem 0.5rem;
    background: var(--color-success-bg, #ecfdf5);
    border-radius: 4px;
  }
</style>
