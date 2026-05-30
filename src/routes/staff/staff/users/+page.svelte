<script lang="ts">
  /**
   * User Management — Admin page for viewing, creating, editing,
   * deactivating, and deleting user accounts.
   */

  import { page } from '$app/stores';

  // ── Types ─────────────────────────────────────────────────────────────────

  interface ManagedUser {
    clerkId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    status: 'active' | 'inactive';
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface UserListResult {
    users: ManagedUser[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }

  interface ValidationError {
    field: string;
    message: string;
  }

  // ── State ─────────────────────────────────────────────────────────────────

  let users = $state<ManagedUser[]>([]);
  let total = $state(0);
  let currentPage = $state(1);
  let totalPages = $state(1);
  let pageSize = $state(20);
  let loading = $state(true);
  let error = $state('');

  // Search/filter
  let searchTerm = $state('');
  let roleFilter = $state('');
  let statusFilter = $state('');

  // Selection
  let selectedIds = $state<Set<string>>(new Set());
  let allSelected = $derived(users.length > 0 && users.every(u => selectedIds.has(u.clerkId)));

  // Modal state
  type ModalMode = 'closed' | 'create' | 'edit' | 'delete';
  let modalMode = $state<ModalMode>('closed');
  let editingUser = $state<ManagedUser | null>(null);

  // Form state
  let formFirstName = $state('');
  let formLastName = $state('');
  let formEmail = $state('');
  let formPassword = $state('');
  let formConfirmPassword = $state('');
  let formRole = $state('client');
  let formSendWelcome = $state(true);
  let formErrors = $state<ValidationError[]>([]);
  let formSubmitting = $state(false);
  let formGeneralError = $state('');

  // Toast
  type ToastType = 'success' | 'error';
  interface Toast { id: number; type: ToastType; message: string; }
  let toasts = $state<Toast[]>([]);
  let toastCounter = 0;

  function showToast(type: ToastType, message: string) {
    const id = ++toastCounter;
    toasts = [...toasts, { id, type, message }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 4000);
  }

  // Sort
  let sortField = $state<'name' | 'email' | 'role' | 'createdAt'>('createdAt');
  let sortDir = $state<'asc' | 'desc'>('desc');

  const ROLE_OPTIONS = [
    { value: 'client', label: 'Client' },
    { value: 'staff', label: 'Staff' },
    { value: 'admin', label: 'Admin' },
  ];

  const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const ROLE_FILTER_OPTIONS = [
    { value: '', label: 'All Roles' },
    ...ROLE_OPTIONS,
  ];

  const ROLE_BADGE: Record<string, string> = {
    admin: 'badge-role-admin',
    staff: 'badge-role-staff',
    client: 'badge-role-client',
    inactive: 'badge-role-inactive',
  };

  // ── Data fetching ─────────────────────────────────────────────────────────

  async function fetchUsers() {
    loading = true;
    error = '';

    const params = new URLSearchParams();
    params.set('page', String(currentPage));
    params.set('pageSize', String(pageSize));
    if (searchTerm) params.set('search', searchTerm);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/staff/users?${params}`);
      if (!res.ok) {
        if (res.status === 403) { error = 'You do not have permission to manage users.'; return; }
        throw new Error(`Server error (${res.status})`);
      }
      const data = (await res.json()) as UserListResult;
      users = data.users;
      total = data.total;
      currentPage = data.page;
      totalPages = data.totalPages;
      selectedIds = new Set();
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to load users';
    } finally {
      loading = false;
    }
  }

  // Initial load
  $effect(() => { fetchUsers(); });

  // Debounced search
  let searchTimeout: ReturnType<typeof setTimeout>;
  function onSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      fetchUsers();
    }, 300);
  }

  function onFilterChange() {
    currentPage = 1;
    fetchUsers();
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    currentPage = p;
    fetchUsers();
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  function toggleSelectAll() {
    if (allSelected) {
      selectedIds = new Set();
    } else {
      selectedIds = new Set(users.map(u => u.clerkId));
    }
  }

  function toggleSelect(clerkId: string) {
    const next = new Set(selectedIds);
    if (next.has(clerkId)) next.delete(clerkId);
    else next.add(clerkId);
    selectedIds = next;
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────

  function openCreate() {
    resetForm();
    modalMode = 'create';
  }

  function openEdit(user: ManagedUser) {
    editingUser = user;
    formFirstName = user.firstName || '';
    formLastName = user.lastName || '';
    formEmail = user.email;
    formPassword = '';
    formConfirmPassword = '';
    formRole = user.role === 'inactive' ? 'inactive' : user.role;
    formSendWelcome = false;
    formErrors = [];
    formGeneralError = '';
    modalMode = 'edit';
  }

  function openDelete(user: ManagedUser) {
    editingUser = user;
    modalMode = 'delete';
  }

  function closeModal() {
    modalMode = 'closed';
    editingUser = null;
    formErrors = [];
    formGeneralError = '';
  }

  function resetForm() {
    formFirstName = '';
    formLastName = '';
    formEmail = '';
    formPassword = '';
    formConfirmPassword = '';
    formRole = 'client';
    formSendWelcome = true;
    formErrors = [];
    formGeneralError = '';
    formSubmitting = false;
  }

  // ── CRUD actions ──────────────────────────────────────────────────────────

  async function handleCreate(e: Event) {
    e.preventDefault();
    formErrors = [];
    formGeneralError = '';
    formSubmitting = true;

    try {
      const res = await fetch('/api/staff/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          firstName: formFirstName,
          lastName: formLastName,
          role: formRole,
          sendWelcomeEmail: formSendWelcome,
        }),
      });

      const data: { success?: boolean; error?: string; errors?: { field: string; message: string }[] } = await res.json();

      if (!data.success) {
        if (data.errors) {
          formErrors = data.errors as ValidationError[];
          if (formErrors.some(e => e.field === 'general')) {
            formGeneralError = formErrors.find(e => e.field === 'general')?.message || '';
          }
          formErrors = formErrors.filter(e => e.field !== 'general');
        } else {
          formGeneralError = 'Failed to create user.';
        }
        return;
      }

      closeModal();
      showToast('success', `User ${formEmail} created successfully.`);
      await fetchUsers();
    } catch (err: unknown) {
      formGeneralError = err instanceof Error ? err.message : 'Network error';
    } finally {
      formSubmitting = false;
    }
  }

  async function handleUpdate(e: Event) {
    e.preventDefault();
    if (!editingUser) return;
    formErrors = [];
    formGeneralError = '';
    formSubmitting = true;

    try {
      const res = await fetch(`/api/staff/users/${editingUser.clerkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail || null,
          role: formRole,
        }),
      });

      const data: { success?: boolean; error?: string; errors?: { field: string; message: string }[] } = await res.json();

      if (!data.success) {
        if (data.errors) {
          formErrors = data.errors as ValidationError[];
          if (formErrors.some(e => e.field === 'general')) {
            formGeneralError = formErrors.find(e => e.field === 'general')?.message || '';
          }
          formErrors = formErrors.filter(e => e.field !== 'general');
        } else {
          formGeneralError = 'Failed to update user.';
        }
        return;
      }

      closeModal();
      showToast('success', `User ${formEmail} updated successfully.`);
      await fetchUsers();
    } catch (err: unknown) {
      formGeneralError = err instanceof Error ? err.message : 'Network error';
    } finally {
      formSubmitting = false;
    }
  }

  async function handleDelete() {
    if (!editingUser) return;
    formSubmitting = true;

    try {
      const res = await fetch(`/api/staff/users/${editingUser.clerkId}`, { method: 'DELETE' });
      const data: { success?: boolean; error?: string; errors?: { field: string; message: string }[] } = await res.json();

      if (!data.success) {
        formGeneralError = data.error || 'Failed to delete user.';
        return;
      }

      closeModal();
      showToast('success', `User ${editingUser.email} deleted.`);
      await fetchUsers();
    } catch (err: unknown) {
      formGeneralError = err instanceof Error ? err.message : 'Network error';
    } finally {
      formSubmitting = false;
    }
  }

  async function handleBulkAction(action: 'deactivate' | 'delete') {
    if (selectedIds.size === 0) {
      showToast('error', 'No users selected.');
      return;
    }

    const verb = action === 'deactivate' ? 'deactivate' : 'delete';
    if (!confirm(`Are you sure you want to ${verb} ${selectedIds.size} user(s)?`)) return;

    try {
      const res = await fetch('/api/staff/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userIds: [...selectedIds] }),
      });
      const result: { status?: string; results?: { success: boolean }[] } = await res.json();

      const succeeded = result.results?.filter((r: { success: boolean }) => r.success).length ?? 0;
      const failed = result.results?.filter((r: { success: boolean }) => !r.success).length ?? 0;

      if (failed > 0) {
        showToast('error', `${succeeded} ${verb}d, ${failed} failed.`);
      } else {
        showToast('success', `${succeeded} user(s) ${verb}d successfully.`);
      }
      await fetchUsers();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Bulk action failed');
    }
  }

  function getPageLabel(field: string): string {
    if (field === 'name') return 'Name';
    if (field === 'email') return 'Email';
    if (field === 'role') return 'Role';
    return 'Created';
  }

  function toggleSort(field: 'name' | 'email' | 'role' | 'createdAt') {
    if (sortField === field) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDir = 'asc';
    }
  }

  let sortedUsers = $derived([...users].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'name') return dir * (a.firstName || '').localeCompare(b.firstName || '');
    if (sortField === 'email') return dir * a.email.localeCompare(b.email);
    if (sortField === 'role') return dir * a.role.localeCompare(b.role);
    return dir * a.createdAt.localeCompare(b.createdAt);
  }));

  function formatDate(d: string): string {
    try { const dt = new Date(d); if (isNaN(dt.getTime())) return '—'; return dt.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return '—'; }
  }

  // Keyboard: close modal on Escape
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && modalMode !== 'closed') closeModal();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<!-- ═══════════════════════════════════════════════════════════════════════════
     Toast Notifications
     ════════════════════════════════════════════════════════════════════════ -->

