<script lang="ts">
  /**
   * Sheet — shadcn-svelte-style slide-in panel primitive.
   * Slides in from the right side with a backdrop overlay.
   *
   * Usage:
   *   <Sheet bind:open side="right">
   *     <Sheet.Content>
   *       <Sheet.Header>
   *         <Sheet.Title>Title</Sheet.Title>
   *       </Sheet.Header>
   *       <Sheet.Body>Content...</Sheet.Body>
   *     </Sheet.Content>
   *   </Sheet>
   */

  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    side = 'right' as 'left' | 'right',
    class: className = '',
    children,
    ...restProps
  }: {
    open?: boolean;
    side?: 'left' | 'right';
    class?: string;
    children?: Snippet;
  } = $props();

  let sheetEl = $state<HTMLDivElement>();
  let mounted = $state(false);

  $effect(() => {
    if (open) {
      mounted = true;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // Delay unmount for exit animation
      if (mounted) {
        const t = setTimeout(() => { mounted = false; }, 200);
        return () => clearTimeout(t);
      }
    }
  });

  function close() {
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }
</script>

{#if mounted || open}
  <div
    class="sheet-container {className}"
    class:sheet-open={open}
    role="dialog"
    aria-modal="true"
    onkeydown={handleKeydown}
    {...restProps}
  >
    <div class="sheet-backdrop" class:sheet-backdrop-open={open} onclick={close} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } }} role="button" tabindex="-1" aria-label="Close"></div>

    <!-- Panel -->
    <div
      bind:this={sheetEl}
      class="sheet-panel sheet-{side}"
      class:sheet-panel-open={open}
    >
      {#if children}{@render children()}{/if}
    </div>
  </div>
{/if}

<style>
  .sheet-container {
    inset: 0;
    position: fixed;
    z-index: 60;
  }

  .sheet-backdrop {
    background: rgba(0, 0, 0, 0);
    inset: 0;
    position: fixed;
    transition: background 200ms ease;
  }

  .sheet-backdrop-open {
    background: rgba(0, 0, 0, 0.5);
  }

  .sheet-panel {
    background: var(--color-panel);
    display: grid;
    gap: 0;
    grid-template-rows: auto 1fr auto;
    height: 100%;
    max-width: 400px;
    overflow-y: auto;
    position: fixed;
    top: 0;
    transition: transform 200ms ease;
    width: 85vw;
    z-index: 61;
  }

  .sheet-right {
    right: 0;
    transform: translateX(100%);
  }

  .sheet-left {
    left: 0;
    transform: translateX(-100%);
  }

  .sheet-panel-open {
    transform: translateX(0);
  }

  .sheet-panel :global(.card-header) {
    padding: 1.5rem;
  }

  .sheet-panel :global(.card-content) {
    padding: 0 1.5rem;
    overflow-y: auto;
  }

  .sheet-panel :global(.card-footer) {
    border-top: 1px solid var(--color-line);
    padding: 1rem 1.5rem;
  }
</style>
