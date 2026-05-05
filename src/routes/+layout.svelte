<script lang="ts">
  import Navigation from '$lib/components/Navigation.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import '../styles.css';
  import { ClerkProvider } from 'svelte-clerk';
  import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
  import { PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN } from '$env/static/public';

  let { children } = $props();
</script>

<svelte:head>
  <title>Agentic AI</title>
  <meta
    name="description"
    content="Agentic AI helps small businesses find where AI tools, automation, and agents can save time first through a practical AI Business Assessment."
  />
  {#if PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN}
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={`{"token": "${PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN}"}`}
    ></script>
  {/if}
</svelte:head>

<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
  <Navigation />
  {@render children()}
  <Footer />
</ClerkProvider>
