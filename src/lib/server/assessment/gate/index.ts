/**
 * Gate Module — barrel export.
 *
 * Provides the complete gate evaluation system:
 * - JudgeGateProvider interface + OpenAI GPT-5.5 implementation
 * - Gate definitions (quick-wins, major-project, report-review)
 * - Gate policy engine (deterministic action mapping)
 * - Gate runner (orchestrates evaluation + persistence)
 * - D1 gate store for querying results
 */

// Re-export GateVerdict from the canonical source (type + value — enum)
export { GateVerdict } from '../types';

// Gate types (type-only imports for verbatimModuleSyntax)
export type {
  GateContext,
  JudgeGateProvider,
  GateEvaluationOptions,
  GateEvaluationResult,
  GateDefinition
} from './types';

// Gate policy (type + value exports)
export type { GateAction, GatePolicyConfig } from './types';
export { DEFAULT_GATE_POLICY, applyGatePolicy } from './types';

// Provider
export { OpenAiGpt55JudgeProvider, gpt55Judge } from './gpt55-provider';

// Definitions
export { GATE_DEFINITIONS, getGateDefinition, isGateEnabled } from './definitions';

// Store
export { D1GateStore } from './gate-store';
export type { GateRunRecord } from './gate-store';

// Runner
export { runGate, runAllGates } from './runner';
export type { GateRunOptions, GateRunResult } from './runner';
