<script lang="ts">
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';
  import { onMount } from 'svelte';

  const links = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/use-cases', label: 'Use Cases' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' }
  ];

  let darkMode = false;

  onMount(() => {
    const storedTheme = localStorage.getItem('theme');
    darkMode = storedTheme
      ? storedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
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
</script>

<header class="site-header">
  <a class="brand" href="/" aria-label="Agentic AI home">
    <img src="/logo.svg" alt="Agentic AI" loading="eager" decoding="sync" fetchpriority="high" />
  </a>
  <nav aria-label="Main navigation">
    {#each links as link}
      <a href={link.href}>{link.label}</a>
    {/each}
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
    <CallAssessmentButton label="Call Annie" className="nav-cta" showError={false} />
  </div>
</header>
