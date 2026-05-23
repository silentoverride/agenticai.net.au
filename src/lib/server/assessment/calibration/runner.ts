/**
 * Calibration Runner — batch runs gates against golden test cases.
 *
 * Orchestrates:
 * 1. Loading golden test cases
 * 2. Running each applicable gate against each case
 * 3. Producing a CalibrationRunReport with pass/fail per case
 * 4. Tracking prompt versions for A/B comparison
 */

import { runGate, type GateRunOptions } from '../gate/runner';
import { GOLDEN_TEST_CASES } from './golden-cases';
import { DEFAULT_CALIBRATION_CONFIG, type CalibrationConfig, type CalibrationRunReport, type CalibrationRunSummary, type GoldenCaseResult, type GoldenGateResult } from './types';
import type { GateVerdict } from '../types';

/**
 * Options for running a calibration batch.
 */
export interface CalibrationRunOptions {
  /** Specific test case IDs to run (runs all if empty). */
  caseIds?: string[];
  /** Specific gate types to run (runs all if empty). */
  gateTypes?: string[];
  /** Override the default calibration config. */
  config?: Partial<CalibrationConfig>;
  /** Gate runner options (provider, db, etc.). */
  gateOptions?: Omit<GateRunOptions, 'assessmentId' | 'content' | 'gateType' | 'retryCount'>;
}

/**
 * Run a calibration batch — evaluate gates against golden test cases.
 */
export async function runCalibration(
  options: CalibrationRunOptions = {}
): Promise<CalibrationRunReport> {
  const config: CalibrationConfig = { ...DEFAULT_CALIBRATION_CONFIG, ...options.config };
  const allGateTypes = options.gateTypes?.length
    ? options.gateTypes
    : ['quick-wins-verification', 'major-project-verification', 'report-review'];

  // Select test cases
  const cases = options.caseIds?.length
    ? GOLDEN_TEST_CASES.filter(c => options.caseIds!.includes(c.id))
    : GOLDEN_TEST_CASES;

  const runId = crypto.randomUUID();
  const startTime = Date.now();
  const caseResults: GoldenCaseResult[] = [];

  for (const testCase of cases) {
    const gateResults: GoldenGateResult[] = [];

    for (const gateType of allGateTypes) {
      try {
        const gateStartTime = Date.now();
        const result = await runGate({
          assessmentId: `calibration-${runId}`,
          content: testCase.transcript,
          gateType,
          retryCount: 0,
          mode: 'shadow',
          includeUsage: config.includeUsage,
          promptVersion: config.promptVersion,
          ...options.gateOptions
        });
        const evaluationTimeMs = Date.now() - gateStartTime;

        const expectedVerdict: GateVerdict = testCase.expectedVerdicts[gateType] ?? 'approve';

        gateResults.push({
          gateType,
          verdict: result.verdict,
          expectedVerdict,
          passed: result.verdict === expectedVerdict,
          confidence: result.confidence,
          reasoning: result.reasoning,
          evaluationTimeMs,
          promptVersion: config.promptVersion,
          tokenUsage: result.usage
        });
      } catch (err) {
        gateResults.push({
          gateType,
          verdict: 'block' as GateVerdict,
          expectedVerdict: testCase.expectedVerdicts[gateType] ?? 'approve',
          passed: false,
          confidence: 0,
          reasoning: `Gate evaluation error: ${err instanceof Error ? err.message : String(err)}`,
          evaluationTimeMs: 0,
          promptVersion: config.promptVersion
        });
      }
    }

    const overallPassed = gateResults.every(r => r.passed);
    caseResults.push({
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      gateResults,
      overallPassed
    });
  }

  const totalEvaluationTimeMs = Date.now() - startTime;

  // Build summary
  const summary = buildSummary(caseResults);

  return {
    runId,
    timestamp: new Date().toISOString(),
    promptVersion: config.promptVersion,
    gateTypes: allGateTypes,
    caseResults,
    summary
  };
}

/**
 * Build aggregate summary from case results.
 */
function buildSummary(caseResults: GoldenCaseResult[]): CalibrationRunSummary {
  const totalCases = caseResults.length;
  const passedCases = caseResults.filter(c => c.overallPassed).length;
  const failedCases = totalCases - passedCases;

  let totalEvaluations = 0;
  let passedEvaluations = 0;
  let totalConfidence = 0;
  let totalEvalTime = 0;

  for (const c of caseResults) {
    for (const g of c.gateResults) {
      totalEvaluations++;
      if (g.passed) passedEvaluations++;
      totalConfidence += g.confidence;
      totalEvalTime += g.evaluationTimeMs;
    }
  }

  return {
    totalCases,
    passedCases,
    failedCases,
    totalEvaluations,
    passedEvaluations,
    failedEvaluations: totalEvaluations - passedEvaluations,
    passRate: totalEvaluations > 0 ? passedEvaluations / totalEvaluations : 0,
    averageConfidence: totalEvaluations > 0 ? totalConfidence / totalEvaluations : 0,
    totalEvaluationTimeMs: totalEvalTime
  };
}

/**
 * Format a calibration report as a human-readable summary string.
 */
export function formatCalibrationSummary(report: CalibrationRunReport): string {
  const { summary, promptVersion, runId } = report;
  const passRatePct = (summary.passRate * 100).toFixed(1);
  const avgConf = summary.averageConfidence.toFixed(2);

  return [
    `=== Calibration Run: ${runId.slice(0, 8)} ===`,
    `Prompt Version: ${promptVersion}`,
    `Timestamp: ${report.timestamp}`,
    ``,
    `Results:`,
    `  Cases:   ${summary.passedCases}/${summary.totalCases} passed (${summary.failedCases} failed)`,
    `  Gates:   ${summary.passedEvaluations}/${summary.totalEvaluations} passed (${summary.failedEvaluations} failed)`,
    `  Rate:    ${passRatePct}% pass rate`,
    `  Avg Confidence: ${avgConf}`,
    `  Total Time: ${summary.totalEvaluationTimeMs}ms`,
    ``,
    `Per-case breakdown:`,
    ...report.caseResults.map(c => {
      const gates = c.gateResults.map(g =>
        `    ${g.gateType}: ${g.passed ? '✓' : '✗'} (expected=${g.expectedVerdict}, got=${g.verdict}, conf=${g.confidence.toFixed(2)})`
      ).join('\n');
      return `  ${c.overallPassed ? '✓' : '✗'} ${c.testCaseId} — ${c.testCaseName}\n${gates}`;
    })
  ].join('\n');
}
