<script lang="ts">
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';
  import OrientationPanel from '$lib/components/OrientationPanel.svelte';
  import { onMount } from 'svelte';
  import { useClerkContext } from 'svelte-clerk/client';
  import { toggleCall } from '$lib/stores/call';

  const clerk = useClerkContext();

  // Public site links (shown when not signed in or signed in as client)
  const links = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/use-cases', label: 'Use Cases' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' }
  ];

  // Staff portal links (shown when signed in as staff/admin)
  const staffLinks = [
    { href: '/staff/dashboard', label: 'Dashboard' },
    { href: '/staff/assessments', label: 'Command Console' },
    { href: '/staff/gates', label: 'Gates' },
    { href: '/staff/human-assist', label: 'Human Assist' },
    { href: '/staff/audit', label: 'Audit' },
    { href: '/staff/calibration', label: 'Calibration' },
    { href: '/staff/cost-dashboard', label: 'Cost' }
  ];

  let darkMode = $state(false);
  let userRole = $state('');
  let roleLoaded = $state(false);
  let roleError = $state(false);
  let showOrientation = $state(false);

  // Fetch the user's role when they are signed in
  $effect(() => {
    if (clerk.auth.userId != null && !roleLoaded) {
      fetch('/api/portal/user')
        .then(r => r.json())
        .then((data: unknown) => {
          const d = data as { role?: string };
          if (d.role) {
            userRole = d.role;
          }
          roleLoaded = true;
        })
        .catch(() => {
          roleError = true;
          roleLoaded = true;
        });
    } else if (clerk.auth.userId == null) {
      // Reset when the user signs out
      roleLoaded = false;
      roleError = false;
      userRole = '';
    }
  });

  const isStaff = $derived(userRole === 'staff' || userRole === 'admin');
  const isAdmin = $derived(userRole === 'admin');

  onMount(() => {
    darkMode = localStorage.getItem('theme') === 'dark';
    applyTheme();
  });

  function toggleTheme() {
    darkMode = !darkMode;
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    applyTheme();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }

  function handleCallAnnie() {
    showOrientation = true;
  }

  function handleOrientationAcknowledge(_token: string) {
    showOrientation = false;
    toggleCall('website-call-assessment-button');
  }

  function handleOrientationClose() {
    showOrientation = false;
  }
</script>

<header class="site-header">
  <a class="brand" href="/" aria-label="Agentic AI home">
    <img src="/logo.svg" alt="Agentic AI" loading="eager" decoding="sync" fetchpriority="high" />
  </a>
  <nav aria-label="Main navigation">
    {#if isStaff}
      <!-- Staff portal navigation -->
      {#each staffLinks as link}
        <a href={link.href}>{link.label}</a>
      {/each}
      {#if isAdmin}
        <a href="/staff/staff">Staff</a>
      {/if}
    {:else}
      <!-- Public site navigation -->
      {#each links as link}
        <a href={link.href}>{link.label}</a>
      {/each}
    {/if}
  </nav>
  <div class="header-actions">
    <button
      class="theme-toggle"
      type="button"
      aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={darkMode}
      onclick={toggleTheme}
    >
      {#if darkMode}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4V2M12 22v-2M4.93 4.93 3.52 3.52M20.48 20.48l-1.41-1.41M4 12H2M22 12h-2M4.93 19.07l-1.41 1.41M20.48 3.52l-1.41 1.41" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 14.2A7.4 7.4 0 0 1 9.8 3a8.7 8.7 0 1 0 11.2 11.2Z" />
        </svg>
      {/if}
    </button>
    {#if isStaff}
      <!-- Staff actions -->
      <span class="staff-badge">{userRole}</span>
      <button
        class="nav-signout"
        onclick={() => clerk.clerk?.signOut({ redirectUrl: '/' })}
      >
        Sign Out
      </button>
    {:else if clerk.auth.userId != null}
      <!-- Signed-in client actions -->
      <button class="nav-cta" onclick={handleCallAnnie}>Call Annie</button>
      <a href={`/portal/${clerk.auth.userId}`} class="portal-link">Portal</a>
      <button class="nav-signout" onclick={() => clerk.clerk?.signOut({ redirectUrl: '/' })}>Sign Out</button>
    {:else}
      <!-- Public visitor actions -->
      <button class="nav-cta" onclick={handleCallAnnie}>Call Annie</button>
      <button
        class="nav-signin"
        onclick={() => clerk.clerk?.openSignIn({
          fallbackRedirectUrl: '/dashboard',
          forceRedirectUrl: '/dashboard'
        })}
      >
        Sign In
      </button>
    {/if}
  </div>
</header>

<OrientationPanel
  open={showOrientation}
  onacknowledge={handleOrientationAcknowledge}
  onclose={handleOrientationClose}
/>

<style>
  .site-header {
    align-items: center;
    background: var(--color-panel);
    border-bottom: 1px solid var(--color-line);
    display: flex;
    gap: 2rem;
    justify-content: space-between;
    padding: 0.75rem 2rem;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .brand img {
    display: block;
    height: 2rem;
    width: auto;
  }

  nav {
    align-items: center;
    display: flex;
    gap: 1.5rem;
  }

  nav a {
    color: var(--color-muted);
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    transition: color 150ms ease;
  }

  nav a:hover {
    color: var(--color-ink);
  }

  .header-actions {
    align-items: center;
    display: flex;
    gap: 0.75rem;
  }

  .theme-toggle {
    align-items: center;
    background: none;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    color: var(--color-muted);
    cursor: pointer;
    display: inline-flex;
    height: 2rem;
    justify-content: center;
    padding: 0;
    transition: background 150ms ease, color 150ms ease;
    width: 2rem;
  }

  .theme-toggle:hover {
    background: var(--color-panel-soft);
    color: var(--color-ink);
  }

  .theme-toggle svg {
    height: 1rem;
    width: 1rem;
  }

  .nav-cta {
    background: var(--color-accent);
    border: none;
    border-radius: 999px;
    color: #fff;
    cursor: pointer;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.45rem 1rem;
    transition: background 150ms ease;
  }

  .nav-cta:hover {
    background: var(--color-accent-2);
  }

  .portal-link {
    color: var(--color-accent);
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: none;
  }

  .portal-link:hover {
    color: var(--color-accent-2);
  }

  .nav-signout,
  .nav-signin {
    background: none;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    color: var(--color-muted);
    cursor: pointer;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.45rem 1rem;
    transition: background 150ms ease, color 150ms ease;
  }

  .nav-signout:hover,
  .nav-signin:hover {
    background: var(--color-panel-soft);
    color: var(--color-ink);
  }

  .staff-badge {
    background: var(--color-accent-light);
    border-radius: 999px;
    color: var(--color-accent);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.3rem 0.75rem;
    text-transform: uppercase;
  }
</style>
