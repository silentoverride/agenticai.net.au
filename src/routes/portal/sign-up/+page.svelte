<script lang="ts">
  import { useClerkContext } from 'svelte-clerk';

  const clerk = useClerkContext();
  const user = $derived(clerk.user);
</script>

{#if user}
  <div class="welcome">
    <h1>Welcome, {user.firstName || 'to Agentic AI'}!</h1>
    <p>Your portal account is ready. Redirecting you to the dashboard...</p>
    <a href="/portal" class="cta">Go to your Dashboard →</a>
  </div>
{/if}

<style>
  .welcome {
    max-width: 480px;
    margin: 4rem auto;
    padding: 2rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    text-align: center;
  }
  .welcome h1 {
    font-size: 1.5rem;
    color: #1a1a2e;
    margin-bottom: 0.5rem;
  }
  .welcome p {
    color: #666;
    margin-bottom: 1.5rem;
  }
  .cta {
    display: inline-block;
    background: #0066ff;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
  }
  .cta:hover {
    background: #0052cc;
  }
</style>
