<script lang="ts">
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';
  import OrientationPanel from '$lib/components/OrientationPanel.svelte';
  import AnnieChat from '$lib/components/AnnieChat.svelte';
  import SummaryReview from '$lib/components/SummaryReview.svelte';
  import ResumePrompt from '$lib/components/ResumePrompt.svelte';
  import ServiceGrid from '$lib/components/ServiceGrid.svelte';
  import TestimonialCard from '$lib/components/TestimonialCard.svelte';
  import FaqAccordion from '$lib/components/FaqAccordion.svelte';
  import { metrics, reportSections, useCases, upsells, testimonials, faqItems } from '$lib/content';
  import type { ChatMessage } from '$lib/assessment/intake-script';

  type IntakePhase = 'idle' | 'orientation' | 'chat' | 'review' | 'queued' | 'resume';

  let phase = $state<IntakePhase>('idle');
  let sessionId = $state('');
  let chatSummary = $state<Array<{ question: string; answer: string; followUpAnswer?: string }>>([]);
  let chatSavedState = $state<AnnieChatSavedState | null>(null);
  let customerName = $state('');
  let customerEmail = $state('');
  let company = $state('');
  let resumeSessionId = $state('');
  let resumeInfo = $state({ lastQuestionIndex: 0, expiresInSeconds: 86400 });

  interface AnnieChatSavedState {
    messages: ChatMessage[];
    currentQuestionIndex: number;
    answers: Array<{ questionId: string; question: string; answer: string; followUpAnswer?: string }>;
    followUpAsked: boolean;
    currentFollowUp: string | undefined;
    lastQuestionId: string;
  }

  let orientationOpen = $state(false);
  let ctaLoading = $state(false);
  let returningUser = $state(false);

  // Detect returning users who've completed an assessment before
  $effect(() => {
    try {
      returningUser = localStorage.getItem('annie-assessment-completed') === 'true';
    } catch {}
  });

  // Check for existing incomplete session on page load
  $effect(() => {
    try {
      const savedSid = localStorage.getItem('annie-session-id');
      if (savedSid) {
        checkResumeSession(savedSid);
      }
    } catch {
      // localStorage unavailable, skip resume check
    }
  });

  async function checkResumeSession(sid: string) {
    try {
      const res = await fetch(`/api/chat/intake?sessionId=${encodeURIComponent(sid)}`);
      const data = (await res.json()) as {
        found?: boolean;
        session?: { currentIndex: number; expiresIn: number };
      };
      if (data.found && data.session) {
        resumeSessionId = sid;
        resumeInfo = {
          lastQuestionIndex: data.session.currentIndex,
          expiresInSeconds: data.session.expiresIn
        };
        phase = 'resume';
      } else {
        // Session expired or not found — clear localStorage
        clearSavedSession();
      }
    } catch {
      // Server unreachable, ignore resume
    }
  }

  function fastTrackIntake() {
    ctaLoading = true;
    sessionId = crypto.randomUUID();
    chatSavedState = null;
    // Small delay so the loading state is visible before phase transition
    setTimeout(() => {
      ctaLoading = false;
      phase = 'chat';
    }, 400);
  }

  function clearSavedSession() {
    try {
      localStorage.removeItem('annie-session-id');
      localStorage.removeItem('annie-session-state');
    } catch {}
  }

  function resumeIntake() {
    // Load saved state from localStorage
    try {
      const saved = localStorage.getItem('annie-session-state');
      if (saved) {
        chatSavedState = JSON.parse(saved) as AnnieChatSavedState;
      }
    } catch {}
    sessionId = resumeSessionId;
    phase = 'chat';
  }

  function startFresh() {
    clearSavedSession();
    sessionId = crypto.randomUUID();
    chatSavedState = null;
    orientationOpen = true;
  }

  function startIntake(_token: string) {
    orientationOpen = false;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }
    phase = 'chat';
  }

  function closeOrientation() {
    orientationOpen = false;
  }

  function openOrientation() {
    orientationOpen = true;
  }

  function onChatComplete(summary: Array<{ question: string; answer: string; followUpAnswer?: string }>) {
    chatSummary = summary;
    chatSavedState = null;
    clearSavedSession();
    phase = 'review';
  }

  function backToChat() {
    phase = 'chat';
  }

  function onConfirmComplete() {
    clearSavedSession();
    // Mark assessment as completed for returning-user detection
    try {
      localStorage.setItem('annie-assessment-completed', 'true');
    } catch {}
    phase = 'queued';
  }

  function metricQualifier(label: string): string {
    const qualifiers: Record<string, string> = {
      'assessment fee': 'One-time',
      'assessment intake': 'At your own pace',
      'report turnaround': 'From submission',
      'employee teams served best': 'Typical range'
    };
    return qualifiers[label] || '';
  }
