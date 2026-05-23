<script lang="ts">
  import type { AnalysisData } from '$lib/server/assessment/types';

  interface Props {
    analysis: AnalysisData;
    company?: string;
  }

  let { analysis, company }: Props = $props();

  let expandedSections = $state<Set<string>>(new Set());

  function toggleSection(key: string) {
    if (expandedSections.has(key)) {
      expandedSections.delete(key);
    } else {
      expandedSections.add(key);
    }
    // Trigger reactivity
    expandedSections = new Set(expandedSections);
  }
</script>

<div class="briefing-container">
  <!-- Header -->
  <header class="briefing-header">
    <h1>Advisory Briefing</h1>
    {#if company}
      <p class="company-name">{company}</p>
    {/if}
    <p class="briefing-date">Generated {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </header>

  <!-- Executive Summary -->
  {#if analysis.executive_summary}
    <section class="briefing-section premium-section">
      <div class="section-badge">Key Insights</div>
      <h2>Executive Summary</h2>
      <p class="section-content">{analysis.executive_summary}</p>
    </section>
  {/if}

  <!-- Quick Wins -->
  {#if analysis.quick_wins?.length}
    <section class="briefing-section">
      <h2>⚡ Quick Wins</h2>
      <p class="section-intro">These are low-effort, high-impact opportunities you can action immediately.</p>
      <div class="cards-grid">
        {#each analysis.quick_wins as win, i}
          <div class="insight-card" style="animation-delay: {i * 0.1}s">
            <div class="card-header">
              <h3>{win.title}</h3>
              {#if win.effort === 'low'}
                <span class="badge badge-green">Low Effort</span>
              {:else if win.effort === 'medium'}
                <span class="badge badge-amber">Medium Effort</span>
              {:else}
                <span class="badge badge-blue">{win.effort ?? 'Variable'} Effort</span>
              {/if}
            </div>
            <p>{win.description}</p>
            {#if win.impact}
              <p class="impact-tag">Impact: {win.impact}</p>
            {/if}
            {#if win.estimated_hours_saved_per_week}
              <p class="savings-tag">~{win.estimated_hours_saved_per_week} hrs/week saved</p>
            {/if}
            {#if win.recommended_tools?.length}
              <button
                class="evidence-toggle"
                onclick={() => toggleSection(`qw-tools-${i}`)}
              >
                {expandedSections.has(`qw-tools-${i}`) ? '▼' : '▶'} Recommended tools ({win.recommended_tools.length})
              </button>
              {#if expandedSections.has(`qw-tools-${i}`)}
                <ul class="evidence-list">
                  {#each win.recommended_tools as tool}
                    <li>{tool}</li>
                  {/each}
                </ul>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Deeper Opportunities -->
  {#if analysis.deeper_opportunities?.length}
    <section class="briefing-section">
      <h2>🔍 Deeper Opportunities</h2>
      <p class="section-intro">These are higher-value transformations that require more setup but deliver significant ongoing returns.</p>
      <div class="cards-grid">
        {#each analysis.deeper_opportunities as opp, i}
          <div class="insight-card opp-card" style="animation-delay: {i * 0.1}s">
            <h3>{opp.title}</h3>
            <p>{opp.description}</p>
            <div class="financial-details">
              {#if opp.estimated_setup_cost_aud != null}
                <span class="cost-tag">Setup: ${opp.estimated_setup_cost_aud.toLocaleString()} AUD</span>
              {/if}
              {#if opp.estimated_monthly_value_aud != null}
                <span class="value-tag">~${opp.estimated_monthly_value_aud.toLocaleString()}/mo value</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Recommended Tools -->
  {#if analysis.tool_recommendations?.length}
    <section class="briefing-section">
      <h2>🛠️ Recommended Tools</h2>
      <div class="tools-table">
        {#each analysis.tool_recommendations as tool}
          <div class="tool-row">
            <div class="tool-info">
              <strong>{tool.name}</strong>
              {#if tool.category}
                <span class="tool-category">{tool.category}</span>
              {/if}
            </div>
            <p class="tool-purpose">{tool.purpose}</p>
            <div class="tool-meta">
              {#if tool.estimated_monthly_cost_aud != null}
                <span>~${tool.estimated_monthly_cost_aud}/mo</span>
              {/if}
              {#if tool.setup_complexity}
                <span>Setup: {tool.setup_complexity}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Financial Impact -->
  {#if analysis.financial_impact}
    <section class="briefing-section premium-section">
      <div class="section-badge">ROI Summary</div>
      <h2>💰 Financial Impact</h2>
      <div class="financial-grid">
        {#if analysis.financial_impact.hours_saved_per_week != null}
          <div class="metric-card">
            <span class="metric-value">{analysis.financial_impact.hours_saved_per_week}h</span>
            <span class="metric-label">Hours saved / week</span>
          </div>
        {/if}
        {#if analysis.financial_impact.annual_value_aud != null}
          <div class="metric-card">
            <span class="metric-value">${analysis.financial_impact.annual_value_aud.toLocaleString()}</span>
            <span class="metric-label">Annual value (AUD)</span>
          </div>
        {/if}
        {#if analysis.financial_impact.net_annual_value_aud != null}
          <div class="metric-card highlight">
            <span class="metric-value">${analysis.financial_impact.net_annual_value_aud.toLocaleString()}</span>
            <span class="metric-label">Net annual value (AUD)</span>
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Methodology Note -->
  <section class="briefing-section methodology-section">
    <h2>📋 Methodology</h2>
    <div class="methodology-content">
      <p>
        This advisory briefing was generated by the Agentic AI Assessment Engine, which analyses
        your business context based on information gathered during your assessment call. The engine
        evaluates pain points, task automation potential, and AI tool suitability across your
        business operations.
      </p>
      <p>
        Recommendations are categorised as <strong>Quick Wins</strong> (low-effort, high-impact
        actions you can implement immediately) and <strong>Deeper Opportunities</strong>
        (transformational changes with higher setup investment and greater long-term value).
      </p>
      <p>
        All estimates are indicative only and should be validated through implementation.
        <em>Agentic AI Pty Ltd</em> provides this briefing as a starting point for your
        AI adoption journey.
      </p>
    </div>
  </section>
</div>

<style>
  .briefing-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    font-family: system-ui, -apple-system, sans-serif;
    color: #1a1a2e;
  }

  /* ── Header ── */
  .briefing-header {
    text-align: center;
    padding: 3rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    color: white;
    margin-bottom: 2rem;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  }
  .briefing-header h1 {
    font-size: 2rem;
    margin: 0 0 0.5rem;
    font-weight: 700;
  }
  .company-name {
    font-size: 1.25rem;
    margin: 0 0 0.5rem;
    opacity: 0.9;
  }
  .briefing-date {
    font-size: 0.875rem;
    opacity: 0.75;
    margin: 0;
  }

  /* ── Sections ── */
  .briefing-section {
    margin-bottom: 2.5rem;
    animation: fadeSlideUp 0.4s ease-out both;
  }
  .briefing-section h2 {
    font-size: 1.5rem;
    margin: 0 0 0.75rem;
    color: #1a1a2e;
  }
  .section-intro {
    color: #666;
    font-size: 0.9375rem;
    margin: -0.5rem 0 1.25rem;
  }
  .section-content {
    font-size: 1.0625rem;
    line-height: 1.7;
    color: #333;
  }

  /* ── Premium ── */
  .premium-section {
    background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%);
    border-radius: 12px;
    padding: 1.5rem 2rem;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.12);
  }
  .section-badge {
    display: inline-block;
    background: #667eea;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  /* ── Cards ── */
  .cards-grid {
    display: grid;
    gap: 1.25rem;
  }
  .insight-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    transition: transform 0.2s, box-shadow 0.2s;
    animation: fadeSlideUp 0.4s ease-out both;
  }
  .insight-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }
  .card-header h3 {
    margin: 0;
    font-size: 1.125rem;
    color: #1a1a2e;
  }

  /* ── Badges ── */
  .badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .badge-green { background: #e8f5e9; color: #2e7d32; }
  .badge-amber { background: #fff8e1; color: #f57f17; }
  .badge-blue { background: #e3f2fd; color: #1565c0; }

  .impact-tag, .savings-tag {
    font-size: 0.875rem;
    color: #667eea;
    margin: 0.25rem 0;
  }

  /* ── Expand/collapse evidence ── */
  .evidence-toggle {
    background: none;
    border: 1px solid #e0e0e0;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8125rem;
    color: #666;
    margin-top: 0.5rem;
    transition: background 0.2s;
  }
  .evidence-toggle:hover {
    background: #f5f5f5;
  }
  .evidence-list {
    margin: 0.5rem 0 0;
    padding-left: 1.5rem;
    color: #555;
    font-size: 0.875rem;
  }
  .evidence-list li {
    margin-bottom: 0.25rem;
  }

  /* ── Deeper opportunities ── */
  .opp-card {
    border-left: 4px solid #764ba2;
  }
  .financial-details {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }
  .cost-tag {
    background: #fff3e0;
    color: #e65100;
    padding: 0.25rem 0.75rem;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 500;
  }
  .value-tag {
    background: #e8f5e9;
    color: #2e7d32;
    padding: 0.25rem 0.75rem;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 500;
  }

  /* ── Tools table ── */
  .tools-table {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .tool-row {
    background: white;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  }
  .tool-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }
  .tool-category {
    font-size: 0.75rem;
    color: #888;
    background: #f5f5f5;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }
  .tool-purpose {
    color: #555;
    font-size: 0.875rem;
    margin: 0.25rem 0;
  }
  .tool-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8125rem;
    color: #888;
  }

  /* ── Financial grid ── */
  .financial-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  .metric-card {
    background: white;
    border-radius: 10px;
    padding: 1rem;
    text-align: center;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  }
  .metric-card.highlight {
    border: 2px solid #667eea;
    background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%);
  }
  .metric-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #667eea;
  }
  .metric-label {
    display: block;
    font-size: 0.8125rem;
    color: #888;
    margin-top: 0.25rem;
  }

  /* ── Methodology ── */
  .methodology-section {
    background: #fafafa;
    border-radius: 12px;
    padding: 1.5rem 2rem;
    border: 1px solid #eee;
  }
  .methodology-content p {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: #555;
    margin: 0 0 0.75rem;
  }
  .methodology-content p:last-child {
    margin-bottom: 0;
  }

  /* ── Animations ── */
  @keyframes fadeSlideUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
