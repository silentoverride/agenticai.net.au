<script lang="ts">
  import { useClerkContext } from 'svelte-clerk';
  import { portalGet } from '$lib/portal-client';
  import { usePortalAuth } from '$lib/portal-context.svelte';
  import type { PortalReceipt } from '$lib/types';

  const clerk = useClerkContext();
  const { userId, isDevBypass } = usePortalAuth();

  let receipts = $state<PortalReceipt[]>([]);
  let loading = $state(true);
  let selectedReceipt = $state<PortalReceipt | null>(null);
  let modalOpen = $state(false);

  $effect(() => {
    if (clerk.auth.userId != null || isDevBypass) loadReceipts();
  });

  async function loadReceipts() {
    try {
      const res = await portalGet('/api/portal/receipts');
      if (res.ok) receipts = await res.json();
    } catch (e) {
      console.error('Failed to load receipts', e);
    } finally {
      loading = false;
    }
  }

  function openModal(receipt: PortalReceipt) {
    selectedReceipt = receipt;
    modalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOpen = false;
    selectedReceipt = null;
    document.body.style.overflow = '';
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && modalOpen) closeModal();
  }

  function downloadUrl(receiptId: string) {
    return `/api/portal/receipts/${receiptId}/download`;
  }
</script>

<svelte:window onkeydown={onKeydown} />

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
        <div
          class="receipt-card"
          role="button"
          tabindex="0"
          onclick={() => openModal(receipt)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(receipt); } }}
        >
          <div class="receipt-header">
            <span class="receipt-date">{new Date(receipt.created_at).toLocaleDateString('en-AU', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</span>
            <span class="receipt-amount">
              ${receipt.amount_cents != null ? (receipt.amount_cents / 100).toFixed(2) : '—'}
              <span class="receipt-currency">{receipt.currency?.toUpperCase()}</span>
            </span>
          </div>
          <h3>AI Business Assessment</h3>
          <p class="receipt-company">{receipt.company || 'General'}</p>
          <div class="receipt-actions">
            <span class="receipt-action">View Receipt →</span>
            <a
              class="btn-download"
              href={downloadUrl(receipt.id)}
              target="_blank"
              onclick={(e: MouseEvent) => e.stopPropagation()}
            >
              Download PDF
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if modalOpen && selectedReceipt}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
  >
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" onclick={closeModal} aria-label="Close receipt">×</button>

      <div class="modal-body">
        <div class="modal-header">
          <h2 id="modal-title">Tax Invoice / Receipt</h2>
          <span class="modal-date">{new Date(selectedReceipt.created_at).toLocaleDateString('en-AU', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}</span>
        </div>

        <div class="modal-details">
          <div class="detail-row">
            <span class="detail-label">Service</span>
            <span class="detail-value">AI Business Assessment</span>
          </div>
          {#if selectedReceipt.customer_name}
            <div class="detail-row">
              <span class="detail-label">Customer</span>
              <span class="detail-value">{selectedReceipt.customer_name}</span>
            </div>
          {/if}
          {#if selectedReceipt.customer_email}
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">{selectedReceipt.customer_email}</span>
            </div>
          {/if}
          {#if selectedReceipt.company}
            <div class="detail-row">
              <span class="detail-label">Company</span>
              <span class="detail-value">{selectedReceipt.company}</span>
            </div>
          {/if}
          <div class="detail-row total">
            <span class="detail-label">Total Paid</span>
            <span class="detail-value total-amount">
              ${selectedReceipt.amount_cents != null ? (selectedReceipt.amount_cents / 100).toFixed(2) : '—'}
              <span class="detail-currency">{selectedReceipt.currency?.toUpperCase()}</span>
            </span>
          </div>
          {#if selectedReceipt.stripe_session_id}
            <div class="detail-row">
              <span class="detail-label">Transaction ID</span>
              <span class="detail-value mono">{selectedReceipt.stripe_session_id}</span>
            </div>
          {/if}
        </div>

        <div class="modal-actions">
          <a
            class="btn-primary"
            href={downloadUrl(selectedReceipt.id)}
            target="_blank"
          >
            Download PDF
          </a>
          <a
            class="btn-secondary"
            href={`/portal/${userId}/receipts/${selectedReceipt.id}`}
          >
            View Full Page
          </a>
          <button class="btn-secondary" onclick={closeModal} type="button">Close</button>
        </div>
      </div>
    </div>
  </div>
{/if}

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
    border: none;
    text-align: left;
    font: inherit;
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
  .receipt-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 0.75rem;
    gap: 0.75rem;
  }
  .receipt-action {
    font-size: 0.875rem;
    font-weight: 500;
    color: #0066ff;
  }
  .receipt-card:hover .receipt-action {
    text-decoration: underline;
  }
  .btn-download {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #f0f0f5;
    color: #1a1a2e;
    padding: 0.375rem 0.75rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.8125rem;
    border: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .btn-download:hover {
    background: #e0e0e8;
  }
  .btn-download:focus {
    outline: 2px solid #0066ff;
    outline-offset: 0;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }
  .modal {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    animation: slideUp 0.25s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .modal-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: none;
    background: #f0f0f5;
    color: #555;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
    z-index: 10;
  }
  .modal-close:hover {
    background: #e0e0e8;
    color: #1a1a2e;
  }
  .modal-body {
    padding: 2rem;
  }
  .modal-header {
    margin-bottom: 1.5rem;
  }
  .modal-header h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.375rem;
    color: #1a1a2e;
  }
  .modal-date {
    font-size: 0.875rem;
    color: #888;
  }
  .modal-details {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    margin-bottom: 2rem;
    padding: 1.25rem;
    background: #f7f8fc;
    border-radius: 12px;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
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
  .detail-currency {
    font-size: 0.75rem;
    font-weight: 500;
    color: #888;
    margin-left: 0.25rem;
  }
  .detail-value.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.8125rem;
    color: #666;
  }
  .detail-row.total {
    padding-top: 0.75rem;
    border-top: 1px solid #e0e0e8;
    margin-top: 0.25rem;
  }
  .modal-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.1s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
  }
  .btn-primary {
    background: #0066ff;
    color: white;
  }
  .btn-primary:hover {
    background: #0052cc;
  }
  .btn-primary:active {
    transform: scale(0.98);
  }
  .btn-secondary {
    background: #f0f0f5;
    color: #555;
  }
  .btn-secondary:hover {
    background: #e0e0e8;
  }
</style>
