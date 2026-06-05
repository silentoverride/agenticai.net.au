<!--
  New Client — form for creating a new client record.
  Section 1 of the spec (Story 11.8) — only the essential fields inline;
  the full record view at /staff/clients/[id] hosts the rest.
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    CLIENT_INDUSTRIES,
    CLIENT_COMPANY_SIZES,
    CLIENT_LEAD_SOURCES
  } from '$lib/staff-portal/clients.dto';

  let companyName = $state('');
  let tradingName = $state('');
  let primaryContactName = $state('');
  let jobTitle = $state('');
  let email = $state('');
  let phone = $state('');
  let industry = $state<string>('');
  let companySize = $state<string>('');
  let leadSource = $state<string>('');
  let status = $state<string>('prospect');
  let tagsRaw = $state(''); // comma-separated
  let assignedStaffId = $state('');

  let saving = $state(false);
  let error = $state('');

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = '';
    if (!companyName.trim()) {
      error = 'Company name is required.';
      return;
    }
    saving = true;
    try {
      const tags = tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20);
      const body = {
        companyName: companyName.trim(),
        tradingName: tradingName.trim() || undefined,
        primaryContactName: primaryContactName.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        industry: industry || undefined,
        companySize: companySize || undefined,
        leadSource: leadSource || undefined,
        status,
        assignedStaffId: assignedStaffId.trim() || undefined,
        tags
      };
      const res = await fetch('/api/staff/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? `Error ${res.status}`);
      }
      const created = (await res.json()) as { id: string };
      await goto(`/staff/clients/${created.id}`);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to create client';
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    goto('/staff/clients');
  }
</script>

<svelte:head>
  <title>New Client — Staff Portal</title>
</svelte:head>

<div class="staff-page">
  <header class="page-header">
    <h1>New Client</h1>
    <p class="subtitle">Create a new client record. You can complete the rest of the details after.</p>
  </header>

  <form class="card" onsubmit={handleSubmit}>
    {#if error}
      <div class="alert alert-error">{error}</div>
    {/if}

    <div class="form-grid">
      <div class="form-group full">
        <label for="companyName">Company name *</label>
        <input
          id="companyName"
          type="text"
          bind:value={companyName}
          required
          maxlength="200"
        />
      </div>

      <div class="form-group">
        <label for="tradingName">Trading name</label>
        <input id="tradingName" type="text" bind:value={tradingName} maxlength="200" />
      </div>

      <div class="form-group">
        <label for="primaryContactName">Primary contact</label>
        <input
          id="primaryContactName"
          type="text"
          bind:value={primaryContactName}
          maxlength="200"
        />
      </div>

      <div class="form-group">
        <label for="jobTitle">Job title</label>
        <input id="jobTitle" type="text" bind:value={jobTitle} maxlength="200" />
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" type="email" bind:value={email} maxlength="320" />
      </div>

      <div class="form-group">
        <label for="phone">Phone</label>
        <input id="phone" type="tel" bind:value={phone} maxlength="40" />
      </div>

      <div class="form-group">
        <label for="industry">Industry</label>
        <select id="industry" bind:value={industry}>
          <option value="">—</option>
          {#each CLIENT_INDUSTRIES as ind (ind)}
            <option value={ind}>{ind.replace(/-/g, ' ')}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="companySize">Company size</label>
        <select id="companySize" bind:value={companySize}>
          <option value="">—</option>
          {#each CLIENT_COMPANY_SIZES as sz (sz)}
            <option value={sz}>{sz}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="leadSource">Lead source</label>
        <select id="leadSource" bind:value={leadSource}>
          <option value="">—</option>
          {#each CLIENT_LEAD_SOURCES as ls (ls)}
            <option value={ls}>{ls.replace(/-/g, ' ')}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="status">Status</label>
        <select id="status" bind:value={status}>
          <option value="prospect">Prospect</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div class="form-group">
        <label for="assignedStaffId">Assigned staff ID</label>
        <input
          id="assignedStaffId"
          type="text"
          bind:value={assignedStaffId}
          maxlength="80"
          placeholder="e.g. user_clerk_…"
        />
      </div>

      <div class="form-group full">
        <label for="tagsRaw">Tags</label>
        <input
          id="tagsRaw"
          type="text"
          bind:value={tagsRaw}
          placeholder="Comma-separated, e.g. priority, healthcare, sydney"
        />
        <p class="hint">Up to 20 tags, each 1–40 chars.</p>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn" onclick={handleCancel} disabled={saving}>Cancel</button>
      <button type="submit" class="btn btn-primary" disabled={saving}>
        {saving ? 'Creating…' : 'Create client'}
      </button>
    </div>
  </form>
</div>

<style>
  .staff-page {
    max-width: 880px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
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
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  }

  .alert {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .alert-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.full {
    grid-column: 1 / -1;
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

  .hint {
    color: #888;
    font-size: 0.75rem;
    margin: 0.375rem 0 0;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;
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
</style>
