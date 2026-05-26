<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { useClerkContext } from 'svelte-clerk/client';

  const clerk = useClerkContext();
  const reportId = $derived(page.params.report_id);

  $effect(() => {
    if (clerk.auth.userId != null && reportId) {
      goto(`/portal/${clerk.auth.userId}/reports/${reportId}`);
    }
  });
</script>

<p>Redirecting to your report…</p>
