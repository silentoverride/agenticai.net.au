<script lang="ts">
  import CalendlyButton from '$lib/components/CalendlyButton.svelte';
  import type { AnalysisDeeperOpportunity, AnalysisFinancialImpact } from '$lib/server/assessment/types';

  interface Props {
    opportunities: AnalysisDeeperOpportunity[];
    financialImpact?: AnalysisFinancialImpact;
  }

  let { opportunities, financialImpact }: Props = $props();

  type FilterKey = 'all' | 'low' | 'medium' | 'high';
  let effortFilter = $state<FilterKey>('all');

  /** Derive effort level from setup cost estimate. */
  function effortLevel(opp: AnalysisDeeperOpportunity): 'low' | 'medium' | 'high' {
    const cost = opp.estimated_setup_cost_aud ?? 0;
    if (cost < 5000) return 'low';
    if (cost < 20000) return 'medium';
    return 'high';
  }

  function effortLabel(e: 'low' | 'medium' | 'high'): string {
    return e === 'low' ? 'Low' : e === 'medium' ? 'Medium' : 'High';
  }

  /** Estimate ROI potential (months to break even). */
  function roiEstimate(opp: AnalysisDeeperOpportunity): string {
    const cost = opp.estimated_setup_cost_aud ?? 0;
    const monthly = opp.estimated_monthly_value_aud ?? 0;
    if (cost === 0) return 'N/A';
    if (monthly === 0) return 'Unknown';
    const months = Math.ceil(cost / monthly);
    if (months <= 3) return 'Quick (≤3 mo)';
    if (months <= 6) return 'Short (3–6 mo)';
    if (months <= 12) return 'Medium (6–12 mo)';
    return 'Long-term (>12 mo)';
  }

  /** Estimate timeline from setup cost. */
  function timelineEstimate(opp: AnalysisDeeperOpportunity): string {
    const cost = opp.estimated_setup_cost_aud ?? 0;
    if (cost < 5000) return '1–2 weeks';
    if (cost < 20000) return '2–4 weeks';
    if (cost < 50000) return '1–3 months';
    return '3–6 months';
  }

  /** Investment range string. */
  function investmentRange(opp: AnalysisDeeperOpportunity): string {
    const cost = opp.estimated_setup_cost_aud;
    if (cost == null) return 'Variable';
    return `~$${cost.toLocaleString()} AUD`;
  }

  /** ROI colour class. */
  function roiClass(roi: string): string {
    if (roi.startsWith('Quick')) return 'roi-quick';
    if (roi.startsWith('Short')) return 'roi-short';
    if (roi.startsWith('Medium')) return 'roi-medium';
    return 'roi-long';
  }

  let filtered = $derived(
    effortFilter === 'all'
      ? opportunities
      : opportunities.filter(o => effortLevel(o) === effortFilter)
  );

  let selectedOpp = $state<AnalysisDeeperOpportunity | null>(null);

  function toggleDetail(opp: AnalysisDeeperOpportunity) {
    selectedOpp = selectedOpp === opp ? null : opp;
  }
</script>

