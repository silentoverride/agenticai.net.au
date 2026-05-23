/**
 * Gate Regression Test Suite
 *
 * CI-compatible regression tests for gate behavior.
 *
 * Uses the golden test cases from calibration tooling (Story 2b.2) as
 * regression cases. Each test validates that gate verdicts match expected
 * values or fall within acceptable drift ranges.
 *
 * Two modes:
 *   1. Full mode (CI with OPENAI_API_KEY): runs actual gate evaluations
 *   2. Baseline mode (CI without key): compares against pre-recorded baseline
 *
 * Fails if regression rate drops below 80%.
 *
 * Usage:
 *   npm run test:gate-regression          # Full mode
 *   npm run test:gate-regression -- --record   # Record baseline
 *   npm run test:gate-regression -- --compare  # Compare against baseline
 *
 * Environment:
 *   GATE_REGRESSION_THRESHOLD  — pass rate threshold (default: 0.8)
 *   OPENAI_API_KEY             — required for full mode
 *   GATE_BASELINE_PATH         — path to baseline file (default: .scripts/gate-baseline.json)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { GOLDEN_TEST_CASES } from '$lib/server/assessment/calibration/golden-cases';
import { DEFAULT_CALIBRATION_CONFIG } from '$lib/server/assessment/calibration/types';
import type { GoldenGateResult } from '$lib/server/assessment/calibration/types';

const THRESHOLD = parseFloat(process.env.GATE_REGRESSION_THRESHOLD || '0.8');
const BASELINE_PATH = process.env.GATE_BASELINE_PATH || path.join(__dirname, 'gate-baseline.json');

interface RegressionCaseResult {
  testCaseId: string;
  testCaseName: string;
  gateType: string;
  expectedVerdict: string;
  actualVerdict: string;
  passed: boolean;
  confidence: number;
}

interface RegressionReport {
  runId: string;
  timestamp: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  threshold: number;
  passed: boolean;
  results: RegressionCaseResult[];
  warnings: string[];
}

function buildReport(results: RegressionCaseResult[]): RegressionReport {
  const totalCases = results.length;
  const passedCases = results.filter(r => r.passed).length;
  const failedCases = totalCases - passedCases;
  const passRate = totalCases > 0 ? passedCases / totalCases : 0;

  return {
    runId: `regression-${Date.now()}`,
    timestamp: new Date().toISOString(),
    totalCases,
    passedCases,
    failedCases,
    passRate,
    threshold: THRESHOLD,
    passed: passRate >= THRESHOLD,
    results,
    warnings: []
  };
}

/**
 * Load or create a baseline file for verdict drift detection.
 */
function loadBaseline(): Map<string, string> {
  try {
    if (fs.existsSync(BASELINE_PATH)) {
      const raw = fs.readFileSync(BASELINE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      const baseline = new Map<string, string>();
      for (const entry of data.entries) {
        baseline.set(entry.key, entry.verdict);
      }
      console.log(`[regression] Loaded baseline: ${baseline.size} entries from ${BASELINE_PATH}`);
      return baseline;
    }
  } catch (err) {
    console.warn(`[regression] Could not load baseline:`, err);
  }
  return new Map();
}

function saveBaseline(results: RegressionCaseResult[]): void {
  const entries = results.map(r => ({
    key: `${r.testCaseId}:${r.gateType}`,
    testCaseId: r.testCaseId,
    gateType: r.gateType,
    verdict: r.actualVerdict,
    confidence: r.confidence,
    timestamp: new Date().toISOString()
  }));

  const baseline = {
    createdAt: new Date().toISOString(),
    threshold: THRESHOLD,
    entries
  };

  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2));
  console.log(`[regression] Baseline saved: ${entries.length} entries to ${BASELINE_PATH}`);
}

/**
 * Run regression tests using golden test cases.
 * In CI without API key, uses baseline comparison for drift detection.
 */
