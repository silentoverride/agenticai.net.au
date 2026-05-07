<script lang="ts">
  import { useClerkContext } from 'svelte-clerk';
  import { SignIn, SignUp } from 'svelte-clerk';
  import { page } from '$app/state';

  let { children } = $props();

  const clerk = useClerkContext();

  const isSignUp = page.url.pathname === '/portal/sign-up';
</script>

<div class="portal-layout">
  {#if clerk.auth.userId == null}
    <div class="portal-auth-gate">
      <h1>Client Portal</h1>
      <p>Sign {isSignUp ? 'up' : 'in'} to view your AI Business Assessment reports and receipts.</p>
      <div class="portal-signin">
        {#if isSignUp}
          <SignUp fallbackRedirectUrl="/portal" forceRedirectUrl="/portal" />
        {:else}
          <SignIn fallbackRedirectUrl="/portal" forceRedirectUrl="/portal" />
        {/if}
      </div>
    </div>
  {:else}
    <nav class="portal-nav">
      <a href="/portal">Dashboard</a>
      <a href="/portal/reports">Reports</a>
      <a href="/portal/receipts">Receipts</a>
      <a href="/portal/profile">Profile</a>
      <a href="/services" class="nav-cta">Start Assessment</a>
      <div class="portal-nav-right">
        <span>{clerk.user?.firstName || clerk.user?.emailAddresses?.[0]?.emailAddress}</span>
        <button onclick={() => clerk.clerk?.signOut({ redirectUrl: '/' })} class="portal-signout">Sign Out</button>
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
