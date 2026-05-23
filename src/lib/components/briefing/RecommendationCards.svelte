<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
  } from '$lib/components/ui/card';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { AnalysisQuickWin } from '$lib/server/assessment/types';

  interface Props {
    quickWins: AnalysisQuickWin[];
    transcript?: string;
    briefingHref?: string;
  }

  let { quickWins, transcript, briefingHref }: Props = $props();

  type SortKey = 'effort' | 'impact' | 'hours';
  let sortKey = $state<SortKey>('effort');
  let sortAsc = $state(true);

  /** Map effort string to numeric sort value. */
  function effortValue(e: AnalysisQuickWin['effort']): number {
    return e === 'low' ? 1 : e === 'medium' ? 2 : e === 'high' ? 3 : 2;
  }

  /** Derive an impact estimate string from the data. */
  function impactEstimate(w: AnalysisQuickWin): string {
    if (w.impact) return w.impact;
    if (w.estimated_hours_saved_per_week) {
      return `~${w.estimated_hours_saved_per_week} hrs/week saved`;
    }
    return '';
  }

  /** Derive a numeric impact value for sorting. */
  function impactValue(w: AnalysisQuickWin): number {
    if (w.estimated_hours_saved_per_week) return w.estimated_hours_saved_per_week;
    if (w.impact) {
      const m = w.impact.match(/(\d+)/);
      return m ? parseInt(m[1]) : 0;
    }
    return 0;
  }

  let sortedWins = $derived.by(() => {
    const sorted = [...quickWins].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'effort') {
        cmp = effortValue(a.effort) - effortValue(b.effort);
      } else if (sortKey === 'impact' || sortKey === 'hours') {
        cmp = impactValue(a) - impactValue(b);
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  });

  let expandedCards = $state<Set<number>>(new Set());

  function toggleEvidence(i: number) {
    const next = new Set(expandedCards);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    expandedCards = next;
  }

  function sortLabel(k: SortKey): string {
    return k === 'effort' ? 'Effort' : k === 'impact' ? 'Impact' : 'Hours Saved';
  }

  function toggleSort(k: SortKey) {
    if (sortKey === k) {
      sortAsc = !sortAsc;
    } else {
      sortKey = k;
      sortAsc = true;
    }
  }
</script>

<div class="rec-cards">
  <!-- Sort Controls -->
  <div class="sort-bar">
    <span class="sort-label">Sort by:</span>
    {#each ['effort', 'impact', 'hours'] as k}
      <button
        class="sort-btn"
        class:active={sortKey === k}
        onclick={() => toggleSort(k as SortKey)}
      >
        {sortLabel(k as SortKey)}
        {#if sortKey === k}
          <span class="sort-arrow">{sortAsc ? '↑' : '↓'}</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Cards -->
  <div class="cards-grid">
    {#each sortedWins as win, i}
      <Card class="rec-card">
        <CardHeader>
          <CardTitle>{win.title}</CardTitle>
          <CardDescription>
            {#if win.effort}
              <span
                class="effort-badge"
                class:effort-low={win.effort === 'low'}
                class:effort-medium={win.effort === 'medium'}
                class:effort-high={win.effort === 'high'}
              >
                {win.effort === 'low' ? 'Low' : win.effort === 'medium' ? 'Medium' : 'High'} Effort
              </span>
            {/if}
            {#if impactEstimate(win)}
              <span class="impact-badge">{impactEstimate(win)}</span>
            {/if}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p class="desc">{win.description}</p>

          {#if win.recommended_tools?.length}
            <div class="tools-row">
              <span class="tools-label">Recommended tools:</span>
              <span class="tools-list">{win.recommended_tools.join(', ')}</span>
            </div>
          {/if}
        </CardContent>

        <CardFooter>
          <div class="footer-row">
            {#if briefingHref}
              <a href={briefingHref} class="cta-link">
                <Button size="sm">View in Briefing</Button>
              </a>
            {/if}

            {#if transcript}
              <button
                class="evidence-toggle"
                onclick={() => toggleEvidence(i)}
              >
                {expandedCards.has(i) ? '▼' : '▶'} Supporting Evidence
              </button>
            {/if}
          </div>

          {#if transcript && expandedCards.has(i)}
            <div class="evidence-block">
              <p class="evidence-preview">
                {transcript.length > 300 ? transcript.slice(0, 300) + '…' : transcript}
              </p>
            </div>
          {/if}
        </CardFooter>
      </Card>
    {/each}
  </div>

  {#if quickWins.length === 0}
    <div class="empty-state">
      <p>No recommendations available yet.</p>
    </div>
  {/if}
</div>

<style>
  .rec-cards {
    max-width: 900px;
    margin: 0 auto;
  }

  /* Sort bar */
  .sort-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }
  .sort-label {
    font-size: 0.875rem;
    color: #888;
    font-weight: 500;
  }
  .sort-btn {
    padding: 0.35rem 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    font-size: 0.8125rem;
    cursor: pointer;
    color: #555;
    transition: all 0.15s;
  }
  .sort-btn:hover {
    border-color: #0066ff;
    color: #0066ff;
  }
  .sort-btn.active {
    background: #eef4ff;
    border-color: #0066ff;
    color: #0066ff;
    font-weight: 600;
  }
  .sort-arrow {
    margin-left: 0.2rem;
  }

  /* Grid */
  .cards-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Card refinements */
  :global(.rec-card) {
    border: 1px solid #eee;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: box-shadow 0.2s;
  }
  :global(.rec-card:hover) {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }

  /* Effort badges */
  .effort-badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-right: 0.5rem;
  }
  .effort-low { background: #e8f5e9; color: #2e7d32; }
  .effort-medium { background: #fff8e1; color: #f57f17; }
  .effort-high { background: #ffebee; color: #c62828; }

  .impact-badge {
    font-size: 0.75rem;
    color: #667eea;
    font-weight: 500;
  }

  .desc {
    color: #444;
    font-size: 0.9375rem;
    line-height: 1.6;
    margin: 0 0 0.75rem;
  }

  .tools-row {
    font-size: 0.8125rem;
    color: #666;
  }
  .tools-label {
    font-weight: 600;
    margin-right: 0.25rem;
  }
  .tools-list {
    color: #888;
  }

  .footer-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }
  .cta-link {
    text-decoration: none;
  }

  .evidence-toggle {
    background: none;
    border: 1px solid #e0e0e0;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    color: #667eea;
    cursor: pointer;
    transition: background 0.15s;
  }
  .evidence-toggle:hover {
    background: #f5f5ff;
  }

  .evidence-block {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: #fafafa;
    border-radius: 8px;
    border: 1px solid #eee;
    width: 100%;
  }
  .evidence-preview {
    font-size: 0.8125rem;
    color: #666;
    font-style: italic;
    line-height: 1.5;
    margin: 0;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #888;
    background: #fafafa;
    border-radius: 12px;
  }
</style>
