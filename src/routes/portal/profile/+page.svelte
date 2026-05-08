<script lang="ts">
  import { goto } from '$app/navigation';
  import { useClerkContext } from 'svelte-clerk';

  const clerk = useClerkContext();

  $effect(() => {
    if (clerk.auth.userId != null) {
      goto(`/portal/${clerk.auth.userId}/profile`);
    }
  });
</script>

<p>Redirecting to your profile…</p>
