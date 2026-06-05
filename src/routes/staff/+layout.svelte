<script lang="ts">
  import { useClerkContext } from 'svelte-clerk/client';

  let { children, data }: { children: import('svelte').Snippet; data: { role: string } } = $props();
  let role = $derived(data.role);

  const clerk = useClerkContext();

  function signOut() {
    clerk.clerk?.signOut({ redirectUrl: '/' });
  }
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <title>Staff Portal — Agentic AI</title>
</svelte:head>

<div class="staff-layout">
  <nav class="staff-nav">
    <div class="staff-nav-brand">
      <a href="/staff/dashboard">⚡ Staff Portal</a>
    </div>
    <div class="staff-nav-links">
      <a href="/staff/dashboard" data-nav="dashboard">📊 Dashboard</a>
      <a href="/staff/assessments" data-nav="assessments">📋 Command Console</a>
      <a href="/staff/clients" data-nav="clients">👤 Clients</a>
      <a href="/staff/reports" data-nav="reports">📑 Reports</a>
      <a href="/staff/gates" data-nav="gates">🔬 Gates</a>
      <a href="/staff/human-assist" data-nav="human-assist">💬 Human Assist</a>
      <a href="/staff/calibration" data-nav="calibration">⚙️ Calibration</a>
      <a href="/staff/cost-dashboard" data-nav="cost-dashboard">💰 Cost</a>
      {#if role === 'admin'}
        <a href="/staff/audit" data-nav="audit">📜 Audit</a>
        <a href="/staff/users" data-nav="staff">👥 Staff</a>
      {/if}
    </div>
    <div class="staff-nav-right">
      <span class="staff-role-badge" class:is-admin={role === 'admin'}>
        {role}
      </span>
      <span class="staff-user-name">
        {clerk.user?.firstName || clerk.user?.emailAddresses?.[0]?.emailAddress || ''}
      </span>
      {#if !import.meta.env.DEV}
        <button onclick={signOut} class="staff-signout">Sign Out</button>
      {/if}
    </div>
  </nav>
  <main class="staff-content">
    {@render children?.()}
  </main>
</div>

<style>
  .staff-layout {
    min-height: 100vh;
    background: var(--color-page);
    display: flex;
    flex-direction: column;
  }
  .staff-nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0 1.25rem;
    height: 3.25rem;
    background: var(--dark-bg-2);
    color: #fff;
    flex-shrink: 0;
  }
  .staff-nav-brand {
    margin-right: 0.5rem;
  }
  .staff-nav-brand a {
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.9rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .staff-nav-links {
    display: flex;
    align-items: center;
    gap: 0.125rem;
    flex: 1;
    overflow-x: auto;
  }
  .staff-nav-links a {
    color: var(--dark-muted);
    text-decoration: none;
    padding: 0 0.75rem;
    height: 100%;
    display: flex;
    align-items: center;
    font-size: 0.8rem;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
  }
  .staff-nav-links a:hover {
    color: #fff;
    border-color: var(--color-accent-text);
  }
  .staff-nav-links a:focus-visible {
    outline: 3px solid rgba(96, 165, 250, 0.55);
    outline-offset: -3px;
    color: #fff;
  }
  .staff-nav-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-left: auto;
    flex-shrink: 0;
  }
  .staff-role-badge {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: var(--color-panel-soft);
    color: var(--dark-muted);
    border: 1px solid var(--dark-line);
  }
  .staff-role-badge.is-admin {
    background: var(--color-accent-light);
    color: var(--dark-blue);
    border-color: var(--color-accent-mid);
  }
  .staff-user-name {
    font-size: 0.8rem;
    color: var(--dark-muted);
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .staff-signout {
    background: transparent;
    color: var(--color-warm);
    border: 1px solid var(--color-line);
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.75rem;
    transition: background 0.15s;
  }
  .staff-signout:hover {
    background: var(--color-panel-soft);
  }
  .staff-signout:focus-visible {
    outline: 3px solid rgba(96, 165, 250, 0.55);
    outline-offset: 2px;
  }
  .staff-content {
    flex: 1;
    padding: 1.5rem 2rem;
    max-width: 1360px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
</style>