async function runRegression(): Promise<RegressionReport> {
  const mode = process.argv.includes('--record') ? 'record'
    : process.argv.includes('--compare') ? 'compare'
    : 'full';

  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const results: RegressionCaseResult[] = [];

  console.log(`[regression] Mode: ${mode}, API key: ${hasApiKey ? 'yes' : 'no'}, Threshold: ${THRESHOLD}`);

  if (mode === 'compare' || (mode !== 'record' && !hasApiKey)) {
    // Drift detection mode: compare against baseline
    const baseline = loadBaseline();

    for (const testCase of GOLDEN_TEST_CASES) {
      for (const [gateType, expectedVerdict] of Object.entries(testCase.expectedVerdicts)) {
        const key = `${testCase.id}:${gateType}`;
        const baselineVerdict = baseline.get(key);

        if (!baselineVerdict) {
          results.push({
            testCaseId: testCase.id,
            testCaseName: testCase.name,
            gateType,
            expectedVerdict,
            actualVerdict: 'MISSING_BASELINE',
            passed: false,
            confidence: 0
          });
          continue;
        }

        const passed = baselineVerdict === expectedVerdict;
        results.push({
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          gateType,
          expectedVerdict,
          actualVerdict: baselineVerdict,
          passed,
          confidence: 1
        });
      }
    }

    const report = buildReport(results);
    if (baseline.size === 0) {
      report.warnings.push('No baseline file found — run with --record first to create one.');
      report.passed = false;
    }
    return report;
  }

  // Full mode or record mode: run actual gate evaluations
  // This requires OpenAI API key and real gate evaluation
  const { runGate } = await import('$lib/server/assessment/gate/runner');

  // Limit cases in CI to avoid excessive cost
  const cases = GOLDEN_TEST_CASES.slice(0, 5);

  for (const testCase of cases) {
    for (const [gateType, expectedVerdict] of Object.entries(testCase.expectedVerdicts)) {
      try {
        const result = await runGate({
          assessmentId: `regression-${testCase.id}`,
          content: testCase.transcript,
          gateType,
          mode: 'shadow',
          includeUsage: false,
          promptVersion: DEFAULT_CALIBRATION_CONFIG.promptVersion
        });

        const passed = result.verdict === expectedVerdict;
        results.push({
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          gateType,
          expectedVerdict,
          actualVerdict: result.verdict,
          passed,
          confidence: result.confidence
        });
      } catch (err) {
        results.push({
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          gateType,
          expectedVerdict,
          actualVerdict: 'ERROR',
          passed: false,
          confidence: 0
        });
      }
    }
  }

  const report = buildReport(results);

  if (mode === 'record') {
    saveBaseline(results);
  }

  return report;
}

describe('Gate Regression Test Suite', () => {
  let report: RegressionReport;

  beforeAll(async () => {
    report = await runRegression();
    console.log('\n=== Regression Report ===');
    console.log(`Pass Rate: ${(report.passRate * 100).toFixed(1)}% (threshold: ${(report.threshold * 100).toFixed(0)}%)`);
    console.log(`Passed: ${report.passedCases}/${report.totalCases} | Failed: ${report.failedCases}/${report.totalCases}`);
    console.log(`Status: ${report.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log('');

    if (report.warnings.length > 0) {
      console.warn('Warnings:');
      report.warnings.forEach(w => console.warn(`  ⚠ ${w}`));
    }

    if (report.failedCases > 0) {
      console.log('\nFailed cases:');
      for (const r of report.results) {
        if (!r.passed) {
          console.log(`  ✗ ${r.testCaseId}:${r.gateType} — expected=${r.expectedVerdict}, actual=${r.actualVerdict}`);
        }
      }
    }
  });

  it('should have at least one test case', () => {
    expect(report.totalCases).toBeGreaterThan(0);
  });

  it(`should meet regression threshold of ${(THRESHOLD * 100).toFixed(0)}%`, () => {
    expect(report.passed).toBe(true);
  });

  it('should have no missing baseline entries (drift mode)', () => {
    const missing = report.results.filter(r => r.actualVerdict === 'MISSING_BASELINE');
    expect(missing.length).toBe(0);
  });
});
