<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Reveal from 'reveal.js';
  import CalendlyButton from './CalendlyButton.svelte';
  import 'reveal.js/reveal.css';

  import type { AnalysisData, AnalysisQuickWin, AnalysisResearchedTool, AnalysisDeeperOpportunity, AnalysisPainPoint, AnalysisFinancialImpact } from '$lib/server/assessment/types';

  interface Props {
    analysis: AnalysisData;
    company?: string;
  }

  let { analysis, company }: Props = $props();
  let container: HTMLDivElement;
  let deck: import('reveal.js').RevealApi | null = null;

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

    // Auto-animate fragments when landing on a new slide
    const autoAnimateFragments = (slide: HTMLElement) => {
      const fragments = slide.querySelectorAll('.fragment:not(.visible)');
      if (fragments.length === 0) return;
      let i = 0;
      const step = () => {
        if (i >= fragments.length) return;
        deck?.nextFragment();
        i++;
        setTimeout(step, 550);
      };
      setTimeout(step, 400);
    };

    deck.on('slidechanged', (event: any) => {
      autoAnimateFragments(event.currentSlide as HTMLElement);
      // Animate numbers in already-visible fragments on the new slide
      setTimeout(() => {
        (event.currentSlide as HTMLElement).querySelectorAll('.fragment.visible .count-up').forEach((el) => {
          const target = parseFloat((el as HTMLElement).dataset.countTarget || '0');
          const prefix = (el as HTMLElement).dataset.countPrefix || '';
          const suffix = (el as HTMLElement).dataset.countSuffix || '';
          const decimals = parseInt((el as HTMLElement).dataset.countDecimals || '0', 10);
          const duration = 1000;
          const start = performance.now();
          function tick(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;
            const formatted = decimals > 0
              ? current.toFixed(decimals)
              : Math.round(current).toLocaleString('en-AU');
            (el as HTMLElement).textContent = prefix + formatted + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      }, 600);
    });

    deck.on('fragmentshown', (event: any) => {
      const frag = event.fragment as HTMLElement;
      if (!frag) return;
      frag.querySelectorAll('.count-up').forEach((el) => {
        const target = parseFloat((el as HTMLElement).dataset.countTarget || '0');
        const prefix = (el as HTMLElement).dataset.countPrefix || '';
        const suffix = (el as HTMLElement).dataset.countSuffix || '';
        const decimals = parseInt((el as HTMLElement).dataset.countDecimals || '0', 10);
        const duration = 1000;
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;
          const formatted = decimals > 0
            ? current.toFixed(decimals)
            : Math.round(current).toLocaleString('en-AU');
          (el as HTMLElement).textContent = prefix + formatted + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    });

    deck.initialize();

    // Trigger on the initial slide after reveal finishes layout
    setTimeout(() => {
      const current = container.querySelector('.slides section.present');
      if (current) autoAnimateFragments(current as HTMLElement);
    }, 800);

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
      getQuickWins().reduce((sum: number, w: AnalysisQuickWin) => sum + (w.estimated_hours_saved_per_week || 0), 0);
  }

  function getMonthlyToolCost(): number {
    const fi = getFinancialImpact();
    if (fi.estimated_tool_costs_monthly_aud != null) return fi.estimated_tool_costs_monthly_aud;
    return getResearchedTools().reduce((sum: number, t: AnalysisResearchedTool) => {
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

  function matchToolForWin(win: AnalysisQuickWin) {
    const tools = getResearchedTools();
    const name = win.recommended_tools?.[0];
    if (!name) return null;
    return (
      tools.find((t: AnalysisResearchedTool) => t.name?.toLowerCase().includes(name.toLowerCase())) ||
      tools.find((t: AnalysisResearchedTool) => name.toLowerCase().includes(t.name?.toLowerCase())) ||
      null
    );
  }

  function complexityLabel(tool: AnalysisResearchedTool | null | undefined): string {
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

  function setupTime(tool: AnalysisResearchedTool | null | undefined): string {
    return tool?.setup_time_estimate || tool?.setup_time || '';
  }

  function toolTimeSaved(tool: AnalysisResearchedTool | null | undefined, win: AnalysisQuickWin): string {
    const hrs = win?.estimated_hours_saved_per_week || tool?.estimated_hours_saved_per_week || '';
    return hrs ? `${hrs} hours/week` : '';
  }

  /* ── SVG Chart helpers ──────────────────────────────────── */
  const CHART_COLORS = ['#2ea44f', '#0969da', '#bc4c00', '#7c3aed', '#e11d48', '#0d9488'];

  function chartBarWidth(value: number, max: number, width = 280): number {
    return max > 0 ? Math.max(4, Math.round((value / max) * width)) : 0;
  }

  function renderHoursGauge(hours: number, baseline = 40): string {
    const pct = Math.min(100, Math.round((hours / baseline) * 100));
    const cx = 250, cy = 60, r = 45, stroke = 8;
    const circ = 2 * Math.PI * r;
    const targetOffset = Math.round(circ - (pct / 100) * circ);
    return `<svg viewBox="0 0 500 120" class="chart-gauge"
      style="--gauge-circ: ${Math.round(circ)}; --gauge-target: ${targetOffset};"
    >
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="${stroke}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--color-accent)" stroke-width="${stroke}"
        stroke-dasharray="${Math.round(circ)}"
        stroke-dashoffset="${Math.round(circ)}"
        stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"
        class="gauge-arc"/>
      <text x="${cx}" y="${cy + 24}" text-anchor="middle" fill="var(--color-ink)" font-size="11" opacity="0.6">of ${baseline}h week</text>
    </svg>`;
  }

  function renderQuickWinsBars(wins: AnalysisQuickWin[]): string {
    if (!wins.length) return '';
    const max = Math.max(...wins.map((w) => w.estimated_hours_saved_per_week || 0), 1);
    const barH = 22, gap = 12, w = 280;
    const totalH = wins.length * (barH + gap) + gap;
    let svg = `<svg viewBox="0 0 580 ${totalH}" class="chart-bars">`;
    wins.forEach((win, i) => {
      const val = win.estimated_hours_saved_per_week || 0;
      const bw = chartBarWidth(val, max, w);
      const y = gap + i * (barH + gap);
      const color = CHART_COLORS[i % CHART_COLORS.length];
      svg += `<rect x="140" y="${y}" width="${bw}" height="${barH}" rx="4" fill="${color}" opacity="0.9"/>
        <text x="135" y="${y + 16}" text-anchor="end" fill="var(--color-ink)" font-size="12" font-weight="600">${win.title?.slice(0, 26)}${win.title?.length > 26 ? '…' : ''}</text>
        <text x="${140 + bw + 6}" y="${y + 16}" fill="var(--color-ink)" font-size="12" font-weight="700">${val} hrs/wk</text>`;
    });
    svg += '</svg>';
    return svg;
  }

  function getFinancialBars(): { annualVal: number; annualCost: number; max: number; savPct: number; costPct: number } {
    const fi = getFinancialImpact();
    const hours = fi.hours_saved_per_week || getTotalHoursSaved() || 0;
    const rate = fi.hourly_rate_assumed_aud || 150;
    const weeklyVal = fi.weekly_value_aud || hours * rate;
    const annualVal = fi.annual_value_aud || fi.net_annual_value_aud || weeklyVal * 4.33 * 12;
    const toolCost = fi.estimated_tool_costs_monthly_aud || getMonthlyToolCost() || 0;
    const annualCost = toolCost * 12;
    const max = Math.max(annualVal, annualCost, 1);
    const savPct = Math.round((annualVal / max) * 100);
    const costPct = Math.round((annualCost / max) * 100);
    return { annualVal, annualCost, max, savPct, costPct };
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

        <!-- ==================== SLIDE 1: TITLE ==================== -->
        <section class="slide-title-bg">
          <div class="title-content">
            <h1 class="title-heading fragment">AI Tools Assessment</h1>
            <p class="title-sub fragment">Prepared for {company || 'Your Business'}</p>
            <p class="title-date fragment">Assessment Date: {assessmentDate}</p>
            <div class="title-separator fragment"></div>
            <p class="title-by fragment">Prepared by Agentic AI</p>
          </div>
        </section>

        <!-- ==================== SLIDE 2: EXECUTIVE SUMMARY ==================== -->
        <section>
          <div class="section-header">
            <h2>Executive Summary</h2>
          </div>
          <div class="exec-grid">
            <div class="exec-card fragment">
              <div class="exec-label">Pain</div>
              <ul class="exec-list">
                {#each getPainPoints() as pain}
                  <li class="fragment">{pain.title}</li>
                {/each}
              </ul>
            </div>
            <div class="exec-card outcome fragment">
              <div class="exec-label">Outcome</div>
              <p class="exec-text">{analysis.executive_summary || 'Targeted tool additions and better process automation can return significant time by eliminating manual steps and protecting strategic focus time.'}</p>
            </div>
          </div>
        </section>

        <!-- ==================== SLIDE 3: OPPORTUNITY AT A GLANCE ==================== -->
        <section>
          <div class="section-header">
            <h2>The Opportunity at a Glance</h2>
          </div>
          <div class="glance-grid">
            <div class="glance-stat fragment">
              <div class="glance-number">{getTotalHoursSaved()}</div>
              <div class="glance-label">Hours You Can Reclaim Weekly</div>
            </div>
            <div class="glance-stat fragment">
              <div class="glance-number">{getQuickWins().length}</div>
              <div class="glance-label">Quick Wins Identified</div>
            </div>
          </div>
          <div class="glance-focus fragment">
            <strong>Primary Focus:</strong> Efficiency (Time Savings)
          </div>
          <div class="glance-chart fragment">
            {#if getTotalHoursSaved() > 0}
              {@const hours = getTotalHoursSaved()}
              {@html renderHoursGauge(hours)}
              <div class="gauge-hours count-up" data-count-target={hours} data-count-suffix="h">0h</div>
              <div class="glance-reclaim count-up" data-count-target={Math.round((hours / 40) * 100)} data-count-suffix="% reclaimable">0% reclaimable</div>
            {/if}
          </div>
        </section>

        <!-- ==================== SLIDE 4: IMPACT-EFFORT MATRIX ==================== -->
        <section>
          <div class="section-header">
            <h2>Impact-Effort Matrix</h2>
          </div>
          <p class="matrix-desc fragment">
            Your pain points have been analysed and placed into four quadrants based on their business impact and implementation effort.
            This report focuses on <strong>Quick Wins</strong> — the fixes that deliver the highest value with the least effort.
          </p>
          <div class="matrix-wrapper fragment">
            <div class="matrix-axis matrix-axis-y">Impact →</div>
            <div class="matrix-grid">
              <div class="matrix-cell quick-wins fragment">
                <div class="cell-title">⭐ Quick Wins</div>
                <div class="cell-sub">High Impact, Low Effort</div>
              </div>
              <div class="matrix-cell major fragment">
                <div class="cell-title">🔨 Major Projects</div>
                <div class="cell-sub">High Impact, High Effort</div>
              </div>
              <div class="matrix-cell filler fragment">
                <div class="cell-title">🧩 Fill-ins</div>
                <div class="cell-sub">Low Impact, Low Effort</div>
              </div>
              <div class="matrix-cell ignore fragment">
                <div class="cell-title">🗑️ Ignore</div>
                <div class="cell-sub">Low Impact, High Effort</div>
              </div>
            </div>
            <div class="matrix-axis matrix-axis-x">Effort →</div>
          </div>
        </section>

        <!-- ==================== SLIDE 5: QUICK WINS ==================== -->
        <section>
          <div class="section-header">
            <h2>Quick Wins</h2>
            <p class="section-sub">High Impact, Low Effort</p>
          </div>
          <div class="qw-list">
            {#each getQuickWins() as win, i}
              {@const tool = matchToolForWin(win)}
              <div class="qw-item fragment">
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
          {#if getQuickWins().some((w: AnalysisQuickWin) => w.estimated_hours_saved_per_week)}
            {@const qwMax = Math.max(...getQuickWins().map((w) => w.estimated_hours_saved_per_week || 0), 1)}
            <div class="qw-chart fragment">
              {#each getQuickWins() as win, i}
                {@const pct = Math.round(((win.estimated_hours_saved_per_week || 0) / qwMax) * 100)}
                <div class="qw-bar-row">
                  <div class="qw-bar-label">{win.title}</div>
                  <div class="qw-bar-track">
                    <div class="qw-bar-fill" style="--target-width: {pct}%; --bar-color: {CHART_COLORS[i % CHART_COLORS.length]}; --bar-delay: {i * 0.15}s"></div>
                  </div>
                  <div class="qw-bar-value count-up" data-count-target={win.estimated_hours_saved_per_week || 0} data-count-suffix=" hrs/wk">0 hrs/wk</div>
                </div>
              {/each}
            </div>
          {/if}
        </section>

        <!-- ==================== SLIDE 6: RECOMMENDED SOLUTIONS ==================== -->
        <section>
          <div class="section-header">
            <h2>Recommended Solutions</h2>
          </div>
          <div class="sol-grid">
            {#each getQuickWins() as win, i}
              {@const tool = matchToolForWin(win)}
              <div class="sol-card fragment">
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

        <!-- ==================== SLIDE 7: 4-DAY PLAN ==================== -->
        <section>
          <div class="section-header">
            <h2>Your 4-Day Quick Wins Plan</h2>
          </div>
          <div class="plan-grid">
            {#each getQuickWins().slice(0, 4) as win, i}
              {@const tool = matchToolForWin(win)}
              <div class="plan-card fragment">
                <div class="plan-day-badge">Day {i + 1}</div>
                <div class="plan-task">{win.title}</div>
                <div class="plan-tool">
                  Tool: <strong>{tool?.name || win.recommended_tools?.[0] || 'TBD'}</strong>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- ==================== SLIDE 8: DEEPER OPPORTUNITIES ==================== -->
        <section>
          <div class="section-header">
            <h2>What Comes After Quick Wins</h2>
          </div>
          <div class="after-list">
            {#each getDeeperOpportunities() as opp, i}
              <div class="after-card fragment">
                <div class="after-num">{String(i + 1).padStart(2, '0')}</div>
                <div class="after-body">
                  <div class="after-title">{opp.title}</div>
                  <p>{opp.description}</p>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- ==================== SLIDE 9: FINANCIAL IMPACT ==================== -->
        <section>
          <div class="section-header">
            <h2>Financial Impact</h2>
          </div>
          <div class="fin-flex">
            <div class="fin-card-big fragment">
              <div class="fin-label">Weekly Time Returned</div>
              <div class="fin-number">{getTotalHoursSaved()} hours</div>
            </div>
            <div class="fin-card-big accent fragment">
              <div class="fin-label">Monthly Net ROI</div>
              <div class="fin-number">
                ${getMonthlyNetRoi().toLocaleString('en-AU') || '—'}
              </div>
            </div>
          </div>
          {#if getMonthlyToolCost() > 0}
            <p class="fin-note fragment">
              Total monthly tool cost: ${getMonthlyToolCost()}
              {#if getAnnualValue() > 0}
                · Annual value: ${getAnnualValue().toLocaleString('en-AU')}
              {/if}
            </p>
          {/if}
          {#if true}
            {@const bars = getFinancialBars()}
            <div class="fin-chart fragment">
              <div class="fin-bar-row">
                <div class="fin-bar-label">Annual Value</div>
                <div class="fin-bar-track">
                  <div class="fin-bar-fill fin-bar-fill--green" style="--target-width: {bars.savPct}%; --bar-delay: 0s"></div>
                </div>
                <div class="fin-bar-value count-up" data-count-target={Math.round(bars.annualVal)} data-count-prefix="$">$0</div>
              </div>
              <div class="fin-bar-row">
                <div class="fin-bar-label">Annual Tool Cost</div>
                <div class="fin-bar-track">
                  <div class="fin-bar-fill fin-bar-fill--red" style="--target-width: {bars.costPct}%; --bar-delay: 0.2s"></div>
                </div>
                <div class="fin-bar-value count-up" data-count-target={Math.round(bars.annualCost)} data-count-prefix="$">$0</div>
              </div>
            </div>
          {/if}
        </section>

        <!-- ==================== SLIDE 10: NEXT STEPS + CALENDLY ==================== -->
        <section class="slide-title-bg">
          <div class="next-content">
            <h2 class="next-heading fragment">Your Next Steps</h2>
            <ol class="next-list">
              <li class="fragment">
                <strong>Implement the Quick Wins</strong> — Follow the plan exactly as outlined to reclaim time and stabilise operations.
              </li>
              <li class="fragment">
                <strong>Schedule a 30-minute Review Call</strong> — We'll review results, validate wins, and decide if deeper automation is warranted.
              </li>
            </ol>
            <div class="next-cta fragment">
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

  /* ====== Fragment animations ====== */
  :global(.reveal .slides section .fragment) {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.35s ease, transform 0.35s ease;
    will-change: opacity, transform;
  }
  :global(.reveal .slides section .fragment.visible) {
    opacity: 1;
    visibility: visible;
  }
  :global(.reveal .slides section .fragment.fade-up) {
    transform: translateY(16px);
  }
  :global(.reveal .slides section .fragment.fade-up.visible) {
    transform: translateY(0);
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
    font-size: 1rem;
    color: #444;
    max-width: 900px;
    margin: 0 auto 1.5rem;
    line-height: 1.5;
  }
  .matrix-wrapper {
    position: relative;
    max-width: 900px;
    margin: 0 auto;
  }
  .matrix-axis {
    font-size: 0.875rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .matrix-axis-y {
    position: absolute;
    left: -4.5rem;
    top: 50%;
    transform: rotate(-90deg) translateX(50%);
    transform-origin: center;
  }
  .matrix-axis-x {
    text-align: center;
    margin-top: 0.75rem;
  }
  .matrix-grid {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 10px;
  }
  .matrix-grid::before,
  .matrix-grid::after {
    content: '';
    position: absolute;
    background: rgba(0,0,0,0.12);
    pointer-events: none;
    z-index: 1;
  }
  .matrix-grid::before {
    /* Vertical axis line */
    top: 0.75rem;
    bottom: 0.75rem;
    left: 50%;
    width: 1px;
    transform: translateX(-50%);
  }
  .matrix-grid::after {
    /* Horizontal axis line */
    left: 0.75rem;
    right: 0.75rem;
    top: 50%;
    height: 1px;
    transform: translateY(-50%);
  }
  .matrix-cell {
    position: relative;
    z-index: 2;
    padding: 1.25rem;
    border-radius: 8px;
    text-align: left;
    min-height: 140px;
    opacity: 0;
    transform: translateY(12px);
    animation: matrixPop 0.5s ease-out forwards;
    animation-delay: var(--cell-delay, 0s);
  }
  @keyframes matrixPop {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .matrix-cell.quick-wins  { --cell-delay: 0s;   background: #e8f5e9; border-left: 4px solid #4caf50; }
  .matrix-cell.major       { --cell-delay: 0.15s; background: #fff3e0; border-left: 4px solid #ff9800; }
  .matrix-cell.filler      { --cell-delay: 0.3s;  background: #e3f2fd; border-left: 4px solid #2196f3; }
  .matrix-cell.ignore      { --cell-delay: 0.45s; background: #ffebee; border-left: 4px solid #f44336; }
  .cell-title {
    font-weight: 600;
    font-size: 1.125rem;
    color: #1a1a2e;
    margin-bottom: 0.375rem;
  }
  .cell-sub {
    font-size: 0.875rem;
    color: #666;
  }
  @media print {
    .matrix-cell {
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }
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

  /* ====== SVG Charts ====== */
  .chart-gauge {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    display: block;
  }
  .chart-bars {
    width: 100%;
    max-width: 580px;
    margin: 0 auto;
    display: block;
  }
  .glance-chart {
    margin-top: 0.5rem;
    text-align: center;
  }
  .glance-reclaim {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-ink);
    margin-top: 0.25rem;
  }
  .gauge-hours {
    font-size: 1.625rem;
    font-weight: 800;
    color: var(--color-accent);
    margin-top: -0.75rem;
    line-height: 1;
  }
  :global(.gauge-arc) {
    animation: gaugeDraw 1.2s ease-out forwards;
  }
  @keyframes gaugeDraw {
    from { stroke-dashoffset: var(--gauge-circ); }
    to   { stroke-dashoffset: var(--gauge-target); }
  }
  .qw-chart {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 950px;
    margin-left: auto;
    margin-right: auto;
  }
  .qw-bar-row {
    display: grid;
    grid-template-columns: 1fr 220px 100px;
    gap: 0.75rem;
    align-items: center;
    text-align: left;
  }
  .qw-bar-label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-ink, #1a1a2e);
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .qw-bar-track {
    background: rgba(0,0,0,0.06);
    border-radius: 6px;
    height: 28px;
    overflow: hidden;
  }
  .qw-bar-fill {
    height: 100%;
    border-radius: 6px;
    background: var(--bar-color, #0066ff);
    width: 0%;
    transform-origin: left center;
    animation: barGrowDramatic 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    animation-delay: var(--bar-delay, 0s);
  }
  @keyframes barGrowDramatic {
    0%   { width: 0%;   transform: scaleY(0.6); opacity: 0.4; }
    40%  { width: calc(var(--target-width) + 6%); transform: scaleY(1.15); opacity: 1; }
    70%  { width: calc(var(--target-width) - 2%); transform: scaleY(0.95); }
    100% { width: var(--target-width); transform: scaleY(1); opacity: 1; }
  }
  .qw-bar-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-ink, #1a1a2e);
    text-align: right;
  }
  .fin-chart {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 950px;
    margin-left: auto;
    margin-right: auto;
  }
  .fin-bar-row {
    display: grid;
    grid-template-columns: 140px 1fr 110px;
    gap: 0.75rem;
    align-items: center;
    text-align: left;
  }
  .fin-bar-label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-ink, #1a1a2e);
    line-height: 1.3;
  }
  .fin-bar-track {
    background: rgba(0,0,0,0.06);
    border-radius: 6px;
    height: 28px;
    overflow: hidden;
  }
  .fin-bar-fill {
    height: 100%;
    border-radius: 6px;
    width: 0%;
    transform-origin: left center;
    animation: barGrowDramatic 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    animation-delay: var(--bar-delay, 0s);
  }
  .fin-bar-fill--green {
    background: #2ea44f;
  }
  .fin-bar-fill--red {
    background: #e11d48;
  }
  .fin-bar-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-ink, #1a1a2e);
    text-align: right;
  }

  /* ====== Print overrides ====== */
  @media print {
    .reveal-wrapper {
      border-radius: 0;
      box-shadow: none;
    }
    :global(.reveal .slides section .fragment) {
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
    }
    .qw-bar-fill,
    .fin-bar-fill {
      animation: none !important;
      width: var(--target-width) !important;
      transform: scaleY(1) !important;
      opacity: 1 !important;
    }
  }
</style>
