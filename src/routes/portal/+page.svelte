<script lang="ts">
  import { goto } from '$app/navigation';
  import { useClerkContext } from 'svelte-clerk/client';

  const clerk = useClerkContext();

  $effect(() => {
    if (clerk.auth.userId != null) {
      goto(`/portal/${clerk.auth.userId}`);
    }
  });
</script>

<p>Redirecting to your dashboard…</p>
