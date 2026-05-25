<script lang="ts">
  import { fade, slide } from 'svelte/transition';
  import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui';

  interface TestCaseMeta {
    id: string;
    name: string;
    description: string;
    tags: string[];
    expectedVerdicts: Record<string, string>;
  }

  interface GateEvalResult {
    gateType: string;
    verdict: string;
    expectedVerdict: string;
    passed: boolean;
    confidence: number;
    reasoning: string;
    evaluationTimeMs: number;
    promptVersion: string;
    tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }

  interface CaseResult {
    testCaseId: string;
    testCaseName: string;
    gateResults: GateEvalResult[];
    overallPassed: boolean;
    error?: string;
  }

  interface CalibrationReport {
    runId: string;
    timestamp: string;
    promptVersion: string;
    gateTypes: string[];
    caseResults: CaseResult[];
    summary: {
      totalCases: number;
      passedCases: number;
      failedCases: number;
      totalEvaluations: number;
      passedEvaluations: number;
      failedEvaluations: number;
      passRate: number;
      averageConfidence: number;
      totalEvaluationTimeMs: number;
    };
  }

  let testCases: TestCaseMeta[] = $state([]);
  let allTags: string[] = $state([]);
  let selectedTags: string[] = $state([]);
  let report: CalibrationReport | null = $state(null);
  let loading = $state(false);
  let error = $state('');
  let expandedCase: string | null = $state(null);
  let config = $state({
    promptVersion: 'v1',
    includeUsage: true
  });

  async function loadMetadata() {
    try {
      const res = await fetch('/api/operator/calibration/run');
      const data = (await res.json()) as {
        success?: boolean;
        cases: TestCaseMeta[];
        allTags: string[];
        defaultConfig: { promptVersion: string };
      };
      if (data.success) {
        testCases = data.cases;
        allTags = data.allTags;
        config.promptVersion = data.defaultConfig.promptVersion;
      }
    } catch (e) {
      error = 'Failed to load calibration metadata';
    }
  }

  async function runCalibration() {
    loading = true;
    error = '';
    report = null;

    try {
      const caseIds = selectedTags.length > 0
        ? testCases.filter(c => selectedTags.some(t => c.tags.includes(t))).map(c => c.id)
        : undefined;

      const res = await fetch('/api/operator/calibration/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseIds,
          config: {
            promptVersion: config.promptVersion,
            includeUsage: config.includeUsage
          }
        })
      });
      const data = (await res.json()) as { success?: boolean; report?: CalibrationReport; error?: string };
      if (data.success && data.report) {
        report = data.report;
      } else {
        error = data.error || 'Calibration run failed';
      }
    } catch (e) {
      error = 'Calibration request failed';
    } finally {
      loading = false;
    }
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
  }

  function toggleExpanded(caseId: string) {
    expandedCase = expandedCase === caseId ? null : caseId;
  }

  $effect(() => { loadMetadata(); });
</script>

<svelte:head>
  <title>Gate Calibration Tooling — Operator</title>
</svelte:head>

