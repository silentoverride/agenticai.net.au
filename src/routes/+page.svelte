<script lang="ts">
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';
  import OrientationPanel from '$lib/components/OrientationPanel.svelte';
  import AnnieChat from '$lib/components/AnnieChat.svelte';
  import ServiceGrid from '$lib/components/ServiceGrid.svelte';
  import { metrics, reportSections, useCases, upsells, testimonials, faqItems } from '$lib/content';

  let showOrientation = $state(false);
  let intakeStarted = $state(false);

  function startIntake() {
    intakeStarted = true;
    showOrientation = false;
  }

  function onChatComplete(summary: Array<{ question: string; answer: string }>) {
    console.log('[Intake] Complete', { sessionId: crypto.randomUUID(), summary });
    // Future: redirect to payment or assessment queued page (Story 1.5)
  }
</script>

<svelte:head>
  <title>AI Business Assessment for Australian SMBs — Agentic AI</title>
  <meta name="description" content="Agentic AI reviews your workflows, tools, and daily bottlenecks, then delivers a practical report showing which AI tools, automations, and agents are worth implementing first." />
  <meta property="og:title" content="AI Business Assessment for Australian SMBs" />
  <meta property="og:description" content="Find where AI can save your business time. Practical report, quick wins, implementation roadmap." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://agenticai.net.au" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

