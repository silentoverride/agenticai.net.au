<!--
  Clients List — searchable, sortable, paginated table of all clients.

  Story 11.6. Module: Epic 11 — Clients CRM (post-MVP track).
  Triggered by Sprint Change Proposal 2026-06-05-clients-crm-page.

  Style matches the existing staff portal pages: scoped CSS, table
  layout, hex colors used by sibling staff pages.
-->
<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  let { data }: { data: PageData } = $props();

  // Reactive view of the URL search params
  let search = $state(page.url.searchParams.get('search') ?? '');
  let status = $state(page.url.searchParams.get('status') ?? '');
  let pageNum = $state(Number(page.url.searchParams.get('page') ?? '1'));
  let sortBy = $state<'companyName' | 'status' | 'createdAt' | 'lastInteraction'>(
    (page.url.searchParams.get('sortBy') as 'companyName' | 'status' | 'createdAt' | 'lastInteraction' | null) ?? 'companyName'
  );
  let sortDir = $state<'asc' | 'desc'>(
    (page.url.searchParams.get('sortDir') as 'asc' | 'desc' | null) ?? 'asc'
  );

  // svelte-ignore state_referenced_locally
  const pageSize = data.clients.pageSize;
  // svelte-ignore state_referenced_locally
  const totalPages = $derived(Math.max(1, Math.ceil(data.clients.total / pageSize)));
  // svelte-ignore state_referenced_locally
  const hasPrev = $derived(data.clients.page > 1);
  // svelte-ignore state_referenced_locally
  const hasNext = $derived(data.clients.page < totalPages);

  function applyFilters() {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    if (pageNum > 1) params.set('page', String(pageNum));
    if (sortBy !== 'companyName') params.set('sortBy', sortBy);
    if (sortDir !== 'asc') params.set('sortDir', sortDir);
    const qs = params.toString();
    goto(`/staff/clients${qs ? `?${qs}` : ''}`, { keepFocus: true });
  }

  function handleSearchSubmit(event: Event) {
    event.preventDefault();
    pageNum = 1;
    applyFilters();
  }

  function handleSort(col: typeof sortBy) {
    if (sortBy === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = col;
      sortDir = 'asc';
    }
    applyFilters();
  }

  function gotoPage(p: number) {
    pageNum = Math.max(1, Math.min(totalPages, p));
    applyFilters();
  }

  function clearFilters() {
    search = '';
    status = '';
    pageNum = 1;
    goto('/staff/clients');
  }

  function statusLabel(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function statusBadge(s: string): string {
    switch (s) {
      case 'active': return 'badge-active';
      case 'inactive': return 'badge-inactive';
      case 'prospect': return 'badge-prospect';
      case 'archived': return 'badge-archived';
      default: return '';
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
</script>

<svelte:head>
  <title>Clients — Staff Portal</title>
</svelte:head>

<div class="staff-page">
  <header class="page-header">
    <div class="header-row">
      <div>
        <h1>Clients</h1>
        <p class="subtitle">
          {data.clients.total} {data.clients.total === 1 ? 'client' : 'clients'}
        </p>
      </div>
      <a href="/staff/clients/new" class="btn btn-primary">+ New Client</a>
    </div>
  </header>

  <section class="card">
    <form class="filter-bar" onsubmit={handleSearchSubmit}>
      <div class="form-group filter-search">
        <label for="search">Search</label>
        <input
          id="search"
          type="search"
          bind:value={search}
          placeholder="Company, contact, email, phone, tag, ID…"
          autocomplete="off"
        />
      </div>
      <div class="form-group filter-status">
        <label for="status">Status</label>
        <select id="status" bind:value={status}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="prospect">Prospect</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Search</button>
        {#if search || status}
          <button type="button" class="btn btn-small" onclick={clearFilters}>Clear</button>
        {/if}
      </div>
    </form>
  </section>

  <section class="card">
    {#if data.clients.items.length === 0}
      <div class="empty-state">
        <p class="empty-title">No clients yet</p>
        <p class="empty-desc">Add your first client to get started.</p>
        <a href="/staff/clients/new" class="btn btn-primary">+ New Client</a>
      </div>
    {:else}
      <table class="data-table">
        <thead>
          <tr>
            <th>
              <button class="sort-btn" onclick={() => handleSort('companyName')}>
                Company {sortBy === 'companyName' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            <th>Contact</th>
            <th>Email</th>
            <th>Phone</th>
            <th>
              <button class="sort-btn" onclick={() => handleSort('status')}>
                Status {sortBy === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            <th>Tags</th>
            <th>Open tasks</th>
            <th>Last interaction</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {#each data.clients.items as c (c.id)}
            <tr class="row-clickable" onclick={() => goto(`/staff/clients/${c.id}`)}>
              <td>
                <a href={`/staff/clients/${c.id}`} class="inline-link" onclick={(e) => e.stopPropagation()}>
                  {c.companyName}
                </a>
              </td>
              <td>{c.primaryContactName ?? '—'}</td>
              <td>{c.email ?? '—'}</td>
              <td>{c.phone ?? '—'}</td>
              <td>
                <span class="badge {statusBadge(c.status)}">{statusLabel(c.status)}</span>
              </td>
              <td>
                {#if c.tags.length === 0}
                  <span class="muted">—</span>
                {:else}
                  <div class="tag-list">
                    {#each c.tags.slice(0, 3) as tag (tag)}
                      <span class="tag">{tag}</span>
                    {/each}
                    {#if c.tags.length > 3}
                      <span class="tag-more">+{c.tags.length - 3}</span>
                    {/if}
                  </div>
                {/if}
              </td>
              <td>
                {#if c.openTaskCount > 0}
                  <span class="badge badge-attention">{c.openTaskCount}</span>
                {:else}
                  <span class="muted">0</span>
                {/if}
              </td>
              <td>{formatDate(c.lastInteractionAt)}</td>
              <td>
                <a href={`/staff/clients/${c.id}`} class="btn btn-small" onclick={(e) => e.stopPropagation()}>
                  Open
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if totalPages > 1}
        <nav class="pagination" aria-label="Pagination">
          <button
            class="btn btn-small"
            disabled={!hasPrev}
            onclick={() => gotoPage(pageNum - 1)}
          >
            ← Previous
          </button>
          <span class="page-indicator">
            Page {data.clients.page} of {totalPages}
          </span>
          <button
            class="btn btn-small"
            disabled={!hasNext}
            onclick={() => gotoPage(pageNum + 1)}
          >
            Next →
          </button>
        </nav>
      {/if}
    {/if}
  </section>
</div>

<style>
  .staff-page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .page-header h1 {
    font-size: 1.75rem;
    color: var(--dark-bg-2);
    margin: 0 0 0.25rem;
  }

  .subtitle {
    color: #666;
    font-size: 0.9375rem;
    margin: 0;
  }

  .card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  }

  .filter-bar {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  .filter-search {
    flex: 2 1 280px;
  }

  .filter-status {
    flex: 0 0 200px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #444;
    margin-bottom: 0.375rem;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-size: 0.9375rem;
    background: #fafafa;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #0066ff;
    background: white;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s, opacity 0.15s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #0066ff;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0052cc;
  }

  .btn-small {
    padding: 0.3125rem 0.625rem;
    font-size: 0.8125rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
  }

  .empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--dark-bg-2);
    margin: 0 0 0.5rem;
  }

  .empty-desc {
    color: #666;
    margin: 0 0 1.5rem;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th {
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid #eee;
  }

  .data-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f3f3;
    font-size: 0.9375rem;
    color: #333;
  }

  .data-table tr.row-clickable {
    cursor: pointer;
  }

  .data-table tr.row-clickable:hover {
    background: #fafbff;
  }

  .sort-btn {
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding: 0;
    text-transform: inherit;
    letter-spacing: inherit;
  }

  .sort-btn:hover {
    color: #0066ff;
  }

  .inline-link {
    color: #0066ff;
    font-weight: 600;
    text-decoration: none;
  }

  .inline-link:hover {
    text-decoration: underline;
  }

  .badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .badge-active {
    background: #dcfce7;
    color: #166534;
  }

  .badge-inactive {
    background: #f3f4f6;
    color: #6b7280;
  }

  .badge-prospect {
    background: #dbeafe;
    color: #1e40af;
  }

  .badge-archived {
    background: #fef3c7;
    color: #92400e;
  }

  .badge-attention {
    background: #fef3c7;
    color: #92400e;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    align-items: center;
  }

  .tag {
    display: inline-block;
    background: #eff6ff;
    color: #1e40af;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .tag-more {
    color: #888;
    font-size: 0.75rem;
  }

  .muted {
    color: #999;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;
  }

  .page-indicator {
    font-size: 0.875rem;
    color: #666;
  }
</style>
