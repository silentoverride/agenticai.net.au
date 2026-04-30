<script lang="ts">
  import { onDestroy } from 'svelte';

  export let label = 'Call for Assessment';
  export let className = 'button primary';
  export let showError = true;

  let retellWebClient: any;
  let status: 'idle' | 'connecting' | 'active' | 'error' = 'idle';
  let errorMessage = '';

  $: buttonLabel =
    status === 'connecting' ? 'Connecting to Annie...' : status === 'active' ? 'End Call' : label;

  async function toggleCall() {
    if (status === 'active') {
      retellWebClient?.stopCall();
      status = 'idle';
      return;
    }

    if (status === 'connecting') return;

    status = 'connecting';
    errorMessage = '';

    try {
      const response = await fetch('/api/create-retell-web-call', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          source: 'website-call-assessment-button'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.accessToken) {
        throw new Error(data.message || 'Unable to connect to Annie.');
      }

      const { RetellWebClient } = await import('retell-client-js-sdk');
      retellWebClient = new RetellWebClient();

      retellWebClient.on('call_started', () => {
        status = 'active';
      });

      retellWebClient.on('call_ended', () => {
        status = 'idle';
      });

      retellWebClient.on('error', (error: Error) => {
        console.error('Retell web call error:', error);
        retellWebClient?.stopCall();
        status = 'error';
        errorMessage = 'The call could not continue. Please try again.';
      });

      await retellWebClient.startCall({
        accessToken: data.accessToken,
        sampleRate: 24000
      });

      status = 'active';
    } catch (error) {
      console.error('Unable to start Annie voice call:', error);
      status = 'error';
      errorMessage =
        error instanceof Error ? error.message : 'Unable to connect to Annie. Please try again.';
    }
  }

  onDestroy(() => {
    if (status === 'active' || status === 'connecting') {
      retellWebClient?.stopCall();
    }
  });
</script>

<span class="retell-call-control">
  <button class={className} type="button" disabled={status === 'connecting'} onclick={toggleCall}>
    {buttonLabel}
  </button>
  {#if showError && errorMessage}
    <small class="retell-call-error" aria-live="polite">{errorMessage}</small>
  {/if}
</span>
