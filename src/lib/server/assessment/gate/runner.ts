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
import { isGateActive, getGateMode, getGateMaxRetries, type GateMode } from './gate-mode';
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
  /**
   * Gate mode: 'shadow' = log only, 'blocking' = can halt pipeline.
   * Overrides the env-var-based mode if set.
   */
  mode?: GateMode;
  /** Env var overrides for gate configuration. */
  envOverrides?: Record<string, string | undefined>;
  /** Route human_assist verdict to operator escalation. */
  routeHumanAssist?: boolean;
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
  /** Whether the gate ran in shadow mode (logged but did not block). */
  shadowMode?: boolean;
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
    promptVersion = 'v1',
    mode: explicitMode,
    envOverrides,
    routeHumanAssist = false
  } = options;

  // Check if gate is active (not killed, enabled)
  if (!isGateActive(gateType, envOverrides)) {
    return {
      action: 'approve' as GateAction,
      verdict: GateVerdict.APPROVE,
      confidence: 1.0,
      reasoning: 'Gate skipped: not enabled or kill-switch is active',
      gateRunId: crypto.randomUUID(),
      passed: true,
      shadowMode: false
    };
  }

  // Determine gate mode: explicit override, env var, or default shadow
  const gateMode: GateMode = explicitMode || getGateMode(envOverrides);
  const maxRetries = getGateMaxRetries(envOverrides);

  const gateDef = getGateDefinition(gateType);
  if (!gateDef) {
    console.warn(`[gate:runner] Unknown gate type "${gateType}", skipping`);
    return {
      action: 'approve' as GateAction,
      verdict: GateVerdict.APPROVE,
      confidence: 1.0,
      reasoning: `Gate skipped: unknown type "${gateType}"`,
      gateRunId: crypto.randomUUID(),
      passed: true,
      shadowMode: false
    };
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

  // Step 2: Apply gate policy (use maxRetries from options or env)
  const effectiveRetries = options.retryCount !== undefined ? retryCount : 0;
  const action = applyGatePolicy(result.verdict, result.confidence, effectiveRetries, {
    ...policy,
    ...(maxRetries !== 2 ? { maxRetries } : {})
  });

  // Step 3: Determine the effective action based on gate mode
  // In shadow mode: block/escalate become 'approve' (log only, pipeline continues)
  // In blocking mode: actions are respected
  // human_assist with routeHumanAssist → escalate
  let effectiveAction = action;
  if (gateMode === 'shadow' && (action === 'block' || action === 'escalate')) {
    effectiveAction = 'approve' as GateAction;
  }
  if (routeHumanAssist && result.verdict === GateVerdict.HUMAN_ASSIST) {
    effectiveAction = 'escalate' as GateAction;
  }

  // Step 4: Persist to D1
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
      console.info(`[gate:runner] Persisted gate run`, {
        gateRunId, assessmentId, gateType, verdict: result.verdict,
        rawAction: action, effectiveAction, mode: gateMode
      });
    } catch (err) {
      console.error(`[gate:runner] Failed to persist gate run`, {
        gateRunId, assessmentId, gateType,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return {
    action: effectiveAction,
    verdict: result.verdict,
    confidence: result.confidence,
    reasoning: result.reasoning,
    details: result.details,
    gateRunId,
    passed: effectiveAction === 'approve',
    usage: result.usage,
    shadowMode: gateMode === 'shadow'
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
  const gateTypes = ['quick-wins-verification', 'major-project-verification', 'report-review', 'pbw-detector'];
  const results: GateRunResult[] = [];

  // Determine mode for this batch
  const gateMode: GateMode = options.mode || getGateMode(options.envOverrides);

  for (const gateType of gateTypes) {
    // Skip inactive gates
    if (!isGateActive(gateType, options.envOverrides)) {
      continue;
    }

    const result = await runGate({
      assessmentId,
      content,
      gateType,
      retryCount: 0,
      ...options,
      mode: gateMode
    });
    results.push(result);

    // In blocking mode: if any gate blocks, stop
    if (gateMode === 'blocking' && (result.action === 'block' || result.action === 'escalate')) {
      console.warn(`[gate:runner] Pipeline blocked by gate "${gateType}" (blocking mode), skipping remaining gates`);
      break;
    }

    // In shadow mode: always continue, just log
    if (gateMode === 'shadow' && (result.verdict === GateVerdict.BLOCK || result.verdict === GateVerdict.ESCALATE)) {
      console.info(`[gate:runner] Gate "${gateType}" would block in blocking mode (shadow mode — continuing)`);
    }
  }

  return results;
}
