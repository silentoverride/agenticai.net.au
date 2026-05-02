<script lang="ts">
  import { PUBLIC_CALENDLY_URL } from '$env/static/public';

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

<button class="calendly-btn" onclick={openCalendly}>
  <span class="icon">📅</span>
  <span>Book Your Complimentary 30-Min Session</span>
</button>

<style>
  .calendly-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background: linear-gradient(135deg, #0066ff, #0052cc);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,102,255,0.3);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .calendly-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0,102,255,0.4);
  }
  .icon {
    font-size: 1.5rem;
  }
</style>
