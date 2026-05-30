/**
 * Shared types for the stage-based pipeline worker.
 *
 * Stage handlers are the core abstraction: each stage is an independent
 * callable function that receives a job, environment bindings, and
 * execution context, and returns a result.
 *
 * This keeps stages decoupled — no monolithic pipeline.ts. New stages
 * can be added without touching existing ones.
 */

import type { AssessmentReportJob } from '../../src/lib/server/assessment/types';

/**
 * Queue message envelope produced by the SvelteKit app.
 * Contains a `stage` field so the consumer dispatches to the correct handler.
 *
 * Future stages might include:
 *   - "run-pipeline"        — full pipeline execution (current)
 *   - "tool-research"        — tool lookup stage (Epic 2a)
 *   - "analysis-generation"  — LLM analysis stage (Epic 2a)
 *   - "gate-evaluation"      — GPT-5.5 gate check (Epic 2a)
 *   - "gate-human-assist"    — staff review flow (Epic 2b)
 */
export interface StageJobMessage {
  type: 'pipeline:stage';
  stage: string;
  payload: AssessmentReportJob | Record<string, unknown>;
  sentAt: string;
  /** Optional sequence tracking for multi-stage jobs. */
  sequence?: {
    /** Total number of stages in this pipeline run. */
    total: number;
    /** Current stage index (1-based). */
    current: number;
    /** Pipeline run identifier shared across all stage messages. */
    pipelineRunId: string;
  };
}

/** The payload shape for the initial run-pipeline stage. */
export interface PipelineStagePayload extends AssessmentReportJob {
  /** Explicit stage routing hint. */
  _stage?: string;
}

export interface StageResult {
  ok: boolean;
  stage: string;
  data?: Record<string, unknown>;
  error?: string;
  /** True if this stage completed and the pipeline can advance. */
  proceed: boolean;
}

/**
 * A stage handler processes one stage of the pipeline and returns a result.
 * Handlers are registered in stages/index.ts.
 */
export type StageHandler = (
  payload: Record<string, unknown>,
  env: Record<string, unknown>,
  ctx: ExecutionContext
) => Promise<StageResult>;
