<script lang="ts">
  import ClientProfile from '$lib/components/staff-portal/ClientProfile.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let assessmentId = $derived(data.assessmentId ?? '');
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
  followUps={data.followUps}
  meetingBrief={data.meetingBrief}
  calendlyLink={data.calendly?.calendlyLink ?? null}
  assessmentId={assessmentId}
/>
