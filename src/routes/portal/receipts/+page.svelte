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
    <div class="receipts-grid">
      {#each receipts as receipt}
        <a
          class="receipt-card"
          href="/api/portal/receipts/{receipt.id}/download"
          download
        >
          <div class="receipt-header">
            <span class="receipt-date">{new Date(receipt.created_at).toLocaleDateString('en-AU', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</span>
            <span class="receipt-amount">
              ${(receipt.amount_cents / 100).toFixed(2)}
              <span class="receipt-currency">{receipt.currency?.toUpperCase()}</span>
            </span>
          </div>
          <h3>AI Business Assessment</h3>
          <p class="receipt-company">{receipt.company || 'General'}</p>
          <span class="receipt-action">Download Receipt →</span>
        </a>
      {/each}
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
  .receipts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  .receipt-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .receipt-card:hover,
  .receipt-card:focus {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    outline: 3px solid #0066ff;
    outline-offset: 0;
  }
  .receipt-card:active {
    transform: translateY(-2px);
  }
  .receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }
  .receipt-date {
    font-size: 0.8125rem;
    color: #888;
  }
  .receipt-amount {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a2e;
  }
  .receipt-currency {
    font-size: 0.75rem;
    font-weight: 500;
    color: #888;
    margin-left: 0.25rem;
  }
  .receipt-card h3 {
    font-size: 1rem;
    color: #1a1a2e;
    margin: 0;
  }
  .receipt-company {
    font-size: 0.875rem;
    color: #666;
    margin: 0;
  }
  .receipt-action {
    margin-top: auto;
    padding-top: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #0066ff;
  }
  .receipt-card:hover .receipt-action {
    text-decoration: underline;
  }
</style>