<div class="opp-map">
  <!-- Filter bar -->
  {#if opportunities.length > 1}
    <div class="filter-bar">
      <span class="filter-label">Filter by effort:</span>
      {#each ['all', 'low', 'medium', 'high'] as f}
        <button
          class="filter-btn"
          class:active={effortFilter === f}
          onclick={() => effortFilter = f as FilterKey}
        >
          {f === 'all' ? 'All' : effortLabel(f as 'low' | 'medium' | 'high')}
          {#if f !== 'all'}
            <span class="filter-count">({opportunities.filter(o => effortLevel(o) === f).length})</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Grid -->
  <div class="opp-grid">
    {#each filtered as opp, i (opp.title)}
      <div
        class="opp-card"
        class:selected={selectedOpp === opp}
        style="animation-delay: {i * 0.08}s"
        onclick={() => toggleDetail(opp)}
        onkeydown={(e) => e.key === 'Enter' && toggleDetail(opp)}
        role="button"
        tabindex="0"
        aria-expanded={selectedOpp === opp}
      >
        <!-- Effort indicator -->
        <div class="effort-strip" class:effort-low={effortLevel(opp) === 'low'} class:effort-medium={effortLevel(opp) === 'medium'} class:effort-high={effortLevel(opp) === 'high'}>
          {effortLabel(effortLevel(opp))} Effort
        </div>

        <div class="card-body">
          <h3>{opp.title}</h3>
          <p class="desc">{opp.description}</p>

          <div class="card-metrics">
            {#if opp.estimated_setup_cost_aud != null}
              <div class="metric">
                <span class="metric-icon" aria-hidden="true">💰</span>
                <div>
                  <span class="metric-label">Investment</span>
                  <span class="metric-value">{investmentRange(opp)}</span>
                </div>
              </div>
            {/if}

            {#if opp.estimated_monthly_value_aud != null}
              <div class="metric">
                <span class="metric-icon" aria-hidden="true">📈</span>
                <div>
                  <span class="metric-label">Monthly Value</span>
                  <span class="metric-value">~${opp.estimated_monthly_value_aud.toLocaleString()}/mo</span>
                </div>
              </div>
            {/if}

            <div class="metric">
              <span class="metric-icon" aria-hidden="true">⏱️</span>
              <div>
                <span class="metric-label">Timeline</span>
                <span class="metric-value">{timelineEstimate(opp)}</span>
              </div>
            </div>

            <div class="metric">
              <span class="metric-icon" aria-hidden="true">🎯</span>
              <div>
                <span class="metric-label">ROI</span>
                <span class="metric-value {roiClass(roiEstimate(opp))}">{roiEstimate(opp)}</span>
              </div>
            </div>
          </div>

          <!-- Expanded detail -->
          {#if selectedOpp === opp}
            <div class="detail-panel">
              {#if financialImpact?.annual_value_aud != null}
                <div class="detail-row">
                  <strong>Annual value potential:</strong>
                  <span>${financialImpact.annual_value_aud.toLocaleString()} AUD</span>
                </div>
              {/if}
              {#if opp.estimated_setup_cost_aud != null && opp.estimated_monthly_value_aud != null}
                <div class="detail-row">
                  <strong>Break-even:</strong>
                  <span>~{Math.ceil(opp.estimated_setup_cost_aud / opp.estimated_monthly_value_aud)} months</span>
                </div>
              {/if}
              <div class="detail-row">
                <strong>Recommended next step:</strong>
                <span>Book a consultation to discuss next steps</span>
              </div>
              <div class="calendly-wrapper">
                <CalendlyButton label="Book Consultation to Discuss" />
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div class="empty-state">
      <p>No opportunities match this filter.</p>
      <button class="clear-filter" onclick={() => effortFilter = 'all'}>Show all</button>
    </div>
  {/if}
</div>

<style>
  .opp-map {
    max-width: 960px;
    margin: 0 auto;
  }

  /* Filter bar */
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }
  .filter-label {
    font-size: 0.875rem;
    color: var(--color-muted);
    font-weight: 500;
    margin-right: 0.25rem;
  }
  .filter-btn {
    padding: 0.35rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-sm);
    background: var(--color-panel);
    font-size: 0.8125rem;
    cursor: pointer;
    color: var(--color-ink-2);
    transition: all 0.15s;
  }
  .filter-btn:hover {
    border-color: var(--color-accent-text);
    color: var(--color-accent-text);
  }
  .filter-btn.active {
    background: var(--color-accent-light);
    border-color: var(--color-accent-text);
    color: var(--color-accent-text);
    font-weight: 600;
  }
  .filter-count {
    color: var(--color-muted-2);
    margin-left: 0.2rem;
    font-weight: 400;
  }

  /* Grid */
  .opp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 1.25rem;
  }
  @media (max-width: 640px) {
    .opp-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Card */
  .opp-card {
    background: var(--color-panel);
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    animation: fadeSlideUp 0.35s ease-out both;
  }
  .opp-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-panel);
  }
  .opp-card.selected {
    border-color: var(--color-accent-text);
    box-shadow: 0 0 0 1px var(--color-accent), var(--shadow-panel);
  }

  /* Effort strip */
  .effort-strip {
    padding: 0.4rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .effort-low { background: #ecfdf5; color: var(--color-success); }
  .effort-medium { background: #fffbeb; color: var(--color-warm); }
  .effort-high { background: #fffbeb; color: #b45309; } /* warm-amber (matches badge-warning — was red bg / blue text) */

  .card-body {
    padding: 1.25rem;
  }
  .card-body h3 {
    font-size: 1.125rem;
    margin: 0 0 0.5rem;
    color: var(--color-ink);
  }
  .desc {
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0 0 1rem;
  }

  /* Metrics */
  .card-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  @media (max-width: 400px) {
    .card-metrics {
      grid-template-columns: 1fr;
    }
  }
  .metric {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .metric-icon {
    font-size: 1rem;
    line-height: 1;
    margin-top: 0.1rem;
  }
  .metric-label {
    display: block;
    font-size: 0.6875rem;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .metric-value {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-ink);
  }
  .roi-quick { color: var(--color-success); }
  .roi-short { color: var(--color-accent-text); }
  .roi-medium { color: var(--color-warm); }
  .roi-long { color: var(--color-ink-2); }

  /* Detail panel */
  .detail-panel {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-accent-light);
    border: 1px solid var(--color-accent-mid);
    border-radius: var(--radius-sm);
    animation: fadeSlideUp 0.2s ease-out both;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.8125rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid var(--color-line);
  }
  .detail-row:last-of-type {
    border-bottom: none;
  }
  .detail-row strong {
    color: var(--color-ink-2);
  }
  .detail-row span {
    color: var(--color-ink);
    font-weight: 500;
  }
  .calendly-wrapper {
    margin-top: 0.75rem;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--color-muted);
    background: var(--color-panel-soft);
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
  }
  .clear-filter {
    margin-top: 0.75rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-sm);
    background: var(--color-panel);
    color: var(--color-accent-text);
    cursor: pointer;
    font-size: 0.875rem;
  }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .opp-card { animation: none; }
  }
</style>
