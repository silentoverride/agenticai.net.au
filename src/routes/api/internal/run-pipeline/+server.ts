/**
 * POST /api/internal/run-pipeline
 *
 * Internal endpoint used exclusively by the queue consumer worker.
 * Runs the full assessment report pipeline with all SvelteKit context
 * (D1, R2, env vars, etc.).
 *
 * Authenticated via x-internal-secret header matching INTERNAL_SECRET env.
 */

import { json, error, text } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { runReportPipeline } from '$lib/server/assessment/pipeline';
import { setPipelineStatus } from '$lib/server/assessment/pipeline-store';
import { deleteTranscript } from '$lib/server/assessment/transcript-store';
import type { RequestHandler } from './$types';
import type { AssessmentReportJob } from '$lib/server/assessment/types';

export const POST: RequestHandler = async ({ request, platform }) => {
  const secret = request.headers.get('x-internal-secret');
  if (!secret || secret !== env.INTERNAL_SECRET) {
    return text('Unauthorized', { status: 401 });
  }

  let job: AssessmentReportJob;
  try {
    job = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  if (!job.sessionId) {
    throw error(400, 'Missing sessionId in job body');
  }

  const r2Bucket = platform?.env?.assessment_blobs ?? null;

  try {
    await setPipelineStatus(job.sessionId, { status: 'running_llm' });
    const result = await runReportPipeline(job, { r2Bucket: r2Bucket as unknown as R2Bucket | null });

    await setPipelineStatus(job.sessionId, {
      status: 'completed',
      reportId: result.savedReport?.id,
      deckUrl: result.deckUrl
    });

    // Clean up transcript from D1 store once pipeline completes
    try {
      await deleteTranscript(job.sessionId);
    } catch (e) {
      console.warn('Failed to delete transcript after pipeline completion', { sessionId: job.sessionId, error: String(e) });
    }

    return json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setPipelineStatus(job.sessionId, {
      status: 'error',
      error: message
    });
    throw error(500, message);
  }
};
