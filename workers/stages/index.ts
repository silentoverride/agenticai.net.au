/**
 * Stage Registry — maps stage names to handler functions.
 *
 * Each stage handler is an independent callable function with the signature:
 *   StageHandler = (job: StageJob, env: Env, ctx: ExecutionContext) => Promise<StageResult>
 *
 * New stages can be added by creating a file in workers/stages/ and
 * registering it here. The queue consumer reads the `stage` field from
 * the queue message and dispatches to the correct handler.
 */

import type { StageResult, StageHandler } from './types';

import { runPipelineStageHandler } from './run-pipeline';

/**
 * Stage registry map.
 * Populated lazily so handlers can import each other without circular deps.
 */
const registry = new Map<string, StageHandler>();

// Register known stages
registry.set('run-pipeline', runPipelineStageHandler);

/**
 * Resolve a stage handler by name.
 * Throws if the stage is unknown.
 */
export function getStageHandler(stage: string): StageHandler {
  const handler = registry.get(stage);
  if (!handler) {
    throw new Error(`Unknown stage: "${stage}". Available stages: ${Array.from(registry.keys()).join(', ')}`);
  }
  return handler;
}

/** Return the list of registered stage names. */
export function listStages(): string[] {
  return Array.from(registry.keys());
}