</script>

<svelte:head>
  <title>AI Business Assessment for Australian SMBs — Agentic AI</title>
  <meta name="description" content="Agentic AI runs a 20–30 minute Annie intake, then delivers a practical AI Business Assessment report within 48 hours plus an optional no-charge follow-up consultation." />
  <meta property="og:title" content="AI Business Assessment for Australian SMBs" />
  <meta property="og:description" content="Find where AI can save your business time. Annie intake, 48-hour report, quick wins, and optional no-charge consultation." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://agenticai.net.au" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

{#if phase === 'resume'}
  <div class="intake-container">
    <div class="intake-chat-wrap">
      <ResumePrompt
        sessionId={resumeSessionId}
        lastQuestionIndex={resumeInfo.lastQuestionIndex}
        expiresInSeconds={resumeInfo.expiresInSeconds}
        onResume={resumeIntake}
        onStartFresh={startFresh}
      />
    </div>
  </div>
{:else if phase === 'chat'}
  <div class="intake-container">
    <div class="intake-header">
      <div class="intake-header-content">
        <span class="eyebrow">AI Business Assessment</span>
        <h2>Chat with Annie</h2>
        <p>Answer questions about your business with Annie. This takes about 20–30 minutes.</p>
      </div>
    </div>
    <div class="intake-chat-wrap">
      <AnnieChat {sessionId} savedState={chatSavedState} onComplete={onChatComplete} />
    </div>
  </div>
{:else if phase === 'review'}
  <div class="intake-container">
    <div class="intake-header">
      <div class="intake-header-content">
        <span class="eyebrow">AI Business Assessment</span>
        <h2>Review your information</h2>
        <p>Check everything is correct before we start processing your assessment.</p>
      </div>
    </div>
    <div class="intake-chat-wrap">
      <SummaryReview
        bind:summary={chatSummary}
        {sessionId}
        {customerName}
        {customerEmail}
        {company}
        onBack={backToChat}
        onComplete={onConfirmComplete}
      />
    </div>
  </div>
{:else if phase === 'queued'}
  <div class="intake-container">
    <div class="intake-chat-wrap">
      <SummaryReview
        bind:summary={chatSummary}
        {sessionId}
        {customerName}
        {customerEmail}
        {company}
      />
    </div>
  </div>
{:else}
<main>
  <section class="hero">
    <div class="hero-copy">
      <span class="eyebrow">AI Business Assessment</span>
      <h1>Find where AI can save your business time</h1>
      <p>
        Agentic AI reviews your workflows, tools, and daily bottlenecks through a 20–30 minute
        conversation with Annie, then delivers a practical report within 48 hours.
      </p>
      <div class="actions">
        <div class="actions-primary">
          <button class="button primary" onclick={openOrientation} disabled={ctaLoading} aria-busy={ctaLoading}>
            {#if ctaLoading}
              <span class="spinner" aria-hidden="true"></span>
              Preparing your assessment…
            {:else}
              Start AI Business Assessment
            {/if}
          </button>
          <p class="hero-pricing">$1,200 AUD · 48-hour report · no-charge follow-up</p>
        </div>
        <a class="button secondary" href="/services">See What You Get</a>
        {#if returningUser}
          <button class="fast-track-link" onclick={fastTrackIntake} disabled={ctaLoading}>
            Done this before? Skip intro →
          </button>
        {/if}
      </div>
      <div class="metric-strip" aria-label="Assessment highlights">
        {#each metrics as metric}
          <div>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <small>{metricQualifier(metric.label)}</small>
          </div>
        {/each}
      </div>
    </div>
    <div class="hero-visual">
      <h2 class="visually-hidden">What your assessment report looks like</h2>
      <div class="opportunity-map" aria-label="AI opportunity map preview">
        <div class="map-header">
          <div>
            <span>Assessment output</span>
            <strong>Workflow diagnosis and quick-win report</strong>
          </div>
          <div class="map-status">Ready in 48 hours</div>
        </div>

        <div class="map-grid">
          <div class="signal-card">
            <span>Likely time reclaimed</span>
            <strong>8.5 hrs / week</strong>
            <small>Estimated from repeated reporting, enquiry follow-up, and document admin.</small>
          </div>

          <div class="workflow-lanes">
            <h3>Opportunity signals</h3>
            <div class="lane">
              <div class="lane-label">
                <strong>Manual reporting</strong>
                <span>High drag</span>
              </div>
              <div class="lane-track"><i style="width: 86%"></i></div>
            </div>
            <div class="lane">
              <div class="lane-label">
                <strong>Lead response</strong>
                <span>Revenue risk</span>
              </div>
              <div class="lane-track"><i style="width: 74%"></i></div>
            </div>
            <div class="lane">
              <div class="lane-label">
                <strong>Customer questions</strong>
                <span>Repeating</span>
              </div>
              <div class="lane-track"><i style="width: 66%"></i></div>
            </div>
          </div>
        </div>

        <div class="roadmap-preview">
          <h3>Ranked quick wins</h3>
          <article>
            <b>01</b>
            <p>Automate the weekly performance pack from live sales and operations data.</p>
            <em>2.5 hrs saved</em>
          </article>
          <article>
            <b>02</b>
            <p>Trigger fast follow-up when web enquiries and quote requests arrive.</p>
            <em>Higher response rate</em>
          </article>
          <article>
            <b>03</b>
            <p>Create a trained assistant for repeated product, service, and onboarding questions.</p>
            <em>Less interruption</em>
          </article>
        </div>

        <div class="assessment-note">
          <div class="note-mark">AI</div>
          <div>
            <span>Assessment lens</span>
            <h3>Inspect the work first, then choose the simplest useful AI system.</h3>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-heading">
      <h2>A clear AI assessment for your actual business</h2>
    </div>
    <ServiceGrid />
  </section>

  <section class="section split-section">
    <div>
      <h2>Repeated work, slow handoffs, and owner bottlenecks</h2>
      <p>
        Most small businesses do not need a machine learning project. They need someone to inspect
        the work, identify where hours are leaking, and recommend the simplest tool or automation that
        removes the friction.
      </p>
    </div>
    <div class="tag-grid">
      {#each useCases as useCase}
        <span>{useCase}</span>
      {/each}
    </div>
  </section>

  <section class="report-section">
    <div class="report-copy">
      <h2>Specific recommendations, ranked by return</h2>
      <p>
        The assessment turns an intake conversation into a decision-ready report: pain points, quick wins,
        recommended tools, effort versus impact, estimated value, and optional next steps.
      </p>
      <ul class="feature-list">
        {#each reportSections as section}
          <li>{section}</li>
        {/each}
      </ul>
      <a class="button dark" href="/services">Review the Assessment</a>
    </div>
    <div class="report-stack" aria-label="Report section preview">
      <article>
        <span>01</span>
        <strong>Pain points</strong>
        <p>Repeated work and slow handoffs found during intake.</p>
      </article>
      <article>
        <span>02</span>
        <strong>Quick wins</strong>
        <p>Low-effort fixes with specific tools and setup steps.</p>
      </article>
      <article>
        <span>03</span>
        <strong>ROI estimate</strong>
        <p>Hours saved, monthly tool cost, and annual value.</p>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="section-heading">
      <h2>Strategic AI opportunities identified in your report</h2>
      <p>The assessment may highlight implementation opportunities. If you decide to progress, we scope and build:</p>
    </div>
    <div class="services-list">
      {#each upsells as offer}
        <article class="service-row">
          <h3>{offer.title}</h3>
          <p>{offer.text}</p>
        </article>
      {/each}
    </div>
  </section>

  <!-- Testimonials / Social Proof (UX-DR5) -->
  <section class="section">
    <div class="section-heading">
      <span class="eyebrow">Social proof</span>
      <h2>What business owners say</h2>
    </div>
    <div class="testimonials-grid">
      {#each testimonials as t}
        <TestimonialCard name={t.name} role={t.role} quote={t.quote} rating={t.rating} />
      {/each}
    </div>
  </section>

  <!-- FAQ Accordion (UX-DR14/15) -->
  <section class="section">
    <div class="section-heading">
      <span class="eyebrow">Common questions</span>
      <h2>Frequently asked questions</h2>
    </div>
    <FaqAccordion items={faqItems} variant="simple" />
  </section>

  <section class="cta-section">
    <div class="cta-brief">
      <h2>Ready to see where AI fits?</h2>
      <p>
        Start with a focused assessment. You will leave with a practical plan for the workflows, tools,
        and quick wins most likely to create measurable leverage.
      </p>
    </div>
    <ul class="brief-checklist" aria-label="What you receive">
      <li><span aria-hidden="true">01</span><strong>Pain points</strong> found during intake</li>
      <li><span aria-hidden="true">02</span><strong>Quick wins</strong> with specific tools and setup</li>
      <li><span aria-hidden="true">03</span><strong>ROI estimate</strong> — hours saved, cost, annual value</li>
    </ul>
    <div class="cta-action">
      <button class="button primary" onclick={openOrientation} disabled={ctaLoading} aria-busy={ctaLoading}>
        {#if ctaLoading}
          <span class="spinner" aria-hidden="true"></span>
          Preparing your assessment…
        {:else}
          Start AI Business Assessment
        {/if}
      </button>
      <p class="cta-price">$1,200 AUD · no-charge follow-up consultation included</p>
      <p class="trust-note">Your data is private and never shared. <a href="/privacy">Privacy policy</a></p>
    </div>
  </section>
</main>
{/if}

<OrientationPanel open={orientationOpen} onacknowledge={startIntake} onclose={closeOrientation} />

<style>
  /* ── Visually hidden (a11y heading anchors) ────────────────────────── */
  .visually-hidden {
    border: 0;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
  }

  /* ── Actions primary wrap (hero CTA + pricing line) ───────────────── */
  .actions-primary {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  /* ── Hero pricing (UX transparency) ────────────────────────────── */
  .hero-pricing {
    color: var(--color-muted);
    font-size: 0.78rem;
    margin: 0;
    text-align: center;
  }

  .cta-price {
    color: var(--color-muted);
    font-size: 0.8rem;
    margin: 0.5rem 0 0;
  }

  /* ── CTA section: 3-column briefing layout ───────────────────────── */
  .cta-section {
    align-items: start;
    display: grid;
    gap: clamp(1.5rem, 3vw, 2.5rem);
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr) minmax(0, 1fr);
  }

  .cta-brief h2 {
    font-size: clamp(1.6rem, 2.7vw, 2.35rem);
    max-width: 24ch;
  }

  .cta-brief p {
    color: var(--color-muted);
    font-size: 0.95rem;
    line-height: 1.6;
    margin-top: 0.5rem;
    max-width: 42ch;
  }

  .brief-checklist {
    align-self: center;
    color: var(--color-muted);
    display: grid;
    gap: 0.6rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .brief-checklist li {
    align-items: start;
    border-top: 1px solid var(--color-line);
    display: grid;
    gap: 0.4rem 0.7rem;
    grid-template-columns: auto 1fr;
    font-size: 0.88rem;
    line-height: 1.4;
    padding-top: 0.55rem;
  }

  .brief-checklist li:first-child {
    border-top: none;
    padding-top: 0;
  }

  .brief-checklist span {
    color: var(--color-accent-text);
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    padding-top: 0.08rem;
  }

  .brief-checklist strong {
    color: var(--color-ink);
    font-weight: 700;
  }

  .cta-action {
    align-self: center;
    display: grid;
    gap: 0;
  }

  .cta-action .button.primary {
    width: max-content;
  }

  /* ── Testimonials grid (cards come from TestimonialCard component) ─── */
  .testimonials-grid {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  /* ── Trust Note (UX-DR13/15) ───────────────────────────── */
  .trust-note {
    color: var(--color-muted-2);
    font-size: 0.78rem;
    margin-top: 0.75rem;
    text-align: center;
  }

  .trust-note a {
    color: var(--color-accent-text);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* ── Responsive ───────────────────────────────────────────── */
  @media (max-width: 940px) {
    .testimonials-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .hero-copy {
      text-align: center;
    }

    .actions {
      align-items: center;
      flex-direction: column;
      gap: 1rem;
    }

    .actions-primary {
      width: 100%;
    }

    .actions-primary .button.primary {
      width: 100%;
    }

    .hero-pricing {
      text-align: center;
    }

    .fast-track-link {
      margin-left: auto;
      margin-right: auto;
    }

    .metric-strip {
      justify-content: center;
    }

    .cta-section {
      grid-template-columns: 1fr;
    }

    .cta-action {
      align-self: stretch;
    }

    .cta-action .button.primary {
      width: 100%;
    }
  }

  /* Demote secondary to a small text link on small screens so primary wins */
  @media (max-width: 640px) {
    .actions .button.secondary {
      background: none;
      border: none;
      color: var(--color-accent-text);
      font-size: 0.88rem;
      font-weight: 700;
      padding: 0.4rem 0.6rem;
      text-decoration: underline;
      text-underline-offset: 3px;
      width: auto;
    }

    .actions .button.secondary:hover {
      color: var(--color-accent-2);
    }
  }

  @media (min-width: 1200px) {
    .hero {
      gap: clamp(3rem, 5vw, 5rem);
    }

    .testimonials-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* ── Spinner ────────────────────────────────────────────────────── */
  .spinner {
    animation: spin 0.8s linear infinite;
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-radius: 999px;
    border-top-color: #fff;
    display: inline-block;
    height: 1em;
    margin-right: 0.4em;
    vertical-align: -0.1em;
    width: 1em;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Fast-track link ─────────────────────────────────────────────── */
  .fast-track-link {
    background: none;
    border: none;
    color: var(--color-muted);
    cursor: pointer;
    display: block;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    margin-top: 0.5rem;
    text-decoration: underline;
    text-underline-offset: 2px;
    width: fit-content;
  }

  .fast-track-link:hover {
    color: var(--color-accent-text);
  }

  .fast-track-link:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* ── Metric qualifiers ───────────────────────────────────────────── */
  .metric-strip small {
    color: var(--color-muted-2);
    display: block;
    font-size: 0.7rem;
    margin-top: 0.1rem;
  }

  /* ── Intake Chat Container ──────────────────────────────────────── */
  .intake-container {
    display: grid;
    gap: 0;
    grid-template-rows: auto 1fr;
    min-height: calc(100vh - 3.5rem);
  }

  .intake-header {
    background: var(--color-panel);
    border-bottom: 1px solid var(--color-line);
    padding: 1.5rem var(--pad-h);
    text-align: center;
  }

  .intake-header-content {
    margin: 0 auto;
    max-width: 600px;
  }

  .intake-header-content h2 {
    font-size: 1.5rem;
    margin-top: 0.5rem;
    max-width: none;
  }

  .intake-header-content p {
    color: var(--color-muted);
    font-size: 0.9rem;
    margin-top: 0.3rem;
  }

  .intake-chat-wrap {
    align-items: start;
    display: grid;
    justify-content: center;
    padding: 2rem var(--pad-h);
  }

  .intake-chat-wrap :global(.annie-chat) {
    max-width: 640px;
    width: 100%;
  }
</style>
