<script lang="ts">
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';
  import OrientationPanel from '$lib/components/OrientationPanel.svelte';
  import Sheet from '$lib/components/ui/sheet/Sheet.svelte';
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
  let mobileNavOpen = $state(false);

  // Close mobile menu when a link is clicked (route change handled by Svelte)
  function closeMobileNav() {
    mobileNavOpen = false;
  }

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
        <a href="/staff/users">Staff</a>
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
    <!-- Mobile menu toggle (hidden ≥941px via CSS) -->
    <button
      class="mobile-menu-toggle"
      type="button"
      aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileNavOpen}
      aria-controls="mobile-nav-sheet"
      onclick={() => (mobileNavOpen = !mobileNavOpen)}
    >
      {#if mobileNavOpen}
        <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      {/if}
    </button>
  </div>
</header>

<Sheet bind:open={mobileNavOpen} side="right">
  <div class="mobile-nav" id="mobile-nav-sheet">
    <div class="mobile-nav-header">
      <span class="mobile-nav-label">{isStaff ? 'Staff Portal' : 'Menu'}</span>
    </div>
    <nav aria-label="Mobile navigation" class="mobile-nav-links">
      {#if isStaff}
        {#each staffLinks as link}
          <a href={link.href} onclick={closeMobileNav}>{link.label}</a>
        {/each}
        {#if isAdmin}
          <a href="/staff/users" onclick={closeMobileNav}>Staff</a>
        {/if}
      {:else}
        {#each links as link}
          <a href={link.href} onclick={closeMobileNav}>{link.label}</a>
        {/each}
      {/if}
    </nav>
    <div class="mobile-nav-actions">
      {#if clerk.auth.userId != null}
        {#if !isStaff}
          <button class="button" onclick={() => { closeMobileNav(); handleCallAnnie(); }}>Call Annie</button>
          <a class="button secondary" href={`/portal/${clerk.auth.userId}`} onclick={closeMobileNav}>Portal</a>
        {/if}
        <button
          class="button"
          onclick={() => { closeMobileNav(); clerk.clerk?.signOut({ redirectUrl: '/' }); }}
        >
          Sign Out
        </button>
      {:else}
        <button class="button" onclick={() => { closeMobileNav(); handleCallAnnie(); }}>Call Annie</button>
        <button
          class="button secondary"
          onclick={() => { closeMobileNav(); clerk.clerk?.openSignIn({ fallbackRedirectUrl: '/dashboard', forceRedirectUrl: '/dashboard' }); }}
        >
          Sign In
        </button>
      {/if}
    </div>
  </div>
</Sheet>

<OrientationPanel
  open={showOrientation}
  onacknowledge={handleOrientationAcknowledge}
  onclose={handleOrientationClose}
/>
