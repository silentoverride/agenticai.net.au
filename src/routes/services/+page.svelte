<script lang="ts">
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';
  import { processSteps, reportSections, services, upsells } from '$lib/content';
  import { faqItems } from '$lib/data/faq';
</script>

<svelte:head>
  <title>Services — AI Assessment & Implementation | Agentic AI</title>
  <meta name="description" content="AI assessment first, implementation second. We inspect your workflows, identify where hours leak, and recommend the simplest AI tools and automations to remove the friction." />
</svelte:head>

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

  <section class="section">
    <div class="section-heading">
      <p class="eyebrow">How the report is built</p>
      <h2>Kimi K2.6 processes. Presenton formats.</h2>
      <p>
        When Annie's call ends, the transcript is automatically handed off to a report-building pipeline.
        No manual formatting. No waiting for a consultant to write it up. The report is ready in 48 hours.
      </p>
    </div>

    <div class="report-build-grid">
      <article class="report-build-step">
        <div class="report-build-header">
          <span class="step-tag">Step 01</span>
          <h3>Kimi K2.6 processes the transcript</h3>
          <p>
            A series of specialised AI agents — each with one job — works through the raw transcript in sequence,
            extracting pain points, researching tools, and producing a structured assessment document.
          </p>
        </div>
        <div class="skills-pipeline">
          <div class="skill-item">
            <b>01</b>
            <div>
              <strong>Clean and structure</strong>
              <p>The raw transcript is formatted into a consistent, readable document for downstream agents.</p>
            </div>
          </div>
          <div class="skill-item">
            <b>02</b>
            <div>
              <strong>Identify pain points</strong>
              <p>Key workflow problems, repeated tasks, and friction points are extracted and categorised from the conversation.</p>
            </div>
          </div>
          <div class="skill-item">
            <b>03</b>
            <div>
              <strong>Research AI tools</strong>
              <p>Each pain point is matched to specific off-the-shelf tools from AI directories — with cost and setup context.</p>
            </div>
          </div>
          <div class="skill-item">
            <b>04</b>
            <div>
              <strong>Effort vs impact matrix</strong>
              <p>Every recommendation is mapped on a 2×2 grid so quick wins — low effort, high impact — are obvious.</p>
            </div>
          </div>
          <div class="skill-item">
            <b>05</b>
            <div>
              <strong>Financial impact estimate</strong>
              <p>Hours saved per week, assumed hourly rate, tool costs, and annual net value are calculated for each recommendation.</p>
            </div>
          </div>
        </div>
        <div class="pipeline-output">
          <span>Output</span>
          <p>A structured document containing all assessment content — ready to be formatted into the final report.</p>
        </div>
      </article>

      <article class="report-build-step presenton-step">
        <div class="report-build-header">
          <span class="step-tag">Step 02</span>
          <h3>Presenton formats the report</h3>
          <p>
            The structured document is uploaded to Presenton — an open-source AI presentation generator —
            which auto-generates a professionally designed visual report from a template and exports PPTX or PDF.
          </p>
        </div>
        <ul class="presenton-features">
          <li>
            <strong>Professional design</strong>
            <span>The assessment output becomes a polished, client-ready report without manual formatting work.</span>
          </li>
          <li>
            <strong>Template consistency</strong>
            <span>Every client receives the same professional structure, section order, and visual treatment.</span>
          </li>
          <li>
            <strong>Shareable link</strong>
            <span>The report is delivered as a PPTX or PDF link — accessible on any device before the follow-up call.</span>
          </li>
          <li>
            <strong>Screen-share ready</strong>
            <span>The follow-up call walks through the report slide by slide, making recommendations easy to discuss.</span>
          </li>
        </ul>
        <div class="presenton-note">
          <div class="note-mark" aria-hidden="true">AI</div>
          <p>Corey Ganim's free template is available at <strong>audittemplate.ai</strong> — adapted for Presenton and used for every assessment.</p>
        </div>
      </article>
    </div>
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

  <section class="section faq-section">
    <div class="section-heading">
      <p class="eyebrow">Common questions</p>
      <h2>What people ask before starting</h2>
    </div>
    <div class="faq-accordion">
      {#each faqItems.slice(0, 6) as item, index}
        <details class="faq-item" open={index === 0}>
          <summary class="faq-question">
            <span class="faq-qmark">Q.</span>
            <span class="faq-qtext">{item.question}</span>
            <span class="faq-icon" aria-hidden="true">+</span>
          </summary>
          <div class="faq-answer">
            <p>{item.answer}</p>
          </div>
        </details>
      {/each}
    </div>
    <p class="faq-more">
      <a href="/faq" class="link-arrow">View all {faqItems.length} answers →</a>
    </p>
  </section>

  <section class="section cta-section">
    <div class="cta-box">
      <h2>Ready to see where AI can save your business time?</h2>
      <p>Book a free AI Business Assessment call with Annie and get a practical report within 48 hours.</p>
      <CallAssessmentButton label="Start AI Business Assessment" source="services-cta" />
    </div>
  </section>
</main>

<style>
  .faq-section {
    padding: 3rem 0;
  }

  .faq-accordion {
    max-width: 800px;
    margin: 0 auto;
  }

  .faq-item {
    background: var(--color-panel);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    margin-bottom: 0.6rem;
    overflow: hidden;
  }

  .faq-question {
    list-style: none;
    cursor: pointer;
    padding: 1rem 1.2rem;
    font-weight: 600;
    font-size: 1rem;
    color: var(--color-ink);
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .faq-question::-webkit-details-marker {
    display: none;
  }

  .faq-qmark {
    color: #0066ff;
    font-weight: 700;
    flex-shrink: 0;
  }

  .faq-qtext {
    flex: 1;
  }

  .faq-icon {
    font-size: 1.3rem;
    font-weight: 300;
    line-height: 1;
    color: var(--color-muted);
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .faq-answer {
    padding: 0 1.2rem 1.2rem 2.4rem;
    color: var(--color-muted);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .faq-answer p {
    margin: 0;
  }

  .faq-more {
    text-align: center;
    margin-top: 1.5rem;
  }

  .faq-more a {
    color: #0066ff;
    text-decoration: none;
    font-weight: 600;
  }

  .faq-more a:hover {
    text-decoration: underline;
  }

  .cta-section {
    padding: 4rem 0;
    text-align: center;
  }
  .cta-box {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 3rem 2rem;
    max-width: 640px;
    margin: 0 auto;
  }
  .cta-box h2 {
    font-size: 1.5rem;
    color: #1a1a2e;
    margin-bottom: 0.75rem;
  }
  .cta-box p {
    color: #6c757d;
    margin-bottom: 1.5rem;
  }
</style>
