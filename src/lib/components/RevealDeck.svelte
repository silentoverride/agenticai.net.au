<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Reveal from 'reveal.js';
  import CalendlyButton from './CalendlyButton.svelte';
  import 'reveal.js/reveal.css';

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

    if (typeof window !== 'undefined' && window.location.search.includes('print-pdf')) {
      setTimeout(() => window.print(), 1200);
    }
  });

  onDestroy(() => {
    if (deck) deck.destroy();
  });

  function getPainPoints() {
    return Array.isArray(analysis?.pain_points) ? analysis.pain_points : [];
  }

  function getQuickWins() {
    return Array.isArray(analysis?.quick_wins) ? analysis.quick_wins : [];
  }

  function getResearchedTools() {
    return Array.isArray(analysis?.researched_tools) ? analysis.researched_tools : [];
  }

  function getDeeperOpportunities() {
    return Array.isArray(analysis?.deeper_opportunities) ? analysis.deeper_opportunities : [];
  }

  function getFinancialImpact() {
    return analysis?.financial_impact || {};
  }

  function getTotalHoursSaved(): number {
    return getFinancialImpact().hours_saved_per_week ||
      getQuickWins().reduce((sum: number, w: any) => sum + (w.estimated_hours_saved_per_week || 0), 0);
  }

  function getMonthlyToolCost(): number {
    const fi = getFinancialImpact();
    if (fi.estimated_tool_costs_monthly_aud != null) return fi.estimated_tool_costs_monthly_aud;
    // fallback: parse pricing from researched_tools
    return getResearchedTools().reduce((sum: number, t: any) => {
      const match = String(t.pricing || '').match(/\$?([\d]+)/);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
  }

  function getMonthlyNetRoi(): number {
    const fi = getFinancialImpact();
    if (fi.weekly_value_aud && fi.estimated_tool_costs_monthly_aud != null) {
      return Math.round(fi.weekly_value_aud * 4.33 - fi.estimated_tool_costs_monthly_aud);
    }
    return fi.net_annual_value_aud ? Math.round(fi.net_annual_value_aud / 12) : 0;
  }

  function getAnnualValue(): number {
    return getFinancialImpact().annual_value_aud || getFinancialImpact().net_annual_value_aud || 0;
  }

  function matchToolForWin(win: any) {
    const tools = getResearchedTools();
    const name = win.recommended_tools?.[0];
    if (!name) return null;
    return (
      tools.find((t: any) => t.name?.toLowerCase().includes(name.toLowerCase())) ||
      tools.find((t: any) => name.toLowerCase().includes(t.name?.toLowerCase())) ||
      null
    );
  }

  function complexityLabel(tool: any): string {
    const sc = tool?.setup_complexity || '';
    if (/plug.?and.?play|low|easy|simple/i.test(sc)) return 'plug-and-play';
    if (/medium|moderate|some/i.test(sc)) return 'some-setup';
    if (/high|complex|advanced/i.test(sc)) return 'advanced';
    return sc || 'some-setup';
  }

  function complexityEmoji(label: string): string {
    if (label === 'plug-and-play') return '⚡';
    if (label === 'some-setup') return '🔧';
    if (label === 'advanced') return '🧩';
    return '🔧';
  }

  function setupTime(tool: any): string {
    return tool?.setup_time_estimate || tool?.setup_time || '';
  }

  function toolTimeSaved(tool: any, win: any): string {
    const hrs = win?.estimated_hours_saved_per_week || tool?.estimated_hours_saved_per_week || '';
    return hrs ? `${hrs} hours/week` : '';
  }

  const assessmentDate = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
</script>

<div class="reveal-wrapper">
  <div bind:this={container} class="reveal">
    <div class="slides">
      {#if analysis}
        <!-- 1. Title -->
        <section class="slide-title-bg">
          <div class="title-content">
            <h1 class="title-heading">AI Tools Assessment</h1>
            <p class="title-sub">Prepared for {company || 'Your Business'}</p>
            <p class="title-date">Assessment Date: {assessmentDate}</p>
            <div class="title-separator"></div>
            <p class="title-by">Prepared by Agentic AI</p>
          </div>
        </section>

        <!-- 2. Executive Summary -->
        <section>
          <div class="section-header">
            <h2>Executive Summary</h2>
          </div>
          <div class="exec-grid">
            <div class="exec-card">
              <div class="exec-label">Pain</div>
              <ul class="exec-list">
                {#each getPainPoints() as pain}
                  <li>{pain.title}</li>
                {/each}
              </ul>
            </div>
            <div class="exec-card outcome">
              <div class="exec-label">Outcome</div>
              <p class="exec-text">{analysis.executive_summary || 'Targeted tool additions and better process automation can return significant time by eliminating manual steps and protecting strategic focus time.'}</p>
            </div>
          </div>
        </section>

        <!-- 3. Opportunity at a Glance + Quick Wins -->
        <section>
          <div class="section-header">
            <h2>The Opportunity at a Glance</h2>
          </div>
          <div class="glance-grid">
            <div class="glance-stat">
              <div class="glance-number">{getTotalHoursSaved()}</div>
              <div class="glance-label">Hours You Can Reclaim Weekly</div>
            </div>
            <div class="glance-stat">
              <div class="glance-number">{getQuickWins().length}</div>
              <div class="glance-label">Quick Wins Identified</div>
            </div>
          </div>
          <div class="glance-focus">
            <strong>Primary Focus:</strong> Efficiency (Time Savings)
          </div>
        </section>

        <!-- 4. Impact-Effort Matrix -->
        <section>
          <div class="section-header">
            <h2>Impact-Effort Matrix</h2>
          </div>
          <p class="matrix-desc">
            Your pain points have been analysed and placed into four quadrants based on their business impact and implementation effort.
            This report focuses on <strong>Quick Wins</strong> — the fixes that deliver the highest value with the least effort.
          </p>
          <div class="matrix-wrapper">
            <div class="matrix-axis matrix-axis-y">Impact →</div>
            <div class="matrix-grid">
              <div class="matrix-cell quick-wins">
                <div class="cell-title">⭐ Quick Wins</div>
                <div class="cell-sub">High Impact, Low Effort</div>
              </div>
              <div class="matrix-cell major">
                <div class="cell-title">🔨 Major Projects</div>
                <div class="cell-sub">High Impact, High Effort</div>
              </div>
              <div class="matrix-cell filler">
                <div class="cell-title">🧩 Fill-ins</div>
                <div class="cell-sub">Low Impact, Low Effort</div>
              </div>
              <div class="matrix-cell ignore">
                <div class="cell-title">🗑️ Ignore</div>
                <div class="cell-sub">Low Impact, High Effort</div>
              </div>
            </div>
            <div class="matrix-axis matrix-axis-x">Effort →</div>
          </div>
        </section>

        <!-- 5. Quick Wins Overview -->
        <section>
          <div class="section-header">
            <h2>Quick Wins</h2>
            <p class="section-sub">High Impact, Low Effort</p>
          </div>
          <div class="qw-list">
            {#each getQuickWins() as win, i}
              {@const tool = matchToolForWin(win)}
              <div class="qw-item">
                <div class="qw-num">{i + 1}</div>
                <div class="qw-body">
                  <div class="qw-title">
                    {win.title}
                    {#if win.effort}
                      <span class="qw-tag {win.effort}">{win.effort}</span>
                    {/if}
                  </div>
                  <div class="qw-desc">
                    {win.description?.slice(0, 120)}{win.description?.length > 120 ? '...' : ''}
                  </div>
                  {#if tool}
                    <div class="qw-tool">
                      → <strong>{tool.name}</strong>
                      {tool.pricing ? `· ${tool.pricing}` : ''}
                    </div>
                  {:else if win.recommended_tools?.[0]}
                    <div class="qw-tool">
                      → <strong>{win.recommended_tools[0]}</strong>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- 6. Recommended Solutions -->
        <section>
          <div class="section-header">
            <h2>Recommended Solutions</h2>
          </div>
          <div class="sol-grid">
            {#each getQuickWins() as win, i}
              {@const tool = matchToolForWin(win)}
              <div class="sol-card">
                <div class="sol-header">
                  <div class="sol-pain">{win.title}</div>
                  <div class="sol-arrow">→</div>
                  <div class="sol-tool">{tool?.name || win.recommended_tools?.[0] || 'Recommended Tool'}</div>
                </div>
                {#if tool?.description}
                  <p class="sol-why">
                    <strong>Why this fits:</strong> {tool.description}
                  </p>
                {:else}
                  <p class="sol-why">{win.description?.slice(0, 180)}{win.description?.length > 180 ? '...' : ''}</p>
                {/if}
                <div class="sol-meta-row">
                  <div class="sol-meta">
                    <span class="sol-meta-label">Complexity</span>
                    <span class="sol-meta-val">
                      {complexityEmoji(complexityLabel(tool))} {complexityLabel(tool)}
                    </span>
                  </div>
                  <div class="sol-meta">
                    <span class="sol-meta-label">Monthly Cost</span>
                    <span class="sol-meta-val">{tool?.pricing || '—'}</span>
                  </div>
                  <div class="sol-meta">
                    <span class="sol-meta-label">Setup Time</span>
                    <span class="sol-meta-val">{setupTime(tool) || '1–2 hours'}</span>
                  </div>
                  <div class="sol-meta">
                    <span class="sol-meta-label">Time Saved</span>
                    <span class="sol-meta-val highlight">{toolTimeSaved(tool, win) || `${win.estimated_hours_saved_per_week || '?'} hrs/week`}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- 7. 4-Day Quick Wins Plan -->
        <section>
          <div class="section-header">
            <h2>Your 4-Day Quick Wins Plan</h2>
          </div>
          <div class="plan-grid">
            {#each getQuickWins().slice(0, 4) as win, i}
              {@const tool = matchToolForWin(win)}
              <div class="plan-card">
                <div class="plan-day-badge">Day {i + 1}</div>
                <div class="plan-task">{win.title}</div>
                <div class="plan-tool">
                  Tool: <strong>{tool?.name || win.recommended_tools?.[0] || 'TBD'}</strong>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- 8. What Comes After Quick Wins -->
        <section>
          <div class="section-header">
            <h2>What Comes After Quick Wins</h2>
          </div>
          <div class="after-list">
            {#each getDeeperOpportunities() as opp, i}
              <div class="after-card">
                <div class="after-num">{String(i + 1).padStart(2, '0')}</div>
                <div class="after-body">
                  <div class="after-title">{opp.title}</div>
                  <p>{opp.description}</p>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- 9. Financial Impact -->
        <section>
          <div class="section-header">
            <h2>Financial Impact</h2>
          </div>
          <div class="fin-flex">
            <div class="fin-card-big">
              <div class="fin-label">Weekly Time Returned</div>
              <div class="fin-number">{getTotalHoursSaved()} hours</div>
            </div>
            <div class="fin-card-big accent">
              <div class="fin-label">Monthly Net ROI</div>
              <div class="fin-number">
                ${getMonthlyNetRoi().toLocaleString('en-AU') || '—'}
              </div>
            </div>
          </div>
          {#if getMonthlyToolCost() > 0}
            <p class="fin-note">
              Total monthly tool cost: ${getMonthlyToolCost()}
              {#if getAnnualValue() > 0}
                · Annual value: ${getAnnualValue().toLocaleString('en-AU')}
              {/if}
            </p>
          {/if}
        </section>

        <!-- 10. Next Steps + Calendly -->
        <section class="slide-title-bg">
          <div class="next-content">
            <h2 class="next-heading">Your Next Steps</h2>
            <ol class="next-list">
              <li>
                <strong>Implement the Quick Wins</strong> — Follow the plan exactly as outlined to reclaim time and stabilise operations.
              </li>
              <li>
                <strong>Schedule a 30-minute Review Call</strong> — We'll review results, validate wins, and decide if deeper automation is warranted.
              </li>
            </ol>
            <div class="next-cta">
              <CalendlyButton />
            </div>
          </div>
        </section>
      {/if}
    </div>
  </div>
</div>

<style>
  /* ====== Base Reveal Overrides ====== */
  .reveal-wrapper {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    aspect-ratio: 16/9;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    background: #fff;
  }
  :global(.reveal) {
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
    color: #1a1a2e;
  }
  :global(.reveal .slides) {
    text-align: center;
  }
  :global(.reveal .slides section) {
    padding: 1.5rem 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
  }

  /* ====== Title Background ====== */
  .slide-title-bg {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #fff;
  }
  .slide-title-bg :global(h2) { color: #fff !important; }

  /* ====== Section Header ====== */
  .section-header {
    margin-bottom: 1rem;
    text-align: center;
  }
  .section-header h2 {
    font-size: 2rem;
    color: #1a1a2e;
    margin: 0 0 0.25rem;
  }
  .section-sub {
    font-size: 1rem;
    color: #666;
    margin: 0;
  }

  /* ====== Slide 1: Title ====== */
  .title-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
  }
  .title-heading {
    font-size: 2.75rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 0.75rem;
    letter-spacing: -0.02em;
  }
  .title-sub {
    font-size: 1.25rem;
    color: #a0a8b8;
    margin: 0 0 0.25rem;
  }
  .title-date {
    font-size: 1rem;
    color: #8890a0;
    margin: 0 0 1rem;
  }
  .title-separator {
    width: 80px;
    height: 3px;
    background: #e94560;
    border-radius: 2px;
    margin: 0.5rem 0 1.5rem;
  }
  .title-by {
    font-size: 0.875rem;
    color: #8890a0;
    margin: 0;
  }

  /* ====== Slide 2: Executive Summary ====== */
  .exec-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
  }
  .exec-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.25rem;
    text-align: left;
  }
  .exec-label {
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #0066ff;
    margin-bottom: 0.75rem;
  }
  .exec-list {
    margin: 0;
    padding-left: 1.25rem;
  }
  .exec-list li {
    font-size: 0.9375rem;
    line-height: 1.5;
    color: #333;
    margin-bottom: 0.35rem;
  }
  .exec-text {
    font-size: 0.9375rem;
    line-height: 1.55;
    color: #333;
    margin: 0;
  }

  /* ====== Slide 3: Opportunity ====== */
  .glance-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    max-width: 600px;
    margin: 1.5rem auto;
  }
  .glance-stat {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.25rem;
    text-align: center;
  }
  .glance-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: #0066ff;
    line-height: 1;
    margin-bottom: 0.35rem;
  }
  .glance-label {
    font-size: 0.8125rem;
    color: #666;
    line-height: 1.4;
  }
  .glance-focus {
    font-size: 1rem;
    color: #333;
    margin-top: 0.75rem;
  }

  /* ====== Slide 4: Matrix ====== */
  .matrix-desc {
    font-size: 0.9375rem;
    color: #444;
    max-width: 750px;
    margin: 0 auto 1.25rem;
    line-height: 1.5;
  }
  .matrix-wrapper {
    position: relative;
    max-width: 600px;
    margin: 0 auto;
  }
  .matrix-axis {
    font-size: 0.75rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .matrix-axis-y {
    position: absolute;
    left: -3.5rem;
    top: 50%;
    transform: rotate(-90deg) translateX(50%);
    transform-origin: center;
  }
  .matrix-axis-x {
    text-align: center;
    margin-top: 0.5rem;
  }
  .matrix-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .matrix-cell {
    padding: 0.75rem;
    border-radius: 6px;
    text-align: left;
    min-height: 90px;
  }
  .quick-wins { background: #e8f5e9; border-left: 3px solid #4caf50; }
  .major { background: #fff3e0; border-left: 3px solid #ff9800; }
  .filler { background: #e3f2fd; border-left: 3px solid #2196f3; }
  .ignore { background: #ffebee; border-left: 3px solid #f44336; }
  .cell-title {
    font-weight: 600;
    font-size: 0.9375rem;
    color: #1a1a2e;
    margin-bottom: 0.25rem;
  }
  .cell-sub {
    font-size: 0.75rem;
    color: #666;
  }

  /* ====== Slide 5: Quick Wins ====== */
  .qw-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    max-width: 850px;
    margin: 0 auto;
  }
  .qw-item {
    display: flex;
    gap: 0.75rem;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    text-align: left;
    align-items: flex-start;
  }
  .qw-num {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0066ff;
    min-width: 1.5rem;
    line-height: 1;
  }
  .qw-body {
    flex: 1;
  }
  .qw-title {
    font-weight: 600;
    font-size: 0.9375rem;
    color: #1a1a2e;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .qw-tag {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    background: #e0e0e0;
    color: #555;
  }
  .qw-tag.low { background: #e8f5e9; color: #2e7d32; }
  .qw-tag.medium { background: #fff3e0; color: #ef6c00; }
  .qw-tag.high { background: #ffebee; color: #c62828; }
  .qw-desc {
    font-size: 0.8125rem;
    color: #555;
    line-height: 1.4;
    margin-top: 0.2rem;
  }
  .qw-tool {
    font-size: 0.75rem;
    color: #0066ff;
    margin-top: 0.3rem;
  }
  .qw-tool strong {
    color: #1a1a2e;
  }

  /* ====== Slide 6: Recommended Solutions ====== */
  .sol-grid {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    max-width: 900px;
    margin: 0 auto;
  }
  .sol-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    text-align: left;
  }
  .sol-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
    font-size: 0.9375rem;
    flex-wrap: wrap;
  }
  .sol-pain {
    font-weight: 600;
    color: #333;
  }
  .sol-arrow {
    color: #0066ff;
    font-weight: 700;
  }
  .sol-tool {
    font-weight: 600;
    color: #0066ff;
  }
  .sol-why {
    font-size: 0.8125rem;
    color: #444;
    margin: 0 0 0.5rem;
    line-height: 1.4;
  }
  .sol-meta-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  .sol-meta {
    display: flex;
    flex-direction: column;
  }
  .sol-meta-label {
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #999;
    margin-bottom: 0.15rem;
  }
  .sol-meta-val {
    font-size: 0.8125rem;
    color: #1a1a2e;
    font-weight: 500;
  }
  .sol-meta-val.highlight {
    color: #0066ff;
  }

  /* ====== Slide 7: 4-Day Plan ====== */
  .plan-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    max-width: 700px;
    margin: 1rem auto 0;
  }
  .plan-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    text-align: left;
  }
  .plan-day-badge {
    display: inline-block;
    background: #1a1a2e;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }
  .plan-task {
    font-weight: 600;
    font-size: 0.9375rem;
    color: #1a1a2e;
    line-height: 1.3;
  }
  .plan-tool {
    font-size: 0.75rem;
    color: #666;
    margin-top: 0.35rem;
  }

  /* ====== Slide 8: Deeper Opportunities ====== */
  .after-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 800px;
    margin: 0 auto;
  }
  .after-card {
    display: flex;
    gap: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    text-align: left;
    align-items: flex-start;
  }
  .after-num {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0066ff;
    min-width: 2rem;
    line-height: 1;
  }
  .after-title {
    font-weight: 600;
    font-size: 1rem;
    color: #1a1a2e;
    margin-bottom: 0.25rem;
  }
  .after-body p {
    font-size: 0.875rem;
    color: #555;
    margin: 0;
    line-height: 1.45;
  }

  /* ====== Slide 9: Financial Impact ====== */
  .fin-flex {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    max-width: 650px;
    margin: 1rem auto;
  }
  .fin-card-big {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 1.5rem;
    text-align: center;
  }
  .fin-card-big.accent {
    background: #e8f0ff;
    border: 2px solid #0066ff;
  }
  .fin-label {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 0.5rem;
  }
  .fin-number {
    font-size: 2.25rem;
    font-weight: 700;
    color: #0066ff;
    line-height: 1;
  }
  .fin-note {
    font-size: 0.8125rem;
    color: #666;
    margin-top: 1rem;
  }

  /* ====== Slide 10: Next Steps ====== */
  .next-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 1rem;
  }
  .next-heading {
    font-size: 2.25rem;
    color: #fff;
    margin: 0 0 1.5rem;
  }
  .next-list {
    text-align: left;
    max-width: 650px;
    padding-left: 1.5rem;
    margin: 0 0 1.5rem;
  }
  .next-list li {
    font-size: 1.05rem;
    line-height: 1.55;
    color: #e0e0e0;
    margin-bottom: 0.75rem;
  }
  .next-list li strong {
    color: #fff;
  }
  .next-cta {
    margin-top: 1rem;
  }

  /* ====== Print overrides ====== */
  @media print {
    .reveal-wrapper {
      border-radius: 0;
      box-shadow: none;
    }
  }
</style>
