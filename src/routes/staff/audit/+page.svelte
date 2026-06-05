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
    requestHash: string;
    idempotencyKey: string;
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
  let selectedEvent: AuditEvent | null = $state(null);

  const filteredEvents = $derived(events.filter(event => {
    const searchText = search.trim().toLowerCase();
    const matchesSearch = !searchText || [
      event.id,
      event.assessmentId,
      event.targetId ?? '',
      event.actorId,
      event.action,
      event.reasonCode ?? '',
      event.reason ?? '',
      event.requestHash,
      event.idempotencyKey
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
      const res = await fetch('/api/staff/audit-events?limit=100', { cache: 'no-store' });
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

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      selectedEvent = null;
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

<svelte:window onkeydown={handleWindowKeydown} />

<div class="audit-page">
  <header class="page-header">
    <div>
      <h1>Realtime Audit Stream</h1>
      <p>Live view of staff action audit events as staff members change report, finding, follow-up, meeting brief, and commercial states.</p>
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
        <button
          type="button"
          class="audit-event"
          aria-label={`View details for ${event.action} audit event ${event.id}`}
          onclick={() => selectedEvent = event}
          in:fade
        >
          <div class="event-time">
            <strong>{formatDate(event.createdAt)}</strong>
            <span>{shortId(event.id)}</span>
          </div>
          <div class="event-main">
            <div class="event-title">
              <span class="action-badge">{event.action}</span>
              <span class="state-change">{event.fromState} → {event.toState}</span>
              <span class="detail-hint">Click for details</span>
            </div>
            <div class="event-meta">
              <span>Assessment <strong>{shortId(event.assessmentId)}</strong></span>
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
              <p class="event-reason">Metadata available — open details to inspect.</p>
            {/if}
          </div>
        </button>
      {/each}
    {/if}
  </section>
</div>

{#if selectedEvent}
  <div class="modal-shell" in:fade>
    <button class="modal-backdrop" aria-label="Close audit event details" onclick={() => selectedEvent = null}></button>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="audit-event-modal-title">
      <header class="modal-header">
        <div>
          <p class="eyebrow">Audit event detail</p>
          <h2 id="audit-event-modal-title">{selectedEvent.action}</h2>
          <p>{selectedEvent.fromState} → {selectedEvent.toState}</p>
        </div>
        <button class="close-btn" aria-label="Close audit event details" onclick={() => selectedEvent = null}>×</button>
      </header>

      <div class="detail-grid">
        <div><span>Event ID</span><strong>{selectedEvent.id}</strong></div>
        <div><span>Created</span><strong>{formatDate(selectedEvent.createdAt)}</strong></div>
        <div><span>Assessment</span><strong>{selectedEvent.assessmentId}</strong></div>
        <div><span>Actor</span><strong>{selectedEvent.actorId}</strong></div>
        <div><span>Target type</span><strong>{selectedEvent.targetType}</strong></div>
        <div><span>Target ID</span><strong>{selectedEvent.targetId ?? '—'}</strong></div>
        <div><span>Reason code</span><strong>{selectedEvent.reasonCode ?? '—'}</strong></div>
        <div><span>Idempotency key</span><strong>{selectedEvent.idempotencyKey}</strong></div>
        <div class="wide"><span>Request hash</span><strong>{selectedEvent.requestHash}</strong></div>
        <div class="wide"><span>Reason</span><strong>{selectedEvent.reason ?? '—'}</strong></div>
      </div>

      {#if selectedEvent.metadataJson}
        <div class="modal-section">
          <h3>Metadata</h3>
          <pre>{prettyMetadata(selectedEvent.metadataJson)}</pre>
        </div>
      {/if}

      <footer class="modal-actions">
        <a class="secondary-link" href="/staff/assessments/{selectedEvent.assessmentId}">Open assessment</a>
        <button class="primary-btn" onclick={() => selectedEvent = null}>Done</button>
      </footer>
    </div>
  </div>
{/if}

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
    color: var(--color-accent-text);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .page-header h1 {
    margin: 0;
    color: var(--color-ink);
    font-size: 2rem;
  }

  .page-header p:not(.eyebrow) {
    margin: 0.35rem 0 0;
    color: var(--color-muted);
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
    background: var(--color-warm-light);
    color: var(--color-success);
    font-weight: 800;
    font-size: 0.75rem;
    border: 1px solid var(--color-warm-mid);
  }

  .live-pill.paused {
    background: var(--color-panel-soft);
    color: var(--color-muted-2);
    border-color: var(--color-line);
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
    background: var(--dark-bg-2);
    color: var(--color-panel);
  }

  .primary-btn:disabled {
    opacity: 0.65;
    cursor: wait;
  }

  .secondary-btn {
    background: var(--color-panel);
    color: var(--color-ink-2);
    border: 1px solid var(--color-line);
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
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  }

  .summary-value {
    display: block;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--color-ink);
  }

  .summary-value.small {
    font-size: 1.2rem;
  }

  .summary-label {
    display: block;
    margin-top: 0.15rem;
    color: var(--color-muted);
    font-size: 0.8rem;
    font-weight: 700;
  }

  .filters {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 0.75rem;
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: 1rem;
    padding: 1rem;
  }

  .filters label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    color: var(--color-muted-2);
    font-size: 0.8rem;
    font-weight: 800;
  }

  .filters input,
  .filters select {
    border: 1px solid var(--color-line);
    border-radius: 0.65rem;
    padding: 0.65rem 0.75rem;
    font: inherit;
    background: var(--color-panel);
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
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
    cursor: pointer;
    font: inherit;
    text-align: left;
  }

  .audit-event:hover,
  .audit-event:focus-visible {
    border-color: var(--color-accent-text);
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
    outline: none;
  }

  .event-time {
    color: var(--color-ink-2);
    font-size: 0.82rem;
  }

  .event-time span {
    display: block;
    margin-top: 0.25rem;
    color: var(--color-muted-2);
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
    background: var(--color-accent-light);
    color: var(--color-accent-text);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .state-change {
    color: var(--color-ink);
    font-weight: 800;
  }

  .detail-hint {
    margin-left: auto;
    color: var(--color-accent-text);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .event-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    margin-top: 0.55rem;
    color: var(--color-muted);
    font-size: 0.82rem;
  }

  .event-reason {
    margin: 0.65rem 0 0;
    color: var(--color-ink-2);
    line-height: 1.5;
  }

  pre {
    overflow-x: auto;
    margin: 0.5rem 0 0;
    padding: 0.75rem;
    border-radius: 0.65rem;
    background: #0f172a;
    color: var(--color-line);
    font-size: 0.75rem;
  }

  .empty-state {
    background: var(--color-panel);
    border: 1px dashed #cbd5e1;
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
  }

  .empty-state h2 {
    margin: 0;
    color: var(--color-ink);
  }

  .empty-state p {
    margin: 0.5rem 0 0;
    color: var(--color-muted);
  }

  .modal-shell {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .modal-backdrop {
    position: absolute;
    inset: 0;
    border: 0;
    background: rgba(15, 23, 42, 0.58);
    cursor: pointer;
  }

  .modal-card {
    position: relative;
    z-index: 1;
    width: min(760px, 100%);
    max-height: min(86vh, 820px);
    overflow-y: auto;
    background: var(--color-panel);
    border-radius: 1rem;
    border: 1px solid var(--color-line);
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
    padding: 1.25rem;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-line);
  }

  .modal-header h2 {
    margin: 0;
    color: var(--color-ink);
  }

  .modal-header p:not(.eyebrow) {
    margin: 0.25rem 0 0;
    color: var(--color-muted);
    font-weight: 700;
  }

  .close-btn {
    border: 0;
    background: var(--color-panel-soft);
    color: var(--color-ink-2);
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    font-size: 1.25rem;
    cursor: pointer;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .detail-grid div {
    min-width: 0;
    padding: 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 0.75rem;
    background: #f9fafb;
  }

  .detail-grid .wide {
    grid-column: 1 / -1;
  }

  .detail-grid span {
    display: block;
    margin-bottom: 0.25rem;
    color: var(--color-muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .detail-grid strong {
    display: block;
    overflow-wrap: anywhere;
    color: var(--color-ink);
    font-size: 0.9rem;
  }

  .modal-section {
    margin-top: 1rem;
  }

  .modal-section h3 {
    margin: 0 0 0.5rem;
    color: var(--color-ink);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-line);
  }

  .secondary-link {
    display: inline-flex;
    align-items: center;
    border-radius: 0.65rem;
    padding: 0.6rem 0.85rem;
    color: var(--color-ink-2);
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    font-weight: 700;
    text-decoration: none;
  }

  @media (max-width: 860px) {
    .page-header,
    .live-panel {
      align-items: stretch;
      flex-direction: column;
    }

    .summary-grid,
    .filters,
    .audit-event,
    .detail-grid {
      grid-template-columns: 1fr;
    }

    .modal-actions {
      flex-direction: column;
    }
  }
</style>