<div class="calibration-page">
  <header class="page-header">
    <h1>Gate Calibration Tooling</h1>
    <p>Run gates against golden test cases to verify behavior and tune prompts.</p>
  </header>

  <!-- Control Panel -->
  <Card>
    <CardHeader>
      <CardTitle>Calibration Controls</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="controls-grid">
        <div class="control-group">
          <label for="promptVersion">Prompt Version</label>
          <input
            id="promptVersion"
            type="text"
            bind:value={config.promptVersion}
            class="input"
          />
        </div>
        <div class="control-group">
          <label for="tag-filter">Filter by Tags</label>
          <div class="tag-list" id="tag-filter">
            {#each allTags as tag}
              <button
                class="tag-btn"
                class:active={selectedTags.includes(tag)}
                onclick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            {/each}
            {#if selectedTags.length > 0}
              <button class="tag-btn clear" onclick={() => selectedTags = []}>
                Clear
              </button>
            {/if}
          </div>
        </div>
      </div>

      <div class="actions">
        <Button onclick={runCalibration} disabled={loading}>
          {loading ? 'Running...' : 'Run Calibration'}
        </Button>
      </div>
    </CardContent>
  </Card>

  {#if error}
    <div class="error-banner" in:fade>
      {error}
    </div>
  {/if}

  <!-- Results -->
  {#if report}
    <div class="results-section" in:fade>
      <!-- Summary -->
      <Card>
        <CardHeader>
          <CardTitle>Calibration Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="summary-grid">
            <div class="summary-stat">
              <span class="stat-value" class:pass={report.summary.passRate >= 0.8}>
                {(report.summary.passRate * 100).toFixed(1)}%
              </span>
              <span class="stat-label">Pass Rate</span>
            </div>
            <div class="summary-stat">
              <span class="stat-value">{report.summary.passedCases}/{report.summary.totalCases}</span>
              <span class="stat-label">Cases Passed</span>
            </div>
            <div class="summary-stat">
              <span class="stat-value">{report.summary.passedEvaluations}/{report.summary.totalEvaluations}</span>
              <span class="stat-label">Gates Passed</span>
            </div>
            <div class="summary-stat">
              <span class="stat-value">{report.summary.averageConfidence.toFixed(2)}</span>
              <span class="stat-label">Avg Confidence</span>
            </div>
            <div class="summary-stat">
              <span class="stat-value">{report.summary.totalEvaluationTimeMs}ms</span>
              <span class="stat-label">Total Time</span>
            </div>
            <div class="summary-stat">
              <span class="stat-value code">{report.promptVersion}</span>
              <span class="stat-label">Prompt Version</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Per-case breakdown -->
      <h2 class="section-title">Per-Case Breakdown</h2>
      {#each report.caseResults as c (c.testCaseId)}
        <div class="case-card" in:slide>
          <button class="case-header" onclick={() => toggleExpanded(c.testCaseId)}>
            <span class="case-status">{c.overallPassed ? '✓' : '✗'}</span>
            <span class="case-id">{c.testCaseId}</span>
            <span class="case-name">{c.testCaseName}</span>
            <span class="chevron">{expandedCase === c.testCaseId ? '▼' : '▶'}</span>
          </button>

          {#if expandedCase === c.testCaseId}
            <div class="case-details" in:fade>
              {#each c.gateResults as g}
                <div class="gate-result" class:gate-failed={!g.passed}>
                  <div class="gate-header">
                    <Badge variant={g.passed ? 'success' : 'danger'}>
                      {g.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                    <span class="gate-type">{g.gateType}</span>
                    <span class="gate-confidence">conf: {g.confidence.toFixed(2)}</span>
                    <span class="gate-time">{g.evaluationTimeMs}ms</span>
                  </div>
                  <div class="gate-verdicts">
                    <span>Expected: <strong>{g.expectedVerdict}</strong></span>
                    <span>Got: <strong class:wrong={!g.passed}>{g.verdict}</strong></span>
                  </div>
                  {#if g.reasoning}
                    <p class="gate-reasoning">{g.reasoning}</p>
                  {/if}
                  {#if g.tokenUsage}
                    <p class="gate-usage">
                      Tokens: {g.tokenUsage.totalTokens} (prompt: {g.tokenUsage.promptTokens}, completion: {g.tokenUsage.completionTokens})
                    </p>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .calibration-page {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
    margin: 0;
    color: var(--color-ink);
  }

  .page-header p {
    color: var(--color-ink-muted);
    margin: 0.5rem 0 0;
  }

  .controls-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .control-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-ink);
  }

  .input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    font-size: 0.875rem;
    background: var(--color-page);
    color: var(--color-ink);
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .tag-btn {
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: transparent;
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .tag-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .tag-btn.active {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }

  .tag-btn.clear {
    border-color: var(--color-danger, #ef4444);
    color: var(--color-danger, #ef4444);
  }

  .actions {
    margin-top: 1rem;
  }

  .error-banner {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: var(--color-danger-bg, #fef2f2);
    border: 1px solid var(--color-danger, #ef4444);
    border-radius: var(--radius);
    color: var(--color-danger, #b91c1c);
  }

  .results-section {
    margin-top: 2rem;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (max-width: 640px) {
    .summary-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .summary-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background: var(--color-page-muted, #f9fafb);
    border-radius: var(--radius);
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-ink);
  }

  .stat-value.pass {
    color: var(--color-success, #059669);
  }

  .stat-value.code {
    font-family: monospace;
    font-size: 1rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-title {
    margin: 1.5rem 0 0.75rem;
    font-size: 1.125rem;
  }

  .case-card {
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    margin-bottom: 0.5rem;
    overflow: hidden;
  }

  .case-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 0.9375rem;
    text-align: left;
    color: var(--color-ink);
  }

  .case-header:hover {
    background: var(--color-page-muted, #f9fafb);
  }

  .case-status {
    font-weight: 700;
    width: 1.25rem;
  }

  .case-status:has(+ .case-id) {
    color: var(--color-success, #059669);
  }

  .case-id {
    font-family: monospace;
    font-size: 0.8125rem;
    color: var(--color-ink-muted);
    min-width: 4.5rem;
  }

  .case-name {
    flex: 1;
  }

  .chevron {
    color: var(--color-ink-muted);
    font-size: 0.75rem;
  }

  .case-details {
    border-top: 1px solid var(--color-line);
    padding: 0.75rem 1rem;
  }

  .gate-result {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: var(--radius);
    background: var(--color-page-muted, #f9fafb);
  }

  .gate-result:last-child {
    margin-bottom: 0;
  }

  .gate-result.gate-failed {
    background: var(--color-danger-bg, #fef2f2);
  }

  .gate-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .gate-type {
    font-family: monospace;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .gate-confidence,
  .gate-time {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
  }

  .gate-verdicts {
    display: flex;
    gap: 1rem;
    font-size: 0.8125rem;
    margin-bottom: 0.375rem;
  }

  .gate-verdicts .wrong {
    color: var(--color-danger, #ef4444);
  }

  .gate-reasoning {
    font-size: 0.8125rem;
    color: var(--color-ink-muted);
    margin: 0.25rem 0;
    font-style: italic;
  }

  .gate-usage {
    font-size: 0.75rem;
    color: var(--color-ink-muted);
    margin: 0.25rem 0 0;
  }
</style>
