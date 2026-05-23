/**
 * Gate Runner — orchestrates gate evaluation and persistence.
 *
 * Coordinates:
 * 1. Selecting the right gate provider (default: GPT-5.5)
 * 2. Running the evaluation with the correct system prompt
 * 3. Applying the gate policy to determine the action
 * 4. Persisting the result to D1
 * 5. Returning the action for the pipeline to act on
 */

import { GateVerdict, applyGatePolicy, DEFAULT_GATE_POLICY } from './types';
import { gpt55Judge, type OpenAiGpt55JudgeProvider } from './gpt55-provider';
import { getGateDefinition } from './definitions';
import { D1GateStore, type GateRunRecord } from './gate-store';
import type { GateAction } from './types';

export interface GateRunOptions {
  /** The assessment order ID. */
  assessmentId: string;
  /** The content to evaluate (transcript, analysis, briefing). */
  content: string;
  /** Gate type to run. */
  gateType: string;
  /** Current retry count for this gate (0-based). */
  retryCount?: number;
  /** Optional D1 database for persisting results. */
  db?: D1Database;
  /** Override the default gate provider. */
  provider?: OpenAiGpt55JudgeProvider;
  /** Override the default gate policy. */
  policy?: typeof DEFAULT_GATE_POLICY;
  /** Include token usage in the result. */
  includeUsage?: boolean;
  /** Additional metadata for the gate run. */
  metadata?: Record<string, unknown>;
  /** Prompt version identifier. */
  promptVersion?: string;
}

export interface GateRunResult {
  /** The deterministic pipeline action. */
  action: GateAction;
  /** The raw verdict from the judge. */
  verdict: GateVerdict;
  /** Confidence score 0–1. */
  confidence: number;
  /** Human-readable reasoning. */
  reasoning: string;
  /** Detailed findings. */
  details?: string;
  /** The gate run ID (for persistence lookup). */
  gateRunId: string;
  /** Whether the gate passed (action is APPROVE). */
  passed: boolean;
  /** Token usage if requested. */
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

/**
 * Run a single gate evaluation.
 * Orchestrates: provider call → policy → persistence.
 */
export async function runGate(options: GateRunOptions): Promise<GateRunResult> {
  const {
    assessmentId,
    content,
    gateType,
    retryCount = 0,
    db,
    provider = gpt55Judge,
    policy = DEFAULT_GATE_POLICY,
    includeUsage = false,
    promptVersion = 'v1'
  } = options;

  const gateDef = getGateDefinition(gateType);
  if (!gateDef) {
    throw new Error(`Unknown gate type: "${gateType}". Available: quick-wins-verification, major-project-verification, report-review`);
  }

  const startTime = Date.now();

  // Step 1: Run the judge evaluation
  const result = await provider.evaluate(
    gateDef.systemPrompt,
    content,
    {
      reasoningEffort: gateDef.reasoningEffort,
      includeUsage
    }
  );

  const evaluationTimeMs = Date.now() - startTime;

  // Step 2: Apply gate policy
  const action = applyGatePolicy(result.verdict, result.confidence, retryCount, policy);

  // Step 3: Persist to D1
  const gateRunId = crypto.randomUUID();
  if (db) {
    const store = new D1GateStore(db);
    const record: GateRunRecord = {
      gateRunId,
      assessmentId,
      gateType,
      verdict: result.verdict,
      confidence: result.confidence,
      reasoning: result.reasoning,
      details: result.details,
      tokenUsage: result.usage,
      model: provider.modelId,
      promptVersion,
      reasoningEffort: gateDef.reasoningEffort,
      evaluationTimeMs,
      createdAt: new Date().toISOString()
    };

    try {
      await store.insert(record);
      console.info(`[gate:runner] Persisted gate run`, { gateRunId, assessmentId, gateType, verdict: result.verdict, action });
    } catch (err) {
      // Non-fatal: log but don't fail the pipeline
      console.error(`[gate:runner] Failed to persist gate run`, {
        gateRunId, assessmentId, gateType,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return {
    action,
    verdict: result.verdict,
    confidence: result.confidence,
    reasoning: result.reasoning,
    details: result.details,
    gateRunId,
    passed: action === 'approve',
    usage: result.usage
  };
}

/**
 * Run all applicable gates for a given assessment on a content artifact.
 * Runs them sequentially (parallel execution is a future optimization).
 */
export async function runAllGates(
  assessmentId: string,
  content: string,
  options: Omit<GateRunOptions, 'assessmentId' | 'content' | 'gateType'> = {}
): Promise<GateRunResult[]> {
  const gateTypes = ['quick-wins-verification', 'major-project-verification', 'report-review'];
  const results: GateRunResult[] = [];

  for (const gateType of gateTypes) {
    const result = await runGate({
      assessmentId,
      content,
      gateType,
      retryCount: 0,
      ...options
    });
    results.push(result);

    // If any gate blocks, stop — no point running further gates
    if (result.action === 'block' || result.action === 'escalate') {
      console.warn(`[gate:runner] Pipeline blocked by gate "${gateType}", skipping remaining gates`);
      break;
    }
  }

  return results;
}
