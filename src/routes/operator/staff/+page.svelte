<script lang="ts">
  import type { PageData } from './$types';

  let { data: pageData }: { data: PageData } = $props();

  interface StaffUser {
    clerkId: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  }

  interface StaffInvitation {
    id: string;
    email: string;
    role: string;
    status: string;
    invitedBy: string;
    createdAt: string;
    acceptedAt: string | null;
  }

  interface StaffApiResponse {
    users: StaffUser[];
    invitations: StaffInvitation[];
  }

  let users = $state<StaffUser[]>([...pageData.users]);
  let invitations = $state<StaffInvitation[]>([...pageData.invitations]);

  let email = $state('');
  let role = $state('operator');
  let inviting = $state(false);
  let inviteError = $state('');
  let inviteSuccess = $state('');

  async function refreshList() {
    try {
      const res = await fetch('/api/operator/staff');
      if (res.ok) {
        const fresh: StaffApiResponse = await res.json();
        users = fresh.users;
        invitations = fresh.invitations;
      }
    } catch {
      // Silently retry on next action
    }
  }

  async function handleInvite(event: Event) {
    event.preventDefault();
    inviting = true;
    inviteError = '';
    inviteSuccess = '';

    try {
      const res = await fetch('/api/operator/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
        inviteError = errBody.message || `Error ${res.status}`;
        return;
      }

      const result = await res.json() as { success: boolean };
      if (result.success) {
        inviteSuccess = `Invitation sent to ${email}`;
        email = '';
        await refreshList();
      }
    } catch (err: unknown) {
      inviteError = err instanceof Error ? err.message : 'Failed to send invitation';
    } finally {
      inviting = false;
    }
  }

  async function handleRevoke(invitationId: string) {
    if (!confirm('Revoke this invitation? The user will no longer be able to accept it.')) return;

    try {
      const res = await fetch(`/api/operator/staff/invite/${invitationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: 'Revoke failed' })) as { message?: string };
        alert(errBody.message || `Error ${res.status}`);
        return;
      }

      await refreshList();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to revoke');
    }
  }

  async function handleRemoveRole(userClerkId: string, currentRole: string) {
    const action = currentRole === 'admin' ? 'demote' : 'remove staff access';
    if (!confirm(`Are you sure you want to ${action} for this user?`)) return;

    try {
      const res = await fetch(`/api/operator/staff/user/${userClerkId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'client' }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
        alert(errBody.message || `Error ${res.status}`);
        return;
      }

      await refreshList();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update role');
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr + 'Z').toLocaleDateString('en-AU', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  const statusStyle: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'badge-warning' },
    accepted: { label: 'Accepted', cls: 'badge-success' },
    revoked: { label: 'Revoked', cls: 'badge-muted' },
  };

  const roleBadge: Record<string, string> = {
    admin: 'badge-admin',
    operator: 'badge-operator',
  };

  let pendingInvitations = $derived(invitations.filter(i => i.status === 'pending'));
  let historyInvitations = $derived(invitations.filter(i => i.status !== 'pending'));
</script>

