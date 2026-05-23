/**
 * GET /api/portal/assessments
 *
 * Returns a list of assessments (pipeline statuses) for the current user,
 * ordered by most recent first. Includes report/receipt associations.
 */
import { json, error } from '@sveltejs/kit';
import { resolveUser } from '$lib/server/auth';
import { getPipelineStatusByCallId } from '$lib/server/assessment/pipeline-store';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url, platform }) => {
  const user = resolveUser(locals, url);
  const db = platform?.env?.assessment_db;

  if (!db) {
    return json({ assessments: [] });
  }

  // Fetch reports for this user
  const { results } = await db.prepare(
    `SELECT id, session_id, call_id, receipt_id, company, title, created_at
     FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
  ).bind(user.userId).all();

  const assessments = await Promise.all((results || []).map(async (row: any) => {
    // Try to get pipeline status
    let status = 'ready';
    let statusError: string | undefined;
    if (row.session_id) {
      const ps = await db.prepare(
        `SELECT status, error FROM pipeline_status WHERE session_id = ?`
      ).bind(row.session_id).first();
      if (ps) {
        status = (ps as any).status;
        statusError = (ps as any).error || undefined;
      }
    }
    return {
      id: row.id,
      sessionId: row.session_id,
      callId: row.call_id,
      receiptId: row.receipt_id,
      company: row.company,
      title: row.title,
      created_at: row.created_at,
      status,
      error: statusError,
    };
  }));

  return json({ assessments });
};
