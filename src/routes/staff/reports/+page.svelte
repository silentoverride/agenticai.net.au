<script lang="ts">
  import { fade } from 'svelte/transition';
  import { Button, Badge, Card, CardContent, Input } from '$lib/components/ui';
  import type { PageData } from './$types';
import { CircleX, Eye, Star } from '@lucide/svelte';
import Dialog from '$lib/components/ui/dialog/Dialog.svelte';

  let { data } = $props();

  type ReportRow = {
    report_id: string;
    session_id: string;
    title: string | null;
    customer_name: string | null;
    customer_email: string | null;
    company: string | null;
    pipeline_status: string | null;
    display_status: string;
    created_at: string;
    updated_at: string | null;
  };

  // Initial values from server data — these are mutable client state
  // that get overwritten on subsequent fetches.
  // svelte-ignore state_referenced_locally
  let items = $state<ReportRow[]>(data.items as ReportRow[]);
  // svelte-ignore state_referenced_locally
  let total = $state(data.total);
  // svelte-ignore state_referenced_locally
  let hasMore = $state(data.hasMore);
  // svelte-ignore state_referenced_locally
  let offset = $state(data.offset);
  // svelte-ignore state_referenced_locally
  let limit = $state(data.limit);

  // svelte-ignore state_referenced_locally
  let search = $state(data.search || '');
  // svelte-ignore state_referenced_locally
  let statusFilter = $state(data.status || '');
  // svelte-ignore state_referenced_locally
  let sortCol = $state<'title' | 'customer' | 'status' | 'updated' | 'created'>(data.sort);
  // svelte-ignore state_referenced_locally
  let sortOrder = $state<'asc' | 'desc'>(data.order);

  // svelte-ignore state_referenced_locally
  let dateFrom = $state(data.dateFrom || '');
  // svelte-ignore state_referenced_locally
  let dateTo = $state(data.dateTo || '');

  let loading = $state(false);
  let error = $state('');

  // Admin deletion state
  let selected = $state<Set<string>>(new Set());
  let showDeleteConfirm = $state(false);
  let isDeleting = $state(false);

  const isAdmin = (data as any).role === 'admin';

  async function deleteReports(ids: string[]) {
    if (!ids.length) return;
    isDeleting = true;
    try {
      const res = await fetch('/api/staff/reports/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_ids: ids })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Delete failed');
      }
      items = items.filter(r => !ids.includes(r.report_id));
      selected.clear();
      showDeleteConfirm = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete reports';
    } finally {
      isDeleting = false;
    }
  }

  function toggleSelect(id: string) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    selected = new Set(selected);
  }

  function openBulkDelete() {
    showDeleteConfirm = true;
  }

  function toggleSelectAll() {
    if (selected.size === items.length) {
      selected.clear();
    } else {
      items.forEach(r => selected.add(r.report_id));
    }
    selected = new Set(selected);
  }

  // User-facing display statuses (not raw pipeline statuses)
  const DISPLAY_STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'In Review', label: 'In Review' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
  ];

  function displayStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'secondary' {
    switch (status) {
      case 'Closed': return 'success';
      case 'In Review': return 'warning';
      case 'Resolved': return 'secondary';
      case 'In Progress': return 'default';
      case 'Pending': return 'default';
      default: return 'default';
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  /** Today's date as YYYY-MM-DD for <input type="date"> max */
  function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function displayTitle(row: ReportRow): string {
    return row.title || row.customer_name || row.company || row.session_id.slice(0, 12) + '...';
  }

  function submittedBy(row: ReportRow): string {
    if (row.customer_name && row.company) return `${row.customer_name} — ${row.company}`;
    if (row.customer_name) return row.customer_name;
    if (row.company) return row.company;
    return row.customer_email || '—';
  }

  type SortableColumn<T extends string> = {
    key: T;
    label: string;
    sortable: boolean;
  };

  const columns: SortableColumn<'title' | 'customer' | 'status' | 'updated' | 'created'>[] = [
    { key: 'title', label: 'Report', sortable: true },
    { key: 'customer', label: 'Submitted By', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created', label: 'Submitted', sortable: true },
    { key: 'updated', label: 'Last Updated', sortable: true }
  ];

  function primaryAction(row: ReportRow): { label: string; href: string; variant: 'primary' | 'secondary' | 'warning' } | null {
    const detailUrl = `/staff/assessments/${row.session_id}`;
    switch (row.display_status) {
      case 'In Review':
        return { label: 'Review', href: detailUrl, variant: 'warning' };
      case 'Closed':
        return { label: 'View', href: detailUrl, variant: 'secondary' };
      case 'Resolved':
        return { label: 'View', href: detailUrl, variant: 'secondary' };
      default:
        return { label: 'View', href: detailUrl, variant: 'secondary' };
    }
  }

  function toggleSort(col: 'title' | 'customer' | 'status' | 'updated' | 'created') {
    if (sortCol === col) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortOrder = 'asc';
    }
    offset = 0;
    loadReports();
  }

  function sortIndicator(col: 'title' | 'customer' | 'status' | 'updated' | 'created'): string {
    if (sortCol !== col) return '';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  }

  async function loadReports() {
    loading = true;
    error = '';
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('sort', sortCol);
    params.set('order', sortOrder);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    try {
      const res = await fetch(`/api/staff/reports?${params.toString()}`);
      const d: { success: boolean; items?: ReportRow[]; total?: number; hasMore?: boolean; error?: string } = await res.json();
      if (d.success) {
        items = d.items!;
        total = d.total!;
        hasMore = d.hasMore!;
      } else {
        error = d.error || 'Failed to load reports';
      }
    } catch {
      error = 'Reports request failed';
    } finally {
      loading = false;
    }
  }

  let searchTimeout: ReturnType<typeof setTimeout>;
  function onSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      offset = 0;
      loadReports();
    }, 300);
  }

  function onFilterChange() {
    offset = 0;
    loadReports();
  }

  function prevPage() {
    if (offset >= limit) {
      offset -= limit;
      loadReports();
    }
  }

  function nextPage() {
    if (hasMore) {
      offset += limit;
      loadReports();
    }
  }

  // Favorites management
  let favorites = $state<string[]>([]);
  $effect(() => {
    try {
      const stored = localStorage.getItem('staff-reports-favorites');
      if (stored) favorites = JSON.parse(stored);
    } catch { /* noop */ }
  });

  function toggleFavorite(reportId: string) {
    if (favorites.includes(reportId)) {
      favorites = favorites.filter(id => id !== reportId);
    } else {
      favorites = [...favorites, reportId];
    }
    localStorage.setItem('staff-reports-favorites', JSON.stringify(favorites));
  }

  function isFavorite(reportId: string): boolean {
    return favorites.includes(reportId);
  }

  // Show favorites first when no explicit sort is active
  let sortedItems = $derived.by(() => {
    if (sortCol !== 'updated' || search || statusFilter || dateFrom || dateTo) return items;
    const fav = items.filter(r => favorites.includes(r.report_id));
    const rest = items.filter(r => !favorites.includes(r.report_id));
    return [...fav, ...rest];
  });