<div class="staff-page">
  <header class="page-header">
    <h1>Staff Management</h1>
    <p class="subtitle">Invite and manage operator and admin users</p>
  </header>

  <!-- Invite Form -->
  <section class="card invite-card">
    <h2>Invite Staff Member</h2>
    <p class="card-desc">Send a Clerk invitation email to grant staff access.</p>

    <form onsubmit={handleInvite} class="invite-form">
      <div class="form-row">
        <div class="form-group">
          <label for="email">Email address</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="colleague@example.com"
            required
            disabled={inviting}
          />
        </div>
        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" bind:value={role} disabled={inviting}>
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="form-group form-action">
          <button type="submit" class="btn btn-primary" disabled={inviting || !email.trim()}>
            {inviting ? 'Sending…' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </form>

    {#if inviteError}
      <div class="alert alert-error">{inviteError}</div>
    {/if}
    {#if inviteSuccess}
      <div class="alert alert-success">{inviteSuccess}</div>
    {/if}
  </section>

  <!-- Pending Invitations -->
  <section class="card">
    <h2>Pending Invitations ({pendingInvitations.length})</h2>
    {#if pendingInvitations.length === 0}
      <p class="empty-state">No pending invitations.</p>
    {:else}
      <table class="data-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Sent</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each pendingInvitations as inv}
            <tr>
              <td>{inv.email}</td>
              <td><span class="badge {roleBadge[inv.role] || ''}">{inv.role}</span></td>
              <td>{formatDate(inv.createdAt)}</td>
              <td>
                <span class="badge {statusStyle[inv.status]?.cls || ''}">
                  {statusStyle[inv.status]?.label || inv.status}
                </span>
              </td>
              <td>
                <button
                  class="btn btn-small btn-danger"
                  onclick={() => handleRevoke(inv.id)}
                >
                  Revoke
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>

  <!-- Invitation History -->
  {#if historyInvitations.length > 0}
    <section class="card">
      <h2>Invitation History</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Accepted</th>
          </tr>
        </thead>
        <tbody>
          {#each historyInvitations as inv}
            <tr>
              <td>{inv.email}</td>
              <td><span class="badge {roleBadge[inv.role] || ''}">{inv.role}</span></td>
              <td>
                <span class="badge {statusStyle[inv.status]?.cls || ''}">
                  {statusStyle[inv.status]?.label || inv.status}
                </span>
              </td>
              <td>{formatDate(inv.acceptedAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}

  <!-- Current Staff -->
  <section class="card">
    <h2>Staff Users ({users.length})</h2>
    {#if users.length === 0}
      <p class="empty-state">No staff users yet.</p>
    {:else}
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Member Since</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr>
              <td>{user.name || '—'}</td>
              <td>{user.email}</td>
              <td><span class="badge {roleBadge[user.role] || ''}">{user.role}</span></td>
              <td>{formatDate(user.createdAt)}</td>
              <td>
                <button
                  class="btn btn-small btn-danger"
                  onclick={() => handleRemoveRole(user.clerkId, user.role)}
                >
                  Remove Access
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>
</div>

<style>
  .staff-page {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
    color: #1a1a2e;
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
    box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  }

  .card h2 {
    font-size: 1.125rem;
    color: #1a1a2e;
    margin: 0 0 0.25rem;
  }

  .card-desc {
    color: #888;
    font-size: 0.875rem;
    margin: 0 0 1.25rem;
  }

  .invite-form {
    margin-bottom: 1rem;
  }

  .form-row {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  .form-group {
    flex: 1;
    min-width: 200px;
  }

  .form-group label {
    display: block;
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

  .form-action {
    flex: 0 0 auto;
    min-width: auto;
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

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #b02a37;
  }

  .btn-small {
    padding: 0.3125rem 0.625rem;
    font-size: 0.8125rem;
  }

  .alert {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    margin-top: 0.75rem;
  }

  .alert-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .alert-success {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  .data-table th {
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid #eee;
  }

  .data-table td {
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
    color: #333;
    border-bottom: 1px solid #f0f0f0;
  }

  .data-table tr:last-child td {
    border-bottom: none;
  }

  .badge {
    display: inline-block;
    padding: 0.1875rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .badge-admin {
    background: #e8d5f7;
    color: #6b21a8;
  }

  .badge-operator {
    background: #dbeafe;
    color: #1e40af;
  }

  .badge-warning {
    background: #fef9c3;
    color: #854d0e;
  }

  .badge-success {
    background: #dcfce7;
    color: #166534;
  }

  .badge-muted {
    background: #f3f4f6;
    color: #6b7280;
  }

  .empty-state {
    color: #999;
    font-size: 0.875rem;
    margin: 1rem 0 0.5rem;
  }
</style>
