<script lang="ts">
  import ClientProfile from '$lib/components/staff-portal/ClientProfile.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>
    {data.profile?.profile?.businessName ?? 'Client Profile'} — Staff Portal
  </title>
</svelte:head>

<ClientProfile
  profile={data.profile}
  whatMattersNow={data.whatMattersNow}
  linkedReports={data.linkedReports}
  linkedFindings={data.linkedFindings}
  auditHistory={data.auditHistory}
  activityHistory={data.activityHistory}
/>
