/**
 * Queue producer — sends pipeline jobs to the Cloudflare Queue
 * for async, out-of-band processing.
 *
 * In production (queue wired), jobs are queued immediately and
 * the HTTP webhook returns 202 Accepted.
 *
 * In local dev or when the queue is down, falls back to inline
 * pipeline execution so development keeps working.
 */

import type { AssessmentReportJob } from './types';
import { runReportPipeline } from './pipeline';
import { setPipelineStatus } from './pipeline-store';

/** Send a job to the queue. Returns true if queued, false if inline fallback. */
export async function enqueueReportJob(
  queue: Queue | null | undefined,
  job: AssessmentReportJob
): Promise<{ queued: boolean; inline?: boolean }> {
  if (!queue) {
    console.warn(`[queue] No queue binding available, running inline for sessionId=${job.sessionId}`);
    runPipelineInline(job);
    return { queued: false, inline: true };
  }

  try {
    await queue.send({
      type: 'pipeline:run',
      payload: job,
      sentAt: new Date().toISOString()
    });
    console.info(`[queue] Pipeline job queued (sessionId=${job.sessionId})`);
    return { queued: true };
  } catch (err) {
    const details = err instanceof Error ? { message: err.message, stack: err.stack } : err;
    console.error(`[queue] Failed to enqueue pipeline job for sessionId=${job.sessionId}, falling back to inline:`, details);
    runPipelineInline(job);
    return { queued: false, inline: true };
  }
}

/** Run the pipeline inline — used as fallback or by the queue consumer. */
export async function runPipelineInline(job: AssessmentReportJob): Promise<void> {
  const sessionId = job.sessionId || job.callId!;
  try {
    await setPipelineStatus(sessionId, { status: 'queued' });
    const result = await runReportPipeline(job);
    await setPipelineStatus(sessionId, {
      status: 'completed',
      reportId: result.savedReport?.id
    });
    console.info(`[queue:inline] Pipeline completed (sessionId=${sessionId}, reportId=${result.savedReport?.id})`);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`[queue:inline] Pipeline failed (sessionId=${sessionId}):`, details);
    try {
      await setPipelineStatus(sessionId, { status: 'error', error: errMsg });
    } catch (dbErr) {
      const dbDetails = dbErr instanceof Error ? { message: dbErr.message, stack: dbErr.stack } : dbErr;
      console.error(`[queue:inline] CRITICAL: Could not write error status to DB for ${sessionId}:`, dbDetails);
    }
  }
}

/** Queue consumer handler — processes a batch of jobs. */
export async function consumeQueueBatch(batch: MessageBatch<unknown>): Promise<void> {
  for (const msg of batch.messages) {
    const body = msg.body as { type?: string; payload?: AssessmentReportJob; sentAt?: string };
    if (body.type === 'pipeline:run' && body.payload) {
      const sessionId = body.payload.sessionId || body.payload.callId || 'unknown';
      console.info(`[queue:consumer] Processing job (id=${msg.id}, sessionId=${sessionId}, sentAt=${body.sentAt})`);
      try {
        await runPipelineInline(body.payload);
        msg.ack();
      } catch (err) {
        const details = err instanceof Error ? { message: err.message, stack: err.stack } : err;
        console.error(`[queue:consumer] Job failed (id=${msg.id}, sessionId=${sessionId}):`, details);
        msg.retry();
      }
    } else {
      console.warn(`[queue:consumer] Unknown message type (id=${msg.id}):`, body);
      msg.ack();
    }
  }
}