<div class="toast-container" aria-live="polite" aria-label="Notifications">
  {#each toasts as toast (toast.id)}
    <div
      class="toast toast-{toast.type}"
      role="alert"
      aria-label={toast.type === 'success' ? 'Success' : 'Error'}
    >
      <span class="toast-icon" aria-hidden="true">
        {toast.type === 'success' ? '✓' : '✕'}
      </span>
      <span class="toast-msg">{toast.message}</span>
      <button class="toast-close" onclick={() => toasts = toasts.filter(t => t.id !== toast.id)} aria-label="Dismiss">×</button>
    </div>
  {/each}
</div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     Page Header
     ════════════════════════════════════════════════════════════════════════ -->

<div class="page-header">
  <div>
    <h1>Users</h1>
    <p class="subtitle">{total} total user{total !== 1 ? 's' : ''}</p>
  </div>
  <button class="btn btn-primary" onclick={openCreate}>
    <span aria-hidden="true">＋</span> Create New User
  </button>
</div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     Search & Filters
     ════════════════════════════════════════════════════════════════════════ -->

<div class="toolbar" role="search" aria-label="Search and filter users">
  <div class="search-wrap">
    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
    <input
      type="search"
      class="search-input"
      placeholder="Search by name or email…"
      bind:value={searchTerm}
      oninput={onSearchInput}
      aria-label="Search users by name or email"
    />
  </div>
  <select
    class="filter-select"
    bind:value={roleFilter}
    onchange={onFilterChange}
    aria-label="Filter by role"
  >
    {#each ROLE_FILTER_OPTIONS as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
  <select
    class="filter-select"
    bind:value={statusFilter}
    onchange={onFilterChange}
    aria-label="Filter by status"
  >
    {#each STATUS_OPTIONS as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
</div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     Bulk Actions
     ════════════════════════════════════════════════════════════════════════ -->

{#if selectedIds.size > 0}
  <div class="bulk-bar" role="toolbar" aria-label="Bulk actions">
    <span class="bulk-count">{selectedIds.size} selected</span>
    <button class="btn btn-outline btn-sm" onclick={() => handleBulkAction('deactivate')}>
      Deactivate Selected
    </button>
    <button class="btn btn-danger btn-sm" onclick={() => handleBulkAction('delete')}>
      Delete Selected
    </button>
    <button class="btn btn-ghost btn-sm" onclick={() => { selectedIds = new Set(); }}>
      Clear Selection
    </button>
  </div>
{/if}

<!-- ═══════════════════════════════════════════════════════════════════════════
     Users Table
     ════════════════════════════════════════════════════════════════════════ -->

{#if loading}
  <div class="table-card">
    <div class="loading-state" role="status" aria-label="Loading users">
      <div class="spinner" aria-hidden="true"></div>
      <p>Loading users…</p>
    </div>
  </div>
{:else if error}
  <div class="table-card">
    <div class="error-state" role="alert">
      <p>{error}</p>
      <button class="btn btn-outline" onclick={() => fetchUsers()}>Retry</button>
    </div>
  </div>
{:else if users.length === 0}
  <div class="table-card">
    <div class="empty-state">
      <p>No users found{searchTerm ? ` matching "${searchTerm}"` : ''}.</p>
      {#if searchTerm || roleFilter || statusFilter}
        <button class="btn btn-outline" onclick={() => { searchTerm = ''; roleFilter = ''; statusFilter = ''; fetchUsers(); }}>
          Clear Filters
        </button>
      {:else}
        <button class="btn btn-primary" onclick={openCreate}>Create First User</button>
      {/if}
    </div>
  </div>
{:else}
  <div class="table-card">
    <div class="table-wrap">
      <table class="data-table" role="grid" aria-label="User accounts">
        <thead>
          <tr>
            <th class="col-check" scope="col">
              <input
                type="checkbox"
                checked={allSelected}
                onchange={toggleSelectAll}
                aria-label={allSelected ? 'Deselect all users' : 'Select all users'}
              />
            </th>
            <th scope="col">
              <button class="sort-btn" onclick={() => toggleSort('name')} aria-label="Sort by name">
                Name {sortField === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            <th scope="col">
              <button class="sort-btn" onclick={() => toggleSort('email')} aria-label="Sort by email">
                Email {sortField === 'email' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            <th scope="col">
              <button class="sort-btn" onclick={() => toggleSort('role')} aria-label="Sort by role">
                Role {sortField === 'role' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            <th scope="col">Status</th>
            <th scope="col">
              <button class="sort-btn" onclick={() => toggleSort('createdAt')} aria-label="Sort by creation date">
                Created {sortField === 'createdAt' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            <th scope="col" class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each sortedUsers as user (user.clerkId)}
            <tr
              class="user-row"
              class:selected={selectedIds.has(user.clerkId)}
              tabindex="0"
              aria-selected={selectedIds.has(user.clerkId)}
              onkeydown={(e) => { if (e.key === 'Enter') openEdit(user); }}
            >
              <td class="col-check">
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.clerkId)}
                  onchange={() => toggleSelect(user.clerkId)}
                  aria-label={`Select ${user.email}`}
                />
              </td>
              <td>
                <button class="cell-link" onclick={() => openEdit(user)}>
                  {user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : '—'}
                </button>
              </td>
              <td><span class="cell-text">{user.email}</span></td>
              <td>
                <span class="badge {ROLE_BADGE[user.role] || 'badge-role-client'}">
                  {user.role}
                </span>
              </td>
              <td>
                <span
                  class="status-dot"
                  class:active={user.status === 'active'}
                  class:inactive={user.status === 'inactive'}
                  aria-label={user.status === 'active' ? 'Active' : 'Inactive'}
                ></span>
                {user.status}
              </td>
              <td><span class="cell-text cell-muted">{formatDate(user.createdAt)}</span></td>
              <td class="col-actions">
                <div class="action-btns">
                  <button
                    class="btn-icon"
                    onclick={() => openEdit(user)}
                    aria-label={`Edit ${user.email}`}
                    title="Edit"
                  >✎</button>
                  <button
                    class="btn-icon btn-icon-danger"
                    onclick={() => openDelete(user)}
                    aria-label={`Delete ${user.email}`}
                    title="Delete"
                  >🗑</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" role="navigation" aria-label="Pagination">
      <button
        class="btn btn-outline btn-sm"
        disabled={currentPage <= 1}
        onclick={() => goToPage(1)}
        aria-label="First page"
      >««</button>
      <button
        class="btn btn-outline btn-sm"
        disabled={currentPage <= 1}
        onclick={() => goToPage(currentPage - 1)}
        aria-label="Previous page"
      >«</button>
      <span class="page-info" aria-current="page">
        Page {currentPage} of {totalPages}
      </span>
      <button
        class="btn btn-outline btn-sm"
        disabled={currentPage >= totalPages}
        onclick={() => goToPage(currentPage + 1)}
        aria-label="Next page"
      >»</button>
      <button
        class="btn btn-outline btn-sm"
        disabled={currentPage >= totalPages}
        onclick={() => goToPage(totalPages)}
        aria-label="Last page"
      >»»</button>
    </div>
  </div>
{/if}

<!-- ═══════════════════════════════════════════════════════════════════════════
     Modal: Create / Edit User
     ════════════════════════════════════════════════════════════════════════ -->

{#if modalMode === 'create' || modalMode === 'edit'}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div
    class="modal-backdrop"
    onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    onkeydown={(e) => e.key === 'Escape' && closeModal()}
    role="dialog"
    aria-modal="true"
    aria-label={modalMode === 'create' ? 'Create new user' : 'Edit user'}
    tabindex="-1"
  >
    <div class="modal-panel" role="document">
      <div class="modal-header">
        <h2>{modalMode === 'create' ? 'Create New User' : 'Edit User'}</h2>
        <button class="modal-close" onclick={closeModal} aria-label="Close dialog">×</button>
      </div>

      <form
        onsubmit={modalMode === 'create' ? handleCreate : handleUpdate}
        class="modal-body"
        novalidate
      >
        <!-- Name row -->
        <div class="form-row">
          <div class="form-group">
            <label for="user-firstname">First name</label>
            <input
              id="user-firstname"
              type="text"
              bind:value={formFirstName}
              placeholder="First name"
              aria-invalid={formErrors.some(e => e.field === 'firstName')}
            />
          </div>
          <div class="form-group">
            <label for="user-lastname">Last name</label>
            <input
              id="user-lastname"
              type="text"
              bind:value={formLastName}
              placeholder="Last name"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="user-email">Email address <span class="required">*</span></label>
          <input
            id="user-email"
            type="email"
            bind:value={formEmail}
            required
            placeholder="user@example.com"
            class:input-error={formErrors.some(e => e.field === 'email')}
            aria-invalid={formErrors.some(e => e.field === 'email')}
            aria-describedby={formErrors.some(e => e.field === 'email') ? 'err-email' : undefined}
          />
          {#each formErrors.filter(e => e.field === 'email') as err}
            <p id="err-email" class="field-error" role="alert">{err.message}</p>
          {/each}
        </div>

        <!-- Password (create only) -->
        {#if modalMode === 'create'}
          <div class="form-row">
            <div class="form-group">
              <label for="user-password">Password <span class="required">*</span></label>
              <input
                id="user-password"
                type="password"
                bind:value={formPassword}
                required
                minlength="8"
                placeholder="Min. 8 chars, upper, lower, number"
                class:input-error={formErrors.some(e => e.field === 'password')}
                aria-invalid={formErrors.some(e => e.field === 'password')}
                aria-describedby={formErrors.some(e => e.field === 'password') ? 'err-password' : undefined}
              />
              {#each formErrors.filter(e => e.field === 'password') as err}
                <p id="err-password" class="field-error" role="alert">{err.message}</p>
              {/each}
            </div>
            <div class="form-group">
              <label for="user-confirm">Confirm password <span class="required">*</span></label>
              <input
                id="user-confirm"
                type="password"
                bind:value={formConfirmPassword}
                required
                placeholder="Re-enter password"
                class:input-error={formErrors.some(e => e.field === 'confirmPassword')}
              />
            </div>
          </div>
        {/if}

        <!-- Role -->
        <div class="form-row">
          <div class="form-group">
            <label for="user-role">Role</label>
            <select id="user-role" bind:value={formRole} aria-label="User role">
              {#if modalMode === 'edit'}
                <option value="inactive">Inactive</option>
              {/if}
              {#each ROLE_OPTIONS as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Welcome email (create only) -->
        {#if modalMode === 'create'}
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={formSendWelcome} />
            <span>Send welcome email with setup instructions</span>
          </label>
        {/if}

        <!-- General error -->
        {#if formGeneralError}
          <div class="alert alert-error" role="alert">{formGeneralError}</div>
        {/if}

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick={closeModal} disabled={formSubmitting}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={formSubmitting}>
            {#if formSubmitting}
              Saving…
            {:else}
              {modalMode === 'create' ? 'Create User' : 'Save Changes'}
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- ═══════════════════════════════════════════════════════════════════════════
     Modal: Delete Confirmation
     ════════════════════════════════════════════════════════════════════════ -->

{#if modalMode === 'delete' && editingUser}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div
    class="modal-backdrop"
    onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    onkeydown={(e) => e.key === 'Escape' && closeModal()}
    role="alertdialog"
    aria-modal="true"
    aria-label="Confirm deletion"
    tabindex="-1"
  >
    <div class="modal-panel modal-sm" role="document">
      <div class="modal-header">
        <h2>Delete User</h2>
        <button class="modal-close" onclick={closeModal} aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <div class="delete-warning">
          <p>Are you sure you want to permanently delete this user?</p>
          <div class="delete-target">
            <strong>{editingUser.firstName || editingUser.lastName
              ? `${editingUser.firstName || ''} ${editingUser.lastName || ''}`.trim()
              : editingUser.email}</strong>
            <span class="cell-muted">{editingUser.email}</span>
            <span class="badge {ROLE_BADGE[editingUser.role] || ''}">{editingUser.role}</span>
          </div>
          <p class="warning-text">⚠ This action cannot be undone. All associated data will be permanently removed.</p>
        </div>

        {#if formGeneralError}
          <div class="alert alert-error" role="alert">{formGeneralError}</div>
        {/if}

        <div class="modal-footer">
          <button class="btn btn-outline" onclick={closeModal} disabled={formSubmitting}>Cancel</button>
          <button class="btn btn-danger" onclick={handleDelete} disabled={formSubmitting}>
            {formSubmitting ? 'Deleting…' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- ═══════════════════════════════════════════════════════════════════════════
     Styles
     ════════════════════════════════════════════════════════════════════════ -->

<style>
  /* ── Layout ──────────────────────────────────────────────── */
  .user-page { max-width: 1200px; margin: 0 auto; padding: 2rem; }

  .page-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
  }
  .page-header h1 { font-size: 1.75rem; color: #1a1a2e; margin: 0; }
  .subtitle { color: #666; font-size: 0.875rem; margin: 0.25rem 0 0; }

  /* ── Toolbar ─────────────────────────────────────────────── */
  .toolbar {
    display: flex; gap: 0.75rem; margin-bottom: 1rem;
    flex-wrap: wrap; align-items: center;
  }
  .search-wrap {
    position: relative; flex: 1; min-width: 220px; max-width: 360px;
  }
  .search-icon {
    position: absolute; left: 0.625rem; top: 50%; transform: translateY(-50%);
    color: #999; pointer-events: none;
  }
  .search-input {
    width: 100%; padding: 0.5rem 0.75rem 0.5rem 2rem;
    border: 1px solid #d0d0d0; border-radius: 6px; font-size: 0.875rem;
    background: #fafafa; box-sizing: border-box;
  }
  .search-input:focus { outline: none; border-color: #0066ff; background: white; }
  .filter-select {
    padding: 0.5rem 0.75rem; border: 1px solid #d0d0d0;
    border-radius: 6px; font-size: 0.875rem; background: #fafafa;
    min-width: 130px;
  }

  /* ── Bulk bar ────────────────────────────────────────────── */
  .bulk-bar {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.625rem 1rem; margin-bottom: 0.75rem;
    background: #eef2ff; border: 1px solid #c7d2fe;
    border-radius: 8px; flex-wrap: wrap;
  }
  .bulk-count { font-size: 0.8125rem; font-weight: 600; color: #3730a3; margin-right: 0.5rem; }

  /* ── Table card ──────────────────────────────────────────── */
  .table-card {
    background: white; border-radius: 12px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.06); overflow: hidden;
  }
  .table-wrap { overflow-x: auto; }
  .data-table { width: 100%; border-collapse: collapse; min-width: 700px; }
  .data-table th {
    text-align: left; font-size: 0.6875rem; font-weight: 600; color: #888;
    text-transform: uppercase; letter-spacing: 0.05em;
    padding: 0.625rem 0.75rem; border-bottom: 2px solid #eee;
    white-space: nowrap;
  }
  .data-table td {
    padding: 0.625rem 0.75rem; font-size: 0.875rem; color: #333;
    border-bottom: 1px solid #f0f0f0; vertical-align: middle;
  }
  .data-table tr:last-child td { border-bottom: none; }

  .user-row { transition: background 0.12s; cursor: default; }
  .user-row:hover { background: #f8f9fc; }
  .user-row.selected { background: #eef2ff; }
  .user-row:focus-visible { outline: 2px solid #0066ff; outline-offset: -2px; }

  .col-check { width: 40px; text-align: center; }
  .col-actions { width: 90px; }

  .sort-btn {
    background: none; border: none; font: inherit; font-size: 0.6875rem;
    font-weight: 600; color: #888; text-transform: uppercase;
    letter-spacing: 0.05em; cursor: pointer; padding: 0;
  }
  .sort-btn:hover { color: #333; }

  .cell-link {
    background: none; border: none; color: #0066ff; font: inherit;
    font-size: 0.875rem; cursor: pointer; padding: 0; text-align: left;
    text-decoration: none;
  }
  .cell-link:hover { text-decoration: underline; }
  .cell-text { color: #333; }
  .cell-muted { color: #888; font-size: 0.8125rem; }

  .action-btns { display: flex; gap: 0.25rem; }
  .btn-icon {
    background: none; border: 1px solid transparent; border-radius: 4px;
    cursor: pointer; font-size: 0.875rem; padding: 0.25rem 0.375rem;
    color: #666; transition: background 0.12s, color 0.12s;
    line-height: 1;
  }
  .btn-icon:hover { background: #f0f0f0; color: #333; }
  .btn-icon-danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

  .status-dot {
    display: inline-block; width: 8px; height: 8px; border-radius: 50%;
    margin-right: 0.375rem; vertical-align: middle;
  }
  .status-dot.active { background: #22c55e; }
  .status-dot.inactive { background: #9ca3af; }

  /* ── Pagination ──────────────────────────────────────────── */
  .pagination {
    display: flex; justify-content: center; align-items: center;
    gap: 0.375rem; padding: 1rem; border-top: 1px solid #f0f0f0;
  }
  .page-info { font-size: 0.8125rem; color: #666; padding: 0 0.75rem; }

  /* ── States ──────────────────────────────────────────────── */
  .loading-state, .error-state, .empty-state {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 3rem 2rem; text-align: center; gap: 0.75rem;
    color: #666;
  }
  .spinner {
    width: 32px; height: 32px; border: 3px solid #e0e0e0;
    border-top-color: #0066ff; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Badges ──────────────────────────────────────────────── */
  .badge {
    display: inline-block; padding: 0.1875rem 0.5rem; border-radius: 4px;
    font-size: 0.6875rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .badge-role-admin { background: #f3e8ff; color: #7c3aed; }
  .badge-role-staff { background: #dbeafe; color: #2563eb; }
  .badge-role-client { background: #f3f4f6; color: #6b7280; }
  .badge-role-inactive { background: #fef2f2; color: #dc2626; }

  /* ── Buttons ─────────────────────────────────────────────── */
  .btn {
    display: inline-flex; align-items: center; gap: 0.375rem;
    padding: 0.5rem 1rem; border: none; border-radius: 6px;
    font-size: 0.875rem; font-weight: 500; cursor: pointer;
    transition: background 0.15s, opacity 0.15s; white-space: nowrap;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: #0066ff; color: white; }
  .btn-primary:hover:not(:disabled) { background: #0052cc; }
  .btn-danger { background: #dc3545; color: white; }
  .btn-danger:hover:not(:disabled) { background: #b02a37; }
  .btn-outline {
    background: white; color: #333; border: 1px solid #d0d0d0;
  }
  .btn-outline:hover:not(:disabled) { background: #f5f5f5; }
  .btn-ghost { background: transparent; color: #666; }
  .btn-ghost:hover:not(:disabled) { background: #f0f0f0; }
  .btn-sm { padding: 0.3125rem 0.625rem; font-size: 0.8125rem; }

  /* ── Modal ───────────────────────────────────────────────── */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 1rem;
  }
  .modal-panel {
    background: white; border-radius: 12px; width: 100%; max-width: 560px;
    max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  .modal-sm { max-width: 420px; }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1.25rem 1.5rem 0;
  }
  .modal-header h2 { font-size: 1.125rem; color: #1a1a2e; margin: 0; }
  .modal-close {
    background: none; border: none; font-size: 1.5rem; color: #999;
    cursor: pointer; padding: 0; line-height: 1;
  }
  .modal-close:hover { color: #333; }
  .modal-body { padding: 1rem 1.5rem 1.5rem; display: grid; gap: 0.875rem; }
  .modal-footer {
    display: flex; justify-content: flex-end; gap: 0.5rem;
    padding-top: 0.5rem;
  }

  /* ── Forms ───────────────────────────────────────────────── */
  .form-row { display: flex; gap: 0.75rem; }
  .form-row > .form-group { flex: 1; min-width: 0; }
  .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
  .form-group label { font-size: 0.8125rem; font-weight: 600; color: #444; }
  .required { color: #dc2626; }
  .form-group input, .form-group select {
    width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d0d0d0;
    border-radius: 6px; font-size: 0.9375rem; background: #fafafa;
    box-sizing: border-box;
  }
  .form-group input:focus, .form-group select:focus {
    outline: none; border-color: #0066ff; background: white;
  }
  .input-error { border-color: #dc2626 !important; }
  .field-error { color: #dc2626; font-size: 0.75rem; margin: 0.125rem 0 0; }
  .checkbox-label {
    display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;
    color: #444; cursor: pointer;
  }

  .alert { padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.875rem; }
  .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

  /* ── Delete modal ────────────────────────────────────────── */
  .delete-warning { display: grid; gap: 0.75rem; }
  .delete-target {
    display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
    padding: 1rem; background: #f9fafb; border-radius: 8px; text-align: center;
  }
  .delete-target strong { font-size: 1rem; color: #1a1a2e; }
  .warning-text { color: #b91c1c; font-size: 0.8125rem; font-weight: 500; }

  /* ── Toasts ──────────────────────────────────────────────── */
  .toast-container {
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 200;
    display: flex; flex-direction: column; gap: 0.5rem; max-width: 400px;
  }
  .toast {
    display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;
    border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    font-size: 0.875rem; animation: slideIn 0.25s ease;
  }
  .toast-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .toast-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  .toast-icon { font-weight: 700; font-size: 1rem; flex-shrink: 0; }
  .toast-msg { flex: 1; }
  .toast-close {
    background: none; border: none; font-size: 1.125rem; cursor: pointer;
    color: inherit; opacity: 0.6; padding: 0; line-height: 1;
  }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  /* ── Responsive ──────────────────────────────────────────── */
  @media (max-width: 768px) {
    .user-page { padding: 1rem; }
    .page-header { flex-direction: column; }
    .toolbar { flex-direction: column; }
    .search-wrap { max-width: none; }
    .form-row { flex-direction: column; }
  }
</style>
