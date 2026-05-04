/**
 * GET /api/portal/reports/[id]
 *
 * Returns a single report with its full analysis JSON for the reveal.js viewer.
 * Verifies ownership — the report must belong to the authenticated user.
 *
 * @param params.id - The report ID.
 * @returns JSON object combining the {@link DbReport} row and parsed `analysis`.
 * @throws 401 — If the user is not authenticated.
 * @throws 404 — If the report is not found or not owned by this user.
 * @example
 * // Frontend
 * const res = await fetch(`/api/portal/reports/${reportId}`);
 * const data = await res.json();
 * console.log(data.analysis.pain_points);
 */

import { json, error } from '@sveltejs/kit';
import { getUserReport, upsertUser, scanAndLinkReportsByEmail } from '$lib/server/portal';
import { isDatabaseAvailable } from '$lib/server/db';
import { getReport } from '$lib/server/assessment/report-store';
import { getReportAnalysisFromR2, getReportMetaFromR2 } from '$lib/server/assessment/report-store-r2';
import * as fs from 'node:fs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  if (!isDatabaseAvailable()) {
    throw error(503, 'Portal database not available in this environment');
  }

  const auth = locals.auth();
  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const user = locals.user;
  if (user) {
    await upsertUser(auth.userId, user.email || '', user.name || undefined);
    await scanAndLinkReportsByEmail(auth.userId, user.email || '');
  }

  const reportId = params.id;
  const dbReport = await getUserReport(auth.userId, reportId);
  if (!dbReport) {
    throw error(404, 'Report not found');
  }

  // Try R2 first, then filesystem
  let analysis: unknown = null;
  let deckUrl: string | undefined;
  const bucket = platform?.env?.assessment_blobs;

  if (bucket) {
    try {
      const r2Meta = await getReportMetaFromR2(bucket, reportId);
      deckUrl = r2Meta?.deckUrl as string | undefined;
      const r2Analysis = await getReportAnalysisFromR2(bucket, reportId);
      if (r2Analysis) analysis = JSON.parse(r2Analysis);
    } catch (err) {
      console.warn('R2 report read failed, falling back to filesystem', { reportId, error: String(err) });
    }
  }

  // Fallback to filesystem
  if (!analysis) {
    const saved = getReport(reportId);
    if (saved) {
      deckUrl = deckUrl || saved.deckUrl;
      try {
        if (fs.existsSync(saved.jsonPath)) {
          analysis = JSON.parse(fs.readFileSync(saved.jsonPath, 'utf-8'));
        }
      } catch {
        // analysis stays null
      }
    }
  }

  return json({
    ...dbReport,
    deckUrl: deckUrl || undefined,
    analysis
  });
};