{#if intakeStarted}
  <div class="intake-container">
    <div class="intake-header">
      <div class="intake-header-content">
        <span class="eyebrow">AI Business Assessment</span>
        <h2>Chat with Annie</h2>
        <p>Answer a few questions about your business. This takes about 15 minutes.</p>
      </div>
    </div>
    <div class="intake-chat-wrap">
      <AnnieChat onComplete={onChatComplete} />
    </div>
  </div>
{:else}
<main>
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">AI business assessment</p>
      <h1>Find where AI can save your business time</h1>
      <p>
        Agentic AI reviews your workflows, tools, and daily bottlenecks, then delivers a practical report
        showing which AI tools, automations, and agents are worth implementing first.
      </p>
      <div class="actions">
        <button class="button primary" onclick={() => showOrientation = true}>
          Start AI Business Assessment
        </button>
        <a class="button secondary" href="/services">See What You Get</a>
      </div>
      <div class="metric-strip" aria-label="Assessment highlights">
        {#each metrics as metric}
          <div>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        {/each}
      </div>
    </div>
    <div class="hero-visual">
      <div class="opportunity-map" aria-label="AI opportunity map preview">
        <div class="map-header">
          <div>
            <span>Assessment output</span>
            <strong>Workflow diagnosis and first-move roadmap</strong>
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
      <p class="eyebrow">The offer</p>
      <h2>A clear AI roadmap for your actual business</h2>
    </div>
    <ServiceGrid />
  </section>

  <section class="section split-section">
    <div>
      <p class="eyebrow">What we look for</p>
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
      <p class="eyebrow">The report</p>
      <h2>Specific recommendations, ranked by return</h2>
      <p>
        The assessment turns an intake conversation into a decision-ready report: pain points, quick wins,
        recommended tools, effort versus impact, implementation steps, and ROI estimates.
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
      <p class="eyebrow">Implementation menu</p>
      <h2>Turn the report into working systems</h2>
    </div>
    <div class="grid offer-grid">
      {#each upsells as offer}
        <article class="card">
          <h3>{offer.title}</h3>
          <p>{offer.text}</p>
        </article>
      {/each}
    </div>
  </section>

  <!-- Testimonials / Social Proof (UX-DR5) -->
  <section class="section">
    <div class="section-heading">
      <p class="eyebrow">Trusted by businesses</p>
      <h2>What business owners say</h2>
    </div>
    <div class="testimonials-grid">
      {#each testimonials as t}
        <article class="testimonial-card">
          <div class="stars" aria-label="{t.rating} out of 5 stars">
            {#each Array(t.rating) as _}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            {/each}
          </div>
          <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
          <div class="testimonial-author">
            <strong>{t.name}</strong>
            <span>{t.role}</span>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <!-- FAQ Accordion (UX-DR14/15) -->
  <section class="section">
    <div class="section-heading">
      <p class="eyebrow">Common questions</p>
      <h2>Frequently asked questions</h2>
    </div>
    <div class="faq-list">
      {#each faqItems as item, i}
        <details class="faq-item" name="faq">
          <summary class="faq-question">
            <span>{item.q}</span>
            <svg class="faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div class="faq-answer">
            <p>{item.a}</p>
          </div>
        </details>
      {/each}
    </div>
  </section>

  <section class="cta-section">
    <h2>Ready to see where AI fits?</h2>
    <p>
      Start with a focused assessment. You will leave with a practical plan for the workflows, tools,
      and quick wins most likely to create measurable leverage.
    </p>
    <button class="button primary" onclick={() => showOrientation = true}>
      Start AI Business Assessment
    </button>
    <p class="trust-note">No credit card required. Your data is private and never shared. <a href="/privacy">Privacy policy</a></p>
  </section>
</main>
{/if}

<OrientationPanel bind:open={showOrientation} onacknowledge={startIntake} />

<style>
  /* ── Testimonials ──────────────────────────────────────────── */
  .testimonials-grid {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .testimonial-card {
    background: var(--color-panel);
    border: 1.5px solid var(--color-line);
    border-radius: var(--radius);
    display: grid;
    gap: 1rem;
    padding: 1.5rem;
  }

  .stars {
    color: #f59e0b;
    display: flex;
    gap: 0.15rem;
  }

  .testimonial-card blockquote {
    color: var(--color-ink-2);
    font-size: 0.92rem;
    line-height: 1.6;
    margin: 0;
  }

  .testimonial-author {
    border-top: 1px solid var(--color-line-soft);
    display: grid;
    gap: 0.15rem;
    padding-top: 0.85rem;
  }

  .testimonial-author strong {
    color: var(--color-ink);
    font-size: 0.88rem;
  }

  .testimonial-author span {
    color: var(--color-muted);
    font-size: 0.78rem;
  }

  /* ── FAQ Accordion ────────────────────────────────────────── */
  .faq-list {
    display: grid;
    gap: 0;
    max-width: 720px;
  }

  .faq-item {
    border-bottom: 1px solid var(--color-line);
  }

  .faq-item:first-child {
    border-top: 1px solid var(--color-line);
  }

  .faq-question {
    align-items: center;
    cursor: pointer;
    display: flex;
    font-size: 0.95rem;
    font-weight: 700;
    gap: 0.75rem;
    justify-content: space-between;
    list-style: none;
    padding: 1.15rem 0;
    user-select: none;
  }

  .faq-question::-webkit-details-marker {
    display: none;
  }

  .faq-question:hover {
    color: var(--color-accent);
  }

  .faq-chevron {
    color: var(--color-muted-2);
    flex-shrink: 0;
    transition: transform 200ms ease;
  }

  .faq-item[open] .faq-chevron {
    transform: rotate(180deg);
  }

  .faq-answer {
    padding-bottom: 1.15rem;
  }

  .faq-answer p {
    color: var(--color-muted);
    font-size: 0.9rem;
    line-height: 1.65;
    max-width: 60ch;
  }

  /* ── Trust Note (UX-DR13/15) ───────────────────────────── */
  .trust-note {
    color: var(--color-muted-2);
    font-size: 0.78rem;
    margin-top: 0.75rem;
    text-align: center;
  }

  .trust-note a {
    color: var(--color-accent);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* ── Responsive ───────────────────────────────────────────── */
  @media (max-width: 940px) {
    .testimonials-grid {
      grid-template-columns: 1fr;
    }

    .faq-list {
      max-width: 100%;
    }
  }

  /* ── Intake Chat Container ──────────────────────────────── */
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
