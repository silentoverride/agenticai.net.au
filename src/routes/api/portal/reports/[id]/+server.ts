/**
 * GET /api/portal/reports/[id]
 *
 * Returns a single report with its full analysis JSON for the reveal.js viewer.
 * Verifies ownership — the report must belong to the authenticated user.
 *
 * @param params.id - The report ID (same as the filesystem directory name).
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
import * as fs from 'node:fs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!isDatabaseAvailable()) {
    throw error(503, 'Portal database not available in this environment');
  }

  const auth = locals.auth();
  if (!auth.userId) {
    throw error(401, 'Not authenticated');
  }

  const user = locals.user;
  if (user) {
    upsertUser(auth.userId, user.email || '', user.name || undefined);
    scanAndLinkReportsByEmail(auth.userId, user.email || '');
  }

  const reportId = params.id;
  const dbReport = getUserReport(auth.userId, reportId);
  if (!dbReport) {
    throw error(404, 'Report not found');
  }

  const saved = getReport(reportId);
  if (!saved) {
    throw error(404, 'Report data not found');
  }

  let analysis = null;
  try {
    if (fs.existsSync(saved.jsonPath)) {
      analysis = JSON.parse(fs.readFileSync(saved.jsonPath, 'utf-8'));
    }
  } catch {
    // analysis stays null — report exists but JSON is missing/corrupt
  }

  return json({
    ...dbReport,
    analysis
  });
};
