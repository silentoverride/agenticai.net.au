/**
 * Pipeline Queue Consumer Worker — assessment-jobs queue
 *
 * Stage-based pipeline executor. Receives messages from the `assessment-jobs`
 * queue, reads the `stage` field, and dispatches to the correct stage handler
 * registered in workers/stages/.
 *
 * This replaces the old relay-only consumer that just POSTed everything to
 * the SvelteKit internal endpoint. Each stage handler is an independent
 * callable function — no monolithic pipeline.ts.
 *
 * Architecture:
 *   SvelteKit webhooks → queue.send({ stage: "run-pipeline", payload: ... })
 *   → Queue Consumer → stage registry → StageHandler.run()
 *
 * Future stages (Epic 2a+):
 *   "tool-research", "analysis-generation", "gate-evaluation", etc.
 *   Each is a standalone function in workers/stages/.
 */

/// <reference types="@cloudflare/workers-types" />

import { getStageHandler, listStages } from './stages/index';
import type { StageJobMessage } from './stages/types';

export interface Env {
  /** Used by the run-pipeline stage to POST back to SvelteKit. */
  SELF_URL: string;
  INTERNAL_SECRET: string;

  // D1 and R2 — wired for forward compatibility as stages gain
  // direct Worker-side capabilities.
  assessment_db?: D1Database;
  assessment_blobs?: R2Bucket;
}

export default {
  async fetch(_request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return new Response(JSON.stringify({
      ok: true,
      worker: 'queue-consumer (stage router)',
      stages: listStages()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  async queue(batch: MessageBatch<StageJobMessage>, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      const msg = message.body;
      const stage = msg?.stage || 'run-pipeline'; // default for backward compat
      const payload = msg?.payload || {};
      const id = message.id;
      const pipelineRunId = msg?.sequence?.pipelineRunId || String(payload?.sessionId || id);

      if (!payload || !('sessionId' in payload)) {
        console.error(`[queue:${stage}] Invalid message — no sessionId in payload`, { id, stage });
        message.ack();
        continue;
      }

      const sessionId = String(payload.sessionId);

      try {
        console.info(`[queue:${stage}] Dispatching stage`, { id, sessionId, stage, pipelineRunId, sentAt: msg.sentAt });

        const handler = getStageHandler(stage);
        const result = await handler(payload as Record<string, unknown>, env as unknown as Record<string, unknown>, ctx);

        if (result.ok) {
          console.info(`[queue:${stage}] Stage completed`, { id, sessionId, stage, pipelineRunId });
          message.ack();
        } else {
          console.error(`[queue:${stage}] Stage failed`, {
            id, sessionId, stage, pipelineRunId,
            error: result.error,
            proceed: result.proceed
          });

          if (result.proceed === false) {
            // Non-retryable failure — acknowledge to remove from queue
            message.ack();
          } else {
            // Retryable failure
            message.retry();
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[queue:${stage}] Stage threw`, { id, sessionId, stage, error: errorMessage });

        if (err instanceof Error && err.name === 'Error' && err.message.startsWith('Unknown stage')) {
          // Unknown stage — non-recoverable, acknowledge
          message.ack();
        } else {
          message.retry();
        }
      }
    }
  }
};
