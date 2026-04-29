<script lang="ts">
  import { processSteps, reportSections, services, upsells } from '$lib/content';
</script>

<main>
  <section class="page-hero">
    <p class="eyebrow">Services</p>
    <h1>AI assessment first, implementation second</h1>
    <p>
      The assessment gives you a clear view of where AI can save time or create revenue. Implementation
      work is scoped only after the highest-value opportunities are visible.
    </p>
  </section>

  <section class="section">
    <div class="section-heading">
      <p class="eyebrow">How the assessment works</p>
      <h2>From intake call to action plan</h2>
    </div>
    <div class="process-grid">
      {#each processSteps as step, index}
        <article>
          <span>{index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="section services-list">
    {#each services as service}
      <article class="service-row">
        <h2>{service.title}</h2>
        <p>{service.text}</p>
      </article>
    {/each}
  </section>

  <section class="report-section feature">
    <div class="report-copy">
      <p class="eyebrow">Report contents</p>
      <h2>What you receive after the assessment</h2>
      <p>
        The output is designed for business owners who want a decision, not a lecture. It identifies
        the best first moves, estimates the value, and makes implementation feel manageable.
      </p>
      <ul class="feature-list">
        {#each reportSections as section}
          <li>{section}</li>
        {/each}
      </ul>
    </div>
    <div class="report-stack" aria-label="Report deliverables preview">
      <article>
        <span>01</span>
        <strong>Opportunity map</strong>
        <p>Where AI fits, where it does not, and what to do first.</p>
      </article>
      <article>
        <span>02</span>
        <strong>Tool shortlist</strong>
        <p>Specific products matched to the current workflow.</p>
      </article>
      <article>
        <span>03</span>
        <strong>Implementation path</strong>
        <p>Self-serve quick wins and scoped done-for-you builds.</p>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="section-heading">
      <p class="eyebrow">Done-for-you options</p>
      <h2>Common builds that follow the report</h2>
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
</main>
