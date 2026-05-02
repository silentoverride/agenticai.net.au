<script lang="ts">
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';
  import CalendlyButton from '$lib/components/CalendlyButton.svelte';
  import ServiceGrid from '$lib/components/ServiceGrid.svelte';
  import { metrics, reportSections, useCases, upsells } from '$lib/content';
</script>

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
        <CallAssessmentButton label="Start AI Business Assessment" source="hero-start-assessment" />
        <CalendlyButton />
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

  <section class="cta-section">
    <h2>Ready to see where AI fits?</h2>
    <p>
      Start with a focused assessment. You will leave with a practical plan for the workflows, tools,
      and quick wins most likely to create measurable leverage.
    </p>
    <CallAssessmentButton label="Start AI Business Assessment" source="cta-start-assessment" />
  </section>
</main>
