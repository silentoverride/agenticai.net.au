<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { useClerkContext } from 'svelte-clerk';

  const clerk = useClerkContext();
  const receiptId = $derived(page.params.receipt_id);

  $effect(() => {
    if (clerk.auth.userId != null && receiptId) {
      goto(`/portal/${clerk.auth.userId}/receipts/${receiptId}`);
    }
  });
</script>

<p>Redirecting to your receipt…</p>
