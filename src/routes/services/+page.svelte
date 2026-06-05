<script lang="ts">
  import CallAssessmentButton from '$lib/components/CallAssessmentButton.svelte';
  import FaqAccordion from '$lib/components/FaqAccordion.svelte';
  import { processSteps, reportSections, services, upsells } from '$lib/content';
  import { faqItems } from '$lib/data/faq';

  // Map {question, answer} shape to the FaqAccordion component's {q, a} shape.
  const faqAccordionItems = faqItems.slice(0, 6).map((item) => ({ q: item.question, a: item.answer }));

  const reportBuildSteps = [
    {
      label: '01',
      title: 'Conversation captured',
      text: 'Annie turns the 20–30 minute assessment conversation into a complete transcript.',
      output: 'Raw business context'
    },
    {
      label: '02',
      title: 'Findings extracted',
      text: 'Specialised AI agents identify pain points, repeated work, handoffs, and workflow gaps.',
      output: 'Structured findings'
    },
    {
      label: '03',
      title: 'Opportunities ranked',
      text: 'Recommendations are matched to tools, estimated for value, and sorted by effort versus impact.',
      output: 'Prioritised quick wins'
    },
    {
      label: '04',
      title: 'Presentation generated',
      text: 'Presenton turns the structured analysis into a polished presentation deck for review.',
      output: 'Editable report deck'
    }
  ];

  const reportAgentTasks = [
    'Clean and structure the transcript for consistent analysis',
    'Extract workflow friction, repeated tasks, and business goals',
    'Match pain points to practical AI tools and process changes',
    'Map each recommendation by effort, impact, and likely value',
    'Separate self-serve quick wins from larger AI opportunities'
  ];

  const presentonFeatures = [
    'Open-source presentation generation with API support',
    'Custom templates and themes for consistent report design',
    'Editable PPTX and PDF-ready presentation outputs',
    'Deck structure ready for the optional follow-up consultation'
  ];
</script>

<svelte:head>
  <title>Services — AI Business Assessment | Agentic AI</title>
  <meta name="description" content="Start with a 20–30 minute Annie conversation, receive your AI Business Assessment report within 48 hours, then choose whether to book a no-charge follow-up consultation." />
</svelte:head>

<main>
  <section class="page-hero">
    <span class="eyebrow">Services</span>
    <h1>AI Business Assessment, then optional next steps</h1>
    <p>
      The assessment gives you a clear view of where AI can save time or create revenue. Larger AI solution
      work is separate from the $1,200 assessment fee and is only scoped after the report is complete.
    </p>
  </section>

  <section class="section">
    <div class="section-heading">
      <h2>From Annie conversation to report and consultation</h2>

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

  <section class="section report-build-section">
    <div class="section-heading section-heading-split report-build-heading">
      <h2>From Annie conversation to finished report in four stages</h2>
      <p>
        Once the assessment conversation ends, the pipeline moves from transcript to analysis to a Presenton-generated report deck.
        The high-level flow is simple, while the detail underneath stays available when you want to inspect it.
      </p>
    </div>

    <div class="report-build-flow" aria-label="Report build process">
      {#each reportBuildSteps as step, index}
        <article class="report-flow-card">
          <div class="flow-card-topline">
            <span class="flow-number">{step.label}</span>
            {#if index < reportBuildSteps.length - 1}
              <span class="flow-connector" aria-hidden="true">→</span>
            {/if}
          </div>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
          <div class="flow-output">
            <span>Output</span>
            <strong>{step.output}</strong>
          </div>
        </article>
      {/each}
    </div>

    <div class="report-build-details">
      <article class="report-detail-card primary-detail">
        <div>
          <span class="step-tag">Inside the analysis</span>
          <h3>Specialised AI agents turn the transcript into useful findings</h3>
          <p>
            Each agent has a narrow job, so the report is assembled in a predictable order instead of becoming
            one large, hard-to-follow AI response.
          </p>
        </div>
        <ol class="analysis-list">
          {#each reportAgentTasks as task, index}
            <li>
              <span>{index + 1}</span>
              <p>{task}</p>
            </li>
          {/each}
        </ol>
      </article>

      <article class="report-detail-card delivery-detail">
        <div>
          <span class="step-tag">Final delivery</span>
          <h3>Presenton turns the findings into a polished presentation</h3>
          <p>
            The structured analysis becomes an editable report deck, ready to review on your own,
            export as needed, or screen-share during the optional follow-up consultation.
          </p>
        </div>
        <ul class="delivery-list">
          {#each presentonFeatures as feature}
            <li>{feature}</li>
          {/each}
        </ul>
      </article>
    </div>

    <div class="report-build-summary" aria-label="Report delivery summary">
      <div>
        <strong>48 hours</strong>
        <span>Typical report turnaround</span>
      </div>
      <div>
        <strong>12 slides</strong>
        <span>Consistent Presenton deck structure</span>
      </div>
      <div>
        <strong>Portal access</strong>
        <span>Readable on any device</span>
      </div>
    </div>
  </section>

  <section class="report-section feature">
    <div class="report-copy">
      <h2>What you receive after the assessment</h2>
      <p>
        The output is designed for business owners who want a decision, not a lecture. It identifies
        the best first moves, estimates the value, and separates quick wins from larger AI solution opportunities.
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
        <strong>Next steps</strong>
        <p>Self-serve quick wins and larger AI opportunities clearly marked as separate services.</p>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="section-heading section-heading-split">
      <h2>Strategic AI opportunities identified in your report</h2>
      <p>The assessment may highlight areas where AI-focused systems and processes could improve operations, reduce manual work, or strengthen how business knowledge is captured and used. These implementation opportunities are separate from the assessment report and are not included in the $1,200 assessment fee. If you decide to progress any of these areas, Agentic AI can help scope, design, and implement tailored solutions across process optimisation, workflow automation, knowledge and AI memory systems, and custom AI agents.</p>

    </div>
    <ul class="offer-list">
      {#each upsells as offer}
        <li>
          <strong>{offer.title}</strong>
          <p>{offer.text}</p>
        </li>
      {/each}
    </ul>
  </section>

  <section class="section faq-section">
    <div class="section-heading">
      <h2>What people ask before starting</h2>
    </div>
    <FaqAccordion items={faqAccordionItems} variant="card" initialOpenIndex={0}>
      {#snippet footer()}
        <p class="faq-more">
          <a href="/faq" class="link-arrow">View all {faqItems.length} answers →</a>
        </p>
      {/snippet}
    </FaqAccordion>
  </section>

  <section class="section cta-section">
    <div class="cta-box">
      <h2>Ready to see where AI can save your business time?</h2>

      <p>Start your 20–30 minute Annie conversation and receive a practical AI Business Assessment report within 48 hours.</p>
      <CallAssessmentButton label="Start AI Business Assessment" source="services-cta" />
    </div>
  </section>
</main>

<style>
  .page-hero h1 {
    max-width: 17ch;
  }

  .faq-section {
    padding: clamp(4.5rem, 7vw, 7rem) var(--pad-h);
  }

  .faq-more {
    text-align: center;
    margin-top: 1.5rem;
  }

  .faq-more a {
    color: var(--color-accent-text);
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
    background: var(--color-panel-soft);
    border-radius: 12px;
    padding: 3rem 2rem;
    max-width: 640px;
    margin: 0 auto;
  }
  .cta-box h2 {
    font-size: 1.5rem;
    color: var(--color-ink);
    margin-bottom: 0.75rem;
  }
  .cta-box p {
    color: var(--color-muted-2);
    margin-bottom: 1.5rem;
  }

</style>
