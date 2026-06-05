<!--
  Client Record — full client record view with 4 sections.

  Stories 11-7, 11-8, 11-9, 11-10, 11-11 of the Clients CRM epic.

  Sections (tabs):
    1. Company & Demographics  — full create/update form
    2. Files                    — R2-backed files with multi-select delete
    3. Interactions             — chronological log
    4. Tasks & Appointments     — CRUD with reschedule/complete
-->
<script lang="ts">
  import type { PageData } from './$types';
  import { invalidateAll } from '$app/navigation';
  import {
    CLIENT_INDUSTRIES,
    CLIENT_COMPANY_SIZES,
    CLIENT_LEAD_SOURCES,
    CLIENT_STATUSES,
    CLIENT_FILE_CATEGORIES,
    CLIENT_INTERACTION_TYPES,
    CLIENT_TASK_TYPES,
    CLIENT_TASK_STATUSES,
    CLIENT_TASK_PRIORITIES
  } from '$lib/staff-portal/clients.dto';
  import type {
    ClientDto,
    ClientFileDto,
    ClientInteractionDto,
    ClientInteractionType,
    ClientTaskDto
  } from '$lib/staff-portal/clients.dto';

  let { data }: { data: PageData } = $props();

  // -------------------------------------------------------------------------
  // Section state
  // -------------------------------------------------------------------------
  type Section = 'company' | 'files' | 'interactions' | 'tasks';
  let activeSection = $state<Section>('company');

  // -------------------------------------------------------------------------
  // Section 1 — Company & Demographics (editable form)
  // -------------------------------------------------------------------------
  // svelte-ignore state_referenced_locally
  let companyForm = $state(toForm(data.client));
  let savingCompany = $state(false);
  let companyMessage = $state<{ kind: 'success' | 'error'; text: string } | null>(null);

  function toForm(c: ClientDto) {
    return {
      companyName: c.companyName,
      tradingName: c.tradingName ?? '',
      primaryContactName: c.primaryContactName ?? '',
      jobTitle: c.jobTitle ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      secondaryPhone: c.secondaryPhone ?? '',
      website: c.website ?? '',
      billingAddress: c.billingAddress ?? '',
      shippingAddress: c.shippingAddress ?? '',
      taxId: c.taxId ?? '',
      industry: c.industry ?? '',
      companySize: c.companySize ?? '',
      leadSource: c.leadSource ?? '',
      assignedStaffId: c.assignedStaffId ?? '',
      status: c.status,
      tagsRaw: c.tags.join(', ')
    };
  }

  $effect(() => {
    // Re-sync when the server reloads a new record
    companyForm = toForm(data.client);
  });

  async function saveCompany(event: Event) {
    event.preventDefault();
    savingCompany = true;
    companyMessage = null;
    try {
      const tags = companyForm.tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20);
      const body = {
        companyName: companyForm.companyName.trim(),
        tradingName: companyForm.tradingName.trim() || null,
        primaryContactName: companyForm.primaryContactName.trim() || null,
        jobTitle: companyForm.jobTitle.trim() || null,
        email: companyForm.email.trim() || null,
        phone: companyForm.phone.trim() || null,
        secondaryPhone: companyForm.secondaryPhone.trim() || null,
        website: companyForm.website.trim() || null,
        billingAddress: companyForm.billingAddress.trim() || null,
        shippingAddress: companyForm.shippingAddress.trim() || null,
        taxId: companyForm.taxId.trim() || null,
        industry: companyForm.industry || null,
        companySize: companyForm.companySize || null,
        leadSource: companyForm.leadSource || null,
        assignedStaffId: companyForm.assignedStaffId.trim() || null,
        status: companyForm.status,
        tags
      };
      const res = await fetch(`/api/staff/clients/${data.client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? `Error ${res.status}`);
      }
      companyMessage = { kind: 'success', text: 'Client saved.' };
      await invalidateAll();
    } catch (e: unknown) {
      companyMessage = {
        kind: 'error',
        text: e instanceof Error ? e.message : 'Failed to save client'
      };
    } finally {
      savingCompany = false;
    }
  }

  function cancelCompany() {
    companyForm = toForm(data.client);
    companyMessage = null;
  }

  // -------------------------------------------------------------------------
  // Section 2 — Files
  // -------------------------------------------------------------------------
  let fileCategory = $state<string>('other');
  let fileDescription = $state('');
  let uploadFile = $state<File | null>(null);
  let uploading = $state(false);
  let fileMessage = $state<{ kind: 'success' | 'error'; text: string } | null>(null);
  let selectedFileIds = $state<Set<string>>(new Set());
  let showDeleteFilesConfirm = $state(false);
  let deletingFiles = $state(false);

  function onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    uploadFile = target.files?.[0] ?? null;
  }

  async function handleUpload(event: Event) {
    event.preventDefault();
    if (!uploadFile) {
      fileMessage = { kind: 'error', text: 'Pick a file first.' };
      return;
    }
    uploading = true;
    fileMessage = null;
    try {
      const form = new FormData();
      form.append('file', uploadFile);
      form.append('category', fileCategory);
      form.append('description', fileDescription);
      const res = await fetch(`/api/staff/clients/${data.client.id}/files`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? `Error ${res.status}`);
      }
      fileMessage = { kind: 'success', text: 'File uploaded.' };
      uploadFile = null;
      fileDescription = '';
      fileCategory = 'other';
      const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      await invalidateAll();
    } catch (e: unknown) {
      fileMessage = {
        kind: 'error',
        text: e instanceof Error ? e.message : 'Failed to upload file'
      };
    } finally {
      uploading = false;
    }
  }

  function toggleFileSelected(id: string) {
    if (selectedFileIds.has(id)) {
      selectedFileIds.delete(id);
    } else {
      selectedFileIds.add(id);
    }
    // Trigger reactivity
    selectedFileIds = new Set(selectedFileIds);
  }

  function clearFileSelection() {
    selectedFileIds = new Set();
  }

  async function confirmDeleteFiles() {
    deletingFiles = true;
    fileMessage = null;
    try {
      const res = await fetch(`/api/staff/clients/${data.client.id}/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: Array.from(selectedFileIds), confirm: true })
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? `Error ${res.status}`);
      }
      fileMessage = { kind: 'success', text: `Deleted ${selectedFileIds.size} file(s).` };
      selectedFileIds = new Set();
      showDeleteFilesConfirm = false;
      await invalidateAll();
    } catch (e: unknown) {
      fileMessage = {
        kind: 'error',
        text: e instanceof Error ? e.message : 'Failed to delete files'
      };
    } finally {
      deletingFiles = false;
    }
  }

  // -------------------------------------------------------------------------
  // Section 3 — Interactions
  // -------------------------------------------------------------------------
  let interactionType = $state<ClientInteractionType>('note');
  let interactionSummary = $state('');
  let interactionOccurredAt = $state(new Date().toISOString().slice(0, 16));
  let addingInteraction = $state(false);
  let interactionMessage = $state<{ kind: 'success' | 'error'; text: string } | null>(null);
  let filterType = $state<string>('');

  const filteredInteractions = $derived(
    filterType ? data.interactions.filter((i) => i.type === filterType) : data.interactions
  );

  async function handleAddInteraction(event: Event) {
    event.preventDefault();
    addingInteraction = true;
    interactionMessage = null;
    try {
      if (!interactionSummary.trim()) {
        throw new Error('Summary is required.');
      }
      const res = await fetch(`/api/staff/clients/${data.client.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: interactionType,
          summary: interactionSummary.trim(),
          occurredAt: new Date(interactionOccurredAt).toISOString(),
          linkedFileIds: [],
          linkedTaskIds: []
        })
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? `Error ${res.status}`);
      }
      interactionMessage = { kind: 'success', text: 'Interaction logged.' };
      interactionSummary = '';
      interactionOccurredAt = new Date().toISOString().slice(0, 16);
      await invalidateAll();
    } catch (e: unknown) {
      interactionMessage = {
        kind: 'error',
        text: e instanceof Error ? e.message : 'Failed to log interaction'
      };
    } finally {
      addingInteraction = false;
    }
  }

  let deletingInteractionId = $state<string | null>(null);
  async function handleDeleteInteraction(id: string) {
    if (!confirm('Delete this interaction? This cannot be undone.')) return;
    deletingInteractionId = id;
    try {
      const res = await fetch(`/api/staff/clients/${data.client.id}/interactions/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? `Error ${res.status}`);
      }
      await invalidateAll();
    } catch (e: unknown) {
      interactionMessage = {
        kind: 'error',
        text: e instanceof Error ? e.message : 'Failed to delete interaction'
      };
    } finally {
      deletingInteractionId = null;
    }
  }

  // -------------------------------------------------------------------------
  // Section 4 — Tasks
  // -------------------------------------------------------------------------
  let taskTitle = $state('');
  let taskType = $state<'task' | 'appointment'>('task');
  let taskPriority = $state<'low' | 'normal' | 'high' | 'urgent'>('normal');
  let taskDueAt = $state(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));
  let taskDescription = $state('');
  let taskAssignedStaffId = $state('');
  let addingTask = $state(false);
  let taskMessage = $state<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function handleAddTask(event: Event) {
    event.preventDefault();
    addingTask = true;
    taskMessage = null;
    try {
      if (!taskTitle.trim()) {
        throw new Error('Title is required.');
      }
      const res = await fetch(`/api/staff/clients/${data.client.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: taskType,
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          dueAt: new Date(taskDueAt).toISOString(),
          assignedStaffId: taskAssignedStaffId.trim() || undefined,
          status: 'open',
          priority: taskPriority
        })
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? `Error ${res.status}`);
      }
      taskMessage = { kind: 'success', text: 'Task created.' };
      taskTitle = '';
      taskDescription = '';
      taskDueAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16);
      await invalidateAll();
    } catch (e: unknown) {
      taskMessage = {
        kind: 'error',
        text: e instanceof Error ? e.message : 'Failed to create task'
      };
    } finally {
      addingTask = false;
    }
  }

  async function toggleTaskComplete(task: ClientTaskDto) {
    const newStatus = task.status === 'completed' ? 'open' : 'completed';
    try {
      const res = await fetch(`/api/staff/clients/${data.client.id}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? `Error ${res.status}`);
      }
      await invalidateAll();
    } catch (e: unknown) {
      taskMessage = {
        kind: 'error',
        text: e instanceof Error ? e.message : 'Failed to update task'
      };
    }
  }

  let reschedulingTask = $state<string | null>(null);
  let rescheduleValue = $state<string>('');
  function startReschedule(task: ClientTaskDto) {
    reschedulingTask = task.id;
    rescheduleValue = new Date(task.dueAt).toISOString().slice(0, 16);
  }
  async function commitReschedule(task: ClientTaskDto) {
    try {
      const res = await fetch(`/api/staff/clients/${data.client.id}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueAt: new Date(rescheduleValue).toISOString() })
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? `Error ${res.status}`);
      }
      reschedulingTask = null;
      await invalidateAll();
    } catch (e: unknown) {
      taskMessage = {
        kind: 'error',
        text: e instanceof Error ? e.message : 'Failed to reschedule'
      };
    }
  }

  async function deleteTask(task: ClientTaskDto) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      const res = await fetch(`/api/staff/clients/${data.client.id}/tasks/${task.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errBody.message ?? `Error ${res.status}`);
      }
      await invalidateAll();
    } catch (e: unknown) {
      taskMessage = {
        kind: 'error',
        text: e instanceof Error ? e.message : 'Failed to delete task'
      };
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  function statusBadge(s: string): string {
    switch (s) {
      case 'active': return 'badge-active';
      case 'inactive': return 'badge-inactive';
      case 'prospect': return 'badge-prospect';
      case 'archived': return 'badge-archived';
      default: return '';
    }
  }
  function priorityBadge(p: string): string {
    switch (p) {
      case 'urgent': return 'badge-danger';
      case 'high': return 'badge-attention';
      case 'normal': return 'badge-neutral';
      case 'low': return 'badge-muted';
      default: return '';
    }
  }
  function formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  }
  function formatDateTime(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-AU', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
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
  <title>{data.client.companyName} — Client Record</title>
</svelte:head>

<div class="staff-page">
  <header class="page-header">
    <nav class="breadcrumb">
      <a href="/staff/clients" class="breadcrumb-link">Clients</a>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-current">{data.client.companyName}</span>
    </nav>
    <div class="header-row">
      <div>
        <h1>{data.client.companyName}</h1>
        {#if data.client.tradingName}
          <p class="trading">trading as {data.client.tradingName}</p>
        {/if}
      </div>
      <span class="badge {statusBadge(data.client.status)}">
        {data.client.status}
      </span>
    </div>
  </header>

  <nav class="section-tabs" aria-label="Record sections">
    <button
      class="tab"
      class:active={activeSection === 'company'}
      onclick={() => (activeSection = 'company')}
    >
      Company & Demographics
    </button>
    <button
      class="tab"
      class:active={activeSection === 'files'}
      onclick={() => (activeSection = 'files')}
    >
      Files <span class="tab-count">{data.files.length}</span>
    </button>
    <button
      class="tab"
      class:active={activeSection === 'interactions'}
      onclick={() => (activeSection = 'interactions')}
    >
      Interactions <span class="tab-count">{data.interactions.length}</span>
    </button>
    <button
      class="tab"
      class:active={activeSection === 'tasks'}
      onclick={() => (activeSection = 'tasks')}
    >
      Tasks <span class="tab-count">{data.tasks.length}</span>
    </button>
  </nav>

  <!-- =====================================================================
       Section 1 — Company & Demographics
       ===================================================================== -->
  {#if activeSection === 'company'}
    <section class="card">
      <h2 class="card-title">Company & Demographics</h2>
      <p class="card-desc">Edit the client's full record. Required field is company name.</p>

      {#if companyMessage}
        <div class="alert alert-{companyMessage.kind}">{companyMessage.text}</div>
      {/if}

      <form onsubmit={saveCompany}>
        <div class="form-grid">
          <div class="form-group full">
            <label for="companyName">Company name *</label>
            <input id="companyName" type="text" bind:value={companyForm.companyName} required maxlength="200" />
          </div>
          <div class="form-group">
            <label for="tradingName">Trading name</label>
            <input id="tradingName" type="text" bind:value={companyForm.tradingName} maxlength="200" />
          </div>
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" bind:value={companyForm.status}>
              {#each CLIENT_STATUSES as s (s)}
                <option value={s}>{s}</option>
              {/each}
            </select>
          </div>
          <div class="form-group">
            <label for="primaryContactName">Primary contact</label>
            <input id="primaryContactName" type="text" bind:value={companyForm.primaryContactName} maxlength="200" />
          </div>
          <div class="form-group">
            <label for="jobTitle">Job title</label>
            <input id="jobTitle" type="text" bind:value={companyForm.jobTitle} maxlength="200" />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" bind:value={companyForm.email} maxlength="320" />
          </div>
          <div class="form-group">
            <label for="phone">Phone</label>
            <input id="phone" type="tel" bind:value={companyForm.phone} maxlength="40" />
          </div>
          <div class="form-group">
            <label for="secondaryPhone">Secondary phone</label>
            <input id="secondaryPhone" type="tel" bind:value={companyForm.secondaryPhone} maxlength="40" />
          </div>
          <div class="form-group">
            <label for="website">Website</label>
            <input id="website" type="url" bind:value={companyForm.website} maxlength="2000" />
          </div>
          <div class="form-group full">
            <label for="billingAddress">Billing address</label>
            <textarea id="billingAddress" bind:value={companyForm.billingAddress} rows="2" maxlength="2000"></textarea>
          </div>
          <div class="form-group full">
            <label for="shippingAddress">Shipping / service address</label>
            <textarea id="shippingAddress" bind:value={companyForm.shippingAddress} rows="2" maxlength="2000"></textarea>
          </div>
          <div class="form-group">
            <label for="taxId">Tax ID / business number</label>
            <input id="taxId" type="text" bind:value={companyForm.taxId} maxlength="80" />
          </div>
          <div class="form-group">
            <label for="assignedStaffId">Assigned staff ID</label>
            <input id="assignedStaffId" type="text" bind:value={companyForm.assignedStaffId} maxlength="80" />
          </div>
          <div class="form-group">
            <label for="industry">Industry</label>
            <select id="industry" bind:value={companyForm.industry}>
              <option value="">—</option>
              {#each CLIENT_INDUSTRIES as ind (ind)}
                <option value={ind}>{ind.replace(/-/g, ' ')}</option>
              {/each}
            </select>
          </div>
          <div class="form-group">
            <label for="companySize">Company size</label>
            <select id="companySize" bind:value={companyForm.companySize}>
              <option value="">—</option>
              {#each CLIENT_COMPANY_SIZES as sz (sz)}
                <option value={sz}>{sz}</option>
              {/each}
            </select>
          </div>
          <div class="form-group">
            <label for="leadSource">Lead source</label>
            <select id="leadSource" bind:value={companyForm.leadSource}>
              <option value="">—</option>
              {#each CLIENT_LEAD_SOURCES as ls (ls)}
                <option value={ls}>{ls.replace(/-/g, ' ')}</option>
              {/each}
            </select>
          </div>
          <div class="form-group full">
            <label for="tagsRaw">Tags</label>
            <input id="tagsRaw" type="text" bind:value={companyForm.tagsRaw} placeholder="Comma-separated" />
            <p class="hint">Up to 20 tags, each 1–40 chars.</p>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn" onclick={cancelCompany} disabled={savingCompany}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={savingCompany}>
            {savingCompany ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  {/if}

  <!-- =====================================================================
       Section 2 — Files
       ===================================================================== -->
  {#if activeSection === 'files'}
    <section class="card">
      <h2 class="card-title">Files</h2>
      <p class="card-desc">Recordings, reports, contracts, invoices, signed documents, notes.</p>

      {#if fileMessage}
        <div class="alert alert-{fileMessage.kind}">{fileMessage.text}</div>
      {/if}

      <form class="upload-form" onsubmit={handleUpload}>
        <div class="form-group">
          <label for="fileInput">File</label>
          <input
            id="fileInput"
            type="file"
            onchange={onFileSelected}
            required
          />
        </div>
        <div class="form-group">
          <label for="fileCategory">Category</label>
          <select id="fileCategory" bind:value={fileCategory}>
            {#each CLIENT_FILE_CATEGORIES as cat (cat)}
              <option value={cat}>{cat.replace(/-/g, ' ')}</option>
            {/each}
          </select>
        </div>
        <div class="form-group description">
          <label for="fileDescription">Description (optional)</label>
          <input id="fileDescription" type="text" bind:value={fileDescription} maxlength="2000" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" disabled={uploading || !uploadFile}>
            {uploading ? 'Uploading…' : 'Upload file'}
          </button>
        </div>
      </form>

      {#if data.files.length > 0}
        <div class="files-toolbar">
          <span class="muted">
            {selectedFileIds.size} of {data.files.length} selected
          </span>
          <div class="files-toolbar-actions">
            {#if selectedFileIds.size > 0}
              <button type="button" class="btn btn-small" onclick={clearFileSelection}>
                Clear selection
              </button>
              <button
                type="button"
                class="btn btn-small btn-danger"
                onclick={() => (showDeleteFilesConfirm = true)}
              >
                Delete selected
              </button>
            {/if}
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th class="th-check">
                <input
                  type="checkbox"
                  checked={data.files.length > 0 && selectedFileIds.size === data.files.length}
                  onchange={(e) => {
                    const checked = (e.currentTarget as HTMLInputElement).checked;
                    selectedFileIds = checked ? new Set(data.files.map((f) => f.id)) : new Set();
                  }}
                />
              </th>
              <th>Name</th>
              <th>Type</th>
              <th>Category</th>
              <th>Size</th>
              <th>Uploaded by</th>
              <th>Uploaded at</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {#each data.files as f (f.id)}
              <tr class:row-selected={selectedFileIds.has(f.id)}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedFileIds.has(f.id)}
                    onchange={() => toggleFileSelected(f.id)}
                  />
                </td>
                <td>
                  <a
                    href={`/api/staff/clients/${data.client.id}/files/${f.id}/download`}
                    target="_blank"
                    rel="noopener"
                    class="inline-link"
                  >
                    {f.fileName}
                  </a>
                  {#if f.description}
                    <p class="file-desc">{f.description}</p>
                  {/if}
                </td>
                <td><span class="muted">{f.fileType || '—'}</span></td>
                <td><span class="badge badge-neutral">{f.category.replace(/-/g, ' ')}</span></td>
                <td>{formatSize(f.sizeBytes)}</td>
                <td>{f.uploadedBy}</td>
                <td>{formatDateTime(f.uploadedAt)}</td>
                <td>
                  <a
                    href={`/api/staff/clients/${data.client.id}/files/${f.id}/download`}
                    target="_blank"
                    rel="noopener"
                    class="btn btn-small"
                  >
                    View
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="empty-state">
          <p class="empty-title">No files for this client</p>
          <p class="empty-desc">Upload your first file to get started.</p>
        </div>
      {/if}
    </section>
  {/if}

  <!-- =====================================================================
       Section 3 — Interactions
       ===================================================================== -->
  {#if activeSection === 'interactions'}
    <section class="card">
      <h2 class="card-title">Interaction Log</h2>
      <p class="card-desc">Phone, email, meeting, work, notes, status updates — chronological.</p>

      {#if interactionMessage}
        <div class="alert alert-{interactionMessage.kind}">{interactionMessage.text}</div>
      {/if}

      <form class="inline-form" onsubmit={handleAddInteraction}>
        <div class="form-group">
          <label for="interactionType">Type</label>
          <select id="interactionType" bind:value={interactionType}>
            {#each CLIENT_INTERACTION_TYPES as t (t)}
              <option value={t}>{t.replace(/_/g, ' ')}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="interactionOccurredAt">When</label>
          <input id="interactionOccurredAt" type="datetime-local" bind:value={interactionOccurredAt} required />
        </div>
        <div class="form-group grow">
          <label for="interactionSummary">Summary</label>
          <input id="interactionSummary" type="text" bind:value={interactionSummary} required maxlength="4000" />
        </div>
        <div class="form-actions inline">
          <button type="submit" class="btn btn-primary" disabled={addingInteraction}>
            {addingInteraction ? 'Logging…' : 'Log interaction'}
          </button>
        </div>
      </form>

      <div class="filter-row">
        <label for="filterType" class="inline-label">Filter by type:</label>
        <select id="filterType" bind:value={filterType}>
          <option value="">All</option>
          {#each CLIENT_INTERACTION_TYPES as t (t)}
            <option value={t}>{t.replace(/_/g, ' ')}</option>
          {/each}
        </select>
      </div>

      {#if filteredInteractions.length > 0}
        <ul class="interaction-list">
          {#each filteredInteractions as i (i.id)}
            <li class="interaction-item">
              <div class="interaction-meta">
                <span class="badge badge-neutral">{i.type.replace(/_/g, ' ')}</span>
                <span class="interaction-time">{formatDateTime(i.occurredAt)}</span>
                <span class="interaction-staff">{i.staffId}</span>
              </div>
              <p class="interaction-summary">{i.summary}</p>
              <div class="interaction-actions">
                <button
                  type="button"
                  class="btn btn-small btn-danger"
                  disabled={deletingInteractionId === i.id}
                  onclick={() => handleDeleteInteraction(i.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="empty-state">
          <p class="empty-title">No interactions logged yet</p>
          <p class="empty-desc">Log your first call, email, or meeting to start the timeline.</p>
        </div>
      {/if}
    </section>
  {/if}

  <!-- =====================================================================
       Section 4 — Tasks & Appointments
       ===================================================================== -->
  {#if activeSection === 'tasks'}
    <section class="card">
      <h2 class="card-title">Tasks & Appointments</h2>
      <p class="card-desc">Scheduled work for this client. Tasks and appointments in one list.</p>

      {#if taskMessage}
        <div class="alert alert-{taskMessage.kind}">{taskMessage.text}</div>
      {/if}

      <form class="inline-form" onsubmit={handleAddTask}>
        <div class="form-group">
          <label for="taskType">Type</label>
          <select id="taskType" bind:value={taskType}>
            {#each CLIENT_TASK_TYPES as t (t)}
              <option value={t}>{t}</option>
            {/each}
          </select>
        </div>
        <div class="form-group grow">
          <label for="taskTitle">Title</label>
          <input id="taskTitle" type="text" bind:value={taskTitle} required maxlength="200" />
        </div>
        <div class="form-group">
          <label for="taskDueAt">Due</label>
          <input id="taskDueAt" type="datetime-local" bind:value={taskDueAt} required />
        </div>
        <div class="form-group">
          <label for="taskPriority">Priority</label>
          <select id="taskPriority" bind:value={taskPriority}>
            {#each CLIENT_TASK_PRIORITIES as p (p)}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="taskAssignedStaffId">Assigned</label>
          <input id="taskAssignedStaffId" type="text" bind:value={taskAssignedStaffId} maxlength="80" />
        </div>
        <div class="form-group grow full">
          <label for="taskDescription">Description (optional)</label>
          <input id="taskDescription" type="text" bind:value={taskDescription} maxlength="4000" />
        </div>
        <div class="form-actions inline">
          <button type="submit" class="btn btn-primary" disabled={addingTask}>
            {addingTask ? 'Creating…' : 'Add task'}
          </button>
        </div>
      </form>

      {#if data.tasks.length > 0}
        <ul class="task-list">
          {#each data.tasks as t (t.id)}
            <li class="task-item" class:completed={t.status === 'completed'}>
              <input
                type="checkbox"
                checked={t.status === 'completed'}
                onchange={() => toggleTaskComplete(t)}
                aria-label="Mark complete"
              />
              <div class="task-body">
                <div class="task-meta">
                  <span class="badge badge-neutral">{t.type}</span>
                  <span class="badge {priorityBadge(t.priority)}">{t.priority}</span>
                  <span class="task-title">{t.title}</span>
                </div>
                {#if t.description}
                  <p class="task-desc">{t.description}</p>
                {/if}
                <div class="task-when">
                  <span class="muted">Due:</span>
                  {#if reschedulingTask === t.id}
                    <input
                      type="datetime-local"
                      bind:value={rescheduleValue}
                      class="inline-reschedule"
                    />
                    <button type="button" class="btn btn-small" onclick={() => commitReschedule(t)}>
                      Save
                    </button>
                    <button type="button" class="btn btn-small" onclick={() => (reschedulingTask = null)}>
                      Cancel
                    </button>
                  {:else}
                    <span>{formatDateTime(t.dueAt)}</span>
                    <button type="button" class="btn-link" onclick={() => startReschedule(t)}>
                      Reschedule
                    </button>
                  {/if}
                </div>
                {#if t.assignedStaffId}
                  <div class="muted small">Assigned: {t.assignedStaffId}</div>
                {/if}
              </div>
              <div class="task-actions">
                <button
                  type="button"
                  class="btn btn-small btn-danger"
                  onclick={() => deleteTask(t)}
                >
                  Delete
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="empty-state">
          <p class="empty-title">No scheduled work for this client</p>
          <p class="empty-desc">Add a task or appointment above to start tracking work.</p>
        </div>
      {/if}
    </section>
  {/if}
</div>

<!-- Confirmation modal for multi-file delete -->
{#if showDeleteFilesConfirm}
  <div
    class="modal-backdrop"
    onclick={() => (showDeleteFilesConfirm = false)}
    onkeydown={(e) => { if (e.key === 'Escape') showDeleteFilesConfirm = false; }}
    role="button"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="modal-title">Delete {selectedFileIds.size} file{selectedFileIds.size === 1 ? '' : 's'}?</h3>
      <p class="modal-desc">
        This will remove the selected files from R2 storage and the client record. This cannot be undone.
      </p>
      <div class="modal-actions">
        <button
          type="button"
          class="btn"
          onclick={() => (showDeleteFilesConfirm = false)}
          disabled={deletingFiles}
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-danger"
          disabled={deletingFiles}
          onclick={confirmDeleteFiles}
        >
          {deletingFiles ? 'Deleting…' : 'Delete files'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .staff-page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .breadcrumb {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 0.5rem;
  }

  .breadcrumb-link {
    color: #0066ff;
    text-decoration: none;
  }

  .breadcrumb-link:hover {
    text-decoration: underline;
  }

  .breadcrumb-sep {
    margin: 0 0.5rem;
    color: #999;
  }

  .breadcrumb-current {
    color: #333;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .page-header h1 {
    font-size: 1.875rem;
    color: var(--dark-bg-2);
    margin: 0 0 0.25rem;
  }

  .trading {
    color: #666;
    font-size: 0.9375rem;
    margin: 0;
  }

  .section-tabs {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e5e5e5;
    overflow-x: auto;
  }

  .tab {
    background: none;
    border: none;
    padding: 0.75rem 1rem;
    font-size: 0.9375rem;
    color: #666;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition: color 0.15s, border-color 0.15s;
  }

  .tab:hover {
    color: #333;
  }

  .tab.active {
    color: #0066ff;
    border-bottom-color: #0066ff;
    font-weight: 600;
  }

  .tab-count {
    display: inline-block;
    margin-left: 0.375rem;
    padding: 0.0625rem 0.5rem;
    background: #eef2ff;
    color: #1e40af;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  }

  .card-title {
    font-size: 1.125rem;
    color: var(--dark-bg-2);
    margin: 0 0 0.25rem;
  }

  .card-desc {
    color: #888;
    font-size: 0.875rem;
    margin: 0 0 1.25rem;
  }

  .alert {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .alert-success {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
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

  .form-group.full,
  .form-group.grow.full {
    grid-column: 1 / -1;
  }

  .form-group label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #444;
    margin-bottom: 0.375rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-size: 0.9375rem;
    background: #fafafa;
    box-sizing: border-box;
    font-family: inherit;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
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

  .form-actions.inline {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
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

  .btn-link {
    background: none;
    border: none;
    color: #0066ff;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0;
    margin-left: 0.5rem;
    text-decoration: underline;
  }

  .upload-form {
    display: grid;
    grid-template-columns: 2fr 1fr 2fr auto;
    gap: 0.75rem;
    align-items: flex-end;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  .upload-form .form-group.description {
    grid-column: span 1;
  }

  .upload-form .form-actions {
    border-top: none;
    margin-top: 0;
    padding-top: 0;
  }

  .files-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .files-toolbar-actions {
    display: flex;
    gap: 0.5rem;
  }

  .muted {
    color: #888;
    font-size: 0.875rem;
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

  .data-table th.th-check {
    width: 32px;
  }

  .data-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f3f3;
    font-size: 0.9375rem;
    color: #333;
  }

  .data-table tr.row-selected {
    background: #eff6ff;
  }

  .inline-link {
    color: #0066ff;
    font-weight: 500;
    text-decoration: none;
  }

  .inline-link:hover {
    text-decoration: underline;
  }

  .file-desc {
    color: #666;
    font-size: 0.8125rem;
    margin: 0.25rem 0 0;
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

  .badge-neutral {
    background: #eef2ff;
    color: #1e40af;
  }

  .badge-attention {
    background: #fef3c7;
    color: #92400e;
  }

  .badge-danger {
    background: #fecaca;
    color: #991b1b;
  }

  .badge-muted {
    background: #f3f4f6;
    color: #6b7280;
  }

  .empty-state {
    text-align: center;
    padding: 2.5rem 1rem;
  }

  .empty-title {
    font-size: 1.0625rem;
    font-weight: 600;
    color: #555;
    margin: 0 0 0.5rem;
  }

  .empty-desc {
    color: #888;
    margin: 0;
  }

  .inline-form {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    flex-wrap: wrap;
  }

  .inline-form .form-group {
    flex: 0 0 auto;
  }

  .inline-form .form-group.grow {
    flex: 1 1 200px;
  }

  .filter-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .inline-label {
    font-size: 0.875rem;
    color: #444;
  }

  .interaction-list,
  .task-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .interaction-item {
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
  }

  .interaction-item:last-child {
    border-bottom: none;
  }

  .interaction-meta {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 0.375rem;
    font-size: 0.875rem;
  }

  .interaction-time {
    color: #666;
  }

  .interaction-staff {
    color: #888;
    font-family: ui-monospace, monospace;
    font-size: 0.8125rem;
  }

  .interaction-summary {
    margin: 0;
    color: #333;
    line-height: 1.5;
  }

  .interaction-actions {
    align-self: start;
  }

  .task-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.75rem;
    padding: 0.875rem 0;
    border-bottom: 1px solid #f0f0f0;
    align-items: start;
  }

  .task-item:last-child {
    border-bottom: none;
  }

  .task-item.completed .task-title,
  .task-item.completed .task-desc {
    text-decoration: line-through;
    color: #999;
  }

  .task-body {
    min-width: 0;
  }

  .task-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .task-title {
    font-weight: 600;
    color: #333;
  }

  .task-desc {
    color: #666;
    font-size: 0.9375rem;
    margin: 0.375rem 0 0;
  }

  .task-when {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.375rem;
    font-size: 0.875rem;
  }

  .inline-reschedule {
    padding: 0.25rem 0.5rem;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .task-actions {
    display: flex;
    gap: 0.25rem;
  }

  .small {
    font-size: 0.8125rem;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 480px;
    width: calc(100% - 2rem);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22);
  }

  .modal-title {
    font-size: 1.125rem;
    color: var(--dark-bg-2);
    margin: 0 0 0.5rem;
  }

  .modal-desc {
    color: #666;
    margin: 0 0 1.25rem;
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
