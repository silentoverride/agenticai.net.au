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
  const db = platform?.env?.assessment_db ?? null;

  try {
    await setPipelineStatus(job.sessionId, { status: 'running_llm' });
    const result = await runReportPipeline(job, { r2Bucket: r2Bucket as unknown as R2Bucket | null, db: db as unknown as D1Database | null });

    if (!result.savedReport?.id) {
      throw new Error('Pipeline succeeded but no report was saved');
    }

    await setPipelineStatus(job.sessionId, {
      status: 'completed',
      reportId: result.savedReport.id
    });

    // Transcript is kept in D1 for retry resilience — do NOT delete it

    return json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const details = err instanceof Error ? { message: err.message, stack: err.stack, name: err.name } : err;
    console.error(`[run-pipeline:${job.sessionId}] Pipeline failed:`, details);

    try {
      await setPipelineStatus(job.sessionId, {
        status: 'error',
        error: message
      });
    } catch (dbErr) {
      const dbDetails = dbErr instanceof Error ? { message: dbErr.message, stack: dbErr.stack } : dbErr;
      console.error(`[run-pipeline:${job.sessionId}] CRITICAL: Failed to write error status to DB:`, dbDetails);
    }

    throw error(500, message);
  }
};
