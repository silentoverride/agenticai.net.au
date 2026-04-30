<script lang="ts">
  import { callStatus, toggleCall } from '$lib/stores/call';
</script>

<div class="chatbot">
  <button
    class="chat-launcher{$callStatus === 'active' ? ' call-active' : ''}"
    type="button"
    disabled={$callStatus === 'connecting'}
    aria-label={$callStatus === 'active' ? 'End call with Annie' : 'Call Annie'}
    onclick={() => toggleCall('website-float-widget')}
  >
    {#if $callStatus === 'active'}
      <svg class="call-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.13 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.01 9.96a16 16 0 0 0 3.67 3.35" />
        <line x1="23" y1="1" x2="1" y2="23" />
      </svg>
    {:else}
      <svg class="call-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.01 9.96a16 16 0 0 0 6.03 6.03l1.82-1.25a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    {/if}
  </button>
</div>
