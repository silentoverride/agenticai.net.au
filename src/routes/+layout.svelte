<script lang="ts">
  import {
    PUBLIC_RETELL_CHAT_AGENT_ID,
    PUBLIC_RETELL_CHAT_AGENT_VERSION,
    PUBLIC_RETELL_PUBLIC_KEY,
    PUBLIC_RETELL_RECAPTCHA_KEY
  } from '$env/static/public';
  import Navigation from '$lib/components/Navigation.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import RetellChatWidget from '$lib/components/RetellChatWidget.svelte';
  import '../styles.css';

  let { children } = $props();
</script>

<svelte:head>
  <title>Agentic AI</title>
  <meta
    name="description"
    content="Agentic AI helps small businesses find where AI tools, automation, and agents can save time first through a practical AI Business Assessment."
  />
</svelte:head>

<Navigation />
{@render children()}
<RetellChatWidget
  publicKey={PUBLIC_RETELL_PUBLIC_KEY || ''}
  agentId={PUBLIC_RETELL_CHAT_AGENT_ID || ''}
  agentVersion={PUBLIC_RETELL_CHAT_AGENT_VERSION || ''}
  recaptchaKey={PUBLIC_RETELL_RECAPTCHA_KEY || ''}
/>
<Footer />
