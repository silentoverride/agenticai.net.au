<script lang="ts">
  import { useClerkContext } from 'svelte-clerk';
  import { onMount } from 'svelte';

  const clerk = useClerkContext();

  let name = $state('');
  let phone = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let message = $state('');
  let errorMsg = $state('');

  onMount(async () => {
    try {
      const res = await fetch('/api/portal/user');
      if (res.ok) {
        const data = await res.json() as {
          name?: string;
          phone?: string;
          email?: string;
          role?: string;
          created_at?: string;
        };
        name = data.name || clerk.user?.fullName || '';
        phone = data.phone || '';
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      loading = false;
    }
  });

  async function saveProfile() {
    saving = true;
    message = '';
    errorMsg = '';
    try {
      const res = await fetch('/api/portal/user', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, phone })
      });
      if (res.ok) {
        message = 'Profile saved successfully.';
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Something went wrong';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Profile — Portal | Agentic AI</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="portal-page">
  <h1>Profile</h1>

  {#if loading}
    <p>Loading profile...</p>
  {:else}
    <form class="profile-card" onsubmit={(e) => { e.preventDefault(); saveProfile(); }}>
      <div class="field">
        <label for="name">Full name</label>
        <input
          id="name"
          type="text"
          bind:value={name}
          placeholder="Your full name"
        />
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          value={clerk.user?.emailAddresses?.[0]?.emailAddress || ''}
          disabled
        />
        <span class="hint">Email is managed through your sign-in provider.</span>
      </div>

      <div class="field">
        <label for="phone">Phone</label>
        <input
          id="phone"
          type="tel"
          bind:value={phone}
          placeholder="Your phone number"
        />
      </div>

      {#if message}
        <p class="success">{message}</p>
      {/if}
      {#if errorMsg}
        <p class="error">{errorMsg}</p>
      {/if}

      <button type="submit" class="btn-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>

    <div class="profile-links">
      <a href="/portal" class="btn-secondary">← Back to dashboard</a>
    </div>
  {/if}
</div>

<style>
  .portal-page h1 {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
    color: #1a1a2e;
  }
  .profile-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    max-width: 480px;
  }
  .field {
    margin-bottom: 1.25rem;
  }
  .field label {
    display: block;
    font-weight: 500;
    font-size: 0.875rem;
    color: #1a1a2e;
    margin-bottom: 0.5rem;
  }
  .field input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-family: inherit;
    background: white;
  }
  .field input:disabled {
    background: #f8f9fa;
    color: #888;
  }
  .field input:focus {
    outline: none;
    border-color: #0066ff;
    box-shadow: 0 0 0 3px rgba(0,102,255,0.15);
  }
  .hint {
    display: block;
    font-size: 0.75rem;
    color: #888;
    margin-top: 0.25rem;
  }
  .btn-primary {
    display: inline-block;
    background: #0066ff;
    color: white;
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    border: none;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn-primary:hover:not(:disabled) {
    background: #0052cc;
  }
  .btn-secondary {
    display: inline-block;
    background: #f0f0f0;
    color: #1a1a2e;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
  }
  .profile-links {
    margin-top: 1.5rem;
  }
  .success {
    color: #2e7d32;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
  .error {
    color: #c62828;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
</style>
