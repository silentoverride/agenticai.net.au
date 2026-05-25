<script lang="ts">
  import { useClerkContext } from 'svelte-clerk';
  import { SignIn, SignUp } from 'svelte-clerk';
  import { page } from '$app/state';
  import { setPortalAuth } from '$lib/portal-context.svelte';
  import { portalGet, portalNavUrl } from '$lib/portal-client';

  let { children } = $props();

  const clerk = useClerkContext();

  const isSignUp = page.url.pathname === '/portal/sign-up';
  const devUserId = page.url.searchParams.get('dev_user_id');
  const isDevBypass = !import.meta.env.PROD && devUserId != null;

  // Reactive auth context shared with child pages
  let portalAuth = $state({ userId: '', isDevBypass: false, devUserId: '', role: '' });

  // Fetch the user's role for role-based navigation
  let userRole = $state('');

  $effect(() => {
    portalAuth.userId = clerk.auth.userId || devUserId || '';
    portalAuth.isDevBypass = isDevBypass;
    portalAuth.devUserId = devUserId || '';
    portalAuth.role = userRole;
  });
  setPortalAuth(portalAuth);

  $effect(() => {
    const uid = clerk.auth.userId || (isDevBypass ? devUserId : null);
    if (uid) {
      portalGet('/api/portal/user').then(r => r.json()).then((data: unknown) => {
        const d = data as { role?: string };
        if (d.role) {
          userRole = d.role;
          portalAuth.role = d.role;
        }
      }).catch(() => {});
    }
  });

  const isOperator = $derived(userRole === 'operator' || userRole === 'admin');
</script>

<div class="portal-layout">
  {#if clerk.auth.userId == null && !isDevBypass}
    <div class="portal-auth-gate">
      <h1>Client Portal</h1>
      <p>Sign {isSignUp ? 'up' : 'in'} to view your AI Business Assessment reports and receipts.</p>
      <div class="portal-signin">
        {#if isSignUp}
          <SignUp fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" />
        {:else}
          <SignIn fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" />
        {/if}
      </div>
    </div>
  {:else}
    <nav class="portal-nav">
      <a href={portalNavUrl(`/portal/${portalAuth.userId}`)}>Dashboard</a>
      <a href={portalNavUrl(`/portal/${portalAuth.userId}/reports`)}>Reports</a>
      <a href={portalNavUrl(`/portal/${portalAuth.userId}/receipts`)}>Receipts</a>
      <a href={portalNavUrl(`/portal/${portalAuth.userId}/profile`)}>Profile</a>
      <a href="/services" class="nav-cta">Start Assessment</a>
      {#if isOperator}
        <span class="nav-separator"></span>
        <a href="/operator/dashboard" class="nav-operator-link">📊 Operator Dashboard</a>
        <a href="/operator/gates" class="nav-operator-link">🔬 Gates</a>
        <a href="/operator/human-assist" class="nav-operator-link">💬 Human Assist</a>
        <a href="/operator/calibration" class="nav-operator-link">⚙️ Calibration</a>
      {/if}
      <div class="portal-nav-right">
        <span>{isDevBypass ? 'Dev User' : (clerk.user?.firstName || clerk.user?.emailAddresses?.[0]?.emailAddress)}</span>
        {#if !isDevBypass}
          <button onclick={() => clerk.clerk?.signOut({ redirectUrl: '/' })} class="portal-signout">Sign Out</button>
        {/if}
      </div>
    </nav>
    <div class="portal-content">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .portal-layout {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  }
  .portal-auth-gate {
    max-width: 480px;
    margin: 4rem auto;
    padding: 2rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    text-align: center;
  }
  .portal-auth-gate h1 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
    color: #1a1a2e;
  }
  .portal-auth-gate p {
    color: #666;
    margin-bottom: 1.5rem;
  }
  .portal-signin {
    display: flex;
    justify-content: center;
  }
  .portal-nav {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 2rem;
    background: white;
    border-bottom: 1px solid #e0e0e0;
  }
  .portal-nav a {
    color: #1a1a2e;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 0;
    border-bottom: 2px solid transparent;
    transition: border-color 0.2s;
  }
  .portal-nav a:hover {
    border-color: #0066ff;
  }
  .portal-nav a.nav-cta {
    background: #0066ff;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border-bottom: none;
    text-decoration: none;
  }
  .portal-nav a.nav-cta:hover {
    background: #0052cc;
    border-bottom: none;
  }
  .nav-separator {
    width: 1px;
    height: 1.5rem;
    background: #d0d0d0;
    margin: 0 0.25rem;
  }
  .nav-operator-link {
    font-size: 0.875rem;
    opacity: 0.85;
  }
  .nav-operator-link:hover {
    opacity: 1;
  }
  .portal-nav-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.875rem;
    color: #666;
  }
  .portal-signout {
    background: #1a1a2e;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  .portal-signout:hover {
    background: #2a2a4e;
  }
  .portal-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>
