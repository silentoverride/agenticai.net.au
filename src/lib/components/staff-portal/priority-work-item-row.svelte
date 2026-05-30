<script lang="ts">
  /**
   * PriorityWorkItemRow — scan-ready summary row for the Command Console.
   *
   * Renders client/work label, lifecycle state, blocker indicator, risk signal,
   * owner, age/due date, priority reason, consequence, and next action.
   *
   * Props:
   *   item: StaffCommandCenterItemDto — from the Command Center read model
   */

  import { Badge, Button } from '$lib/components/ui';
  import {
    REPORT_STATE_PRESENTATION,
    RISK_SIGNAL_PRESENTATION,
    BLOCKED_REASON_PRESENTATION
  } from '$lib/staff-portal/dto';
  import type { StaffCommandCenterItemDto } from '$lib/staff-portal/dto';

  let {
    item
  }: {
    item: StaffCommandCenterItemDto;
  } = $props();

  // --- Derived state ---

  const statePresentation = $derived(
    REPORT_STATE_PRESENTATION[item.lifecycleState as keyof typeof REPORT_STATE_PRESENTATION]
      ?? { label: item.lifecycleState, tone: 'neutral', accessibleLabel: item.lifecycleState, description: '', remediationHint: '', testId: `state-${item.lifecycleState}` }
  );

  const toneBadgeMap: Record<string, 'default' | 'warning' | 'success' | 'danger' | 'secondary' | 'outline'> = {
    neutral: 'default',
    attention: 'warning',
    warning: 'warning',
    danger: 'danger',
    success: 'success',
    audit: 'default',
    disabled: 'outline'
  };

  const badgeVariant = $derived(toneBadgeMap[statePresentation.tone] ?? 'default');

  const blockedPresentation = $derived(
    item.nextSafeAction.blockedReason
      ? BLOCKED_REASON_PRESENTATION[item.nextSafeAction.blockedReason]
      : null
  );

  const isHighRisk = $derived(
    item.nextSafeAction.blockedReason === 'unresolvedBlockingFinding'
    || item.nextSafeAction.blockedReason === 'conflictingRecords'
  );

  function formatAge(days: number): string {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  }

  function shortId(id: string): string {
    return id.length > 12 ? id.slice(0, 12) + '...' : id;
  }
</script>

<div
  class="priority-row"
  data-testid="priority-row-{item.workItemId}"
  role="listitem"
>
  <!-- Client / Work label -->
  <div class="row-primary">
    <a
      href="/staff/assessments/{item.workItemId}"
      class="client-link"
      data-testid="priority-row-link-{item.workItemId}"
    >
      {item.clientName}
    </a>
    <span class="mono id-hint">{shortId(item.workItemId)}</span>
  </div>

  <!-- Lifecycle state badge + risk signal -->
  <div class="row-state-group">
    <Badge variant={badgeVariant} data-testid="priority-row-state-{item.workItemId}">
      {statePresentation.label}
    </Badge>
    {#if isHighRisk}
      <span
        class="risk-indicator"
        data-testid="priority-row-risk-{item.workItemId}"
        aria-label={RISK_SIGNAL_PRESENTATION.blocked.accessibleLabel}
      >
        ⚠ {RISK_SIGNAL_PRESENTATION.blocked.label}
      </span>
    {/if}
  </div>

  <!-- Owner -->
  <div class="row-owner" data-testid="priority-row-owner-{item.workItemId}">
    {item.owner ?? 'Unassigned'}
  </div>

  <!-- Age / Due date -->
  <div class="row-age" data-testid="priority-row-age-{item.workItemId}">
    {#if item.dueDate}
      Due: {item.dueDate}
    {:else}
      {formatAge(item.ageDays)}
    {/if}
  </div>

  <!-- Priority reason -->
  <div class="row-reason" data-testid="priority-row-reason-{item.workItemId}">
    {item.priorityReason}
  </div>

  <!-- Consequence of inaction -->
  {#if item.consequenceOfInaction}
    <div class="row-consequence" data-testid="priority-row-consequence-{item.workItemId}">
      {item.consequenceOfInaction}
    </div>
  {/if}

  <!-- Next safe action -->
  <div class="row-action" data-testid="priority-row-action-{item.workItemId}">
    {#if item.nextSafeAction.enabled}
      <a href="/staff/assessments/{item.workItemId}">
        <Button variant="primary" size="sm">
          {item.nextSafeAction.label}
        </Button>
      </a>
    {:else}
      <Button variant="outline" size="sm" disabled>
        {item.nextSafeAction.label}
      </Button>
      {#if blockedPresentation}
        <span class="blocked-hint" role="status" aria-label={blockedPresentation.accessibleLabel}>
          {blockedPresentation.description}
        </span>
      {/if}
    {/if}
  </div>
</div>

<style>
  .priority-row {
    display: grid;
    grid-template-columns: 2fr auto auto auto 1.5fr 1.5fr auto;
    gap: 0.5rem 1rem;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.875rem;
  }

  .priority-row:hover {
    background: var(--color-surface-hover, rgba(0,0,0,0.02));
  }

  .row-primary {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .client-link {
    font-weight: 600;
    color: var(--color-accent);
    text-decoration: none;
  }

  .client-link:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .id-hint {
    font-size: 0.7rem;
    color: var(--color-text-muted, #888);
  }

  .row-state-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .risk-indicator {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--color-danger, #c00);
  }

  .row-owner,
  .row-age {
    font-size: 0.8rem;
    color: var(--color-text-secondary, #555);
  }

  .row-reason {
    font-size: 0.8rem;
    font-weight: 500;
  }

  .row-consequence {
    font-size: 0.75rem;
    color: var(--color-text-muted, #888);
    font-style: italic;
  }

  .row-action {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-start;
  }

  .blocked-hint {
    font-size: 0.7rem;
    color: var(--color-text-muted, #888);
    max-width: 200px;
    line-height: 1.3;
  }

  .mono {
    font-family: 'SF Mono', 'Menlo', monospace;
  }
</style>
