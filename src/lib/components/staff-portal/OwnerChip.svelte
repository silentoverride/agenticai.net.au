<script lang="ts">
  /**
   * OwnerChip — displays a staff member's name as a compact chip.
   *
   * States: assigned, unassigned, loading, error
   */

  import type { StaffRole } from '$lib/staff-portal/dto';

  export let ownerName = '';
  export let ownerRole: StaffRole | null = null;
  export let loading = false;
  export let error = '';
  export let testId = '';

  $: hasOwner = !!ownerName;
  $: roleLabel = ownerRole === 'staff' ? 'Staff' : '';
</script>

{#if loading}
  <span class="owner-chip owner-loading" aria-busy="true" data-testid={testId || 'owner-chip'}>
    <span class="chip-icon" aria-hidden="true">⟳</span>
    <span class="chip-label">Loading...</span>
  </span>
{:else if error}
  <span class="owner-chip owner-error" role="alert" data-testid={testId || 'owner-chip'}>
    <span class="chip-icon" aria-hidden="true">⚠</span>
    <span class="chip-label">Error</span>
  </span>
{:else if hasOwner}
  <span class="owner-chip owner-assigned" data-testid={testId || 'owner-chip'}>
    <span class="chip-avatar" aria-hidden="true">{ownerName.charAt(0).toUpperCase()}</span>
    <span class="chip-label">{ownerName}</span>
    {#if roleLabel}
      <span class="chip-role">{roleLabel}</span>
    {/if}
  </span>
{:else}
  <span class="owner-chip owner-unassigned" data-testid={testId || 'owner-chip'}>
    <span class="chip-icon" aria-hidden="true">○</span>
    <span class="chip-label">Unassigned</span>
  </span>
{/if}

<style>
  .owner-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--ai-space-sm);
    padding: 2px var(--ai-space-md);
    border-radius: var(--portal-radius-sm);
    font-size: var(--ai-font-size-small-meta);
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    user-select: none;
  }

  .owner-assigned {
    color: var(--status-neutral-text);
    background: var(--status-neutral-bg);
    border: 1px solid var(--status-neutral-border);
  }

  .owner-unassigned {
    color: var(--status-disabled-text);
    background: var(--status-disabled-bg);
    border: 1px solid var(--status-disabled-border);
  }

  .owner-loading {
    color: var(--status-disabled-text);
    background: var(--status-disabled-bg);
    border: 1px dashed var(--status-disabled-border);
  }

  .owner-error {
    color: var(--status-danger-text);
    background: var(--status-danger-bg);
    border: 1px solid var(--status-danger-border);
  }

  .chip-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--status-audit-bg);
    color: var(--status-audit-text);
    font-size: 10px;
    font-weight: 700;
  }

  .chip-role {
    color: var(--status-disabled-text);
    font-weight: 400;
  }

  .chip-icon {
    font-size: var(--ai-font-size-body);
    line-height: 1;
  }

  .chip-label {
    line-height: 1;
  }
</style>
