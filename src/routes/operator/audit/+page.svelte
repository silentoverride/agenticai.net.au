<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  interface AuditEvent {
    id: string;
    assessmentId: string;
    targetType: string;
    targetId: string | null;
    actorId: string;
    action: string;
    fromState: string;
    toState: string;
    reasonCode: string | null;
    reason: string | null;
    metadataJson: string | null;
    createdAt: string;
  }

  interface AuditResponse {
    success?: boolean;
    events?: AuditEvent[];
    error?: string;
  }

  let { data }: { data: { events: AuditEvent[] } } = $props();

  let events = $state<AuditEvent[]>([]);
  let loading = $state(false);
  let error = $state('');
  let live = $state(true);
  let lastUpdated = $state(new Date());
  let newEventCount = $state(0);
  let search = $state('');
  let actionFilter = $state('');
  let targetFilter = $state('');

  const filteredEvents = $derived(events.filter(event => {
    const searchText = search.trim().toLowerCase();
    const matchesSearch = !searchText || [
      event.id,
      event.assessmentId,
      event.targetId ?? '',
      event.actorId,
      event.action,
      event.reasonCode ?? '',
      event.reason ?? ''
    ].some(value => value.toLowerCase().includes(searchText));

    return matchesSearch
      && (!actionFilter || event.action === actionFilter)
      && (!targetFilter || event.targetType === targetFilter);
  }));

  const actions = $derived([...new Set(events.map(event => event.action))].sort());
  const targetTypes = $derived([...new Set(events.map(event => event.targetType))].sort());

  $effect(() => {
    if (events.length === 0 && data.events.length > 0) {
      events = data.events;
    }
  });

  async function refreshEvents({ countNewEvents = true } = {}) {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/operator/audit-events?limit=100', { cache: 'no-store' });
      const payload = (await res.json()) as AuditResponse;

      if (!res.ok || !payload.success || !payload.events) {
        error = payload.error || 'Failed to load audit events';
        return;
      }

      const existingIds = new Set(events.map(event => event.id));
      const incomingNew = payload.events.filter(event => !existingIds.has(event.id));
      if (countNewEvents && incomingNew.length > 0) {
        newEventCount += incomingNew.length;
      }

      const merged = new Map<string, AuditEvent>();
      for (const event of [...payload.events, ...events]) {
        merged.set(event.id, event);
      }
      events = Array.from(merged.values())
        .sort((a, b) => eventTime(b.createdAt) - eventTime(a.createdAt))
        .slice(0, 200);
      lastUpdated = new Date();
    } catch {
      error = 'Audit stream request failed';
    } finally {
      loading = false;
    }
  }

  function eventTime(value: string): number {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
    return new Date(normalized).getTime() || 0;
  }

  function formatDate(value: string): string {
    const date = new Date(eventTime(value));
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function shortId(value: string): string {
    return value.length > 16 ? value.slice(0, 16) + '…' : value;
  }

  function prettyMetadata(value: string | null): string {
    if (!value) return '';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  onMount(() => {
    const timer = setInterval(() => {
      if (live) refreshEvents();
    }, 3000);

    return () => clearInterval(timer);
  });
</script>

<svelte:head>
  <title>Realtime Audit Stream — Admin</title>
</svelte:head>

<div class="audit-page">
  <header class="page-header">
    <div>
      <p class="eyebrow">Admin only</p>
      <h1>Realtime Audit Stream</h1>
      <p>Live view of staff action audit events as operators change report, finding, follow-up, meeting brief, and commercial states.</p>
    </div>
    <div class="live-panel">
      <span class="live-pill" class:paused={!live}>
        <span class="live-dot"></span>
        {live ? 'Live' : 'Paused'}
      </span>
      <button class="secondary-btn" onclick={() => live = !live}>{live ? 'Pause' : 'Resume'}</button>
      <button class="primary-btn" onclick={() => refreshEvents({ countNewEvents: false })} disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh now'}
      </button>
    </div>
  </header>

  {#if error}
    <div class="error-banner" in:fade>{error}</div>
  {/if}

  <section class="summary-grid" aria-label="Audit stream summary">
    <div class="summary-card">
      <span class="summary-value">{events.length}</span>
      <span class="summary-label">Loaded events</span>
    </div>
    <div class="summary-card">
      <span class="summary-value">{newEventCount}</span>
      <span class="summary-label">New this session</span>
    </div>
    <div class="summary-card wide">
      <span class="summary-value small">{lastUpdated.toLocaleTimeString('en-AU')}</span>
      <span class="summary-label">Last refreshed</span>
    </div>
  </section>

  <section class="filters" aria-label="Audit filters">
    <label>
      Search
      <input bind:value={search} placeholder="Assessment, actor, reason…" />
    </label>
    <label>
      Action
      <select bind:value={actionFilter}>
        <option value="">All actions</option>
        {#each actions as action}
          <option value={action}>{action}</option>
        {/each}
      </select>
    </label>
    <label>
      Target
      <select bind:value={targetFilter}>
        <option value="">All targets</option>
        {#each targetTypes as targetType}
          <option value={targetType}>{targetType}</option>
        {/each}
      </select>
    </label>
  </section>

  <section class="stream" aria-live="polite">
    {#if filteredEvents.length === 0}
      <div class="empty-state">
        <h2>No audit events found</h2>
        <p>{events.length === 0 ? 'The audit table is empty. New staff actions will appear here automatically.' : 'No events match the current filters.'}</p>
      </div>
    {:else}
      {#each filteredEvents as event (event.id)}
        <article class="audit-event" in:fade>
          <div class="event-time">
            <strong>{formatDate(event.createdAt)}</strong>
            <span>{shortId(event.id)}</span>
          </div>
          <div class="event-main">
            <div class="event-title">
              <span class="action-badge">{event.action}</span>
              <span class="state-change">{event.fromState} → {event.toState}</span>
            </div>
            <div class="event-meta">
              <span>Assessment <a href="/operator/assessments/{event.assessmentId}">{shortId(event.assessmentId)}</a></span>
              <span>Target {event.targetType}{event.targetId ? ` / ${shortId(event.targetId)}` : ''}</span>
              <span>Actor {shortId(event.actorId)}</span>
            </div>
            {#if event.reasonCode || event.reason}
              <p class="event-reason">
                {#if event.reasonCode}<strong>{event.reasonCode}</strong>{/if}
                {event.reason ? ` — ${event.reason}` : ''}
              </p>
            {/if}
            {#if event.metadataJson}
              <details>
                <summary>Metadata</summary>
                <pre>{prettyMetadata(event.metadataJson)}</pre>
              </details>
            {/if}
          </div>
        </article>
      {/each}
    {/if}
  </section>
</div>

<style>
  .audit-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .eyebrow {
    margin: 0 0 0.25rem;
    color: #7c3aed;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .page-header h1 {
    margin: 0;
    color: #111827;
    font-size: 2rem;
  }

  .page-header p:not(.eyebrow) {
    margin: 0.35rem 0 0;
    color: #6b7280;
    max-width: 720px;
  }

  .live-panel {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .live-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.7rem;
    border-radius: 999px;
    background: #ecfdf5;
    color: #047857;
    font-weight: 800;
    font-size: 0.75rem;
    border: 1px solid #a7f3d0;
  }

  .live-pill.paused {
    background: #f3f4f6;
    color: #4b5563;
    border-color: #d1d5db;
  }

  .live-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 999px;
    background: currentColor;
  }

  .primary-btn,
  .secondary-btn {
    border: 0;
    border-radius: 0.65rem;
    padding: 0.6rem 0.85rem;
    font-weight: 700;
    cursor: pointer;
  }

  .primary-btn {
    background: #1a1a2e;
    color: #fff;
  }

  .primary-btn:disabled {
    opacity: 0.65;
    cursor: wait;
  }

  .secondary-btn {
    background: #fff;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    padding: 0.9rem 1rem;
    border-radius: 0.75rem;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .summary-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  }

  .summary-value {
    display: block;
    font-size: 1.75rem;
    font-weight: 800;
    color: #111827;
  }

  .summary-value.small {
    font-size: 1.2rem;
  }

  .summary-label {
    display: block;
    margin-top: 0.15rem;
    color: #6b7280;
    font-size: 0.8rem;
    font-weight: 700;
  }

  .filters {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 0.75rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1rem;
  }

  .filters label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    color: #4b5563;
    font-size: 0.8rem;
    font-weight: 800;
  }

  .filters input,
  .filters select {
    border: 1px solid #d1d5db;
    border-radius: 0.65rem;
    padding: 0.65rem 0.75rem;
    font: inherit;
    background: #fff;
  }

  .stream {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .audit-event {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 1rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  }

  .event-time {
    color: #374151;
    font-size: 0.82rem;
  }

  .event-time span {
    display: block;
    margin-top: 0.25rem;
    color: #9ca3af;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .event-main {
    min-width: 0;
  }

  .event-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .action-badge {
    padding: 0.25rem 0.55rem;
    border-radius: 999px;
    background: #eef2ff;
    color: #3730a3;
    font-size: 0.75rem;
    font-weight: 800;
  }

  .state-change {
    color: #111827;
    font-weight: 800;
  }

  .event-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    margin-top: 0.55rem;
    color: #6b7280;
    font-size: 0.82rem;
  }

  .event-meta a {
    color: #2563eb;
    font-weight: 700;
    text-decoration: none;
  }

  .event-reason {
    margin: 0.65rem 0 0;
    color: #374151;
    line-height: 1.5;
  }

  details {
    margin-top: 0.75rem;
  }

  summary {
    cursor: pointer;
    color: #4b5563;
    font-weight: 700;
  }

  pre {
    overflow-x: auto;
    margin: 0.5rem 0 0;
    padding: 0.75rem;
    border-radius: 0.65rem;
    background: #0f172a;
    color: #d1d5db;
    font-size: 0.75rem;
  }

  .empty-state {
    background: #fff;
    border: 1px dashed #cbd5e1;
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
  }

  .empty-state h2 {
    margin: 0;
    color: #111827;
  }

  .empty-state p {
    margin: 0.5rem 0 0;
    color: #6b7280;
  }

  @media (max-width: 860px) {
    .page-header,
    .live-panel {
      align-items: stretch;
      flex-direction: column;
    }

    .summary-grid,
    .filters,
    .audit-event {
      grid-template-columns: 1fr;
    }
  }
</style>
