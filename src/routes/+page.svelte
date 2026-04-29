<script lang="ts">
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
        <a class="button primary" href="/contact">Book an Assessment</a>
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
      <div class="audit-board" aria-label="AI assessment report preview">
        <div class="audit-header">
          <span>Assessment report</span>
          <strong>48-hour roadmap</strong>
        </div>
        <div class="score-card">
          <span>Estimated time reclaimed</span>
          <strong>8.5 hrs / week</strong>
          <small>Based on repeated admin, reporting, and lead response delays.</small>
        </div>
        <div class="matrix">
          <div class="matrix-label top">High impact</div>
          <div class="matrix-cell muted">Later</div>
          <div class="matrix-cell hot">Quick win</div>
          <div class="matrix-cell">Monitor</div>
          <div class="matrix-cell warm">Automate</div>
          <div class="matrix-label bottom">Low effort</div>
        </div>
        <div class="recommendation-list">
          <article>
            <span>01</span>
            <p>Replace manual reporting pack with an automated dashboard.</p>
          </article>
          <article>
            <span>02</span>
            <p>Use a trained assistant for repeated buyer and customer questions.</p>
          </article>
          <article>
            <span>03</span>
            <p>Trigger speed-to-lead follow-up when enquiry forms arrive.</p>
          </article>
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
    <a class="button primary" href="/contact">Book an Assessment</a>
  </section>
</main>
