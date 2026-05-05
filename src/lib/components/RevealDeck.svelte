<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Reveal from 'reveal.js';
  import CalendlyButton from './CalendlyButton.svelte';
  import 'reveal.js/reveal.css';
  import 'reveal.js/theme/white.css';

  interface Props {
    analysis: Record<string, any>;
    company?: string;
  }

  let { analysis, company }: Props = $props();
  let container: HTMLDivElement;
  let deck: any = null;

  onMount(() => {
    if (!container) return;

    deck = new Reveal(container, {
      hash: true,
      slideNumber: 'c/t',
      center: true,
      transition: 'slide',
      width: 1280,
      height: 720,
      margin: 0.04
    });

    deck.initialize();

    // Auto-trigger print dialog when ?print-pdf is present
    if (typeof window !== 'undefined' && window.location.search.includes('print-pdf')) {
      setTimeout(() => window.print(), 1200);
    }
  });

  onDestroy(() => {
    if (deck) {
      deck.destroy();
    }
  });

  function getPainPoints() {
    return Array.isArray(analysis?.pain_points) ? analysis.pain_points : [];
  }

  function getQuickWins() {
    return Array.isArray(analysis?.quick_wins) ? analysis.quick_wins : [];
  }

  function getDeeperOpportunities() {
    return Array.isArray(analysis?.deeper_opportunities) ? analysis.deeper_opportunities : [];
  }

  function getFinancialImpact() {
    return analysis?.financial_impact || {};
  }

  function getTotalHoursSaved(): number {
    return getQuickWins().reduce((sum: number, win: any) => {
      return sum + (win.estimated_hours_saved_per_week || 0);
    }, 0);
  }

  function getTotalMonthlyCost(): number {
    // Extract from quick wins pricing hints or tool recommendations
    const tools = analysis?.researched_tools || analysis?.tool_recommendations || [];
    return tools.reduce((sum: number, t: any) => {
      const match = String(t.pricing || t.pricing_hint || '').match(/\$(\d+)/);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
  }
</script>

<div class="reveal-wrapper">
  <div bind:this={container} class="reveal">
    <div class="slides">
      {#if analysis}
        <!-- Slide 1: Title -->
        <section data-background="linear-gradient(135deg, #1a1a2e, #16213e)">
          <div class="slide-title">
            <h1 style="color:#fff; font-size:2.5rem; margin-bottom:0.5rem;">
              AI Business Assessment
            </h1>
            <p style="color:#a0a8b8; font-size:1.25rem;">
              {company || 'Your Business'} — {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p style="color:#666; font-size:0.875rem; margin-top:2rem;">
              Prepared by Agentic AI
            </p>
          </div>
        </section>

        <!-- Slide 2: Executive Summary -->
        <section>
          <h2>Executive Summary</h2>
          <div class="two-column">
            <div class="column">
              <h3>🎯 The Pain</h3>
              <ul>
                {#each getPainPoints() as pain}
                  <li><strong>{pain.title}</strong> — {pain.description?.slice(0, 120)}...</li>
                {/each}
              </ul>
            </div>
            <div class="column">
              <h3>💡 The Outcome</h3>
              <p>{analysis.executive_summary}</p>
            </div>
          </div>
        </section>

        <!-- Slide 3: Opportunity at a Glance -->
        <section>
          <h2>The Opportunity at a Glance</h2>
          <div class="stats-grid">
            <div class="stat-box">
              <p class="stat-number">{getTotalHoursSaved()}</p>
              <p class="stat-label">Hours Reclaimable Weekly</p>
            </div>
            <div class="stat-box">
              <p class="stat-number">{getQuickWins().length}</p>
              <p class="stat-label">Quick Wins Identified</p>
            </div>
            <div class="stat-box">
              <p class="stat-number">{getDeeperOpportunities().length}</p>
              <p class="stat-label">Deeper Opportunities</p>
            </div>
            <div class="stat-box">
              <p class="stat-number">Low</p>
              <p class="stat-label">Primary Effort Level</p>
            </div>
          </div>
        </section>

        <!-- Slide 4: Impact-Effort Matrix -->
        <section>
          <h2>Impact-Effort Matrix</h2>
          <p class="matrix-intro">
            Your pain points have been analysed and placed into four quadrants. This report focuses on <strong>Quick Wins</strong> — the fixes that deliver the highest value with the least effort.
          </p>
          <div class="quadrant-grid">
            <div class="quadrant q1">
              <h4>⭐ Quick Wins</h4>
              <p>High Impact, Low Effort</p>
              <ul>
                {#each getQuickWins() as win}
                  <li>{win.title}</li>
                {/each}
              </ul>
            </div>
            <div class="quadrant q2">
              <h4>🔨 Major Projects</h4>
              <p>High Impact, High Effort</p>
            </div>
            <div class="quadrant q3">
              <h4>🧩 Fill-ins</h4>
              <p>Low Impact, Low Effort</p>
            </div>
            <div class="quadrant q4">
              <h4>🗑️ Deprioritise</h4>
              <p>Low Impact, High Effort</p>
            </div>
          </div>
        </section>

        <!-- Slides 5-8: Recommended Solutions -->
        {#each getQuickWins() as win, i}
          <section>
            <h2>Recommended Solution {i + 1}</h2>
            <div class="solution-card">
              <h3>{win.title}</h3>
              <p>{win.description}</p>
              <div class="solution-meta">
                <div class="meta-item">
                  <span class="meta-label">Effort</span>
                  <span class="meta-value {win.effort}">{win.effort}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Impact</span>
                  <span class="meta-value {win.impact}">{win.impact}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Time Saved</span>
                  <span class="meta-value">{win.estimated_hours_saved_per_week} hrs/week</span>
                </div>
              </div>
              {#if win.recommended_tools?.length}
                <div class="tools-section">
                  <h4>Recommended Tools</h4>
                  <ul>
                    {#each win.recommended_tools as tool}
                      <li>{tool}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          </section>
        {/each}

        <!-- Slide 9: 4-Day Quick Wins Plan -->
        <section>
          <h2>Your 4-Day Quick Wins Plan</h2>
          <div class="plan-grid">
            {#each getQuickWins().slice(0, 4) as win, i}
              <div class="plan-day">
                <div class="day-badge">Day {i + 1}</div>
                <h4>{win.title}</h4>
                <p>{win.description?.slice(0, 100)}...</p>
                {#if win.recommended_tools?.[0]}
                  <p class="tool-hint">🔧 {win.recommended_tools[0]}</p>
                {/if}
              </div>
            {/each}
          </div>
        </section>

        <!-- Slide 10: What Comes After Quick Wins -->
        <section>
          <h2>What Comes After Quick Wins</h2>
          <p class="section-intro">Once the quick wins are in place, here are the deeper opportunities to explore:</p>
          <div class="opportunities-list">
            {#each getDeeperOpportunities() as opp, i}
              <div class="opportunity-card">
                <div class="opp-number">{String(i + 1).padStart(2, '0')}</div>
                <div class="opp-content">
                  <h4>{opp.title}</h4>
                  <p>{opp.description}</p>
                  {#if opp.estimated_setup_cost_aud}
                    <p class="opp-cost">Estimated investment: ${opp.estimated_setup_cost_aud?.toLocaleString?.('en-AU') || opp.estimated_setup_cost_aud} AUD</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- Slide 11: Financial Impact -->
        <section>
          <h2>Financial Impact</h2>
          <div class="financial-grid">
            <div class="fin-card">
              <h3>⏱️ Weekly Time Returned</h3>
              <p class="fin-number">{getTotalHoursSaved()} hours</p>
            </div>
            <div class="fin-card">
              <h3>💰 Monthly Net ROI</h3>
              <p class="fin-number">
                ${getFinancialImpact().annual_value_aud ? Math.round(getFinancialImpact().annual_value_aud / 12).toLocaleString('en-AU') : '—'}
              </p>
            </div>
            <div class="fin-card">
              <h3>🛠️ Total Monthly Tool Cost</h3>
              <p class="fin-number">${getTotalMonthlyCost()}/month</p>
            </div>
            <div class="fin-card">
              <h3>📈 Annual Value</h3>
              <p class="fin-number">
                ${getFinancialImpact().annual_value_aud?.toLocaleString?.('en-AU') || '—'}
              </p>
            </div>
          </div>
        </section>

        <!-- Slide 12: Next Steps + Calendly CTA -->
        <section data-background="linear-gradient(135deg, #1a1a2e, #16213e)">
          <div class="next-steps">
            <h2 style="color:#fff;">Your Next Steps</h2>
            <ol class="steps-list">
              <li style="color:#e0e0e0;">
                <strong style="color:#fff;">Implement the Quick Wins</strong> — Follow the 4-day plan exactly as outlined to reclaim time and stabilise operations.
              </li>
              <li style="color:#e0e0e0;">
                <strong style="color:#fff;">Track Your Progress</strong> — Monitor hours saved weekly and measure the impact on your business.
              </li>
              <li style="color:#e0e0e0;">
                <strong style="color:#fff;">Book a Review Call</strong> — Let's review results, validate wins, and decide if deeper automation is warranted.
              </li>
            </ol>
            <div class="cta-wrapper">
              <CalendlyButton />
            </div>
          </div>
        </section>
      {/if}
    </div>
  </div>
</div>

<style>
  .reveal-wrapper {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    aspect-ratio: 16/9;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  }
  :global(.reveal) {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  :global(.reveal h2) {
    font-size: 2rem;
    color: #1a1a2e;
    margin-bottom: 1.5rem;
  }
  :global(.reveal h3) {
    font-size: 1.5rem;
    color: #2a2a4e;
  }
  :global(.reveal h4) {
    font-size: 1.125rem;
    color: #1a1a2e;
    margin: 0.5rem 0;
  }
  :global(.reveal p, .reveal li) {
    font-size: 1rem;
    line-height: 1.6;
    color: #444;
  }
  .slide-title {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    text-align: left;
  }
  .column h3 {
    margin-bottom: 1rem;
    color: #0066ff;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 2rem;
  }
  .stat-box {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 12px;
    border-left: 4px solid #0066ff;
  }
  .stat-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: #0066ff;
    margin: 0;
  }
  .stat-label {
    font-size: 0.875rem;
    color: #666;
    margin: 0.25rem 0 0;
  }
  .matrix-intro {
    font-size: 1.125rem;
    margin-bottom: 1.5rem;
  }
  .quadrant-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }
  .quadrant {
    padding: 1rem;
    border-radius: 8px;
    text-align: left;
  }
  .quadrant h4 {
    margin: 0 0 0.5rem;
  }
  .quadrant p {
    font-size: 0.875rem;
    color: #666;
    margin: 0 0 0.5rem;
  }
  .quadrant ul {
    margin: 0;
    padding-left: 1.25rem;
  }
  .quadrant li {
    font-size: 0.875rem;
  }
  .q1 { background: #e8f5e9; border-left: 4px solid #4caf50; }
  .q2 { background: #fff3e0; border-left: 4px solid #ff9800; }
  .q3 { background: #e3f2fd; border-left: 4px solid #2196f3; }
  .q4 { background: #ffebee; border-left: 4px solid #f44336; }
  .solution-card {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 12px;
    text-align: left;
  }
  .solution-meta {
    display: flex;
    gap: 1.5rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  }
  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .meta-label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .meta-value {
    font-weight: 600;
    color: #1a1a2e;
    font-size: 0.9375rem;
  }
  .meta-value.low { color: #4caf50; }
  .meta-value.medium { color: #ff9800; }
  .meta-value.high { color: #f44336; }
  .tools-section h4 {
    color: #0066ff;
    margin-top: 1rem;
  }
  .plan-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-top: 1rem;
  }
  .plan-day {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    text-align: left;
  }
  .day-badge {
    display: inline-block;
    background: #0066ff;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .tool-hint {
    font-size: 0.8125rem;
    color: #666;
    margin-top: 0.5rem;
  }
  .section-intro {
    font-size: 1.125rem;
    margin-bottom: 1.5rem;
  }
  .opportunities-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .opportunity-card {
    display: flex;
    gap: 1rem;
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    text-align: left;
  }
  .opp-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0066ff;
    min-width: 2rem;
  }
  .opp-content h4 {
    margin: 0 0 0.25rem;
  }
  .opp-content p {
    margin: 0;
    font-size: 0.9375rem;
  }
  .opp-cost {
    font-size: 0.8125rem;
    color: #0066ff;
    margin-top: 0.5rem !important;
    font-weight: 500;
  }
  .financial-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 1rem;
  }
  .fin-card {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 12px;
    text-align: left;
  }
  .fin-card h3 {
    font-size: 1rem;
    color: #666;
    margin: 0 0 0.5rem;
    font-weight: 500;
  }
  .fin-number {
    font-size: 2rem;
    font-weight: 700;
    color: #0066ff;
    margin: 0;
  }
  .next-steps {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
  }
  .steps-list {
    text-align: left;
    max-width: 700px;
    margin: 1.5rem 0;
    padding-left: 1.5rem;
  }
  .steps-list li {
    margin-bottom: 1rem;
    font-size: 1.125rem;
    line-height: 1.6;
  }
  .cta-wrapper {
    margin-top: 2rem;
  }
</style>
