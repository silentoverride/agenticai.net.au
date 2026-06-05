<script lang="ts">
  import { PUBLIC_CALENDLY_URL } from '$env/static/public';

  let { label = 'Book Your Complimentary 30-Min Session' }: { label?: string } = $props();

  function openCalendly() {
    if (typeof window !== 'undefined' && (window as any).Calendly) {
      (window as any).Calendly.initPopupWidget({ url: PUBLIC_CALENDLY_URL });
    } else {
      window.open(PUBLIC_CALENDLY_URL, '_blank', 'noopener,noreferrer');
    }
  }
</script>

<svelte:head>
  <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
  <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>
</svelte:head>

<button type="button" class="calendly-btn" onclick={openCalendly}>
  <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
  <span>{label}</span>
</button>

<style>
  .calendly-btn {
    align-items: center;
    background: var(--color-accent);
    border: none;
    border-radius: 999px;
    color: white;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-size: 1rem;
    font-weight: 800;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    transition: background 150ms ease, transform 150ms ease;
  }
  .calendly-btn:hover {
    background: var(--color-accent-2);
    transform: translateY(-1px);
  }
  .calendly-btn:focus-visible {
    outline: 3px solid var(--color-accent-mid);
    outline-offset: 3px;
  }
  .icon {
    flex-shrink: 0;
  }
</style>
