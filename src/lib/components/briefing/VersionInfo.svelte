<script lang="ts">
  interface Props {
    version?: number;
    lastUpdated?: string;
    reportId?: string;
  }

  let { version = 1, lastUpdated, reportId }: Props = $props();

  let showHistory = $state(false);
  let regenerating = $state(false);
  let regenerateMsg = $state('');

  async function requestRegeneration() {
    if (!reportId) return;
    regenerating = true;
    regenerateMsg = '';

    try {
      const res = await fetch(`/api/assessment/${reportId}/regenerate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        regenerateMsg = data.message || 'Regeneration requested. Check back later.';
      } else {
        regenerateMsg = data.error || 'Failed to request regeneration.';
      }
    } catch {
      regenerateMsg = 'Network error. Please try again.';
    } finally {
      regenerating = false;
    }
  }
</script>

<div class="version-info">
  <div class="info-row">
    <span class="info-label">Version</span>
    <span class="info-value">v{version}</span>
  </div>

  {#if lastUpdated}
    <div class="info-row">
      <span class="info-label">Last updated</span>
      <span class="info-value">{new Date(lastUpdated).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
  {/if}

  <div class="actions">
    <button
      class="btn-regenerate"
      onclick={requestRegeneration}
      disabled={regenerating}
    >
      {regenerating ? 'Requesting…' : '↻ Re-run Assessment'}
    </button>

    {#if version > 1}
      <button class="btn-history" onclick={() => showHistory = !showHistory}>
        {showHistory ? '▼' : '▶'} Version History
      </button>
    {/if}
  </div>

  {#if regenerateMsg}
    <p class="regenerate-msg">{regenerateMsg}</p>
  {/if}

  {#if showHistory && version > 1}
    <div class="version-history">
      <h4>Version History</h4>
      <div class="history-list">
        {#each Array.from({ length: version }, (_, i) => version - i) as v}
          <div class="history-row" class:current={v === version}>
            <span class="h-version">v{v}</span>
            <span class="h-status">{v === version ? 'Current' : 'Archived'}</span>
            <span class="h-date">{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '—'}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .version-info {
    font-size: 0.875rem;
    color: #666;
    margin: 1rem 0;
    padding: 1rem;
    background: #fafafa;
    border-radius: 10px;
    border: 1px solid #eee;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
  }
  .info-label {
    color: #888;
    font-weight: 500;
  }
  .info-value {
    color: #1a1a2e;
    font-weight: 600;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }
  .btn-regenerate {
    padding: 0.5rem 1rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-regenerate:hover { background: #5a6fd6; }
  .btn-regenerate:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-history {
    padding: 0.5rem 0.75rem;
    background: none;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.8125rem;
    color: #666;
    cursor: pointer;
  }
  .btn-history:hover { background: #f5f5f5; }

  .regenerate-msg {
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    color: #667eea;
  }

  .version-history {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #eee;
  }
  .version-history h4 {
    font-size: 0.8125rem;
    margin: 0 0 0.5rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .history-row {
    display: flex;
    gap: 1rem;
    padding: 0.35rem 0.5rem;
    border-radius: 6px;
    font-size: 0.8125rem;
  }
  .history-row.current {
    background: #eef4ff;
  }
  .h-version { font-weight: 600; color: #1a1a2e; width: 3rem; }
  .h-status { color: #888; width: 5rem; }
  .h-date { color: #aaa; }
</style>
