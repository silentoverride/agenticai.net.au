<script lang="ts">
  /**
   * Dialog — shadcn-svelte-style modal dialog primitive.
   * Uses native <dialog> element for accessibility and focus management.
   *
   * Usage:
   *   <Dialog bind:open>
   *     <Dialog.Content>
   *       <Dialog.Header>
   *         <Dialog.Title>Title</Dialog.Title>
   *         <Dialog.Description>Description</Dialog.Description>
   *       </Dialog.Header>
   *       <Dialog.Footer>Actions</Dialog.Footer>
   *     </Dialog.Content>
   *   </Dialog>
   */

  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    class: className = '',
    children,
    ...restProps
  }: {
    open?: boolean;
    class?: string;
    children?: Snippet;
  } = $props();

  let dialogEl: HTMLDialogElement;

  $effect(() => {
    if (!dialogEl) return;
    if (open && !dialogEl.open) {
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
  });

  function handleClose() {
    open = false;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialogEl) {
      open = false;
    }
  }
</script>

<dialog
  bind:this={dialogEl}
  class="dialog-overlay {className}"
  onclose={handleClose}
  onclick={handleBackdropClick}
  {...restProps}
>
  <div class="dialog-panel">
    {#if children}{@render children()}{/if}
  </div>
</dialog>

<style>
  .dialog-overlay {
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: var(--radius);
    max-height: 85vh;
    max-width: 500px;
    padding: 0;
    width: 90vw;
  }

  .dialog-overlay::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .dialog-panel {
    background: var(--color-panel);
    border-radius: var(--radius);
    display: grid;
    gap: 0;
  }

  /* Reuse card section styles inside dialog */
  .dialog-panel :global(.card-header) {
    padding: 1.5rem 1.5rem 0;
  }

  .dialog-panel :global(.card-content) {
    padding: 1rem 1.5rem;
  }

  .dialog-panel :global(.card-footer) {
    border-top: 1px solid var(--color-line);
    padding: 1rem 1.5rem;
  }
</style>
