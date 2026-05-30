import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';

/**
 * GET /api/staff/dashboard
 *
 * Returns aggregate pipeline and gate health data for the staff dashboard.
 * All queries target D1 directly for maximum performance.
 */

export async function GET(event: RequestEvent) {
  try {
    const env = event.platform?.env as Record<string, unknown> | undefined;
    const db = env?.assessment_db as D1Database | undefined;

    // Require staff/admin role
    await requireStaff(event.locals, db);

    if (!db) {
      return json({
        success: false,
        error: 'D1 database binding not available',
        note: 'Dashboard requires Cloudflare Pages with D1 binding'
      });
    }

    // Run all queries in parallel for NFR20 compliance (< 3 seconds)
    const [todayRow, gateStats, recentAssessments, verdictDistribution, queueDepth] = await Promise.all([
      // Query 1: Today's aggregate stats
      db.prepare(`
        SELECT
          COUNT(*) as total_assessments,
          SUM(CASE WHEN status IN ('completed','ready','delivered') THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status IN ('queued','generating','delayed','human_assist') THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM pipeline_status
        WHERE date(created_at) = date('now')
      `).first(),

      // Query 2: Per-gate aggregate stats
      db.prepare(`
        SELECT
          gate_type,
          COUNT(*) as total_evaluations,
          ROUND(AVG(confidence), 2) as avg_confidence,
          ROUND(AVG(evaluation_time_ms), 0) as avg_latency_ms,
          MAX(created_at) as last_run
        FROM assessment_gates
        WHERE date(created_at) = date('now')
        GROUP BY gate_type
        ORDER BY gate_type
      `).all(),

      // Query 3: Recent assessments (last 20)
      db.prepare(`
        SELECT
          ps.session_id,
          ps.status,
          ps.created_at,
          ps.updated_at,
          ps.attempts,
          (SELECT COUNT(*) FROM assessment_gates ag WHERE ag.assessment_id = ps.session_id) as gate_count
        FROM pipeline_status ps
        ORDER BY ps.updated_at DESC
        LIMIT 20
      `).all(),

      // Query 4: Verdict distribution across all gates today
      db.prepare(`
        SELECT
          gate_type,
          verdict,
          COUNT(*) as count
        FROM assessment_gates
        WHERE date(created_at) = date('now')
        GROUP BY gate_type, verdict
        ORDER BY gate_type, verdict
      `).all(),

      // Query 5: Queue depth (queued/retry status counts)
      db.prepare(`
        SELECT
          status,
          COUNT(*) as count
        FROM pipeline_status
        WHERE status IN ('queued', 'pending', 'retry', 'generating')
        AND date(created_at) = date('now')
        GROUP BY status
        ORDER BY status
      `).all()
    ]);

    // Query 6: Average pipeline duration today (completed assessments)
    const avgDuration = await db.prepare(`
      SELECT
        ROUND(AVG(
          (julianday(updated_at) - julianday(created_at)) * 86400
        ), 0) as avg_duration_seconds
      FROM pipeline_status
      WHERE status IN ('completed','ready','delivered')
      AND date(created_at) = date('now')
    `).first<{ avg_duration_seconds: number | null }>();

    return json({
      success: true,
      dashboard: {
        today: todayRow || { total_assessments: 0, completed: 0, in_progress: 0, failed: 0 },
        perGate: gateStats?.results || [],
        recentAssessments: recentAssessments?.results || [],
        verdictDistribution: verdictDistribution?.results || [],
        queueDepth: queueDepth?.results || [],
        avgPipelineDurationSeconds: avgDuration?.avg_duration_seconds || 0,
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[dashboard:api] Failed to fetch dashboard data:', err);
    return json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Dashboard query failed'
      },
      { status: 500 }
    );
  }
}
