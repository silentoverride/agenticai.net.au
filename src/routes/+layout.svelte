<script lang="ts">
  import Navigation from '$lib/components/Navigation.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import '../styles.css';
  import ClerkProvider from '$lib/components/ClerkProvider.svelte';
  import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
  import { PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN } from '$env/static/public';

  let { children } = $props();
</script>

<svelte:head>
  <title>Agentic AI</title>
  <meta
    name="description"
    content="Agentic AI helps small businesses find where AI can save time through a 20–30 minute Annie conversation, 48-hour report, and optional no-charge consultation."
  />
  {#if PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN}
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={`{"token": "${PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN}"}`}
    ></script>
  {/if}
</svelte:head>

<ClerkProvider
  publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}
  signInFallbackRedirectUrl="/dashboard"
  signInForceRedirectUrl="/dashboard"
  signUpFallbackRedirectUrl="/dashboard"
  signUpForceRedirectUrl="/dashboard"
>
  <Navigation />
  {@render children()}
  <Footer />
</ClerkProvider>
