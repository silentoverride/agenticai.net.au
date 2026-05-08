/**
 * GET /api/portal/reports/[id]
 *
 * Returns a single report with its analysis content for the authenticated user.
 * Supports lazy auto-linking from R2 when the report exists in storage but is
 * not yet linked in the local database.
 *
 * @returns JSON with report metadata and analysis.
 * @throws 401 — If the user is not authenticated.
 * @throws 404 — If the report is not found.
 */

import { json, error } from '@sveltejs/kit';
import { requirePortalAuth } from '$lib/server/portal-auth';
import { getUserReport, scanAndLinkReportsByEmail, linkReportToUser } from '$lib/server/portal';
import { getReportMetaFromR2, getReportUnified } from '$lib/server/assessment/report-store-r2';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, platform, url }) => {
  const { userId, email, isDevBypass } = await requirePortalAuth(locals, url);

  if (!isDevBypass) {
    await scanAndLinkReportsByEmail(userId, email);
  }

  const reportId = params.id;
  let dbReport = await getUserReport(userId, reportId);

  // Lazy auto-link: if report isn't linked in reports.user_id, try to discover
  // it in R2 and verify ownership by matching customerEmail.
  if (!dbReport && email) {
    const bucket = platform?.env?.assessment_blobs;
    if (bucket) {
      try {
        const meta = await getReportMetaFromR2(bucket, reportId);
        const jobData = (meta as Record<string, unknown> | null)?.job as Record<string, unknown> | undefined;
        const reportEmail = jobData?.customerEmail as string | undefined;
        if (reportEmail && reportEmail.toLowerCase() === email.toLowerCase()) {
          await linkReportToUser(
            userId,
            reportId,
            jobData?.sessionId as string | undefined,
            `${jobData?.company || jobData?.customerName || 'Business'} — AI Assessment`,
            jobData?.company as string | undefined,
            {
              callId: jobData?.callId as string | undefined,
              customerEmail: reportEmail,
              customerName: jobData?.customerName as string | undefined,
              r2Key: `reports/${reportId}`
            }
          );
          dbReport = await getUserReport(userId, reportId);
          console.info('[portal:lazy-link] Auto-linked R2 report', { reportId, userId, email });
        }
      } catch (err) {
        console.warn('[portal:lazy-link] R2 meta read failed', { reportId, error: String(err) });
      }
    }
  }

  if (!dbReport) {
    throw error(404, 'Report not found');
  }

  const response = await getReportUnified(platform?.env?.assessment_blobs ?? null, reportId);
  if (!response) {
    throw error(404, 'Report content not available');
  }

  return json(response);
};
