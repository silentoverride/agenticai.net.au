<script lang="ts">
  /**
   * GateFindingCard — Displays a single GateFinding with full detail,
   * state badge, risk signal, expandable sections, and inline action controls.
   *
   * Each finding's `actions` array provides the action descriptors; the card
   * renders per-action buttons that call the API endpoint and handle
   * success/error/inline validation states.
   */

  import { Button, Badge, Card, CardContent } from '$lib/components/ui';
  import {
    GATE_FINDING_STATE_PRESENTATION,
    BLOCKED_REASON_PRESENTATION
  } from '$lib/staff-portal/dto';
  import type {
    StaffGateFindingDto,
    StaffActionDescriptor,
    StaffPortalActionId,
    StaffActionMutationResultDto,
    StaffActionReceiptDto,
    GateFindingState
  } from '$lib/staff-portal/dto';
  import DecisionReceipt from './DecisionReceipt.svelte';

  let {
    finding,
    assessmentId,
    onStateChange
  }: {
    finding: StaffGateFindingDto;
    assessmentId: string;
    onStateChange?: (findingId: string, newState: GateFindingState) => void;
  } = $props();

  let submitting = $state<string | null>(null);
  let actionError = $state<string | null>(null);
  let actionSuccess = $state<string | null>(null);

  // Override / escalate form state
  let showActionForm = $state<StaffPortalActionId | null>(null);
  let formReasonCode = $state('');
  let formReason = $state('');
  let formError = $state<string | null>(null);

  // Receipt state
  let lastReceipt = $state<StaffActionReceiptDto | null>(null);

  // Svelte 5 refs for focus management
  let formEl = $state<HTMLDivElement | null>(null);

  // Escape key handler
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (showActionForm) cancelForm();
      else if (expandedReasoning) expandedReasoning = false;
      else if (expandedDetails) expandedDetails = false;
    }
  }

  // Expandable sections
  let expandedReasoning = $state(false);
  let expandedDetails = $state(false);

  const UNRESOLVED_STATES = new Set<GateFindingState>(['open', 'escalatedFurther', 'conflict']);

  let isUnresolved = $derived(UNRESOLVED_STATES.has(finding.state));

  function verdictBadgeVariant(v: string): 'default' | 'warning' | 'danger' | 'secondary' | 'outline' | 'success' {
    if (v === 'human_assist' || v === 'escalate') return 'warning';
    if (v === 'block' || v === 'retry') return 'danger';
    if (v === 'approve') return 'success';
    return 'default';
  }

  function gateTypeLabel(type: string): string {
    return type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function riskBadgeTone(tone: string): 'default' | 'warning' | 'success' | 'danger' | 'secondary' | 'outline' {
    return RISK_TONE_MAP[tone] ?? 'default';
  }

  const RISK_TONE_MAP: Record<string, 'default' | 'warning' | 'success' | 'danger' | 'secondary' | 'outline'> = {
    danger: 'danger',
    warning: 'warning',
    success: 'success'
  };

  async function executeAction(action: StaffActionDescriptor) {
    // Simple actions (claimFinding) execute directly
    if (!action.requiresNote && !action.requiresReasonCode) {
      await submitAction(action);
      return;
    }

    // Actions needing reason/reasonCode show the inline form
    showActionForm = action.id;
    formReasonCode = '';
    formReason = '';
    formError = null;
  }

  async function submitAction(action: StaffActionDescriptor) {
    submitting = action.id;
    actionError = null;
    actionSuccess = null;

    // Front-end validation: require reasonCode and reason for any action that needs them
    if ((action.requiresReasonCode && !formReasonCode) || (action.requiresNote && !formReason)) {
      formError = 'A reason code and explanation are required.';
      submitting = null;
      return;
    }

    // Build request body
    const body: Record<string, unknown> = {
      action: action.id,
      targetType: 'gateFinding',
      targetId: finding.id,
      idempotencyKey: crypto.randomUUID(),
      expectedState: finding.state
    };

    if (formReasonCode) body.reasonCode = formReasonCode;
    if (formReason) body.reason = formReason;

    try {
      const res = await fetch(`/api/staff/assessments/${assessmentId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result: StaffActionMutationResultDto = await res.json();

      if (result.success) {
        showActionForm = null;
        actionSuccess = `${action.label} completed.`;
        lastReceipt = result.receipt;
        onStateChange?.(finding.id, result.state as GateFindingState);
      } else {
        const err = result.error;
        if (err.code === 'validationFailed') {
          formError = err.message || 'A reason code and explanation are required.';
          formError = err.message || 'Override requires a reason code and explanation.';
        } else if (err.code === 'staleState') {
          actionError = `State changed. Current: ${err.currentState}. Refresh to retry.`;
        } else if (err.code === 'duplicateAction') {
          actionError = 'This action was already completed.';
        } else if (err.code === 'permissionDenied') {
          actionError = 'You do not have permission for this action.';
        } else {
          actionError = err.message || 'Action failed.';
        }
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

  function cancelForm() {
    showActionForm = null;
    formReasonCode = '';
    formReason = '';
    formError = null;
  }
</script>

<div
  class="gate-finding-card"
  class:unresolved={isUnresolved}
  data-testid="gate-finding-{finding.id}"
  role="button"
  tabindex="0"
  onkeydown={onKeydown}
>
  <!-- ===== Header: type, verdict, state, risk ===== -->
  <div class="gf-header">
    <div class="gf-header-left">
      <span class="gf-type">{gateTypeLabel(finding.type)}</span>
      <span data-testid="gate-verdict-{finding.verdict}">
        <Badge variant={verdictBadgeVariant(finding.verdict)}>
          {finding.verdict}
        </Badge>
      </span>
      <Badge variant={riskBadgeTone(finding.riskSignal.tone)}>
        {finding.riskSignal.label}
      </Badge>
    </div>
    <div class="gf-header-right" data-testid="gate-state-{finding.state}">
      <Badge
        variant={finding.state === 'resolved' || finding.state === 'overriddenWithReason' ? 'success' : finding.state === 'open' || finding.state === 'escalatedFurther' ? 'warning' : finding.state === 'conflict' ? 'danger' : 'default'}
      >
        {GATE_FINDING_STATE_PRESENTATION[finding.state]?.label ?? finding.state}
      </Badge>
    </div>
  </div>

  <!-- ===== Meta row: confidence, severity, description ===== -->
  <div class="gf-meta-row">
    {#if finding.confidence !== null}
      <div class="gf-confidence" title="Confidence: {(finding.confidence * 100).toFixed(0)}%">
        <div class="confidence-bar">
          <div
            class="confidence-fill"
            style="width: {Math.min(100, Math.max(0, Math.round(finding.confidence * 100)))}%"
            role="progressbar"
            aria-valuenow={Math.min(100, Math.max(0, Math.round(finding.confidence * 100)))}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
        <span class="confidence-label">{(finding.confidence * 100).toFixed(0)}% confidence</span>
      </div>
    {/if}
    {#if finding.severity}
      <Badge variant={finding.severity === 'high' || finding.severity === 'critical' ? 'danger' : 'warning'}>
        {finding.severity}
      </Badge>
    {/if}
    {#if finding.riskSignal.description}
      <span class="gf-desc">{finding.riskSignal.description}</span>
    {/if}
  </div>

  <!-- ===== Reasoning (expandable) ===== -->
  {#if finding.reasoning}
    <div class="gf-section">
      <button class="gf-toggle-btn" onclick={() => (expandedReasoning = !expandedReasoning)} aria-expanded={expandedReasoning} aria-controls="reasoning-content-{finding.id}">
        <span class="gf-toggle-icon">{expandedReasoning ? '−' : '+'}</span>
        Reasoning
      </button>
      {#if expandedReasoning}
        <div class="gf-section-content" id="reasoning-content-{finding.id}">
          <p>{finding.reasoning}</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- ===== Details (expandable) ===== -->
  {#if finding.details}
    <div class="gf-section">
      <button class="gf-toggle-btn" onclick={() => (expandedDetails = !expandedDetails)} aria-expanded={expandedDetails} aria-controls="details-content-{finding.id}">
        <span class="gf-toggle-icon">{expandedDetails ? '−' : '+'}</span>
        Details
      </button>
      {#if expandedDetails}
        <div class="gf-section-content" id="details-content-{finding.id}">
          <p>{finding.details}</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- ===== Optional fields ===== -->
  {#if finding.flaggedReportSection}
    <div class="gf-inline-field">
      <span class="gf-field-label">Flagged Section</span>
      <span class="gf-field-value">{finding.flaggedReportSection}</span>
    </div>
  {/if}

  {#if finding.relatedIntakeEvidence}
    <div class="gf-inline-field">
      <span class="gf-field-label">Intake Evidence</span>
      <span class="gf-field-value">{finding.relatedIntakeEvidence}</span>
    </div>
  {/if}

  {#if finding.suggestedInspectionSteps}
    <div class="gf-inline-field">
      <span class="gf-field-label">Inspection Steps</span>
      <span class="gf-field-value">{finding.suggestedInspectionSteps}</span>
    </div>
  {/if}

  {#if finding.decisionNotes}
    <div class="gf-decision-notes">
      <span class="gf-field-label">Decision Notes</span>
      <p>{finding.decisionNotes}</p>
    </div>
  {/if}

  <!-- ===== Action controls ===== -->
  <div class="gf-actions">
    {#each finding.actions as action (action.id)}
      <div class="gf-action-row">
        {#if showActionForm === action.id}
          <!-- Inline form for actions needing reason + reasonCode -->
          <div class="gf-action-form" role="form" aria-label="{action.label} form">
            {#if action.requiresReasonCode}
              <div class="form-field">
                <label for="reason-code-{action.id}" class="form-label">Reason Code</label>
                <select
                  id="reason-code-{action.id}"
                  class="form-select"
                  bind:value={formReasonCode}
                  aria-required="true"
                  aria-describedby={formError ? 'form-error' : undefined}
                  data-testid="gate-action-reason-code"
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
                <label for="reason-note-{action.id}" class="form-label">
                  {action.id === 'overrideFinding' ? 'Override Reason' : 'Note'}
                </label>
                <textarea
                  id="reason-note-{action.id}"
                  class="form-textarea"
                  bind:value={formReason}
                  rows="2"
                  aria-required="true"
                  aria-describedby={formError ? 'form-error' : undefined}
                  placeholder={action.id === 'overrideFinding' ? 'Provide a detailed reason for the override...' : 'Add a note...'}
                  data-testid="gate-action-reason-note"
                ></textarea>
              </div>
            {/if}
            {#if formError}
              <p id="form-error" class="form-error" role="alert" data-testid="gate-action-form-error">{formError}</p>
            {/if}
            <div class="form-actions">
              <Button size="sm" variant="primary" onclick={() => submitAction(action)} disabled={submitting === action.id} data-testid="gate-action-submit-{action.id}">
                {submitting === action.id ? 'Submitting...' : 'Confirm'}
              </Button>
              <Button size="sm" variant="ghost" onclick={cancelForm} disabled={submitting !== null}>
                Cancel
              </Button>
            </div>
          </div>
        {:else}
          <div class="gf-action-btn-wrapper">
            {#if action.enabled}
              <Button
                size="sm"
                variant={action.id === 'claimFinding' ? 'outline' : action.id === 'overrideFinding' ? 'danger' : 'primary'}
                onclick={() => executeAction(action)}
                disabled={submitting !== null}
                data-testid="gate-action-trigger-{action.id}"
              >
                {submitting === action.id ? '...' : action.label}
              </Button>
            {:else}
              <Button
                size="sm"
                variant="outline"
                disabled
                data-testid="gate-action-trigger-{action.id}"
              >
                {action.label}
              </Button>
              {#if action.blockedReason}
                <span class="blocked-reason-label" data-testid="gate-action-blocked-{action.id}">
                  {BLOCKED_REASON_PRESENTATION[action.blockedReason]?.label ?? action.blockedReason}
                </span>
              {/if}
              {#if action.staleReason}
                <span class="stale-label">Stale: {action.staleReason}</span>
              {/if}
            {/if}
            {#if action.consequence}
              <span class="action-consequence">{action.consequence}</span>
            {/if}
          </div>
        {/if}
      </div>
    {/each}

    <!-- General action error -->
    {#if actionError}
      <p class="action-error" role="alert" data-testid="gate-action-error">{actionError}</p>
    {/if}
    {#if actionSuccess}
      <p class="action-success" role="status" data-testid="gate-action-success">{actionSuccess}</p>
    {/if}

    {#if lastReceipt}
      <DecisionReceipt receipt={lastReceipt} dismissible onDismiss={() => (lastReceipt = null)} />
    {/if}
  </div>
</div>

<style>
  .gate-finding-card {
    background: var(--color-panel);
    border: 1.5px solid var(--color-line);
    border-radius: var(--radius, 8px);
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    transition: border-color 150ms ease;
  }

  .gate-finding-card:hover {
    border-color: var(--color-accent-mid);
  }

  .gate-finding-card.unresolved {
    border-left: 4px solid var(--color-danger, #dc2626);
  }

  .gf-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .gf-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .gf-header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .gf-type {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--color-ink);
  }

  .gf-meta-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.8125rem;
    color: var(--color-muted);
  }

  .gf-confidence {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .confidence-bar {
    background: var(--color-panel-soft);
    border: 1px solid var(--color-line);
    border-radius: 4px;
    height: 6px;
    width: 60px;
    overflow: hidden;
  }

  .confidence-fill {
    background: var(--color-accent);
    border-radius: 4px;
    height: 100%;
    transition: width 300ms ease;
  }

  .confidence-label {
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  .gf-desc {
    font-size: 0.8125rem;
    color: var(--color-muted);
    font-style: italic;
  }

  .gf-section {
    border-top: 1px solid var(--color-line);
    padding-top: 0.5rem;
  }

  .gf-toggle-btn {
    background: none;
    border: none;
    color: var(--color-accent);
    cursor: pointer;
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 700;
    padding: 0.25rem 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .gf-toggle-btn:hover {
    text-decoration: underline;
  }

  .gf-toggle-icon {
    display: inline-block;
    width: 1rem;
    text-align: center;
    font-weight: 700;
    font-size: 0.875rem;
  }

  .gf-section-content {
    padding: 0.5rem 0 0 1.25rem;
    font-size: 0.875rem;
    color: var(--color-ink);
    line-height: 1.5;
  }

  .gf-section-content p {
    margin: 0;
    white-space: pre-wrap;
  }

  .gf-inline-field {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    border-top: 1px solid var(--color-line);
    padding-top: 0.5rem;
  }

  .gf-field-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .gf-field-value {
    font-size: 0.875rem;
    color: var(--color-ink);
  }

  .gf-decision-notes {
    border-top: 1px solid var(--color-line);
    padding-top: 0.5rem;
  }

  .gf-decision-notes p {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    color: var(--color-ink);
    background: var(--color-panel-soft);
    border-radius: 4px;
    padding: 0.5rem;
  }

  .gf-actions {
    border-top: 1px solid var(--color-line);
    padding-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .gf-action-row {
    display: flex;
    flex-direction: column;
  }

  .gf-action-btn-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .blocked-reason-label {
    font-size: 0.75rem;
    color: var(--color-muted);
    font-style: italic;
  }

  .stale-label {
    font-size: 0.75rem;
    color: var(--color-warning, #d97706);
    font-style: italic;
  }

  .action-consequence {
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  .action-error {
    font-size: 0.8125rem;
    color: var(--color-danger, #dc2626);
    margin: 0;
    padding: 0.35rem 0.5rem;
    background: var(--color-danger-bg, #fef2f2);
    border-radius: 4px;
  }

  .action-success {
    font-size: 0.8125rem;
    color: var(--color-success, #059669);
    margin: 0;
    padding: 0.35rem 0.5rem;
    background: var(--color-success-bg, #ecfdf5);
    border-radius: 4px;
  }

  /* ── Inline action form ────────────────────────────── */
  .gf-action-form {
    background: var(--color-panel-soft);
    border: 1px solid var(--color-line);
    border-radius: 6px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
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

  .form-textarea {
    resize: vertical;
    min-height: 2.5rem;
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

  /* ── Accessibility: focus indicators ───────────────── */
  :global(.gate-finding-card) button:focus-visible,
  .gf-toggle-btn:focus-visible,
  .form-select:focus-visible,
  .form-textarea:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* ── Accessibility: reduced motion ────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .gate-finding-card {
      transition: none;
    }
    .confidence-fill {
      transition: none;
    }
  }
</style>
