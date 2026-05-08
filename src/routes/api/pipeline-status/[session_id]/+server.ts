/**
 * GET /api/pipeline-status/:sessionId
 *
 * Returns the current pipeline status for a given Stripe checkout session.
 * Used by the assessment success page to poll for completion.
 *
 * @param params.session_id - The Stripe checkout session ID.
 * @returns PipelineStatus JSON or 404 if not found.
 */

import { json, error } from '@sveltejs/kit';
import { getPipelineStatus } from '$lib/server/assessment/pipeline-store';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const sessionId = params.session_id;
  if (!sessionId) {
    throw error(400, 'Missing session_id parameter');
  }

  const status = await getPipelineStatus(sessionId);
  if (!status) {
    throw error(404, 'Pipeline status not found');
  }

  return json({
    sessionId,
    status: status.status,
    reportId: status.reportId || null,
    deckUrl: status.deckUrl || null,
    error: status.error || null,
    callId: status.callId || null
  });
};
