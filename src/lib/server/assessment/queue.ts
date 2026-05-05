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
    // No queue available — run inline (local dev fallback)
    runPipelineInline(job);
    return { queued: false, inline: true };
  }

  try {
    await queue.send({
      type: 'pipeline:run',
      payload: job,
      sentAt: new Date().toISOString()
    });
    console.info('Pipeline job queued', { sessionId: job.sessionId, callId: job.callId });
    return { queued: true };
  } catch (err) {
    console.error('Failed to enqueue pipeline job, falling back to inline:', err);
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
    console.info('Pipeline completed inline', { sessionId, reportId: result.savedReport?.id });
  } catch (error) {
    await setPipelineStatus(sessionId, { status: 'error', error: String(error) });
    console.error('Pipeline failed inline', { sessionId, error: String(error) });
  }
}

/** Queue consumer handler — processes a batch of jobs. */
export async function consumeQueueBatch(batch: MessageBatch<unknown>): Promise<void> {
  for (const msg of batch.messages) {
    const body = msg.body as { type?: string; payload?: AssessmentReportJob; sentAt?: string };
    if (body.type === 'pipeline:run' && body.payload) {
      console.info('Queue consumer: processing job', { id: msg.id, sentAt: body.sentAt });
      try {
        await runPipelineInline(body.payload);
        msg.ack();
      } catch (err) {
        console.error('Queue consumer: job failed, will retry', { id: msg.id, error: String(err) });
        msg.retry();
      }
    } else {
      console.warn('Queue consumer: unknown message type', { id: msg.id, body });
      msg.ack();
    }
  }
}
