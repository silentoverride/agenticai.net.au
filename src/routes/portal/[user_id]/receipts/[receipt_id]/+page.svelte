<script lang="ts">
  import { page } from '$app/state';
  import { useClerkContext } from 'svelte-clerk';
  import { portalGet } from '$lib/portal-client';
  import { usePortalAuth } from '$lib/portal-context.svelte';
  import type { PortalReceipt } from '$lib/types';

  const clerk = useClerkContext();
  const { userId, isDevBypass } = usePortalAuth();
  const receiptId = $derived(page.params.receipt_id);

  let receipt = $state<PortalReceipt | null>(null);
  let loading = $state(true);
  let errorMsg = $state('');

  $effect(() => {
    if (clerk.auth.userId != null || isDevBypass) loadReceipt();
  });

  async function loadReceipt() {
    try {
      const res = await portalGet(`/api/portal/receipts/${receiptId}`);
      if (!res.ok) throw new Error('Receipt not found');
      receipt = await res.json();
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Failed to load receipt';
    } finally {
      loading = false;
    }
  }

  function money(cents: number | null, currency: string | null = 'AUD') {
    if (cents == null) return '—';
    return `$${(cents / 100).toFixed(2)} ${(currency || 'AUD').toUpperCase()}`;
  }
</script>

<svelte:head>
  <title>Receipt — Portal | Agentic AI</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="portal-page">
  <a href={`/portal/${userId}/receipts`} class="back-link">← Back to receipts</a>

  {#if loading}
    <p>Loading receipt…</p>
  {:else if errorMsg}
    <p class="error">{errorMsg}</p>
  {:else if receipt}
    <div class="receipt-card">
      <h1>Tax Invoice / Receipt</h1>

      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">
          {new Date(receipt.created_at).toLocaleDateString('en-AU', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </span>
      </div>

      {#if receipt.customer_name}
        <div class="detail-row">
          <span class="detail-label">Customer</span>
          <span class="detail-value">{receipt.customer_name}</span>
        </div>
      {/if}
      {#if receipt.company}
        <div class="detail-row">
          <span class="detail-label">Company</span>
          <span class="detail-value">{receipt.company}</span>
        </div>
      {/if}
      {#if receipt.customer_email}
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">{receipt.customer_email}</span>
        </div>
      {/if}

      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">AI Business Assessment</span>
      </div>

      <div class="detail-row total">
        <span class="detail-label">Total Paid</span>
        <span class="detail-value total-amount">
          {money(receipt.amount_cents, receipt.currency)}
        </span>
      </div>

      {#if receipt.stripe_session_id}
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value mono">{receipt.stripe_session_id}</span>
        </div>
      {/if}

      <div class="detail-actions">
        <a
          class="btn-primary"
          href={`/api/portal/receipts/${receiptId}/download`}
          download
        >
          Download PDF
        </a>
      </div>
    </div>
  {/if}
</div>

<style>
  .portal-page {
    max-width: 560px;
  }
  .back-link {
    display: inline-block;
    margin-bottom: 1rem;
    color: #0066ff;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9375rem;
  }
  .back-link:hover {
    text-decoration: underline;
  }
  .receipt-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .receipt-card h1 {
    font-size: 1.375rem;
    color: #1a1a2e;
    margin: 0 0 1.5rem 0;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f0f0f0;
  }
  .detail-row.total {
    border-top: 2px solid #1a1a2e;
    border-bottom: none;
    margin-top: 0.5rem;
    padding-top: 1rem;
  }
  .detail-label {
    font-size: 0.875rem;
    color: #888;
    flex-shrink: 0;
  }
  .detail-value {
    font-size: 0.9375rem;
    color: #1a1a2e;
    font-weight: 500;
    text-align: right;
    word-break: break-all;
  }
  .detail-value.total-amount {
    font-size: 1.25rem;
    font-weight: 700;
  }
  .detail-value.mono {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.8125rem;
    color: #666;
  }
  .detail-actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.75rem;
  }
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #0066ff;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9375rem;
  }
  .btn-primary:hover {
    background: #0052cc;
  }
  .error {
    color: #c62828;
    padding: 1rem;
    background: #ffebee;
    border-radius: 8px;
  }
</style>
