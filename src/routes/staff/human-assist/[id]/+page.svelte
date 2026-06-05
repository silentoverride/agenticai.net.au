<script lang="ts">
  import { fade } from 'svelte/transition';
  import { Button, Badge, Card, CardContent, CardHeader, CardTitle, Input, Label } from '$lib/components/ui';

  interface ReviewDetails {
    id: string;
    assessmentId: string;
    gateType: string;
    status: string;
    gateVerdict: string;
    gateConfidence: number;
    gateReasoning?: string;
    pipelineStatus: string;
    transcript?: string;
    analysis?: string;
    operatorNotes?: string;
    editedContent?: string;
    createdAt: string;
    reviewedAt?: string;
  }

  let review: ReviewDetails | null = $state(null);
  let loading = $state(true);
  let error = $state('');
  let submitting = $state(false);
  let action = $state<'approve' | 'reject' | 'edit'>('approve');
  let notes = $state('');
  let editedContent = $state('');
  let successMsg = $state('');
  let showConfirm = $state(false);

  const GATE_LABELS: Record<string, string> = {
    'quick-wins-verification': 'Quick Wins Verification',
    'major-project-verification': 'Major Project Verification',
    'report-review': 'Report Review'
  };

  async function loadReview() {
    try {
      const id = window.location.pathname.split('/').pop();
      if (!id) { error = 'No review ID'; return; }

      const res = await fetch(`/api/staff/human-assist/${id}`);
      const data = (await res.json()) as { success?: boolean; review?: ReviewDetails; error?: string };
      if (data.success && data.review) {
        review = data.review;
        editedContent = data.review.editedContent || data.review.transcript || '';
      } else {
        error = data.error || 'Failed to load review';
      }
    } catch (e) {
      error = 'Failed to load review';
    } finally {
      loading = false;
    }
  }

  async function submitReview() {
    if (!review) return;
    if (action === 'edit' && !editedContent.trim()) {
      error = 'Edited content is required for edit action';
      return;
    }

    submitting = true;
    error = '';
    successMsg = '';

    try {
      const res = await fetch(`/api/staff/human-assist/${review.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: notes || undefined,
          editedContent: action === 'edit' ? editedContent : undefined,
          staffId: 'staff'
        })
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        successMsg = action === 'approve' ? 'Assessment approved — delivery will proceed.'
          : action === 'reject' ? 'Assessment rejected — customer will be notified.'
          : 'Edits saved — assessment updated.';
        showConfirm = false;
        // Reload to show updated state
        await loadReview();
      } else {
        error = data.error || 'Review action failed';
      }
    } catch (e) {
      error = 'Failed to submit review';
    } finally {
      submitting = false;
    }
  }

  function formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString('en-AU', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }

  function statusBadgeVariant(s: string): 'default' | 'warning' | 'success' | 'danger' | 'secondary' {
    if (s === 'pending') return 'warning';
    if (s === 'in_review') return 'default';
    if (s === 'approved') return 'success';
    if (s === 'rejected') return 'danger';
    if (s === 'edited') return 'secondary';
    return 'default';
  }

  $effect(() => { loadReview(); });
</script>

<svelte:head>
  <title>Review Assessment — Human Assist</title>
</svelte:head>

<div class="review-page">
  <header class="page-header">
    <div class="breadcrumb">
      <a href="/staff/human-assist">← Human Assist Queue</a>
    </div>
    <div class="header-info">
      <div>
        <h1>Review Assessment</h1>
        {#if review}
          <p class="mono">Assessment: {review.assessmentId}</p>
        {/if}
      </div>
      {#if review}
        <div class="header-badges">
          <Badge variant={statusBadgeVariant(review.status)}>{review.status}</Badge>
          <Badge variant={review.gateVerdict === 'human_assist' ? 'warning' : 'danger'}>{review.gateVerdict}</Badge>
        </div>
      {/if}
    </div>
  </header>

  {#if error}
    <div class="error-banner" in:fade>{error}</div>
  {/if}

  {#if successMsg}
    <div class="success-banner" in:fade>{successMsg}</div>
  {/if}

  {#if loading}
    <div class="loading">Loading review details...</div>
  {:else if review}
    <!-- Gate Evaluation -->
    <Card>
      <CardHeader>
        <CardTitle>Gate Evaluation</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="gate-info">
          <div class="gi-row">
            <span class="gi-label">Gate Type</span>
            <span class="gi-value">{GATE_LABELS[review.gateType] || review.gateType}</span>
          </div>
          <div class="gi-row">
            <span class="gi-label">Verdict</span>
            <span class="gi-value"><Badge variant={review.gateVerdict === 'human_assist' ? 'warning' : 'danger'}>{review.gateVerdict}</Badge></span>
          </div>
          <div class="gi-row">
            <span class="gi-label">Confidence</span>
            <span class="gi-value">{(review.gateConfidence * 100).toFixed(0)}%</span>
          </div>
          <div class="gi-row">
            <span class="gi-label">Created</span>
            <span class="gi-value">{formatTime(review.createdAt)}</span>
          </div>
          {#if review.reviewedAt}
            <div class="gi-row">
              <span class="gi-label">Reviewed</span>
              <span class="gi-value">{formatTime(review.reviewedAt)}</span>
            </div>
          {/if}
        </div>

        {#if review.gateReasoning}
          <div class="reasoning-block">
            <h3>Gate Reasoning</h3>
            <p>{review.gateReasoning}</p>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Assessment Transcript -->
    {#if review.transcript}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <pre class="transcript-block">{review.transcript}</pre>
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="no-data">No transcript data available for this assessment.</p>
        </CardContent>
      </Card>
    {/if}

    <!-- Pipeline Status -->
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Status</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant={review.pipelineStatus === 'failed' ? 'danger' : review.pipelineStatus === 'human_assist' ? 'warning' : 'default'}>
          {review.pipelineStatus}
        </Badge>
      </CardContent>
    </Card>

    <!-- Review Actions (only if not already resolved) -->
    {#if review.status === 'pending' || review.status === 'in_review'}
      <Card>
        <CardHeader>
          <CardTitle>Operator Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="action-selector">
            <div class="action-option">
              <input type="radio" id="act-approve" bind:group={action} value="approve" />
              <label for="act-approve">
                <strong>Approve</strong>
                <span>Deliver the assessment as-is</span>
              </label>
            </div>
            <div class="action-option">
              <input type="radio" id="act-edit" bind:group={action} value="edit" />
              <label for="act-edit">
                <strong>Edit</strong>
                <span>Modify content before delivery</span>
              </label>
            </div>
            <div class="action-option">
              <input type="radio" id="act-reject" bind:group={action} value="reject" />
              <label for="act-reject">
                <strong>Reject</strong>
                <span>Do not deliver, notify customer</span>
              </label>
            </div>
          </div>

          {#if action === 'edit'}
            <div class="edit-area">
              <Label>Edited Content</Label>
              <textarea
                class="edit-textarea"
                bind:value={editedContent}
                rows="10"
              ></textarea>
            </div>
          {/if}

          <div class="notes-area">
            <Label>Operator Notes</Label>
            <textarea
              class="notes-textarea"
              bind:value={notes}
              placeholder="Add a note about your decision..."
              rows="3"
            ></textarea>
          </div>

          {#if !showConfirm}
            <Button onclick={() => showConfirm = true}>
              Review — {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Save Edits'}
            </Button>
          {:else}
            <div class="confirm-box" in:fade>
              <p>
                {action === 'approve' ? 'This will approve the assessment and proceed with delivery.' :
                 action === 'reject' ? 'This will reject the assessment and notify the customer.' :
                 'This will save your edits and update the assessment.'}
                Are you sure?
              </p>
              <div class="confirm-actions">
                <Button onclick={submitReview} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Confirm'}
                </Button>
                <button class="cancel-btn" onclick={() => showConfirm = false}>Cancel</button>
              </div>
            </div>
          {/if}
        </CardContent>
      </Card>
    {:else}
      <!-- Show completion info for resolved reviews -->
      <Card>
        <CardHeader>
          <CardTitle>Review Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This assessment has been reviewed and {review.status}.</p>
          {#if review.operatorNotes}
            <div class="completion-notes">
              <h3>Operator Notes</h3>
              <p>{review.operatorNotes}</p>
            </div>
          {/if}
        </CardContent>
      </Card>
    {/if}
  {/if}
</div>

<style>
  .review-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .breadcrumb a {
    font-size: 0.8125rem;
    color: var(--color-accent);
    text-decoration: none;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }

  .header-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .page-header h1 {
    font-size: 1.5rem;
    margin: 0;
  }

  .header-info .mono {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--color-ink-muted);
    margin: 0.25rem 0 0;
  }

  .header-badges {
    display: flex;
    gap: 0.375rem;
  }

  .error-banner, .success-banner {
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
    margin-bottom: 1rem;
  }

  .error-banner {
    background: var(--color-danger-bg);
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
  }

  .success-banner {
    background: var(--color-success-bg);
    border: 1px solid var(--color-success);
    color: var(--color-success);
  }

  .loading, .no-data {
    text-align: center;
    padding: 3rem;
    color: var(--color-ink-muted);
  }

  .gate-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 640px) {
    .gate-info {
      grid-template-columns: 1fr;
    }
  }

  .gi-row {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .gi-label {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .gi-value {
    font-size: 0.9375rem;
    color: var(--color-ink);
  }

  .reasoning-block {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-page-muted);
    border-radius: var(--radius);
  }

  .reasoning-block h3 {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
  }

  .reasoning-block p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-ink);
    white-space: pre-wrap;
  }

  .transcript-block {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.6;
    white-space: pre-wrap;
    color: var(--color-ink);
    max-height: 400px;
    overflow-y: auto;
  }

  .action-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .action-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .action-option:has(input:checked) {
    border-color: var(--color-accent);
    background: var(--color-accent-bg);
  }

  .action-option input {
    margin-top: 0.125rem;
    accent-color: var(--color-accent);
  }

  .action-option label {
    cursor: pointer;
    flex: 1;
  }

  .action-option label strong {
    display: block;
    font-size: 0.9375rem;
    margin-bottom: 0.125rem;
  }

  .action-option label span {
    font-size: 0.8125rem;
    color: var(--color-ink-muted);
  }

  .edit-area, .notes-area {
    margin-bottom: 1rem;
  }

  .edit-textarea, .notes-textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    font-size: 0.875rem;
    line-height: 1.5;
    background: var(--color-page);
    color: var(--color-ink);
    resize: vertical;
  }

  .edit-textarea {
    font-family: monospace;
  }

  .confirm-box {
    padding: 1rem;
    background: var(--color-page-muted);
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
  }

  .confirm-box p {
    margin: 0 0 1rem;
    font-size: 0.9375rem;
  }

  .confirm-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .cancel-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: var(--color-ink-muted);
    cursor: pointer;
    font-size: 0.875rem;
  }

  .cancel-btn:hover {
    color: var(--color-ink);
  }

  .completion-notes {
    margin-top: 1rem;
    padding: 0.75rem;
    background: var(--color-page-muted);
    border-radius: var(--radius);
  }

  .completion-notes h3 {
    font-size: 0.875rem;
    margin: 0 0 0.375rem;
  }

  .completion-notes p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-ink-muted);
  }
</style>
