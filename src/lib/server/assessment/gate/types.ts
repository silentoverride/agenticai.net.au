/**
 * Gate Module — core types and interfaces for the GPT-5.5 gate evaluation system.
 *
 * Each gate type is a configured "judge" that evaluates a specific aspect of
 * the assessment pipeline output and returns a structured verdict.
 *
 * The gate system is designed around the JudgeGateProvider adapter pattern:
 * verdicts are always structured, policy is always deterministic, and the
 * provider (model) is swappable via the interface.
 */

import { GateVerdict } from '../types';
export { GateVerdict };

// ============================================================================
// Gate Run Context
// ============================================================================

/** Context passed to every gate evaluation. */
export interface GateContext {
  /** Unique assessment identifier. */
  assessmentId: string;
  /** The assessment order version. */
  orderVersion: number;
  /** Pipeline stage requesting the gate evaluation. */
  stage: string;
  /** The content to evaluate (transcript, analysis, briefing, etc.). */
  content: string;
  /** Optional metadata for gate-specific context. */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Judge Gate Provider Interface
// ============================================================================

/**
 * A JudgeGateProvider evaluates content and returns a structured verdict.
 *
 * This is the core abstraction — any LLM or external service that can
 * produce structured gate verdicts implements this interface.
 * Currently: OpenAI GPT-5.5 via direct fetch.
 */
export interface JudgeGateProvider {
  /** The model identifier (e.g., "gpt-5.5", "kimi-k2.6"). */
  readonly modelId: string;

  /**
   * Evaluate content and return a structured verdict.
   * @param systemPrompt — Gate-specific instructions for the judge.
   * @param content — The content being evaluated.
   * @param opts — Optional configuration (reasoning effort, temperature, etc.).
   */
  evaluate(
    systemPrompt: string,
    content: string,
    opts?: GateEvaluationOptions
  ): Promise<GateEvaluationResult>;
}

/** Options for a gate evaluation call. */
export interface GateEvaluationOptions {
  /** Reasoning effort level (controls how much the model "thinks"). */
  reasoningEffort?: 'low' | 'medium' | 'high';
  /** Temperature for generation when supported by the provider/model. */
  temperature?: number;
  /** Maximum tokens for the response. */
  maxTokens?: number;
  /** Timeout in milliseconds (default: 30000). */
  timeoutMs?: number;
  /** Whether to include token usage in the result. */
  includeUsage?: boolean;
}

/** Structured result from a gate evaluation. */
export interface GateEvaluationResult {
  /** The structured verdict. */
  verdict: GateVerdict;
  /** Confidence score 0–1. */
  confidence: number;
  /** Human-readable reasoning summary. */
  reasoning: string;
  /** Detailed explanation (may include specific findings). */
  details?: string;
  /** Token usage if requested. */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================================================
// Gate Definition — config for a single gate type
// ============================================================================

/**
 * A GateDefinition binds a system prompt, output schema, and model config
 * into a single evaluable gate.
 */
export interface GateDefinition {
  /** Unique gate type identifier. */
  type: string;
  /** Human-readable gate name. */
  name: string;
  /** Description of what this gate evaluates. */
  description: string;
  /** System prompt for the judge model. */
  systemPrompt: string;
  /** Output schema (Zod) for structured parsing. */
  outputSchema?: Record<string, unknown>;
  /** Reasonings effort level for this gate. */
  reasoningEffort: 'low' | 'medium' | 'high';
  /** Whether this gate is enabled (overridden by feature flags). */
  enabled: boolean;
  /** Feature flag environment variable name (e.g., "GATE_QUICK_WINS_ENABLED"). */
  featureFlag?: string;
  /** Kill-switch environment variable name (e.g., "GATE_QUICK_WINS_KILL"). */
  killSwitch?: string;
}

// ============================================================================
// Gate Policy — deterministic action mapping
// ============================================================================

/**
 * The action returned by applyGatePolicy().
 * Determines what the pipeline should do next.
 */
export enum GateAction {
  /** Approve — continue pipeline. */
  APPROVE = 'approve',
  /** Retry — re-run this gate. */
  RETRY = 'retry',
  /** Block — stop pipeline, mark as failed. */
  BLOCK = 'block',
  /** Escalate — route to Human Assist. */
  ESCALATE = 'escalate',
}

/** Configuration for the gate policy engine. */
export interface GatePolicyConfig {
  /** Minimum confidence to auto-approve. */
  approveThreshold: number;
  /** Maximum confidence before auto-block. */
  blockThreshold: number;
  /** Number of retries before escalation. */
  maxRetries: number;
  /** Whether to escalate to Human Assist on block. */
  escalateOnBlock: boolean;
}

/** Default gate policy configuration. */
export const DEFAULT_GATE_POLICY: GatePolicyConfig = {
  approveThreshold: 0.7,
  blockThreshold: 0.3,
  maxRetries: 2,
  escalateOnBlock: true,
};

/**
 * Apply the gate policy to a verdict and produce a deterministic action.
 *
 * This is always deterministic — same inputs always produce the same action.
 * No LLM calls, no randomness. Pure business logic.
 */
export function applyGatePolicy(
  verdict: GateVerdict,
  confidence: number,
  retryCount: number,
  policy: GatePolicyConfig = DEFAULT_GATE_POLICY
): GateAction {
  switch (verdict) {
    case GateVerdict.APPROVE:
      return confidence >= policy.approveThreshold
        ? GateAction.APPROVE
        : retryCount < policy.maxRetries
          ? GateAction.RETRY
          : GateAction.ESCALATE;

    case GateVerdict.RETRY:
      return retryCount < policy.maxRetries
        ? GateAction.RETRY
        : GateAction.ESCALATE;

    case GateVerdict.BLOCK:
      return policy.escalateOnBlock
        ? GateAction.ESCALATE
        : GateAction.BLOCK;

    case GateVerdict.ESCALATE:
      return GateAction.ESCALATE;

    case GateVerdict.HUMAN_ASSIST:
      return GateAction.ESCALATE;

    default:
      return GateAction.ESCALATE;
  }
}
