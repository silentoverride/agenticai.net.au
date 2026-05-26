<script lang="ts">
  /**
   * ClientProfile — Desktop-first composed Client Profile layout.
   *
   * Renders all sections from Epics 3.1–3.4 and 4.1–4.2 in a coherent view:
   *   - Client info header + What Matters Now panel
   *   - Linked Reports + Linked Gate Findings (desktop: 2-column)
   *   - Follow-ups with editor (Epic 4)
   *   - Recent Activity + Audit History
   *
   * Uses only repo-owned CSS custom properties. No Tailwind, shadcn, or kits.
   */

  import {
    REPORT_STATE_PRESENTATION,
    GATE_FINDING_STATE_PRESENTATION,
    BLOCKED_REASON_PRESENTATION,
    RISK_SIGNAL_PRESENTATION
  } from '$lib/staff-portal/dto';
  import type {
    StaffClientProfileResultDto,
    StaffWhatMattersNowDto,
    StaffLinkedReportDto,
    StaffLinkedGateFindingDto,
    StaffAuditEventDto,
    StaffActivityEventDto,
    StaffFollowUpDto,
    StaffMeetingBriefDto,
    MeetingBriefStalenessWarning,
    PrimaryTreatment,
    StaffCommercialNextStepDto
  } from '$lib/staff-portal/dto';
  import FollowUpEditor from './FollowUpEditor.svelte';
  import MeetingBriefPanel from './MeetingBriefPanel.svelte';
  import CommercialNextStepPanel from './CommercialNextStepPanel.svelte';

  let {
    profile,
    whatMattersNow,
    linkedReports,
    linkedFindings,
    auditHistory,
    activityHistory,
    followUps = [],
    meetingBrief = null,
    staleWarning = null,
    calendlyLink = null,
    assessmentId = ''
  }: {
    profile: StaffClientProfileResultDto;
    whatMattersNow: StaffWhatMattersNowDto | null;
    linkedReports: StaffLinkedReportDto[];
    linkedFindings: StaffLinkedGateFindingDto[];
    auditHistory: StaffAuditEventDto[];
    activityHistory: StaffActivityEventDto[];
    followUps?: StaffFollowUpDto[];
    meetingBrief?: StaffMeetingBriefDto | null;
    staleWarning?: MeetingBriefStalenessWarning | null;
    calendlyLink?: string | null;
    assessmentId?: string;
    commercialStep?: StaffCommercialNextStepDto | null;
  } = $props();

  // ── Helpers ──

  function formatDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }

  function formatTime(iso: string): string {
    try { return new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  }

  function treatmentLabel(t: PrimaryTreatment): string {
    const labels: Record<string, string> = {
      blocked: 'Blocked',
      requires_decision: 'Requires Decision',
      at_risk: 'At Risk',
      draft_stale: 'Draft / Stale',
      ready: 'Ready',
      completed: 'Completed',
      all_clear: 'All Clear'
    };
    return labels[t] ?? t;
  }

  // ── Follow-up state ──

  let showFollowUpForm = $state(false);
  let followUpList = $state<StaffFollowUpDto[]>([...followUps]);

  async function handleCreateFollowUp(data: {
    title: string; description: string | null; ownerId: string | null;
    dueDate: string | null; source: string; clientVisiblePromise: boolean;
    consequenceOfInaction: string | null; notes: string | null;
  }) {
    const res = await fetch(`/api/operator/assessments/${assessmentId}/follow-ups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const result: { success: boolean; followUp?: StaffFollowUpDto } = await res.json();
      if (result.success && result.followUp) {
        followUpList = [result.followUp, ...followUpList];
        showFollowUpForm = false;
      }
    }
  }

  async function handleUpdateFollowUpStatus(followUpId: string, actionData: {
    action: 'completeFollowUp' | 'deferFollowUp' | 'reassignFollowUp';
    reason?: string; newOwnerId?: string;
  }) {
    const body: Record<string, unknown> = {
      action: actionData.action,
      idempotencyKey: crypto.randomUUID()
    };
    if (actionData.reason) body.reason = actionData.reason;
    if (actionData.newOwnerId) body.newOwnerId = actionData.newOwnerId;

    const res = await fetch(`/api/operator/assessments/${assessmentId}/follow-ups/${followUpId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const result: { success: boolean; followUp?: StaffFollowUpDto } = await res.json();
      if (result.success && result.followUp) {
        followUpList = followUpList.map((f) =>
          f.id === followUpId ? result.followUp! : f
        );
      }
    }
  }

  // ── Unsaved-changes guard ──

  $effect(() => {
    if (showFollowUpForm) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'You have unsaved follow-up changes.';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  });
</script>

<div class="client-profile" data-testid="client-profile">
  <!-- Breadcrumbs -->
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li><a href="/operator/assessments">Command Console</a></li>
      <li aria-current="page">
        {#if profile.profile}
          {profile.profile.businessName}
        {:else}
          Client Profile
        {/if}
      </li>
    </ol>
  </nav>

  {#if !profile.hasData}
    <!-- Not found state -->
    <div class="section empty-state" data-testid="profile-not-found">
      <h2>Client Not Found</h2>
      <p>No profile data is available for this assessment.</p>
      <a href="/operator/assessments" class="btn-link">Return to Command Console</a>
    </div>
  {:else if profile.profile}
    {@const p = profile.profile}

    <!-- Header -->
    <header class="profile-header" data-testid="profile-header">
      <div class="header-primary">
        <h1 class="client-name">{p.businessName}</h1>
        {#if p.journeyStage}
          <span class="journey-badge">{p.journeyStage}</span>
        {/if}
      </div>
      <div class="header-meta">
        {#if p.ownerName}
          <span class="meta-item">
            <span class="meta-label">Owner:</span> {p.ownerName}
          </span>
        {/if}
        {#if p.riskFlags.length > 0}
          <span class="meta-item">
            <span class="meta-label">Risk:</span>
            {#each p.riskFlags as flag}
              <span class="flag flag-risk">{flag}</span>
            {/each}
          </span>
        {/if}
        {#if p.valueFlags.length > 0}
          <span class="meta-item">
            <span class="meta-label">Value:</span>
            {#each p.valueFlags as flag}
              <span class="flag flag-value">{flag}</span>
            {/each}
          </span>
        {/if}
        {#if profile.degradedFields.length > 0}
          <span class="degraded-note" data-testid="degraded-fields-note">
            ⚠ Some data may be incomplete
          </span>
        {/if}
      </div>
    </header>

    <!-- What Matters Now -->
    <section class="section wmn-section" data-testid="wmn-section" aria-label="What Matters Now">
      {#if whatMattersNow}
        <h2 class="section-title">What Matters Now</h2>
        <div class="wmn-card">
          <div class="wmn-treatment treatment-{whatMattersNow.primaryTreatment}">
            <span class="treatment-badge">{treatmentLabel(whatMattersNow.primaryTreatment)}</span>
          </div>
          {#if whatMattersNow.blocker.blockerName}
            <p class="wmn-blocker">
              <strong>Blocker:</strong> {whatMattersNow.blocker.blockerName}
              {#if whatMattersNow.blocker.blockerType}
                <span class="wmn-domain">({whatMattersNow.blocker.blockerType})</span>
              {/if}
            </p>
          {/if}
          {#if whatMattersNow.nextValidAction}
            <p class="wmn-action">
              <strong>Next action:</strong> {whatMattersNow.nextValidAction}
            </p>
          {/if}
          {#if whatMattersNow.ownerName}
            <p class="wmn-owner"><strong>Owner:</strong> {whatMattersNow.ownerName}</p>
          {/if}
          {#if whatMattersNow.dueDate}
            <p class="wmn-due"><strong>Due:</strong> {whatMattersNow.dueDate}</p>
          {/if}
          {#if whatMattersNow.consequenceOfInaction}
            <p class="wmn-consequence">
              <strong>If ignored:</strong> {whatMattersNow.consequenceOfInaction}
            </p>
          {/if}
        </div>
      {/if}
    </section>

    <!-- Desktop Two-Column Content -->
    <div class="content-grid">
      <!-- Column 1: Linked Reports -->
      <section class="section" data-testid="linked-reports-section" aria-label="Linked Reports">
        <h2 class="section-title">
          Reports
          {#if linkedReports.length > 0}
            <span class="count-badge">{linkedReports.length}</span>
          {/if}
        </h2>
        {#if linkedReports.length === 0}
          <p class="empty-note">No reports linked to this client.</p>
        {:else}
          <div class="item-list">
            {#each linkedReports as report (report.reportId)}
              {@const pres = REPORT_STATE_PRESENTATION[report.reportState]}
              <div class="item-card" data-testid="linked-report-{report.reportId}">
                <div class="item-header">
                  <span class="item-title">{report.title}</span>
                  <span class="state-badge state-{report.reportState}" data-testid={pres.testId}>
                    {pres.label}
                  </span>
                </div>
                <div class="item-meta">
                  {#if report.artifactVersion}
                    <span class="item-detail">v{report.artifactVersion}</span>
                  {/if}
                  <span class="item-detail">{formatDate(report.createdAt)}</span>
                  {#if report.hasArtifacts}
                    <span class="item-success">Artifact available</span>
                  {:else}
                    <span class="item-warning">No artifact</span>
                  {/if}
                </div>
                {#if report.degradedFields.length > 0}
                  <p class="item-degraded">Degraded: {report.degradedFields.join(', ')}</p>
                {/if}
                <a href={report.reviewWorkspaceRoute} class="item-action">
                  Open in Review Workspace →
                </a>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <!-- Column 2: Linked Gate Findings + Activity/Audit -->
      <div class="right-column">
        <!-- Linked Gate Findings -->
        <section class="section" data-testid="linked-findings-section" aria-label="Gate Findings">
          <h2 class="section-title">
            Gate Findings
            {#if linkedFindings.length > 0}
              <span class="count-badge">{linkedFindings.length}</span>
            {/if}
          </h2>
          {#if linkedFindings.length === 0}
            <p class="empty-note">No gate findings for this client.</p>
          {:else}
            <div class="item-list">
              {#each linkedFindings as finding (finding.findingId)}
                {@const statePres = GATE_FINDING_STATE_PRESENTATION[finding.decisionState]}
                <div class="item-card finding" data-testid="linked-finding-{finding.findingId}">
                  <div class="item-header">
                    <span class="item-title">{finding.type}</span>
                    <span class="state-badge state-{finding.decisionState}" data-testid={statePres.testId}>
                      {statePres.label}
                    </span>
                  </div>
                  <div class="item-meta">
                    {#if finding.severity}
                      <span class="item-detail severity-{finding.severity}">
                        {finding.severity}
                      </span>
                    {/if}
                    <span class="item-detail">Verdict: {finding.verdict}</span>
                    {#if finding.confidence !== null}
                      <span class="item-detail">Confidence: {(finding.confidence * 100).toFixed(0)}%</span>
                    {/if}
                    {#if finding.isBlocking}
                      <span class="item-blocked">Blocking</span>
                    {/if}
                  </div>
                  {#if finding.reasoning}
                    <p class="finding-reasoning">{finding.reasoning}</p>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </section>

        <!-- Activity & Audit History -->
        <section class="section" data-testid="activity-section" aria-label="Recent Activity">
          <h2 class="section-title">Recent Activity</h2>
          {#if activityHistory.length === 0}
            <p class="empty-note">No recent activity recorded.</p>
          {:else}
            <div class="activity-list">
              {#each activityHistory.slice(0, 10) as activity (activity.activityId)}
                <div class="activity-item" data-testid="activity-{activity.activityId}">
                  <div class="activity-marker source-{activity.sourceDomain}" aria-hidden="true"></div>
                  <div class="activity-body">
                    <p class="activity-summary">{activity.summary}</p>
                    <div class="activity-meta">
                      <span class="activity-time">{formatTime(activity.timestamp)}</span>
                      {#if activity.actor}
                        <span class="activity-actor">{activity.actor}</span>
                      {/if}
                      <span class="activity-source">{activity.sourceDomain}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </section>

        <!-- Audit History -->
        <section class="section" data-testid="audit-history-section" aria-label="Audit History">
          <h2 class="section-title">
            Audit History
            {#if auditHistory.length > 0}
              <span class="count-badge">{auditHistory.length}</span>
            {/if}
          </h2>
          {#if auditHistory.length === 0}
            <p class="empty-note">No audit events recorded for this client.</p>
          {:else}
            <div class="audit-list">
              {#each auditHistory.slice(0, 20) as event (event.eventId)}
                <div class="audit-item" data-testid="audit-event-{event.eventId}">
                  <div class="audit-header">
                    <span class="audit-type">{event.eventType.replace(/_/g, ' ')}</span>
                    <span class="audit-time">{formatTime(event.timestamp)}</span>
                  </div>
                  <div class="audit-body">
                    <span class="audit-detail">
                      {event.affectedEntityType}: {event.newState}
                      {#if event.previousState}
                        (from {event.previousState})
                      {/if}
                    </span>
                    {#if event.reasonOrNote}
                      <p class="audit-note">{event.reasonOrNote}</p>
                    {/if}
                    <span class="audit-actor">{event.actor}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </section>
      </div>
    </div>

    <!-- Placeholder Sections for Epics 4 & 5 -->
    <div class="placeholder-grid">
      <section class="section" data-testid="followups-section" aria-label="Follow-ups">
        <div class="section-header">
          <h2 class="section-title">Follow-ups</h2>
          <button
            type="button"
            class="btn btn-sm btn-primary"
            onclick={() => showFollowUpForm = true}
            data-testid="btn-add-follow-up"
            tabindex="0"
          >+ Add Follow-up</button>
        </div>

        {#if showFollowUpForm}
          <FollowUpEditor
            followUp={null}
            onSave={handleCreateFollowUp}
            onCancel={() => showFollowUpForm = false}
            onUpdateStatus={() => {}}
            assessmentId={assessmentId}
          />
        {/if}

        {#if followUpList.length === 0}
          <p class="empty-note">No follow-ups yet.</p>
        {:else}
          <div class="follow-up-list">
            {#each followUpList as fu (fu.id)}
              <FollowUpEditor
                followUp={fu}
                onSave={() => {}}
                onCancel={() => {}}
                onUpdateStatus={(d) => handleUpdateFollowUpStatus(fu.id, d)}
                assessmentId={assessmentId}
              />
            {/each}
          </div>
        {/if}
      </section>

      <MeetingBriefPanel
        {meetingBrief}
        {staleWarning}
        {calendlyLink}
        {assessmentId}
      />

      <CommercialNextStepPanel
        commercialStep={commercialStep ?? null}
        {assessmentId}
      />
    </div>

    <!-- Footer Navigation -->
    <footer class="profile-footer">
      <a href="/operator/assessments" class="btn-link">← Return to Command Console</a>
    </footer>
  {/if}
</div>



<style>
  /* ── Layout ── */
  .client-profile {
    max-width: var(--max-w);
    margin: 0 auto;
    padding: var(--pad-h);
    padding-top: 1.5rem;
  }

  .breadcrumbs ol {
    display: flex;
    gap: 0.5rem;
    list-style: none;
    margin: 0 0 1.5rem;
    padding: 0;
    font-size: 0.8125rem;
    color: var(--color-muted);
  }

  .breadcrumbs a {
    color: var(--color-accent);
    text-decoration: none;
  }

  .breadcrumbs a:hover {
    text-decoration: underline;
  }

  .breadcrumbs li + li::before {
    content: '/';
    margin-right: 0.5rem;
    color: var(--color-muted-2);
  }

  .breadcrumbs li[aria-current] {
    color: var(--color-ink);
    font-weight: 600;
  }

  /* ── Header ── */
  .profile-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-line);
  }

  .header-primary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .client-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-ink);
    margin: 0;
  }

  .journey-badge {
    background: var(--color-accent-light);
    color: var(--color-accent);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: var(--radius-sm);
  }

  .header-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-muted);
  }

  .meta-item { display: flex; align-items: center; gap: 0.25rem; }
  .meta-label { font-weight: 600; color: var(--color-ink-2); }

  .flag {
    font-size: 0.6875rem;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }

  .flag-risk { background: #fef2f2; color: #b91c1c; }
  .flag-value { background: #f0fdf4; color: #15803d; }
  .degraded-note { font-size: 0.75rem; color: var(--color-warm); font-style: italic; }

  /* ── Sections ── */
  .section {
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-ink);
    margin: 0 0 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .count-badge {
    background: var(--color-panel-soft);
    color: var(--color-muted);
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
  }

  .empty-note {
    color: var(--color-muted);
    font-size: 0.8125rem;
    font-style: italic;
    padding: 0.75rem 0;
  }

  /* ── What Matters Now ── */
  .wmn-card {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    padding: 1rem;
  }

  .wmn-card p { margin: 0.25rem 0; font-size: 0.875rem; }
  .wmn-card strong { color: var(--color-ink-2); }
  .wmn-domain { color: var(--color-muted); font-size: 0.75rem; }

  .treatment-badge {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.2rem 0.6rem;
    border-radius: var(--radius-sm);
  }

  .treatment-blocked .treatment-badge { background: #fef2f2; color: #b91c1c; }
  .treatment-requires_decision .treatment-badge { background: #fffbeb; color: #b45309; }
  .treatment-at_risk .treatment-badge { background: #fefce8; color: #a16207; }
  .treatment-draft_stale .treatment-badge { background: var(--color-panel-soft); color: var(--color-muted); }
  .treatment-ready .treatment-badge { background: #f0fdf4; color: #15803d; }
  .treatment-completed .treatment-badge { background: var(--color-accent-light); color: var(--color-accent); }
  .treatment-all_clear .treatment-badge { background: var(--color-accent-light); color: var(--color-accent); }

  /* ── Content Grid (Desktop 2-column) ── */
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .right-column {
    display: flex;
    flex-direction: column;
  }

  /* ── Item Cards ── */
  .item-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .item-card {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    padding: 0.875rem;
  }

  .item-card.finding {
    border-left: 3px solid var(--color-line);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
  }

  .item-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-ink);
  }

  .state-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-sm);
  }

  .state-generated, .state-open { background: var(--color-panel-soft); color: var(--color-muted); }
  .state-approved, .state-resolved { background: #f0fdf4; color: #15803d; }
  .state-inReview { background: var(--color-accent-light); color: var(--color-accent); }
  .state-rejected { background: #fef2f2; color: #b91c1c; }
  .state-conflict { background: #fef2f2; color: #b91c1c; }
  .state-queued { background: var(--color-panel-soft); color: var(--color-muted); }
  .state-generating { background: #fffbeb; color: #b45309; }
  .state-escalated { background: #fffbeb; color: #b45309; }
  .state-escalatedFurther { background: #fffbeb; color: #b45309; }

  .item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-muted);
    margin: 0.25rem 0;
  }

  .item-success { color: #15803d; }
  .item-warning { color: #b45309; }
  .item-blocked { color: #b91c1c; font-weight: 600; }
  .item-degraded { font-size: 0.75rem; color: var(--color-warm); font-style: italic; margin: 0.25rem 0 0; }

  .item-action {
    display: inline-block;
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    color: var(--color-accent);
    text-decoration: none;
  }

  .item-action:hover { text-decoration: underline; }

  .finding-reasoning {
    font-size: 0.8125rem;
    color: var(--color-muted);
    margin: 0.35rem 0 0;
    line-height: 1.5;
  }

  /* ── Activity ── */
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .activity-item {
    display: flex;
    gap: 0.5rem;
  }

  .activity-marker {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 0.4rem;
    flex-shrink: 0;
  }

  .source-pipeline { background: var(--color-accent); }
  .source-gate { background: var(--color-warm); }
  .source-human_review { background: var(--color-success); }
  .source-assessment { background: var(--color-muted); }

  .activity-body { flex: 1; }
  .activity-summary { font-size: 0.8125rem; color: var(--color-ink); margin: 0; line-height: 1.4; }
  .activity-meta { display: flex; gap: 0.5rem; font-size: 0.6875rem; color: var(--color-muted); margin-top: 0.15rem; }

  /* ── Audit ── */
  .audit-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .audit-item {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    padding: 0.6rem 0.75rem;
  }

  .audit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .audit-type {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
    color: var(--color-ink-2);
  }

  .audit-time { font-size: 0.6875rem; color: var(--color-muted); }
  .audit-body { font-size: 0.75rem; color: var(--color-muted); }
  .audit-detail { color: var(--color-ink); }
  .audit-note { font-style: italic; margin: 0.15rem 0; color: var(--color-muted); }
  .audit-actor { font-family: monospace; font-size: 0.6rem; color: var(--color-muted-2); }

  /* ── Follow-up section ── */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .btn-sm {
    padding: 0.25rem 0.625rem;
    font-size: 0.8125rem;
    font-weight: 500;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-sm:focus-visible {
    outline: 2px solid var(--color-focus, #3b82f6);
    outline-offset: 2px;
  }

  .btn-sm.btn-primary {
    background: var(--color-primary, #1d4ed8);
    color: #fff;
  }

  .btn-sm.btn-primary:hover { opacity: 0.9; }

  .follow-up-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* ── Meeting Brief ── */
  .meeting-brief-card {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    padding: 0.875rem;
  }

  .mb-field {
    font-size: 0.8125rem;
    margin: 0.35rem 0;
    line-height: 1.5;
  }

  .mb-sensitive {
    border-left: 3px solid var(--color-warm);
    padding-left: 0.5rem;
    color: var(--color-muted);
  }

  .mb-checklist {
    font-family: inherit;
    font-size: 0.8125rem;
    white-space: pre-wrap;
    margin: 0.25rem 0 0;
    padding: 0.5rem;
    background: var(--color-panel-soft);
    border-radius: var(--radius-sm);
  }

  .mb-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-line);
    font-size: 0.75rem;
  }

  .mb-timestamp {
    color: var(--color-muted);
  }

  .calendly-link {
    font-size: 0.8125rem;
    color: var(--color-accent);
    text-decoration: none;
    white-space: nowrap;
  }

  .calendly-link:hover {
    text-decoration: underline;
  }

  .mb-stale-warning {
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
    font-size: 0.8125rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-sm);
    margin-bottom: 0.75rem;
  }

  /* ── Placeholders ── */
  .placeholder-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .section.placeholder {
    background: var(--color-panel-soft);
    border: 1px dashed var(--color-line);
    border-radius: var(--radius);
    padding: 1rem;
    text-align: center;
  }

  .placeholder-text {
    font-size: 0.8125rem;
    color: var(--color-muted);
    margin: 0.5rem 0;
  }

  .placeholder-badge {
    font-size: 0.6875rem;
    background: var(--color-panel);
    color: var(--color-muted-2);
    padding: 0.2rem 0.6rem;
    border-radius: var(--radius-sm);
  }

  /* ── Footer ── */
  .profile-footer {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-line);
  }

  .btn-link {
    font-size: 0.875rem;
    color: var(--color-accent);
    text-decoration: none;
  }

  .btn-link:hover { text-decoration: underline; }

  /* ── Empty State ── */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
  }

  .empty-state h2 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .empty-state p {
    margin-bottom: 1rem;
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .placeholder-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .client-profile {
      padding: 1rem;
    }

    .profile-header {
      flex-direction: column;
      gap: 0.5rem;
    }

    .header-primary {
      flex-direction: column;
      align-items: flex-start;
    }

    .header-meta {
      flex-direction: column;
      gap: 0.25rem;
    }

    /* Mobile warning is handled by the existing review workspace guard */
  }
</style>
