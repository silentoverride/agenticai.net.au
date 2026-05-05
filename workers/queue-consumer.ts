/**
 * Cloudflare Queue Consumer Worker — assessment-jobs queue
 *
 * Minimal relay. Receives messages from the `assessment-jobs` queue,
 * POSTs them to the SvelteKit internal pipeline endpoint, then
 * acks or retries based on the response.
 *
 * This is a standalone Worker (not Pages Functions) so it gets
 * unbound execution time and can survive long LLM calls.
 */

/// <reference types="@cloudflare/workers-types" />

export interface Env {
  SELF_URL: string;
  INTERNAL_SECRET: string;
}

/**
 * Message shape produced by enqueueReportJob() in the SvelteKit app.
 * Matches producer: { type, payload: job, sentAt }
 */
interface PipelineJobMessage {
  type: 'pipeline:run';
  payload: {
    callId?: string;
    sessionId: string;
    transcript: string;
    source: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    company?: string;
  };
  sentAt: string;
}

export default {
  async fetch(_request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return new Response(JSON.stringify({ ok: true, worker: 'queue-consumer' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  async queue(batch: MessageBatch<PipelineJobMessage>, env: Env, _ctx: ExecutionContext): Promise<void> {
    const endpoint = `${env.SELF_URL}/api/internal/run-pipeline`;

    for (const message of batch.messages) {
      const { payload: job, sentAt } = message.body;

      if (!job || !job.sessionId) {
        console.error('Queue consumer: invalid message shape, missing payload or sessionId', {
          id: message.id,
          body: message.body
        });
        message.ack();
        continue;
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': env.INTERNAL_SECRET
          },
          body: JSON.stringify(job)
        });

        if (!response.ok) {
          console.error('Pipeline endpoint returned error', {
            status: response.status,
            sessionId: job.sessionId
          });
          message.retry();
          continue;
        }

        console.info('Pipeline completed successfully via queue', { sessionId: job.sessionId, sentAt });
        message.ack();
      } catch (err) {
        console.error('Pipeline POST failed, will retry', {
          sessionId: job.sessionId,
          error: err instanceof Error ? err.message : String(err)
        });
        message.retry();
      }
    }
  }
};
