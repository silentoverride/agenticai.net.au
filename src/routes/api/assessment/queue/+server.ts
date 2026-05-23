/**
 * POST /api/assessment/queue
 *
 * Receives confirmed summary from Annie chat intake and queues the
 * assessment pipeline job.
 */

import { json } from '@sveltejs/kit';
import { apiError } from '$lib/server/api-error';
import { setPipelineStatus } from '$lib/server/assessment/pipeline-store';
import { enqueueReportJob } from '$lib/server/assessment/queue';
import type { AssessmentReportJob } from '$lib/server/assessment/types';
import type { RequestHandler } from './$types';

interface QueueBody {
  sessionId: string;
  summary: Array<{ question: string; answer: string; followUpAnswer?: string }>;
  source: string;
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const payload = await request.json<QueueBody>().catch(() => null);

  if (!payload?.sessionId || !payload?.summary || payload.summary.length === 0) {
    throw apiError(400, 'Missing required fields: sessionId, summary');
  }

  const db = platform?.env?.assessment_db;

  // Build a structured transcript from the intake summary
  const transcriptLines = payload.summary.map(s => {
    let text = `Q: ${s.question}\nA: ${s.answer}`;
    if (s.followUpAnswer) text += `\nFollow-up: ${s.followUpAnswer}`;
    return text;
  });
  const transcript = transcriptLines.join('\n\n---\n\n');

  const job: AssessmentReportJob = {
    receivedAt: new Date().toISOString(),
    source: payload.source || 'annie-chat-intake',
    sessionId: payload.sessionId,
    transcript,
    transcriptObject: payload.summary,
    customerName: '',
    customerEmail: '',
    company: '',
    paymentStatus: 'free',
    dynamicVariables: {
      intakeSource: 'annie-chat',
      summaryCount: payload.summary.length
    }
  };

  // Save initial pipeline status
  if (db) {
    try {
      await setPipelineStatus(payload.sessionId, { status: 'queued' });
    } catch (err) {
      console.warn('[queue] Could not set initial pipeline status:', err);
    }
  }

  // Enqueue the pipeline job
  const result = await enqueueReportJob(platform?.env?.assessment_queue, job);

  if (!result.queued && !result.inline) {
    // Failed both queue and inline fallback
    return json({
      queued: false,
      error: 'Could not start assessment processing. Please try again later.',
      sessionId: payload.sessionId
    }, { status: 502 });
  }

  const estimatedMinutes = 48;

  return json({
    queued: true,
    sessionId: payload.sessionId,
    estimatedMinutes,
    mode: result.inline ? 'inline' : 'queued'
  });
};
