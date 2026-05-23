<script lang="ts">
  /**
   * Card — shadcn-svelte-style card primitive.
   *
   * Sub-components:
   * - Card           (wrapper)
   * - Card.Header    (header area)
   * - Card.Title     (card title)
   * - Card.Description (card description)
   * - Card.Content   (main content)
   * - Card.Footer    (footer with actions)
   *
   * Usage:
   *   <Card>
   *     <Card.Header>
   *       <Card.Title>Title</Card.Title>
   *       <Card.Description>Description</Card.Description>
   *     </Card.Header>
   *     <Card.Content>...</Card.Content>
   *     <Card.Footer>...</Card.Footer>
   *   </Card>
   */

  import type { Snippet } from 'svelte';

  let {
    class: className = '',
    children,
    ...restProps
  }: {
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<div class="card {className}" {...restProps}>
  {#if children}{@render children()}{/if}
</div>

<style>
  .card {
    align-content: start;
    background: var(--color-panel);
    border: 1.5px solid var(--color-line);
    border-radius: var(--radius);
    display: grid;
    gap: 0;
    min-height: 10rem;
    overflow: hidden;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .card:hover {
    border-color: var(--color-accent-mid);
    box-shadow: var(--shadow-panel);
  }
</style>
