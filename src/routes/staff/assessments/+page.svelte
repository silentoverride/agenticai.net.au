<script lang="ts">
  /**
   * /staff/assessments — Staff Portal Command Console entry point.
   *
   * Displays prioritized operational work items through the CommandConsole
   * component, driven by the getCommandCenterItems read model.
   */

  import CommandConsole from '$lib/components/staff-portal/command-console.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let items = $derived(data.items);
  let total = $derived(data.total);
  let hasMore = $derived(data.hasMore);
  let loading = $state(false);
  let error = $state('');

  async function refresh() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/staff/assessments?limit=50&offset=0');
      if (res.ok) {
        window.location.href = '/staff/assessments';
      } else {
        error = 'Failed to refresh';
      }
    } catch {
      error = 'Could not refresh data';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Command Console — Staff Portal</title>
</svelte:head>

<div class="console-page">
  <CommandConsole
    {items}
    {total}
    {hasMore}
    {loading}
    {error}
    onRefresh={refresh}
  />
</div>

<style>
  .console-page {
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }
</style>