</script>

<svelte:head>
  <title>Reports — Staff Portal</title>
</svelte:head>

<div class="reports-page">
  <header class="page-header">
    <div>
      <h1>Reports</h1>
      <p>{total} report{total !== 1 ? 's' : ''} — {search || statusFilter || dateFrom || dateTo ? 'filtered' : 'total'}</p>
    </div>
  </header>

  {#if error}
    <div class="error-banner" in:fade>{error}</div>
  {/if}

  <!-- Filters -->
  <div class="filters-bar">
    <div class="search-wrap">
      <Input
        type="search"
        placeholder="Search by report title, customer, email, or company..."
        value={search}
        oninput={onSearchInput}
      />
    </div>
    <div class="filter-group">
      <select
        bind:value={statusFilter}
        onchange={onFilterChange}
        class="select-filter"
      >
        {#each DISPLAY_STATUS_OPTIONS as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
      <input
        type="date"
        bind:value={dateFrom}
        onchange={onFilterChange}
        class="date-filter"
        max={todayStr()}
        title="From date"
      />
      <span class="date-sep">–</span>
      <input
        type="date"
        bind:value={dateTo}
        onchange={onFilterChange}
        class="date-filter"
        max={todayStr()}
        title="To date"
      />

      {#if isAdmin && selected.size > 0}
        <button 
          onclick={openBulkDelete}
          style="border: none; background: none; color: #dc2626; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; margin-left: 0.5rem;">
          <CircleX size={16} style="color: #dc2626" /> Delete Selected ({selected.size})
        </button>
      {/if}
      <Button onclick={loadReports} disabled={loading} variant="secondary">
        {loading ? 'Loading...' : 'Refresh'}
      </Button>
    </div>
  </div>

  <!-- Table -->
  <Card>
    <CardContent>
      {#if items.length === 0}
        <div class="empty-state">
          {search || statusFilter || dateFrom || dateTo
            ? 'No reports match your filters. Try adjusting your search, status, or date range.'
            : 'No reports available yet.'}
        </div>
      {:else}
        <div class="table-wrap">
          <table class="reports-table">
            <thead>
              <tr>
                <th class="col-fav"></th>
                {#if isAdmin}
                  <th class="w-8">
                    <input type="checkbox" checked={selected.size === items.length && items.length > 0} 
                           onchange={toggleSelectAll} />
                  </th>
                {/if}
                {#each columns as col}
                  <th
                    class="col-{col.key}"
                    class:sortable={col.sortable}
                    onclick={col.sortable ? () => toggleSort(col.key) : undefined}
                    role={col.sortable ? 'button' : undefined}
                    tabindex={col.sortable ? 0 : undefined}
                    onkeydown={col.sortable ? (e) => e.key === 'Enter' && toggleSort(col.key) : undefined}
                  >
                    {col.label}{sortIndicator(col.key)}
                  </th>
                {/each}
                <th class="col-actions">Actions</th>
                {#if isAdmin}
                  <th class="w-8"></th>
                {/if}
              </tr>
            </thead>
            <tbody>
              {#each sortedItems as row}
                <tr>
                  <td class="col-fav">
                    <button
                      class="fav-btn"
                      class:favorited={isFavorite(row.report_id)}
                      onclick={() => toggleFavorite(row.report_id)}
                      title={isFavorite(row.report_id) ? 'Unpin report' : 'Pin report for quick access'}
                    >
                      {#if isFavorite(row.report_id)}
                        <Star size={16} style="color: #fbbf24; fill: #fbbf24;" />
                      {:else}
                        <Star size={16} style="color: #d1d5db;" />
                      {/if}
                    </button>
                  </td>
                  {#if isAdmin}
                    <td>
                      <input type="checkbox" checked={selected.has(row.report_id)} 
                             onchange={() => toggleSelect(row.report_id)} />
                    </td>
                  {/if}
                  <td class="col-title">
                    <a href="/staff/assessments/{row.session_id}" class="report-link">
                      {displayTitle(row)}
                    </a>
                  </td>
                  <td class="col-customer">
                    {submittedBy(row)}
                  </td>
                  <td class="col-status">
                    <Badge variant={displayStatusVariant(row.display_status)}>
                      {row.display_status}
                    </Badge>
                  </td>
                  <td class="col-created mono">
                    {formatDate(row.created_at)}
                  </td>
                  <td class="col-updated mono">
                    {row.updated_at ? formatDate(row.updated_at) : '—'}
                  </td>
                  <td class="col-actions">
                    {#if primaryAction(row)}
                      <a
                        href={primaryAction(row)!.href}
                        class="p-1 text-accent hover:opacity-75"
                        title={primaryAction(row)!.label}
                      >
                        <Eye size={18} />
                      </a>
                    {/if}
                  </td>
                  {#if isAdmin}
                    <td class="text-right">
                      <button 
                        onclick={() => deleteReports([row.report_id])}
                        style="border: none; background: none; padding: 4px; cursor: pointer;"
                        title="Delete report">
                        <CircleX size={18} style="color: #dc2626" />
                      </button>
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <div class="pagination-info">
            Showing {offset + 1}–{Math.min(offset + items.length, total)} of {total}
          </div>
          <div class="pagination-actions">
            <Button
              variant="secondary"
              size="sm"
              disabled={offset === 0}
              onclick={prevPage}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasMore}
              onclick={nextPage}
            >
              Next
            </Button>
          </div>
        </div>
      {/if}
    </CardContent>
  </Card>
</div>

<!-- Delete Confirmation Modal -->
<Dialog bind:open={showDeleteConfirm}>
  <div class="card-header">
    <h3 class="text-lg font-semibold">Confirm Deletion</h3>
  </div>
  <div class="card-content">
    <p class="text-gray-600">Delete {selected.size} report(s)? This action cannot be undone.</p>
  </div>
  <div class="card-footer flex gap-3 justify-end">
    <Button variant="outline" size="sm" onclick={() => showDeleteConfirm = false}>Cancel</Button>
    <Button variant="danger" size="sm" onclick={() => deleteReports([...selected])} disabled={isDeleting}>
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  </div>
</Dialog>

<style>
  .reports-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
    margin: 0;
    color: var(--color-ink);
  }

  .page-header p {
    color: var(--color-ink-muted);
    margin: 0.25rem 0 0;
  }

  .error-banner {
    padding: 0.75rem 1rem;
    background: var(--color-danger-bg);
    border: 1px solid var(--color-danger);
    border-radius: var(--radius);
    color: var(--color-danger);
    margin-bottom: 1rem;
  }

  .filters-bar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .search-wrap {
    flex: 1;
    min-width: 250px;
  }

  .filter-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .select-filter,
  .date-filter {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    font-size: 0.8125rem;
    background: var(--color-page);
    color: var(--color-ink);
    cursor: pointer;
  }

  .select-filter:focus,
  .date-filter:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: -1px;
  }

  .date-filter {
    width: 145px;
    font-family: monospace;
    font-size: 0.8125rem;
  }

  .date-sep {
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-ink-muted);
    font-style: italic;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .reports-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
  }

  .reports-table th {
    text-align: left;
    padding: 0.625rem 0.75rem;
    border-bottom: 2px solid var(--color-line);
    color: var(--color-ink-muted);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.6875rem;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  .reports-table th.sortable {
    cursor: pointer;
    user-select: none;
  }

  .reports-table th.sortable:hover {
    color: var(--color-ink);
  }

  .reports-table td {
    padding: 0.75rem 0.75rem;
    border-bottom: 1px solid var(--color-line);
    color: var(--color-ink);
    vertical-align: middle;
  }

  .reports-table tbody tr:hover {
    background: var(--color-page-muted);
  }

  .col-fav {
    width: 2.5rem;
    text-align: center;
    padding-left: 0.5rem;
    padding-right: 0.25rem;
  }

  .col-title {
    min-width: 180px;
  }

  .col-customer {
    min-width: 160px;
  }

  .col-status {
    width: 110px;
  }

  .col-created {
    width: 105px;
  }

  .col-updated {
    width: 110px;
  }

  .col-actions {
    width: 80px;
    text-align: center;
  }

  .fav-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.125rem;
    padding: 0.125rem 0.25rem;
    color: var(--color-ink-muted);
    transition: color 0.15s;
    line-height: 1;
  }

  .fav-btn:hover,
  .fav-btn.favorited {
    color: #eab308;
  }

  .action-btn {
    display: inline-block;
    padding: 0.3rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: var(--radius);
    text-decoration: none;
    white-space: nowrap;
    transition: opacity 0.15s;
  }

  .action-btn:hover {
    opacity: 0.85;
  }

  .action-btn.primary {
    background: var(--color-accent);
    color: #fff;
  }

  .action-btn.secondary {
    background: var(--color-page-muted);
    color: var(--color-ink);
    border: 1px solid var(--color-line);
  }

  .action-btn.warning {
    background: var(--color-warning);
    color: #fff;
  }

  .report-link {
    color: var(--color-accent-text);
    text-decoration: none;
    font-weight: 500;
  }

  .report-link:hover {
    text-decoration: underline;
  }

  .mono {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--color-ink-muted);
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--color-line);
  }

  .pagination-info {
    font-size: 0.8125rem;
    color: var(--color-ink-muted);
  }

  .pagination-actions {
    display: flex;
    gap: 0.5rem;
  }

  @media (max-width: 640px) {
    .filters-bar {
      flex-direction: column;
    }

    .filter-group {
      flex-wrap: wrap;
    }

    .col-created,
    .col-updated {
      display: none;
    }

    .col-actions {
      display: none;
    }
  }
</style>
