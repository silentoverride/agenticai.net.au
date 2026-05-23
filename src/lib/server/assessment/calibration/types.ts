/**
 * Calibration Tooling — types and schema for golden test case calibration.
 *
 * Golden test cases are pre-curated input/output pairs that verify gate
 * behavior. Operators run gates against these cases to detect regressions
 * and tune prompts/thresholds.
 */

import type { GateVerdict } from '../types';

/**
 * A single golden test case.
 */
export interface GoldenTestCase {
  /** Unique identifier for this test case. */
  id: string;
  /** Human-readable name describing the scenario being tested. */
  name: string;
  /** A short description of what this test case validates. */
  description: string;
  /** The simulated assessment transcript (gate input content). */
  transcript: string;
  /** The expected gate verdict for each gate type. */
  expectedVerdicts: Record<string, GateVerdict>;
  /** Optional: minimum confidence threshold for this case. */
  minConfidence?: number;
  /** Tags for filtering (e.g. 'quick-win', 'hallucination', 'edge-case'). */
  tags: string[];
  /** Notes about why this case was created. */
  notes?: string;
}

/**
 * A single gate evaluation result against a golden test case.
 */
export interface GoldenGateResult {
  /** The gate type that was evaluated. */
  gateType: string;
  /** The verdict returned by the gate. */
  verdict: GateVerdict;
  /** The expected verdict from the golden case. */
  expectedVerdict: GateVerdict;
  /** Whether the verdict matches the expected value. */
  passed: boolean;
  /** Confidence score 0–1. */
  confidence: number;
  /** Reasoning from the gate. */
  reasoning: string;
  /** Evaluation time in ms. */
  evaluationTimeMs: number;
  /** Prompt version used. */
  promptVersion: string;
  /** Token usage if available. */
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

/**
 * A single golden test case result from a calibration run.
 */
export interface GoldenCaseResult {
  /** The test case that was evaluated. */
  testCaseId: string;
  /** Test case name. */
  testCaseName: string;
  /** Results per gate type. */
  gateResults: GoldenGateResult[];
  /** Whether ALL gates passed for this case. */
  overallPassed: boolean;
  /** Any error that occurred during evaluation. */
  error?: string;
}

/**
 * A complete calibration run report.
 */
export interface CalibrationRunReport {
  /** Unique run ID. */
  runId: string;
  /** ISO timestamp of the run. */
  timestamp: string;
  /** Prompt version used for this run. */
  promptVersion: string;
  /** Gate types included in this run. */
  gateTypes: string[];
  /** Results per test case. */
  caseResults: GoldenCaseResult[];
  /** Aggregate statistics. */
  summary: CalibrationRunSummary;
}

/**
 * Aggregate summary for a calibration run.
 */
export interface CalibrationRunSummary {
  /** Total test cases. */
  totalCases: number;
  /** Cases where ALL gates passed. */
  passedCases: number;
  /** Cases where at least one gate failed. */
  failedCases: number;
  /** Total gate evaluations. */
  totalEvaluations: number;
  /** Gate evaluations that passed. */
  passedEvaluations: number;
  /** Gate evaluations that failed. */
  failedEvaluations: number;
  /** Pass rate (0–1). */
  passRate: number;
  /** Average confidence across all evaluations. */
  averageConfidence: number;
  /** Total evaluation time in ms. */
  totalEvaluationTimeMs: number;
}

/**
 * Calibration configuration (thresholds, model selection).
 */
export interface CalibrationConfig {
  /** Confidence threshold for blocking mode (default: 0.7). */
  blockConfidenceThreshold: number;
  /** Confidence threshold for retry mode (default: 0.5). */
  retryConfidenceThreshold: number;
  /** Max retries per gate (default: 2). */
  maxRetries: number;
  /** Model to use for gate evaluation. */
  model: string;
  /** Prompt version string. */
  promptVersion: string;
  /** Whether to include token usage tracking. */
  includeUsage: boolean;
}

export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  blockConfidenceThreshold: 0.7,
  retryConfidenceThreshold: 0.5,
  maxRetries: 2,
  model: 'gpt-4.1-mini',
  promptVersion: 'v1',
  includeUsage: true
};
