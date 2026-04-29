<script lang="ts">
  import { env } from '$env/dynamic/public';
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
    content="Agentic AI builds practical AI agents, automation, integrations, and managed mobile proxy infrastructure."
  />
</svelte:head>

<Navigation />
{@render children()}
<RetellChatWidget
  publicKey={env.PUBLIC_RETELL_PUBLIC_KEY || ''}
  agentId={env.PUBLIC_RETELL_CHAT_AGENT_ID || ''}
  agentVersion={env.PUBLIC_RETELL_CHAT_AGENT_VERSION || ''}
  recaptchaKey={env.PUBLIC_RETELL_RECAPTCHA_KEY || ''}
/>
<Footer />
