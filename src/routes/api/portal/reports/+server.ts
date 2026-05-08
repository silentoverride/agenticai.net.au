/**
 * GET /api/portal/reports
 *
 * Returns all assessment reports belonging to the currently signed-in user.
 * Automatically syncs the Clerk user to the local database and triggers
 * orphan record linking (reports + receipts) by email on first load.
 *
 * @returns JSON array of {@link DbReport} rows.
 * @throws 401 — If the user is not authenticated.
 * @example
 * // Frontend
 * const res = await fetch('/api/portal/reports');
 * if (res.status === 401) { /* redirect to sign-in *\/ }
 * const reports = await res.json();
 */

import { json } from '@sveltejs/kit';
import { requirePortalAuth } from '$lib/server/portal-auth';
import {
  getUserReports,
  scanAndLinkReportsByEmail,
  linkPendingReceiptsByEmail,
  linkReportToUser
} from '$lib/server/portal';
import { listReportsFromR2, getReportMetaFromR2 } from '$lib/server/assessment/report-store-r2';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
  const { userId, email } = await requirePortalAuth(locals, url);

  const linkedReports = await scanAndLinkReportsByEmail(userId, email);
  const linkedReceipts = await linkPendingReceiptsByEmail(userId, email);
  if (linkedReports > 0 || linkedReceipts > 0) {
    console.info('Auto-linked records on portal login', { userId, linkedReports, linkedReceipts });
  }

  // Scan R2 for orphan reports matching this user's email
  const bucket = platform?.env?.assessment_blobs;
  if (bucket && email) {
    try {
      const r2ReportIds = await listReportsFromR2(bucket);
      let r2Linked = 0;
      for (const reportId of r2ReportIds.slice(0, 50)) {
        try {
          const meta = await getReportMetaFromR2(bucket, reportId);
          const jobData = (meta as Record<string, unknown> | null)?.job as Record<string, unknown> | undefined;
          const reportEmail = jobData?.customerEmail as string | undefined;
          if (!reportEmail || reportEmail.toLowerCase() !== email.toLowerCase()) continue;

          const existing = await getUserReports(userId);
          if (existing.some(r => r.id === reportId)) continue;

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
          r2Linked++;
        } catch (err) {
          console.warn('[portal:r2-scan] Failed to inspect/link R2 report', { reportId, userId, error: String(err) });
        }
      }
      if (r2Linked > 0) {
        console.info('[portal:r2-scan] Auto-linked R2 reports', { userId, r2Linked });
      }
    } catch (err) {
      console.warn('[portal:r2-scan] R2 scan failed', { userId, error: String(err) });
    }
  }

  const reports = await getUserReports(userId);
  console.info('[portal:reports] Returning reports', { userId, count: reports.length });
  return json(reports);
};
