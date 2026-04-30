<script lang="ts">
  import { env as publicEnv } from '$env/dynamic/public';
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
  publicKey={publicEnv.PUBLIC_RETELL_PUBLIC_KEY || ''}
  voiceAgentId={publicEnv.PUBLIC_RETELL_VOICE_AGENT_ID || ''}
  phoneNumber={publicEnv.PUBLIC_RETELL_CALLBACK_PHONE_NUMBER || ''}
  agentVersion={publicEnv.PUBLIC_RETELL_VOICE_AGENT_VERSION || ''}
  countries={publicEnv.PUBLIC_RETELL_CALLBACK_COUNTRIES || 'AU'}
  recaptchaKey={publicEnv.PUBLIC_RETELL_RECAPTCHA_KEY || ''}
/>
<Footer />
