<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status || 'Error'} — Portal | Agentic AI</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="portal-error">
  <h1>{page.status || 500}</h1>
  <p class="message">
    {page.error?.message || 'Something went wrong in the portal.'}
  </p>
  <div class="actions">
    <a href="/portal" class="btn-primary">← Back to dashboard</a>
    <a href="/" class="btn-secondary">Home</a>
  </div>
</div>

<style>
  .portal-error {
    max-width: 480px;
    margin: 4rem auto;
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .portal-error h1 {
    font-size: 4rem;
    color: #1a1a2e;
    margin: 0;
    font-weight: 700;
  }
  .message {
    color: #666;
    font-size: 1rem;
    margin: 1rem 0 2rem;
  }
  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
  .btn-primary {
    display: inline-block;
    background: #0066ff;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
  }
  .btn-secondary {
    display: inline-block;
    background: #f0f0f0;
    color: #1a1a2e;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
  }
</style>
