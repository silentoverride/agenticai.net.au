import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { runCalibration, formatCalibrationSummary } from '$lib/server/assessment/calibration/runner';
import { GOLDEN_TEST_CASES, getAllGoldenTags } from '$lib/server/assessment/calibration/golden-cases';
import { DEFAULT_CALIBRATION_CONFIG } from '$lib/server/assessment/calibration/types';

/**
 * POST /api/staff/calibration/run
 *
 * Run a calibration batch against golden test cases.
 *
 * Body:
 *   { caseIds?: string[], gateTypes?: string[], config?: Partial<CalibrationConfig> }
 *
 * Response:
 *   { runId, timestamp, promptVersion, gateTypes, caseResults, summary }
 */
export async function POST(event: RequestEvent) {
  try {
    const body = (await event.request.json().catch(() => ({}))) as Record<string, unknown>;
    const caseIds = body.caseIds as string[] | undefined;
    const gateTypes = body.gateTypes as string[] | undefined;
    const config = body.config as Record<string, unknown> | undefined;

    const env = (event.platform?.env || {}) as Record<string, unknown>;
    const report = await runCalibration({
      caseIds,
      gateTypes,
      config: {
        promptVersion: (config?.promptVersion as string) || DEFAULT_CALIBRATION_CONFIG.promptVersion,
        includeUsage: config?.includeUsage !== false,
        model: (config?.model as string) || DEFAULT_CALIBRATION_CONFIG.model,
        blockConfidenceThreshold: (config?.blockConfidenceThreshold as number) || DEFAULT_CALIBRATION_CONFIG.blockConfidenceThreshold,
        retryConfidenceThreshold: (config?.retryConfidenceThreshold as number) || DEFAULT_CALIBRATION_CONFIG.retryConfidenceThreshold,
        maxRetries: (config?.maxRetries as number) || DEFAULT_CALIBRATION_CONFIG.maxRetries
      },
      gateOptions: {
        db: env.assessment_db as D1Database,
        includeUsage: true
      }
    });

    const summary = formatCalibrationSummary(report);

    return json({
      success: true,
      report,
      summary
    });
  } catch (err) {
    console.error('[calibration:api] Run failed:', err);
    return json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Calibration run failed'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/staff/calibration/run
 *
 * Get golden test case metadata (all cases, tags, config defaults).
 */
export async function GET() {
  return json({
    success: true,
    cases: GOLDEN_TEST_CASES.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      tags: c.tags,
      expectedVerdicts: c.expectedVerdicts
    })),
    allTags: getAllGoldenTags(),
    defaultConfig: DEFAULT_CALIBRATION_CONFIG
  });
}
