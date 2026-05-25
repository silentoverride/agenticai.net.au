<script lang="ts">
  /**
   * AuditTimeline — Renders persisted audit events for an assessment.
   *
   * Fetches events on mount via the audit events API endpoint.
   * Groups entries by day. Never renders from local optimistic state.
   */

  import { onMount } from 'svelte';
  import { Badge } from '$lib/components/ui';
  import {
    REPORT_STATE_PRESENTATION,
    GATE_FINDING_STATE_PRESENTATION,
    REPORT_ACTION_PRESENTATION,
    GATE_FINDING_ACTION_PRESENTATION
  } from '$lib/staff-portal/dto';
  import type { StaffActionReceiptDto } from '$lib/staff-portal/dto';

  let {
    assessmentId
  }: {
    assessmentId: string;
  } = $props();

  interface AuditEventEntry {
    id: string;
    action: string;
    actorId: string;
    targetType: string;
    targetId: string | null;
    previousState: string;
    resultingState: string;
    reasonCode: string | null;
    reason: string | null;
    createdAt: string;
  }

  let events = $state<AuditEventEntry[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      const res = await fetch(`/api/operator/assessments/${assessmentId}/audit-events`);
      if (!res.ok) {
        error = `Failed to load audit events (${res.status})`;
        return;
      }
      const data = await res.json() as { events: AuditEventEntry[] };
      events = data.events ?? [];
    } catch (e) {
      error = 'Could not load audit events.';
    } finally {
      loading = false;
    }
  });

  // ── Helpers ──

  function actionLabel(action: string): string {
    return REPORT_ACTION_PRESENTATION[action]?.label
      ?? GATE_FINDING_ACTION_PRESENTATION[action]?.label
      ?? action;
  }

  function stateLabel(state: string): string {
    return REPORT_STATE_PRESENTATION[state as keyof typeof REPORT_STATE_PRESENTATION]?.label
      ?? GATE_FINDING_STATE_PRESENTATION[state as keyof typeof GATE_FINDING_STATE_PRESENTATION]?.label
      ?? state;
  }

  function actionBadgeVariant(action: string): 'default' | 'success' | 'warning' | 'danger' {
    if (['approveReport', 'resolveFinding'].includes(action)) return 'success';
    if (['rejectReport', 'overrideFinding', 'requestRegeneration', 'requestClarification'].includes(action)) return 'warning';
    if (['escalateFinding', 'claimFinding'].includes(action)) return 'default';
    return 'default';
  }

  function targetLabel(entry: AuditEventEntry): string {
    if (entry.targetId) return `${entry.targetType} ${entry.targetId.slice(0, 8)}`;
    return entry.targetType;
  }

  function formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString('en-AU', {
        day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-AU', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch { return iso; }
  }

  // Group by date for timeline display
  let grouped = $derived.by(() => {
    const map = new Map<string, AuditEventEntry[]>();
    for (const e of events) {
      const dateKey = e.createdAt.slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  });
</script>

<div class="audit-timeline" data-testid="audit-timeline">
  {#if loading}
    <p class="timeline-status" role="status">Loading audit timeline...</p>
  {:else if error}
    <p class="timeline-status error" role="alert">{error}</p>
  {:else if events.length === 0}
    <p class="timeline-status empty">No audit events recorded for this assessment.</p>
  {:else}
    <h3 class="timeline-heading">Audit Timeline</h3>
    {#each grouped as [dateKey, dateEvents]}
      <div class="timeline-date-group">
        <time class="timeline-date" datetime={dateKey}>{formatDate(dateKey)}</time>
        <div class="timeline-entries">
          {#each dateEvents as entry (entry.id)}
            <div class="timeline-entry" data-testid="audit-timeline-entry-{entry.id}">
              <div class="entry-marker" aria-hidden="true"></div>
              <div class="entry-body">
                <div class="entry-header">
                  <Badge variant={actionBadgeVariant(entry.action)}>{actionLabel(entry.action)}</Badge>
                  <span class="entry-time">{formatTime(entry.createdAt)}</span>
                  <span class="entry-actor mono">{entry.actorId}</span>
                </div>
                <div class="entry-details">
                  <span class="entry-detail">
                    <span class="detail-label">Target:</span> {targetLabel(entry)}
                  </span>
                  <span class="entry-detail">
                    <span class="detail-label">From:</span> {stateLabel(entry.previousState)}
                    <span class="arrow" aria-hidden="true">→</span>
                    <span class="detail-label">To:</span> {stateLabel(entry.resultingState)}
                  </span>
                  {#if entry.reasonCode}
                    <span class="entry-detail">
                      <span class="detail-label">Reason:</span> {entry.reasonCode}
                    </span>
                  {/if}
                  {#if entry.reason}
                    <span class="entry-detail entry-reason">{entry.reason}</span>
                  {/if}
                  <span class="entry-detail mono-small">ID: {entry.id}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .audit-timeline {
    margin-top: 0.5rem;
  }

  .timeline-status {
    text-align: center;
    padding: 1.5rem;
    color: var(--color-ink-muted);
    font-size: 0.875rem;
  }

  .timeline-status.error {
    color: var(--color-danger);
    background: var(--color-danger-bg, #fef2f2);
    border-radius: var(--radius);
  }

  .timeline-status.empty {
    font-style: italic;
  }

  .timeline-heading {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-ink);
    margin: 0 0 1rem;
  }

  .timeline-date-group {
    margin-bottom: 1.5rem;
  }

  .timeline-date {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--color-line);
  }

  .timeline-entries {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-left: 0.75rem;
    border-left: 2px solid var(--color-line);
  }

  .timeline-entry {
    display: flex;
    gap: 0.75rem;
  }

  .entry-marker {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
    margin-top: 0.35rem;
    position: relative;
    left: -0.85rem;
  }

  .entry-body {
    flex: 1;
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius, 6px);
    padding: 0.6rem 0.75rem;
  }

  .entry-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.35rem;
  }

  .entry-time {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
  }

  .entry-actor {
    font-size: 0.7rem;
    color: var(--color-ink-muted);
  }

  .mono, .mono-small {
    font-family: monospace;
  }

  .mono-small {
    font-size: 0.65rem;
    color: var(--color-ink-muted);
    opacity: 0.7;
  }

  .entry-details {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .entry-detail {
    font-size: 0.8rem;
    color: var(--color-ink);
  }

  .detail-label {
    color: var(--color-ink-muted);
    font-weight: 500;
  }

  .arrow {
    margin: 0 0.25rem;
    color: var(--color-ink-muted);
  }

  .entry-reason {
    font-style: italic;
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
  }

  @media (max-width: 640px) {
    .timeline-entries {
      padding-left: 0.5rem;
    }

    .entry-marker {
      width: 8px;
      height: 8px;
      left: -0.65rem;
    }
  }
</style>
