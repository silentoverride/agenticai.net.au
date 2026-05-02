<script lang="ts">
  import { useClerkContext } from 'svelte-clerk';

  const clerk = useClerkContext();

  let receipts = $state<any[]>([]);
  let loading = $state(true);

  $effect(() => {
    if (clerk.auth.userId != null) loadReceipts();
  });

  async function loadReceipts() {
    try {
      const res = await fetch('/api/portal/receipts');
      if (res.ok) receipts = await res.json();
    } catch (e) {
      console.error('Failed to load receipts', e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="portal-page">
  <h1>Your Receipts</h1>

  {#if loading}
    <p>Loading receipts...</p>
  {:else if receipts.length === 0}
    <div class="empty-state">
      <p>No receipts yet.</p>
      <p class="hint">Receipts appear here after you complete an AI Business Assessment payment.</p>
    </div>
  {:else}
    <div class="receipts-table-wrapper">
      <table class="receipts-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each receipts as receipt}
            <tr>
              <td>{new Date(receipt.created_at).toLocaleDateString('en-AU')}</td>
              <td>AI Business Assessment — {receipt.company || 'General'}</td>
              <td>
                ${(receipt.amount_cents / 100).toFixed(2)}
                {receipt.currency?.toUpperCase()}
              </td>
              <td>
                <a href="/api/portal/receipts/{receipt.id}/download" class="btn-download">Download</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .portal-page h1 {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
    color: #1a1a2e;
  }
  .empty-state {
    text-align: center;
    padding: 3rem;
    background: white;
    border-radius: 12px;
  }
  .empty-state p {
    color: #666;
  }
  .hint {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
  .receipts-table-wrapper {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .receipts-table {
    width: 100%;
    border-collapse: collapse;
  }
  .receipts-table th,
  .receipts-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }
  .receipts-table th {
    font-weight: 600;
    font-size: 0.8125rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .btn-download {
    background: #f0f0f0;
    color: #1a1a2e;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.8125rem;
    font-weight: 500;
  }
  .btn-download:hover {
    background: #e0e0e0;
  }
</style>
